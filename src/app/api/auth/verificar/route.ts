export const runtime = 'edge';

import { NextResponse } from "next/server";
import { obtenerDb } from "@/lib/db";
import { tablas } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verificarTokenVerificacion } from "@/lib/auth/verificacion";
import { crearToken, establecerCookieSesion } from "@/lib/auth/sesion";
import { generarUuid } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const { telefono, codigo, tokenVerificacion, nombre }: {
      telefono: string;
      codigo: string;
      tokenVerificacion: string;
      nombre?: string;
    } = await request.json();

    if (!telefono || !codigo || !tokenVerificacion) {
      return NextResponse.json({ error: "Telefono, codigo y token son requeridos" }, { status: 400 });
    }

    const datosVerificacion = await verificarTokenVerificacion(tokenVerificacion, codigo);

    if (!datosVerificacion) {
      return NextResponse.json({ error: "Codigo invalido o expirado" }, { status: 401 });
    }

    if (datosVerificacion.telefono !== telefono) {
      return NextResponse.json({ error: "Telefono no coincide" }, { status: 401 });
    }

    const db = obtenerDb();

    let usuario = await db.select().from(tablas.usuarios).where(eq(tablas.usuarios.telefono, telefono)).get();

    if (!usuario) {
      // Nuevo usuario
      const usuarioId = generarUuid();
      await db.insert(tablas.usuarios).values({
        id: usuarioId,
        telefono,
        nombre: nombre || null,
      }).run();

      usuario = await db.select().from(tablas.usuarios).where(eq(tablas.usuarios.id, usuarioId)).get();
    }

    if (!usuario) {
      return NextResponse.json({ error: "Error al crear/obtener usuario" }, { status: 500 });
    }

    const tokenSesion = await crearToken(usuario.id);
    await establecerCookieSesion(tokenSesion);

    return NextResponse.json({
      mensaje: "Verificacion exitosa",
      usuarioId: usuario.id,
      nombre: usuario.nombre,
    });
  } catch (error) {
    console.error("Error en verificacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
