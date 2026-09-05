import { useState, useEffect } from 'react';
import { MessageSquareWarning, Loader2, RefreshCcw } from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface Chamado {
  id: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: string;
  dataAbertura: string;
  escaladoSindico: boolean;
}

export function OuvidoriaAdminPanel() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  useWebSocket('/topic/chamados', () => {
    fetchChamados();
  });

  const fetchChamados = async () => {
    try {
      const res = await api.get('/api/v1/chamados');
      const escalados = res.data.filter((c: Chamado) => c.escaladoSindico);
      setChamados(escalados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamados();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto bg-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
          <MessageSquareWarning className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Ouvidoria (Escalonados)</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={fetchChamados} className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
           <RefreshCcw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {chamados.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <MessageSquareWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhum chamado escalado para a administração no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chamados.map(chamado => (
            <div key={chamado.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">
                    ESCALADO
                  </span>
                  <h3 className="font-bold text-gray-800">{chamado.assunto}</h3>
                  <p className="text-xs text-gray-500">{chamado.categoria} • {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
                <p>{chamado.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Morador</p>
                  <p className="font-medium text-gray-800">{chamado.moradorSolicitante}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Unidade</p>
                  <p className="font-medium text-gray-800">{chamado.unidadeTexto}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
