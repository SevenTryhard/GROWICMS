"use client";

/* eslint-disable react-hooks/set-state-in-effect */


import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function NuevoProyectoPage() {
  const [cargando, setCargando] = useState(false);
  const [configAtributos, setConfigAtributos] = useState("{}");
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData(e.currentTarget);

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(configAtributos);
    } catch {
      toast({ tipo: "error", mensaje: "JSON de config_atributos invalido" });
      setCargando(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          slug: formData.get("slug"),
          descripcion: formData.get("descripcion"),
          moneda: formData.get("moneda") || "USD",
          configAtributos: parsedConfig,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error || "Error al crear proyecto");
      }

      toast({ tipo: "exito", mensaje: "Proyecto creado exitosamente" });
      router.push("/dashboard/proyectos");
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al crear proyecto";
      toast({ tipo: "error", mensaje });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="boton-neon p-2 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
      </div>

      <form onSubmit={onSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            name="nombre"
            required
            maxLength={200}
            className="input-glass"
            placeholder="Ej: Mi Tienda Online"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input
            name="slug"
            required
            maxLength={200}
            pattern="[a-z0-9-]+"
            className="input-glass"
            placeholder="Ej: mi-tienda"
          />
          <p className="text-xs text-texto-desvanecido mt-1">Solo letras minusculas, numeros y guiones</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripcion</label>
          <textarea
            name="descripcion"
            maxLength={2000}
            rows={3}
            className="input-glass"
            placeholder="Descripcion del proyecto..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Moneda</label>
          <select name="moneda" defaultValue="USD" className="input-glass">
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
            placeholder='{"tallas": ["S", "M", "L"], "colores": ["rojo", "azul"]}'
          />
          <p className="text-xs text-texto-desvanecido mt-1">Define atributos personalizados como tallas, colores, sabores, porciones, etc.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="boton-neon"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="boton-neon boton-neon-primario disabled:opacity-50"
          >
            {cargando ? "Creando..." : "Crear Proyecto"}
          </button>
        </div>
      </form>
    </div>
  );
}
