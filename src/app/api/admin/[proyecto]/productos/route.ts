export const runtime = "edge";

import { z } from "zod";
import { obtenerDb, tablas } from "@/lib/db";
import { eq, and, desc, asc, sql, like, gte, lte } from "drizzle-orm";
import { generarUuid } from "@/lib/crypto";
import { obtenerUsuario } from "@/lib/auth/obtener-usuario";
import { verificarAccesoProyecto } from "@/lib/auth/permisos";
import { respuestaError, respuestaExito } from "@/lib/api";

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

const crearProductoSchema = z.object({
  nombre: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras minusculas, numeros y guiones"),
  descripcion: z.string().max(5000).optional(),
  precio: z.number().int().min(0),
  precioPromo: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(100).optional(),
  peso: z.number().int().min(0).optional(),
  dimensiones: z.string().max(200).optional(),
  activo: z.boolean().default(true),
  categoriaIds: z.array(z.string()).default([]),
  atributos: z.record(z.unknown()).default({}),
});

function decodificarCursor(cursor: string | null): { id: string | null; creadoEn: string | null } {
  if (!cursor) return { id: null, creadoEn: null };
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
    return { id: decoded.id || null, creadoEn: decoded.creadoEn || null };
  } catch {
    return { id: null, creadoEn: null };
  }
}

