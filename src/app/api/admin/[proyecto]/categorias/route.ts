export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import { generarUuid } from "@/lib/crypto";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const crearCategoriaSchema = z.object({
  nombre: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras minusculas, numeros y guiones"),
  descripcion: z.string().max(2000).optional(),
  parentId: z.string().optional().nullable(),
  orden: z.number().int().min(0).default(0),
  imagen: z.string().optional(),
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

    // Buscar proyecto por slug
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

    const categorias = await db
      .select()
      .from(tablas.categorias)
      .where(eq(tablas.categorias.proyectoId, proyecto.id))
      .orderBy(asc(tablas.categorias.orden), asc(tablas.categorias.nombre))
      .all();

    return respuestaExito(categorias);
  } catch (error) {
    console.error("Error listando categorias:", error);
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
      "categorias:crear"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = crearCategoriaSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;

    // Verificar slug unico dentro del proyecto
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

    if (slugExistente) {
      return respuestaError("Ya existe una categoria con ese slug en este proyecto", 409);
    }

    // Si hay parentId, verificar que exista y pertenezca al proyecto
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
    }

    const categoriaId = generarUuid();
    const ahora = new Date();

    await db.insert(tablas.categorias).values({
      id: categoriaId,
      proyectoId: proyecto.id,
      nombre: datos.nombre,
      slug: datos.slug,
      descripcion: datos.descripcion || null,
      parentId: datos.parentId || null,
      orden: datos.orden,
      imagen: datos.imagen || null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    const categoria = await db
      .select()
      .from(tablas.categorias)
      .where(eq(tablas.categorias.id, categoriaId))
      .get();

    return respuestaExito(categoria, 201);
  } catch (error) {
    console.error("Error creando categoria:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
