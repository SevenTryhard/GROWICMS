"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FormularioProducto } from "@/components/productos/formulario-producto";
import { useToast } from "@/components/ui/toast";

interface ConfigAtributo {
  nombre: string;
  tipo: string;
  opciones: string[];
  requerido: boolean;
}

export default function NuevoProductoPage() {
  const params = useParams();
  const proyectoSlug = (params?.proyecto as string) || "";
  const { toast } = useToast();
  const [configAtributos, setConfigAtributos] = useState<ConfigAtributo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarConfig() {
      try {
        const res = await fetch(`/api/admin/${proyectoSlug}/atributos`);
        if (!res.ok) throw new Error("Error");
        const json = (await res.json()) as { data: ConfigAtributo[] };
        setConfigAtributos(json.data || []);
      } catch {
        toast({ tipo: "error", mensaje: "Error cargando configuracion de atributos" });
      } finally {
        setCargando(false);
      }
    }
    if (proyectoSlug) cargarConfig();
  }, [proyectoSlug, toast]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <FormularioProducto
      proyectoSlug={proyectoSlug}
      modo="crear"
      configAtributos={configAtributos}
    />
  );
}
