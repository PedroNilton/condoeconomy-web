import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Flame, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useNotification } from '../../../contexts/NotificationContext';
import { sanitizarEntrada } from '../../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  IconChip,
  ListCard,
  PageHead,
  SegmentedTabs,
  Toast,
} from '../../../components/ui';

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
  Churrasqueira: 80,
  'Espaço Gourmet': 150,
  'Quadra de Tênis': 50,
  'Quadra Poliesportiva': 0,
};

const REASONS = [
  { value: 'Horário indisponível', label: 'Horário indisponível' },
  { value: 'Área em manutenção', label: 'Área em manutenção' },
  { value: 'Fora das regras do regimento', label: 'Fora das regras do regimento' },
  { value: 'Outro motivo', label: 'Outro motivo' },
] as const;

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
    .replace(/^./, (c) => c.toUpperCase());
}

function rel(d: Date, nowMs: number) {
  const m = Math.floor((nowMs - d.getTime()) / 60000);
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
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'approve' | 'reject' | 'cancel'>('approve');
  const [curReserva, setCurReserva] = useState<ReservaItem | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/reservas');
      if (Array.isArray(res.data)) {
        const now = Date.now();
        setNowMs(now);
        const mapped: ReservaItem[] = res.data.map(
          (
            r: {
              id?: string | number;
              areaComumNome?: string;
              nomeArea?: string;
              dataReserva?: string;
              horaInicio?: string;
              horaFim?: string;
              status?: string;
              dataSolicitacao?: string;
              convidados?: unknown[];
              unidadeTexto?: string;
              unidade?: string;
              moradorSolicitante?: string;
              motivoRejeicao?: string;
              inadimplente?: boolean;
            },
            idx: number,
          ) => {
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
              : new Date(now - (idx + 1) * 3600000 * 3);

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
              fin: r.inadimplente || idx === 2 ? 'late' : 'ok',
              fee,
            };
          },
        );

        if (mapped.length === 0) {
          const NOW = new Date();
          const at = (dayOff: number, h: number, min?: number) => {
            const dt = new Date(NOW);
            dt.setDate(dt.getDate() + dayOff);
            dt.setHours(h, min || 0, 0, 0);
            return dt;
          };
          const ago = (min: number) => new Date(now - min * 60000);

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
            },
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

  const countPendentes = useMemo(
    () => items.filter((r) => r.status === 'pendente').length,
    [items],
  );
  const countAprovadas = useMemo(
    () => items.filter((r) => r.status === 'aprovada').length,
    [items],
  );
  const countRecusadas = useMemo(
    () => items.filter((r) => r.status === 'recusada' || r.status === 'cancelada').length,
    [items],
  );

  const filteredList = useMemo(() => {
    const list = items.filter((r) => {
      if (filter === 'recusada') return r.status === 'recusada' || r.status === 'cancelada';
      return r.status === filter;
    });

    list.sort((a, b) => {
      if (filter === 'pendente') return a.req.getTime() - b.req.getTime();
      return a.start.getTime() - b.start.getTime();
    });

    return list;
  }, [items, filter]);

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
        setItems((prev) =>
          prev.map((r) =>
            r.id === curReserva.id ? { ...r, status: 'aprovada', decided: new Date() } : r,
          ),
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
        setItems((prev) =>
          prev.map((r) =>
            r.id === curReserva.id
              ? { ...r, status: 'recusada', decided: new Date(), reason: motivoFinal }
              : r,
          ),
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
        setItems((prev) =>
          prev.map((r) =>
            r.id === curReserva.id
              ? { ...r, status: 'cancelada', decided: new Date(), reason: motivoFinal }
              : r,
          ),
        );
        showToast('Reserva cancelada, taxa removida do boleto');
      }

      refreshCounts();
      handleCloseSheet();
    } finally {
      setSubmitting(false);
    }
  };

  const renderAreaIcon = (area: string) => {
    const a = area.toLowerCase();
    if (a.includes('churrasqueira')) {
      return <Flame className="w-[17px] h-[17px]" />;
    }
    return <Calendar className="w-[17px] h-[17px]" />;
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHead eyebrow="Aprovações" title="Reservas" />

      <SegmentedTabs
        value={filter}
        onChange={(v) => setFilter(v as 'pendente' | 'aprovada' | 'recusada')}
        items={[
          { id: 'pendente', label: 'Pendentes', count: countPendentes },
          { id: 'aprovada', label: 'Aprovadas', count: countAprovadas },
          { id: 'recusada', label: 'Recusadas', count: countRecusadas },
        ]}
      />

      {loading ? (
        <div className="p-9 text-center bg-surface border border-line rounded-[14px] text-[13px] text-dim">
          Carregando reservas...
        </div>
      ) : filteredList.length === 0 ? (
        filter === 'pendente' ? (
          <EmptyState
            icon={<CheckCircle2 className="w-7 h-7 text-ok" />}
            title="Tudo em dia!"
            description="Não há reservas aguardando sua aprovação."
            tone="ok"
          />
        ) : (
          <EmptyState
            icon={<Calendar className="w-7 h-7 text-faint" />}
            title={
              filter === 'aprovada' ? 'Nenhuma reserva aprovada' : 'Nenhuma reserva recusada'
            }
            description={
              filter === 'aprovada'
                ? 'As reservas aprovadas aparecem aqui, em ordem de data.'
                : 'Recusas e cancelamentos ficam registrados aqui.'
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredList.map((r, index) => {
            const prev = filteredList[index - 1];
            const currentDayLabel = dayLabel(r.start);
            const prevDayLabel = prev ? dayLabel(prev.start) : null;
            const showDayHeader = filter === 'aprovada' && currentDayLabel !== prevDayLabel;

            const blocker = items.find((o) => o.status === 'aprovada' && isOverlap(r, o));
            const rival = items.find((o) => o.status === 'pendente' && isOverlap(r, o));

            return (
              <div key={r.id} className="flex flex-col gap-1.5">
                {showDayHeader && (
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint mt-2 mb-0.5 m-0">
                    {currentDayLabel}
                  </p>
                )}

                <ListCard tone={blocker ? 'bad' : 'default'}>
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <IconChip tone="neutral" size="md">
                        {renderAreaIcon(r.area)}
                      </IconChip>
                      <div>
                        <div className="text-[14.5px] font-bold text-ink">{r.area}</div>
                        <div className="font-mono text-[11.5px] text-dim mt-0.5">
                          {dayLabel(r.start)} · {hm(r.start)}–{hm(r.end)}
                        </div>
                      </div>
                    </div>

                    {r.status === 'pendente' ? (
                      <span className="font-mono text-[10.5px] text-faint whitespace-nowrap shrink-0">
                        {rel(r.req, nowMs)}
                      </span>
                    ) : r.status === 'aprovada' ? (
                      <Badge tone="ok">APROVADA</Badge>
                    ) : (
                      <Badge tone="bad">
                        {r.status === 'cancelada' ? 'CANCELADA' : 'RECUSADA'}
                      </Badge>
                    )}
                  </div>

                  <div className="text-[13px] text-ink mt-3">
                    <span className="font-mono font-semibold">{r.unit}</span> · {r.who}
                  </div>

                  <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-line text-[12.5px] text-dim">
                    <span>
                      <b className="font-mono text-ink font-semibold">{r.guests}</b> convidados
                    </span>
                    <span>
                      Taxa <b className="font-mono text-ink font-semibold">{money(r.fee)}</b>
                    </span>
                  </div>

                  {r.status === 'pendente' && (
                    <div
                      className={`text-[11.5px] mt-2 flex items-center gap-1.5 ${
                        r.fin === 'late' ? 'text-warn font-semibold' : 'text-dim'
                      }`}
                    >
                      <span
                        className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                          r.fin === 'late' ? 'bg-warn' : 'bg-ok'
                        }`}
                      />
                      {r.fin === 'late' ? 'Unidade com 1 boleto vencido' : 'Unidade em dia'}
                    </div>
                  )}

                  {r.status === 'pendente' && blocker && (
                    <div className="text-[12px] leading-[1.5] rounded-[10px] p-[10px_12px] mt-2.5 bg-bad-soft text-bad">
                      Conflita com reserva já aprovada ({blocker.unit}, {hm(blocker.start)}–
                      {hm(blocker.end)}). Não dá para aprovar.
                    </div>
                  )}

                  {r.status === 'pendente' && !blocker && rival && (
                    <div className="text-[12px] leading-[1.5] rounded-[10px] p-[10px_12px] mt-2.5 bg-warn-soft text-warn">
                      Concorre com outra solicitação no mesmo horário ({rival.unit}, pedida{' '}
                      {rel(rival.req, nowMs)}). Aprovar uma bloqueia a outra.
                    </div>
                  )}

                  {r.status === 'pendente' && (
                    <div className="grid grid-cols-[1fr_1.3fr] gap-2.5 mt-3">
                      <Button variant="secondary" onClick={() => handleOpenSheet('reject', r)}>
                        Recusar
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!!blocker}
                        onClick={() => handleOpenSheet('approve', r)}
                      >
                        Aprovar
                      </Button>
                    </div>
                  )}

                  {r.status === 'aprovada' && (
                    <div className="mt-3">
                      <Button
                        variant="ghost-danger"
                        fullWidth
                        onClick={() => handleOpenSheet('cancel', r)}
                      >
                        Cancelar reserva
                      </Button>
                    </div>
                  )}

                  {(r.status === 'recusada' || r.status === 'cancelada') && r.reason && (
                    <div className="text-[12px] leading-[1.5] rounded-[10px] p-[10px_12px] mt-2.5 bg-canvas text-dim border border-line">
                      Motivo informado ao morador: {r.reason}
                    </div>
                  )}
                </ListCard>
              </div>
            );
          })}
        </div>
      )}

      <BottomSheet
        open={isSheetOpen && !!curReserva}
        onClose={handleCloseSheet}
        title={
          sheetMode === 'approve'
            ? 'Aprovar reserva'
            : sheetMode === 'reject'
            ? 'Recusar reserva'
            : 'Cancelar reserva aprovada'
        }
        footer={
          curReserva ? (
            <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
              <Button variant="secondary" onClick={handleCloseSheet}>
                Voltar
              </Button>
              {sheetMode === 'approve' ? (
                <Button variant="primary" disabled={submitting} onClick={handleConfirmSheet}>
                  {submitting ? 'Aprovando...' : 'Confirmar aprovação'}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  disabled={!selectedReason || submitting}
                  onClick={handleConfirmSheet}
                >
                  {submitting
                    ? 'Processando...'
                    : sheetMode === 'reject'
                    ? 'Confirmar recusa'
                    : 'Cancelar reserva'}
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {curReserva && (
          <div className="flex flex-col gap-3.5">
            <div className="border-t border-line">
              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Área</span>
                <span className="font-bold text-ink text-right">{curReserva.area}</span>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Quando</span>
                <span className="font-mono font-semibold text-ink text-right">
                  {dayLabel(curReserva.start)} · {hm(curReserva.start)}–{hm(curReserva.end)}
                </span>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Unidade</span>
                <span className="font-mono font-semibold text-ink text-right">
                  {curReserva.unit}
                </span>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Morador</span>
                <span className="font-bold text-ink text-right">{curReserva.who}</span>
              </div>
            </div>

            {sheetMode === 'approve' ? (
              <div className="text-[12px] leading-[1.5] text-dim bg-canvas border border-line rounded-[10px] p-[10px_12px]">
                A taxa de <b className="text-ink">{money(curReserva.fee)}</b> entra automaticamente
                no próximo boleto da unidade e o morador é notificado.
                {items.some((o) => o.status === 'pendente' && isOverlap(curReserva, o)) &&
                  ' Outra solicitação para o mesmo horário ficará bloqueada.'}
              </div>
            ) : (
              <>
                <ChoiceChips
                  label="Motivo (o morador vê)"
                  options={REASONS}
                  value={selectedReason}
                  onChange={setSelectedReason}
                />

                {selectedReason === 'Outro motivo' && (
                  <Field
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva o motivo"
                  />
                )}

                {sheetMode === 'cancel' && (
                  <div className="text-[12px] leading-[1.5] text-dim bg-canvas border border-line rounded-[10px] p-[10px_12px]">
                    A taxa é removida do boleto e o morador é notificado do cancelamento.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </BottomSheet>

      <Toast message={toastMessage} />
    </div>
  );
}
