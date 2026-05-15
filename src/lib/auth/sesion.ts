import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function obtenerClaveSecreta(): Uint8Array {
  const secret = process.env.JWT_CLAVE_SECRETA;
  if (!secret) throw new Error("JWT_CLAVE_SECRETA no configurada");
  return new TextEncoder().encode(secret);
}

export async function crearToken(usuarioId: string): Promise<string> {
  const token = await new SignJWT({ usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(obtenerClaveSecreta());
  return token;
}

export async function verificarToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, obtenerClaveSecreta());
    return payload as { usuarioId: string };
  } catch {
    return null;
  }
}

export async function obtenerSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get("growicms_sesion")?.value;
  if (!token) return null;
  return verificarToken(token);
}

export async function establecerCookieSesion(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("growicms_sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function eliminarCookieSesion() {
  const cookieStore = await cookies();
  cookieStore.delete("growicms_sesion");
}
