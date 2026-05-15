export const runtime = 'edge';

import { NextResponse } from "next/server";
import { obtenerDb } from "@/lib/db";
import { tablas } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generarCodigo } from "@/lib/auth/verificacion-codigo";
import { crearTokenVerificacion } from "@/lib/auth/verificacion";

export async function POST(request: Request) {
  try {
    const { telefono }: { telefono: string } = await request.json();

    if (!telefono) {
      return NextResponse.json({ error: "Telefono es requerido" }, { status: 400 });
    }

    const TELEFONO_REGEX = /^\+[1-9]\d{6,14}$/;
    if (!TELEFONO_REGEX.test(telefono)) {
      return NextResponse.json({ error: "Formato de telefono invalido" }, { status: 400 });
    }

    const db = obtenerDb();

    const usuario = await db.select().from(tablas.usuarios).where(eq(tablas.usuarios.telefono, telefono)).get();

    if (!usuario) {
      return NextResponse.json({ error: "No existe una cuenta con este telefono. Registrate primero." }, { status: 404 });
    }

    const codigo = generarCodigo();
    const tokenVerificacion = await crearTokenVerificacion(telefono, codigo);

    console.log(`[GROWICMS] Codigo de verificacion para ${telefono}: ${codigo}`);

    const respuesta: Record<string, unknown> = {
      mensaje: "Codigo enviado exitosamente",
      tokenVerificacion,
    };

    if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_CUENTA_SID) {
      respuesta.codigoDev = codigo;
    }
    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
