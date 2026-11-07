import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, AlertTriangle, CheckCircle2, Clock, Wrench, ArrowUpRight, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';

interface Chamado {
  id: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  dataAbertura: string;
  escaladoSindico?: boolean;
}

export function ChamadosList() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO'>('ABERTO');

  const { refreshCounts } = useNotification();

  const fetchChamados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados');
      setChamados(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChamados();
  }, [fetchChamados]);

  useWebSocket('/topic/chamados', fetchChamados);

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    try {
      await api.put(`/api/v1/chamados/${id}/status`, { novoStatus });
      fetchChamados();
      refreshCounts();
    } catch {
      alert('Erro ao atualizar status do chamado.');
    }
  };

  const handleEscalar = async (id: string) => {
    try {
      await api.put(`/api/v1/chamados/${id}/escalar`);
      fetchChamados();
      refreshCounts();
    } catch {
      alert('Erro ao escalar chamado.');
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'MANUTENCAO':
        return <Wrench className="w-3.5 h-3.5 text-ds-warning" />;
      case 'RECLAMACAO':
        return <AlertTriangle className="w-3.5 h-3.5 text-ds-danger" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-ds-primary" />;
    }
  };

  const countByStatus = (st: Chamado['status']) => chamados.filter((c) => c.status === st).length;
  const filtered = chamados.filter((c) => c.status === activeStatus);

  return (
    <div className="flex flex-col gap-[16px]">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0">
          Atendimento
        </p>
        <h2 className="text-[17px] font-extrabold text-ds-text tracking-[-0.01em] m-0 mt-0.5">
          Ouvidoria
        </h2>
      </div>

      {/* Tabs de Status */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-ds-card border border-ds-border rounded-[12px]">
        {(
          [
            { id: 'ABERTO', label: 'Abertos' },
            { id: 'EM_ANDAMENTO', label: 'Andamento' },
            { id: 'RESOLVIDO', label: 'Resolvidos' },
          ] as const
        ).map((tab) => {
          const count = countByStatus(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStatus(tab.id)}
              className={`py-1.5 px-2 rounded-[9px] text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeStatus === tab.id
                  ? 'bg-ds-primary-dim text-ds-primary'
                  : 'text-ds-dim hover:text-ds-text'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-ds-card border border-ds-border rounded-[14px] py-12 flex flex-col items-center justify-center gap-2 text-ds-dim text-[12.5px]">
          <Loader2 className="w-5 h-5 animate-spin text-ds-primary" />
          <span>Carregando manifestações...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-ds-card border border-ds-border rounded-[14px] py-10 px-4 text-center">
          <div className="w-10 h-10 rounded-[10px] bg-ds-bg border border-ds-border grid place-items-center mx-auto mb-2.5 text-ds-faint">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-[13px] font-bold text-ds-text m-0">Nenhum registro nesta aba</p>
          <p className="text-[11.5px] text-ds-dim m-0 mt-1">
            Chamados de moradores aparecem aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {filtered.map((chamado) => (
            <div
              key={chamado.id}
              className="bg-ds-card border border-ds-border rounded-[14px] p-[14px] flex flex-col gap-2.5 relative overflow-hidden"
            >
              {chamado.escaladoSindico && (
                <div
                  className="absolute top-0 left-0 bottom-0 w-1 bg-ds-danger"
                  title="Escalado para o Síndico"
                />
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded-[7px] bg-ds-bg border border-ds-border text-ds-text">
                  {chamado.unidadeTexto}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-ds-faint">
                  <Clock className="w-3 h-3" />
                  {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div>
                <h4 className="text-[13.5px] font-bold text-ds-text m-0 break-words">
                  {chamado.assunto}
                </h4>
                <p className="text-[12px] text-ds-dim m-0 mt-1 leading-[1.45] break-words">
                  {chamado.descricao}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-ds-border gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ds-dim">
                  {getCategoriaIcon(chamado.categoria)}
                  <span>{chamado.categoria}</span>
                  {chamado.escaladoSindico && (
                    <span className="font-mono text-[9.5px] text-ds-danger bg-ds-danger-dim px-1.5 py-0.5 rounded uppercase">
                      Síndico
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeStatus !== 'RESOLVIDO' && !chamado.escaladoSindico && (
                    <button
                      type="button"
                      onClick={() => handleEscalar(chamado.id)}
                      className="px-2.5 py-1.5 rounded-[8px] border border-ds-border bg-ds-bg text-ds-dim hover:text-ds-danger hover:border-ds-danger/40 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Síndico
                    </button>
                  )}

                  {activeStatus === 'ABERTO' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(chamado.id, 'EM_ANDAMENTO')}
                      className="px-3 py-1.5 rounded-[8px] bg-ds-primary text-ds-primary-ink text-[11.5px] font-bold hover:brightness-110 transition-all cursor-pointer"
                    >
                      Atender
                    </button>
                  )}

                  {activeStatus === 'EM_ANDAMENTO' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(chamado.id, 'RESOLVIDO')}
                      className="px-3 py-1.5 rounded-[8px] bg-ds-success text-white text-[11.5px] font-bold hover:brightness-110 transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
