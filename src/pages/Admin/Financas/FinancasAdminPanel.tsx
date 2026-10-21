import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, FileText, Search, Loader2, ShieldCheck, CheckCircle2, X, Lock } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

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

interface EventoAuditoria {
  id: string;
  usuarioEmail: string;
  papel: string;
  evento: string;
  severidade: string;
  ipOrigem: string;
  detalhes: string;
  criadoEm: string;
}

export function FinancasAdminPanel() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todosBoletos, setTodosBoletos] = useState<BoletoInfo[]>([]);
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  const [loadingBoletos, setLoadingBoletos] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Step-Up Auth para baixa manual de boleto
  const [boletoParaBaixa, setBoletoParaBaixa] = useState<BoletoInfo | null>(null);
  const [senhaStepUp, setSenhaStepUp] = useState('');
  const [erroStepUp, setErroStepUp] = useState<string | null>(null);
  const [confirmandoBaixa, setConfirmandoBaixa] = useState(false);

  const carregarDadosFinanceiros = () => {
    api.get('/api/v1/financas/dashboard').then(res => {
      setMetrics(res.data);
    }).catch(err => console.error(err));

    api.get('/api/v1/financas/boletos-gerados').then(res => {
      setTodosBoletos(res.data);
    }).catch(err => console.error(err)).finally(() => {
      setLoadingBoletos(false);
    });

    api.get('/api/v1/financas/auditoria-seguranca').then(res => {
      if (Array.isArray(res.data)) {
        setAuditoria(res.data);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  const handleConfirmarBaixaManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boletoParaBaixa) return;
    setErroStepUp(null);

    if (!senhaStepUp.trim()) {
      setErroStepUp('Informe sua senha atual de Síndico/Admin para autorizar a baixa.');
      return;
    }
    if (contemAmeacas(senhaStepUp)) {
      setErroStepUp('Caracteres inválidos detectados.');
      return;
    }

    setConfirmandoBaixa(true);
    try {
      const senhaLimpa = sanitizarEntrada(senhaStepUp, 128);
      await api.put(
        `/api/v1/boletos/${boletoParaBaixa.id}/baixar`,
        { senhaConfirmacao: senhaLimpa },
        { headers: { 'X-Step-Up-Password': senhaLimpa } }
      );
      setBoletoParaBaixa(null);
      setSenhaStepUp('');
      carregarDadosFinanceiros();
    } catch (err: any) {
      setErroStepUp(err.response?.data?.message || 'Senha incorreta ou falha ao registrar baixa manual.');
    } finally {
      setConfirmandoBaixa(false);
    }
  };

  if (!metrics) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ds-dim" /></div>;
  }

  const { receitaPrevista, receitaArrecadada, despesas, inadimplencia, unidadesInadimplentes } = metrics;
  
  // Evitar divisao por zero
  const progressoArrecadacao = receitaPrevista > 0 ? (receitaArrecadada / receitaPrevista) * 100 : 0;

  const termoLimpo = sanitizarEntrada(searchTerm, 50).toLowerCase();
  const filteredBoletos = todosBoletos.filter(boleto => {
    const matchSearch = boleto.unidade.toLowerCase().includes(termoLimpo);
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
    <div className="space-y-6 h-full overflow-y-auto no-scrollbar pb-16">
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
              <div key={boleto.id} className="p-4 flex items-center justify-between hover:bg-ds-bg transition-colors gap-3">
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
                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-[14.5px] font-bold text-ds-text">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boleto.valor)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={getBadgeClass(boleto.status)}>
                      {boleto.status}
                    </span>
                    {boleto.status !== 'PAGO' && (
                      <button
                        onClick={() => {
                          setBoletoParaBaixa(boleto);
                          setSenhaStepUp('');
                          setErroStepUp(null);
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-ds-primary text-ds-primary-ink hover:brightness-110 transition flex items-center gap-1"
                        title="Dar baixa manual com confirmação de senha"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Dar Baixa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trilha de Auditoria Forense do Condomínio */}
      {auditoria.length > 0 && (
        <div className="mt-8 pt-6 border-t border-ds-border">
          <h3 className="text-lg font-bold text-ds-text mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-ds-primary" />
            Trilha de Auditoria Forense (Segurança)
          </h3>
          <div className="bg-ds-card rounded-[16px] shadow-sm border border-ds-border divide-y divide-ds-border overflow-hidden">
            {auditoria.slice(0, 8).map((ev) => (
              <div key={ev.id} className="p-3.5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-ds-text">{ev.evento}</span>
                  <span className={`font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    ev.severidade === 'CRITICO' ? 'bg-ds-danger-dim text-ds-danger' :
                    ev.severidade === 'ALERTA' ? 'bg-ds-warning-dim text-ds-warning' :
                    'bg-ds-success-dim text-ds-success'
                  }`}>
                    {ev.severidade}
                  </span>
                </div>
                <p className="text-[12px] text-ds-dim">{ev.detalhes}</p>
                <div className="flex items-center justify-between text-[10.5px] text-ds-dim font-mono mt-0.5">
                  <span>{ev.usuarioEmail} ({ev.ipOrigem})</span>
                  <span>{new Date(ev.criadoEm).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Step-Up Authentication para Baixa Manual */}
      {boletoParaBaixa && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-sm p-5 shadow-xl relative">
            <button
              onClick={() => setBoletoParaBaixa(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-text"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-ds-primary mb-2">
              <Lock className="w-5 h-5" />
              <h4 className="text-[16px] font-extrabold text-ds-text">Confirmação Step-Up Auth</h4>
            </div>
            <p className="text-[12.5px] text-ds-dim leading-relaxed mb-4">
              Para registrar a baixa manual de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boletoParaBaixa.valor)}</strong> da unidade <strong>{boletoParaBaixa.unidade}</strong>, confirme sua senha atual de Síndico:
            </p>

            <form onSubmit={handleConfirmarBaixaManual} className="space-y-3">
              {erroStepUp && (
                <div className="p-2.5 rounded-lg bg-ds-danger-dim text-ds-danger text-[12px] font-medium">
                  {erroStepUp}
                </div>
              )}
              <input
                type="password"
                value={senhaStepUp}
                onChange={(e) => setSenhaStepUp(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-3.5 py-2.5 rounded-xl bg-ds-bg border border-ds-border text-ds-text text-[14px] outline-none focus:ring-2 focus:ring-ds-primary"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={confirmandoBaixa}
                className="w-full py-3 rounded-xl bg-ds-success text-ds-bg font-bold text-[14px] flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-60"
              >
                {confirmandoBaixa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar e Dar Baixa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
