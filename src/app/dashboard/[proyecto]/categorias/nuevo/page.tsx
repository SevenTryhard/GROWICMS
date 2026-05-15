"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
}

export default function NuevaCategoriaPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const [cargando, setCargando] = useState(false);
  const [categoriasPadre, setCategoriasPadre] = useState<Categoria[]>([]);
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarCategorias = useCallback(async () => {
    try {
      const { proyecto } = await params;
      setProyectoSlug(proyecto);
      const res = await fetch(`/api/admin/${proyecto}/categorias`);
      if (res.ok) {
        const json = (await res.json()) as { data: Categoria[] };
        setCategoriasPadre(json.data || []);
      }
    } catch {
      // Silencioso
    }
  }, [params]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/admin/${proyectoSlug}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          slug: formData.get("slug"),
          descripcion: formData.get("descripcion"),
          parentId: formData.get("parentId") || null,
          orden: parseInt(formData.get("orden") as string) || 0,
          imagen: formData.get("imagen") || null,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error || "Error al crear categoria");
      }

      toast({ tipo: "exito", mensaje: "Categoria creada exitosamente" });
      router.push(`/dashboard/${proyectoSlug}/categorias`);
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al crear categoria";
      toast({ tipo: "error", mensaje });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/${proyectoSlug}/categorias`)}
          className="boton-neon p-2 text-sm"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold">Nueva Categoria</h1>
      </div>

      <form onSubmit={onSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            name="nombre"
            required
            maxLength={200}
            className="input-glass"
            placeholder="Ej: Electronica"
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
            placeholder="Ej: electronica"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripcion</label>
          <textarea
            name="descripcion"
            maxLength={2000}
            rows={3}
            className="input-glass"
            placeholder="Descripcion de la categoria..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria Padre</label>
          <select name="parentId" className="input-glass">
            <option value="">Ninguna (categoria raiz)</option>
            {categoriasPadre.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Orden</label>
            <input
              name="orden"
              type="number"
              min={0}
              defaultValue={0}
              className="input-glass"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagen URL</label>
            <input
              name="imagen"
              type="url"
              className="input-glass"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${proyectoSlug}/categorias`)}
            className="boton-neon"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="boton-neon boton-neon-primario disabled:opacity-50"
          >
            {cargando ? "Creando..." : "Crear Categoria"}
          </button>
        </div>
      </form>
    </div>
  );
}
