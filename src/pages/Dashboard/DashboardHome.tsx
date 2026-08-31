import { Package, Users, AlertCircle } from 'lucide-react';

export function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-gray-800">Visão Geral</h3>
        <p className="text-gray-500 mt-1">Bem-vindo ao painel da portaria do Condomínio Jardins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Encomendas Aguardando</p>
            <p className="text-2xl font-bold text-gray-900">14</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-700">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Visitantes Hoje</p>
            <p className="text-2xl font-bold text-gray-900">32</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-700">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Avisos Pendentes</p>
            <p className="text-2xl font-bold text-gray-900">2</p>
          </div>
        </div>

      </div>
    </div>
  );
}
