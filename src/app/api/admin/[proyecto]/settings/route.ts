export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { generarUuid } from "@/lib/crypto";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const crearSettingSchema = z.object({
  clave: z.string().min(1).max(200),
  valor: z.unknown(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proyecto: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  try {
    const { proyecto: proyectoSlug } = await params;
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
      "settings:leer"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const settings = await db
      .select()
      .from(tablas.settings)
      .where(eq(tablas.settings.proyectoId, proyecto.id))
      .all();

    return respuestaExito(settings);
  } catch (error) {
    console.error("Error listando settings:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proyecto: string }> }
) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  try {
    const { proyecto: proyectoSlug } = await params;
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
      "settings:editar"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = crearSettingSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;
    const ahora = new Date();

    // Upsert: si existe, actualizar; si no, crear
    const existente = await db
      .select({ id: tablas.settings.id })
      .from(tablas.settings)
      .where(
        and(
          eq(tablas.settings.proyectoId, proyecto.id),
          eq(tablas.settings.clave, datos.clave)
        )
      )
      .get();

    if (existente) {
      await db
        .update(tablas.settings)
        .set({
          valor: datos.valor,
          actualizadoEn: ahora,
        })
        .where(eq(tablas.settings.id, existente.id));

      const setting = await db
        .select()
        .from(tablas.settings)
        .where(eq(tablas.settings.id, existente.id))
        .get();

      return respuestaExito(setting);
    }

    const settingId = generarUuid();
    await db.insert(tablas.settings).values({
      id: settingId,
      proyectoId: proyecto.id,
      clave: datos.clave,
      valor: datos.valor,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    const setting = await db
      .select()
      .from(tablas.settings)
      .where(eq(tablas.settings.id, settingId))
      .get();

    return respuestaExito(setting, 201);
  } catch (error) {
    console.error("Error creando/actualizando setting:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
