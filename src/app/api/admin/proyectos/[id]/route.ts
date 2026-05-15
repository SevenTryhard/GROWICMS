export const runtime = "edge";

import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq } from "drizzle-orm";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoAdmin } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const actualizarProyectoSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras minusculas, numeros y guiones")
    .optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  moneda: z.string().min(1).max(10).optional(),
  configAtributos: z.record(z.unknown()).optional(),
  configuracion: z.record(z.unknown()).optional(),
  activo: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  const esAdmin = await verificarAccesoAdmin(usuarioId);
  if (!esAdmin) {
    return respuestaError("Acceso denegado", 403);
  }

  try {
    const { id } = await params;
    const db = obtenerDb();
    const proyecto = await db
      .select()
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.id, id))
      .get();

    if (!proyecto) {
      return respuestaError("Proyecto no encontrado", 404);
    }

    return respuestaExito(proyecto);
  } catch (error) {
    console.error("Error obteniendo proyecto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  const esAdmin = await verificarAccesoAdmin(usuarioId);
  if (!esAdmin) {
    return respuestaError("Acceso denegado", 403);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const resultado = actualizarProyectoSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;
    const db = obtenerDb();

    // Verificar que el proyecto existe
    const existente = await db
      .select({ id: tablas.proyectos.id })
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.id, id))
      .get();

    if (!existente) {
      return respuestaError("Proyecto no encontrado", 404);
    }

    // Si se actualiza el slug, verificar que no exista otro con ese slug
    if (datos.slug) {
      const slugExistente = await db
        .select({ id: tablas.proyectos.id })
        .from(tablas.proyectos)
        .where(eq(tablas.proyectos.slug, datos.slug))
        .get();

      if (slugExistente && slugExistente.id !== id) {
        return respuestaError("Ya existe un proyecto con ese slug", 409);
      }
    }

    const valoresActualizar: Record<string, unknown> = {
      actualizadoEn: new Date(),
    };

    if (datos.nombre !== undefined) valoresActualizar.nombre = datos.nombre;
    if (datos.slug !== undefined) valoresActualizar.slug = datos.slug;
    if (datos.descripcion !== undefined) valoresActualizar.descripcion = datos.descripcion;
    if (datos.moneda !== undefined) valoresActualizar.moneda = datos.moneda;
    if (datos.configAtributos !== undefined) valoresActualizar.configAtributos = datos.configAtributos;
    if (datos.configuracion !== undefined) valoresActualizar.configuracion = datos.configuracion;
    if (datos.activo !== undefined) valoresActualizar.activo = datos.activo;

    await db.update(tablas.proyectos).set(valoresActualizar).where(eq(tablas.proyectos.id, id));

    const proyecto = await db
      .select()
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.id, id))
      .get();

    return respuestaExito(proyecto);
  } catch (error) {
    console.error("Error actualizando proyecto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  const esAdmin = await verificarAccesoAdmin(usuarioId);
  if (!esAdmin) {
    return respuestaError("Acceso denegado", 403);
  }

  try {
    const { id } = await params;
    const db = obtenerDb();

    const existente = await db
      .select({ id: tablas.proyectos.id })
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.id, id))
      .get();

    if (!existente) {
      return respuestaError("Proyecto no encontrado", 404);
    }

    await db.delete(tablas.proyectos).where(eq(tablas.proyectos.id, id));

    return respuestaExito({ mensaje: "Proyecto eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando proyecto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
