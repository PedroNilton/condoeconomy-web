import { useState, useEffect } from 'react';
import { Loader2, Copy, CheckCircle2, Download, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../../services/api';

interface Boleto {
  id: string;
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
    carregarBoletos();
  }, []);

  const carregarBoletos = async () => {
    try {
      const response = await api.get('/api/v1/boletos/meus');
      const data = response.data;
      data.sort((a: Boleto, b: Boleto) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime());
      setBoletos(data);
    } catch (error) {
      console.error('Erro ao carregar boletos:', error);
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

  const getBadgeClass = (status: string, vencimento: string) => {
    const base = "inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider";
    if (status === 'PAGO') return `${base} bg-ds-success-dim text-ds-success`;
    if (isVencido(vencimento)) return `${base} bg-ds-danger-dim text-ds-danger`;
    return `${base} bg-ds-warning-dim text-ds-warning`;
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
    <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Financeiro</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight">Meus boletos</h2>
        </div>
        <div className="w-10 h-10 bg-ds-card border border-ds-border rounded-xl flex items-center justify-center text-ds-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
      </header>

      {/* Subheader summary */}
      <div className="px-6 pb-6">
        <div className="bg-ds-card border border-ds-border rounded-[12px] px-4 py-3 flex items-center text-sm">
          <span className="font-bold text-ds-text mr-2">2026</span>
          <span className="text-ds-dim">— {boletos.length} cobranças</span>
        </div>
      </div>

      {/* Lista de Boletos */}
      <div className="px-6 pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ds-dim" />
          </div>
        ) : boletos.length === 0 ? (
          <div className="bg-ds-card rounded-[16px] p-8 border border-ds-border text-center shadow-sm">
            <h3 className="text-ds-text font-bold mb-1">Tudo certo!</h3>
            <p className="text-ds-dim text-sm">Nenhum boleto pendente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {boletos.map(boleto => {
              const vencido = boleto.status === 'PENDENTE' && isVencido(boleto.dataVencimento);
              const badgeClass = getBadgeClass(boleto.status, boleto.dataVencimento);
              const isExpanded = expandedId === boleto.id;
              
              let statusText = boleto.status;
              if (boleto.status === 'PENDENTE' && vencido) statusText = 'VENCIDO';
              else if (boleto.status === 'PENDENTE') statusText = 'VENCE EM BREVE';
              else if (boleto.status === 'PAGO') statusText = 'EM DIA';

              return (
                <div 
                  key={boleto.id} 
                  onClick={() => toggleExpand(boleto.id)}
                  className="bg-ds-card rounded-[16px] border border-ds-border overflow-hidden transition-all cursor-pointer hover:border-ds-border-strong"
                >
                  <div className="p-5 flex items-start justify-between">
                    <div>
                      <h3 className="text-ds-text font-bold text-[14.5px]">{getMonthName(boleto.dataVencimento)}</h3>
                      <p className="text-ds-dim text-xs mt-1 font-semibold">
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
                        <span className="text-ds-text font-bold text-[15px]">{formatCurrency(boleto.valor)}</span>
                        <div className="mt-1.5 flex justify-end">
                          <span className={badgeClass}>
                            {statusText}
                          </span>
                        </div>
                      </div>
                      <div className="text-ds-dim">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && boleto.status === 'PENDENTE' && (
                    <div className="px-5 pb-5 pt-2 border-t border-ds-border mt-2 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-ds-faint text-[10px] font-bold tracking-widest uppercase mb-3">Linha Digitável</p>
                      
                      <div className="bg-ds-bg border border-ds-border rounded-xl p-4 mb-4">
                        <p className="font-mono text-xs text-ds-text break-all leading-relaxed">
                          {boleto.linhaDigitavel || '00190.00009 01234.567890 12345.678901 1 98760000065000'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleCopy(e, boleto.id, boleto.linhaDigitavel)}
                          className="flex-1 bg-ds-bg hover:bg-ds-border transition-colors border border-ds-border rounded-xl flex items-center justify-center gap-2 py-3 text-[13.5px] font-bold text-ds-text"
                        >
                          {copiedId === boleto.id ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-ds-success" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-ds-dim" />
                              Copiar PIX
                            </>
                          )}
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-12 bg-ds-bg hover:bg-ds-border transition-colors border border-ds-border rounded-xl flex items-center justify-center text-ds-dim"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded Content (Paid) */}
                  {isExpanded && boleto.status === 'PAGO' && (
                    <div className="px-5 pb-5 pt-2 border-t border-ds-border mt-2 animate-in slide-in-from-top-2 duration-200">
                       <div className="bg-ds-success-dim border border-ds-success/20 rounded-xl p-4 flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-ds-success" />
                         <p className="text-xs text-ds-success font-semibold">Pagamento processado com sucesso.</p>
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
