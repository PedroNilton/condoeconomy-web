import { useState, useEffect } from 'react';
import { Package, Users, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

export function DashboardHome() {
  const [encomendas, setEncomendas] = useState(0);
  const [visitantes, setVisitantes] = useState(0);
  const [avisos, setAvisos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // 1. Encomendas Aguardando
        const resEnc = await api.get('/api/v1/encomendas');
        const aguardando = resEnc.data.filter((e: any) => e.status === 'AGUARDANDO_RETIRADA').length;
        setEncomendas(aguardando);

        // 2. Visitantes Hoje
        const hoje = new Date().toISOString().split('T')[0];
        const resVis = await api.get(`/api/v1/visitantes?dataVisita=${hoje}`);
        setVisitantes(resVis.data.length);

        // 3. Avisos (Chamados Abertos)
        const resCham = await api.get('/api/v1/chamados');
        const abertos = resCham.data.filter((c: any) => c.status === 'ABERTO').length;
        setAvisos(abertos);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-gray-800">Visão Geral</h3>
        <p className="text-gray-500 mt-1">Bem-vindo ao painel da portaria do Condomínio Jardins.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Encomendas Aguardando</p>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600 mt-1" /> : (
              <p className="text-2xl font-bold text-gray-900">{encomendas}</p>
            )}
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-700">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Visitantes Hoje</p>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-green-600 mt-1" /> : (
              <p className="text-2xl font-bold text-gray-900">{visitantes}</p>
            )}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-700">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ouvidoria Pendente</p>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-orange-600 mt-1" /> : (
              <p className="text-2xl font-bold text-gray-900">{avisos}</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
