"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface Proyecto {
  id: string;
  slug: string;
  nombre: string;
}

export default function DashboardProyectoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const [proyectoNombre, setProyectoNombre] = useState<string>("");
  const proyectoSlug = (params?.proyecto as string) || "";

  useEffect(() => {
    if (!proyectoSlug) return;

    async function cargarProyecto() {
      try {
        const res = await fetch(`/api/admin/proyectos`);
        if (!res.ok) return;
        const json = (await res.json()) as { data: Proyecto[] };
        const proyecto = json.data?.find((p) => p.slug === proyectoSlug);
        if (proyecto) {
          setProyectoNombre(proyecto.nombre);
        }
      } catch {
        // Silencioso
      }
    }

    cargarProyecto();
  }, [proyectoSlug]);

  return (
    <div className="flex min-h-screen">
      <Sidebar proyectoSlug={proyectoSlug} proyectoNombre={proyectoNombre} />
      <div className="flex-1 ml-64 max-md:ml-16">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
