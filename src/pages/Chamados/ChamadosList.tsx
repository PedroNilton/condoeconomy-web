import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import {
  Badge,
  Button,
  EmptyState,
  ListCard,
  SegmentedTabs,
  Toast,
} from '../../components/ui';

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
  const [activeStatus, setActiveStatus] = useState<'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO'>(
    'ABERTO',
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const fetchChamados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados');
      setChamados(Array.isArray(res.data) ? res.data : []);
      setNowMs(Date.now());
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
      showToast(novoStatus === 'RESOLVIDO' ? 'Chamado resolvido' : 'Atendimento iniciado');
    } catch {
      showToast('Erro ao atualizar status do chamado.');
    }
  };

  const handleEscalar = async (id: string) => {
    try {
      await api.put(`/api/v1/chamados/${id}/escalar`);
      fetchChamados();
      refreshCounts();
      showToast('Chamado escalado para o síndico');
    } catch {
      showToast('Erro ao escalar chamado.');
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'MANUTENCAO':
        return <Wrench className="w-3.5 h-3.5 text-warn" />;
      case 'RECLAMACAO':
        return <AlertTriangle className="w-3.5 h-3.5 text-bad" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-brand" />;
    }
  };

  const isChamadoAtrasado = (chamado: Chamado) => {
    if (chamado.status !== 'ABERTO' || !chamado.dataAbertura) return false;
    const diffHoras = (nowMs - new Date(chamado.dataAbertura).getTime()) / (1000 * 60 * 60);
    return diffHoras >= 3;
  };

  const countByStatus = (st: Chamado['status']) => chamados.filter((c) => c.status === st).length;
  const filtered = chamados.filter((c) => c.status === activeStatus);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint m-0">
          Atendimento
        </p>
        <h1 className="text-[21px] font-extrabold text-ink tracking-[-0.01em] m-0 mt-[3px]">
          Ouvidoria
        </h1>
      </div>

      <SegmentedTabs
        value={activeStatus}
        onChange={setActiveStatus}
        items={[
          { id: 'ABERTO', label: 'Abertos', count: countByStatus('ABERTO') },
          { id: 'EM_ANDAMENTO', label: 'Andamento', count: countByStatus('EM_ANDAMENTO') },
          { id: 'RESOLVIDO', label: 'Resolvidos', count: countByStatus('RESOLVIDO') },
        ]}
      />

      {loading ? (
        <ListCard className="py-12 flex flex-col items-center justify-center gap-2 text-dim text-[12.5px]">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
          <span>Carregando manifestações...</span>
        </ListCard>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="Nenhum registro nesta aba"
          description="Chamados de moradores aparecem aqui em tempo real."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((chamado) => {
            const atrasado = isChamadoAtrasado(chamado);
            return (
              <ListCard
                key={chamado.id}
                tone={atrasado ? 'warn' : 'default'}
                className="relative overflow-hidden"
              >
                {chamado.escaladoSindico && (
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1 bg-bad"
                    title="Escalado para o Síndico"
                  />
                )}

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded-[7px] bg-canvas border border-line text-ink">
                      {chamado.unidadeTexto}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-faint">
                      <Clock className="w-3 h-3" />
                      {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-[13.5px] font-bold text-ink m-0 break-words">
                      {chamado.assunto}
                    </h4>
                    <p className="text-[12px] text-dim m-0 mt-1 leading-[1.45] break-words">
                      {chamado.descricao}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-dim">
                      {getCategoriaIcon(chamado.categoria)}
                      <span>{chamado.categoria}</span>
                      {chamado.escaladoSindico && <Badge tone="bad">Síndico</Badge>}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeStatus !== 'RESOLVIDO' && !chamado.escaladoSindico && (
                        <Button
                          variant="mini"
                          onClick={() => handleEscalar(chamado.id)}
                          className="hover:!text-bad hover:!border-bad"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Síndico</span>
                        </Button>
                      )}

                      {activeStatus === 'ABERTO' && (
                        <Button
                          variant="primary"
                          size="mini"
                          onClick={() => handleUpdateStatus(chamado.id, 'EM_ANDAMENTO')}
                        >
                          Atender
                        </Button>
                      )}

                      {activeStatus === 'EM_ANDAMENTO' && (
                        <Button
                          variant="primary"
                          size="mini"
                          onClick={() => handleUpdateStatus(chamado.id, 'RESOLVIDO')}
                          className="!bg-ok !border-ok !text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolver</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ListCard>
            );
          })}
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
