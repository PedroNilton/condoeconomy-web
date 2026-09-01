import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, AlertCircle, Copy, FileDown } from 'lucide-react';
import api from '../../services/api';

interface Boleto {
  id: string;
  unidadeTexto: string;
  moradorResponsavel: string;
  competencia: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO';
  linhaDigitavel: string;
}

export function BoletosList() {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscaUnidade, setBuscaUnidade] = useState('');

  useEffect(() => {
    fetchBoletos();
  }, []);

  const fetchBoletos = async (unidade?: string) => {
    try {
      setLoading(true);
      const query = unidade ? `?unidade=${unidade}` : '';
      const res = await api.get(`/api/v1/boletos${query}`);
      setBoletos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBoletos(buscaUnidade);
  };

  const handleBaixarBoleto = async (id: string) => {
    try {
      await api.put(`/api/v1/boletos/${id}/baixar`);
      fetchBoletos(buscaUnidade); // recarrega a lista
    } catch (err) {
      alert('Erro ao dar baixa no boleto.');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAGO': return { color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-4 h-4" />, label: 'Pago' };
      case 'VENCIDO': return { color: 'text-red-700 bg-red-100', icon: <AlertCircle className="w-4 h-4" />, label: 'Vencido' };
      default: return { color: 'text-yellow-700 bg-yellow-100', icon: <FileText className="w-4 h-4" />, label: 'Pendente' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Gestão Financeira
          </h3>
          <p className="text-gray-500 mt-1">Consulte os boletos e o status de inadimplência das unidades.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por unidade (Ex: 101)"
              value={buscaUnidade}
              onChange={(e) => setBuscaUnidade(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600 w-full sm:w-64"
            />
          </div>
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition">
            Buscar
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Unidade / Morador</th>
                <th className="px-6 py-4 font-semibold">Competência</th>
                <th className="px-6 py-4 font-semibold">Vencimento</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Carregando...</td></tr>
              ) : boletos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhum boleto encontrado.</td></tr>
              ) : (
                boletos.map(boleto => {
                  const statusConf = getStatusConfig(boleto.status);
                  return (
                    <tr key={boleto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{boleto.unidadeTexto}</div>
                        <div className="text-xs text-gray-500">{boleto.moradorResponsavel}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{boleto.competencia}</td>
                      <td className="px-6 py-4">
                        {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        R$ {boleto.valor.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConf.color}`}>
                          {statusConf.icon} {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Copiar Linha Digitável"
                            onClick={() => {
                              navigator.clipboard.writeText(boleto.linhaDigitavel);
                              alert('Linha digitável copiada!');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          {boleto.status !== 'PAGO' && (
                            <button 
                              onClick={() => handleBaixarBoleto(boleto.id)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar como Pago (Dar Baixa Manual)"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
