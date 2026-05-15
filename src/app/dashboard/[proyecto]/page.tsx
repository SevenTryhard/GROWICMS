"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  totalCategorias: number;
  totalAtributos: number;
  totalProductos: number;
}

interface Proyecto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  moneda: string;
  activo: boolean;
}

export default function DashboardProyectoPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const [stats, setStats] = useState<Stats>({ totalCategorias: 0, totalAtributos: 0, totalProductos: 0 });
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const router = useRouter();

  const cargarDatos = useCallback(async () => {
    try {
      const { proyecto: slug } = await params;
      setProyectoSlug(slug);

      // Obtener proyecto por slug
      const resProyectos = await fetch("/api/admin/proyectos");
      if (resProyectos.ok) {
        const json = (await resProyectos.json()) as { data: Proyecto[] };
        const p = json.data?.find((pr) => pr.slug === slug);
        if (p) setProyecto(p);
      }

      // Obtener stats (proximamente con queries reales a D1)
      // Por ahora usamos los endpoints existentes
      const [resCategorias, resAtributos] = await Promise.all([
        fetch(`/api/admin/${slug}/categorias`),
        fetch(`/api/admin/${slug}/atributos`),
      ]);

      let categoriasCount = 0;
      let atributosCount = 0;

      if (resCategorias.ok) {
        const json = (await resCategorias.json()) as { data: unknown[] };
        categoriasCount = json.data?.length || 0;
      }
      if (resAtributos.ok) {
        const json = (await resAtributos.json()) as { data: unknown[] };
        atributosCount = json.data?.length || 0;
      }

      setStats({
        totalCategorias: categoriasCount,
        totalAtributos: atributosCount,
        totalProductos: 0, // Placeholder hasta CRUD productos (PR3)
      });
    } catch {
      // Silencioso
    } finally {
      setCargando(false);
    }
  }, [params]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{proyecto?.nombre || "Dashboard"}</h1>
          {proyecto?.descripcion && (
            <p className="text-texto-secundario">{proyecto.descripcion}</p>
          )}
        </div>
        <span className="text-sm text-texto-secundario bg-fondo-glass px-3 py-1 rounded-full">
          Moneda: {proyecto?.moneda || "USD"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => router.push(`/dashboard/${proyectoSlug}/categorias`)}
          className="glass p-6 cursor-pointer hover:bg-fondo-glass-hover transition-colors"
        >
          <div className="text-3xl mb-2">🏷️</div>
          <div className="text-2xl font-bold">{stats.totalCategorias}</div>
          <div className="text-sm text-texto-secundario">Categorias</div>
        </div>

        <div
          onClick={() => router.push(`/dashboard/${proyectoSlug}/atributos`)}
          className="glass p-6 cursor-pointer hover:bg-fondo-glass-hover transition-colors"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <div className="text-2xl font-bold">{stats.totalAtributos}</div>
          <div className="text-sm text-texto-secundario">Atributos</div>
        </div>

        <div className="glass p-6 opacity-50">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-2xl font-bold">{stats.totalProductos}</div>
          <div className="text-sm text-texto-secundario">Productos (proximamente)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => router.push(`/dashboard/${proyectoSlug}/settings`)}
          className="glass p-6 cursor-pointer hover:bg-fondo-glass-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-medium">Settings</div>
              <div className="text-sm text-texto-secundario">Configura WhatsApp, SEO, redes sociales</div>
            </div>
          </div>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <div className="font-medium">Webhooks</div>
              <div className="text-sm text-texto-secundario">Proximamente en PR3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
