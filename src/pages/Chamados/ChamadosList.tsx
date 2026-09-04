import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import api from '../../services/api';

interface Chamado {
  id: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  dataAbertura: string;
}

export function ChamadosList() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados');
      setChamados(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    try {
      await api.put(`/api/v1/chamados/${id}/status`, { novoStatus });
      fetchChamados();
    } catch (err) {
      alert('Erro ao atualizar status do chamado.');
    }
  };

  const handleEscalar = async (id: string) => {
    try {
      await api.put(`/api/v1/chamados/${id}/escalar`);
      alert('Chamado escalado para o síndico com sucesso!');
      fetchChamados();
    } catch (err) {
      alert('Erro ao escalar chamado.');
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch(categoria) {
      case 'MANUTENCAO': return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'RECLAMACAO': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'SUGESTAO': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const Column = ({ title, statusId, items }: { title: string, statusId: string, items: Chamado[] }) => (
    <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-4 min-h-[500px]">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-700">{title}</h4>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {items.map(chamado => (
          <div key={chamado.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition relative overflow-hidden">
            {(chamado as any).escaladoSindico && (
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" title="Escalado para o Síndico" />
            )}
            <div className="flex justify-between items-start mb-2 pl-2">
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {chamado.unidadeTexto}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <h5 className="font-semibold text-gray-800 text-sm mb-1 pl-2 break-words">{chamado.assunto}</h5>
            <p className="text-xs text-gray-600 line-clamp-2 mb-3 pl-2 break-words">{chamado.descricao}</p>
            
            <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-gray-100 pl-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  {getCategoriaIcon(chamado.categoria)}
                  {chamado.categoria}
                </div>
                
                <div className="flex gap-2">
                  {statusId === 'ABERTO' && (
                    <button 
                      onClick={() => handleUpdateStatus(chamado.id, 'EM_ANDAMENTO')}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition"
                    >
                      Atender
                    </button>
                  )}
                  {statusId === 'EM_ANDAMENTO' && (
                    <button 
                      onClick={() => handleUpdateStatus(chamado.id, 'RESOLVIDO')}
                      className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
                    </button>
                  )}
                </div>
              </div>
              
              {statusId !== 'RESOLVIDO' && !(chamado as any).escaladoSindico && (
                <button 
                  onClick={() => handleEscalar(chamado.id)}
                  className="text-xs text-red-600 font-medium hover:underline self-end"
                >
                  Escalar para o Síndico
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 px-4 pt-4">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-purple-600" />
          Ouvidoria
        </h3>
        <p className="text-gray-500 mt-1 text-sm">Acompanhe as solicitações, reclamações e sugestões dos moradores.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Carregando chamados...</div>
      ) : (
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto no-scrollbar pb-6">
          <Column 
            title="Abertos" 
            statusId="ABERTO" 
            items={chamados.filter(c => c.status === 'ABERTO')} 
          />
          <Column 
            title="Em Andamento" 
            statusId="EM_ANDAMENTO" 
            items={chamados.filter(c => c.status === 'EM_ANDAMENTO')} 
          />
          <Column 
            title="Resolvidos" 
            statusId="RESOLVIDO" 
            items={chamados.filter(c => c.status === 'RESOLVIDO')} 
          />
        </div>
      )}
    </div>
  );
}
