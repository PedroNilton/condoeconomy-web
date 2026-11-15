import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { sanitizarEntrada, contemAmeacas } from '../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  EmptyState,
  ListCard,
  LiveIndicator,
  PageHead,
  SearchInput,
  SegmentedTabs,
  TextAreaField,
  Thread,
  Toast,
  type ThreadMessage,
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
  notaPortaria?: string;
}

interface MensagemApi {
  id?: string | number;
  autorPapel?: string;
  autorNome?: string;
  texto: string;
  enviadaEm?: string;
}

function formatTimeLabel(iso?: string): string {
  if (!iso) return 'agora';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'agora';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChamadosList() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO'>(
    'ABERTO',
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Escalation sheet state
  const [escalarChamado, setEscalarChamado] = useState<Chamado | null>(null);
  const [notaPortaria, setNotaPortaria] = useState('');
  const [notaErro, setNotaErro] = useState('');
  const [escalando, setEscalando] = useState(false);

  // Conversation sheet state
  const [conversaChamado, setConversaChamado] = useState<Chamado | null>(null);
  const [mensagens, setMensagens] = useState<ThreadMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

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

  const abrirSheetEscalar = (chamado: Chamado) => {
    setEscalarChamado(chamado);
    setNotaPortaria('');
    setNotaErro('');
  };

  const handleConfirmarEscalar = async () => {
    if (!escalarChamado) return;
    const trimmed = notaPortaria.trim();
    if (!trimmed) {
      setNotaErro('Informe uma nota para o síndico antes de escalonar.');
      return;
    }
    if (contemAmeacas(trimmed)) {
      setNotaErro('Entrada contém caracteres não permitidos.');
      return;
    }

    const notaLimpa = sanitizarEntrada(trimmed, 500);
    setEscalando(true);
    setNotaErro('');
    try {
      await api.put(`/api/v1/chamados/${escalarChamado.id}/escalar`, {
        notaPortaria: notaLimpa,
      });
      setEscalarChamado(null);
      setNotaPortaria('');
      fetchChamados();
      refreshCounts();
      showToast('Chamado escalado para o síndico');
    } catch {
      showToast('Erro ao escalar chamado.');
    } finally {
      setEscalando(false);
    }
  };

  const carregarMensagens = useCallback(async (chamado: Chamado) => {
    const baseMsg: ThreadMessage = {
      id: `init-${chamado.id}`,
      senderRole: 'morador',
      senderLabel: chamado.moradorSolicitante || 'Morador',
      text: chamado.descricao || chamado.assunto,
      timeLabel: formatTimeLabel(chamado.dataAbertura),
    };

    setLoadingMsgs(true);
    try {
      const res = await api.get(`/api/v1/chamados/${chamado.id}/mensagens`);
      const lista: MensagemApi[] = Array.isArray(res.data) ? res.data : [];
      const mapped: ThreadMessage[] = lista.map((m, idx) => {
        const papelUpper = (m.autorPapel || '').toUpperCase();
        const senderRole: ThreadMessage['senderRole'] =
          papelUpper.includes('SINDICO') || papelUpper.includes('ADMIN')
            ? 'sindico'
            : papelUpper.includes('PORTARIA') || papelUpper.includes('PORTEIRO')
            ? 'portaria'
            : 'morador';
        const senderLabel =
          senderRole === 'sindico'
            ? 'Síndico'
            : senderRole === 'portaria'
            ? 'Portaria'
            : m.autorNome || chamado.moradorSolicitante || 'Morador';
        return {
          id: m.id ? String(m.id) : `msg-${idx}`,
          senderRole,
          senderLabel,
          text: m.texto,
          timeLabel: formatTimeLabel(m.enviadaEm),
        };
      });
      setMensagens([baseMsg, ...mapped]);
    } catch {
      setMensagens([baseMsg]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const abrirConversa = (chamado: Chamado) => {
    setConversaChamado(chamado);
    carregarMensagens(chamado);
  };

  const handleEnviarMensagem = async (texto: string) => {
    if (!conversaChamado) return;
    const trimmed = texto.trim();
    if (!trimmed) return;
    if (contemAmeacas(trimmed)) {
      showToast('Mensagem contém caracteres não permitidos.');
      return;
    }

    const textoLimpo = sanitizarEntrada(trimmed, 600);
    const novaMsg: ThreadMessage = {
      id: `local-${Date.now()}`,
      senderRole: 'portaria',
      senderLabel: 'Portaria',
      text: textoLimpo,
      timeLabel: 'agora',
    };
    setMensagens((prev) => [...prev, novaMsg]);

    try {
      await api.post(`/api/v1/chamados/${conversaChamado.id}/mensagens`, {
        texto: textoLimpo,
      });
      showToast('Resposta enviada');
    } catch {
      showToast('Erro ao enviar mensagem.');
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chamados.filter((c) => {
      if (c.status !== activeStatus) return false;
      if (!q) return true;
      const haystack = `${c.assunto || ''} ${c.moradorSolicitante || ''} ${c.unidadeTexto || ''} ${c.descricao || ''} ${c.categoria || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [chamados, activeStatus, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-[18px] -mt-[10px]">
        <PageHead
          eyebrow="Atendimento"
          title="Ouvidoria"
          rightBadge={<LiveIndicator />}
        />
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        height="tall"
        placeholder="Buscar assunto, morador ou unidade..."
      />

      <SegmentedTabs
        value={activeStatus}
        onChange={setActiveStatus}
        items={[
          { id: 'ABERTO', label: 'Abertos', count: countByStatus('ABERTO') },
          { id: 'EM_ANDAMENTO', label: 'Em andamento', count: countByStatus('EM_ANDAMENTO') },
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

                    <button
                      type="button"
                      onClick={() => abrirConversa(chamado)}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-brand hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Conversa</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    {activeStatus !== 'RESOLVIDO' && !chamado.escaladoSindico && (
                      <Button
                        variant="secondary"
                        size="card"
                        onClick={() => abrirSheetEscalar(chamado)}
                        className="hover:!text-bad hover:!border-bad"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Escalar p/ síndico</span>
                      </Button>
                    )}

                    {activeStatus === 'ABERTO' && (
                      <Button
                        variant="primary"
                        size="card"
                        onClick={() => handleUpdateStatus(chamado.id, 'EM_ANDAMENTO')}
                      >
                        Atender
                      </Button>
                    )}

                    {activeStatus === 'EM_ANDAMENTO' && (
                      <Button
                        variant="primary"
                        size="card"
                        onClick={() => handleUpdateStatus(chamado.id, 'RESOLVIDO')}
                        className="!bg-ok !border-ok !text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolver</span>
                      </Button>
                    )}
                  </div>
                </div>
              </ListCard>
            );
          })}
        </div>
      )}

      {/* Sheet: Escalonar para o síndico */}
      <BottomSheet
        open={escalarChamado !== null}
        onClose={() => {
          if (!escalando) {
            setEscalarChamado(null);
            setNotaPortaria('');
            setNotaErro('');
          }
        }}
        title="Escalonar para o síndico"
        subtitle={
          escalarChamado
            ? `${escalarChamado.unidadeTexto} · ${escalarChamado.assunto}`
            : undefined
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="cta"
              disabled={escalando}
              onClick={() => {
                setEscalarChamado(null);
                setNotaPortaria('');
                setNotaErro('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="cta"
              disabled={escalando}
              onClick={handleConfirmarEscalar}
            >
              {escalando ? 'Enviando...' : 'Escalonar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextAreaField
            label="Nota para o síndico"
            required
            value={notaPortaria}
            onChange={(e) => {
              setNotaPortaria(e.target.value);
              if (notaErro) setNotaErro('');
            }}
            error={notaErro || undefined}
            placeholder="Descreva o que foi verificado na portaria e por que requer ação da administração..."
          />
        </div>
      </BottomSheet>

      {/* Sheet: Conversa do chamado */}
      <BottomSheet
        open={conversaChamado !== null}
        onClose={() => setConversaChamado(null)}
        title={conversaChamado?.assunto || 'Conversa'}
        subtitle={
          conversaChamado
            ? `${conversaChamado.unidadeTexto} · ${conversaChamado.moradorSolicitante || 'Morador'}`
            : undefined
        }
      >
        {loadingMsgs ? (
          <div className="py-8 flex items-center justify-center gap-2 text-dim text-[12.5px]">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span>Carregando mensagens...</span>
          </div>
        ) : (
          <Thread
            messages={mensagens}
            onSend={conversaChamado?.status === 'RESOLVIDO' ? undefined : handleEnviarMensagem}
            placeholder="Escrever resposta para o morador..."
            disabledNote={
              conversaChamado?.status === 'RESOLVIDO'
                ? 'Este chamado já foi resolvido.'
                : undefined
            }
          />
        )}
      </BottomSheet>

      <Toast message={toastMsg} />
    </div>
  );
}

