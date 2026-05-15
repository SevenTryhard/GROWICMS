"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function IniciarSesionPage() {
  const [paso, establecerPaso] = useState<"telefono" | "codigo" | "nombre">("telefono");
  const [telefono, establecerTelefono] = useState("");
  const [codigo, establecerCodigo] = useState("");
  const [nombre, establecerNombre] = useState("");
  const [tokenVerificacion, establecerTokenVerificacion] = useState("");
  const [cargando, establecerCargando] = useState(false);
  const [esRegistro, establecerEsRegistro] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function enviarCodigo() {
    if (!telefono) {
      toast({ tipo: "error", mensaje: "Ingresa tu numero de telefono" });
      return;
    }
    establecerCargando(true);
    try {
      const respuesta = await fetch("/api/auth/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono }),
      });
      const datos = (await respuesta.json()) as Record<string, string | undefined>;
      if (!respuesta.ok) {
        if (respuesta.status === 409) {
          // Telefono ya registrado, intentar login
          const loginResp = await fetch("/api/auth/iniciar-sesion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telefono }),
          });
          const loginDatos = (await loginResp.json()) as Record<string, string | undefined>;
          if (!loginResp.ok) throw new Error(loginDatos.error || "Error al enviar codigo");
          establecerTokenVerificacion(loginDatos.tokenVerificacion || "");
          establecerEsRegistro(false);
          toast({ tipo: "info", mensaje: `Codigo: ${loginDatos.codigoDev || "Revisa tu telefono"}` });
          establecerPaso("codigo");
          return;
        }
        throw new Error(datos.error || "Error al enviar codigo");
      }
      establecerTokenVerificacion(datos.tokenVerificacion || "");
      establecerEsRegistro(true);
      toast({ tipo: "info", mensaje: `Codigo: ${datos.codigoDev || "Revisa tu telefono"}` });
      establecerPaso("codigo");
    } catch (error) {
      toast({ tipo: "error", mensaje: error instanceof Error ? error.message : "Error desconocido" });
    } finally {
      establecerCargando(false);
    }
  }

  async function verificarCodigo() {
    if (!codigo || !tokenVerificacion) return;
    establecerCargando(true);
    try {
      const respuesta = await fetch("/api/auth/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, codigo, tokenVerificacion, nombre: esRegistro ? nombre : undefined }),
      });
      const datos = (await respuesta.json()) as Record<string, string | undefined>;
      if (!respuesta.ok) throw new Error(datos.error || "Error al verificar");
      toast({ tipo: "exito", mensaje: "Bienvenido a GROWICMS" });
      router.push("/dashboard");
    } catch (error) {
      toast({ tipo: "error", mensaje: error instanceof Error ? error.message : "Error desconocido" });
    } finally {
      establecerCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold neon-texto mb-2">GROWICMS</h1>
          <p className="text-texto-secundario text-sm">{paso === "telefono" ? "Ingresa tu telefono para continuar" : "Ingresa el codigo de verificacion"}</p>
        </div>

        {paso === "telefono" && (
          <div className="space-y-4 animate-slide-up">
            <div>
              <label className="block text-sm mb-1">Telefono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => establecerTelefono(e.target.value)}
                placeholder="+5491112345678"
                className="input-glass"
              />
              <p className="text-xs text-texto-desvanecido mt-1">Formato internacional: +codigo_pais numero</p>
            </div>
            <button
              onClick={enviarCodigo}
              disabled={cargando}
              className="boton-neon boton-neon-primario w-full"
            >
              {cargando ? "Enviando..." : "Continuar"}
            </button>
          </div>
        )}

        {paso === "codigo" && (
          <div className="space-y-4 animate-slide-up">
            <div>
              <label className="block text-sm mb-1">Codigo de verificacion</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => establecerCodigo(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="input-glass text-center text-lg tracking-widest"
              />
            </div>
            {esRegistro && (
              <div>
                <label className="block text-sm mb-1">Nombre (opcional)</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => establecerNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="input-glass"
                />
              </div>
            )}
            <button
              onClick={verificarCodigo}
              disabled={cargando || codigo.length < 6}
              className="boton-neon boton-neon-primario w-full"
            >
              {cargando ? "Verificando..." : "Verificar"}
            </button>
            <button
              onClick={() => establecerPaso("telefono")}
              className="boton-neon w-full text-sm"
            >
              Cambiar telefono
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
