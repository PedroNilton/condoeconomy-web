import { useState, useEffect } from 'react';
import { Package, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export function DashboardHome() {
  const [encomendas, setEncomendas] = useState(0);
  const [visitantes, setVisitantes] = useState(0);
  const [avisos, setAvisos] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Visão Geral</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight">Painel de Controle</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1 */}
        <button 
          onClick={() => navigate('/portaria/encomendas')}
          className="bg-ds-card p-6 rounded-[16px] border border-ds-border shadow-sm flex items-center gap-4 hover:border-ds-border-strong hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-ds-primary"
        >
          <div className="bg-ds-primary-dim border border-ds-primary/20 p-3.5 rounded-xl text-ds-primary">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[12.5px] font-bold text-ds-dim uppercase tracking-wider">Encomendas Aguardando</p>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-ds-primary mt-1" /> : (
              <p className="text-2xl font-extrabold text-ds-text mt-0.5">{encomendas}</p>
            )}
          </div>
        </button>

        {/* Card 2 */}
        <button 
          onClick={() => navigate('/portaria/visitantes')}
          className="bg-ds-card p-6 rounded-[16px] border border-ds-border shadow-sm flex items-center gap-4 hover:border-ds-border-strong hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-ds-success"
        >
          <div className="bg-ds-success-dim border border-ds-success/20 p-3.5 rounded-xl text-ds-success">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[12.5px] font-bold text-ds-dim uppercase tracking-wider">Visitantes Hoje</p>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-ds-success mt-1" /> : (
              <p className="text-2xl font-extrabold text-ds-text mt-0.5">{visitantes}</p>
            )}
          </div>
        </button>

        {/* Card 3 */}
        <button 
          onClick={() => navigate('/portaria/chamados')}
          className="bg-ds-card p-6 rounded-[16px] border border-ds-border shadow-sm flex items-center gap-4 hover:border-ds-border-strong hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-ds-warning"
        >
          <div className="bg-ds-warning-dim border border-ds-warning/20 p-3.5 rounded-xl text-ds-warning">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[12.5px] font-bold text-ds-dim uppercase tracking-wider">Ouvidoria Pendente</p>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-ds-warning mt-1" /> : (
              <p className="text-2xl font-extrabold text-ds-text mt-0.5">{avisos}</p>
            )}
          </div>
        </button>

      </div>
    </div>
  );
}
