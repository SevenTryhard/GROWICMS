"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Proyecto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  moneda: string;
  configAtributos: Record<string, unknown>;
  configuracion: Record<string, unknown>;
  activo: boolean;
}

export default function ProyectoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configAtributos, setConfigAtributos] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarProyecto = useCallback(async () => {
    try {
      const { id } = await params;
      const res = await fetch(`/api/admin/proyectos/${id}`);
      if (!res.ok) throw new Error("Error al cargar proyecto");
      const { data } = await res.json();
      setProyecto(data);
      setConfigAtributos(JSON.stringify(data.configAtributos || {}, null, 2));
    } catch {
      toast({ tipo: "error", mensaje: "Error al cargar proyecto" });
    } finally {
      setCargando(false);
    }
  }, [params, toast]);

  useEffect(() => {
    cargarProyecto();
  }, [cargarProyecto]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!proyecto) return;
    setGuardando(true);

    const formData = new FormData(e.currentTarget);

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(configAtributos);
    } catch {
      toast({ tipo: "error", mensaje: "JSON de config_atributos invalido" });
      setGuardando(false);
      return;
    }

    try {
      const { id } = await params;
      const res = await fetch(`/api/admin/proyectos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          slug: formData.get("slug"),
          descripcion: formData.get("descripcion") || null,
          moneda: formData.get("moneda"),
          configAtributos: parsedConfig,
          activo: formData.get("activo") === "on",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar proyecto");
      }

      toast({ tipo: "exito", mensaje: "Proyecto actualizado" });
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al actualizar proyecto";
      toast({ tipo: "error", mensaje });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando proyecto...</span>
        </div>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="text-center py-12">
        <p className="text-texto-secundario">Proyecto no encontrado</p>
        <button onClick={() => router.push("/dashboard/proyectos")} className="boton-neon mt-4">
          Volver a proyectos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="boton-neon p-2 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold">Editar Proyecto</h1>
      </div>

      <form onSubmit={onSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            name="nombre"
            defaultValue={proyecto.nombre}
            required
            maxLength={200}
            className="input-glass"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input
            name="slug"
            defaultValue={proyecto.slug}
            required
            maxLength={200}
            pattern="[a-z0-9-]+"
            className="input-glass"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripcion</label>
          <textarea
            name="descripcion"
            defaultValue={proyecto.descripcion || ""}
            maxLength={2000}
            rows={3}
            className="input-glass"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Moneda</label>
          <select name="moneda" defaultValue={proyecto.moneda} className="input-glass">
            <option value="USD">USD - Dolar estadounidense</option>
            <option value="MXN">MXN - Peso mexicano</option>
            <option value="ARS">ARS - Peso argentino</option>
            <option value="COP">COP - Peso colombiano</option>
            <option value="EUR">EUR - Euro</option>
            <option value="CLP">CLP - Peso chileno</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Configuracion de Atributos (JSON)</label>
          <textarea
            value={configAtributos}
            onChange={(e) => setConfigAtributos(e.target.value)}
            rows={8}
            className="input-glass font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="activo"
            id="activo"
            defaultChecked={proyecto.activo}
            className="w-4 h-4 accent-acento"
          />
          <label htmlFor="activo" className="text-sm">Activo</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="boton-neon">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="boton-neon boton-neon-primario disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
