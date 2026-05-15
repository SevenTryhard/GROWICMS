export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const actualizarProductoSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras minusculas, numeros y guiones").optional(),
  descripcion: z.string().max(5000).optional().nullable(),
  precio: z.number().int().min(0).optional(),
  precioPromo: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional().nullable(),
  peso: z.number().int().min(0).optional().nullable(),
  dimensiones: z.string().max(200).optional().nullable(),
  activo: z.boolean().optional(),
  categoriaIds: z.array(z.string()).optional(),
  atributos: z.record(z.unknown()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proyecto: string; id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  try {
    const { proyecto: proyectoSlug, id } = await params;
    const db = obtenerDb();

    const proyecto = await db
      .select({ id: tablas.proyectos.id })
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.slug, proyectoSlug))
      .get();

    if (!proyecto) {
      return respuestaError("Proyecto no encontrado", 404);
    }

    const { autorizado } = await verificarAccesoProyecto(
      usuarioId,
      proyecto.id,
      "productos:leer"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const producto = await db
      .select()
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, id),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!producto) {
      return respuestaError("Producto no encontrado", 404);
    }

    // Cargar relaciones
    const categorias = await db
      .select({
        id: tablas.categorias.id,
        nombre: tablas.categorias.nombre,
        slug: tablas.categorias.slug,
      })
      .from(tablas.categorias)
      .innerJoin(
        tablas.productoCategorias,
        eq(tablas.categorias.id, tablas.productoCategorias.categoriaId)
      )
      .where(eq(tablas.productoCategorias.productoId, id))
      .all();

    const imagenes = await db
      .select()
      .from(tablas.imagenes)
      .where(eq(tablas.imagenes.productoId, id))
      .orderBy(asc(tablas.imagenes.orden))
      .all();

    const variantes = await db
      .select()
      .from(tablas.variantes)
      .where(eq(tablas.variantes.productoId, id))
      .orderBy(asc(tablas.variantes.id))
      .all();

    return respuestaExito({
      ...producto,
      categorias,
      imagenes,
      variantes,
    });
  } catch (error) {
    console.error("Error obteniendo producto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ proyecto: string; id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  try {
    const { proyecto: proyectoSlug, id } = await params;
    const db = obtenerDb();

    const proyecto = await db
      .select({ id: tablas.proyectos.id })
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.slug, proyectoSlug))
      .get();

    if (!proyecto) {
      return respuestaError("Proyecto no encontrado", 404);
    }

    const { autorizado } = await verificarAccesoProyecto(
      usuarioId,
      proyecto.id,
      "productos:editar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = actualizarProductoSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;

    // Verificar que el producto existe y pertenece al proyecto
    const existente = await db
      .select()
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, id),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!existente) {
      return respuestaError("Producto no encontrado", 404);
    }

    // Verificar slug unico si se actualiza
    if (datos.slug) {
      const slugExistente = await db
        .select({ id: tablas.productos.id })
        .from(tablas.productos)
        .where(
          and(
            eq(tablas.productos.proyectoId, proyecto.id),
            eq(tablas.productos.slug, datos.slug)
          )
        )
        .get();

      if (slugExistente && slugExistente.id !== id) {
        return respuestaError("Ya existe un producto con ese slug", 409);
      }
    }

    const valoresActualizar: Record<string, unknown> = {
      actualizadoEn: new Date(),
    };

    if (datos.nombre !== undefined) valoresActualizar.nombre = datos.nombre;
    if (datos.slug !== undefined) valoresActualizar.slug = datos.slug;
    if (datos.descripcion !== undefined) valoresActualizar.descripcion = datos.descripcion;
    if (datos.precio !== undefined) valoresActualizar.precio = datos.precio;
    if (datos.precioPromo !== undefined) valoresActualizar.precioPromo = datos.precioPromo;
    if (datos.stock !== undefined) valoresActualizar.stock = datos.stock;
    if (datos.sku !== undefined) valoresActualizar.sku = datos.sku;
    if (datos.peso !== undefined) valoresActualizar.peso = datos.peso;
    if (datos.dimensiones !== undefined) valoresActualizar.dimensiones = datos.dimensiones;
    if (datos.activo !== undefined) valoresActualizar.activo = datos.activo;

    await db.update(tablas.productos).set(valoresActualizar).where(eq(tablas.productos.id, id));

    // Actualizar categorias si se envian
    if (datos.categoriaIds !== undefined) {
      // Eliminar categorias existentes
      await db
        .delete(tablas.productoCategorias)
        .where(eq(tablas.productoCategorias.productoId, id));

      // Insertar nuevas
      if (datos.categoriaIds.length > 0) {
        const { generarUuid } = await import("@/lib/crypto");
        await db.insert(tablas.productoCategorias).values(
          datos.categoriaIds.map((categoriaId) => ({
            id: generarUuid(),
            productoId: id,
            categoriaId,
          }))
        );
      }
    }

    // Recargar producto con relaciones
    const producto = await db
      .select()
      .from(tablas.productos)
      .where(eq(tablas.productos.id, id))
      .get();

    const categorias = await db
      .select({ id: tablas.categorias.id, nombre: tablas.categorias.nombre })
      .from(tablas.categorias)
      .innerJoin(
        tablas.productoCategorias,
        eq(tablas.categorias.id, tablas.productoCategorias.categoriaId)
      )
      .where(eq(tablas.productoCategorias.productoId, id))
      .all();

    return respuestaExito({ ...producto, categorias });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ proyecto: string; id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  try {
    const { proyecto: proyectoSlug, id } = await params;
    const db = obtenerDb();

    const proyecto = await db
      .select({ id: tablas.proyectos.id })
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.slug, proyectoSlug))
      .get();

    if (!proyecto) {
      return respuestaError("Proyecto no encontrado", 404);
    }

    const { autorizado } = await verificarAccesoProyecto(
      usuarioId,
      proyecto.id,
      "productos:eliminar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const existente = await db
      .select({ id: tablas.productos.id })
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, id),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!existente) {
      return respuestaError("Producto no encontrado", 404);
    }

    // Soft delete: cambiar activo a false
    await db
      .update(tablas.productos)
      .set({ activo: false, actualizadoEn: new Date() })
      .where(eq(tablas.productos.id, id));

    return respuestaExito({ mensaje: "Producto desactivado exitosamente" });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
