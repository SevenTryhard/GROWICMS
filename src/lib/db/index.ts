import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./esquema";

export const tablas = schema;

export type BaseDeDatos = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: BaseDeDatos | null = null;

export function obtenerDb(): BaseDeDatos {
  if (dbInstance) {
    return dbInstance;
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL no está definida en las variables de entorno."
    );
  }

  const client = createClient({
    url,
    authToken,
  });

  const db = drizzle(client, { schema });
  dbInstance = db;
  return db;
}
