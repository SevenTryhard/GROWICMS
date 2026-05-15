"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardProyectoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const [proyectoNombre, setProyectoNombre] = useState<string>("");
  const proyectoSlug = (params?.proyecto as string) || "";

  useEffect(() => {
    if (!proyectoSlug) return;
    fetch(`/api/admin/proyectos`)
      .then((res) => res.json())
      .then(({ data }) => {
        const proyecto = data?.find((p: { slug: string }) => p.slug === proyectoSlug);
        if (proyecto) {
          setProyectoNombre(proyecto.nombre);
        }
      })
      .catch(() => {
        // Silencioso
      });
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
