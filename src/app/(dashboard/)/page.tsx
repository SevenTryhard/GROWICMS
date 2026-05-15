import { obtenerDb } from "@/lib/db";

export default async function DashboardPage() {
  const totalProductos = 0;
  const totalCategorias = 0;

  try {
    obtenerDb();
    // Estos conteos se harán cuando haya datos; por ahora mostramos placeholders
  } catch {
    // DB no disponible en build time
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-6">
          <p className="text-texto-desvanecido text-sm">Productos</p>
          <p className="text-3xl font-bold neon-texto mt-1">{totalProductos}</p>
        </div>
        <div className="glass p-6">
          <p className="text-texto-desvanecido text-sm">Categorias</p>
          <p className="text-3xl font-bold neon-texto mt-1">{totalCategorias}</p>
        </div>
        <div className="glass p-6">
          <p className="text-texto-desvanecido text-sm">Pedidos</p>
          <p className="text-3xl font-bold neon-texto mt-1">0</p>
        </div>
        <div className="glass p-6">
          <p className="text-texto-desvanecido text-sm">Visitas</p>
          <p className="text-3xl font-bold neon-texto mt-1">0</p>
        </div>
      </div>

      <div className="glass p-6">
        <h3 className="text-lg font-semibold mb-4">Actividad reciente</h3>
        <p className="text-texto-secundario text-sm">No hay actividad reciente.</p>
      </div>
    </div>
  );
}
