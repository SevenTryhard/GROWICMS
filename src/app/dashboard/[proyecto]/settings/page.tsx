"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Setting {
  id: string;
  clave: string;
  valor: unknown;
}

export default function SettingsPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarSettings = useCallback(async () => {
    try {
      const { proyecto } = await params;
      setProyectoSlug(proyecto);
      const res = await fetch(`/api/admin/${proyecto}/settings`);
      if (!res.ok) throw new Error("Error al cargar settings");
      const json = (await res.json()) as { data: Setting[] };
      setSettings(json.data || []);
    } catch {
      toast({ tipo: "error", mensaje: "Error al cargar settings" });
    } finally {
      setCargando(false);
    }
  }, [params, toast]);

  useEffect(() => {
    cargarSettings();
  }, [cargarSettings]);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);

    const formData = new FormData(e.currentTarget);
    const settingsMap: Record<string, unknown> = {};

    for (const [clave, valor] of formData.entries()) {
      // Si es un campo JSON, intentar parsearlo
      if (clave.endsWith("_json")) {
        const claveReal = clave.replace("_json", "");
        try {
          settingsMap[claveReal] = JSON.parse(valor as string);
        } catch {
          settingsMap[claveReal] = valor;
        }
      } else {
        settingsMap[clave] = valor;
      }
    }

    try {
      for (const [clave, valor] of Object.entries(settingsMap)) {
        const res = await fetch(`/api/admin/${proyectoSlug}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clave, valor }),
        });
        if (!res.ok) throw new Error(`Error guardando ${clave}`);
      }

      toast({ tipo: "exito", mensaje: "Settings guardados" });
      cargarSettings();
    } catch {
      toast({ tipo: "error", mensaje: "Error guardando settings" });
    } finally {
      setGuardando(false);
    }
  }

  function obtenerValor(clave: string, defaultValue = ""): string {
    const setting = settings.find((s) => s.clave === clave);
    if (!setting) return defaultValue;
    if (typeof setting.valor === "string") return setting.valor;
    return JSON.stringify(setting.valor);
  }

  function obtenerValorJson(clave: string): string {
    const setting = settings.find((s) => s.clave === clave);
    if (!setting) return "{}";
    return JSON.stringify(setting.valor, null, 2);
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="boton-neon p-2 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold">Settings del Proyecto</h1>
      </div>

      <form onSubmit={guardar} className="glass p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input
              name="whatsapp"
              defaultValue={obtenerValor("whatsapp")}
              className="input-glass"
              placeholder="+5491134567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              defaultValue={obtenerValor("email")}
              className="input-glass"
              placeholder="contacto@tutienda.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input
              name="instagram"
              defaultValue={obtenerValor("instagram")}
              className="input-glass"
              placeholder="@tutienda"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <input
              name="facebook"
              defaultValue={obtenerValor("facebook")}
              className="input-glass"
              placeholder="https://facebook.com/tutienda"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Titulo SEO</label>
          <input
            name="seo_titulo"
            defaultValue={obtenerValor("seo_titulo")}
            className="input-glass"
            placeholder="Titulo para SEO"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripcion SEO</label>
          <textarea
            name="seo_descripcion"
            defaultValue={obtenerValor("seo_descripcion")}
            rows={3}
            className="input-glass"
            placeholder="Descripcion para motores de busqueda"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Keywords SEO (JSON)</label>
          <textarea
            name="seo_keywords_json"
            defaultValue={obtenerValorJson("seo_keywords")}
            rows={3}
            className="input-glass font-mono text-sm"
            placeholder='["tienda", "online", "productos"]'
          />
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
            {guardando ? "Guardando..." : "Guardar Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
