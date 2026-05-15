"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const TIPOS_ATRIBUTO = [
  { valor: "texto", label: "Texto" },
  { valor: "select", label: "Seleccion" },
  { valor: "multiselect", label: "Multi-seleccion" },
  { valor: "numero", label: "Numero" },
  { valor: "booleano", label: "Si/No" },
  { valor: "color", label: "Color" },
  { valor: "medida", label: "Medida" },
];

interface Atributo {
  id: string;
  nombre: string;
  tipo: string;
  opciones: string[];
  requerido: boolean;
}

export default function EditarAtributoPage({ params }: { params: Promise<{ proyecto: string; id: string }> }) {
  const [atributo, setAtributo] = useState<Atributo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [opciones, setOpciones] = useState<string[]>([]);
  const [nuevaOpcion, setNuevaOpcion] = useState("");
  const [tipo, setTipo] = useState("texto");
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const [idAtributo, setIdAtributo] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarAtributo = useCallback(async () => {
    try {
      const { proyecto, id } = await params;
      setProyectoSlug(proyecto);
      setIdAtributo(id);
      const res = await fetch(`/api/admin/${proyecto}/atributos/${id}`);
      if (!res.ok) throw new Error("Error al cargar atributo");
      const json = (await res.json()) as { data: Atributo };
      setAtributo(json.data);
      setTipo(json.data.tipo);
      setOpciones(json.data.opciones || []);
    } catch {
      toast({ tipo: "error", mensaje: "Error al cargar atributo" });
    } finally {
      setCargando(false);
    }
  }, [params, toast]);

  useEffect(() => {
    cargarAtributo();
  }, [cargarAtributo]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atributo) return;
    setGuardando(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/admin/${proyectoSlug}/atributos/${idAtributo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          tipo: formData.get("tipo"),
          opciones: opciones,
          requerido: formData.get("requerido") === "on",
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error || "Error al actualizar");
      }

      toast({ tipo: "exito", mensaje: "Atributo actualizado" });
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al actualizar";
      toast({ tipo: "error", mensaje });
    } finally {
      setGuardando(false);
    }
  }

  function agregarOpcion() {
    if (!nuevaOpcion.trim()) return;
    setOpciones([...opciones, nuevaOpcion.trim()]);
    setNuevaOpcion("");
  }

  function eliminarOpcion(index: number) {
    setOpciones(opciones.filter((_, i) => i !== index));
  }

  const necesitaOpciones = tipo === "select" || tipo === "multiselect" || tipo === "color" || tipo === "medida";

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando atributo...</span>
        </div>
      </div>
    );
  }

  if (!atributo) {
    return (
      <div className="text-center py-12">
        <p className="text-texto-secundario">Atributo no encontrado</p>
        <button onClick={() => router.push(`/dashboard/${proyectoSlug}/atributos`)} className="boton-neon mt-4">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/${proyectoSlug}/atributos`)}
          className="boton-neon p-2 text-sm"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold">Editar Atributo</h1>
      </div>

      <form onSubmit={onSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="nombre" defaultValue={atributo.nombre} required maxLength={200} className="input-glass" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="input-glass"
          >
            {TIPOS_ATRIBUTO.map((t) => (
              <option key={t.valor} value={t.valor}>{t.label}</option>
            ))}
          </select>
        </div>

        {necesitaOpciones && (
          <div>
            <label className="block text-sm font-medium mb-1">Opciones</label>
            <div className="flex gap-2">
              <input
                value={nuevaOpcion}
                onChange={(e) => setNuevaOpcion(e.target.value)}
                className="input-glass flex-1"
                placeholder="Ej: S, M, L..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarOpcion();
                  }
                }}
              />
              <button type="button" onClick={agregarOpcion} className="boton-neon">+ Agregar</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {opciones.map((op, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-sm bg-fondo-glass-activo px-2 py-1 rounded-md"
                >
                  {op}
                  <button
                    type="button"
                    onClick={() => eliminarOpcion(i)}
                    className="text-texto-desvanecido hover:text-error"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="requerido"
            id="requerido"
            defaultChecked={atributo.requerido}
            className="w-4 h-4 accent-acento"
          />
          <label htmlFor="requerido" className="text-sm">Requerido</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="boton-neon">Cancelar</button>
          <button
            type="submit"
            disabled={guardando}
            className="boton-neon boton-neon-primario disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
