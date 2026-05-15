import { obtenerDb, tablas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import type { RolNombre } from "./roles";

export async function obtenerRolDeUsuario(
  usuarioId: string,
  proyectoId?: string
): Promise<RolNombre | null> {
  try {
    const db = obtenerDb();

    const condiciones = [eq(tablas.usuarioRoles.usuarioId, usuarioId)];
    if (proyectoId) {
      condiciones.push(eq(tablas.usuarioRoles.proyectoId, proyectoId));
    }

    const usuarioRol = await db
      .select({
        rolNombre: tablas.roles.nombre,
      })
      .from(tablas.usuarioRoles)
      .innerJoin(tablas.roles, eq(tablas.usuarioRoles.rolId, tablas.roles.id))
      .where(and(...condiciones))
      .get();

    if (!usuarioRol) {
      // Si no hay rol específico para el proyecto, buscar rol global (sin proyectoId)
      if (proyectoId) {
        const rolGlobal = await db
          .select({
            rolNombre: tablas.roles.nombre,
          })
          .from(tablas.usuarioRoles)
          .innerJoin(tablas.roles, eq(tablas.usuarioRoles.rolId, tablas.roles.id))
          .where(
            and(
              eq(tablas.usuarioRoles.usuarioId, usuarioId),
              eq(tablas.usuarioRoles.proyectoId, "")
            )
          )
          .get();

        if (rolGlobal) {
          return rolGlobal.rolNombre as RolNombre;
        }
      }
      return null;
    }

    return usuarioRol.rolNombre as RolNombre;
  } catch {
    return null;
  }
}

export async function verificarAccesoAdmin(
  usuarioId: string
): Promise<boolean> {
  const rol = await obtenerRolDeUsuario(usuarioId);
  return rol === "admin";
}

export async function verificarAccesoProyecto(
  usuarioId: string,
  proyectoId: string,
  permisoRequerido?: string
): Promise<{ autorizado: boolean; rol: RolNombre | null }> {
  const rol = await obtenerRolDeUsuario(usuarioId, proyectoId);

  if (!rol) {
    return { autorizado: false, rol: null };
  }

  if (rol === "admin") {
    return { autorizado: true, rol };
  }

  if (permisoRequerido) {
    const { tienePermiso } = await import("./roles");
    return {
      autorizado: tienePermiso(rol, permisoRequerido),
      rol,
    };
  }

  return { autorizado: true, rol };
}
