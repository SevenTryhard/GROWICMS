import * as esquemaModulo from "./esquema";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const tablas = esquemaModulo;

export type BaseDeDatosD1 = ReturnType<typeof drizzleD1>;
export type BaseDeDatos = BaseDeDatosD1;

let dbInstance: BaseDeDatos | null = null;

declare global {
  var __GROWICMS_DB: BaseDeDatos | undefined;
}

function obtenerD1Binding(): D1Database | undefined {
  try {
    const ctx = getRequestContext();
    if (ctx?.env?.DB) {
      return ctx.env.DB;
    }
    console.error("[GROWICMS DB] getRequestContext returned but no DB binding:", ctx ? "ctx exists, keys: " + Object.keys(ctx.env || {}).join(",") : "no ctx");
    return undefined;
  } catch (e) {
    console.error("[GROWICMS DB] getRequestContext failed:", e instanceof Error ? e.message : String(e));
    return undefined;
  }
}

export function obtenerDb(): BaseDeDatos {
  if (typeof globalThis !== "undefined" && globalThis.__GROWICMS_DB) {
    return globalThis.__GROWICMS_DB;
  }

  if (dbInstance) {
    return dbInstance;
  }

  const d1Binding = obtenerD1Binding();
  if (d1Binding) {
    const db = drizzleD1(d1Binding, { schema: esquemaModulo });
    establecerDb(db);
    return db;
  }

  throw new Error(
    "Base de datos no disponible. D1 binding no encontrado en el entorno de Cloudflare."
  );
}

export function establecerDb(db: BaseDeDatos) {
  if (typeof globalThis !== "undefined") {
    globalThis.__GROWICMS_DB = db;
  }
  dbInstance = db;
}
