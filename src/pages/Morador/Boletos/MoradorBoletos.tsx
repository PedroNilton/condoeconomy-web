import { useState, useEffect } from 'react';
import { Loader2, Copy, Download, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

interface Boleto {
  id: string;
  unidadeTexto: string;
  morador: string;
  valor: number;
  dataVencimento: string;
  status: string;
  linhaDigitavel: string;
}

export function MoradorBoletos() {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchBoletos();
  }, []);

  const fetchBoletos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/boletos');
      const list = response.data;
      // Ordenar por data de vencimento (mais recentes primeiro)
      list.sort((a: Boleto, b: Boleto) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime());
      
      setBoletos(list);
      
      // Auto-expand the most recent pending boleto
      const pending = list.find((b: Boleto) => b.status === 'PENDENTE');
      if (pending) {
        setExpandedId(pending.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + date.getFullYear();
  };

  const isVencido = (vencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    return new Date(vencimento) < hoje;
  };

  const getBadgeStyle = (status: string, vencimento: string) => {
    if (status === 'PAGO') return 'bg-emerald-500/10 text-emerald-500';
    if (isVencido(vencimento)) return 'bg-rose-500/10 text-rose-500';
    return 'bg-orange-500/10 text-orange-500';
  };

  const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#09090b] text-white">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium">Financeiro</p>
          <h2 className="text-white text-2xl font-bold tracking-tight">Meus boletos</h2>
        </div>
        <div className="w-10 h-10 bg-[#18181b] border border-white/5 rounded-2xl flex items-center justify-center text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
      </header>

      {/* Subheader summary */}
      <div className="px-6 pb-6">
        <div className="bg-[#18181b] rounded-xl px-4 py-3 flex items-center text-sm">
          <span className="font-bold text-white mr-2">2026</span>
          <span className="text-slate-500">• {boletos.length} cobranças</span>
        </div>
      </div>

      {/* Lista de Boletos */}
      <div className="px-6 pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : boletos.length === 0 ? (
          <div className="bg-[#18181b] rounded-[2rem] p-8 border border-white/5 text-center shadow-sm">
            <h3 className="text-white font-bold mb-1">Tudo certo!</h3>
            <p className="text-slate-500 text-sm">Nenhum boleto pendente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {boletos.map(boleto => {
              const vencido = boleto.status === 'PENDENTE' && isVencido(boleto.dataVencimento);
              const badgeStyle = getBadgeStyle(boleto.status, boleto.dataVencimento);
              const isExpanded = expandedId === boleto.id;
              
              let statusText = boleto.status;
              if (boleto.status === 'PENDENTE' && vencido) statusText = 'VENCIDO';

              return (
                <div 
                  key={boleto.id} 
                  onClick={() => toggleExpand(boleto.id)}
                  className="bg-[#18181b] rounded-[1.5rem] border border-white/5 overflow-hidden transition-all cursor-pointer"
                >
                  <div className="p-5 flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-base">{getMonthName(boleto.dataVencimento)}</h3>
                      <p className="text-slate-400 text-xs mt-1">
                        {boleto.status === 'PAGO' 
                          ? `pago em ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}`
                          : vencido 
                            ? 'vencido' 
                            : `vence em ${Math.ceil((new Date(boleto.dataVencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} dias`
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-white font-bold text-[15px]">{formatCurrency(boleto.valor)}</span>
                        {/* Status Badge fix as requested by user (centralized padding) */}
                        <div className="mt-1 flex justify-end">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center justify-center text-center ${badgeStyle}`}>
                            {statusText}
                          </span>
                        </div>
                      </div>
                      <div className="text-slate-500">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && boleto.status === 'PENDENTE' && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/5 mt-2 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-3">Linha Digitável</p>
                      
                      <div className="bg-[#27272a] rounded-xl p-4 mb-4">
                        <p className="font-mono text-xs text-white/90 break-all leading-relaxed">
                          {boleto.linhaDigitavel || '00190.00009 01234.567890 12345.678901 1 98760000065000'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleCopy(e, boleto.id, boleto.linhaDigitavel)}
                          className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] transition-colors rounded-xl flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white"
                        >
                          {copiedId === boleto.id ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-400" />
                              Copiar PIX
                            </>
                          )}
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-12 bg-[#27272a] hover:bg-[#3f3f46] transition-colors rounded-xl flex items-center justify-center text-slate-400"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded Content (Paid) */}
                  {isExpanded && boleto.status === 'PAGO' && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/5 mt-2 animate-in slide-in-from-top-2 duration-200">
                       <div className="bg-emerald-500/10 rounded-xl p-4 flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         <p className="text-xs text-emerald-500/90 font-medium">Pagamento processado com sucesso.</p>
                       </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
