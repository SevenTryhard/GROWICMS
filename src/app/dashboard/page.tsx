"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Proyecto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  moneda: string;
  activo: boolean;
}

export default function DashboardGlobalPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/admin/proyectos");
        if (res.ok) {
          const json = (await res.json()) as { data: Proyecto[] };
          setProyectos(json.data || []);
        }
      } catch {
        // Silencioso
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => router.push("/dashboard/proyectos/nuevo")}
          className="boton-neon boton-neon-primario"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-texto-secundario mb-4">No hay proyectos aun. Crea el primero!</p>
          <button
            onClick={() => router.push("/dashboard/proyectos/nuevo")}
            className="boton-neon boton-neon-primario"
          >
            Crear Proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              onClick={() => router.push(`/dashboard/${proyecto.slug}`)}
              className="glass p-5 cursor-pointer hover:bg-fondo-glass-hover transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{proyecto.nombre}</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    proyecto.activo
                      ? "bg-exito/10 text-exito"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {proyecto.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="text-xs text-texto-secundario font-mono mb-1">{proyecto.slug}</div>
              {proyecto.descripcion && (
                <div className="text-xs text-texto-desvanecido line-clamp-2">{proyecto.descripcion}</div>
              )}
              <div className="mt-3 text-xs text-texto-desvanecido">Moneda: {proyecto.moneda}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
