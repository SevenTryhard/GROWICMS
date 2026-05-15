export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import { generarUuid } from "@/lib/crypto";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const crearVarianteSchema = z.object({
  atributos: z.record(z.unknown()).default({}),
  precioExtra: z.number().int().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  skuVariante: z.string().max(100).optional(),
  activo: z.boolean().default(true),
});

const actualizarVarianteSchema = z.object({
  atributos: z.record(z.unknown()).optional(),
  precioExtra: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  skuVariante: z.string().max(100).optional().nullable(),
  activo: z.boolean().optional(),
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
    const { proyecto: proyectoSlug, id: productoId } = await params;
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

    // Verificar que el producto pertenece al proyecto
    const producto = await db
      .select({ id: tablas.productos.id })
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, productoId),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!producto) {
      return respuestaError("Producto no encontrado", 404);
    }

    const variantes = await db
      .select()
      .from(tablas.variantes)
      .where(eq(tablas.variantes.productoId, productoId))
      .orderBy(asc(tablas.variantes.id))
      .all();

    return respuestaExito(variantes);
  } catch (error) {
    console.error("Error listando variantes:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proyecto: string; id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  try {
    const { proyecto: proyectoSlug, id: productoId } = await params;
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

    // Verificar que el producto pertenece al proyecto
    const producto = await db
      .select({ id: tablas.productos.id })
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, productoId),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!producto) {
      return respuestaError("Producto no encontrado", 404);
    }

    const body = await request.json();
    const resultado = crearVarianteSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;
    const varianteId = generarUuid();

    await db.insert(tablas.variantes).values({
      id: varianteId,
      productoId,
      atributos: datos.atributos,
      precioExtra: datos.precioExtra,
      stock: datos.stock,
      skuVariante: datos.skuVariante || null,
      activo: datos.activo,
    });

    const variante = await db
      .select()
      .from(tablas.variantes)
      .where(eq(tablas.variantes.id, varianteId))
      .get();

    return respuestaExito(variante, 201);
  } catch (error) {
    console.error("Error creando variante:", error);
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
    const { proyecto: proyectoSlug, id: varianteId } = await params;
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
    const resultado = actualizarVarianteSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;

    // Verificar que la variante existe y pertenece al proyecto
    const varianteExistente = await db
      .select({ productoId: tablas.variantes.productoId })
      .from(tablas.variantes)
      .where(eq(tablas.variantes.id, varianteId))
      .get();

    if (!varianteExistente) {
      return respuestaError("Variante no encontrada", 404);
    }

    // Verificar que el producto pertenece al proyecto
    const producto = await db
      .select({ id: tablas.productos.id })
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, varianteExistente.productoId),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!producto) {
      return respuestaError("Producto no encontrado", 404);
    }

    const valoresActualizar: Record<string, unknown> = {};

    if (datos.atributos !== undefined) valoresActualizar.atributos = datos.atributos;
    if (datos.precioExtra !== undefined) valoresActualizar.precioExtra = datos.precioExtra;
    if (datos.stock !== undefined) valoresActualizar.stock = datos.stock;
    if (datos.skuVariante !== undefined) valoresActualizar.skuVariante = datos.skuVariante;
    if (datos.activo !== undefined) valoresActualizar.activo = datos.activo;

    await db
      .update(tablas.variantes)
      .set(valoresActualizar)
      .where(eq(tablas.variantes.id, varianteId));

    const variante = await db
      .select()
      .from(tablas.variantes)
      .where(eq(tablas.variantes.id, varianteId))
      .get();

    return respuestaExito(variante);
  } catch (error) {
    console.error("Error actualizando variante:", error);
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
    const { proyecto: proyectoSlug, id: varianteId } = await params;
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

    // Verificar que la variante existe y pertenece al proyecto
    const varianteExistente = await db
      .select({ productoId: tablas.variantes.productoId })
      .from(tablas.variantes)
      .where(eq(tablas.variantes.id, varianteId))
      .get();

    if (!varianteExistente) {
      return respuestaError("Variante no encontrada", 404);
    }

    const producto = await db
      .select({ id: tablas.productos.id })
      .from(tablas.productos)
      .where(
        and(
          eq(tablas.productos.id, varianteExistente.productoId),
          eq(tablas.productos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!producto) {
      return respuestaError("Producto no encontrado", 404);
    }

    // Soft delete: desactivar
    await db
      .update(tablas.variantes)
      .set({ activo: false })
      .where(eq(tablas.variantes.id, varianteId));

    return respuestaExito({ mensaje: "Variante desactivada exitosamente" });
  } catch (error) {
    console.error("Error eliminando variante:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
