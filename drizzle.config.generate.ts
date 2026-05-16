import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/esquema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./local.db",
  },
});
