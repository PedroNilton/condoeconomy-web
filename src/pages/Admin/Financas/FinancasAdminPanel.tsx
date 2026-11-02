import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, FileText, Search, Loader2, ShieldCheck, CheckCircle2, X, Lock, Plus, DollarSign, Calendar, Printer } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface ItemBalancete {
  descricao: string;
  valor: number;
  data: string;
  tipo: 'RECEITA' | 'DESPESA';
}

interface BalanceteData {
  mes: number;
  ano: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoOperacional: number;
  totalBoletosEmitidos: number;
  totalBoletosPagos: number;
  totalBoletosInadimplentes: number;
  taxaAdimplencia: number;
  receitas: ItemBalancete[];
  despesas: ItemBalancete[];
}

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

interface DespesaInfo {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: string;
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
  const [despesasLista, setDespesasLista] = useState<DespesaInfo[]>([]);
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  
  const [loadingBoletos, setLoadingBoletos] = useState(true);
  const [loadingDespesas, setLoadingDespesas] = useState(true);
  const [activeTab, setActiveTab] = useState<'BOLETOS' | 'DESPESAS' | 'AUDITORIA'>('BOLETOS');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Step-Up Auth para baixa manual de boleto
  const [boletoParaBaixa, setBoletoParaBaixa] = useState<BoletoInfo | null>(null);
  const [senhaStepUp, setSenhaStepUp] = useState('');
  const [erroStepUp, setErroStepUp] = useState<string | null>(null);
  const [confirmandoBaixa, setConfirmandoBaixa] = useState(false);

  // Modal Emissão de Novo Boleto
  const [isEmissaoOpen, setIsEmissaoOpen] = useState(false);
  const [novaUnidade, setNovaUnidade] = useState('');
  const [novoMorador, setNovoMorador] = useState('');
  const [novaCompetencia, setNovaCompetencia] = useState('11/2026');
  const [novoValor, setNovoValor] = useState('650.00');
  const [novoVencimento, setNovoVencimento] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [emitindo, setEmitindo] = useState(false);
  const [erroEmissao, setErroEmissao] = useState('');

  // Modal Cadastro de Nova Despesa
  const [isNovaDespesaOpen, setIsNovaDespesaOpen] = useState(false);
  const [novaDescricaoDespesa, setNovaDescricaoDespesa] = useState('');
  const [novoValorDespesa, setNovoValorDespesa] = useState('');
  const [novoVencimentoDespesa, setNovoVencimentoDespesa] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [novoStatusDespesa, setNovoStatusDespesa] = useState<'PENDENTE' | 'PAGO'>('PENDENTE');
  const [salvandoDespesa, setSalvandoDespesa] = useState(false);
  const [erroDespesa, setErroDespesa] = useState('');

  // Modal Balancete Mensal
  const [isBalanceteOpen, setIsBalanceteOpen] = useState(false);
  const [balanceteMes, setBalanceteMes] = useState<number>(new Date().getMonth() + 1);
  const [balanceteAno, setBalanceteAno] = useState<number>(new Date().getFullYear());
  const [balanceteData, setBalanceteData] = useState<BalanceteData | null>(null);
  const [carregandoBalancete, setCarregandoBalancete] = useState(false);

  const carregarBalancete = async (m = balanceteMes, a = balanceteAno) => {
    setCarregandoBalancete(true);
    try {
      const res = await api.get(`/api/v1/financas/balancete?mes=${m}&ano=${a}`);
      setBalanceteData(res.data);
    } catch (err) {
      console.error('Erro ao carregar balancete:', err);
    } finally {
      setCarregandoBalancete(false);
    }
  };

