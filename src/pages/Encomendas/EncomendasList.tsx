import { useState, useEffect } from 'react';
import { Package, Search, Plus, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/UI/Modal';
import { NovaEncomendaForm } from './components/NovaEncomendaForm';

interface Encomenda {
  id: string;
  codigoRastreio: string;
  destinatario: string;
  unidade: string;
  transportadora: string;
  status: string;
  dataChegada: string;
}

export function EncomendasList() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      // Rota definida no nosso back-end Java
      const response = await api.get('/api/v1/encomendas');
      setEncomendas(response.data);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar as encomendas. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'AGUARDANDO_RETIRADA') return 'bg-blue-100 text-blue-800';
    if (status === 'ENTREGUE') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    if (status === 'AGUARDANDO_RETIRADA') return 'Aguardando Retirada';
    if (status === 'ENTREGUE') return 'Entregue';
    return status;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-900" />
            Gestão de Encomendas
          </h3>
          <p className="text-gray-500 mt-1">Registre e acompanhe as entregas dos moradores.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Registrar Nova Encomenda
        </button>
      </div>

      {/* Área de Filtros / Busca */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por código, destinatário ou unidade..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
          />
        </div>
        <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-600">
          <option value="">Todos os Status</option>
          <option value="AGUARDANDO_RETIRADA">Aguardando Retirada</option>
          <option value="ENTREGUE">Entregue</option>
        </select>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-900">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Carregando pacotes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <button onClick={fetchEncomendas} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              Tentar Novamente
            </button>
          </div>
        ) : encomendas.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900">Nenhuma encomenda encontrada</h4>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">Não há pacotes registrados no momento ou eles não correspondem aos filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-medium">Código</th>
                  <th className="px-6 py-4 font-medium">Destinatário</th>
                  <th className="px-6 py-4 font-medium">Unidade</th>
                  <th className="px-6 py-4 font-medium">Transportadora</th>
                  <th className="px-6 py-4 font-medium">Data/Hora Chegada</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {encomendas.map((enc) => (
                  <tr key={enc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{enc.codigoRastreio}</td>
                    <td className="px-6 py-4 text-gray-700">{enc.destinatario}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{enc.unidade}</td>
                    <td className="px-6 py-4 text-gray-500">{enc.transportadora}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(enc.dataChegada).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusStyle(enc.status)}`}>
                        {formatStatus(enc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {enc.status === 'AGUARDANDO_RETIRADA' && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                          Confirmar Entrega
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nova Encomenda */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nova Encomenda"
      >
        <NovaEncomendaForm 
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEncomendas();
          }}
        />
      </Modal>
    </div>
  );
}
