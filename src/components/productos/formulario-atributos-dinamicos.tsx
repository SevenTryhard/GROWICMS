"use client";

import { useState, useEffect } from "react";

export interface ConfigAtributo {
  nombre: string;
  tipo: string;
  opciones: string[];
  requerido: boolean;
}

interface Props {
  configAtributos: ConfigAtributo[];
  valoresIniciales?: Record<string, unknown>;
  alCambiar: (valores: Record<string, unknown>) => void;
  deshabilitado?: boolean;
}

export function FormularioAtributosDinamicos({
  configAtributos,
  valoresIniciales = {},
  alCambiar,
  deshabilitado = false,
}: Props) {
  const [valores, setValores] = useState<Record<string, unknown>>(valoresIniciales);

  useEffect(() => {
    setValores(valoresIniciales);
  }, [JSON.stringify(valoresIniciales)]);

  function actualizarValor(nombre: string, valor: unknown) {
    const nuevos = { ...valores, [nombre]: valor };
    setValores(nuevos);
    alCambiar(nuevos);
  }

  if (!configAtributos || configAtributos.length === 0) {
    return (
      <p className="text-sm text-texto-desvanecido italic">
        Este proyecto no tiene atributos configurados.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {configAtributos.map((attr) => (
        <div key={attr.nombre} className="space-y-1">
          <label className="block text-sm font-medium">
            {attr.nombre}
            {attr.requerido && <span className="text-error ml-1">*</span>}
          </label>
          {renderizarInput(attr, valores[attr.nombre], actualizarValor, deshabilitado)}
        </div>
      ))}
    </div>
  );
}

function renderizarInput(
  attr: ConfigAtributo,
  valor: unknown,
  alCambiar: (nombre: string, valor: unknown) => void,
  deshabilitado: boolean
) {
  const classBase =
    "input-glass w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neon/50 transition-all";
  const classDisabled = deshabilitado ? " opacity-50 cursor-not-allowed" : "";

  switch (attr.tipo) {
    case "color":
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={String(valor || "#000000")}
            onChange={(e) => alCambiar(attr.nombre, e.target.value)}
            disabled={deshabilitado}
            className="w-10 h-10 rounded-lg cursor-pointer border-0"
          />
          <span className="text-sm font-mono text-texto-secundario">
            {String(valor || "")}
          </span>
          {attr.opciones.length > 0 && (
            <div className="flex gap-2 ml-2">
              {attr.opciones.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => alCambiar(attr.nombre, opt)}
                  disabled={deshabilitado}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    valor === opt ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: opt }}
                  title={opt}
                />
              ))}
            </div>
          )}
        </div>
      );

    case "select":
      return (
        <select
          value={String(valor || "")}
          onChange={(e) => alCambiar(attr.nombre, e.target.value)}
          disabled={deshabilitado}
          className={classBase + classDisabled}
        >
          <option value="">Seleccionar...</option>
          {attr.opciones.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "multiselect":
      const seleccionados = Array.isArray(valor) ? valor : [];
      return (
        <div className="flex flex-wrap gap-2">
          {attr.opciones.map((opt) => (
            <label
              key={opt}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                seleccionados.includes(opt)
                  ? "glass-activo neon-borde"
                  : "glass hover:bg-fondo-glass-hover"
              } ${deshabilitado ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={seleccionados.includes(opt)}
                onChange={(e) => {
                  const nuevos = e.target.checked
                    ? [...seleccionados, opt]
                    : seleccionados.filter((s) => s !== opt);
                  alCambiar(attr.nombre, nuevos);
                }}
                disabled={deshabilitado}
                className="hidden"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case "numero":
    case "medida":
      return (
        <input
          type="number"
          value={valor === undefined || valor === null ? "" : String(valor)}
          onChange={(e) => {
            const v = e.target.value === "" ? null : parseFloat(e.target.value);
            alCambiar(attr.nombre, v);
          }}
          disabled={deshabilitado}
          className={classBase + classDisabled}
          step="any"
        />
      );

    case "booleano":
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(valor)}
            onChange={(e) => alCambiar(attr.nombre, e.target.checked)}
            disabled={deshabilitado}
            className="w-4 h-4 accent-neon"
          />
          <span className="text-sm">{Boolean(valor) ? "Sí" : "No"}</span>
        </label>
      );

    case "texto":
    default:
      return (
        <input
          type="text"
          value={String(valor || "")}
          onChange={(e) => alCambiar(attr.nombre, e.target.value)}
          disabled={deshabilitado}
          className={classBase + classDisabled}
        />
      );
  }
}
