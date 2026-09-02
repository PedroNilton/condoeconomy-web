import { useState, useEffect } from 'react';
import { FileText, Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchBoletos();
  }, []);

  const fetchBoletos = async () => {
    try {
      setLoading(true);
      // Filtra direto na API pela unidade do morador atual
      const response = await api.get('/api/v1/boletos?unidade=Apto 101 - Bloco B');
      
      // Ordenar por data de vencimento (mais próximos primeiro)
      const list = response.data;
      list.sort((a: Boleto, b: Boleto) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
      
      setBoletos(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleCopy = (id: string, linhaDigitavel: string) => {
    navigator.clipboard.writeText(linhaDigitavel);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string, vencimento: string) => {
    if (status === 'PAGO') return 'text-green-600 bg-green-50 border-green-200';
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const dataVenc = new Date(vencimento);
    
    if (dataVenc < hoje) return 'text-red-600 bg-red-50 border-red-200'; // Vencido
    return 'text-blue-600 bg-blue-50 border-blue-200'; // Em aberto
  };

  const isVencido = (vencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    return new Date(vencimento) < hoje;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      <header className="bg-white pt-10 pb-4 px-6 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Meus Boletos
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Acompanhe as taxas condominiais</p>
        </div>
      </header>

      <div className="p-6">
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : boletos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Nenhum boleto encontrado para sua unidade.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {boletos.map(boleto => {
              const vencido = boleto.status === 'PENDENTE' && isVencido(boleto.dataVencimento);
              
              return (
                <div key={boleto.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${vencido ? 'border-red-200' : 'border-gray-100'} relative overflow-hidden`}>
                  
                  {vencido && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Taxa Condominial</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Vencimento: {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusColor(boleto.status, boleto.dataVencimento)}`}>
                      {boleto.status === 'PENDENTE' && vencido ? 'VENCIDO' : boleto.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-2xl font-black text-gray-800 tracking-tight">
                      {formatCurrency(boleto.valor)}
                    </span>
                  </div>

                  {boleto.status === 'PENDENTE' && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-2 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500">Código de Barras</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={boleto.linhaDigitavel}
                          className="flex-1 bg-white text-xs text-gray-600 p-2.5 rounded-lg border border-gray-200 focus:outline-none"
                        />
                        <button 
                          onClick={() => handleCopy(boleto.id, boleto.linhaDigitavel)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                            copiedId === boleto.id ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {copiedId === boleto.id ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      {vencido && (
                         <div className="flex items-center gap-1.5 mt-1 text-red-600">
                           <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                           <p className="text-[10px] font-medium">Boleto vencido. Juros e multas serão aplicados no próximo mês.</p>
                         </div>
                      )}
                    </div>
                  )}

                  {boleto.status === 'PAGO' && (
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-center gap-2 mt-4">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-semibold text-green-800">Pagamento Confirmado</p>
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
