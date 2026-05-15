export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export type RolNombre = (typeof ROLES)[keyof typeof ROLES];

export const PERMISOS_POR_ROL: Record<RolNombre, string[]> = {
  [ROLES.ADMIN]: ["*"],
  [ROLES.EDITOR]: [
    "proyectos:leer",
    "categorias:crear",
    "categorias:leer",
    "categorias:editar",
    "categorias:eliminar",
    "atributos:crear",
    "atributos:leer",
    "atributos:editar",
    "atributos:eliminar",
    "productos:crear",
    "productos:leer",
    "productos:editar",
    "productos:eliminar",
    "settings:leer",
    "settings:editar",
    "promociones:leer",
    "promociones:crear",
    "promociones:editar",
    "promociones:eliminar",
    "analytics:leer",
  ],
  [ROLES.VIEWER]: [
    "proyectos:leer",
    "categorias:leer",
    "atributos:leer",
    "productos:leer",
    "settings:leer",
    "promociones:leer",
    "analytics:leer",
  ],
};

export function tienePermiso(rol: RolNombre, permiso: string): boolean {
  const permisos = PERMISOS_POR_ROL[rol];
  if (!permisos) return false;
  return permisos.includes("*") || permisos.includes(permiso);
}

export function puedeCrear(rol: RolNombre, recurso: string): boolean {
  return tienePermiso(rol, `${recurso}:crear`);
}

export function puedeEditar(rol: RolNombre, recurso: string): boolean {
  return tienePermiso(rol, `${recurso}:editar`);
}

export function puedeEliminar(rol: RolNombre, recurso: string): boolean {
  return tienePermiso(rol, `${recurso}:eliminar`);
}

export function puedeLeer(rol: RolNombre, recurso: string): boolean {
  return tienePermiso(rol, `${recurso}:leer`);
}
