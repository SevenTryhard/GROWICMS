"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const NAVEGACION = [
  { nombre: "Dashboard", ruta: "/dashboard", icono: "📊" },
  { nombre: "Productos", ruta: "/dashboard/productos", icono: "📦" },
  { nombre: "Categorias", ruta: "/dashboard/categorias", icono: "🏷️" },
  { nombre: "Atributos", ruta: "/dashboard/atributos", icono: "⚙️" },
  { nombre: "Promociones", ruta: "/dashboard/promociones", icono: "🎁" },
  { nombre: "Analytics", ruta: "/dashboard/analytics", icono: "📈" },
  { nombre: "Webhooks", ruta: "/dashboard/webhooks", icono: "🔗" },
  { nombre: "Configuracion", ruta: "/dashboard/configuracion", icono: "⚡" },
];

export function Sidebar({ proyectoNombre }: { proyectoNombre?: string }) {
  const [colapsado, establecerColapsado] = useState(false);
  const pathname = usePathname();

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

      <nav className="flex-1 overflow-y-auto py-2">
        {NAVEGACION.map((item) => {
          const activo = pathname === item.ruta || pathname?.startsWith(item.ruta + "/");
          return (
            <a
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
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
