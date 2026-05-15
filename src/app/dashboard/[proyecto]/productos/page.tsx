"use client";

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Categoria {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  precioPromo: number | null;
  stock: number;
  sku: string | null;
  activo: boolean;
  imagenThumbnail: string | null;
  creadoEn: string;
  categorias: Categoria[];
}

interface Meta {
  total: number;
  next_cursor: string | null;
  has_more: boolean;
  limite: number;
}

export default function ProductosPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const proyectoSlug = (params?.proyecto as string) || "";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    next_cursor: null,
    has_more: false,
    limite: 20,
  });
  const [cargando, setCargando] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Filtros
  const [busqueda, setBusqueda] = useState(searchParams.get("busqueda") || "");
  const [categoriaId, setCategoriaId] = useState(searchParams.get("categoria") || "");
  const [soloActivos, setSoloActivos] = useState(searchParams.get("solo_activos") === "true");
  const [ordenarPor, setOrdenarPor] = useState(searchParams.get("ordenar") || "creadoEn");
  const [direccion, setDireccion] = useState(searchParams.get("direccion") === "asc" ? "asc" : "desc");
  const [cursor, setCursor] = useState(searchParams.get("cursor") || "");
  const [historialCursors, setHistorialCursors] = useState<string[]>([]);

  const cargarProductos = useCallback(
    async (cursorActivo?: string) => {
      setCargando(true);
      try {
        const paramsApi = new URLSearchParams();
        if (cursorActivo) paramsApi.set("cursor", cursorActivo);
        if (busqueda) paramsApi.set("busqueda", busqueda);
        if (categoriaId) paramsApi.set("categoria", categoriaId);
        if (soloActivos) paramsApi.set("solo_activos", "true");
        paramsApi.set("ordenar", ordenarPor);
        paramsApi.set("direccion", direccion);

        const res = await fetch(
          `/api/admin/${proyectoSlug}/productos?${paramsApi.toString()}`
        );

        if (!res.ok) throw new Error("Error al cargar productos");

        const json = (await res.json()) as {
          data: Producto[];
          total: number;
          next_cursor: string | null;
          has_more: boolean;
          limite: number;
        };

        setProductos(json.data || []);
        setMeta({
          total: json.total || 0,
          next_cursor: json.next_cursor || null,
          has_more: json.has_more || false,
          limite: json.limite || 20,
        });
      } catch {
        toast({ tipo: "error", mensaje: "Error al cargar productos" });
      } finally {
        setCargando(false);
      }
    },
    [proyectoSlug, busqueda, categoriaId, soloActivos, ordenarPor, direccion, toast]
  );

  // Cargar categorias
  useEffect(() => {
    async function cargarCategorias() {
      try {
        const res = await fetch(`/api/admin/${proyectoSlug}/categorias`);
        if (!res.ok) return;
        const json = (await res.json()) as { data: Categoria[] };
        setCategorias(json.data || []);
      } catch {
        // Silencioso
      }
    }
    if (proyectoSlug) cargarCategorias();
  }, [proyectoSlug]);

  // Cargar productos al inicio o cuando cambian filtros
  useEffect(() => {
    if (proyectoSlug) {
      cargarProductos(cursor);
    }
  }, [proyectoSlug, cargarProductos]);

  function aplicarFiltros() {
    setCursor("");
    setHistorialCursors([]);
    cargarProductos("");
  }

  function irSiguiente() {
    if (meta.next_cursor) {
      setHistorialCursors((prev) => [...prev, cursor]);
      setCursor(meta.next_cursor);
      cargarProductos(meta.next_cursor);
    }
  }

  function irAnterior() {
    if (historialCursors.length > 0) {
      const prevCursor = historialCursors[historialCursors.length - 1];
      setHistorialCursors((prev) => prev.slice(0, -1));
      setCursor(prevCursor);
      cargarProductos(prevCursor);
    } else {
      setCursor("");
      cargarProductos("");
    }
  }

  async function eliminarProducto(id: string) {
    if (!confirm("¿Estas seguro de eliminar este producto?")) return;
    try {
      const res = await fetch(`/api/admin/${proyectoSlug}/productos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error");
      toast({ tipo: "exito", mensaje: "Producto eliminado" });
      cargarProductos(cursor);
    } catch {
      toast({ tipo: "error", mensaje: "Error al eliminar producto" });
    }
  }

  function formatearPrecio(valor: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(valor / 100);
  }

  if (cargando && productos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando productos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link
          href={`/dashboard/${proyectoSlug}/productos/nuevo`}
          className="boton-neon boton-neon-primario"
        >
          + Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="glass p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-texto-secundario">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre del producto..."
              className="input-glass px-3 py-2 rounded-lg text-sm"
              onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-texto-secundario">Categoria</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="input-glass px-3 py-2 rounded-lg text-sm"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-texto-secundario">Ordenar</label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="input-glass px-3 py-2 rounded-lg text-sm"
            >
              <option value="creadoEn">Fecha</option>
              <option value="nombre">Nombre</option>
              <option value="precio">Precio</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-texto-secundario">Direccion</label>
            <select
              value={direccion}
              onChange={(e) => setDireccion(e.target.value as "asc" | "desc")}
              className="input-glass px-3 py-2 rounded-lg text-sm"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
                className="accent-neon w-4 h-4"
              />
              Solo activos
            </label>
          </div>

          <button
            onClick={aplicarFiltros}
            className="boton-neon text-sm px-4 py-2"
          >
            Filtrar
          </button>

          <button
            onClick={() => {
              setBusqueda("");
              setCategoriaId("");
              setSoloActivos(false);
              setOrdenarPor("creadoEn");
              setDireccion("desc");
              setCursor("");
              setHistorialCursors([]);
              cargarProductos("");
            }}
            className="boton-neon text-sm px-4 py-2"
          >
            Limpiar
          </button>
        </div>

        <div className="text-xs text-texto-desvanecido">
          Total: {meta.total} productos | Mostrando: {productos.length}
        </div>
      </div>

      {/* Tabla */}
      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-borde-glass">
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Producto</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Categorias</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Precio</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">SKU</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto-secundario">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-texto-secundario">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-texto-secundario">
                  No hay productos aun. Crea el primero!
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr
                  key={producto.id}
                  className="border-b border-borde-glass/50 hover:bg-fondo-glass-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {producto.imagenThumbnail ? (
                        <img
                          src={producto.imagenThumbnail}
                          alt={producto.nombre}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-fondo-glass flex items-center justify-center text-texto-desvanecido flex-shrink-0">
                          📦
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="text-xs text-texto-secundario font-mono">
                          {producto.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {producto.categorias.length === 0 && (
                        <span className="text-xs text-texto-desvanecido">Sin categoria</span>
                      )}
                      {producto.categorias.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex px-2 py-0.5 rounded-md text-xs glass-activo"
                        >
                          {cat.nombre}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{formatearPrecio(producto.precio)}</span>
                      {producto.precioPromo && (
                        <span className="text-xs text-exito">
                          Promo: {formatearPrecio(producto.precioPromo)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{producto.stock}</td>
                  <td className="px-4 py-3 text-sm font-mono text-texto-secundario">
                    {producto.sku || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        producto.activo
                          ? "bg-exito/10 text-exito"
                          : "bg-error/10 text-error"
                      }`}
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/${proyectoSlug}/productos/${producto.id}`
                          )
                        }
                        className="boton-neon p-1.5 text-xs"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminarProducto(producto.id)}
                        className="boton-neon p-1.5 text-xs hover:border-error hover:text-error"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginacion */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-texto-desvanecido">
          {meta.has_more
            ? "Hay mas productos disponibles"
            : "No hay mas productos"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={irAnterior}
            disabled={!cursor && historialCursors.length === 0}
            className="boton-neon text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <button
            onClick={irSiguiente}
            disabled={!meta.has_more}
            className="boton-neon boton-neon-primario text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
