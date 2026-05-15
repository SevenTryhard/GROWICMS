"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Proyecto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  moneda: string;
  activo: boolean;
  creadoEn: string;
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const cargarProyectos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/proyectos");
      if (!res.ok) throw new Error("Error al cargar proyectos");
      const json = (await res.json()) as { data: Proyecto[] }; const data = json.data;
      setProyectos(data || []);
    } catch (error) {
      toast({ tipo: "error", mensaje: "Error al cargar proyectos" });
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  async function eliminarProyecto(id: string) {
    if (!confirm("¿Estas seguro de eliminar este proyecto? Esta accion no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/admin/proyectos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ tipo: "exito", mensaje: "Proyecto eliminado" });
      cargarProyectos();
    } catch {
      toast({ tipo: "error", mensaje: "Error al eliminar proyecto" });
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando proyectos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <button
          onClick={() => router.push("/dashboard/proyectos/nuevo")}
          className="boton-neon boton-neon-primario"
        >
          + Nuevo Proyecto
        </button>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-borde-glass">
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Moneda</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-texto-secundario">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-texto-secundario">
                  No hay proyectos aun. Crea el primero!
                </td>
              </tr>
            ) : (
              proyectos.map((proyecto) => (
                <tr
                  key={proyecto.id}
                  className="border-b border-borde-glass/50 hover:bg-fondo-glass-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{proyecto.nombre}</div>
                    {proyecto.descripcion && (
                      <div className="text-xs text-texto-desvanecido mt-0.5 line-clamp-1">
                        {proyecto.descripcion}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-texto-secundario">{proyecto.slug}</td>
                  <td className="px-4 py-3 text-sm">{proyecto.moneda}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        proyecto.activo
                          ? "bg-exito/10 text-exito"
                          : "bg-error/10 text-error"
                      }`}
                    >
                      {proyecto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/proyectos/${proyecto.id}`)}
                        className="boton-neon p-1.5 text-xs"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/${proyecto.slug}`)}
                        className="boton-neon p-1.5 text-xs"
                        title="Dashboard"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => eliminarProyecto(proyecto.id)}
                        className="boton-neon p-1.5 text-xs hover:border-error hover:text-error"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
