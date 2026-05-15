"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type TipoToast = "exito" | "error" | "info" | "aviso";

interface Toast {
  id: string;
  tipo: TipoToast;
  mensaje: string;
}

interface ContextoToastTipo {
  toast: (opciones: { tipo: TipoToast; mensaje: string }) => void;
}

const ContextoToast = createContext<ContextoToastTipo>({
  toast: () => {},
});

const DURACION_TOAST = 5000;
const MAX_TOASTS = 5;

const COLORES_TOAST: Record<TipoToast, { fondo: string; borde: string; icono: string }> = {
  exito: { fondo: "rgba(81, 207, 102, 0.1)", borde: "rgba(81, 207, 102, 0.3)", icono: "✓" },
  error: { fondo: "rgba(255, 107, 107, 0.1)", borde: "rgba(255, 107, 107, 0.3)", icono: "✕" },
  info: { fondo: "rgba(59, 130, 246, 0.1)", borde: "rgba(59, 130, 246, 0.3)", icono: "ℹ" },
  aviso: { fondo: "rgba(255, 212, 59, 0.1)", borde: "rgba(255, 212, 59, 0.3)", icono: "⚠" },
};

function ToastItem({ toast, alRemover }: { toast: Toast; alRemover: (id: string) => void }) {
  const colores = COLORES_TOAST[toast.tipo];
  const [saliendo, establecerSaliendo] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      establecerSaliendo(true);
      setTimeout(() => alRemover(toast.id), 200);
    }, DURACION_TOAST);
    return () => clearTimeout(temporizador);
  }, [toast.id, alRemover]);

  return (
    <div
      className={`glass ${saliendo ? "animacion-salida-toast" : "animacion-entrada-toast"}`}
      style={{
        background: colores.fondo,
        borderColor: colores.borde,
        minWidth: "280px",
        maxWidth: "420px",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="text-lg mt-0.5 flex-shrink-0">{colores.icono}</span>
        <p className="text-sm flex-1">{toast.mensaje}</p>
        <button
          onClick={() => {
            establecerSaliendo(true);
            setTimeout(() => alRemover(toast.id), 200);
          }}
          className="text-texto-desvanecido hover:text-texto text-xs flex-shrink-0"
        >
          ✕
        </button>
      </div>
      <div className="h-0.5 rounded-b-xl overflow-hidden" style={{ background: colores.borde }}>
        <div
          style={{
            animation: `barra-progreso ${DURACION_TOAST}ms linear forwards`,
            background: colores.borde,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}

export function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, establecerToasts] = useState<Toast[]>([]);

  const alRemover = useCallback((id: string) => {
    establecerToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ tipo, mensaje }: { tipo: TipoToast; mensaje: string }) => {
      const id = crypto.randomUUID();
      establecerToasts((prev) => {
        const nuevaLista = [...prev, { id, tipo, mensaje }];
        return nuevaLista.slice(-MAX_TOASTS);
      });
    },
    []
  );

  return (
    <ContextoToast.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-sm:top-2 max-sm:right-2 max-sm:left-2 max-sm:items-center md:items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} alRemover={alRemover} />
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export function useToast() {
  return useContext(ContextoToast);
}
