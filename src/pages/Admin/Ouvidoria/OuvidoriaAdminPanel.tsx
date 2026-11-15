import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useNotification } from '../../../contexts/NotificationContext';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
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
} from '../../../components/ui';

const MIN_MS = 60000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

function ago(ms: number) {
  return new Date(Date.now() - ms);
}

function rel(d: Date | null | undefined, nowMs: number) {
  if (!d) return 'agora';
  const m = Math.floor((nowMs - d.getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const dd = Math.floor(h / 24);
  return `há ${dd} ${dd === 1 ? 'dia' : 'dias'}`;
}

const WHO_LABELS: Record<'m' | 'p' | 's', string> = {
  m: 'Morador',
  p: 'Portaria',
  s: 'Você',
};

const ROLE_MAP: Record<'m' | 'p' | 's', ThreadMessage['senderRole']> = {
  m: 'morador',
  p: 'portaria',
  s: 'sindico',
};

export interface OuvidoriaMsg {
  f: 'm' | 'p' | 's';
  t: string;
  at: Date;
}

export interface OuvidoriaItem {
  id: string;
  backendId?: string;
  cat: string;
  subject: string;
  unit: string;
  who: string;
  status: 'novo' | 'andamento' | 'resolvido';
  esc: Date;
  resolvedAt?: Date | null;
  note: string;
  msgs: OuvidoriaMsg[];
  fotoAnexo?: string | null;
}

const INITIAL_DEMO_ITEMS: OuvidoriaItem[] = [
  {
    id: 'demo-1',
    cat: 'Segurança',
    subject: 'Portão da garagem não fecha',
    unit: 'Bloco 03 · Apto 102',
    who: 'Fernanda Lima',
    status: 'novo',
    esc: ago(20 * MIN_MS),
    note: 'Verifiquei no local: o sensor do portão parece com defeito. Precisa de manutenção técnica.',
    msgs: [
      {
        f: 'm',
        t: 'O portão do Bloco 03 fica aberto depois que passa o carro. À noite isso é perigoso.',
        at: ago(48 * MIN_MS),
      },
      {
        f: 'p',
        t: 'Recebido. Estou escalando para a administração acionar a manutenção.',
        at: ago(20 * MIN_MS),
      },
    ],
  },
  {
    id: 'demo-2',
    cat: 'Reclamação',
    subject: 'Barulho de obra fora do horário',
    unit: 'Bloco 07 · Apto 302',
    who: 'João Lima',
    status: 'novo',
    esc: ago(26 * HOUR_MS),
    note: 'Já conversei com o morador responsável pela obra, mas continuam. Precisa de advertência formal.',
    msgs: [
      {
        f: 'm',
        t: 'Estão furando parede desde as 7h de sábado. O regimento não permite nesse horário.',
        at: ago(30 * HOUR_MS),
      },
      {
        f: 'p',
        t: 'Conversei com o morador, mas o barulho continua. Escalei para a síndica.',
        at: ago(26 * HOUR_MS),
      },
    ],
  },
  {
    id: 'demo-3',
    cat: 'Sugestão',
    subject: 'Cobrir o bicicletário',
    unit: 'Bloco 11 · Apto 012',
    who: 'Carlos Silva',
    status: 'andamento',
    esc: ago(2 * DAY_MS),
    note: 'Sugestão que depende de orçamento. Vale levar para assembleia.',
    msgs: [
      {
        f: 'm',
        t: 'Sugiro cobrir o bicicletário. As bicicletas pegam chuva e enferrujam.',
        at: ago(3 * DAY_MS),
      },
      {
        f: 'p',
        t: 'Obrigado pela sugestão. Vou encaminhar para a administração.',
        at: ago(2 * DAY_MS),
      },
      {
        f: 's',
        t: 'Vou pedir orçamento e colocar em pauta na próxima assembleia.',
        at: ago(1 * DAY_MS),
      },
    ],
  },
  {
    id: 'demo-4',
    cat: 'Manutenção',
    subject: 'Vazamento na garagem do bloco 05',
    unit: 'Bloco 05 · Apto 201',
    who: 'Ana Beatriz',
    status: 'resolvido',
    esc: ago(5 * DAY_MS),
    resolvedAt: ago(3 * DAY_MS),
    note: 'Vazamento em tubulação do prédio, fora da alçada da portaria.',
    msgs: [
      {
        f: 'm',
        t: 'Tem água escorrendo perto da minha vaga há dois dias.',
        at: ago(6 * DAY_MS),
      },
      {
        f: 'p',
        t: 'Escalado para a administração.',
        at: ago(5 * DAY_MS),
      },
      {
        f: 's',
        t: 'Encanador contratado e reparo concluído. Obrigada por avisar.',
        at: ago(3 * DAY_MS),
      },
    ],
  },
  {
    id: 'demo-5',
    cat: 'Reclamação',
    subject: 'Barulho após 22h no salão',
    unit: 'Bloco 08 · Apto 011',
    who: 'Jorge Santos',
    status: 'resolvido',
    esc: ago(7 * DAY_MS),
    resolvedAt: ago(6 * DAY_MS),
    note: 'Reincidência de morador. Cabe à administração aplicar o regimento.',
    msgs: [
      {
        f: 'm',
        t: 'Festa no salão passou do horário permitido de novo.',
        at: ago(8 * DAY_MS),
      },
      {
        f: 'p',
        t: 'Escalado por ser reincidência.',
        at: ago(7 * DAY_MS),
      },
      {
        f: 's',
        t: 'Morador notificado formalmente conforme o regimento.',
        at: ago(6 * DAY_MS),
      },
    ],
  },
];

function mapCategoriaLabel(cat?: string): string {
  if (!cat) return 'Manutenção';
  const upper = cat.toUpperCase();
  if (upper.includes('SEGURAN')) return 'Segurança';
  if (upper.includes('RECLAMA')) return 'Reclamação';
  if (upper.includes('SUGEST')) return 'Sugestão';
  if (upper.includes('MANUTEN')) return 'Manutenção';
  return cat;
}

export function OuvidoriaAdminPanel() {
  const { refreshCounts } = useNotification();
  const [items, setItems] = useState<OuvidoriaItem[]>(INITIAL_DEMO_ITEMS);
  const [filter, setFilter] = useState<'novo' | 'andamento' | 'resolvido'>('novo');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const [resolveNoteText, setResolveNoteText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const fetchChamados = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/chamados');
      const now = Date.now();
      setNowMs(now);
      if (Array.isArray(res.data)) {
        const escalados = res.data.filter(
          (c: { escaladoSindico?: boolean }) => c.escaladoSindico,
        );
        if (escalados.length > 0) {
          const mapped: OuvidoriaItem[] = escalados.map(
            (
              c: {
                id: string | number;
                status?: string;
                dataAbertura?: string;
                categoria?: string;
                descricao?: string;
                assunto?: string;
                unidadeTexto?: string;
                moradorSolicitante?: string;
                fotoAnexo?: string;
                notaPortaria?: string;
              },
              idx: number,
            ) => {
              let status: 'novo' | 'andamento' | 'resolvido' = 'novo';
              if (c.status === 'EM_ANDAMENTO') status = 'andamento';
              else if (c.status === 'RESOLVIDO') status = 'resolvido';

              const openTime = c.dataAbertura
                ? new Date(c.dataAbertura)
                : new Date(now - (idx + 1) * HOUR_MS * 4);
              const escTime = new Date(openTime.getTime() + 15 * MIN_MS);
              const catLabel = mapCategoriaLabel(c.categoria);

              const defaultNote =
                c.notaPortaria ||
                (catLabel === 'Segurança'
                  ? 'Verifiquei no local: situação requer atenção imediata da administração.'
                  : catLabel === 'Reclamação'
                  ? 'Já conversei com o morador responsável, mas requer intervenção da administração.'
                  : catLabel === 'Sugestão'
                  ? 'Sugestão encaminhada pela portaria para avaliação da administração.'
                  : 'Ocorrência verificada pela portaria e escalada para providências.');

              const initialMsgs: OuvidoriaMsg[] = [
                {
                  f: 'm',
                  t: c.descricao || c.assunto || 'Solicitação aberta pelo morador.',
                  at: openTime,
                },
                {
                  f: 'p',
                  t: 'Recebido na portaria e escalado para a administração.',
                  at: escTime,
                },
              ];

              if (status === 'resolvido') {
                initialMsgs.push({
                  f: 's',
                  t: 'Demanda atendida e concluída pela administração.',
                  at: new Date(escTime.getTime() + 2 * HOUR_MS),
                });
              }

              return {
                id: String(c.id),
                backendId: String(c.id),
                cat: catLabel,
                subject: c.assunto || 'Chamado sem título',
                unit: c.unidadeTexto || 'Unidade Geral',
                who: c.moradorSolicitante || 'Morador',
                status,
                esc: escTime,
                resolvedAt:
                  status === 'resolvido' ? new Date(escTime.getTime() + 2 * HOUR_MS) : null,
                note: defaultNote,
                msgs: initialMsgs,
                fotoAnexo: c.fotoAnexo || null,
              };
            },
          );

          setItems((prev) =>
            mapped.map((m) => {
              const existing = prev.find((p) => p.id === m.id);
              if (existing && existing.msgs.length > m.msgs.length) {
                return {
                  ...m,
                  msgs: existing.msgs,
                  resolvedAt: existing.resolvedAt ?? m.resolvedAt,
                };
              }
              return m;
            }),
          );
        }
      }
    } catch (err) {
      console.warn('Usando dados demonstrativos para ouvidoria:', err);
    }
  }, []);

  useEffect(() => {
    fetchChamados();
  }, [fetchChamados]);

  useWebSocket('/topic/chamados', () => {
    fetchChamados();
  });

  const activeDetailItem = useMemo(
    () => items.find((i) => i.id === openDetailId) || null,
    [items, openDetailId],
  );

  const resolveTargetItem = useMemo(
    () => items.find((i) => i.id === resolveTargetId) || null,
    [items, resolveTargetId],
  );

  const isLong = useCallback(
    (i: OuvidoriaItem) => {
      return i.status === 'novo' && nowMs - i.esc.getTime() >= DAY_MS;
    },
    [nowMs],
  );

  const countNovo = useMemo(() => items.filter((i) => i.status === 'novo').length, [items]);
  const countAndamento = useMemo(
    () => items.filter((i) => i.status === 'andamento').length,
    [items],
  );
  const countResolvido = useMemo(
    () => items.filter((i) => i.status === 'resolvido').length,
    [items],
  );

  const shownItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((i) => {
        if (i.status !== filter) return false;
        if (!q) return true;
        const haystack = `${i.subject} ${i.unit} ${i.who} ${i.cat}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        if (filter === 'novo') {
          const sa = a.cat === 'Segurança' ? 0 : 1;
          const sb = b.cat === 'Segurança' ? 0 : 1;
          return sa !== sb ? sa - sb : a.esc.getTime() - b.esc.getTime();
        }
        if (filter === 'andamento') {
          return a.esc.getTime() - b.esc.getTime();
        }
        const ra = a.resolvedAt ? a.resolvedAt.getTime() : 0;
        const rb = b.resolvedAt ? b.resolvedAt.getTime() : 0;
        return rb - ra;
      });
  }, [items, filter, searchQuery]);

  const closeAllSheets = () => {
    setOpenDetailId(null);
    setResolveTargetId(null);
    setResolveNoteText('');
  };

  const syncBackendStatus = async (
    backendId: string | undefined,
    novoStatus: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO',
  ) => {
    if (!backendId) return;
    try {
      await api.put(`/api/v1/chamados/${backendId}/status`, { novoStatus });
      refreshCounts();
    } catch (err) {
      console.warn('Falha ao sincronizar status na API:', err);
    }
  };

  const handleTake = async (item: OuvidoriaItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'andamento' } : i)));
    showToast('Você assumiu o chamado');
    await syncBackendStatus(item.backendId, 'EM_ANDAMENTO');
  };

  const handleReopen = async (item: OuvidoriaItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'andamento', resolvedAt: null } : i)),
    );
    showToast('Chamado reaberto');
    await syncBackendStatus(item.backendId, 'EM_ANDAMENTO');
  };

  const handleOpenResolve = (item: OuvidoriaItem) => {
    setOpenDetailId(null);
    setResolveNoteText('');
    setResolveTargetId(item.id);
  };

  const handleOpenDetail = async (item: OuvidoriaItem) => {
    setOpenDetailId(item.id);
    if (!item.backendId) return;
    try {
      const res = await api.get(`/api/v1/chamados/${item.backendId}/mensagens`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const backendMsgs: OuvidoriaMsg[] = res.data.map(
          (m: { autorPapel?: string; texto: string; enviadaEm: string }) => ({
            f: m.autorPapel === 'SINDICO' ? 's' : m.autorPapel === 'PORTARIA' ? 'p' : 'm',
            t: m.texto,
            at: new Date(m.enviadaEm),
          }),
        );
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, msgs: [i.msgs[0], i.msgs[1], ...backendMsgs].filter(Boolean) } : i,
          ),
        );
      }
    } catch {
      // mantém histórico local
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolveTargetItem) return;
    const trimmed = resolveNoteText.trim();
    if (trimmed && contemAmeacas(trimmed)) {
      showToast('Entrada inválida detectada.');
      return;
    }

    const cleanNote = trimmed ? sanitizarEntrada(trimmed) : '';
    const targetId = resolveTargetItem.id;
    const backendId = resolveTargetItem.backendId;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== targetId) return i;
        const updatedMsgs = cleanNote
          ? [...i.msgs, { f: 's' as const, t: cleanNote, at: new Date() }]
          : i.msgs;
        return {
          ...i,
          msgs: updatedMsgs,
          status: 'resolvido',
          resolvedAt: new Date(),
        };
      }),
    );

    closeAllSheets();
    showToast('Chamado resolvido, morador notificado');
    if (backendId && cleanNote) {
      try {
        await api.post(`/api/v1/chamados/${backendId}/mensagens`, { texto: cleanNote });
      } catch {
        // fallback local
      }
    }
    await syncBackendStatus(backendId, 'RESOLVIDO');
  };

  const handleSendReply = async (text: string) => {
    if (!activeDetailItem) return;
    const v = text.trim();
    if (!v) return;

    if (contemAmeacas(v)) {
      showToast('Entrada inválida detectada.');
      return;
    }

    const cleanReply = sanitizarEntrada(v);
    const took = activeDetailItem.status === 'novo';
    const targetId = activeDetailItem.id;
    const backendId = activeDetailItem.backendId;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== targetId) return i;
        return {
          ...i,
          status: took ? 'andamento' : i.status,
          msgs: [...i.msgs, { f: 's', t: cleanReply, at: new Date() }],
        };
      }),
    );

    showToast(took ? 'Resposta enviada, você assumiu o chamado' : 'Resposta enviada');
    if (backendId) {
      try {
        await api.post(`/api/v1/chamados/${backendId}/mensagens`, { texto: cleanReply });
      } catch {
        // fallback local
      }
    }
    if (took) {
      await syncBackendStatus(backendId, 'EM_ANDAMENTO');
    }
  };

  const threadMessages: ThreadMessage[] = useMemo(() => {
    if (!activeDetailItem) return [];
    return activeDetailItem.msgs.map((m, idx) => ({
      id: String(idx),
      senderRole: ROLE_MAP[m.f],
      senderLabel: WHO_LABELS[m.f],
      text: m.t,
      timeLabel: `${WHO_LABELS[m.f]} · ${rel(m.at, nowMs)}`,
    }));
  }, [activeDetailItem, nowMs]);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="Ouvidoria"
        title="Demandas dos moradores"
        subtitle="Chamados escalados pela portaria para a administração."
        rightBadge={<LiveIndicator />}
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar assunto, unidade ou morador..."
      />

      <SegmentedTabs
        value={filter}
        onChange={(v) => setFilter(v as 'novo' | 'andamento' | 'resolvido')}
        items={[
          { id: 'novo', label: 'Novos', count: countNovo },
          { id: 'andamento', label: 'Em andamento', count: countAndamento },
          { id: 'resolvido', label: 'Resolvidos', count: countResolvido },
        ]}
      />

      {shownItems.length === 0 ? (
        filter === 'novo' ? (
          <EmptyState
            icon={<CheckCircle2 className="w-7 h-7 text-ok" />}
            title="Tudo em dia!"
            description="Nenhum chamado escalado para a administração no momento."
            tone="ok"
          />
        ) : (
          <EmptyState
            icon={<Check className="w-7 h-7 text-faint" />}
            title={
              filter === 'andamento'
                ? 'Nenhum chamado em andamento'
                : 'Nenhum chamado resolvido'
            }
            description={
              filter === 'andamento'
                ? 'Ao assumir um chamado, ele passa para esta aba.'
                : 'Os chamados concluídos ficam aqui como histórico.'
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-2.5">
          {shownItems.map((i) => {
            const long = isLong(i);
            const firstMsg = i.msgs[0]?.t || '';

            return (
              <ListCard key={i.id} tone={long ? 'warn' : 'default'}>
                <div className="flex justify-between items-center gap-2 mb-2">
                  <Badge tone={i.cat === 'Segurança' ? 'bad' : 'neutral'}>
                    {i.cat.toUpperCase()}
                  </Badge>
                  <span
                    className={`font-mono text-[11px] ${
                      long ? 'text-warn font-semibold' : 'text-dim'
                    }`}
                  >
                    Escalado {rel(i.esc, nowMs)}
                  </span>
                </div>

                <h3 className="text-[14.5px] font-bold text-ink m-0 leading-[1.3]">
                  {i.subject}
                </h3>
                <p className="text-[12.5px] text-dim leading-[1.45] mt-1 mb-0 line-clamp-2">
                  {firstMsg}
                </p>

                <div className="mt-2.5 p-[9px_11px] bg-canvas border border-line rounded-[10px] text-[12px] text-dim leading-[1.45] line-clamp-3">
                  <b className="text-ink">Nota da portaria:</b> {i.note}
                </div>

                <div className="flex justify-between items-center gap-2 mt-2.5 pt-2.5 border-t border-line text-[12px]">
                  <div className="text-dim truncate">
                    <span className="font-mono font-semibold text-ink">{i.unit}</span> · {i.who}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(i)}
                    className="bg-transparent border-0 text-brand font-bold text-[12px] cursor-pointer hover:underline shrink-0"
                  >
                    Conversa ({i.msgs.length})
                  </button>
                </div>

                {i.status === 'novo' && (
                  <div className="mt-3">
                    <Button variant="primary" fullWidth onClick={() => handleTake(i)}>
                      Assumir atendimento
                    </Button>
                  </div>
                )}

                {i.status === 'andamento' && (
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <Button variant="secondary" onClick={() => handleOpenDetail(i)}>
                      Responder
                    </Button>
                    <Button variant="primary" onClick={() => handleOpenResolve(i)}>
                      Resolver
                    </Button>
                  </div>
                )}

                {i.status === 'resolvido' && (
                  <div className="mt-2.5 flex flex-col gap-2">
                    <div className="font-mono text-[11px] text-ok font-semibold">
                      Resolvido {rel(i.resolvedAt, nowMs)}
                    </div>
                    <Button variant="secondary" fullWidth onClick={() => handleReopen(i)}>
                      Reabrir
                    </Button>
                  </div>
                )}
              </ListCard>
            );
          })}
        </div>
      )}

      {/* Detail / Conversation Sheet */}
      <BottomSheet
        open={!!activeDetailItem}
        onClose={closeAllSheets}
        title={activeDetailItem?.subject || ''}
      >
        {activeDetailItem && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12.5px] text-dim">
              <Badge tone={activeDetailItem.cat === 'Segurança' ? 'bad' : 'neutral'}>
                {activeDetailItem.cat.toUpperCase()}
              </Badge>
              <span className="font-mono font-semibold text-ink">{activeDetailItem.unit}</span>
              <span>· {activeDetailItem.who}</span>
            </div>

            <Thread
              messages={threadMessages}
              onSend={activeDetailItem.status === 'resolvido' ? undefined : handleSendReply}
              placeholder="Escrever resposta ao morador"
              disabledNote={
                activeDetailItem.status === 'resolvido'
                  ? `Chamado resolvido ${rel(activeDetailItem.resolvedAt, nowMs)}. Reabra para responder novamente.`
                  : undefined
              }
            />

            {activeDetailItem.status === 'novo' && (
              <p className="text-[11.5px] text-dim m-0">
                Ao responder, você assume o atendimento e o chamado vai para Em andamento.
              </p>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Resolve Sheet */}
      <BottomSheet
        open={!!resolveTargetItem}
        onClose={closeAllSheets}
        title="Resolver chamado"
        footer={
          resolveTargetItem ? (
            <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
              <Button variant="secondary" onClick={closeAllSheets}>
                Voltar
              </Button>
              <Button variant="primary" onClick={handleConfirmResolve}>
                Resolver chamado
              </Button>
            </div>
          ) : undefined
        }
      >
        {resolveTargetItem && (
          <div className="flex flex-col gap-3.5">
            <div className="text-[13px] text-dim">
              <span className="font-mono font-semibold text-ink">{resolveTargetItem.unit}</span> ·{' '}
              {resolveTargetItem.subject}
            </div>

            <TextAreaField
              label="Resposta final ao morador (opcional)"
              value={resolveNoteText}
              onChange={(e) => setResolveNoteText(e.target.value)}
              placeholder="Conte o que foi feito para resolver"
            />

            <p className="text-[12px] text-dim m-0">
              O morador é notificado de que o chamado foi resolvido.
            </p>
          </div>
        )}
      </BottomSheet>

      <Toast message={toastMessage} />
    </div>
  );
}
