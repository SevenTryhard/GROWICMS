import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold neon-texto">GROWICMS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/iniciar-sesion" className="boton-neon boton-neon-primario">
            Iniciar sesion
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Tu tienda, tu <span className="neon-texto">forma</span>
        </h1>
        <p className="text-xl text-texto-secundario max-w-2xl mb-8">
          GROWICMS es un CMS de comercio electronico potente, flexible y con
          tematica neon glassmorphism. Gestiona productos, categorias, atributos,
          promociones y analytics desde un solo lugar.
        </p>
        <div className="flex gap-4">
          <Link href="/iniciar-sesion" className="boton-neon boton-neon-primario text-lg px-6 py-3">
            Empezar ahora
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 max-w-4xl">
          {[
            { titulo: "Productos", desc: "Catalogo completo con variantes e imagenes" },
            { titulo: "Categorias", desc: "Jerarquia flexible con subcategorias" },
            { titulo: "Atributos", desc: "Tipos variados: texto, color, medida, select" },
            { titulo: "Promociones", desc: "Descuentos y campañas con fechas" },
            { titulo: "Analytics", desc: "Metricas de visitas y conversiones" },
            { titulo: "Webhooks", desc: "Integraciones con APIs externas" },
          ].map((f) => (
            <div key={f.titulo} className="glass p-6 text-left">
              <h3 className="font-semibold mb-2">{f.titulo}</h3>
              <p className="text-sm text-texto-secundario">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="glass px-6 py-4 text-center text-sm text-texto-desvanecido">
        © 2026 GROWICMS. Todos los derechos reservados.
      </footer>
    </div>
  );
}
