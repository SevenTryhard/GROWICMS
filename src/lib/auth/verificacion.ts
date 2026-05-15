import { SignJWT, jwtVerify } from "jose";

function obtenerClaveVerificacion(): Uint8Array {
  const secret = process.env.JWT_CLAVE_SECRETA;
  if (!secret) throw new Error("JWT_CLAVE_SECRETA no configurada");
  return new TextEncoder().encode(secret);
}

export async function crearTokenVerificacion(telefono: string, codigo: string): Promise<string> {
  return new SignJWT({ telefono, codigo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(obtenerClaveVerificacion());
}

export async function verificarTokenVerificacion(token: string, codigoIngresado: string) {
  try {
    const { payload } = await jwtVerify(token, obtenerClaveVerificacion());
    const datos = payload as { telefono: string; codigo: string };
    return datos.codigo === codigoIngresado ? datos : null;
  } catch {
    return null;
  }
}
