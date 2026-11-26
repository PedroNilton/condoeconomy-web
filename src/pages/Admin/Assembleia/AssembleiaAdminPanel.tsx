import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, Plus, X } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import { escapeHtml } from '../../../utils/escapeHtml';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  ConfirmSheet,
  EmptyState,
  Field,
  ListCard,
  PageHead,
  ProgressBar,
  SegmentedTabs,
  TextAreaField,
  Toast,
  Toggle,
} from '../../../components/ui';

const TOTAL_UNIDADES = 168;
const DAY_MS = 86400000;
const HOUR_MS = 3600000;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtDT(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inMs(ms: number) {
  return new Date(Date.now() + ms);
}

const YN = ['Sim', 'Não', 'Abstenção'];

const TYPE_OPTIONS = [
  { value: 'yn', label: 'Sim / Não / Abstenção' },
  { value: 'multi', label: 'Múltipla escolha' },
] as const;

const START_OPTIONS = [
  { value: 'now', label: 'Agora' },
  { value: 'later', label: 'Agendar' },
] as const;

const DUR_OPTIONS = [
  { value: '1', label: '24 horas' },
  { value: '3', label: '3 dias' },
  { value: '7', label: '7 dias' },
] as const;

const QUORUM_OPTIONS = [
  { value: '30', label: '30%' },
  { value: '50', label: '50%' },
  { value: '66', label: '66%' },
] as const;

export interface PautaItem {
  id: string;
  title: string;
  desc: string;
  opts: string[];
  votes: number[];
  q: number;
  status: 'aberta' | 'agendada' | 'encerrada';
  start?: Date;
  end: Date;
  backendId?: string;
}

const INITIAL_DEMO_ITEMS: PautaItem[] = [
  {
    id: 'demo-1',
    title: 'Pintura da fachada',
    desc: 'Aprovar o orçamento de pintura da fachada dos 14 blocos, apresentado na última reunião.',
    opts: [...YN],
    votes: [41, 22, 9],
    q: 50,
    status: 'aberta',
    start: new Date(Date.now() - 1 * DAY_MS),
    end: inMs(2 * DAY_MS),
  },
  {
    id: 'demo-2',
    title: 'Cor da fachada',
    desc: 'Escolha da cor que será usada na pintura, caso a pauta anterior seja aprovada.',
    opts: ['Branco gelo', 'Cinza claro', 'Bege'],
    votes: [30, 25, 13],
    q: 50,
    status: 'aberta',
    start: new Date(Date.now() - 2 * DAY_MS),
    end: inMs(5 * HOUR_MS),
  },
  {
    id: 'demo-3',
    title: 'Troca do portão da garagem',
    desc: 'Substituir o portão atual por um modelo automatizado com controle por aplicativo.',
    opts: [...YN],
    votes: [0, 0, 0],
    q: 50,
    status: 'agendada',
    start: inMs(4 * DAY_MS),
    end: inMs(11 * DAY_MS),
  },
  {
    id: 'demo-4',
    title: 'Nova empresa de limpeza',
    desc: 'Contratar nova empresa de limpeza para áreas comuns a partir do próximo mês.',
    opts: [...YN],
    votes: [88, 31, 5],
    q: 50,
    status: 'encerrada',
    start: new Date(Date.now() - 10 * DAY_MS),
    end: inMs(-6 * DAY_MS),
  },
  {
    id: 'demo-5',
    title: 'Câmeras no bicicletário',
    desc: 'Instalar câmeras de monitoramento na área do bicicletário.',
    opts: [...YN],
    votes: [40, 12, 3],
    q: 50,
    status: 'encerrada',
    start: new Date(Date.now() - 15 * DAY_MS),
    end: inMs(-12 * DAY_MS),
  },
];

export function AssembleiaAdminPanel() {
  const [items, setItems] = useState<PautaItem[]>(INITIAL_DEMO_ITEMS);
  const [filter, setFilter] = useState<'aberta' | 'agendada' | 'encerrada'>('aberta');
  const [, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [isConfSheetOpen, setIsConfSheetOpen] = useState(false);
  const [confData, setConfData] = useState<{
    title: string;
    text: string;
    okLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const [nTitle, setNTitle] = useState('');
  const [nDesc, setNDesc] = useState('');
  const [nType, setNType] = useState<'yn' | 'multi'>('yn');
  const [nOptions, setNOptions] = useState<string[]>(['', '']);
  const [nStart, setNStart] = useState<'now' | 'later'>('now');
  const [nWhen, setNWhen] = useState('');
  const [nDur, setNDur] = useState<number>(3);
  const [nQuorum, setNQuorum] = useState<number>(50);
  const [nPartial, setNPartial] = useState(false);
  const [nPush, setNPush] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  const fetchVotacoes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/votacoes');
      const now = Date.now();
      setNowMs(now);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mappedPromises = res.data.map(
          async (v: {
            id: string | number;
            titulo: string;
            descricao?: string;
            dataAbertura?: string;
            dataEncerramento?: string;
            status?: string;
            opcoes?: { titulo: string }[];
          }) => {
            let votesList: number[] = [];
            try {
              const resRes = await api.get(`/api/v1/votacoes/${v.id}/resultado`);
              if (resRes.data && Array.isArray(resRes.data.opcoes)) {
                votesList = resRes.data.opcoes.map((o: { votos?: number }) => o.votos || 0);
              }
            } catch {
              votesList = v.opcoes ? v.opcoes.map(() => 0) : [];
            }

            const optsTitles = v.opcoes ? v.opcoes.map((o) => o.titulo) : YN;
            if (votesList.length < optsTitles.length) {
              votesList = optsTitles.map(() => 0);
            }

            const startDate = v.dataAbertura ? new Date(v.dataAbertura) : new Date(now);
            const endDate = v.dataEncerramento
              ? new Date(v.dataEncerramento)
              : new Date(now + 3 * DAY_MS);

            let statusCalculado: 'aberta' | 'agendada' | 'encerrada' = 'aberta';
            if (v.status === 'ENCERRADA' || endDate.getTime() < now) {
              statusCalculado = 'encerrada';
            } else if (startDate.getTime() > now) {
              statusCalculado = 'agendada';
            }

            return {
              id: String(v.id),
              backendId: String(v.id),
              title: v.titulo,
              desc: v.descricao || '',
              opts: optsTitles,
              votes: votesList,
              q: 50,
              status: statusCalculado,
              start: startDate,
              end: endDate,
            } as PautaItem;
          },
        );

        const apiItems = await Promise.all(mappedPromises);
        setItems(apiItems);
      }
    } catch (err) {
      console.warn('Usando dados demonstrativos para assembleias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotacoes();
  }, [fetchVotacoes]);

  const cast = useCallback((p: PautaItem) => {
    return p.votes.reduce((a, b) => a + b, 0);
  }, []);

  const leader = useCallback((p: PautaItem) => {
    const m = Math.max(...p.votes);
    return m > 0 ? p.votes.indexOf(m) : -1;
  }, []);

  const remaining = useCallback(
    (p: PautaItem) => {
      const h = Math.max(Math.ceil((p.end.getTime() - nowMs) / HOUR_MS), 0);
      return {
        urgent: h < 24,
        text: h < 24 ? `Encerra em ${h} h` : `Encerra em ${Math.round(h / 24)} dias`,
      };
    },
    [nowMs],
  );

  const countAberta = useMemo(() => items.filter((p) => p.status === 'aberta').length, [items]);
  const countAgendada = useMemo(() => items.filter((p) => p.status === 'agendada').length, [items]);
  const countEncerrada = useMemo(
    () => items.filter((p) => p.status === 'encerrada').length,
    [items],
  );

  const shownItems = useMemo(() => {
    return items
      .filter((p) => p.status === filter)
      .sort((a, b) => {
        if (filter === 'encerrada') {
          return b.end.getTime() - a.end.getTime();
        }
        const timeA = a.start ? a.start.getTime() : a.end.getTime();
        const timeB = b.start ? b.start.getTime() : b.end.getTime();
        return timeA - timeB;
      });
  }, [items, filter]);

  const handleRemind = (p: PautaItem) => {
    const c = cast(p);
    const missing = Math.max(TOTAL_UNIDADES - c, 0);
    showToast(`Lembrete enviado a ${missing} unidades que ainda não votaram`);
  };

  const handleDownloadPdf = (p: PautaItem) => {
    const c = cast(p);
    const leadIdx = leader(p);
    const leadName = leadIdx > -1 ? p.opts[leadIdx] : '—';
    const need = Math.ceil((TOTAL_UNIDADES * p.q) / 100);
    const ok = c >= need;

    const win = window.open('', '_blank');
    if (win) {
      win.opener = null;
      const safeTitle = escapeHtml(p.title);
      const safeDesc = escapeHtml(p.desc);
      const safeLeadName = escapeHtml(leadName);
      win.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Ata de Votação - ${safeTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #16181D; background: #fff; }
            .header { border-bottom: 2px solid #1E40AF; padding-bottom: 14px; margin-bottom: 24px; }
            .logo { font-size: 22px; font-weight: 800; color: #1E40AF; }
            .sub { color: #75767E; font-size: 13px; margin-top: 4px; }
            .card { border: 1px solid #E4E4E8; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
            h2 { margin: 0 0 8px; font-size: 18px; }
            p { color: #75767E; font-size: 14px; line-height: 1.5; margin: 0 0 16px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F1F3; font-size: 13.5px; }
            .info-row b { color: #16181D; font-family: monospace; }
            .opts-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13.5px; }
            .opts-table th, .opts-table td { padding: 10px; border-bottom: 1px solid #E4E4E8; text-align: left; }
            .opts-table th { background: #FAFAFA; color: #75767E; font-size: 12px; text-transform: uppercase; }
            .lead-row { background: #EFF4FF; font-weight: bold; }
            .btn { display: inline-block; padding: 10px 18px; background: #1E40AF; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; margin-bottom: 20px; }
            @media print { .btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button>
          <div class="header">
            <div class="logo">HabitOS · Gestão Condominial</div>
            <div class="sub">Relatório Oficial de Assembleia Virtual</div>
          </div>
          <div class="card">
            <h2>${safeTitle}</h2>
            <p>${safeDesc}</p>
            <div class="info-row"><span>Status da Assembleia:</span><b>ENCERRADA</b></div>
            <div class="info-row"><span>Data de Encerramento:</span><b>${escapeHtml(fmtDT(p.end))}</b></div>
            <div class="info-row"><span>Participação Total:</span><b>${c} de ${TOTAL_UNIDADES} unidades (${Math.round((c / TOTAL_UNIDADES) * 100)}%)</b></div>
            <div class="info-row"><span>Quórum Mínimo Requerido:</span><b>${p.q}% (${need} unidades)</b></div>
            <div class="info-row"><span>Resultado do Quórum:</span><b>${ok ? 'Quórum Atingido' : 'Quórum Não Atingido'}</b></div>
            <div class="info-row"><span>Opção Mais Votada:</span><b>${safeLeadName}</b></div>
          </div>
          <h3>Apuração dos Votos</h3>
          <table class="opts-table">
            <thead>
              <tr>
                <th>Opção</th>
                <th>Votos</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              ${p.opts
                .map((opt, i) => {
                  const votesCount = p.votes[i] || 0;
                  const pct = c > 0 ? Math.round((votesCount / c) * 100) : 0;
                  const isLead = i === leadIdx;
                  return `
                  <tr class="${isLead ? 'lead-row' : ''}">
                    <td>${escapeHtml(opt)} ${isLead ? '★ (Mais votada)' : ''}</td>
                    <td><b>${votesCount}</b></td>
                    <td><b>${pct}%</b></td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </body>
        </html>
      `);
      win.document.close();
    }
    showToast('Resultado gerado em PDF');
  };

  const handleOpenCloseConfirm = (p: PautaItem) => {
    setConfData({
      title: 'Encerrar votação agora?',
      text: `Os moradores não poderão mais votar em "${p.title}". O resultado fica registrado na aba Encerradas.`,
      okLabel: 'Encerrar votação',
      onConfirm: async () => {
        try {
          if (p.backendId) {
            await api.put(`/api/v1/votacoes/${p.backendId}/encerrar`);
          }
        } catch (err) {
          console.warn('Erro ao encerrar votação na API:', err);
        }
        setItems((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, status: 'encerrada', end: new Date() } : item,
          ),
        );
        setIsConfSheetOpen(false);
        showToast('Votação encerrada');
      },
    });
    setIsConfSheetOpen(true);
  };

  const handleOpenCancelConfirm = (p: PautaItem) => {
    setConfData({
      title: 'Cancelar esta pauta?',
      text: `"${p.title}" é removida e os moradores que já foram avisados recebem a informação do cancelamento.`,
      okLabel: 'Cancelar pauta',
      onConfirm: () => {
        setItems((prev) => prev.filter((item) => item.id !== p.id));
        setIsConfSheetOpen(false);
        showToast('Pauta cancelada');
      },
    });
    setIsConfSheetOpen(true);
  };

  const isFormValid = useMemo(() => {
    const hasTitle = nTitle.trim().length > 0;
    const hasDesc = nDesc.trim().length > 0;
    if (!hasTitle || !hasDesc) return false;

    if (nType === 'multi') {
      const validOpts = nOptions.map((o) => o.trim()).filter(Boolean);
      if (validOpts.length < 2) return false;
    }

    if (nStart === 'later' && !nWhen) {
      return false;
    }

    return true;
  }, [nTitle, nDesc, nType, nOptions, nStart, nWhen]);

  const handlePublish = async () => {
    if (!isFormValid || submitting) return;

    if (contemAmeacas(nTitle) || contemAmeacas(nDesc) || nOptions.some(contemAmeacas)) {
      showToast('Entrada inválida: caracteres não permitidos detectados.');
      return;
    }

    setSubmitting(true);
    const opts = nType === 'yn' ? [...YN] : nOptions.map((o) => sanitizarEntrada(o)).filter(Boolean);
    const startDate = nStart === 'later' && nWhen ? new Date(nWhen) : new Date();
    const endDate = new Date(startDate.getTime() + nDur * DAY_MS);
    const status: 'aberta' | 'agendada' = nStart === 'later' ? 'agendada' : 'aberta';

    let backendId: string | undefined = undefined;

    try {
      const res = await api.post('/api/v1/votacoes', {
        titulo: sanitizarEntrada(nTitle),
        descricao: sanitizarEntrada(nDesc),
        dataEncerramento: endDate.toISOString().slice(0, 19),
        opcoes: opts,
      });
      if (res.data && res.data.id) {
        backendId = String(res.data.id);
      }
    } catch (err) {
      console.warn('API post erro, usando local:', err);
    }

    const newItem: PautaItem = {
      id: backendId || `p-${Date.now()}`,
      backendId,
      title: sanitizarEntrada(nTitle),
      desc: sanitizarEntrada(nDesc),
      opts,
      votes: opts.map(() => 0),
      q: nQuorum,
      status,
      start: startDate,
      end: endDate,
    };

    setItems((prev) => [newItem, ...prev]);

    setNTitle('');
    setNDesc('');
    setNOptions(['', '']);
    setNType('yn');
    setNStart('now');
    setNWhen('');
    setNDur(3);
    setNQuorum(50);
    setIsNewSheetOpen(false);
    setSubmitting(false);

    setFilter(status);
    showToast(
      status === 'aberta'
        ? `Votação aberta para ${TOTAL_UNIDADES} unidades`
        : `Pauta agendada para ${fmtDT(startDate)}`,
    );
  };

  const handleAddOptionInput = () => {
    if (nOptions.length >= 5) return;
    setNOptions((prev) => [...prev, '']);
  };

  const handleRemoveOptionInput = (idx: number) => {
    if (nOptions.length <= 2) return;
    setNOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="Decisões"
        title="Assembleias"
        action={
          <Button
            variant="primary"
            size="mini"
            onClick={() => setIsNewSheetOpen(true)}
            className="!h-[38px] !px-3.5 !text-[13px]"
          >
            <Plus className="w-[15px] h-[15px]" />
            Nova pauta
          </Button>
        }
      />

      <SegmentedTabs
        value={filter}
        onChange={(v) => setFilter(v as 'aberta' | 'agendada' | 'encerrada')}
        items={[
          { id: 'aberta', label: 'Em votação', count: countAberta },
          { id: 'agendada', label: 'Agendadas', count: countAgendada },
          { id: 'encerrada', label: 'Encerradas', count: countEncerrada },
        ]}
      />

      {shownItems.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-7 h-7 text-faint" />}
          title="Nenhuma assembleia"
          description={
            filter === 'aberta'
              ? 'Crie uma nova pauta para os moradores votarem.'
              : filter === 'agendada'
              ? 'Agende uma pauta para avisar os moradores com antecedência.'
              : 'Os resultados das votações finalizadas ficam aqui.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {shownItems.map((p) => {
            const c = cast(p);
            const leadIdx = leader(p);
            const pct = Math.round((c / TOTAL_UNIDADES) * 100);
            const need = Math.ceil((TOTAL_UNIDADES * p.q) / 100);
            const ok = c >= need;

            return (
              <ListCard key={p.id}>
                <div className="flex justify-between items-start gap-2.5">
                  <h3 className="text-[15.5px] font-extrabold text-ink leading-[1.3] m-0">
                    {p.title}
                  </h3>
                  <Badge
                    tone={
                      p.status === 'aberta'
                        ? 'brand'
                        : p.status === 'agendada'
                        ? 'warn'
                        : 'neutral'
                    }
                  >
                    {p.status === 'aberta'
                      ? 'EM VOTAÇÃO'
                      : p.status === 'agendada'
                      ? 'AGENDADA'
                      : 'ENCERRADA'}
                  </Badge>
                </div>

                <p className="text-[12.5px] text-dim leading-[1.5] mt-1.5 mb-0">{p.desc}</p>

                {p.status === 'aberta' && (
                  <div className="flex flex-col gap-3 mt-3">
                    {(() => {
                      const r = remaining(p);
                      return (
                        <div
                          className={`font-mono text-[11px] ${
                            r.urgent ? 'text-warn font-semibold' : 'text-dim'
                          }`}
                        >
                          {r.text} · {fmtDT(p.end)}
                        </div>
                      );
                    })()}

                    <div className="p-[11px_12px] bg-canvas border border-line rounded-[10px]">
                      <div className="flex justify-between text-[11.5px] text-dim mb-2">
                        <span>Participação</span>
                        <b className="font-mono text-ink font-semibold">
                          {c} de {TOTAL_UNIDADES} unidades · {pct}%
                        </b>
                      </div>
                      <ProgressBar
                        percent={pct}
                        quorumPercent={p.q}
                        tone={ok ? 'ok' : 'warn'}
                        height="sm"
                      />
                      <div
                        className={`text-[11px] font-semibold mt-2 ${
                          ok ? 'text-ok' : 'text-warn'
                        }`}
                      >
                        {ok ? 'Quórum atingido' : `Faltam ${need - c} unidades para o quórum`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {p.opts.map((opt, i) => {
                        const votesCount = p.votes[i] || 0;
                        const optPct = c > 0 ? Math.round((votesCount / c) * 100) : 0;
                        const isLead = i === leadIdx;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[12.5px] mb-1">
                              <span className="font-semibold text-ink">{opt}</span>
                              <b className="font-mono text-[12px] font-semibold text-ink">
                                {votesCount} · {optPct}%
                              </b>
                            </div>
                            <div className="h-[7px] rounded-full bg-line overflow-hidden">
                              <div
                                style={{ width: `${optPct}%` }}
                                className={`h-full rounded-full transition-all ${
                                  isLead ? 'bg-brand' : 'bg-line-strong'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <Button variant="secondary" onClick={() => handleRemind(p)}>
                        Lembrar quem falta
                      </Button>
                      <Button variant="ghost-danger" onClick={() => handleOpenCloseConfirm(p)}>
                        Encerrar agora
                      </Button>
                    </div>
                  </div>
                )}

                {p.status === 'agendada' && (
                  <div className="flex flex-col gap-2.5 mt-3">
                    <div className="font-mono text-[11px] text-dim">
                      Abre em {p.start ? fmtDT(p.start) : '—'} · encerra {fmtDT(p.end)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.opts.map((opt, i) => (
                        <span
                          key={i}
                          className="text-[11.5px] font-semibold text-dim bg-canvas border border-line rounded-full px-2.5 py-1"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between text-[11.5px] text-dim">
                      <span>Quórum mínimo</span>
                      <b className="font-mono text-ink font-semibold">{p.q}%</b>
                    </div>
                    <Button
                      variant="ghost-danger"
                      fullWidth
                      onClick={() => handleOpenCancelConfirm(p)}
                    >
                      Cancelar pauta
                    </Button>
                  </div>
                )}

                {p.status === 'encerrada' && (
                  <div className="flex flex-col gap-3 mt-3">
                    <div className="font-mono text-[11px] text-dim">
                      Encerrada em {fmtDT(p.end)}
                    </div>

                    <div className="p-[11px_12px] bg-canvas border border-line rounded-[10px]">
                      <div className="flex justify-between text-[11.5px] text-dim mb-2">
                        <span>Participação</span>
                        <b className="font-mono text-ink font-semibold">
                          {c} de {TOTAL_UNIDADES} unidades · {pct}%
                        </b>
                      </div>
                      <ProgressBar
                        percent={pct}
                        quorumPercent={p.q}
                        tone={ok ? 'ok' : 'warn'}
                        height="sm"
                      />
                      <div
                        className={`text-[11px] font-semibold mt-2 ${
                          ok ? 'text-ok' : 'text-warn'
                        }`}
                      >
                        {ok
                          ? 'Quórum atingido'
                          : `Quórum não atingido (${c} de ${need} unidades necessárias)`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {p.opts.map((opt, i) => {
                        const votesCount = p.votes[i] || 0;
                        const optPct = c > 0 ? Math.round((votesCount / c) * 100) : 0;
                        const isLead = i === leadIdx;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[12.5px] mb-1">
                              <span className="font-semibold text-ink">{opt}</span>
                              <b className="font-mono text-[12px] font-semibold text-ink">
                                {votesCount} · {optPct}%
                              </b>
                            </div>
                            <div className="h-[7px] rounded-full bg-line overflow-hidden">
                              <div
                                style={{ width: `${optPct}%` }}
                                className={`h-full rounded-full transition-all ${
                                  isLead ? 'bg-brand' : 'bg-line-strong'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[12px] leading-[1.5] text-dim bg-canvas border border-line rounded-[10px] p-[10px_12px]">
                      Opção mais votada:{' '}
                      <b className="text-ink">{leadIdx > -1 ? p.opts[leadIdx] : '—'}</b>
                    </div>

                    <Button variant="secondary" fullWidth onClick={() => handleDownloadPdf(p)}>
                      Baixar resultado (PDF)
                    </Button>
                  </div>
                )}
              </ListCard>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet - Nova Pauta */}
      <BottomSheet
        open={isNewSheetOpen}
        onClose={() => setIsNewSheetOpen(false)}
        title="Nova pauta"
        footer={
          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
            <Button variant="secondary" onClick={() => setIsNewSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!isFormValid || submitting}
              onClick={handlePublish}
            >
              {submitting ? 'Publicando...' : 'Publicar pauta'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Título"
            value={nTitle}
            onChange={(e) => setNTitle(e.target.value)}
            placeholder="Ex: Pintura da fachada"
          />

          <TextAreaField
            label="Descrição"
            value={nDesc}
            onChange={(e) => setNDesc(e.target.value)}
            placeholder="Explique o que será decidido e o que muda para os moradores"
          />

          <ChoiceChips
            label="Tipo de votação"
            options={TYPE_OPTIONS}
            value={nType}
            onChange={(v) => setNType(v as 'yn' | 'multi')}
          />

          {nType === 'multi' && (
            <div className="flex flex-col gap-2">
              <span className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim">
                Opções
              </span>
              {nOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Field
                    value={opt}
                    onChange={(e) => {
                      const next = [...nOptions];
                      next[idx] = e.target.value;
                      setNOptions(next);
                    }}
                    placeholder={`Opção ${idx + 1}`}
                  />
                  {nOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionInput(idx)}
                      className="text-bad p-2 hover:bg-bad-soft rounded-lg cursor-pointer shrink-0"
                      title="Remover opção"
                      aria-label="Remover opção"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {nOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOptionInput}
                  className="text-left text-[12.5px] font-bold text-brand bg-transparent border-0 p-1 cursor-pointer hover:underline"
                >
                  + Adicionar opção
                </button>
              )}
            </div>
          )}

          <ChoiceChips
            label="Início"
            options={START_OPTIONS}
            value={nStart}
            onChange={(v) => setNStart(v as 'now' | 'later')}
          />

          {nStart === 'later' && (
            <Field
              type="datetime-local"
              value={nWhen}
              onChange={(e) => setNWhen(e.target.value)}
            />
          )}

          <ChoiceChips
            label="Duração da votação"
            options={DUR_OPTIONS}
            value={String(nDur)}
            onChange={(v) => setNDur(Number(v))}
          />

          <ChoiceChips
            label="Quórum mínimo de participação"
            options={QUORUM_OPTIONS}
            value={String(nQuorum)}
            onChange={(v) => setNQuorum(Number(v))}
          />

          <div className="divide-y divide-line border-y border-line">
            <div className="py-1">
              <Toggle
                checked={nPartial}
                onChange={setNPartial}
                title="Mostrar resultado parcial aos moradores"
                description="Desligado: só você acompanha a contagem até encerrar."
              />
            </div>
            <div className="py-1">
              <Toggle
                checked={nPush}
                onChange={setNPush}
                title="Notificar moradores ao abrir"
                description="Envia push quando a votação começar."
              />
            </div>
          </div>

          <div className="text-[12px] leading-[1.5] text-dim bg-canvas border border-line rounded-[10px] p-[10px_12px]">
            Cada unidade tem 1 voto, registrado pelo morador titular. Confira na convenção do
            condomínio o quórum e o prazo de convocação exigidos.
          </div>
        </div>
      </BottomSheet>

      <ConfirmSheet
        open={isConfSheetOpen && !!confData}
        onClose={() => setIsConfSheetOpen(false)}
        title={confData?.title || ''}
        description={confData?.text}
        confirmLabel={confData?.okLabel || 'Confirmar'}
        destructive
        onConfirm={() => {
          if (confData?.onConfirm) confData.onConfirm();
        }}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
