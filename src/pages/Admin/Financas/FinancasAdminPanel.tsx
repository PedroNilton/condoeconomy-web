import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, FileText, Search, Loader2 } from 'lucide-react';
import api from '../../../services/api';

interface BoletoResumo {
  id: string;
  unidade: string;
  valor: number;
  status: string;
  data: string;
}

interface DashboardMetrics {
  receitaPrevista: number;
  receitaArrecadada: number;
  despesas: number;
  inadimplencia: number;
  unidadesInadimplentes: number;
  boletosRecentes: BoletoResumo[];
}

export function FinancasAdminPanel() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todosBoletos, setTodosBoletos] = useState<BoletoResumo[]>([]);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Fetch metrics
    api.get('/api/v1/financas/dashboard')
      .then(res => setMetrics(res.data))
      .catch(err => console.error(err));

    // Fetch full boletos list
    setLoadingBoletos(true);
    api.get('/api/v1/financas/boletos')
      .then(res => setTodosBoletos(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingBoletos(false));
  }, []);

  if (!metrics) {
    return <div className="p-4 text-center">Carregando painel financeiro...</div>;
  }

  const { receitaPrevista, receitaArrecadada, despesas, inadimplencia, unidadesInadimplentes } = metrics;
  
  // Evitar divisao por zero
  const progressoArrecadacao = receitaPrevista > 0 ? (receitaArrecadada / receitaPrevista) * 100 : 0;

  const filteredBoletos = todosBoletos.filter(boleto => {
    const matchSearch = boleto.unidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? boleto.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Painel Financeiro
        </h2>
        <p className="text-xs text-gray-500 mt-1">Resumo do mês atual</p>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Arrecadado</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaArrecadada)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Despesas</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesas)}
          </p>
        </div>
      </div>

      {/* Inadimplência Alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-orange-800">Inadimplência: {inadimplencia}%</h4>
          <p className="text-xs text-orange-600 mt-1">
            {unidadesInadimplentes} unidades estão com boletos em atraso neste mês.
          </p>
        </div>
      </div>

      {/* ProgressBar Receita */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs font-semibold text-gray-500">Meta de Arrecadação</p>
            <p className="text-sm font-bold text-gray-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaPrevista)}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600">
            {Math.round(progressoArrecadacao)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${Math.min(progressoArrecadacao, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Gestão de Boletos Completa */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Gestão de Inadimplência e Boletos</h3>
        
        {/* Filtros */}
        <div className="flex flex-col gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por unidade (Ex: 101, Amorgos)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none text-sm"
            />
          </div>
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {loadingBoletos ? (
             <div className="p-8 text-center text-gray-500 flex flex-col items-center">
               <Loader2 className="w-6 h-6 animate-spin mb-2" />
               Carregando lista de boletos...
             </div>
          ) : filteredBoletos.length === 0 ? (
             <div className="p-8 text-center text-gray-500">
               Nenhum boleto encontrado com os filtros atuais.
             </div>
          ) : (
            filteredBoletos.map(boleto => (
              <div key={boleto.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    boleto.status === 'PAGO' ? 'bg-green-100 text-green-600' :
                    boleto.status === 'ATRASADO' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{boleto.unidade}</p>
                    <p className="text-[10px] text-gray-500">Vencimento: {boleto.data}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boleto.valor)}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                    boleto.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                    boleto.status === 'ATRASADO' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {boleto.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
