import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useNotification } from '../../../contexts/NotificationContext';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

const MIN_MS = 60000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

function ago(ms: number) {
  return new Date(Date.now() - ms);
}

function rel(d?: Date | null) {
  if (!d) return 'agora';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
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

  // Sheet states
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [resolveNoteText, setResolveNoteText] = useState('');

  const threadRef = useRef<HTMLDivElement | null>(null);
  const replyInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Carregar chamados reais da API
  const fetchChamados = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/chamados');
      if (Array.isArray(res.data)) {
        const escalados = res.data.filter((c: any) => c.escaladoSindico);
        if (escalados.length > 0) {
          const mapped: OuvidoriaItem[] = escalados.map((c: any, idx: number) => {
            let status: 'novo' | 'andamento' | 'resolvido' = 'novo';
            if (c.status === 'EM_ANDAMENTO') status = 'andamento';
            else if (c.status === 'RESOLVIDO') status = 'resolvido';

            const openTime = c.dataAbertura ? new Date(c.dataAbertura) : ago((idx + 1) * HOUR_MS * 4);
            const escTime = new Date(openTime.getTime() + 15 * MIN_MS);
            const catLabel = mapCategoriaLabel(c.categoria);

            const defaultNote =
              catLabel === 'Segurança'
                ? 'Verifiquei no local: situação requer atenção imediata da administração.'
                : catLabel === 'Reclamação'
                ? 'Já conversei com o morador responsável, mas requer intervenção da administração.'
                : catLabel === 'Sugestão'
                ? 'Sugestão encaminhada pela portaria para avaliação da administração.'
                : 'Ocorrência verificada pela portaria e escalada para providências.';

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
              resolvedAt: status === 'resolvido' ? new Date(escTime.getTime() + 2 * HOUR_MS) : null,
              note: defaultNote,
              msgs: initialMsgs,
              fotoAnexo: c.fotoAnexo || null,
            };
          });

          setItems(prev => {
            // Preserva mensagens locais já adicionadas caso o item já exista no estado
            return mapped.map(m => {
              const existing = prev.find(p => p.id === m.id);
              if (existing && existing.msgs.length > m.msgs.length) {
                return { ...m, msgs: existing.msgs, resolvedAt: existing.resolvedAt ?? m.resolvedAt };
              }
              return m;
            });
          });
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

  // Scroll automático da conversa quando abre ou recebe mensagem
  const activeDetailItem = useMemo(
    () => items.find(i => i.id === openDetailId) || null,
    [items, openDetailId]
  );

  const resolveTargetItem = useMemo(
    () => items.find(i => i.id === resolveTargetId) || null,
    [items, resolveTargetId]
  );

  useEffect(() => {
    if (activeDetailItem && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeDetailItem, activeDetailItem?.msgs.length]);

  // Verifica se chamado novo está aguardando há mais de 24h
  const isLong = useCallback((i: OuvidoriaItem) => {
    return i.status === 'novo' && Date.now() - i.esc.getTime() >= DAY_MS;
  }, []);

  // Contadores de abas
  const countNovo = useMemo(() => items.filter(i => i.status === 'novo').length, [items]);
  const countAndamento = useMemo(() => items.filter(i => i.status === 'andamento').length, [items]);
  const countResolvido = useMemo(() => items.filter(i => i.status === 'resolvido').length, [items]);

  // Lista filtrada e ordenada
  const shownItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter(i => {
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
    setReplyText('');
    setResolveNoteText('');
  };

  // Atualizar status na API quando houver backendId
  const syncBackendStatus = async (backendId: string | undefined, novoStatus: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    if (!backendId) return;
    try {
      await api.put(`/api/v1/chamados/${backendId}/status`, { novoStatus });
      refreshCounts();
    } catch (err) {
      console.warn('Falha ao sincronizar status na API:', err);
    }
  };

  // Ação: Assumir atendimento
  const handleTake = async (item: OuvidoriaItem) => {
    setItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, status: 'andamento' } : i))
    );
    showToast('Você assumiu o chamado');
    await syncBackendStatus(item.backendId, 'EM_ANDAMENTO');
  };

  // Ação: Reabrir chamado
  const handleReopen = async (item: OuvidoriaItem) => {
    setItems(prev =>
      prev.map(i =>
        i.id === item.id ? { ...i, status: 'andamento', resolvedAt: null } : i
      )
    );
    showToast('Chamado reaberto');
    await syncBackendStatus(item.backendId, 'EM_ANDAMENTO');
  };

  // Ação: Abrir sheet de resolução
  const handleOpenResolve = (item: OuvidoriaItem) => {
    setOpenDetailId(null);
    setResolveNoteText('');
    setResolveTargetId(item.id);
  };

  // Ação: Confirmar resolução do chamado
  const handleConfirmResolve = async () => {
    if (!resolveTargetItem) return;
    const trimmed = resolveNoteText.trim();
    if (trimmed && contemAmeacas(trimmed)) {
      alert('Entrada inválida detectada.');
      return;
    }

    const cleanNote = trimmed ? sanitizarEntrada(trimmed) : '';
    const targetId = resolveTargetItem.id;
    const backendId = resolveTargetItem.backendId;

    setItems(prev =>
      prev.map(i => {
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
      })
    );

    closeAllSheets();
    showToast('Chamado resolvido, morador notificado');
    await syncBackendStatus(backendId, 'RESOLVIDO');
  };

  // Ação: Enviar resposta na conversa
  const handleSendReply = async () => {
    if (!activeDetailItem) return;
    const v = replyText.trim();
    if (!v) return;

    if (contemAmeacas(v)) {
      alert('Entrada inválida detectada.');
      return;
    }

    const cleanReply = sanitizarEntrada(v);
    const took = activeDetailItem.status === 'novo';
    const targetId = activeDetailItem.id;
    const backendId = activeDetailItem.backendId;

    setItems(prev =>
      prev.map(i => {
        if (i.id !== targetId) return i;
        return {
          ...i,
          status: took ? 'andamento' : i.status,
          msgs: [...i.msgs, { f: 's', t: cleanReply, at: new Date() }],
        };
      })
    );

    setReplyText('');
    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }

    showToast(took ? 'Resposta enviada, você assumiu o chamado' : 'Resposta enviada');
    if (took) {
      await syncBackendStatus(backendId, 'EM_ANDAMENTO');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <style>{`
        .ouvidoria-page-head { padding: 10px 18px 0; }
        .ouvidoria-eyebrow-row { display: flex; justify-content: space-between; align-items: center; }
        .ouvidoria-eyebrow { font-size: 11px; font-weight: 700; color: var(--ds-faint); text-transform: uppercase; letter-spacing: .06em; }
        .ouvidoria-live { display: flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--ds-success); letter-spacing: .03em; font-weight: 600; }
        .ouvidoria-live i { width: 6px; height: 6px; border-radius: 50%; background: var(--ds-success); animation: ouvidoriaPulse 2.4s ease-in-out infinite; display: inline-block; }
        @keyframes ouvidoriaPulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
        @media (prefers-reduced-motion: reduce) { .ouvidoria-live i { animation: none; } }
        .ouvidoria-h1 { font-size: 21px; font-weight: 800; margin: 3px 0 4px; letter-spacing: -.01em; color: var(--ds-text); }
        .ouvidoria-lede { font-size: 12.5px; color: var(--ds-dim); margin: 0 0 14px; }

        .ouvidoria-search { position: relative; margin-bottom: 12px; }
        .ouvidoria-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--ds-faint); pointer-events: none; }
        .ouvidoria-search input { width: 100%; height: 46px; padding: 0 13px 0 38px; border-radius: 12px; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-text); font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .ouvidoria-search input:focus-visible { outline: 2px solid var(--ds-primary); outline-offset: 1px; }

        .ouvidoria-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 12px; }
        .ouvidoria-tab { border: none; background: none; font-family: inherit; font-size: 12px; font-weight: 700; color: var(--ds-dim); padding: 9px 2px; border-radius: 9px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all 0.15s; }
        .ouvidoria-tab b { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: var(--ds-text); }
        .ouvidoria-tab.active { background: var(--ds-primary-dim); color: var(--ds-primary); }
        .ouvidoria-tab.active b { color: var(--ds-primary); }

        .ouvidoria-main { flex: 1; padding: 14px 18px 110px; display: flex; flex-direction: column; gap: 10px; }

        .c-card { background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 14px; padding: 14px; }
        .c-card.long { border-color: var(--ds-warning); }
        .c-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
        .cat-pill { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: var(--ds-bg); color: var(--ds-dim); border: 1px solid var(--ds-border); letter-spacing: .03em; }
        .cat-pill.sec { background: var(--ds-danger-dim); color: var(--ds-danger); border-color: var(--ds-danger-dim); }
        .c-time { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--ds-faint); }
        .c-time.warn { color: var(--ds-warning); font-weight: 600; }
        .c-subject { font-size: 14.5px; font-weight: 700; color: var(--ds-text); }
        .c-prev { font-size: 12.5px; color: var(--ds-dim); line-height: 1.5; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .esc-box { margin-top: 10px; font-size: 12px; line-height: 1.5; background: var(--ds-bg); border: 1px solid var(--ds-border); border-radius: 10px; padding: 9px 11px; color: var(--ds-dim); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .esc-box b { color: var(--ds-text); font-weight: 700; }
        .c-who { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--ds-border); font-size: 12.5px; }
        .c-who span { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 12px; color: var(--ds-text); }
        .c-who em { font-style: normal; color: var(--ds-dim); }
        .ouv-link-btn { background: none; border: none; color: var(--ds-primary); font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 6px 0 6px 10px; }
        .c-actions { display: grid; gap: 10px; margin-top: 10px; }
        .c-actions.two { grid-template-columns: 1fr 1fr; }
        .ouv-btn { font-family: inherit; font-size: 13.5px; font-weight: 700; height: 46px; border-radius: 11px; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-text); cursor: pointer; transition: all 0.15s; }
        .ouv-btn:active { transform: scale(0.98); }
        .ouv-btn.primary { background: var(--ds-primary); border-color: var(--ds-primary); color: var(--ds-primary-ink); }
        .ouv-btn.primary:hover { filter: brightness(1.08); }
        .ouv-btn:disabled { opacity: .4; cursor: not-allowed; }
        .c-done { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--ds-success); margin-top: 8px; }

        .ouv-empty { text-align: center; padding: 40px 20px; background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 16px; }
        .ouv-empty .e-ico { width: 56px; height: 56px; border-radius: 50%; border: 3px solid var(--ds-success); color: var(--ds-success); display: grid; place-items: center; margin: 0 auto 14px; opacity: .85; }
        .ouv-empty .e-ico svg { width: 26px; height: 26px; }
        .ouv-empty .e-ico.n { border-color: var(--ds-border); color: var(--ds-faint); }
        .ouv-empty .e-t { font-size: 15px; font-weight: 800; margin-bottom: 4px; color: var(--ds-text); }
        .ouv-empty .e-s { font-size: 12.5px; color: var(--ds-dim); line-height: 1.5; }

        .ouv-overlay { position: fixed; inset: 0; background: rgba(10,10,14,.45); opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 50; }
        .ouv-overlay.show { opacity: 1; pointer-events: auto; }
        .ouv-sheet { position: fixed; left: 50%; bottom: 0; transform: translate(-50%, 100%); width: 100%; max-width: 412px; background: var(--ds-card); border-radius: 20px 20px 0 0; padding: 20px 20px calc(20px + env(safe-area-inset-bottom,0px)); z-index: 51; transition: transform .25s ease; max-height: 92vh; display: flex; flex-direction: column; }
        .ouv-sheet.show { transform: translate(-50%, 0); }
        .s-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
        .s-head h2 { font-size: 16.5px; font-weight: 800; margin: 0; color: var(--ds-text); }
        .close-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); display: grid; place-items: center; cursor: pointer; flex: none; }
        .close-btn svg { width: 15px; height: 15px; }
        .s-sub { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ds-dim); margin-bottom: 12px; flex-wrap: wrap; }
        .s-sub span.unit-code { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--ds-text); }
        .thread { overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 2px 0 12px; max-height: 40vh; }
        .bubble { max-width: 86%; padding: 10px 12px; border-radius: 14px; font-size: 13px; line-height: 1.5; background: var(--ds-bg); border: 1px solid var(--ds-border); align-self: flex-start; color: var(--ds-text); }
        .bubble.p { align-self: flex-end; }
        .bubble.s { align-self: flex-end; background: var(--ds-primary-dim); border-color: var(--ds-primary-dim); }
        .bubble small { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--ds-faint); margin-top: 4px; }
        .bubble.s small { color: var(--ds-primary); opacity: .85; }
        .reply-bar { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--ds-border); }
        .reply-bar input { flex: 1; height: 46px; padding: 0 13px; border-radius: 11px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); font-family: inherit; font-size: 14px; outline: none; }
        .reply-bar input:focus { border-color: var(--ds-primary); }
        .ouv-sheet textarea { width: 100%; height: auto; min-height: 96px; padding: 11px 13px; border-radius: 11px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); font-family: inherit; font-size: 14px; resize: none; margin-bottom: 14px; outline: none; }
        .ouv-sheet textarea:focus { border-color: var(--ds-primary); }
        .reply-bar button { height: 46px; padding: 0 18px; border-radius: 11px; border: none; background: var(--ds-primary); color: var(--ds-primary-ink); font-family: inherit; font-weight: 700; font-size: 13.5px; cursor: pointer; }
        .s-note-ok { font-size: 12px; color: var(--ds-success); background: var(--ds-success-dim); border-radius: 10px; padding: 10px 12px; line-height: 1.5; }
        .s-hint { font-size: 11px; color: var(--ds-dim); margin-top: 8px; line-height: 1.4; }
        .ouv-lbl { font-size: 12px; font-weight: 700; color: var(--ds-dim); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px; display: block; }
        .sheet-actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }

        .ouv-toast { position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--ds-text); color: var(--ds-bg); font-size: 13px; font-weight: 600; padding: 11px 18px; border-radius: 10px; opacity: 0; transition: transform .25s, opacity .25s; z-index: 60; white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
        .ouv-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
      `}</style>

      {/* Page Header */}
      <div className="ouvidoria-page-head">
        <div className="ouvidoria-eyebrow-row">
          <span className="ouvidoria-eyebrow">Ouvidoria</span>
          <span className="ouvidoria-live">
            <i></i>AO VIVO
          </span>
        </div>
        <h1 className="ouvidoria-h1">Demandas dos moradores</h1>
        <p className="ouvidoria-lede">Chamados escalados pela portaria para a administração.</p>

        {/* Search Input */}
        <div className="ouvidoria-search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar assunto, morador ou unidade"
          />
        </div>

        {/* Tabs */}
        <div className="ouvidoria-tabs">
          <button
            type="button"
            onClick={() => setFilter('novo')}
            className={`ouvidoria-tab ${filter === 'novo' ? 'active' : ''}`}
          >
            Novos
            <b>{countNovo}</b>
          </button>
          <button
            type="button"
            onClick={() => setFilter('andamento')}
            className={`ouvidoria-tab ${filter === 'andamento' ? 'active' : ''}`}
          >
            Em andamento
            <b>{countAndamento}</b>
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolvido')}
            className={`ouvidoria-tab ${filter === 'resolvido' ? 'active' : ''}`}
          >
            Resolvidos
            <b>{countResolvido}</b>
          </button>
        </div>
      </div>

      {/* Main List */}
      <main className="ouvidoria-main">
        {shownItems.length === 0 ? (
          (() => {
            const hasSearch = searchQuery.trim().length > 0;
            const msg: [string, string, boolean] = hasSearch
              ? ['Nada encontrado', 'Confira o assunto, o nome ou a unidade digitados.', true]
              : filter === 'novo'
              ? ['Tudo em dia!', 'Nenhum chamado escalado para a administração no momento.', false]
              : filter === 'andamento'
              ? ['Nenhum chamado em andamento', 'Ao assumir um chamado, ele passa para esta aba.', true]
              : ['Nenhum chamado resolvido', 'Os chamados concluídos ficam aqui como histórico.', true];

            return (
              <div className="ouv-empty">
                <div className={`e-ico ${msg[2] ? 'n' : ''}`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div className="e-t">{msg[0]}</div>
                <div className="e-s">{msg[1]}</div>
              </div>
            );
          })()
        ) : (
          shownItems.map(i => {
            const long = isLong(i);
            const firstMsg = i.msgs[0]?.t || '';

            return (
              <div key={i.id} className={`c-card ${long ? 'long' : ''}`}>
                <div className="c-top">
                  <span className={`cat-pill ${i.cat === 'Segurança' ? 'sec' : ''}`}>
                    {i.cat.toUpperCase()}
                  </span>
                  <span className={`c-time ${long ? 'warn' : ''}`}>
                    Escalado {rel(i.esc)}
                  </span>
                </div>

                <div className="c-subject">{i.subject}</div>
                <div className="c-prev">{firstMsg}</div>

                <div className="esc-box">
                  <b>Nota da portaria:</b> {i.note}
                </div>

                <div className="c-who">
                  <div>
                    <span>{i.unit}</span> <em>· {i.who}</em>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenDetailId(i.id)}
                    className="ouv-link-btn"
                  >
                    Conversa ({i.msgs.length})
                  </button>
                </div>

                {i.status === 'novo' && (
                  <div className="c-actions">
                    <button
                      type="button"
                      onClick={() => handleTake(i)}
                      className="ouv-btn primary"
                    >
                      Assumir atendimento
                    </button>
                  </div>
                )}

                {i.status === 'andamento' && (
                  <div className="c-actions two">
                    <button
                      type="button"
                      onClick={() => setOpenDetailId(i.id)}
                      className="ouv-btn"
                    >
                      Responder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenResolve(i)}
                      className="ouv-btn primary"
                    >
                      Resolver
                    </button>
                  </div>
                )}

                {i.status === 'resolvido' && (
                  <>
                    <div className="c-done">Resolvido {rel(i.resolvedAt)}</div>
                    <div className="c-actions">
                      <button
                        type="button"
                        onClick={() => handleReopen(i)}
                        className="ouv-btn"
                      >
                        Reabrir
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Overlay Backdrop */}
      <div
        className={`ouv-overlay ${activeDetailItem || resolveTargetItem ? 'show' : ''}`}
        onClick={closeAllSheets}
      ></div>

      {/* Detail / Conversation Sheet */}
      <div className={`ouv-sheet ${activeDetailItem ? 'show' : ''}`}>
        {activeDetailItem && (
          <>
            <div className="s-head">
              <h2>{activeDetailItem.subject}</h2>
              <button
                type="button"
                onClick={closeAllSheets}
                className="close-btn"
                aria-label="Fechar"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="s-sub">
              <span className={`cat-pill ${activeDetailItem.cat === 'Segurança' ? 'sec' : ''}`}>
                {activeDetailItem.cat.toUpperCase()}
              </span>
              <span className="unit-code">{activeDetailItem.unit}</span> · {activeDetailItem.who}
            </div>

            <div className="thread" ref={threadRef}>
              {activeDetailItem.msgs.map((m, idx) => (
                <div key={idx} className={`bubble ${m.f}`}>
                  {m.t}
                  <small>
                    {WHO_LABELS[m.f]} · {rel(m.at)}
                  </small>
                </div>
              ))}
            </div>

            {activeDetailItem.status === 'resolvido' ? (
              <div className="s-note-ok">
                Chamado resolvido {rel(activeDetailItem.resolvedAt)}. Reabra para responder novamente.
              </div>
            ) : (
              <>
                <div className="reply-bar">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="Escrever resposta ao morador"
                  />
                  <button type="button" onClick={handleSendReply}>
                    Enviar
                  </button>
                </div>
                {activeDetailItem.status === 'novo' && (
                  <div className="s-hint">
                    Ao responder, você assume o atendimento e o chamado vai para Em andamento.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Resolve Sheet */}
      <div className={`ouv-sheet ${resolveTargetItem ? 'show' : ''}`}>
        {resolveTargetItem && (
          <>
            <div className="s-head">
              <h2>Resolver chamado</h2>
            </div>
            <div className="s-sub">
              <span className="unit-code">{resolveTargetItem.unit}</span> · {resolveTargetItem.subject}
            </div>
            <span className="ouv-lbl">Resposta final ao morador (opcional)</span>
            <textarea
              value={resolveNoteText}
              onChange={e => setResolveNoteText(e.target.value)}
              placeholder="Conte o que foi feito para resolver"
            ></textarea>
            <div className="sheet-actions">
              <button type="button" onClick={closeAllSheets} className="ouv-btn">
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="ouv-btn primary"
              >
                Resolver chamado
              </button>
            </div>
            <div className="s-hint">
              O morador é notificado de que o chamado foi resolvido.
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      <div className={`ouv-toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
}
