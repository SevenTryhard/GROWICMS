"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAVEGACION_GLOBAL = [
  { nombre: "Dashboard", ruta: "/dashboard", icono: "📊" },
  { nombre: "Proyectos", ruta: "/dashboard/proyectos", icono: "🗂️" },
];

const NAVEGACION_PROYECTO = [
  { nombre: "Dashboard", ruta: "", icono: "📊" },
  { nombre: "Productos", ruta: "/productos", icono: "📦" },
  { nombre: "Categorias", ruta: "/categorias", icono: "🏷️" },
  { nombre: "Atributos", ruta: "/atributos", icono: "⚙️" },
  { nombre: "Settings", ruta: "/settings", icono: "⚡" },
  { nombre: "Promociones", ruta: "/promociones", icono: "🎁" },
  { nombre: "Analytics", ruta: "/analytics", icono: "📈" },
];

export function Sidebar({
  proyectoSlug,
  proyectoNombre,
}: {
  proyectoSlug?: string;
  proyectoNombre?: string;
}) {
  const [colapsado, establecerColapsado] = useState(false);
  const pathname = usePathname();

  const esContextoProyecto = !!proyectoSlug;

  const navegacion = esContextoProyecto
    ? NAVEGACION_PROYECTO.map((item) => ({
        ...item,
        ruta: `/dashboard/${proyectoSlug}${item.ruta}`,
      }))
    : NAVEGACION_GLOBAL;

  return (
    <aside
      className={`glass fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col ${
        colapsado ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-borde-glass">
        <span className={`font-bold neon-texto truncate ${colapsado ? "hidden" : "block"}`}>
          {proyectoNombre || "GROWICMS"}
        </span>
        <button
          onClick={() => establecerColapsado(!colapsado)}
          className="boton-neon p-1 text-sm"
        >
          {colapsado ? "▶" : "◀"}
        </button>
      </div>

      {esContextoProyecto && (
        <div className="px-4 py-2 border-b border-borde-glass">
          <Link
            href="/dashboard/proyectos"
            className="text-xs text-texto-desvanecido hover:text-texto transition-colors"
          >
            ← Volver a proyectos
          </Link>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {navegacion.map((item) => {
          const activo = pathname === item.ruta || pathname?.startsWith(item.ruta + "/");
          return (
            <Link
              key={item.ruta}
              href={item.ruta}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                activo
                  ? "glass-activo neon-borde"
                  : "hover:bg-fondo-glass-hover"
              }`}
              title={colapsado ? item.nombre : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icono}</span>
              <span className={`text-sm ${colapsado ? "hidden" : "block"}`}>{item.nombre}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
