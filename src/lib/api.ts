import { NextResponse } from "next/server";

export function respuestaError(
  mensaje: string,
  status: number = 400,
  detalles?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: mensaje, ...(detalles || {}) },
    { status }
  );
}

export function respuestaExito<T>(
  datos: T,
  status: number = 200,
  meta?: Record<string, unknown>
) {
  return NextResponse.json(
    { data: datos, ...(meta || {}) },
    { status }
  );
}