function codificarCursor(id: string, creadoEn: string): string {
  return Buffer.from(JSON.stringify({ id, creadoEn })).toString("base64");
}

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
      "productos:leer"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    // Parse query params
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limite = Math.min(
      parseInt(url.searchParams.get("limite") || String(LIMITE_POR_DEFECTO), 10),
      LIMITE_MAXIMO
    );
    const categoriaId = url.searchParams.get("categoria");
    const busqueda = url.searchParams.get("busqueda");
    const precioMin = url.searchParams.get("precio_min");
    const precioMax = url.searchParams.get("precio_max");
    const stockMin = url.searchParams.get("stock_min");
    const soloActivos = url.searchParams.get("solo_activos") === "true";
    const ordenarPor = url.searchParams.get("ordenar") || "creadoEn";
    const direccion = url.searchParams.get("direccion") === "asc" ? "asc" : "desc";

    const condiciones = [eq(tablas.productos.proyectoId, proyecto.id)];

    if (categoriaId) {
      // Join con producto_categorias
      condiciones.push(eq(tablas.productoCategorias.categoriaId, categoriaId));
    }

    if (busqueda) {
      condiciones.push(like(tablas.productos.nombre, `%${busqueda}%`));
    }

    if (precioMin) {
      condiciones.push(gte(tablas.productos.precio, parseInt(precioMin, 10)));
    }

    if (precioMax) {
      condiciones.push(lte(tablas.productos.precio, parseInt(precioMax, 10)));
    }

    if (stockMin) {
      condiciones.push(gte(tablas.productos.stock, parseInt(stockMin, 10)));
    }

    if (soloActivos) {
      condiciones.push(eq(tablas.productos.activo, true));
    }

    // Cursor-based pagination
    const { id: cursorId, creadoEn: cursorCreadoEn } = decodificarCursor(cursor);

    if (cursorId && cursorCreadoEn) {
      if (direccion === "desc") {
        condiciones.push(
          sql`${tablas.productos.creadoEn} < ${cursorCreadoEn} OR (${tablas.productos.creadoEn} = ${cursorCreadoEn} AND ${tablas.productos.id} < ${cursorId})`
        );
      } else {
        condiciones.push(
          sql`${tablas.productos.creadoEn} > ${cursorCreadoEn} OR (${tablas.productos.creadoEn} = ${cursorCreadoEn} AND ${tablas.productos.id} > ${cursorId})`
        );
      }
    }

    // Construir query base
    let query = db
      .select({
        id: tablas.productos.id,
        nombre: tablas.productos.nombre,
        slug: tablas.productos.slug,
        descripcion: tablas.productos.descripcion,
        precio: tablas.productos.precio,
        precioPromo: tablas.productos.precioPromo,
        stock: tablas.productos.stock,
        sku: tablas.productos.sku,
        peso: tablas.productos.peso,
        dimensiones: tablas.productos.dimensiones,
        activo: tablas.productos.activo,
        creadoEn: tablas.productos.creadoEn,
        actualizadoEn: tablas.productos.actualizadoEn,
      })
      .from(tablas.productos);

    if (categoriaId) {
      query = query.innerJoin(
        tablas.productoCategorias,
        eq(tablas.productos.id, tablas.productoCategorias.productoId)
      ) as unknown as typeof query;
    }

    // Aplicar where
    const whereClause = and(...condiciones);
    // @ts-expect-error - Drizzle dynamic query typing
    query = query.where(whereClause);

    // Orden
    const ordenColumn =
      ordenarPor === "nombre"
        ? tablas.productos.nombre
        : ordenarPor === "precio"
          ? tablas.productos.precio
          : ordenarPor === "stock"
            ? tablas.productos.stock
            : tablas.productos.creadoEn;

    // @ts-expect-error - Drizzle dynamic query typing
    query = query.orderBy(
      direccion === "asc" ? asc(ordenColumn) : desc(ordenColumn),
      direccion === "asc" ? asc(tablas.productos.id) : desc(tablas.productos.id)
    );

    // Limit + 1 para has_more
    // @ts-expect-error - Drizzle dynamic query typing
    query = query.limit(limite + 1);

    const productos = await query.all();

    const hasMore = productos.length > limite;
    const productosPaginados = hasMore ? productos.slice(0, limite) : productos;

    const nextCursor = hasMore && productosPaginados.length > 0
      ? codificarCursor(
          productosPaginados[productosPaginados.length - 1].id,
          String(productosPaginados[productosPaginados.length - 1].creadoEn)
        )
      : null;

    // Obtener categorias e imagenes para cada producto
    const productosConRelaciones = await Promise.all(
      productosPaginados.map(async (producto) => {
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
          .where(eq(tablas.productoCategorias.productoId, producto.id))
          .all();

        const imagenes = await db
          .select({ url: tablas.imagenes.url, orden: tablas.imagenes.orden })
          .from(tablas.imagenes)
          .where(eq(tablas.imagenes.productoId, producto.id))
          .orderBy(asc(tablas.imagenes.orden))
          .all();

        return {
          ...producto,
          categorias,
          imagenThumbnail: imagenes[0]?.url || null,
          totalImagenes: imagenes.length,
        };
      })
    );

    // Total count (sin filtros de cursor)
    const condicionesCount = condiciones.filter((_, i) => i !== condiciones.length - 1 || !cursorId);
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tablas.productos)
      .where(and(...condicionesCount))
      .get();

    return respuestaExito(productosConRelaciones, 200, {
      total: countResult?.count || 0,
      next_cursor: nextCursor,
      has_more: hasMore,
      limite,
    });
  } catch (error) {
    console.error("Error listando productos:", error);
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
      "productos:crear"
    );

    if (!autorizado) {
      return respuestaError("Acceso denegado", 403);
    }

    const body = await request.json();
    const resultado = crearProductoSchema.safeParse(body);

    if (!resultado.success) {
      return respuestaError("Datos invalidos", 400, {
        errores: resultado.error.flatten().fieldErrors,
      });
    }

    const datos = resultado.data;

    // Verificar slug unico
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

    if (slugExistente) {
      return respuestaError("Ya existe un producto con ese slug en este proyecto", 409);
    }

    const productoId = generarUuid();
    const ahora = new Date();

    await db.insert(tablas.productos).values({
      id: productoId,
      proyectoId: proyecto.id,
      nombre: datos.nombre,
      slug: datos.slug,
      descripcion: datos.descripcion || null,
      precio: datos.precio,
      precioPromo: datos.precioPromo ?? null,
      stock: datos.stock,
      sku: datos.sku || null,
      peso: datos.peso ?? null,
      dimensiones: datos.dimensiones || null,
      activo: datos.activo,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    // Insertar categorias
    if (datos.categoriaIds.length > 0) {
      await db.insert(tablas.productoCategorias).values(
        datos.categoriaIds.map((categoriaId) => ({
          id: generarUuid(),
          productoId,
          categoriaId,
        }))
      );
    }

    const producto = await db
      .select()
      .from(tablas.productos)
      .where(eq(tablas.productos.id, productoId))
      .get();

    return respuestaExito(producto, 201);
  } catch (error) {
    console.error("Error creando producto:", error);
    return respuestaError("Error interno del servidor", 500);
  }
}
