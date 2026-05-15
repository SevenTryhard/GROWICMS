"use client";

import { useState } from "react";
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

export default function NuevoAtributoPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const [cargando, setCargando] = useState(false);
  const [opciones, setOpciones] = useState<string[]>([]);
  const [nuevaOpcion, setNuevaOpcion] = useState("");
  const [tipo, setTipo] = useState("texto");
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData(e.currentTarget);
    const { proyecto } = await params;

    try {
      const res = await fetch(`/api/admin/${proyecto}/atributos`, {
        method: "POST",
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
        throw new Error(err.error || "Error al crear atributo");
      }

      toast({ tipo: "exito", mensaje: "Atributo creado exitosamente" });
      router.push(`/dashboard/${proyecto}/atributos`);
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al crear atributo";
      toast({ tipo: "error", mensaje });
    } finally {
      setCargando(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="boton-neon p-2 text-sm"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold">Nuevo Atributo</h1>
      </div>

      <form onSubmit={onSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="nombre" required maxLength={200} className="input-glass" placeholder="Ej: Talla" />
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
              <button
                type="button"
                onClick={agregarOpcion}
                className="boton-neon"
              >
                + Agregar
              </button>
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
          <input type="checkbox" name="requerido" id="requerido" className="w-4 h-4 accent-acento" />
          <label htmlFor="requerido" className="text-sm">Requerido</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="boton-neon">Cancelar</button>
          <button
            type="submit"
            disabled={cargando}
            className="boton-neon boton-neon-primario disabled:opacity-50"
          >
            {cargando ? "Creando..." : "Crear Atributo"}
          </button>
        </div>
      </form>
    </div>
  );
}
