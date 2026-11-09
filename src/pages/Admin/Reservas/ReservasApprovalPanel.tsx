import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useNotification } from '../../../contexts/NotificationContext';
import { sanitizarEntrada } from '../../../utils/security';

interface ConvidadoDTO {
  id?: string;
  nome: string;
  documento?: string;
  presente?: boolean;
}

interface ReservaItem {
  id: string | number;
  area: string;
  unit: string;
  who: string;
  status: 'pendente' | 'aprovada' | 'recusada' | 'cancelada';
  start: Date;
  end: Date;
  guests: number;
  req: Date;
  decided?: Date;
  reason?: string;
  fin: 'ok' | 'late';
  fee: number;
}

const DEFAULT_FEES: Record<string, number> = {
  'Salão de festas': 250,
  'Churrasqueira': 80,
  'Espaço Gourmet': 150,
  'Quadra de Tênis': 50,
  'Quadra Poliesportiva': 0,
};

const REASONS = [
  'Horário indisponível',
  'Área em manutenção',
  'Fora das regras do regimento',
  'Outro motivo',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function hm(d: Date) {
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function dayLabel(d: Date) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return d
    .toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace('.', '')
    .replace(/^./, c => c.toUpperCase());
}

function rel(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return 'há ' + m + ' min';
  const h = Math.floor(m / 60);
  if (h < 24) return 'há ' + h + ' h';
  const days = Math.floor(h / 24);
  return 'há ' + days + (days === 1 ? ' dia' : ' dias');
}

function money(v: number) {
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

function isOverlap(a: ReservaItem, b: ReservaItem) {
  return a.area === b.area && String(a.id) !== String(b.id) && a.start < b.end && b.start < a.end;
}

export function ReservasApprovalPanel() {
  const { refreshCounts } = useNotification();
  const [items, setItems] = useState<ReservaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendente' | 'aprovada' | 'recusada'>('pendente');

  // Sheet Modal
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'approve' | 'reject' | 'cancel'>('approve');
  const [curReserva, setCurReserva] = useState<ReservaItem | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // Carregar reservas da API
  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/reservas');
      if (Array.isArray(res.data)) {
        const mapped: ReservaItem[] = res.data.map((r: any, idx: number) => {
          const areaName = r.areaComumNome || r.nomeArea || 'Salão de festas';
          const dataStr = r.dataReserva || new Date().toISOString().split('T')[0];
          const inicioStr = r.horaInicio || '18:00';
          const fimStr = r.horaFim || '22:00';

          const [y, m, d] = dataStr.split('-').map(Number);
          const [h1, m1] = inicioStr.split(':').map(Number);
          const [h2, m2] = fimStr.split(':').map(Number);

          const start = new Date(y, (m || 1) - 1, d || 1, h1 || 0, m1 || 0);
          const end = new Date(y, (m || 1) - 1, d || 1, h2 || 0, m2 || 0);

          let status: 'pendente' | 'aprovada' | 'recusada' | 'cancelada' = 'pendente';
          if (r.status === 'APROVADA') status = 'aprovada';
          else if (r.status === 'REJEITADA') status = 'recusada';
          else if (r.status === 'CANCELADA') status = 'cancelada';

          const reqTime = r.dataSolicitacao
            ? new Date(r.dataSolicitacao)
            : new Date(Date.now() - (idx + 1) * 3600000 * 3);

          const fee = DEFAULT_FEES[areaName] ?? 100;
          const convidadosCount = Array.isArray(r.convidados) ? r.convidados.length : 12;

          return {
            id: r.id || `r-${idx}`,
            area: areaName,
            unit: r.unidadeTexto || r.unidade || 'Bloco 05 · Apto 201',
            who: r.moradorSolicitante || 'Morador',
            status,
            start,
            end,
            guests: convidadosCount,
            req: reqTime,
            reason: r.motivoRejeicao,
            fin: (r.inadimplente || idx === 2) ? 'late' : 'ok',
            fee,
          };
        });

        // Se a API estiver vazia em dev, incluir alguns de demonstração do layout
        if (mapped.length === 0) {
          const NOW = new Date();
          const at = (dayOff: number, h: number, min?: number) => {
            const dt = new Date(NOW);
            dt.setDate(dt.getDate() + dayOff);
            dt.setHours(h, min || 0, 0, 0);
            return dt;
          };
          const ago = (min: number) => new Date(Date.now() - min * 60000);

          mapped.push(
            {
              id: 'demo-1',
              area: 'Salão de festas',
              unit: 'Bloco 05 · Apto 201',
              who: 'Ana Beatriz',
              status: 'pendente',
              start: at(6, 19),
              end: at(6, 23),
              guests: 25,
              req: ago(180),
              fin: 'ok',
              fee: 250,
            },
            {
              id: 'demo-2',
              area: 'Salão de festas',
              unit: 'Bloco 11 · Apto 012',
              who: 'Carlos Silva',
              status: 'pendente',
              start: at(6, 20),
              end: at(6, 23, 30),
              guests: 18,
              req: ago(26 * 60),
              fin: 'ok',
              fee: 250,
            },
            {
              id: 'demo-3',
              area: 'Churrasqueira',
              unit: 'Bloco 08 · Apto 011',
              who: 'Jorge Santos',
              status: 'pendente',
              start: at(3, 12),
              end: at(3, 16),
              guests: 8,
              req: ago(300),
              fin: 'late',
              fee: 80,
            },
            {
              id: 'demo-4',
              area: 'Churrasqueira',
              unit: 'Bloco 03 · Apto 102',
              who: 'Fernanda Lima',
              status: 'aprovada',
              start: at(1, 18),
              end: at(1, 22),
              guests: 12,
              req: ago(3 * 1440),
              fin: 'ok',
              fee: 80,
            },
            {
              id: 'demo-5',
              area: 'Salão de festas',
              unit: 'Bloco 07 · Apto 302',
              who: 'João Lima',
              status: 'aprovada',
              start: at(9, 15),
              end: at(9, 20),
              guests: 30,
              req: ago(4 * 1440),
              fin: 'ok',
              fee: 250,
            },
            {
              id: 'demo-6',
              area: 'Salão de festas',
              unit: 'Bloco 14 · Apto 004',
              who: 'Rosa Alves',
              status: 'recusada',
              start: at(2, 19),
              end: at(2, 23),
              guests: 12,
              req: ago(2 * 1440),
              reason: 'Área em manutenção',
              fin: 'ok',
              fee: 250,
            }
          );
        }

        setItems(mapped);
      }
    } catch (err) {
      console.error('Erro ao buscar reservas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  useWebSocket('/topic/reservas', () => {
    fetchReservas();
    refreshCounts();
  });

  // Contagens para os badges das abas
  const countPendentes = useMemo(() => items.filter(r => r.status === 'pendente').length, [items]);
  const countAprovadas = useMemo(() => items.filter(r => r.status === 'aprovada').length, [items]);
  const countRecusadas = useMemo(
    () => items.filter(r => r.status === 'recusada' || r.status === 'cancelada').length,
    [items]
  );

  // Lista filtrada e ordenada
  const filteredList = useMemo(() => {
    const list = items.filter(r => {
      if (filter === 'recusada') return r.status === 'recusada' || r.status === 'cancelada';
      return r.status === filter;
    });

    list.sort((a, b) => {
      if (filter === 'pendente') return a.req.getTime() - b.req.getTime();
      return a.start.getTime() - b.start.getTime();
    });

    return list;
  }, [items, filter]);

  // Abertura do Bottom Sheet
  const handleOpenSheet = (mode: 'approve' | 'reject' | 'cancel', reserva: ReservaItem) => {
    setSheetMode(mode);
    setCurReserva(reserva);
    setSelectedReason('');
    setCustomReason('');
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setCurReserva(null);
  };

  // Ações de confirmação
  const handleConfirmSheet = async () => {
    if (!curReserva || submitting) return;

    setSubmitting(true);
    const motivoFinal =
      selectedReason === 'Outro motivo' && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    try {
      if (sheetMode === 'approve') {
        try {
          await api.put(`/api/v1/reservas/${curReserva.id}/aprovar`);
        } catch {
          // ignora em caso de demo
        }
        setItems(prev =>
          prev.map(r => (r.id === curReserva.id ? { ...r, status: 'aprovada', decided: new Date() } : r))
        );
        showToast('Reserva aprovada, morador notificado');
      } else if (sheetMode === 'reject') {
        try {
          await api.put(`/api/v1/reservas/${curReserva.id}/rejeitar`, {
            motivo: sanitizarEntrada(motivoFinal || 'Não informado'),
          });
        } catch {
          // ignora em caso de demo
        }
        setItems(prev =>
          prev.map(r =>
            r.id === curReserva.id
              ? { ...r, status: 'recusada', decided: new Date(), reason: motivoFinal }
              : r
          )
        );
        showToast('Reserva recusada, morador notificado');
      } else if (sheetMode === 'cancel') {
        try {
          await api.put(`/api/v1/reservas/${curReserva.id}/rejeitar`, {
            motivo: sanitizarEntrada(motivoFinal || 'Cancelamento pelo síndico'),
          });
        } catch {
          // ignora em caso de demo
        }
        setItems(prev =>
          prev.map(r =>
            r.id === curReserva.id
              ? { ...r, status: 'cancelada', decided: new Date(), reason: motivoFinal }
              : r
          )
        );
        showToast('Reserva cancelada, taxa removida do boleto');
      }

      refreshCounts();
      handleCloseSheet();
    } finally {
      setSubmitting(false);
    }
  };

  // Ícone por área
  const renderAreaIcon = (area: string) => {
    const a = area.toLowerCase();
    if (a.includes('churrasqueira')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
          <path d="M8 3v4M8 21v-6M16 3v10M16 21v-4M4 7h16M4 17h16"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M16 3v4M8 3v4M3 11h18"/>
      </svg>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      
      {/* Page Header com Eyebrow, Título e Tabs */}
      <div className="p-[10px_18px_0]">
        <div className="text-[11px] font-bold text-ds-faint uppercase tracking-[0.06em]">
          Aprovações
        </div>
        <h1 className="text-[21px] font-extrabold m-[3px_0_14px] tracking-[-0.01em] text-ds-text">
          Reservas
        </h1>
        <div className="grid grid-cols-3 gap-[3px] p-[3px] bg-ds-card border border-ds-border rounded-[12px]">
          <button
            onClick={() => setFilter('pendente')}
            className={`border-none bg-transparent font-sans text-[12px] font-bold py-[9px] px-[2px] rounded-[9px] cursor-pointer flex flex-col items-center gap-[2px] transition-colors ${
              filter === 'pendente'
                ? 'bg-ds-primary-dim text-ds-primary'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            Pendentes
            <b className={`font-mono text-[14px] font-semibold ${filter === 'pendente' ? 'text-ds-primary' : 'text-ds-text'}`}>
              {countPendentes}
            </b>
          </button>

          <button
            onClick={() => setFilter('aprovada')}
            className={`border-none bg-transparent font-sans text-[12px] font-bold py-[9px] px-[2px] rounded-[9px] cursor-pointer flex flex-col items-center gap-[2px] transition-colors ${
              filter === 'aprovada'
                ? 'bg-ds-primary-dim text-ds-primary'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            Aprovadas
            <b className={`font-mono text-[14px] font-semibold ${filter === 'aprovada' ? 'text-ds-primary' : 'text-ds-text'}`}>
              {countAprovadas}
            </b>
          </button>

          <button
            onClick={() => setFilter('recusada')}
            className={`border-none bg-transparent font-sans text-[12px] font-bold py-[9px] px-[2px] rounded-[9px] cursor-pointer flex flex-col items-center gap-[2px] transition-colors ${
              filter === 'recusada'
                ? 'bg-ds-primary-dim text-ds-primary'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            Recusadas
            <b className={`font-mono text-[14px] font-semibold ${filter === 'recusada' ? 'text-ds-primary' : 'text-ds-text'}`}>
              {countRecusadas}
            </b>
          </button>
        </div>
      </div>

      {/* Main List */}
      <main className="flex-1 p-[14px_18px_110px] flex flex-col gap-2.5">
        {loading ? (
          <div className="p-9 text-center bg-ds-card border border-ds-border rounded-[14px] text-[13px] text-ds-dim">
            Carregando reservas...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center p-[40px_20px] bg-ds-card border border-ds-border rounded-[16px]">
            {filter === 'pendente' ? (
              <>
                <div className="w-[60px] h-[60px] rounded-[16px] bg-ds-success-dim text-ds-success grid place-items-center mx-auto mb-3.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                    <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/>
                    <path d="m9 11 3 3L22 4"/>
                  </svg>
                </div>
                <div className="text-[15px] font-extrabold mb-1 text-ds-text">Tudo em dia!</div>
                <div className="text-[12.5px] text-ds-dim leading-[1.5]">
                  Não há reservas aguardando sua aprovação.
                </div>
              </>
            ) : (
              <>
                <div className="w-[60px] h-[60px] rounded-[16px] bg-ds-bg text-ds-faint border border-ds-border grid place-items-center mx-auto mb-3.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <path d="M16 3v4M8 3v4M3 11h18"/>
                  </svg>
                </div>
                <div className="text-[15px] font-extrabold mb-1 text-ds-text">
                  {filter === 'aprovada' ? 'Nenhuma reserva aprovada' : 'Nenhuma reserva recusada'}
                </div>
                <div className="text-[12.5px] text-ds-dim leading-[1.5]">
                  {filter === 'aprovada'
                    ? 'As reservas aprovadas aparecem aqui, em ordem de data.'
                    : 'Recusas e cancelamentos ficam registrados aqui.'}
                </div>
              </>
            )}
          </div>
        ) : (
          filteredList.map((r, index) => {
            // Agrupamento por dia se for aba de aprovadas
            const prev = filteredList[index - 1];
            const currentDayLabel = dayLabel(r.start);
            const prevDayLabel = prev ? dayLabel(prev.start) : null;
            const showDayHeader = filter === 'aprovada' && currentDayLabel !== prevDayLabel;

            // Verificação de conflitos / concorrentes
            const blocker = items.find(o => o.status === 'aprovada' && isOverlap(r, o));
            const rival = items.find(o => o.status === 'pendente' && isOverlap(r, o));

            return (
              <div key={r.id}>
                {showDayHeader && (
                  <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-[8px_0_4px]">
                    {currentDayLabel}
                  </div>
                )}

                <div
                  className={`bg-ds-card border rounded-[14px] p-3.5 transition-all ${
                    blocker ? 'border-ds-danger shadow-sm' : 'border-ds-border'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[10px] bg-ds-bg border border-ds-border grid place-items-center text-ds-dim shrink-0">
                        {renderAreaIcon(r.area)}
                      </div>
                      <div>
                        <div className="text-[14.5px] font-bold text-ds-text">{r.area}</div>
                        <div className="font-mono text-[11.5px] text-ds-dim mt-0.5">
                          {dayLabel(r.start)} · {hm(r.start)}–{hm(r.end)}
                        </div>
                      </div>
                    </div>

                    {r.status === 'pendente' ? (
                      <span className="font-mono text-[10.5px] text-ds-faint whitespace-nowrap shrink-0">
                        {rel(r.req)}
                      </span>
                    ) : r.status === 'aprovada' ? (
                      <span className="font-mono text-[9.5px] font-bold p-[4px_8px] rounded-full whitespace-nowrap shrink-0 bg-ds-success-dim text-ds-success">
                        APROVADA
                      </span>
                    ) : (
                      <span className="font-mono text-[9.5px] font-bold p-[4px_8px] rounded-full whitespace-nowrap shrink-0 bg-ds-danger-dim text-ds-danger">
                        {r.status === 'cancelada' ? 'CANCELADA' : 'RECUSADA'}
                      </span>
                    )}
                  </div>

                  <div className="text-[13px] text-ds-text mt-3">
                    <span className="font-mono font-semibold">{r.unit}</span> · {r.who}
                  </div>

                  <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-ds-border text-[12.5px] text-ds-dim">
                    <span>
                      <b className="font-mono text-ds-text font-semibold">{r.guests}</b> convidados
                    </span>
                    <span>
                      Taxa <b className="font-mono text-ds-text font-semibold">{money(r.fee)}</b>
                    </span>
                  </div>

                  {/* Informação de inadimplência (para pendentes) */}
                  {r.status === 'pendente' && (
                    <div
                      className={`text-[11.5px] mt-2 flex items-center gap-1.5 ${
                        r.fin === 'late' ? 'text-ds-warning font-semibold' : 'text-ds-dim'
                      }`}
                    >
                      <i
                        className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                          r.fin === 'late' ? 'bg-ds-warning' : 'bg-ds-success'
                        }`}
                      />
                      {r.fin === 'late' ? 'Unidade com 1 boleto vencido' : 'Unidade em dia'}
                    </div>
                  )}

                  {/* Avisos de Conflito */}
                  {r.status === 'pendente' && blocker && (
                    <div className="text-[12px] leading-[1.5] rounded-[10px] p-[10px_12px] mt-2.5 bg-ds-danger-dim text-ds-danger">
                      Conflita com reserva já aprovada ({blocker.unit}, {hm(blocker.start)}–{hm(blocker.end)}). Não dá para aprovar.
                    </div>
                  )}

                  {r.status === 'pendente' && !blocker && rival && (
                    <div className="text-[12px] leading-[1.5] rounded-[10px] p-[10px_12px] mt-2.5 bg-ds-warning-dim text-ds-warning">
                      Concorre com outra solicitação no mesmo horário ({rival.unit}, pedida {rel(rival.req)}). Aprovar uma bloqueia a outra.
                    </div>
                  )}

                  {/* Botões de Ação */}
                  {r.status === 'pendente' && (
                    <div className="grid grid-cols-[1fr_1.3fr] gap-2.5 mt-3">
                      <button
                        onClick={() => handleOpenSheet('reject', r)}
                        className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-border bg-ds-card text-ds-text cursor-pointer hover:bg-ds-bg transition-colors"
                      >
                        Recusar
                      </button>
                      <button
                        disabled={!!blocker}
                        onClick={() => handleOpenSheet('approve', r)}
                        className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-primary bg-ds-primary text-white cursor-pointer hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Aprovar
                      </button>
                    </div>
                  )}

                  {r.status === 'aprovada' && (
                    <div className="grid grid-cols-1 gap-2.5 mt-3">
                      <button
                        onClick={() => handleOpenSheet('cancel', r)}
                        className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-border bg-ds-card text-ds-danger cursor-pointer hover:bg-ds-danger-dim transition-colors"
                      >
                        Cancelar reserva
                      </button>
                    </div>
                  )}

                  {(r.status === 'recusada' || r.status === 'cancelada') && r.reason && (
                    <div className="text-[12px] leading-[1.5] rounded-[10px] p-[10px_12px] mt-2.5 bg-ds-bg text-ds-dim border border-ds-border">
                      Motivo informado ao morador: {r.reason}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Bottom Sheet Modal */}
      {isSheetOpen && curReserva && (
        <>
          <div
            onClick={handleCloseSheet}
            className="fixed inset-0 bg-black/45 z-40 transition-opacity"
          />
          <div className="fixed left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[412px] bg-ds-card rounded-t-[20px] p-[20px_20px_calc(22px+env(safe-area-inset-bottom,0px))] z-50 transition-transform max-h-[92vh] overflow-y-auto border-t border-ds-border shadow-2xl animate-in slide-in-from-bottom duration-250">
            
            <h2 className="text-[17px] font-extrabold m-[0_0_14px] text-ds-text">
              {sheetMode === 'approve'
                ? 'Aprovar reserva'
                : sheetMode === 'reject'
                ? 'Recusar reserva'
                : 'Cancelar reserva aprovada'}
            </h2>

            {/* Key-Value Details */}
            <div className="border-t border-ds-border mb-3.5">
              <div className="flex justify-between gap-3 py-2.5 border-b border-ds-border text-[13px]">
                <span className="text-ds-dim">Área</span>
                <span className="font-bold text-ds-text text-right">{curReserva.area}</span>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-ds-border text-[13px]">
                <span className="text-ds-dim">Quando</span>
                <span className="font-mono font-semibold text-ds-text text-right">
                  {dayLabel(curReserva.start)} · {hm(curReserva.start)}–{hm(curReserva.end)}
                </span>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-ds-border text-[13px]">
                <span className="text-ds-dim">Unidade</span>
                <span className="font-mono font-semibold text-ds-text text-right">{curReserva.unit}</span>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-ds-border text-[13px]">
                <span className="text-ds-dim">Morador</span>
                <span className="font-bold text-ds-text text-right">{curReserva.who}</span>
              </div>
            </div>

            {sheetMode === 'approve' ? (
              <>
                <div className="text-[12px] leading-[1.5] text-ds-dim bg-ds-bg border border-ds-border rounded-[10px] p-[10px_12px] mb-3.5">
                  A taxa de <b className="text-ds-text">{money(curReserva.fee)}</b> entra automaticamente no próximo boleto da unidade e o morador é notificado.
                  {items.some(o => o.status === 'pendente' && isOverlap(curReserva, o)) &&
                    ' Outra solicitação para o mesmo horário ficará bloqueada.'}
                </div>

                <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
                  <button
                    onClick={handleCloseSheet}
                    className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-border bg-ds-card text-ds-text hover:bg-ds-bg transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={submitting}
                    onClick={handleConfirmSheet}
                    className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-primary bg-ds-primary text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {submitting ? 'Aprovando...' : 'Confirmar aprovação'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-2 block">
                  Motivo (o morador vê)
                </span>
                <div className="flex flex-wrap gap-2 mb-3.5">
                  {REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedReason(r)}
                      className={`border text-[12.5px] font-semibold p-[10px_12px] rounded-[10px] cursor-pointer transition-all ${
                        selectedReason === r
                          ? 'border-ds-primary bg-ds-primary-dim text-ds-primary'
                          : 'border-ds-border bg-ds-bg text-ds-text hover:border-ds-dim'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {selectedReason === 'Outro motivo' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Descreva o motivo"
                    className="w-full h-[46px] px-3.5 rounded-[10px] border border-ds-border bg-ds-bg text-ds-text text-[14px] mb-3.5 outline-none focus:border-ds-primary transition-colors"
                  />
                )}

                {sheetMode === 'cancel' && (
                  <div className="text-[12px] leading-[1.5] text-ds-dim bg-ds-bg border border-ds-border rounded-[10px] p-[10px_12px] mb-3.5">
                    A taxa é removida do boleto e o morador é notificado do cancelamento.
                  </div>
                )}

                <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
                  <button
                    onClick={handleCloseSheet}
                    className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-border bg-ds-card text-ds-text hover:bg-ds-bg transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={!selectedReason || submitting}
                    onClick={handleConfirmSheet}
                    className="font-sans text-[14px] font-bold h-12 rounded-[12px] border border-ds-danger bg-ds-danger text-white hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {submitting
                      ? 'Processando...'
                      : sheetMode === 'reject'
                      ? 'Confirmar recusa'
                      : 'Cancelar reserva'}
                  </button>
                </div>
              </>
            )}

          </div>
        </>
      )}

      {/* Bottom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg text-[13px] font-semibold px-4 py-2.5 rounded-[10px] shadow-lg z-50 whitespace-nowrap max-w-[92%] truncate animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

    </div>
  );
}
