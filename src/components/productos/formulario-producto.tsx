"use client";

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { FormularioAtributosDinamicos, type ConfigAtributo } from "./formulario-atributos-dinamicos";
import { SelectorCategorias } from "./selector-categorias";
import { EditorVariantes } from "./editor-variantes";

interface Producto {
  id?: string;
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

interface Props {
  proyectoSlug: string;
  producto?: Producto & { id: string };
  variantes?: Variante[];
  configAtributos?: ConfigAtributo[];
  modo: "crear" | "editar";
}

const TABS = [
  { id: "general", nombre: "General" },
  { id: "categorias", nombre: "Categorias" },
  { id: "atributos", nombre: "Atributos" },
  { id: "variantes", nombre: "Variantes" },
];

export function FormularioProducto({
  proyectoSlug,
  producto,
  variantes: variantesIniciales = [],
  configAtributos = [],
  modo,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [guardando, setGuardando] = useState(false);
  const [tabActiva, setTabActiva] = useState("general");
  const [variantes, setVariantes] = useState<Variante[]>(variantesIniciales);

  const [formulario, setFormulario] = useState<Producto>({
    nombre: "",
    slug: "",
    descripcion: "",
    precio: 0,
    precioPromo: null,
    stock: 0,
    sku: "",
    peso: null,
    dimensiones: "",
    activo: true,
    categoriaIds: [],
    atributos: {},
    ...producto,
  });

  useEffect(() => {
    if (producto) {
      setFormulario((prev) => ({ ...prev, ...producto }));
    }
  }, [producto?.id]);

  useEffect(() => {
    setVariantes(variantesIniciales);
  }, [variantesIniciales.length]);

  function actualizarCampo<K extends keyof Producto>(campo: K, valor: Producto[K]) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  function generarSlug(nombre: string) {
    return nombre
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .substring(0, 200);
  }

  async function guardar() {
    setGuardando(true);

    try {
      const url =
        modo === "crear"
          ? `/api/admin/${proyectoSlug}/productos`
          : `/api/admin/${proyectoSlug}/productos/${producto?.id}`;

      const method = modo === "crear" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || "Error al guardar producto");
      }

      const json = (await res.json()) as { data: { id: string } };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const productoId = json.data.id;

      // Sincronizar variantes si es edicion
      if (modo === "editar" && producto?.id) {
        await sincronizarVariantes(producto.id);
      } else if (modo === "crear" && variantes.length > 0 && productoId) {
        await Promise.all(
          variantes.map((v) =>
            fetch(`/api/admin/${proyectoSlug}/productos/${productoId}/variantes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(v),
            })
          )
        );
      }

      toast({ tipo: "exito", mensaje: `Producto ${modo === "crear" ? "creado" : "actualizado"} exitosamente` });

      if (modo === "crear") {
        router.push(`/dashboard/${proyectoSlug}/productos`);
      }
    } catch (err) {
      toast({
        tipo: "error",
        mensaje: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function sincronizarVariantes(productoId: string) {
    // Para simplificar: en edicion, las variantes se manejan con la API directa
    // Este hook se llamaria desde el tab de variantes
    // Por ahora, no hacemos nada aqui - el tab de variantes maneja su propio CRUD
  }

  const inputClass = "input-glass w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neon/50 transition-all";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {modo === "crear" ? "Nuevo Producto" : "Editar Producto"}
        </h1>
        <button
          onClick={guardar}
          disabled={guardando}
          className="boton-neon boton-neon-primario"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-borde-glass pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              tabActiva === tab.id
                ? "glass-activo neon-borde border-b-0"
                : "text-texto-desvanecido hover:text-texto"
            }`}
          >
            {tab.nombre}
          </button>
        ))}
      </div>

      {/* Tab General */}
      {tabActiva === "general" && (
        <div className="glass p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Nombre <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formulario.nombre}
                onChange={(e) => {
                  actualizarCampo("nombre", e.target.value);
                  if (modo === "crear" && !formulario.slug) {
                    actualizarCampo("slug", generarSlug(e.target.value));
                  }
                }}
                className={inputClass}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Slug <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formulario.slug}
                onChange={(e) => actualizarCampo("slug", e.target.value)}
                className={inputClass}
                placeholder="slug-del-producto"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Descripcion</label>
            <textarea
              value={formulario.descripcion}
              onChange={(e) => actualizarCampo("descripcion", e.target.value)}
              className={inputClass + " min-h-[100px] resize-y"}
              placeholder="Descripcion del producto..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Precio <span className="text-error">*</span>
              </label>
              <input
                type="number"
                value={formulario.precio}
                onChange={(e) =>
                  actualizarCampo("precio", parseInt(e.target.value || "0", 10))
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Precio promo</label>
              <input
                type="number"
                value={formulario.precioPromo ?? ""}
                onChange={(e) =>
                  actualizarCampo(
                    "precioPromo",
                    e.target.value === "" ? null : parseInt(e.target.value, 10)
                  )
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Stock</label>
              <input
                type="number"
                value={formulario.stock}
                onChange={(e) =>
                  actualizarCampo("stock", parseInt(e.target.value || "0", 10))
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">SKU</label>
              <input
                type="text"
                value={formulario.sku}
                onChange={(e) => actualizarCampo("sku", e.target.value)}
                className={inputClass}
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Peso (gr)</label>
              <input
                type="number"
                value={formulario.peso ?? ""}
                onChange={(e) =>
                  actualizarCampo(
                    "peso",
                    e.target.value === "" ? null : parseInt(e.target.value, 10)
                  )
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Dimensiones</label>
              <input
                type="text"
                value={formulario.dimensiones}
                onChange={(e) => actualizarCampo("dimensiones", e.target.value)}
                className={inputClass}
                placeholder="10x20x5 cm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formulario.activo}
                onChange={(e) => actualizarCampo("activo", e.target.checked)}
                className="w-4 h-4 accent-neon"
              />
              <span className="text-sm">Producto activo</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab Categorias */}
      {tabActiva === "categorias" && (
        <div className="glass p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold">Categorias</h3>
          <SelectorCategorias
            proyectoSlug={proyectoSlug}
            seleccionadas={formulario.categoriaIds}
            alCambiar={(ids) => actualizarCampo("categoriaIds", ids)}
          />
        </div>
      )}

      {/* Tab Atributos */}
      {tabActiva === "atributos" && (
        <div className="glass p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold">Atributos del proyecto</h3>
          <FormularioAtributosDinamicos
            configAtributos={configAtributos}
            valoresIniciales={formulario.atributos}
            alCambiar={(vals) => actualizarCampo("atributos", vals)}
          />
        </div>
      )}

      {/* Tab Variantes */}
      {tabActiva === "variantes" && (
        <div className="glass p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold">Variantes</h3>
          <EditorVariantes
            variantes={variantes}
            alCambiar={setVariantes}
            configAtributos={configAtributos}
          />
        </div>
      )}
    </div>
  );
}
