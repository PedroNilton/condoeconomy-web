import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Box } from 'lucide-react';
import api from '../../../services/api';

interface Encomenda {
  id: string;
  codigoRastreio: string;
  destinatario: string;
  unidade: string;
  transportadora: string;
  status: string;
  dataRecebimento: string;
  dataRetirada?: string;
}

export function MoradorEncomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/encomendas/minhas');
      setEncomendas(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

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
    const matchesSearch = enc.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? enc.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-900 dark:text-blue-400" />
            Minhas Encomendas
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Acompanhe as suas encomendas na portaria.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="pl-10 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
            placeholder="Buscar por código de rastreio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            className="rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="AGUARDANDO_RETIRADA">Aguardando Retirada</option>
            <option value="RETIRADA">Retirada</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredEncomendas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <Box className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma encomenda encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEncomendas.map((encomenda) => (
            <div 
              key={encomenda.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(encomenda.status)}`}>
                  {formatStatus(encomenda.status)}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">CÓDIGO DE RASTREIO</p>
                  <p className="text-gray-800 dark:text-gray-200 font-bold truncate">{encomenda.codigoRastreio}</p>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">TRANSPORTADORA</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{encomenda.transportadora}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">DATA DE RECEBIMENTO</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {new Date(encomenda.dataRecebimento).toLocaleString('pt-BR')}
                  </p>
                </div>
                
                {encomenda.dataRetirada && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">DATA DE RETIRADA</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {new Date(encomenda.dataRetirada).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



