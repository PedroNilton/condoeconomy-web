import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

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

export interface PautaItem {
  id: string;
  title: string;
  desc: string;
  opts: string[];
  votes: number[];
  q: number; // Percentual de quórum (ex: 50)
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
    end: inMs(2 * DAY_MS)
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
    end: inMs(5 * HOUR_MS)
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
    end: inMs(11 * DAY_MS)
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
    end: inMs(-6 * DAY_MS)
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
    end: inMs(-12 * DAY_MS)
  }
];

export function AssembleiaAdminPanel() {
  const [items, setItems] = useState<PautaItem[]>(INITIAL_DEMO_ITEMS);
  const [filter, setFilter] = useState<'aberta' | 'agendada' | 'encerrada'>('aberta');
  const [, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sheets
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [isConfSheetOpen, setIsConfSheetOpen] = useState(false);
  const [confData, setConfData] = useState<{
    title: string;
    text: string;
    okLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // New Pauta Form State
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
    setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  // Fetch das votações reais da API
  const fetchVotacoes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/votacoes');
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Para cada votação da API, tentar buscar resultados atualizados
        const mappedPromises = res.data.map(async (v: any) => {
          let votesList: number[] = [];
          try {
            const resRes = await api.get(`/api/v1/votacoes/${v.id}/resultado`);
            if (resRes.data && Array.isArray(resRes.data.opcoes)) {
              votesList = resRes.data.opcoes.map((o: any) => o.votos || 0);
            }
          } catch {
            votesList = v.opcoes ? v.opcoes.map(() => 0) : [];
          }

          const optsTitles = v.opcoes ? v.opcoes.map((o: any) => o.titulo) : YN;
          if (votesList.length < optsTitles.length) {
            votesList = optsTitles.map(() => 0);
          }

          const startDate = v.dataAbertura ? new Date(v.dataAbertura) : new Date();
          const endDate = v.dataEncerramento ? new Date(v.dataEncerramento) : inMs(3 * DAY_MS);

          let statusCalculado: 'aberta' | 'agendada' | 'encerrada' = 'aberta';
          if (v.status === 'ENCERRADA' || endDate.getTime() < Date.now()) {
            statusCalculado = 'encerrada';
          } else if (startDate.getTime() > Date.now()) {
            statusCalculado = 'agendada';
          } else {
            statusCalculado = 'aberta';
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
            end: endDate
          } as PautaItem;
        });

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

  // Contagem de votos
  const cast = useCallback((p: PautaItem) => {
    return p.votes.reduce((a, b) => a + b, 0);
  }, []);

  // Índice da opção líder
  const leader = useCallback((p: PautaItem) => {
    const m = Math.max(...p.votes);
    return m > 0 ? p.votes.indexOf(m) : -1;
  }, []);

  // Tempo restante
  const remaining = useCallback((p: PautaItem) => {
    const h = Math.max(Math.ceil((p.end.getTime() - Date.now()) / HOUR_MS), 0);
    return {
      urgent: h < 24,
      text: h < 24 ? `Encerra em ${h} h` : `Encerra em ${Math.round(h / 24)} dias`
    };
  }, []);

  // Contagens por aba
  const countAberta = useMemo(() => items.filter(p => p.status === 'aberta').length, [items]);
  const countAgendada = useMemo(() => items.filter(p => p.status === 'agendada').length, [items]);
  const countEncerrada = useMemo(() => items.filter(p => p.status === 'encerrada').length, [items]);

  // Lista filtrada e ordenada
  const shownItems = useMemo(() => {
    return items
      .filter(p => p.status === filter)
      .sort((a, b) => {
        if (filter === 'encerrada') {
          return b.end.getTime() - a.end.getTime();
        }
        const timeA = a.start ? a.start.getTime() : a.end.getTime();
        const timeB = b.start ? b.start.getTime() : b.end.getTime();
        return timeA - timeB;
      });
  }, [items, filter]);

  // Ações
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
      win.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Ata de Votação - ${p.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #16181D; background: #fff; }
            .header { border-bottom: 2px solid #4338CA; padding-bottom: 14px; margin-bottom: 24px; }
            .logo { font-size: 22px; font-weight: 800; color: #4338CA; }
            .sub { color: #75767E; font-size: 13px; margin-top: 4px; }
            .card { border: 1px solid #E4E4E8; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
            h2 { margin: 0 0 8px; font-size: 18px; }
            p { color: #75767E; font-size: 14px; line-height: 1.5; margin: 0 0 16px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F1F3; font-size: 13.5px; }
            .info-row b { color: #16181D; font-family: monospace; }
            .opts-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13.5px; }
            .opts-table th, .opts-table td { padding: 10px; border-bottom: 1px solid #E4E4E8; text-align: left; }
            .opts-table th { background: #FAFAFA; color: #75767E; font-size: 12px; text-transform: uppercase; }
            .lead-row { background: #EEF0FF; font-weight: bold; }
            .btn { display: inline-block; padding: 10px 18px; background: #4338CA; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; margin-bottom: 20px; }
            @media print { .btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
          <div class="header">
            <div class="logo">HabitOS · Gestão Condominial</div>
            <div class="sub">Relatório Oficial de Assembleia Virtual · Mar Egeu Condomínio</div>
          </div>
          <div class="card">
            <h2>${p.title}</h2>
            <p>${p.desc}</p>
            <div class="info-row"><span>Status da Assembleia:</span><b>ENCERRADA</b></div>
            <div class="info-row"><span>Data de Encerramento:</span><b>${fmtDT(p.end)}</b></div>
            <div class="info-row"><span>Participação Total:</span><b>${c} de ${TOTAL_UNIDADES} unidades (${Math.round((c / TOTAL_UNIDADES) * 100)}%)</b></div>
            <div class="info-row"><span>Quórum Mínimo Requerido:</span><b>${p.q}% (${need} unidades)</b></div>
            <div class="info-row"><span>Resultado do Quórum:</span><b>${ok ? '✅ Quórum Atingido' : '⚠️ Quórum Não Atingido'}</b></div>
            <div class="info-row"><span>Opção Mais Votada:</span><b>${leadName}</b></div>
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
              ${p.opts.map((opt, i) => {
                const votesCount = p.votes[i] || 0;
                const pct = c > 0 ? Math.round((votesCount / c) * 100) : 0;
                const isLead = i === leadIdx;
                return `
                  <tr class="${isLead ? 'lead-row' : ''}">
                    <td>${opt} ${isLead ? '★ (Mais votada)' : ''}</td>
                    <td><b>${votesCount}</b></td>
                    <td><b>${pct}%</b></td>
                  </tr>
                `;
              }).join('')}
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
        setItems(prev =>
          prev.map(item =>
            item.id === p.id ? { ...item, status: 'encerrada', end: new Date() } : item
          )
        );
        setIsConfSheetOpen(false);
        showToast('Votação encerrada');
      }
    });
    setIsConfSheetOpen(true);
  };

  const handleOpenCancelConfirm = (p: PautaItem) => {
    setConfData({
      title: 'Cancelar esta pauta?',
      text: `"${p.title}" é removida e os moradores que já foram avisados recebem a informação do cancelamento.`,
      okLabel: 'Cancelar pauta',
      onConfirm: () => {
        setItems(prev => prev.filter(item => item.id !== p.id));
        setIsConfSheetOpen(false);
        showToast('Pauta cancelada');
      }
    });
    setIsConfSheetOpen(true);
  };

  // Validação do Form
  const isFormValid = useMemo(() => {
    const hasTitle = nTitle.trim().length > 0;
    const hasDesc = nDesc.trim().length > 0;
    if (!hasTitle || !hasDesc) return false;

    if (nType === 'multi') {
      const validOpts = nOptions.map(o => o.trim()).filter(Boolean);
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
      alert('Entrada inválida: caracteres não permitidos detectados.');
      return;
    }

    setSubmitting(true);
    const opts = nType === 'yn' ? [...YN] : nOptions.map(o => sanitizarEntrada(o)).filter(Boolean);
    const startDate = nStart === 'later' && nWhen ? new Date(nWhen) : new Date();
    const endDate = new Date(startDate.getTime() + nDur * DAY_MS);
    const status: 'aberta' | 'agendada' = nStart === 'later' ? 'agendada' : 'aberta';

    let backendId: string | undefined = undefined;

    // Se estiver abrindo agora, envia para a API persistir no banco de dados
    try {
      const res = await api.post('/api/v1/votacoes', {
        titulo: sanitizarEntrada(nTitle),
        descricao: sanitizarEntrada(nDesc),
        dataEncerramento: endDate.toISOString().slice(0, 19),
        opcoes: opts
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
      end: endDate
    };

    setItems(prev => [newItem, ...prev]);

    // Reset Form
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

    // Muda para a aba correspondente
    setFilter(status);
    showToast(status === 'aberta' ? `Votação aberta para ${TOTAL_UNIDADES} unidades` : `Pauta agendada para ${fmtDT(startDate)}`);
  };

  const handleAddOptionInput = () => {
    if (nOptions.length >= 5) return;
    setNOptions(prev => [...prev, '']);
  };

  const handleRemoveOptionInput = (idx: number) => {
    if (nOptions.length <= 2) return;
    setNOptions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Estilos embutidos com variáveis do Design System HabitOS */}
      <style>{`
        .page-head { padding: 10px 18px 0; }
        .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; gap: 10px; }
        .eyebrow { font-size: 11px; font-weight: 700; color: var(--ds-faint); text-transform: uppercase; letter-spacing: .06em; }
        .p-title-h1 { font-size: 21px; font-weight: 800; margin: 3px 0 0; letter-spacing: -.01em; color: var(--ds-text); }

        .btn-base { font-family: inherit; font-size: 14px; font-weight: 700; height: 46px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-text); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; transition: all 0.15s ease; }
        .btn-base:active { transform: scale(0.98); }
        .btn-base.primary { background: var(--ds-primary); border-color: var(--ds-primary); color: var(--ds-primary-ink); }
        .btn-base.primary:hover { filter: brightness(1.08); }
        .btn-base.danger { background: var(--ds-danger); border-color: var(--ds-danger); color: #fff; }
        .btn-base.danger:hover { filter: brightness(1.08); }
        .btn-base.ghost-danger { color: var(--ds-danger); border-color: var(--ds-border); background: var(--ds-card); }
        .btn-base.ghost-danger:hover { background: var(--ds-danger-dim); }
        .btn-base:disabled { opacity: .4; cursor: not-allowed; }

        .tabs-wrap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 12px; }
        .tab-btn { border: none; background: none; font-family: inherit; font-size: 12px; font-weight: 700; color: var(--ds-dim); padding: 9px 2px; border-radius: 9px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all 0.15s; }
        .tab-btn b { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: var(--ds-text); }
        .tab-btn.active { background: var(--ds-primary-dim); color: var(--ds-primary); }
        .tab-btn.active b { color: var(--ds-primary); }

        .main-list { flex: 1; padding: 14px 18px 110px; display: flex; flex-direction: column; gap: 10px; }

        .p-card { background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 14px; padding: 14px; }
        .p-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .p-title { font-size: 14.5px; font-weight: 700; color: var(--ds-text); }
        .p-desc { font-size: 12.5px; color: var(--ds-dim); line-height: 1.5; margin-top: 4px; }
        .badge { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; font-weight: 700; padding: 4px 8px; border-radius: 999px; white-space: nowrap; flex: none; }
        .b-open { background: var(--ds-primary-dim); color: var(--ds-primary); }
        .b-sched { background: var(--ds-warning-dim); color: var(--ds-warning); }
        .b-done { background: var(--ds-bg); color: var(--ds-dim); border: 1px solid var(--ds-border); }
        .p-when { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--ds-dim); margin-top: 10px; }
        .p-when.warn { color: var(--ds-warning); font-weight: 600; }

        .part { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ds-border); }
        .part-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--ds-dim); margin-bottom: 7px; }
        .part-row b { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--ds-text); }
        .qbar { position: relative; height: 8px; border-radius: 999px; background: var(--ds-border); }
        .qbar i { display: block; height: 100%; border-radius: 999px; background: var(--ds-success); }
        .qbar i.low { background: var(--ds-warning); }
        .qbar u { position: absolute; top: -3px; width: 2px; height: 14px; background: var(--ds-text); border-radius: 1px; }
        .q-note { font-size: 11.5px; margin-top: 8px; color: var(--ds-dim); }
        .q-note.ok { color: var(--ds-success); font-weight: 600; }
        .q-note.low { color: var(--ds-warning); font-weight: 600; }

        .opts { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ds-border); display: flex; flex-direction: column; gap: 10px; }
        .o-top { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px; color: var(--ds-text); }
        .o-top b { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 12px; color: var(--ds-text); }
        .track { height: 7px; border-radius: 999px; background: var(--ds-bg); border: 1px solid var(--ds-border); overflow: hidden; }
        .track i { display: block; height: 100%; background: var(--ds-border-strong); }
        .track i.lead { background: var(--ds-primary); }
        .o-chip { display: inline-block; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 8px; background: var(--ds-bg); border: 1px solid var(--ds-border); margin: 0 6px 6px 0; color: var(--ds-text); }
        .outcome { margin-top: 12px; font-size: 12.5px; color: var(--ds-dim); }
        .outcome b { color: var(--ds-text); }
        .acts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
        .acts.one { grid-template-columns: 1fr; }
        .acts .btn-base { height: 44px; font-size: 13px; padding: 0 8px; }

        .empty { text-align: center; padding: 40px 20px; background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 16px; }
        .empty .e-ico { width: 60px; height: 60px; border-radius: 16px; background: var(--ds-bg); border: 1px solid var(--ds-border); color: var(--ds-dim); display: grid; place-items: center; margin: 0 auto 14px; }
        .empty .e-t { font-size: 15px; font-weight: 800; margin-bottom: 4px; color: var(--ds-text); }
        .empty .e-s { font-size: 12.5px; color: var(--ds-dim); line-height: 1.5; }

        .sheet-overlay { position: fixed; inset: 0; background: rgba(10,10,14,.45); opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 50; }
        .sheet-overlay.show { opacity: 1; pointer-events: auto; }
        .sheet-panel { position: fixed; left: 50%; bottom: 0; transform: translate(-50%, 100%); width: 100%; max-width: 412px; background: var(--ds-card); border-radius: 20px 20px 0 0; padding: 20px 20px calc(22px + env(safe-area-inset-bottom,0px)); z-index: 51; transition: transform .25s ease; max-height: 92vh; overflow-y: auto; }
        .sheet-panel.show { transform: translate(-50%, 0); }
        .sheet-panel h2 { font-size: 17px; font-weight: 800; margin: 0 0 16px; color: var(--ds-text); }
        .sheet-lbl { font-size: 12px; font-weight: 700; color: var(--ds-dim); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px; display: block; }
        .sheet-panel input[type="text"], .sheet-panel input[type="datetime-local"], .sheet-panel textarea { width: 100%; padding: 11px 13px; border-radius: 10px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); font-family: inherit; font-size: 14px; margin-bottom: 16px; outline: none; }
        .sheet-panel input[type="text"]:focus, .sheet-panel input[type="datetime-local"]:focus, .sheet-panel textarea:focus { border-color: var(--ds-primary); }
        .sheet-panel textarea { resize: none; min-height: 80px; }
        .chips-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .chip-btn { border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); font-family: inherit; font-size: 12.5px; font-weight: 600; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
        .chip-btn.sel { border-color: var(--ds-primary); background: var(--ds-primary-dim); color: var(--ds-primary); }
        .link-add-btn { background: none; border: none; color: var(--ds-primary); font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 0; margin: -6px 0 16px; display: inline-block; }
        .tog-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid var(--ds-border); }
        .tog-row:last-of-type { border-bottom: 1px solid var(--ds-border); margin-bottom: 14px; }
        .tog-row .t1 { font-size: 13.5px; font-weight: 700; color: var(--ds-text); }
        .tog-row .t2 { font-size: 11.5px; color: var(--ds-dim); margin-top: 2px; line-height: 1.45; }
        .switch-wrap { position: relative; width: 40px; height: 23px; flex: none; margin-top: 2px; }
        .switch-wrap input { opacity: 0; width: 0; height: 0; }
        .switch-wrap .track2 { position: absolute; inset: 0; background: var(--ds-border); border-radius: 999px; transition: background .15s; }
        .switch-wrap .thumb { position: absolute; top: 2.5px; left: 2.5px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
        .switch-wrap input:checked + .track2 { background: var(--ds-primary); }
        .switch-wrap input:checked + .track2 .thumb { transform: translateX(17px); }
        .s-note-box { font-size: 12px; line-height: 1.5; color: var(--ds-dim); background: var(--ds-bg); border: 1px solid var(--ds-border); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; }
        .sheet-actions-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }

        .toast-bubble { position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--ds-text); color: var(--ds-bg); font-size: 13px; font-weight: 600; padding: 11px 18px; border-radius: 10px; opacity: 0; transition: transform .25s, opacity .25s; z-index: 60; white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
        .toast-bubble.show { transform: translateX(-50%) translateY(0); opacity: 1; }
      `}</style>

      {/* Page Header */}
      <div className="page-head">
        <div className="title-row">
          <div>
            <div className="eyebrow">Decisões</div>
            <h1 className="p-title-h1">Assembleias</h1>
          </div>
          <button
            onClick={() => setIsNewSheetOpen(true)}
            className="btn-base primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="w-[17px] h-[17px]"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova pauta
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-wrap">
          <button
            onClick={() => setFilter('aberta')}
            className={`tab-btn ${filter === 'aberta' ? 'active' : ''}`}
          >
            Em votação
            <b>{countAberta}</b>
          </button>
          <button
            onClick={() => setFilter('agendada')}
            className={`tab-btn ${filter === 'agendada' ? 'active' : ''}`}
          >
            Agendadas
            <b>{countAgendada}</b>
          </button>
          <button
            onClick={() => setFilter('encerrada')}
            className={`tab-btn ${filter === 'encerrada' ? 'active' : ''}`}
          >
            Encerradas
            <b>{countEncerrada}</b>
          </button>
        </div>
      </div>

      {/* Main List */}
      <main className="main-list">
        {shownItems.length === 0 ? (
          <div className="empty">
            <div className="e-ico">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <path d="M3 3v18h18" />
                <path d="M8 17v-5M13 17V7M18 17v-8" />
              </svg>
            </div>
            <div className="e-t">
              {items.length === 0
                ? 'Nenhuma assembleia'
                : filter === 'aberta'
                ? 'Nenhuma votação em andamento'
                : filter === 'agendada'
                ? 'Nenhuma pauta agendada'
                : 'Nenhuma pauta encerrada'}
            </div>
            <div className="e-s">
              {items.length === 0
                ? 'Crie uma nova pauta para os moradores votarem.'
                : filter === 'aberta'
                ? 'Pautas publicadas aparecem aqui enquanto os moradores votam.'
                : filter === 'agendada'
                ? 'Agende uma pauta para avisar os moradores com antecedência.'
                : 'Os resultados das votações finalizadas ficam aqui.'}
            </div>
          </div>
        ) : (
          shownItems.map(p => {
            const c = cast(p);
            const leadIdx = leader(p);
            const pct = Math.round((c / TOTAL_UNIDADES) * 100);
            const need = Math.ceil((TOTAL_UNIDADES * p.q) / 100);
            const ok = c >= need;

            return (
              <div key={p.id} className="p-card">
                {/* Cabeçalho do Card */}
                <div className="p-top">
                  <div className="p-title">{p.title}</div>
                  <span
                    className={`badge ${
                      p.status === 'aberta'
                        ? 'b-open'
                        : p.status === 'agendada'
                        ? 'b-sched'
                        : 'b-done'
                    }`}
                  >
                    {p.status === 'aberta'
                      ? 'EM VOTAÇÃO'
                      : p.status === 'agendada'
                      ? 'AGENDADA'
                      : 'ENCERRADA'}
                  </span>
                </div>

                <div className="p-desc">{p.desc}</div>

                {/* Card - Votação Aberta */}
                {p.status === 'aberta' && (
                  <>
                    {(() => {
                      const r = remaining(p);
                      return (
                        <div className={`p-when ${r.urgent ? 'warn' : ''}`}>
                          {r.text} · {fmtDT(p.end)}
                        </div>
                      );
                    })()}

                    {/* Quórum / Participação */}
                    <div className="part">
                      <div className="part-row">
                        <span>Participação</span>
                        <b>
                          {c} de {TOTAL_UNIDADES} unidades · {pct}%
                        </b>
                      </div>
                      <div className="qbar">
                        <i
                          className={ok ? '' : 'low'}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></i>
                        <u
                          style={{ left: `calc(${p.q}% - 1px)` }}
                          title={`Quórum mínimo ${p.q}%`}
                        ></u>
                      </div>
                      {ok ? (
                        <div className="q-note ok">Quórum atingido</div>
                      ) : (
                        <div className="q-note low">
                          Faltam {need - c} unidades para o quórum
                        </div>
                      )}
                    </div>

                    {/* Resultados / Opções */}
                    <div className="opts">
                      {p.opts.map((opt, i) => {
                        const votesCount = p.votes[i] || 0;
                        const optPct = c > 0 ? Math.round((votesCount / c) * 100) : 0;
                        const isLead = i === leadIdx;
                        return (
                          <div key={i}>
                            <div className="o-top">
                              <span>{opt}</span>
                              <b>
                                {votesCount} · {optPct}%
                              </b>
                            </div>
                            <div className="track">
                              <i
                                className={isLead ? 'lead' : ''}
                                style={{ width: `${optPct}%` }}
                              ></i>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ações */}
                    <div className="acts">
                      <button
                        onClick={() => handleRemind(p)}
                        className="btn-base"
                      >
                        Lembrar quem falta
                      </button>
                      <button
                        onClick={() => handleOpenCloseConfirm(p)}
                        className="btn-base ghost-danger"
                      >
                        Encerrar agora
                      </button>
                    </div>
                  </>
                )}

                {/* Card - Votação Agendada */}
                {p.status === 'agendada' && (
                  <>
                    <div className="p-when">
                      Abre em {p.start ? fmtDT(p.start) : '—'} · encerra {fmtDT(p.end)}
                    </div>
                    <div className="opts" style={{ gap: 0 }}>
                      <div className="flex flex-wrap">
                        {p.opts.map((opt, i) => (
                          <span key={i} className="o-chip">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="part-row" style={{ marginTop: '6px' }}>
                      <span>Quórum mínimo</span>
                      <b>{p.q}%</b>
                    </div>
                    <div className="acts one">
                      <button
                        onClick={() => handleOpenCancelConfirm(p)}
                        className="btn-base ghost-danger"
                      >
                        Cancelar pauta
                      </button>
                    </div>
                  </>
                )}

                {/* Card - Votação Encerrada */}
                {p.status === 'encerrada' && (
                  <>
                    <div className="p-when">Encerrada em {fmtDT(p.end)}</div>

                    {/* Quórum */}
                    <div className="part">
                      <div className="part-row">
                        <span>Participação</span>
                        <b>
                          {c} de {TOTAL_UNIDADES} unidades · {pct}%
                        </b>
                      </div>
                      <div className="qbar">
                        <i
                          className={ok ? '' : 'low'}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></i>
                        <u
                          style={{ left: `calc(${p.q}% - 1px)` }}
                          title={`Quórum mínimo ${p.q}%`}
                        ></u>
                      </div>
                      {ok ? (
                        <div className="q-note ok">Quórum atingido</div>
                      ) : (
                        <div className="q-note low">
                          Quórum não atingido ({c} de {need} unidades necessárias)
                        </div>
                      )}
                    </div>

                    {/* Resultados */}
                    <div className="opts">
                      {p.opts.map((opt, i) => {
                        const votesCount = p.votes[i] || 0;
                        const optPct = c > 0 ? Math.round((votesCount / c) * 100) : 0;
                        const isLead = i === leadIdx;
                        return (
                          <div key={i}>
                            <div className="o-top">
                              <span>{opt}</span>
                              <b>
                                {votesCount} · {optPct}%
                              </b>
                            </div>
                            <div className="track">
                              <i
                                className={isLead ? 'lead' : ''}
                                style={{ width: `${optPct}%` }}
                              ></i>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="outcome">
                      Opção mais votada: <b>{leadIdx > -1 ? p.opts[leadIdx] : '—'}</b>
                    </div>

                    <div className="acts one">
                      <button
                        onClick={() => handleDownloadPdf(p)}
                        className="btn-base"
                      >
                        Baixar resultado (PDF)
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
        className={`sheet-overlay ${isNewSheetOpen || isConfSheetOpen ? 'show' : ''}`}
        onClick={() => {
          setIsNewSheetOpen(false);
          setIsConfSheetOpen(false);
        }}
      ></div>

      {/* Bottom Sheet - Nova Pauta */}
      <div className={`sheet-panel ${isNewSheetOpen ? 'show' : ''}`}>
        <h2>Nova pauta</h2>

        <span className="sheet-lbl">Título</span>
        <input
          type="text"
          value={nTitle}
          onChange={e => setNTitle(e.target.value)}
          placeholder="Ex: Pintura da fachada"
        />

        <span className="sheet-lbl">Descrição</span>
        <textarea
          value={nDesc}
          onChange={e => setNDesc(e.target.value)}
          placeholder="Explique o que será decidido e o que muda para os moradores"
        ></textarea>

        <span className="sheet-lbl">Tipo de votação</span>
        <div className="chips-row">
          <button
            type="button"
            className={`chip-btn ${nType === 'yn' ? 'sel' : ''}`}
            onClick={() => setNType('yn')}
          >
            Sim / Não / Abstenção
          </button>
          <button
            type="button"
            className={`chip-btn ${nType === 'multi' ? 'sel' : ''}`}
            onClick={() => setNType('multi')}
          >
            Múltipla escolha
          </button>
        </div>

        {nType === 'multi' && (
          <div>
            <span className="sheet-lbl">Opções</span>
            <div>
              {nOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const next = [...nOptions];
                      next[idx] = e.target.value;
                      setNOptions(next);
                    }}
                    placeholder={`Opção ${idx + 1}`}
                    style={{ marginBottom: 0 }}
                  />
                  {nOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionInput(idx)}
                      className="text-ds-danger px-2 py-1 text-sm font-bold hover:bg-ds-danger-dim rounded-lg"
                      title="Remover opção"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {nOptions.length < 5 && (
              <button
                type="button"
                onClick={handleAddOptionInput}
                className="link-add-btn"
              >
                + Adicionar opção
              </button>
            )}
          </div>
        )}

        <span className="sheet-lbl">Início</span>
        <div className="chips-row">
          <button
            type="button"
            className={`chip-btn ${nStart === 'now' ? 'sel' : ''}`}
            onClick={() => setNStart('now')}
          >
            Agora
          </button>
          <button
            type="button"
            className={`chip-btn ${nStart === 'later' ? 'sel' : ''}`}
            onClick={() => setNStart('later')}
          >
            Agendar
          </button>
        </div>

        {nStart === 'later' && (
          <input
            type="datetime-local"
            value={nWhen}
            onChange={e => setNWhen(e.target.value)}
          />
        )}

        <span className="sheet-lbl">Duração da votação</span>
        <div className="chips-row">
          <button
            type="button"
            className={`chip-btn ${nDur === 1 ? 'sel' : ''}`}
            onClick={() => setNDur(1)}
          >
            24 horas
          </button>
          <button
            type="button"
            className={`chip-btn ${nDur === 3 ? 'sel' : ''}`}
            onClick={() => setNDur(3)}
          >
            3 dias
          </button>
          <button
            type="button"
            className={`chip-btn ${nDur === 7 ? 'sel' : ''}`}
            onClick={() => setNDur(7)}
          >
            7 dias
          </button>
        </div>

        <span className="sheet-lbl">Quórum mínimo de participação</span>
        <div className="chips-row">
          <button
            type="button"
            className={`chip-btn ${nQuorum === 30 ? 'sel' : ''}`}
            onClick={() => setNQuorum(30)}
          >
            30%
          </button>
          <button
            type="button"
            className={`chip-btn ${nQuorum === 50 ? 'sel' : ''}`}
            onClick={() => setNQuorum(50)}
          >
            50%
          </button>
          <button
            type="button"
            className={`chip-btn ${nQuorum === 66 ? 'sel' : ''}`}
            onClick={() => setNQuorum(66)}
          >
            66%
          </button>
        </div>

        {/* Toggles */}
        <label className="tog-row">
          <span>
            <div className="t1">Mostrar resultado parcial aos moradores</div>
            <div className="t2">Desligado: só você acompanha a contagem até encerrar.</div>
          </span>
          <span className="switch-wrap">
            <input
              type="checkbox"
              checked={nPartial}
              onChange={e => setNPartial(e.target.checked)}
            />
            <span className="track2">
              <span className="thumb"></span>
            </span>
          </span>
        </label>

        <label className="tog-row">
          <span>
            <div className="t1">Notificar moradores ao abrir</div>
            <div className="t2">Envia push quando a votação começar.</div>
          </span>
          <span className="switch-wrap">
            <input
              type="checkbox"
              checked={nPush}
              onChange={e => setNPush(e.target.checked)}
            />
            <span className="track2">
              <span className="thumb"></span>
            </span>
          </span>
        </label>

        <div className="s-note-box">
          Cada unidade tem 1 voto, registrado pelo morador titular. Confira na convenção do condomínio o quórum e o prazo de convocação exigidos.
        </div>

        <div className="sheet-actions-grid">
          <button
            type="button"
            onClick={() => setIsNewSheetOpen(false)}
            className="btn-base"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isFormValid || submitting}
            onClick={handlePublish}
            className="btn-base primary"
          >
            {submitting ? 'Publicando...' : 'Publicar pauta'}
          </button>
        </div>
      </div>

      {/* Confirmation Bottom Sheet */}
      <div className={`sheet-panel ${isConfSheetOpen ? 'show' : ''}`}>
        <h2>{confData?.title}</h2>
        <div className="s-note-box">{confData?.text}</div>
        <div className="sheet-actions-grid">
          <button
            type="button"
            onClick={() => setIsConfSheetOpen(false)}
            className="btn-base"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              if (confData?.onConfirm) confData.onConfirm();
            }}
            className="btn-base danger"
          >
            {confData?.okLabel}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`toast-bubble ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
}
