export const runtime = 'edge';

import { NextResponse } from "next/server";
import { obtenerDb } from "@/lib/db";
import { tablas } from "@/lib/db";
import { eq } from "drizzle-orm";
import { obtenerUsuarioActualId } from "@/lib/auth/obtener-usuario";

export async function GET() {
  const usuarioId = await obtenerUsuarioActualId();
  if (!usuarioId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const db = obtenerDb();
    const usuario = await db.select().from(tablas.usuarios).where(eq(tablas.usuarios.id, usuarioId)).get();

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: usuario.id,
      telefono: usuario.telefono,
      nombre: usuario.nombre,
      email: usuario.email,
      avatar: usuario.avatar,
      creadoEn: usuario.creadoEn,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
