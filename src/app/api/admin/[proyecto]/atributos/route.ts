export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { generarUuid } from "@/lib/crypto";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const tiposAtributo = ["texto", "select", "multiselect", "numero", "booleano", "color", "medida"] as const;

const crearAtributoSchema = z.object({
  nombre: z.string().min(1).max(200),
  tipo: z.enum(tiposAtributo),
  opciones: z.array(z.string()).default([]),
  requerido: z.boolean().default(false),
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
      "atributos:leer"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const atributos = await db
      .select()
      .from(tablas.atributos)
      .where(eq(tablas.atributos.proyectoId, proyecto.id))
      .orderBy(asc(tablas.atributos.nombre))
      .all();

    return respuestaExito(atributos);
  } catch (error) {
    console.error("Error listando atributos:", error);
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
      "atributos:crear"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = crearAtributoSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;
    const atributoId = generarUuid();
    const ahora = new Date();

    await db.insert(tablas.atributos).values({
      id: atributoId,
      proyectoId: proyecto.id,
      nombre: datos.nombre,
      tipo: datos.tipo,
      opciones: datos.opciones,
      requerido: datos.requerido,
      creadoEn: ahora,
    });

    const atributo = await db
      .select()
      .from(tablas.atributos)
      .where(eq(tablas.atributos.id, atributoId))
      .get();

    return respuestaExito(atributo, 201);
  } catch (error) {
    console.error("Error creando atributo:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
