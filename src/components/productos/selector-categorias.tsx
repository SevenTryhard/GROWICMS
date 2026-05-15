"use client";

import { useState, useEffect } from "react";

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  parentId: string | null;
}

interface Props {
  proyectoSlug: string;
  seleccionadas: string[];
  alCambiar: (ids: string[]) => void;
  deshabilitado?: boolean;
}

export function SelectorCategorias({
  proyectoSlug,
  seleccionadas,
  alCambiar,
  deshabilitado = false,
}: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/admin/${proyectoSlug}/categorias`);
        if (!res.ok) throw new Error("Error");
        const json = (await res.json()) as { data: Categoria[] };
        setCategorias(json.data || []);
      } catch {
        setCategorias([]);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [proyectoSlug]);

  function toggleCategoria(id: string) {
    if (deshabilitado) return;
    const nuevas = seleccionadas.includes(id)
      ? seleccionadas.filter((s) => s !== id)
      : [...seleccionadas, id];
    alCambiar(nuevas);
  }

  function obtenerNombreConPadre(cat: Categoria): string {
    if (!cat.parentId) return cat.nombre;
    const padre = categorias.find((c) => c.id === cat.parentId);
    return padre ? `${padre.nombre} > ${cat.nombre}` : cat.nombre;
  }

  if (cargando) {
    return <span className="text-sm text-texto-desvanecido">Cargando categorias...</span>;
  }

  if (categorias.length === 0) {
    return <span className="text-sm text-texto-desvanecido italic">No hay categorias en este proyecto.</span>;
  }

  const seleccionadasData = categorias.filter((c) => seleccionadas.includes(c.id));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !deshabilitado && setAbierto(!abierto)}
        disabled={deshabilitado}
        className={`input-glass w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between transition-all ${
          deshabilitado ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className={seleccionadas.length === 0 ? "text-texto-desvanecido" : ""}>
          {seleccionadas.length === 0
            ? "Seleccionar categorias..."
            : `${seleccionadas.length} categoria${seleccionadas.length > 1 ? "s" : ""} seleccionada${seleccionadas.length > 1 ? "s" : ""}`}
        </span>
        <span>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute z-20 mt-1 w-full glass rounded-lg max-h-60 overflow-y-auto py-1 shadow-xl">
            {categorias.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-fondo-glass-hover transition-colors text-sm ${
                  seleccionadas.includes(cat.id) ? "bg-fondo-glass/50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={seleccionadas.includes(cat.id)}
                  onChange={() => toggleCategoria(cat.id)}
                  className="accent-neon w-4 h-4"
                />
                <span>{obtenerNombreConPadre(cat)}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {seleccionadasData.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {seleccionadasData.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs glass-activo neon-borde"
            >
              {cat.nombre}
              {!deshabilitado && (
                <button
                  type="button"
                  onClick={() => toggleCategoria(cat.id)}
                  className="text-texto-desvanecido hover:text-error ml-1"
                  title="Quitar"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
