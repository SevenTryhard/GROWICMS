export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const actualizarCategoriaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras minusculas, numeros y guiones")
    .optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  parentId: z.string().optional().nullable(),
  orden: z.number().int().min(0).optional(),
  imagen: z.string().optional().nullable(),
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
      "categorias:leer"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const categoria = await db
      .select()
      .from(tablas.categorias)
      .where(
        and(
          eq(tablas.categorias.id, id),
          eq(tablas.categorias.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!categoria) {
      return respuestaError("Categoria no encontrada", 404);
    }

    return respuestaExito(categoria);
  } catch (error) {
    console.error("Error obteniendo categoria:", error);
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
      "categorias:editar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = actualizarCategoriaSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;

    // Verificar que la categoria existe y pertenece al proyecto
    const existente = await db
      .select()
      .from(tablas.categorias)
      .where(
        and(
          eq(tablas.categorias.id, id),
          eq(tablas.categorias.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!existente) {
      return respuestaError("Categoria no encontrada", 404);
    }

    // Verificar slug unico si se actualiza
    if (datos.slug) {
      const slugExistente = await db
        .select({ id: tablas.categorias.id })
        .from(tablas.categorias)
        .where(
          and(
            eq(tablas.categorias.proyectoId, proyecto.id),
            eq(tablas.categorias.slug, datos.slug)
          )
        )
        .get();

      if (slugExistente && slugExistente.id !== id) {
        return respuestaError("Ya existe una categoria con ese slug", 409);
      }
    }

    // Verificar parentId
    if (datos.parentId) {
      const parent = await db
        .select({ id: tablas.categorias.id })
        .from(tablas.categorias)
        .where(
          and(
            eq(tablas.categorias.id, datos.parentId),
            eq(tablas.categorias.proyectoId, proyecto.id)
          )
        )
        .get();

      if (!parent) {
        return respuestaError("Categoria padre no encontrada", 400);
      }

      // Evitar que una categoria sea su propio padre
      if (datos.parentId === id) {
        return respuestaError("Una categoria no puede ser su propio padre", 400);
      }
    }

    const valoresActualizar: Record<string, unknown> = {
      actualizadoEn: new Date(),
    };

    if (datos.nombre !== undefined) valoresActualizar.nombre = datos.nombre;
    if (datos.slug !== undefined) valoresActualizar.slug = datos.slug;
    if (datos.descripcion !== undefined) valoresActualizar.descripcion = datos.descripcion;
    if (datos.parentId !== undefined) valoresActualizar.parentId = datos.parentId;
    if (datos.orden !== undefined) valoresActualizar.orden = datos.orden;
    if (datos.imagen !== undefined) valoresActualizar.imagen = datos.imagen;
    if (datos.activo !== undefined) valoresActualizar.activo = datos.activo;

    await db.update(tablas.categorias).set(valoresActualizar).where(eq(tablas.categorias.id, id));

    const categoria = await db
      .select()
      .from(tablas.categorias)
      .where(eq(tablas.categorias.id, id))
      .get();

    return respuestaExito(categoria);
  } catch (error) {
    console.error("Error actualizando categoria:", error);
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
      "categorias:eliminar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const existente = await db
      .select({ id: tablas.categorias.id })
      .from(tablas.categorias)
      .where(
        and(
          eq(tablas.categorias.id, id),
          eq(tablas.categorias.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!existente) {
      return respuestaError("Categoria no encontrada", 404);
    }

    await db.delete(tablas.categorias).where(eq(tablas.categorias.id, id));

    return respuestaExito({ mensaje: "Categoria eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando categoria:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
