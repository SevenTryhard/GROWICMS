"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  parentId: string | null;
  orden: number;
  imagen: string | null;
  activo: boolean;
}

export default function CategoriasPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [proyectoSlug, setProyectoSlug] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const cargarCategorias = useCallback(async () => {
    try {
      const { proyecto } = await params;
      setProyectoSlug(proyecto);
      const res = await fetch(`/api/admin/${proyecto}/categorias`);
      if (!res.ok) throw new Error("Error al cargar categorias");
      const json = (await res.json()) as { data: Categoria[] }; const data = json.data;
      setCategorias(data || []);
    } catch {
      toast({ tipo: "error", mensaje: "Error al cargar categorias" });
    } finally {
      setCargando(false);
    }
  }, [params, toast]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  async function eliminarCategoria(id: string) {
    if (!confirm("¿Estas seguro de eliminar esta categoria?")) return;
    try {
      const res = await fetch(`/api/admin/${proyectoSlug}/categorias/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ tipo: "exito", mensaje: "Categoria eliminada" });
      cargarCategorias();
    } catch {
      toast({ tipo: "error", mensaje: "Error al eliminar categoria" });
    }
  }

  function construirArbol(cats: Categoria[]): Categoria[] {
    const mapa = new Map<string, Categoria[]>();
    const raices: Categoria[] = [];

    cats.forEach((cat) => {
      if (!cat.parentId) {
        raices.push(cat);
      } else {
        const hermanos = mapa.get(cat.parentId) || [];
        hermanos.push(cat);
        mapa.set(cat.parentId, hermanos);
      }
    });

    return raices.flatMap((r) => [r, ...(mapa.get(r.id) || [])]);
  }

  function obtenerNivel(categoria: Categoria, todas: Categoria[]): number {
    let nivel = 0;
    let actual = categoria;
    while (actual.parentId) {
      const padre = todas.find((c) => c.id === actual.parentId);
      if (!padre) break;
      nivel++;
      actual = padre;
    }
    return nivel;
  }

  const categoriasOrdenadas = construirArbol(categorias);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando categorias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button
          onClick={() => router.push(`/dashboard/${proyectoSlug}/categorias/nuevo`)}
          className="boton-neon boton-neon-primario"
        >
          + Nueva Categoria
        </button>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-borde-glass">
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Orden</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-texto-secundario">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-texto-secundario">
                  No hay categorias aun. Crea la primera!
                </td>
              </tr>
            ) : (
              categoriasOrdenadas.map((categoria) => {
                const nivel = obtenerNivel(categoria, categorias);
                return (
                  <tr
                    key={categoria.id}
                    className={`border-b border-borde-glass/50 hover:bg-fondo-glass-hover transition-colors ${
                      nivel > 0 ? "bg-fondo-glass/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {nivel > 0 && (
                          <span className="text-texto-desvanecido">{"  ".repeat(nivel)}└─</span>
                        )}
                        {categoria.imagen && (
                          <img
                            src={categoria.imagen}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        )}
                        <div className={nivel > 0 ? "text-sm" : "font-medium"}>
                          {categoria.nombre}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-texto-secundario">{categoria.slug}</td>
                    <td className="px-4 py-3 text-sm">{categoria.orden}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          categoria.activo
                            ? "bg-exito/10 text-exito"
                            : "bg-error/10 text-error"
                        }`}
                      >
                        {categoria.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/${proyectoSlug}/categorias/${categoria.id}`
                            )
                          }
                          className="boton-neon p-1.5 text-xs"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminarCategoria(categoria.id)}
                          className="boton-neon p-1.5 text-xs hover:border-error hover:text-error"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
