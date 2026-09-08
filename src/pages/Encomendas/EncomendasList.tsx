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
  dataRetirada?: string;
}

export function EncomendasList() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const handleRetirar = async (id: string) => {
    try {
      await api.put(`/api/v1/encomendas/${id}/retirar`);
      fetchEncomendas();
    } catch (err) {
      alert('Erro ao confirmar entrega.');
      console.error(err);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'AGUARDANDO_RETIRADA') return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400';
    if (status === 'RETIRADA') return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400';
    if (status === 'ENTREGUE') return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
  };

  const formatStatus = (status: string) => {
    if (status === 'AGUARDANDO_RETIRADA') return 'Aguardando Retirada';
    if (status === 'RETIRADA') return 'Retirada';
    if (status === 'ENTREGUE') return 'Entregue';
    return status;
  };

  const filteredEncomendas = encomendas.filter(enc => {
    const matchesSearch = 
      enc.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.unidade.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? enc.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-900" />
            Encomendas
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registre e acompanhe as entregas dos moradores.</p>
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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, destinatário ou unidade..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Todos os Status</option>
          <option value="AGUARDANDO_RETIRADA">Aguardando Retirada</option>
          <option value="RETIRADA">Retirada</option>
        </select>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-900">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando pacotes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <button onClick={fetchEncomendas} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
              Tentar Novamente
            </button>
          </div>
        ) : filteredEncomendas.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="bg-gray-50 dark:bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhuma encomenda encontrada</h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">Não há pacotes registrados no momento ou eles não correspondem aos filtros aplicados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            {filteredEncomendas.map((enc) => (
              <div key={enc.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-3 transition-colors">
                
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{enc.codigoRastreio}</h4>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(enc.status)}`}>
                      {formatStatus(enc.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unidade</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{enc.unidade}</p>
                  </div>
                </div>

                {/* Detalhes (Destinatário e Transp) */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Destinatário</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{enc.destinatario}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Transportadora</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-1">{enc.transportadora}</p>
                  </div>
                </div>

                {/* Datas e Ação */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                    <span>Chegada: {enc.dataChegada ? new Date(enc.dataChegada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                    {enc.status !== 'AGUARDANDO_RETIRADA' && (
                      <span>Retirada: {enc.dataRetirada ? new Date(enc.dataRetirada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                    )}
                  </div>
                  
                  {enc.status === 'AGUARDANDO_RETIRADA' && (
                    <button 
                      onClick={() => handleRetirar(enc.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors active:scale-95"
                    >
                      Confirmar Entrega
                    </button>
                  )}
                </div>

              </div>
            ))}
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
