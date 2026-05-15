import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function obtenerClaveSecreta(): Uint8Array {
  const secret = process.env.JWT_CLAVE_SECRETA;
  if (!secret) throw new Error("JWT_CLAVE_SECRETA no configurada");
  return new TextEncoder().encode(secret);
}

const RUTAS_PUBLICAS = ["/", "/iniciar-sesion", "/verificar", "/completar-perfil", "/api/auth"];

function extraerProyectoId(request: NextRequest): string | null {
  // 1. Subdominio: proyecto.growicms.workers.dev
  const host = request.headers.get("host") || "";
  const partes = host.split(".");
  if (partes.length > 2 && partes[0] !== "www") {
    return partes[0];
  }

  // 2. Path param: /api/[proyecto]/...
  const pathname = request.nextUrl.pathname;
  const matchApi = pathname.match(/^\/api\/([^\/]+)/);
  if (matchApi) {
    const posible = matchApi[1];
    if (posible && posible !== "auth" && posible !== "admin") {
      return posible;
    }
  }

  // 3. Cookie proyecto_id
  const cookieProyecto = request.cookies.get("proyecto_id")?.value;
  if (cookieProyecto) return cookieProyecto;

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extraer proyecto y agregar header
  const proyectoId = extraerProyectoId(request);
  const requestHeaders = new Headers(request.headers);
  if (proyectoId) {
    requestHeaders.set("x-proyecto-id", proyectoId);
  }

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/api/admin/")) {
    const token = request.cookies.get("growicms_sesion")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    try {
      await jwtVerify(token, obtenerClaveSecreta());
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json({ error: "Sesion expirada" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("growicms_sesion")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    try {
      await jwtVerify(token, obtenerClaveSecreta());
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json({ error: "Sesion expirada" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".") || pathname.startsWith("/g-icon")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => pathname === ruta || pathname.startsWith(ruta));
  if (esRutaPublica) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = request.cookies.get("growicms_sesion")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/iniciar-sesion", request.url));
  }

  try {
    await jwtVerify(token, obtenerClaveSecreta());
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    const response = NextResponse.redirect(new URL("/iniciar-sesion", request.url));
    response.cookies.delete("growicms_sesion");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|g-icon.svg).*)"],
};
