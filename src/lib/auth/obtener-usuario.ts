import { cookies } from "next/headers";
import { jwtVerify } from "jose";

function obtenerClaveSecreta(): Uint8Array {
  const secret = process.env.JWT_CLAVE_SECRETA;
  if (!secret) throw new Error("JWT_CLAVE_SECRETA no configurada");
  return new TextEncoder().encode(secret);
}

export async function obtenerUsuarioActualId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("growicms_sesion")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, obtenerClaveSecreta());
    return (payload as { usuarioId: string }).usuarioId;
  } catch {
    return null;
  }
}

export async function obtenerUsuario(request: Request): Promise<string | null> {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)growicms_sesion=([^;]+)/);
    const token = match?.[1];
    if (!token) return null;

    const { payload } = await jwtVerify(token, obtenerClaveSecreta());
    return (payload as { usuarioId: string }).usuarioId;
  } catch {
    return null;
  }
}
