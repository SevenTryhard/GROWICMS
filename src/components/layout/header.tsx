"use client";

import { useTema } from "@/components/layout/proveedor-tema";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export function Header() {
  const { tema, alternarTema } = useTema();
  const { toast } = useToast();
  const router = useRouter();

  async function cerrarSesion() {
    try {
      await fetch("/api/auth/cerrar-sesion", { method: "POST" });
      toast({ tipo: "exito", mensaje: "Sesion cerrada" });
      router.push("/iniciar-sesion");
    } catch {
      toast({ tipo: "error", mensaje: "Error al cerrar sesion" });
    }
  }

  return (
    <header className="glass sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <div className="flex items-center gap-3">
        <button
          onClick={alternarTema}
          className="boton-neon p-2"
          title={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
        >
          {tema === "oscuro" ? "☀️" : "🌙"}
        </button>
        <button
          onClick={cerrarSesion}
          className="boton-neon p-2"
          title="Cerrar sesion"
        >
          🚪
        </button>
      </div>
    </header>
  );
}
