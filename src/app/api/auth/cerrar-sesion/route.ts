export const runtime = 'edge';

import { NextResponse } from "next/server";
import { eliminarCookieSesion } from "@/lib/auth/sesion";

export async function POST() {
  try {
    await eliminarCookieSesion();
    return NextResponse.json({ mensaje: "Sesion cerrada exitosamente" });
  } catch (error) {
    console.error("Error cerrando sesion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
