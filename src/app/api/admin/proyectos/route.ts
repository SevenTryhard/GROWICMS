export const runtime = "edge";

import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generarUuid } from "@/lib/crypto";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoAdmin } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const crearProyectoSchema = z.object({
  nombre: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras minusculas, numeros y guiones"),
  descripcion: z.string().max(2000).optional(),
  moneda: z.string().min(1).max(10).default("USD"),
  configAtributos: z.record(z.unknown()).default({}),
  configuracion: z.record(z.unknown()).default({}),
});

export async function GET(request: Request) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  const esAdmin = await verificarAccesoAdmin(usuarioId);
  if (!esAdmin) {
    return respuestaError("Acceso denegado", 403);
  }

  try {
    const db = obtenerDb();
    const proyectos = await db.select().from(tablas.proyectos).all();
    return respuestaExito(proyectos);
  } catch (error) {
    console.error("Error listando proyectos:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}

export async function POST(request: Request) {
  const usuarioId = await obtenerUsuario(request);
  if (!usuarioId) {
    return respuestaError("No autenticado", 401);
  }

  const esAdmin = await verificarAccesoAdmin(usuarioId);
  if (!esAdmin) {
    return respuestaError("Acceso denegado", 403);
  }

  try {
    const body = await request.json();
    const resultado = crearProyectoSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;
    const db = obtenerDb();

    // Verificar slug unico
    const existente = await db
      .select({ id: tablas.proyectos.id })
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.slug, datos.slug))
      .get();

    if (existente) {
      return respuestaError("Ya existe un proyecto con ese slug", 409);
    }

    const proyectoId = generarUuid();
    const ahora = new Date();

    await db.insert(tablas.proyectos).values({
      id: proyectoId,
      nombre: datos.nombre,
      slug: datos.slug,
      descripcion: datos.descripcion || null,
      moneda: datos.moneda,
      configAtributos: datos.configAtributos,
      configuracion: datos.configuracion,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    const proyecto = await db
      .select()
      .from(tablas.proyectos)
      .where(eq(tablas.proyectos.id, proyectoId))
      .get();

    return respuestaExito(proyecto, 201);
  } catch (error) {
    console.error("Error creando proyecto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
