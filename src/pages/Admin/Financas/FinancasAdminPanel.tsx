import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, FileText, Search, Loader2 } from 'lucide-react';
import api from '../../../services/api';

interface DashboardMetrics {
  receitaPrevista: number;
  receitaArrecadada: number;
  despesas: number;
  inadimplencia: number;
  unidadesInadimplentes: number;
}

interface BoletoInfo {
  id: string;
  unidade: string;
  valor: number;
  status: string;
  data: string;
}

export function FinancasAdminPanel() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todosBoletos, setTodosBoletos] = useState<BoletoInfo[]>([]);
  const [loadingBoletos, setLoadingBoletos] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // 1. Carregar metricas do dashboard
    api.get('/api/v1/financas/dashboard').then(res => {
      setMetrics(res.data);
    }).catch(err => console.error(err));

    // 2. Carregar lista completa de boletos gerados
    api.get('/api/v1/financas/boletos-gerados').then(res => {
      setTodosBoletos(res.data);
    }).catch(err => console.error(err)).finally(() => {
      setLoadingBoletos(false);
    });
  }, []);

  if (!metrics) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ds-dim" /></div>;
  }

  const { receitaPrevista, receitaArrecadada, despesas, inadimplencia, unidadesInadimplentes } = metrics;
  
  // Evitar divisao por zero
  const progressoArrecadacao = receitaPrevista > 0 ? (receitaArrecadada / receitaPrevista) * 100 : 0;

  const filteredBoletos = todosBoletos.filter(boleto => {
    const matchSearch = boleto.unidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? boleto.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getBadgeClass = (status: string) => {
    const base = "inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider";
    if (status === 'PAGO') return `${base} bg-ds-success-dim text-ds-success`;
    if (status === 'ATRASADO') return `${base} bg-ds-danger-dim text-ds-danger`;
    return `${base} bg-ds-warning-dim text-ds-warning`;
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div>
        <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Tesouraria</p>
        <h2 className="text-ds-text text-2xl font-extrabold tracking-tight flex items-center gap-2">
          Painel Financeiro
        </h2>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ds-card p-4 rounded-[16px] shadow-sm border border-ds-border flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 rounded-2xl bg-ds-success-dim border border-ds-success/20 flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-ds-success" />
          </div>
          <p className="text-[10px] text-ds-dim font-bold uppercase tracking-wider">Arrecadado</p>
          <p className="text-lg font-bold text-ds-text mt-0.5">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaArrecadada)}
          </p>
        </div>

        <div className="bg-ds-card p-4 rounded-[16px] shadow-sm border border-ds-border flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 rounded-2xl bg-ds-danger-dim border border-ds-danger/20 flex items-center justify-center mb-2">
            <TrendingDown className="w-5 h-5 text-ds-danger" />
          </div>
          <p className="text-[10px] text-ds-dim font-bold uppercase tracking-wider">Despesas</p>
          <p className="text-lg font-bold text-ds-text mt-0.5">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesas)}
          </p>
        </div>
      </div>

      {/* Inadimplência Alert */}
      <div className="bg-ds-danger-dim border border-ds-danger/20 rounded-[16px] p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-ds-danger shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[14.5px] font-bold text-ds-text">Inadimplência: {inadimplencia}%</h4>
          <p className="text-[13px] text-ds-dim mt-1 font-medium">
            {unidadesInadimplentes} unidades estão com boletos em atraso neste mês.
          </p>
        </div>
      </div>

      {/* ProgressBar Receita */}
      <div className="bg-ds-card p-5 rounded-[16px] shadow-sm border border-ds-border">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ds-dim">Meta de Arrecadação</p>
            <p className="text-[15px] font-bold text-ds-text mt-0.5">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaPrevista)}
            </p>
          </div>
          <span className="text-[13px] font-bold text-ds-success">
            {Math.round(progressoArrecadacao)}%
          </span>
        </div>
        <div className="w-full bg-ds-bg border border-ds-border rounded-full h-3 overflow-hidden">
          <div 
            className="bg-ds-success h-3 rounded-full transition-all duration-1000" 
            style={{ width: `${Math.min(progressoArrecadacao, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Gestão de Boletos Completa */}
      <div className="mt-8 pt-6 border-t border-ds-border">
        <h3 className="text-lg font-bold text-ds-text mb-4">Gestão de Inadimplência e Boletos</h3>
        
        {/* Filtros */}
        <div className="flex flex-col gap-3 bg-ds-card rounded-[16px] shadow-sm border border-ds-border p-4 mb-4">
          <div className="relative">
            <Search className="w-5 h-5 text-ds-dim absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por unidade (Ex: 101)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-ds-bg border border-ds-border rounded-lg focus:ring-2 focus:ring-ds-primary outline-none text-[14px] text-ds-text placeholder:text-ds-dim transition-all"
            />
          </div>
          <select 
            className="bg-ds-bg text-ds-text border border-ds-border rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-ds-primary outline-none transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
            <option value="ATRASADO">Atrasado / Vencido</option>
          </select>
        </div>

        {/* Lista de Boletos */}
        <div className="bg-ds-card rounded-[16px] shadow-sm border border-ds-border overflow-hidden divide-y divide-ds-border">
          {loadingBoletos ? (
             <div className="p-8 text-center text-ds-dim flex flex-col items-center">
               <Loader2 className="w-6 h-6 animate-spin mb-2" />
               <p className="text-[14px]">Carregando lista de boletos...</p>
             </div>
          ) : filteredBoletos.length === 0 ? (
             <div className="p-8 text-center text-ds-dim text-[14px]">
               Nenhum boleto encontrado com os filtros atuais.
             </div>
          ) : (
            filteredBoletos.map(boleto => (
              <div key={boleto.id} className="p-4 flex items-center justify-between hover:bg-ds-bg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    boleto.status === 'PAGO' ? 'bg-ds-success-dim border-ds-success/20 text-ds-success' :
                    boleto.status === 'ATRASADO' ? 'bg-ds-danger-dim border-ds-danger/20 text-ds-danger' :
                    'bg-ds-warning-dim border-ds-warning/20 text-ds-warning'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[14.5px] font-bold text-ds-text">{boleto.unidade}</p>
                    <p className="text-[11px] text-ds-dim font-semibold">Vencimento: {boleto.data}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14.5px] font-bold text-ds-text">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boleto.valor)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <span className={getBadgeClass(boleto.status)}>
                      {boleto.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
