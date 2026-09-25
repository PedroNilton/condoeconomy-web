import { useState, useEffect } from 'react';
import { Loader2, Copy, CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

interface Boleto {
  id: string;
  valor: number;
  dataVencimento: string;
  status: string;
  linhaDigitavel: string;
}

export function MoradorBoletos() {
  const navigate = useNavigate();
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [filter, setFilter] = useState<'Todos'|'Pendentes'|'Pagos'|'Atrasados'>('Todos');

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

  const isVencido = (vencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    return new Date(vencimento) < hoje;
  };

  const getBadgeClass = (status: string, vencimento: string) => {
    const base = "inline-flex items-center font-mono text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap";
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

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  // Metrics calculation
  const getEmAberto = () => {
    return boletos
      .filter(b => b.status === 'PENDENTE')
      .reduce((acc, curr) => acc + curr.valor, 0);
  };

  const getProximoVencimento = () => {
    const pendentes = boletos.filter(b => b.status === 'PENDENTE' && !isVencido(b.dataVencimento));
    if (pendentes.length === 0) return '-';
    // Order asc
    pendentes.sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
    const date = new Date(pendentes[0].dataVencimento);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.','');
  };

  const filteredBoletos = boletos.filter(b => {
    const venc = isVencido(b.dataVencimento);
    if (filter === 'Pendentes') return b.status === 'PENDENTE' && !venc;
    if (filter === 'Pagos') return b.status === 'PAGO';
    if (filter === 'Atrasados') return b.status === 'PENDENTE' && venc;
    return true;
  });

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    return month.charAt(0).toUpperCase() + month.slice(1);
  };

  return (
    <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans">
      
      {/* Header fixo no topo */}
      <header className="sticky top-0 z-10 bg-ds-bg px-[18px] pt-8 pb-1">
        
        <div className="flex items-center gap-[10px] mb-4">
          <button 
            onClick={() => navigate('/app')}
            className="w-[34px] h-[34px] rounded-[10px] border border-ds-border bg-ds-card flex items-center justify-center text-ds-text hover:brightness-95 transition-all"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[17px] font-extrabold m-0">Meus boletos</h1>
        </div>

        {/* Summary Card */}
        <div className="bg-ds-card border border-ds-border rounded-[14px] p-3.5 flex justify-between items-center mb-3.5 shadow-sm">
          <div>
            <div className="text-[11.5px] text-ds-dim mb-[3px] font-medium">Em aberto</div>
            <div className="text-[19px] font-extrabold text-ds-danger">
              {formatCurrency(getEmAberto())}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11.5px] text-ds-dim mb-[3px] font-medium">Próximo vencimento</div>
            <div className="text-[19px] font-extrabold text-ds-text">
              {getProximoVencimento()}
            </div>
          </div>
        </div>

        {/* Filters Scrollable */}
        <div className="flex gap-[7px] overflow-x-auto pb-3.5 no-scrollbar">
          {['Todos', 'Pendentes', 'Pagos', 'Atrasados'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-none text-[12.5px] font-bold px-[13px] py-[7px] rounded-full border transition-colors ${
                filter === f 
                  ? 'bg-ds-primary border-ds-primary text-ds-primary-ink' 
                  : 'bg-ds-card border-ds-border text-ds-dim hover:text-ds-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Lista de Boletos */}
      <main className="flex-1 px-[18px] pb-32 flex flex-col gap-2.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ds-dim" />
          </div>
        ) : filteredBoletos.length === 0 ? (
          <div className="bg-ds-card rounded-[14px] p-8 border border-ds-border text-center shadow-sm">
            <h3 className="text-ds-text font-bold mb-1">Tudo limpo por aqui</h3>
            <p className="text-ds-dim text-sm">Nenhum boleto encontrado para este filtro.</p>
          </div>
        ) : (
          filteredBoletos.map(boleto => {
            const vencido = boleto.status === 'PENDENTE' && isVencido(boleto.dataVencimento);
            const isExpanded = expandedId === boleto.id;
            
            let statusText = boleto.status;
            let dateText = `VENCE EM ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}`;
            
            if (boleto.status === 'PENDENTE' && vencido) {
              statusText = 'VENCIDO';
              dateText = `VENCIDO EM ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}`;
            } else if (boleto.status === 'PENDENTE') {
              const diffTime = Math.ceil((new Date(boleto.dataVencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              statusText = diffTime <= 3 ? `VENCE EM ${diffTime} DIAS` : 'A VENCER';
            } else if (boleto.status === 'PAGO') {
              statusText = 'PAGO';
              dateText = `PAGO EM ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}`;
            }

            return (
              <div 
                key={boleto.id} 
                onClick={(e) => toggleExpand(e, boleto.id)}
                className={`bg-ds-card rounded-[14px] border transition-all cursor-pointer shadow-sm ${vencido ? 'border-ds-danger' : 'border-ds-border'}`}
              >
                <div className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[14px] font-bold text-ds-text">{getMonthName(boleto.dataVencimento)} - condomínio</div>
                      <div className="text-[11.5px] text-ds-dim font-mono mt-[2px]">{dateText}</div>
                    </div>
                    <span className={getBadgeClass(boleto.status, boleto.dataVencimento)}>
                      {statusText}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[17px] font-extrabold text-ds-text">{formatCurrency(boleto.valor)}</span>
                    <button 
                      className="bg-transparent border-none text-ds-primary font-bold text-[12.5px] cursor-pointer p-0 hover:underline"
                    >
                      {boleto.status === 'PAGO' ? 'Ver recibo' : vencido ? 'Pagar agora' : 'Ver boleto'}
                    </button>
                  </div>
                </div>

                {/* Área Expandida (PIX/Copia e Cola) */}
                {isExpanded && boleto.status === 'PENDENTE' && (
                  <div className="px-3.5 pb-4 pt-1 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-ds-bg border border-ds-border rounded-xl p-3 mb-3">
                      <p className="font-mono text-[11.5px] text-ds-text break-all leading-relaxed">
                        {boleto.linhaDigitavel || '00190.00009 01234.567890 12345.678901 1 98760000065000'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleCopy(e, boleto.id, boleto.linhaDigitavel)}
                        className="flex-1 bg-ds-bg hover:brightness-95 transition-all border border-ds-border rounded-[10px] flex items-center justify-center gap-2 py-2.5 text-[12.5px] font-bold text-ds-text"
                      >
                        {copiedId === boleto.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-ds-success" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-ds-dim" />
                            Copiar código
                          </>
                        )}
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 bg-ds-bg hover:brightness-95 transition-all border border-ds-border rounded-[10px] flex items-center justify-center text-ds-dim"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

    </div>
  );
}
