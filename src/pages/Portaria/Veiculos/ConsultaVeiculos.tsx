import React, { useState } from 'react';
import { Search, Car, User, MapPin, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

interface VeiculoConsulta {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  moradorId: string;
  nomeMorador: string;
  apartamento: string;
  bloco: string;
}

export function ConsultaVeiculos() {
  const navigate = useNavigate();
  const [placaBusca, setPlacaBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<VeiculoConsulta[] | null>(null);
  const [error, setError] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placaBusca.length < 3) return;

    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/api/v1/portaria/veiculos/consulta?placa=${placaBusca}`);
      setResultado(response.data);
    } catch (err) {
      console.error(err);
      setError(true);
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 px-6 py-4 flex items-center shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Consulta de Veículos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Verifique a placa para autorizar a entrada</p>
        </div>
      </header>

      <div className="p-6 flex-1 overflow-y-auto max-w-3xl mx-auto w-full">
        {/* Barra de Busca */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm mb-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={placaBusca}
                onChange={(e) => setPlacaBusca(e.target.value.toUpperCase())}
                className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-cyan-500 transition-colors uppercase font-mono tracking-widest"
                placeholder="PLACA (Ex: ABC-1234)"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || placaBusca.length < 3}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[140px]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-800/50">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">Ocorreu um erro ao buscar a placa. Tente novamente.</p>
          </div>
        )}

        {resultado !== null && !loading && !error && (
          <div className="space-y-6">
            <h2 className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-sm px-2">
              Resultados ({resultado.length})
            </h2>

            {resultado.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl text-center border border-dashed border-gray-300 dark:border-gray-600">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Veículo não encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  A placa <strong className="text-gray-700 dark:text-gray-300 font-mono">{placaBusca}</strong> não está registrada no condomínio. <br/>Atenção, pode ser um visitante não autorizado.
                </p>
              </div>
            ) : (
              resultado.map((veiculo) => (
                <div key={veiculo.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border-l-4 border-l-green-500 border-t border-b border-r border-gray-100 dark:border-gray-700 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-xl font-bold text-xs uppercase tracking-wider shadow-sm">
                    Morador Autorizado
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6 md:items-center mt-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <Car className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-widest font-mono">
                          {veiculo.placa}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg capitalize">
                          {veiculo.modelo} • {veiculo.cor}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-px h-px md:h-16 bg-gray-200 dark:bg-gray-700 shrink-0"></div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Proprietário</p>
                          <p className="font-bold text-lg">{veiculo.nomeMorador}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Localização</p>
                          <p className="font-bold">
                            {veiculo.apartamento ? `Apto ${veiculo.apartamento}` : ''}
                            {veiculo.bloco ? ` - Bloco ${veiculo.bloco}` : ''}
                            {!veiculo.apartamento && !veiculo.bloco && 'Não informado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
