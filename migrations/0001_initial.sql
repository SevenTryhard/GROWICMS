-- GROWICMS Database Schema (D1 - SQLite)
-- Generated from Drizzle ORM schema

-- Proyectos (multi-tenant)
CREATE TABLE proyectos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  config_atributos TEXT NOT NULL DEFAULT '{}',
  configuracion TEXT NOT NULL DEFAULT '{}',
  moneda TEXT NOT NULL DEFAULT 'USD',
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  actualizado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Usuarios
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  telefono TEXT NOT NULL UNIQUE,
  nombre TEXT,
  email TEXT UNIQUE,
  avatar TEXT,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  actualizado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Roles
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  permisos TEXT NOT NULL DEFAULT '[]',
  creado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Usuario Roles (many-to-many con proyecto)
CREATE TABLE usuario_roles (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  proyecto_id TEXT REFERENCES proyectos(id) ON DELETE CASCADE,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Categorias (jerarquica con padre/hijo)
CREATE TABLE categorias (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  descripcion TEXT,
  parent_id TEXT REFERENCES categorias(id),
  orden INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  actualizado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Productos
CREATE TABLE productos (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  descripcion TEXT,
  precio INTEGER NOT NULL,
  precio_promo INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  peso INTEGER,
  dimensiones TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  actualizado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Variantes de producto
CREATE TABLE variantes (
  id TEXT PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  atributos TEXT NOT NULL DEFAULT '{}',
  precio_extra INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sku_variante TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);

-- Imagenes
CREATE TABLE imagenes (
  id TEXT PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Atributos custom por proyecto
CREATE TABLE atributos (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CONSTRAINT tipo_enum CHECK (tipo IN ('texto', 'select', 'multiselect', 'numero', 'booleano', 'color', 'medida')),
  opciones TEXT NOT NULL DEFAULT '[]',
  requerido INTEGER NOT NULL DEFAULT 0,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Relacion producto-categoria (many-to-many)
CREATE TABLE producto_categorias (
  id TEXT PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE
);

-- Settings por proyecto
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT REFERENCES proyectos(id) ON DELETE CASCADE,
  clave TEXT NOT NULL,
  valor TEXT,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  actualizado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(proyecto_id, clave)
);

-- Promociones
CREATE TABLE promociones (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor INTEGER NOT NULL,
  productos_incluidos TEXT NOT NULL DEFAULT '[]',
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_inicio INTEGER,
  fecha_fin INTEGER
);

-- Analytics
CREATE TABLE analytics (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  datos TEXT NOT NULL DEFAULT '{}',
  creado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Webhooks
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  eventos TEXT NOT NULL DEFAULT '[]',
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en INTEGER NOT NULL DEFAULT (unixepoch()),
  actualizado_en INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indices
CREATE INDEX productos_proyecto_id_idx ON productos(proyecto_id);
CREATE INDEX categorias_proyecto_id_idx ON categorias(proyecto_id);
CREATE INDEX producto_categorias_producto_id_idx ON producto_categorias(producto_id);
CREATE INDEX producto_categorias_categoria_id_idx ON producto_categorias(categoria_id);
CREATE INDEX variantes_producto_id_idx ON variantes(producto_id);
CREATE INDEX imagenes_producto_id_idx ON imagenes(producto_id);
CREATE INDEX analytics_proyecto_tipo_idx ON analytics(proyecto_id, tipo);
CREATE INDEX webhooks_proyecto_id_idx ON webhooks(proyecto_id);
CREATE INDEX usuario_roles_usuario_id_idx ON usuario_roles(usuario_id);
CREATE INDEX usuario_roles_proyecto_id_idx ON usuario_roles(proyecto_id);

-- Seed data: roles basicos
INSERT INTO roles (id, nombre, permisos) VALUES 
('admin', 'Administrador', '["*"]'),
('editor', 'Editor', '["productos:read", "productos:write", "categorias:read", "categorias:write", "settings:read", "settings:write"]'),
('viewer', 'Viewer', '["productos:read", "categorias:read"]');
