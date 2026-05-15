"use client";

import { useState } from "react";

interface Variante {
  id?: string;
  atributos: Record<string, unknown>;
  precioExtra: number;
  stock: number;
  skuVariante: string | null;
  activo: boolean;
}

interface Props {
  variantes: Variante[];
  alCambiar: (variantes: Variante[]) => void;
  configAtributos: { nombre: string; tipo: string; opciones: string[] }[];
  deshabilitado?: boolean;
}

export function EditorVariantes({
  variantes,
  alCambiar,
  configAtributos,
  deshabilitado = false,
}: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoIndice, setEditandoIndice] = useState<number | null>(null);

  const varianteVacia: Variante = {
    atributos: {},
    precioExtra: 0,
    stock: 0,
    skuVariante: null,
    activo: true,
  };

  const [formulario, setFormulario] = useState<Variante>(varianteVacia);

  function abrirCrear() {
    setFormulario(varianteVacia);
    setEditandoIndice(null);
    setMostrarFormulario(true);
  }

  function abrirEditar(indice: number) {
    setFormulario({ ...variantes[indice] });
    setEditandoIndice(indice);
    setMostrarFormulario(true);
  }

  function guardar() {
    if (editandoIndice !== null) {
      const nuevas = [...variantes];
      nuevas[editandoIndice] = formulario;
      alCambiar(nuevas);
    } else {
      alCambiar([...variantes, formulario]);
    }
    setMostrarFormulario(false);
    setFormulario(varianteVacia);
  }

  function eliminar(indice: number) {
    if (!confirm("¿Eliminar esta variante?")) return;
    const nuevas = variantes.filter((_, i) => i !== indice);
    alCambiar(nuevas);
  }

  function actualizarAtributo(nombre: string, valor: unknown) {
    setFormulario((prev) => ({
      ...prev,
      atributos: { ...prev.atributos, [nombre]: valor },
    }));
  }

  return (
    <div className="space-y-4">
      {!mostrarFormulario && (
        <button
          type="button"
          onClick={abrirCrear}
          disabled={deshabilitado}
          className="boton-neon text-sm"
        >
          + Agregar variante
        </button>
      )}

      {mostrarFormulario && (
        <div className="glass p-4 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold">
            {editandoIndice !== null ? "Editar variante" : "Nueva variante"}
          </h4>

          {configAtributos.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-texto-secundario font-medium">Atributos</p>
              {configAtributos.map((attr) => (
                <div key={attr.nombre} className="space-y-1">
                  <label className="text-xs">{attr.nombre}</label>
                  {attr.tipo === "select" && attr.opciones.length > 0 ? (
                    <select
                      value={String(formulario.atributos[attr.nombre] || "")}
                      onChange={(e) => actualizarAtributo(attr.nombre, e.target.value)}
                      className="input-glass w-full px-2 py-1.5 rounded text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {attr.opciones.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : attr.tipo === "color" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={String(formulario.atributos[attr.nombre] || "#000000")}
                        onChange={(e) => actualizarAtributo(attr.nombre, e.target.value)}
                        className="w-8 h-8 rounded border-0"
                      />
                      <span className="text-xs font-mono">
                        {String(formulario.atributos[attr.nombre] || "")}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={String(formulario.atributos[attr.nombre] || "")}
                      onChange={(e) => actualizarAtributo(attr.nombre, e.target.value)}
                      className="input-glass w-full px-2 py-1.5 rounded text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs">Precio extra</label>
              <input
                type="number"
                value={formulario.precioExtra}
                onChange={(e) =>
                  setFormulario((p) => ({
                    ...p,
                    precioExtra: parseInt(e.target.value || "0", 10),
                  }))
                }
                className="input-glass w-full px-2 py-1.5 rounded text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Stock</label>
              <input
                type="number"
                value={formulario.stock}
                onChange={(e) =>
                  setFormulario((p) => ({
                    ...p,
                    stock: parseInt(e.target.value || "0", 10),
                  }))
                }
                className="input-glass w-full px-2 py-1.5 rounded text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">SKU variante</label>
              <input
                type="text"
                value={formulario.skuVariante || ""}
                onChange={(e) =>
                  setFormulario((p) => ({
                    ...p,
                    skuVariante: e.target.value || null,
                  }))
                }
                className="input-glass w-full px-2 py-1.5 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={guardar}
              className="boton-neon boton-neon-primario text-sm px-4"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false);
                setFormulario(varianteVacia);
              }}
              className="boton-neon text-sm px-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {variantes.length > 0 && (
        <div className="glass overflow-hidden rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-borde-glass">
                <th className="text-left px-3 py-2 text-xs font-semibold text-texto-secundario">Atributos</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-texto-secundario">Precio extra</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-texto-secundario">Stock</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-texto-secundario">SKU</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-texto-secundario">Estado</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-texto-secundario">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variantes.map((v, i) => (
                <tr
                  key={i}
                  className="border-b border-borde-glass/50 hover:bg-fondo-glass-hover transition-colors"
                >
                  <td className="px-3 py-2 text-sm">
                    {Object.entries(v.atributos)
                      .map(([k, val]) => `${k}: ${String(val)}`)
                      .join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-sm">+{v.precioExtra}</td>
                  <td className="px-3 py-2 text-sm">{v.stock}</td>
                  <td className="px-3 py-2 text-sm font-mono text-texto-secundario">
                    {v.skuVariante || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.activo
                          ? "bg-exito/10 text-exito"
                          : "bg-error/10 text-error"
                      }`}
                    >
                      {v.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEditar(i)}
                        disabled={deshabilitado}
                        className="boton-neon p-1 text-xs"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(i)}
                        disabled={deshabilitado}
                        className="boton-neon p-1 text-xs hover:border-error hover:text-error"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