  const carregarDadosFinanceiros = () => {
    api.get('/api/v1/financas/dashboard').then(res => {
      setMetrics(res.data);
    }).catch(err => console.error(err));

    api.get('/api/v1/financas/boletos-gerados').then(res => {
      setTodosBoletos(Array.isArray(res.data) ? res.data : []);
    }).catch(err => console.error(err)).finally(() => {
      setLoadingBoletos(false);
    });

    api.get('/api/v1/financas/despesas').then(res => {
      setDespesasLista(Array.isArray(res.data) ? res.data : []);
    }).catch(err => console.error(err)).finally(() => {
      setLoadingDespesas(false);
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

  const handleEmitirBoleto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emitindo) return;
    setErroEmissao('');

    if (contemAmeacas(novaUnidade) || contemAmeacas(novoMorador) || contemAmeacas(novaCompetencia)) {
      setErroEmissao('Caracteres inválidos detectados.');
      return;
    }

    const unidadeLimpa = sanitizarEntrada(novaUnidade, 100).trim();
    const moradorLimpo = sanitizarEntrada(novoMorador, 120).trim();
    const compLimpa = sanitizarEntrada(novaCompetencia, 7).trim();
    const valorNum = Number(novoValor.replace(',', '.'));

    if (!unidadeLimpa || !moradorLimpo) {
      setErroEmissao('Preencha a unidade e o morador responsável.');
      return;
    }
    if (!/^\d{2}\/\d{4}$/.test(compLimpa)) {
      setErroEmissao('A competência deve estar no formato MM/AAAA (ex: 11/2026).');
      return;
    }
    if (isNaN(valorNum) || valorNum < 1) {
      setErroEmissao('Informe um valor válido a partir de R$ 1,00.');
      return;
    }

    setEmitindo(true);
    try {
      await api.post('/api/v1/financas/boletos', {
        unidadeTexto: unidadeLimpa,
        moradorResponsavel: moradorLimpo,
        competencia: compLimpa,
        valor: valorNum,
        dataVencimento: novoVencimento
      });
      setIsEmissaoOpen(false);
      setNovaUnidade('');
      setNovoMorador('');
      carregarDadosFinanceiros();
    } catch (err: any) {
      setErroEmissao(err.response?.data?.message || 'Erro ao emitir boleto.');
    } finally {
      setEmitindo(false);
    }
  };

  const handleCadastrarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvandoDespesa) return;
    setErroDespesa('');

    if (contemAmeacas(novaDescricaoDespesa)) {
      setErroDespesa('Caracteres não permitidos na descrição.');
      return;
    }

    const descLimpa = sanitizarEntrada(novaDescricaoDespesa, 200).trim();
    const valorNum = Number(novoValorDespesa.replace(',', '.'));

    if (!descLimpa) {
      setErroDespesa('Informe a descrição da despesa.');
      return;
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroDespesa('Informe um valor válido maior que zero.');
      return;
    }

