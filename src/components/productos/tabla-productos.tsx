"use client";

import { useRouter } from "next/navigation";

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
  creadoEn: Date;
  categorias: Categoria[];
}

interface Props {
  productos: Producto[];
  proyectoSlug: string;
  alEliminar: (id: string) => void;
}

export function TablaProductos({ productos, proyectoSlug, alEliminar }: Props) {
  const router = useRouter();

  function formatearPrecio(valor: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(valor / 100);
  }

  function formatearFecha(fecha: Date): string {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(fecha));
  }

  return (
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
                      onClick={() => alEliminar(producto.id)}
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
  );
}
