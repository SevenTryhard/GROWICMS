"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Atributo {
  id: string;
  nombre: string;
  tipo: string;
  opciones: string[];
  requerido: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  texto: "Texto",
  select: "Seleccion",
  multiselect: "Multi-seleccion",
  numero: "Numero",
  booleano: "Si/No",
  color: "Color",
  medida: "Medida",
};

const TIPO_ICONOS: Record<string, string> = {
  texto: "📝",
  select: "🔽",
  multiselect: "☑️",
  numero: "🔢",
  booleano: "✅",
  color: "🎨",
  medida: "📏",
};

export default function AtributosPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarAtributos = useCallback(async () => {
    try {
      const { proyecto } = await params;
      setProyectoSlug(proyecto);
      const res = await fetch(`/api/admin/${proyecto}/atributos`);
      if (!res.ok) throw new Error("Error al cargar atributos");
      const json = (await res.json()) as { data: Atributo[] };
      setAtributos(json.data || []);
    } catch {
      toast({ tipo: "error", mensaje: "Error al cargar atributos" });
    } finally {
      setCargando(false);
    }
  }, [params, toast]);

  useEffect(() => {
    cargarAtributos();
  }, [cargarAtributos]);

  async function eliminarAtributo(id: string) {
    if (!confirm("¿Estas seguro de eliminar este atributo?")) return;
    try {
      const res = await fetch(`/api/admin/${proyectoSlug}/atributos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ tipo: "exito", mensaje: "Atributo eliminado" });
      cargarAtributos();
    } catch {
      toast({ tipo: "error", mensaje: "Error al eliminar atributo" });
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando atributos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Atributos Configurables</h1>
        <button
          onClick={() => router.push(`/dashboard/${proyectoSlug}/atributos/nuevo`)}
          className="boton-neon boton-neon-primario"
        >
          + Nuevo Atributo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {atributos.length === 0 ? (
          <div className="col-span-full text-center py-12 glass">
            <p className="text-texto-secundario">No hay atributos aun. Crea el primero!</p>
          </div>
        ) : (
          atributos.map((atributo) => (
            <div
              key={atributo.id}
              className="glass p-4 space-y-3 hover:bg-fondo-glass-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TIPO_ICONOS[atributo.tipo] || "⚙️"}</span>
                  <span className="font-medium">{atributo.nombre}</span>
                </div>
                {atributo.requerido && (
                  <span className="text-xs bg-advertencia/10 text-advertencia px-2 py-0.5 rounded-full">
                    Requerido
                  </span>
                )}
              </div>

              <div className="text-xs text-texto-secundario">
                Tipo: {TIPO_LABELS[atributo.tipo] || atributo.tipo}
              </div>

              {atributo.opciones.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {atributo.opciones.map((op) => (
                    <span
                      key={op}
                      className="text-xs bg-fondo-glass-activo px-2 py-0.5 rounded-md"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() =>
                    router.push(`/dashboard/${proyectoSlug}/atributos/${atributo.id}`)
                  }
                  className="boton-neon p-1.5 text-xs"
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminarAtributo(atributo.id)}
                  className="boton-neon p-1.5 text-xs hover:border-error hover:text-error"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