    setSalvandoDespesa(true);
    try {
      await api.post('/api/v1/financas/despesas', {
        descricao: descLimpa,
        valor: valorNum,
        dataVencimento: novoVencimentoDespesa,
        status: novoStatusDespesa
      });
      setIsNovaDespesaOpen(false);
      setNovaDescricaoDespesa('');
      setNovoValorDespesa('');
      carregarDadosFinanceiros();
    } catch (err: any) {
      setErroDespesa(err.response?.data?.message || 'Erro ao cadastrar despesa.');
    } finally {
      setSalvandoDespesa(false);
    }
  };

  const handlePagarDespesa = async (id: string) => {
    try {
      await api.put(`/api/v1/financas/despesas/${id}/pagar`);
      carregarDadosFinanceiros();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar pagamento de despesa.');
    }
  };

  if (!metrics) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ds-dim" /></div>;
  }

  const { receitaPrevista, receitaArrecadada, despesas, inadimplencia, unidadesInadimplentes } = metrics;
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
    if (status === 'ATRASADO' || status === 'VENCIDO') return `${base} bg-ds-danger-dim text-ds-danger`;
    return `${base} bg-ds-warning-dim text-ds-warning`;
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto no-scrollbar pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Tesouraria</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight flex items-center gap-2 m-0">
            Painel Financeiro
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setErroEmissao('');
              setIsEmissaoOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Boleto</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErroDespesa('');
              setIsNovaDespesaOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-ds-bg border border-ds-border text-ds-text text-xs font-bold flex items-center gap-1.5 hover:bg-ds-card transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <DollarSign className="w-4 h-4 text-ds-danger" />
            <span>Lançar Despesa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsBalanceteOpen(true);
              carregarBalancete(balanceteMes, balanceteAno);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-ds-bg border border-ds-border text-ds-text text-xs font-bold flex items-center gap-1.5 hover:bg-ds-card transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-ds-primary" />
            <span>Prestação de Contas</span>
          </button>
        </div>
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
          <p className="text-[10px] text-ds-dim font-bold uppercase tracking-wider">Despesas Totais</p>
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

      {/* Seletor de Abas de Gestão */}
      <div className="flex gap-2 border-b border-ds-border pb-3">
        <button
          onClick={() => setActiveTab('BOLETOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BOLETOS'
              ? 'bg-ds-primary text-ds-primary-ink shadow-sm'
              : 'bg-ds-card border border-ds-border text-ds-dim hover:text-ds-text'
          }`}
        >
          Boletos e Receitas
        </button>
        <button
          onClick={() => setActiveTab('DESPESAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'DESPESAS'
              ? 'bg-ds-primary text-ds-primary-ink shadow-sm'
              : 'bg-ds-card border border-ds-border text-ds-dim hover:text-ds-text'
          }`}
        >
          Despesas do Condomínio ({despesasLista.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDITORIA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AUDITORIA'
              ? 'bg-ds-primary text-ds-primary-ink shadow-sm'
              : 'bg-ds-card border border-ds-border text-ds-dim hover:text-ds-text'
          }`}
        >
          Trilha de Auditoria
        </button>
      </div>

      {/* Aba 1: Gestão de Boletos */}
      {activeTab === 'BOLETOS' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 bg-ds-card rounded-[16px] shadow-sm border border-ds-border p-4 mb-4">
            <div className="relative flex-1">
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
                      boleto.status === 'ATRASADO' || boleto.status === 'VENCIDO' ? 'bg-ds-danger-dim border-ds-danger/20 text-ds-danger' :
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
      )}

      {/* Aba 2: Gestão de Despesas do Condomínio */}
      {activeTab === 'DESPESAS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-ds-text">Contas e Despesas Operacionais</h3>
            <button
              onClick={() => {
                setErroDespesa('');
                setIsNovaDespesaOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-ds-danger text-white text-xs font-bold hover:brightness-110 flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Despesa
            </button>
          </div>

          <div className="bg-ds-card rounded-[16px] shadow-sm border border-ds-border overflow-hidden divide-y divide-ds-border">
            {loadingDespesas ? (
              <div className="p-8 text-center text-ds-dim flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-[14px]">Carregando despesas...</p>
              </div>
            ) : despesasLista.length === 0 ? (
              <div className="p-8 text-center text-ds-dim text-[14px]">
                Nenhuma despesa cadastrada no sistema.
              </div>
            ) : (
              despesasLista.map(despesa => (
                <div key={despesa.id} className="p-4 flex items-center justify-between hover:bg-ds-bg transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      despesa.status === 'PAGO'
                        ? 'bg-ds-success-dim border-ds-success/20 text-ds-success'
                        : 'bg-ds-danger-dim border-ds-danger/20 text-ds-danger'
                    }`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[14.5px] font-bold text-ds-text">{despesa.descricao}</p>
                      <p className="text-[11px] text-ds-dim font-semibold">
                        Vencimento: {new Date(despesa.dataVencimento).toLocaleDateString('pt-BR')}
                        {despesa.dataPagamento && ` • Pago em: ${new Date(despesa.dataPagamento).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="text-[14.5px] font-bold text-ds-text">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={getBadgeClass(despesa.status)}>
                        {despesa.status}
                      </span>
                      {despesa.status !== 'PAGO' && (
                        <button
                          onClick={() => handlePagarDespesa(despesa.id)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-ds-success text-ds-bg hover:brightness-110 transition flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Registrar Pagamento
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Aba 3: Trilha de Auditoria Forense */}
      {activeTab === 'AUDITORIA' && (
        <div>
          <h3 className="text-base font-bold text-ds-text mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-ds-primary" />
            Trilha de Auditoria Forense (Segurança)
          </h3>
          <div className="bg-ds-card rounded-[16px] shadow-sm border border-ds-border divide-y divide-ds-border overflow-hidden">
            {auditoria.length === 0 ? (
              <div className="p-8 text-center text-ds-dim text-sm">Nenhum evento registrado.</div>
            ) : (
              auditoria.slice(0, 15).map((ev) => (
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
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Step-Up Authentication para Baixa Manual de Boleto */}
      {boletoParaBaixa && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-sm p-5 shadow-xl relative animate-in zoom-in-95 duration-200">
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
                <div className="p-2.5 bg-ds-danger-dim border border-ds-danger/20 rounded-xl text-xs text-ds-danger font-medium">
                  {erroStepUp}
                </div>
              )}
              <input
                type="password"
                required
                autoFocus
                placeholder="Sua senha atual"
                value={senhaStepUp}
                onChange={(e) => setSenhaStepUp(e.target.value)}
                className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBoletoParaBaixa(null)}
                  className="px-4 py-2 rounded-xl border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirmandoBaixa}
                  className="px-4 py-2 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {confirmandoBaixa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Emitir Boleto */}
      {isEmissaoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEmissaoOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-text"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-ds-primary mb-1">
              <FileText className="w-5 h-5" />
              <h3 className="text-lg font-bold text-ds-text">Emitir Boleto Condominial</h3>
            </div>
            <p className="text-xs text-ds-dim mb-4">
              Gera a cobrança com registro no gateway financeiro e linha digitável.
            </p>

            <form onSubmit={handleEmitirBoleto} className="space-y-3.5">
              {erroEmissao && (
                <div className="p-3 bg-ds-danger-dim border border-ds-danger/20 rounded-xl text-xs text-ds-danger font-medium">
                  {erroEmissao}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                  Unidade / Apartamento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apto 101 - Bloco A"
                  value={novaUnidade}
                  onChange={(e) => setNovaUnidade(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                  Morador Responsável
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do condômino"
                  value={novoMorador}
                  onChange={(e) => setNovoMorador(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                    Competência (MM/AAAA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="11/2026"
                    value={novaCompetencia}
                    onChange={(e) => setNovaCompetencia(e.target.value)}
                    className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="650.00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={novoVencimento}
                  onChange={(e) => setNovoVencimento(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEmissaoOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emitindo}
                  className="px-5 py-2.5 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {emitindo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Emitir Boleto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lançar Nova Despesa */}
      {isNovaDespesaOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsNovaDespesaOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-text"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-ds-danger mb-1">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-lg font-bold text-ds-text">Lançar Nova Despesa</h3>
            </div>
            <p className="text-xs text-ds-dim mb-4">
              Registre contas e custos operacionais do condomínio para controle financeiro.
            </p>

            <form onSubmit={handleCadastrarDespesa} className="space-y-3.5">
              {erroDespesa && (
                <div className="p-3 bg-ds-danger-dim border border-ds-danger/20 rounded-xl text-xs text-ds-danger font-medium">
                  {erroDespesa}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                  Descrição da Conta / Serviço
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Energia Elétrica - Áreas Comuns"
                  value={novaDescricaoDespesa}
                  onChange={(e) => setNovaDescricaoDespesa(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-danger focus:border-transparent placeholder:text-ds-dim transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="2450.00"
                    value={novoValorDespesa}
                    onChange={(e) => setNovoValorDespesa(e.target.value)}
                    className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-danger focus:border-transparent placeholder:text-ds-dim transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={novoStatusDespesa}
                    onChange={(e) => setNovoStatusDespesa(e.target.value as any)}
                    className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-danger"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={novoVencimentoDespesa}
                  onChange={(e) => setNovoVencimentoDespesa(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-danger focus:border-transparent transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNovaDespesaOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoDespesa}
                  className="px-5 py-2.5 rounded-xl bg-ds-danger text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {salvandoDespesa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Cadastrar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Balancete Mensal / Prestação de Contas */}
      {isBalanceteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-5 border-b border-ds-border flex items-center justify-between shrink-0 bg-ds-bg/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ds-primary/10 border border-ds-primary/20 flex items-center justify-center text-ds-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ds-text m-0">Prestação de Contas & Balancete Mensal</h3>
                  <p className="text-xs text-ds-dim font-medium m-0">
                    Demonstrativo financeiro consolidado de receitas e despesas da administração
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBalanceteOpen(false)}
                className="w-8 h-8 rounded-lg border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-text hover:bg-ds-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Filtro de Competência e Impressão */}
            <div className="p-4 border-b border-ds-border bg-ds-bg flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-ds-dim uppercase tracking-wider">Competência:</label>
                <select
                  value={balanceteMes}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setBalanceteMes(m);
                    carregarBalancete(m, balanceteAno);
                  }}
                  className="bg-ds-card text-ds-text border border-ds-border rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-ds-primary outline-none"
                >
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
                </select>

                <select
                  value={balanceteAno}
                  onChange={(e) => {
                    const a = Number(e.target.value);
                    setBalanceteAno(a);
                    carregarBalancete(balanceteMes, a);
                  }}
                  className="bg-ds-card text-ds-text border border-ds-border rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-ds-primary outline-none"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-ds-card border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-bg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-ds-primary" />
                <span>Imprimir / Exportar PDF</span>
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {carregandoBalancete ? (
                <div className="py-20 flex flex-col items-center justify-center text-ds-dim">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm font-semibold">Consolidando lançamentos contábeis...</p>
                </div>
              ) : balanceteData ? (
                <>
                  {/* Cards Resumo Contábil */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-ds-bg p-4 rounded-xl border border-ds-border">
                      <p className="text-[10.5px] font-bold text-ds-dim uppercase tracking-wider">Receitas Arrecadadas</p>
                      <p className="text-lg font-bold text-ds-success mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceteData.totalReceitas)}
                      </p>
                      <p className="text-[11px] text-ds-dim mt-0.5">{balanceteData.totalBoletosPagos} cotas quitadas</p>
                    </div>

                    <div className="bg-ds-bg p-4 rounded-xl border border-ds-border">
                      <p className="text-[10.5px] font-bold text-ds-dim uppercase tracking-wider">Despesas Realizadas</p>
                      <p className="text-lg font-bold text-ds-danger mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceteData.totalDespesas)}
                      </p>
                      <p className="text-[11px] text-ds-dim mt-0.5">{balanceteData.despesas.length} pagamentos efetuados</p>
                    </div>

                    <div className="bg-ds-bg p-4 rounded-xl border border-ds-border">
                      <p className="text-[10.5px] font-bold text-ds-dim uppercase tracking-wider">Saldo Operacional</p>
                      <p className={`text-lg font-bold mt-1 ${balanceteData.saldoOperacional >= 0 ? 'text-ds-success' : 'text-ds-danger'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceteData.saldoOperacional)}
                      </p>
                      <p className="text-[11px] text-ds-dim mt-0.5">Resultado líquido do período</p>
                    </div>

                    <div className="bg-ds-bg p-4 rounded-xl border border-ds-border">
                      <p className="text-[10.5px] font-bold text-ds-dim uppercase tracking-wider">Taxa de Adimplência</p>
                      <p className="text-lg font-bold text-ds-primary mt-1">
                        {balanceteData.taxaAdimplencia}%
                      </p>
                      <p className="text-[11px] text-ds-dim mt-0.5">{balanceteData.totalBoletosInadimplentes} cotas pendentes</p>
                    </div>
                  </div>

                  {/* Tabelas de Receitas e Despesas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Receitas */}
                    <div className="border border-ds-border rounded-xl bg-ds-bg overflow-hidden flex flex-col">
                      <div className="p-3 bg-ds-success-dim border-b border-ds-success/20 flex items-center justify-between">
                        <span className="text-xs font-bold text-ds-success uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" /> Entradas / Receitas ({balanceteData.receitas.length})
                        </span>
                        <span className="text-xs font-bold text-ds-success">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceteData.totalReceitas)}
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-ds-border">
                        {balanceteData.receitas.length === 0 ? (
                          <div className="p-6 text-center text-xs text-ds-dim">Nenhuma receita quitada nesta competência.</div>
                        ) : (
                          balanceteData.receitas.map((r, i) => (
                            <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-ds-card transition-colors">
                              <div className="pr-2">
                                <p className="font-semibold text-ds-text m-0">{r.descricao}</p>
                                <p className="text-[10.5px] text-ds-dim m-0 font-mono">Data: {r.data}</p>
                              </div>
                              <span className="font-bold text-ds-success whitespace-nowrap">
                                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Despesas */}
                    <div className="border border-ds-border rounded-xl bg-ds-bg overflow-hidden flex flex-col">
                      <div className="p-3 bg-ds-danger-dim border-b border-ds-danger/20 flex items-center justify-between">
                        <span className="text-xs font-bold text-ds-danger uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" /> Saídas / Despesas ({balanceteData.despesas.length})
                        </span>
                        <span className="text-xs font-bold text-ds-danger">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceteData.totalDespesas)}
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-ds-border">
                        {balanceteData.despesas.length === 0 ? (
                          <div className="p-6 text-center text-xs text-ds-dim">Nenhuma despesa paga registrada nesta competência.</div>
                        ) : (
                          balanceteData.despesas.map((d, i) => (
                            <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-ds-card transition-colors">
                              <div className="pr-2">
                                <p className="font-semibold text-ds-text m-0">{d.descricao}</p>
                                <p className="text-[10.5px] text-ds-dim m-0 font-mono">Data Pagamento: {d.data}</p>
                              </div>
                              <span className="font-bold text-ds-danger whitespace-nowrap">
                                - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-ds-dim text-sm">
                  Não foi possível obter dados para a competência selecionada.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-ds-border bg-ds-bg/40 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-ds-dim font-medium">
                Documento gerado automaticamente pelo sistema de gestão contábil HabitOS
              </span>
              <button
                type="button"
                onClick={() => setIsBalanceteOpen(false)}
                className="px-4 py-2 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
