export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const tiposAtributo = ["texto", "select", "multiselect", "numero", "booleano", "color", "medida"] as const;

const actualizarAtributoSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  tipo: z.enum(tiposAtributo).optional(),
  opciones: z.array(z.string()).optional(),
  requerido: z.boolean().optional(),
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
      "atributos:leer"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const atributo = await db
      .select()
      .from(tablas.atributos)
      .where(
        and(
          eq(tablas.atributos.id, id),
          eq(tablas.atributos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!atributo) {
      return respuestaError("Atributo no encontrado", 404);
    }

    return respuestaExito(atributo);
  } catch (error) {
    console.error("Error obteniendo atributo:", error);
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
      "atributos:editar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = actualizarAtributoSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;

    const existente = await db
      .select({ id: tablas.atributos.id })
      .from(tablas.atributos)
      .where(
        and(
          eq(tablas.atributos.id, id),
          eq(tablas.atributos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!existente) {
      return respuestaError("Atributo no encontrado", 404);
    }

    const valoresActualizar: Record<string, unknown> = {};

    if (datos.nombre !== undefined) valoresActualizar.nombre = datos.nombre;
    if (datos.tipo !== undefined) valoresActualizar.tipo = datos.tipo;
    if (datos.opciones !== undefined) valoresActualizar.opciones = datos.opciones;
    if (datos.requerido !== undefined) valoresActualizar.requerido = datos.requerido;

    await db.update(tablas.atributos).set(valoresActualizar).where(eq(tablas.atributos.id, id));

    const atributo = await db
      .select()
      .from(tablas.atributos)
      .where(eq(tablas.atributos.id, id))
      .get();

    return respuestaExito(atributo);
  } catch (error) {
    console.error("Error actualizando atributo:", error);
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
      "atributos:eliminar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const existente = await db
      .select({ id: tablas.atributos.id })
      .from(tablas.atributos)
      .where(
        and(
          eq(tablas.atributos.id, id),
          eq(tablas.atributos.proyectoId, proyecto.id)
        )
      )
      .get();

    if (!existente) {
      return respuestaError("Atributo no encontrado", 404);
    }

    await db.delete(tablas.atributos).where(eq(tablas.atributos.id, id));

    return respuestaExito({ mensaje: "Atributo eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando atributo:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
