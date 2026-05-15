import { sqliteTable, text, integer, index, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const proyectos = sqliteTable("proyectos", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  slug: text("slug").notNull().unique(),
  descripcion: text("descripcion"),
  configAtributos: text("config_atributos", { mode: "json" }).$type<Record<string, unknown>>().$defaultFn(() => ({})).notNull(),
  configuracion: text("configuracion", { mode: "json" }).$type<Record<string, unknown>>().$defaultFn(() => ({})).notNull(),
  moneda: text("moneda").notNull().default("USD"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  telefono: text("telefono").notNull().unique(),
  nombre: text("nombre"),
  email: text("email").unique(),
  avatar: text("avatar"),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  permisos: text("permisos", { mode: "json" }).$type<string[]>().$defaultFn(() => []),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const usuarioRoles = sqliteTable("usuario_roles", {
  id: text("id").primaryKey(),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  rolId: text("rol_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  proyectoId: text("proyecto_id").references(() => proyectos.id, { onDelete: "cascade" }),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const categorias = sqliteTable("categorias", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").notNull().references(() => proyectos.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  slug: text("slug").notNull(),
  descripcion: text("descripcion"),
  parentId: text("parent_id").references((): AnySQLiteColumn => categorias.id),
  orden: integer("orden").notNull().default(0),
  imagen: text("imagen"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const productos = sqliteTable("productos", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").notNull().references(() => proyectos.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  slug: text("slug").notNull(),
  descripcion: text("descripcion"),
  precio: integer("precio").notNull(),
  precioPromo: integer("precio_promo"),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  peso: integer("peso"),
  dimensiones: text("dimensiones"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const variantes = sqliteTable("variantes", {
  id: text("id").primaryKey(),
  productoId: text("producto_id").notNull().references(() => productos.id, { onDelete: "cascade" }),
  atributos: text("atributos", { mode: "json" }).$type<Record<string, unknown>>().$defaultFn(() => ({})).notNull(),
  precioExtra: integer("precio_extra").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  skuVariante: text("sku_variante"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const imagenes = sqliteTable("imagenes", {
  id: text("id").primaryKey(),
  productoId: text("producto_id").notNull().references(() => productos.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  orden: integer("orden").notNull().default(0),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const atributos = sqliteTable("atributos", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").notNull().references(() => proyectos.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  tipo: text("tipo", { enum: ["texto", "select", "multiselect", "numero", "booleano", "color", "medida"] }).notNull(),
  opciones: text("opciones", { mode: "json" }).$type<string[]>().$defaultFn(() => []),
  requerido: integer("requerido", { mode: "boolean" }).notNull().default(false),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const productoCategorias = sqliteTable("producto_categorias", {
  id: text("id").primaryKey(),
  productoId: text("producto_id").notNull().references(() => productos.id, { onDelete: "cascade" }),
  categoriaId: text("categoria_id").notNull().references(() => categorias.id, { onDelete: "cascade" }),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").references(() => proyectos.id, { onDelete: "cascade" }),
  clave: text("clave").notNull(),
  valor: text("valor", { mode: "json" }).$type<unknown>().$defaultFn(() => null),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const promociones = sqliteTable("promociones", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").notNull().references(() => proyectos.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  tipo: text("tipo").notNull(),
  valor: integer("valor").notNull(),
  productosIncluidos: text("productos_incluidos", { mode: "json" }).$type<string[]>().$defaultFn(() => []),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  fechaInicio: integer("fecha_inicio", { mode: "timestamp" }),
  fechaFin: integer("fecha_fin", { mode: "timestamp" }),
});

export const analytics = sqliteTable("analytics", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").notNull().references(() => proyectos.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  datos: text("datos", { mode: "json" }).$type<Record<string, unknown>>().$defaultFn(() => ({})).notNull(),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),
  proyectoId: text("proyecto_id").notNull().references(() => proyectos.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  eventos: text("eventos", { mode: "json" }).$type<string[]>().$defaultFn(() => []),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ===== Indices =====
export const productosProyectoIdx = index("productos_proyecto_id_idx").on(productos.proyectoId);
export const categoriasProyectoIdx = index("categorias_proyecto_id_idx").on(categorias.proyectoId);
export const productoCategoriasProductoIdx = index("producto_categorias_producto_id_idx").on(productoCategorias.productoId);
export const productoCategoriasCategoriaIdx = index("producto_categorias_categoria_id_idx").on(productoCategorias.categoriaId);
export const variantesProductoIdx = index("variantes_producto_id_idx").on(variantes.productoId);
export const imagenesProductoIdx = index("imagenes_producto_id_idx").on(imagenes.productoId);
export const settingsProyectoClaveIdx = uniqueIndex("settings_proyecto_clave_unique").on(settings.proyectoId, settings.clave);
export const analyticsProyectoTipoIdx = index("analytics_proyecto_tipo_idx").on(analytics.proyectoId, analytics.tipo);
export const webhooksProyectoIdx = index("webhooks_proyecto_id_idx").on(webhooks.proyectoId);
export const usuarioRolesUsuarioIdx = index("usuario_roles_usuario_id_idx").on(usuarioRoles.usuarioId);
export const usuarioRolesProyectoIdx = index("usuario_roles_proyecto_id_idx").on(usuarioRoles.proyectoId);
