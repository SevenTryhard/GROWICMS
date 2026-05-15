"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FormularioProducto } from "@/components/productos/formulario-producto";
import { useToast } from "@/components/ui/toast";

interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  precioPromo: number | null;
  stock: number;
  sku: string;
  peso: number | null;
  dimensiones: string;
  activo: boolean;
  categoriaIds: string[];
  atributos: Record<string, unknown>;
}

interface Variante {
  id?: string;
  atributos: Record<string, unknown>;
  precioExtra: number;
  stock: number;
  skuVariante: string | null;
  activo: boolean;
}

interface ConfigAtributo {
  nombre: string;
  tipo: string;
  opciones: string[];
  requerido: boolean;
}

export default function EditarProductoPage() {
  const params = useParams();
  const proyectoSlug = (params?.proyecto as string) || "";
  const productoId = (params?.id as string) || "";
  const { toast } = useToast();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [configAtributos, setConfigAtributos] = useState<ConfigAtributo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resProducto, resVariantes, resAtributos] = await Promise.all([
          fetch(`/api/admin/${proyectoSlug}/productos/${productoId}`),
          fetch(`/api/admin/${proyectoSlug}/productos/${productoId}/variantes`),
          fetch(`/api/admin/${proyectoSlug}/atributos`),
        ]);

        if (!resProducto.ok) throw new Error("Error cargando producto");

        const jsonProducto = (await resProducto.json()) as { data: Producto & { categorias: { id: string }[]; variantes: Variante[] } };
        const prod = jsonProducto.data;

        setProducto({
          id: prod.id,
          nombre: prod.nombre,
          slug: prod.slug,
          descripcion: prod.descripcion,
          precio: prod.precio,
          precioPromo: prod.precioPromo,
          stock: prod.stock,
          sku: prod.sku || "",
          peso: prod.peso,
          dimensiones: prod.dimensiones || "",
          activo: prod.activo,
          categoriaIds: prod.categorias?.map((c) => c.id) || [],
          atributos: prod.atributos || {},
        });

        if (resVariantes.ok) {
          const jsonVariantes = (await resVariantes.json()) as { data: Variante[] };
          setVariantes(jsonVariantes.data || []);
        }

        if (resAtributos.ok) {
          const jsonAtributos = (await resAtributos.json()) as { data: ConfigAtributo[] };
          setConfigAtributos(jsonAtributos.data || []);
        }
      } catch (err) {
        toast({
          tipo: "error",
          mensaje: err instanceof Error ? err.message : "Error cargando datos",
        });
      } finally {
        setCargando(false);
      }
    }

    if (proyectoSlug && productoId) {
      cargarDatos();
    }
  }, [proyectoSlug, productoId, toast]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow glass px-6 py-3 rounded-xl">
          <span className="text-texto-secundario">Cargando producto...</span>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="glass p-6 rounded-xl text-center">
        <p className="text-error">Producto no encontrado</p>
      </div>
    );
  }

  return (
    <FormularioProducto
      proyectoSlug={proyectoSlug}
      producto={producto}
      variantes={variantes}
      configAtributos={configAtributos}
      modo="editar"
    />
  );
}
