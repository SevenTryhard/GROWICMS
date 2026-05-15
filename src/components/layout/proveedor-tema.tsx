"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Tema = "claro" | "oscuro";

interface ContextoTemaTipo {
  tema: Tema;
  alternarTema: () => void;
}

const ContextoTema = createContext<ContextoTemaTipo>({
  tema: "oscuro",
  alternarTema: () => {},
});

function obtenerTemaInicial(): Tema {
  if (typeof window === "undefined") return "oscuro";
  const temaGuardado = localStorage.getItem("growicms-tema") as Tema | null;
  if (temaGuardado) return temaGuardado;
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "claro";
  return "oscuro";
}

function guardarCookieTema(tema: Tema) {
  document.cookie = `growicms_tema=${tema};path=/;max-age=31536000;SameSite=Lax`;
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, establecerTema] = useState<Tema>(obtenerTemaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("modo-oscuro", tema === "oscuro");
    guardarCookieTema(tema);
  }, [tema]);

  const alternarTema = () => {
    const nuevoTema = tema === "oscuro" ? "claro" : "oscuro";
    establecerTema(nuevoTema);
    localStorage.setItem("growicms-tema", nuevoTema);
    document.documentElement.classList.toggle("modo-oscuro", nuevoTema === "oscuro");
    guardarCookieTema(nuevoTema);
  };

  return (
    <ContextoTema.Provider value={{ tema, alternarTema }}>
      {children}
    </ContextoTema.Provider>
  );
}

export function useTema() {
  return useContext(ContextoTema);
}
