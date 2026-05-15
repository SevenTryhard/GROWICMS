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

interface CategoriaDetalle {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  parentId: string | null;
  orden: number;
  imagen: string | null;
  activo: boolean;
}

export default function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ proyecto: string; id: string }>;
}) {
  const [categoria, setCategoria] = useState<CategoriaDetalle | null>(null);
  const [categoriasPadre, setCategoriasPadre] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const [idCategoria, setIdCategoria] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarDatos = useCallback(async () => {
    if (!proyectoSlug) return;
    try {
      const [resCategoria, resCategorias] = await Promise.all([
        fetch(`/api/admin/${proyectoSlug}/categorias/${idCategoria}`),
        fetch(`/api/admin/${proyectoSlug}/categorias`),
      ]);

      if (resCategoria.ok) {
        const json = (await resCategoria.json()) as { data: CategoriaDetalle };
        setCategoria(json.data);
      }

      if (resCategorias.ok) {
        const json = (await resCategorias.json()) as { data: Categoria[] };
        setCategoriasPadre((json.data || []).filter((c) => c.id !== idCategoria));
      }
    } catch {
      toast({ tipo: "error", mensaje: "Error al cargar datos" });
    } finally {
      setCargando(false);
    }
  }, [proyectoSlug, idCategoria, toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    async function init() {
      const { proyecto, id } = await params;
      setProyectoSlug(proyecto);
      setIdCategoria(id);
    }
    init();
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!categoria) return;
    setGuardando(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/admin/${proyectoSlug}/categorias/${idCategoria}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          slug: formData.get("slug"),
          descripcion: formData.get("descripcion") || null,
          parentId: formData.get("parentId") || null,
          orden: parseInt(formData.get("orden") as string) || 0,
          imagen: formData.get("imagen") || null,
          activo: formData.get("activo") === "on",
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error || "Error al actualizar");
      }

      toast({ tipo: "exito", mensaje: "Categoria actualizada" });
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : "Error al actualizar";
      toast({ tipo: "error", mensaje });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!categoria) {
    return (
      <div className="text-center py-12">
        <p className="text-texto-secundario">Categoria no encontrada</p>
        <button
          onClick={() => router.push(`/dashboard/${proyectoSlug}/categorias`)}
          className="boton-neon mt-4"
        >
          Volver
        </button>
      </div>
    );
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
        <h1 className="text-2xl font-bold">Editar Categoria</h1>
      </div>

      <form onSubmit={onSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            name="nombre"
            defaultValue={categoria.nombre}
            required
            maxLength={200}
            className="input-glass"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input
            name="slug"
            defaultValue={categoria.slug}
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
            defaultValue={categoria.descripcion || ""}
            maxLength={2000}
            rows={3}
            className="input-glass"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria Padre</label>
          <select name="parentId" defaultValue={categoria.parentId || ""} className="input-glass">
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
              defaultValue={categoria.orden}
              className="input-glass"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagen URL</label>
            <input
              name="imagen"
              type="url"
              defaultValue={categoria.imagen || ""}
              className="input-glass"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="activo"
            id="activo"
            defaultChecked={categoria.activo}
            className="w-4 h-4 accent-acento"
          />
          <label htmlFor="activo" className="text-sm">Activo</label>
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
