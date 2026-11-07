import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import { sanitizarEntrada, contemAmeacas } from '../../utils/security';

interface Convidado {
  id: string;
  nome: string;
  documento: string;
  statusEntrada: 'PENDENTE' | 'ENTROU' | string;
  horaEntrada?: string | null;
  adicionadoPortaria?: boolean;
}

interface Reserva {
  id: string;
  nomeArea: string;
  unidade: string;
  moradorSolicitante: string;
  titulo: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: 'PENDENTE_APROVACAO' | 'APROVADA' | 'REJEITADA' | string;
  motivoRejeicao?: string | null;
  convidados: Convidado[];
}

type FilterTab = 'hoje' | 'pendente' | 'aprovada' | 'recusada';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateTime(dateStr: string, timeStr: string | undefined, isEnd = false): Date {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  const parts = (timeStr || (isEnd ? '23:59' : '00:00')).split(':').map(Number);
  const hh = Number.isFinite(parts[0]) ? parts[0] : 0;
  const mm = Number.isFinite(parts[1]) ? parts[1] : 0;
  if (isEnd && hh === 0 && mm === 0) {
    return new Date(y || 1970, (m || 1) - 1, d || 1, 23, 59, 59, 0);
  }
  return new Date(y || 1970, (m || 1) - 1, d || 1, hh, mm, 0, 0);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(d: Date, now: Date): string {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return d
    .toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');
}

function formatUnidade(unidade?: string): string {
  if (!unidade) return 'Unidade —';
  const match = unidade.match(/apto\.?\s*([^\s-]+)\s*-\s*bloco\s*(.+)/i);
  if (match) {
    return `Bloco ${match[2].trim()} · Apto ${match[1].trim()}`;
  }
  return unidade;
}

function formatHoraEntrada(iso?: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return hm(d);
}

function isChurrasqueira(nomeArea?: string): boolean {
  return /churras|gourmet/i.test(nomeArea || '');
}

function AreaIcon({ nomeArea }: { nomeArea: string }) {
  if (isChurrasqueira(nomeArea)) {
    return (
      <svg
        className="w-[17px] h-[17px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3v4M8 21v-6M16 3v10M16 21v-4M4 7h16M4 17h16" />
      </svg>
    );
  }
  return (
    <svg
      className="w-[17px] h-[17px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

export function ReservasList() {
  const [filter, setFilter] = useState<FilterTab>('hoje');
  const [query, setQuery] = useState('');
  const [aprovadas, setAprovadas] = useState<Reserva[]>([]);
  const [pendentes, setPendentes] = useState<Reserva[]>([]);
  const [recusadas, setRecusadas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [guestInputs, setGuestInputs] = useState<Record<string, string>>({});
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);
  const [addingReservaId, setAddingReservaId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const toastTimerRef = useRef<number | null>(null);
  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2000);
  }, []);

  const fetchAllReservas = useCallback(async () => {
    try {
      const [resAprovadas, resPendentes, resRecusadas] = await Promise.all([
        api.get('/api/v1/reservas?status=APROVADA'),
        api.get('/api/v1/reservas?status=PENDENTE_APROVACAO'),
        api.get('/api/v1/reservas?status=REJEITADA'),
      ]);
      setAprovadas(Array.isArray(resAprovadas.data) ? resAprovadas.data : []);
      setPendentes(Array.isArray(resPendentes.data) ? resPendentes.data : []);
      setRecusadas(Array.isArray(resRecusadas.data) ? resRecusadas.data : []);
      setNow(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllReservas();
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => {
      window.clearInterval(interval);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [fetchAllReservas]);

  useWebSocket('/topic/reservas', () => {
    fetchAllReservas();
    refreshCounts();
  });

  const updateReservaInState = (updated: Reserva) => {
    setAprovadas((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleToggleGuest = async (reservaId: string, convidadoId: string) => {
    if (busyGuestId === convidadoId) return;
    try {
      setBusyGuestId(convidadoId);
      const res = await api.put(
        `/api/v1/reservas/${reservaId}/convidados/${convidadoId}/toggle-checkin`
      );
      if (res.data && res.data.id) {
        updateReservaInState(res.data);
      } else {
        await fetchAllReservas();
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar presença');
    } finally {
      setBusyGuestId(null);
    }
  };

  const handleAddGuest = async (reservaId: string) => {
    const raw = (guestInputs[reservaId] || '').trim();
    if (!raw || addingReservaId === reservaId) return;

    if (contemAmeacas(raw)) {
      showToast('Caracteres bloqueados por segurança');
      return;
    }

    const nome = sanitizarEntrada(raw, 120);
    if (!nome) return;

    try {
      setAddingReservaId(reservaId);
      const res = await api.post(`/api/v1/reservas/${reservaId}/convidados`, { nome });
      if (res.data && res.data.id) {
        updateReservaInState(res.data);
      } else {
        await fetchAllReservas();
      }
      setGuestInputs((prev) => ({ ...prev, [reservaId]: '' }));
      setOpenMap((prev) => ({ ...prev, [reservaId]: true }));
      showToast('Convidado adicionado');
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar convidado');
    } finally {
      setAddingReservaId(null);
    }
  };

  const sortByStart = (list: Reserva[]) =>
    list
      .slice()
      .sort(
        (a, b) =>
          parseDateTime(a.dataReserva, a.horaInicio).getTime() -
          parseDateTime(b.dataReserva, b.horaInicio).getTime()
      );

  const sets: Record<FilterTab, Reserva[]> = {
    hoje: sortByStart(
      aprovadas.filter((r) => sameDay(parseDateTime(r.dataReserva, r.horaInicio), now))
    ),
    pendente: sortByStart(pendentes),
    aprovada: sortByStart(aprovadas),
    recusada: sortByStart(recusadas),
  };

  const qTrim = query.trim().toLowerCase();
  const match = (r: Reserva) => {
    if (!qTrim) return true;
    const hay = `${r.nomeArea} ${formatUnidade(r.unidade)} ${r.unidade} ${r.moradorSolicitante} ${
      r.titulo || ''
    }`.toLowerCase();
    return hay.includes(qTrim);
  };

  const shown = sets[filter].filter(match);

  const getEmptyMessage = (): [string, string] => {
    if (qTrim) {
      return ['Nada encontrado', 'Confira a área, o nome ou a unidade digitados.'];
    }
    if (filter === 'hoje') {
      return ['Nenhuma reserva hoje', 'Sem eventos nas áreas comuns hoje.'];
    }
    if (filter === 'pendente') {
      return ['Nenhuma solicitação', 'Não há solicitações pendentes no momento.'];
    }
    if (filter === 'aprovada') {
      return ['Nenhuma reserva aprovada', 'As reservas aprovadas pelo síndico aparecem aqui.'];
    }
    return ['Nenhuma reserva recusada', 'Reservas recusadas ficam registradas aqui.'];
  };

  const [emptyTitle, emptySub] = getEmptyMessage();

  const renderBadge = (r: Reserva, start: Date, end: Date) => {
    if (filter === 'hoje') {
      if (now < start) {
        return (
          <span className="font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 bg-ds-primary-dim text-ds-primary">
            COMEÇA ÀS {hm(start)}
          </span>
        );
      }
      if (now <= end) {
        return (
          <span className="font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 bg-ds-success-dim text-ds-success">
            EM ANDAMENTO
          </span>
        );
      }
      return (
        <span className="font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 bg-ds-bg text-ds-dim border border-ds-border">
          ENCERROU
        </span>
      );
    }

    if (r.status === 'PENDENTE_APROVACAO') {
      return (
        <span className="font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 bg-ds-warning-dim text-ds-warning">
          AGUARDANDO SÍNDICO
        </span>
      );
    }

    if (r.status === 'REJEITADA') {
      return (
        <span className="font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 bg-ds-danger-dim text-ds-danger">
          RECUSADA
        </span>
      );
    }

    return (
      <span className="font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 bg-ds-success-dim text-ds-success">
        APROVADA
      </span>
    );
  };

  let lastDayGroup = '';

  return (
    <div className="flex flex-col">
      {/* Page Head */}
      <div>
        <div className="text-[11px] font-bold text-ds-faint uppercase tracking-[0.06em]">
          Áreas comuns
        </div>
        <h1 className="text-[21px] font-extrabold text-ds-text mt-[3px] mb-[14px] tracking-[-0.01em]">
          Reservas e convidados
        </h1>

        {/* Busca */}
        <div className="relative mb-[12px]">
          <svg
            className="absolute left-[13px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-ds-faint pointer-events-none"
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar reserva, morador ou área"
            className="w-full h-[46px] pl-[38px] pr-[13px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text text-[14px] placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
          />
        </div>

        {/* Tabs com contadores empilhados */}
        <div className="grid grid-cols-4 gap-[3px] p-[3px] bg-ds-card border border-ds-border rounded-[12px]">
          {(
            [
              { id: 'hoje', label: 'Hoje', count: sets.hoje.length },
              { id: 'pendente', label: 'Solicitações', count: sets.pendente.length },
              { id: 'aprovada', label: 'Aprovadas', count: sets.aprovada.length },
              { id: 'recusada', label: 'Recusadas', count: sets.recusada.length },
            ] as const
          ).map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`border-0 text-[11.5px] font-bold py-[9px] px-[2px] rounded-[9px] cursor-pointer flex flex-col items-center gap-[2px] transition-colors ${
                  active ? 'bg-ds-primary-dim text-ds-primary' : 'bg-transparent text-ds-dim'
                }`}
              >
                <span>{t.label}</span>
                <b
                  className={`font-mono text-[14px] font-semibold ${
                    active ? 'text-ds-primary' : 'text-ds-text'
                  }`}
                >
                  {loading ? '–' : t.count}
                </b>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="mt-[14px] flex flex-col gap-[10px]">
        {loading ? (
          <div className="text-center py-[44px] px-[20px] bg-ds-card border border-ds-border rounded-[14px]">
            <div className="text-[14px] font-bold text-ds-text mb-[4px]">Carregando...</div>
            <div className="text-[12.5px] text-ds-dim leading-[1.5]">
              Sincronizando agenda de áreas comuns.
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-[44px] px-[20px] bg-ds-card border border-ds-border rounded-[14px]">
            <div className="text-[14px] font-bold text-ds-text mb-[4px]">{emptyTitle}</div>
            <div className="text-[12.5px] text-ds-dim leading-[1.5]">{emptySub}</div>
          </div>
        ) : (
          shown.map((r, idx) => {
            const start = parseDateTime(r.dataReserva, r.horaInicio, false);
            const end = parseDateTime(r.dataReserva, r.horaFim, true);
            const isLive = filter === 'hoje' && now >= start && now <= end;
            const isOpen = openMap[r.id] !== undefined ? openMap[r.id] : isLive;
            const convidados = Array.isArray(r.convidados) ? r.convidados : [];
            const arrived = convidados.filter((g) => g.statusEntrada === 'ENTROU').length;

            const when =
              (filter === 'pendente' || filter === 'recusada'
                ? `${dayLabel(start, now)} · `
                : '') + `${hm(start)}–${hm(end)}`;

            let groupHeader: string | null = null;
            if (filter === 'aprovada') {
              const lab = dayLabel(start, now);
              if (lab !== lastDayGroup) {
                groupHeader = lab;
                lastDayGroup = lab;
              }
            }

            return (
              <div key={r.id} className="contents">
                {groupHeader && (
                  <div
                    className={`text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint ${
                      idx === 0 ? 'mt-0' : 'mt-[8px]'
                    }`}
                  >
                    {groupHeader}
                  </div>
                )}

                <div
                  className={`bg-ds-card border rounded-[14px] p-[14px] ${
                    isLive ? 'border-ds-success' : 'border-ds-border'
                  }`}
                >
                  <div className="flex justify-between items-start gap-[10px]">
                    <div className="flex items-center gap-[10px]">
                      <div className="w-[36px] h-[36px] rounded-[10px] bg-ds-bg border border-ds-border grid place-items-center text-ds-dim shrink-0">
                        <AreaIcon nomeArea={r.nomeArea} />
                      </div>
                      <div>
                        <div className="text-[14.5px] font-bold text-ds-text">{r.nomeArea}</div>
                        <div className="font-mono text-[12px] text-ds-dim mt-[2px]">{when}</div>
                      </div>
                    </div>

                    {renderBadge(r, start, end)}
                  </div>

                  <div className="text-[13px] text-ds-text mt-[12px]">
                    <span className="font-mono font-semibold">{formatUnidade(r.unidade)}</span> ·{' '}
                    {r.moradorSolicitante}
                  </div>

                  {filter === 'hoje' ? (
                    <>
                      <div className="flex justify-between items-center mt-[10px] pt-[10px] border-t border-ds-border text-[12.5px] text-ds-dim">
                        <div>
                          {convidados.length > 0 ? (
                            <>
                              <b className="font-mono text-ds-text font-semibold">
                                {arrived} de {convidados.length}
                              </b>{' '}
                              convidados chegaram
                            </>
                          ) : (
                            'Sem lista de convidados'
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMap((prev) => ({ ...prev, [r.id]: !isOpen }))
                          }
                          className="bg-transparent border-0 text-ds-primary text-[12.5px] font-bold cursor-pointer py-[6px] pl-[10px] pr-0"
                        >
                          {isOpen ? 'Ocultar' : 'Ver lista'}
                        </button>
                      </div>

                      {isOpen && (
                        <>
                          <div className="mt-[8px] flex flex-col">
                            {convidados.length === 0 && (
                              <div className="text-[12px] text-ds-warning bg-ds-warning-dim rounded-[10px] py-[10px] px-[12px] leading-[1.5] mt-[8px]">
                                O morador não enviou lista. Confirme com ele antes de liberar a
                                entrada.
                              </div>
                            )}

                            {convidados.map((g) => {
                              const entrou = g.statusEntrada === 'ENTROU';
                              const extra = Boolean(
                                g.adicionadoPortaria || g.documento === 'PORTARIA'
                              );
                              return (
                                <div
                                  key={g.id}
                                  className="flex justify-between items-center gap-[10px] py-[8px] border-t border-ds-border"
                                >
                                  <span className="text-[13.5px] font-semibold text-ds-text">
                                    {g.nome}
                                    {extra && (
                                      <span className="text-[10.5px] text-ds-dim block font-medium">
                                        Adicionado na portaria
                                      </span>
                                    )}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={busyGuestId === g.id}
                                    onClick={() => handleToggleGuest(r.id, g.id)}
                                    className={`min-w-[92px] h-[40px] rounded-[10px] text-[12.5px] font-bold cursor-pointer transition-colors disabled:opacity-60 ${
                                      entrou
                                        ? 'bg-ds-success-dim border border-ds-success-dim text-ds-success font-mono'
                                        : 'border border-ds-border bg-ds-card text-ds-text hover:border-ds-border-strong'
                                    }`}
                                  >
                                    {entrou ? `✓ ${formatHoraEntrada(g.horaEntrada)}` : 'Chegou'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex gap-[8px] mt-[10px]">
                            <input
                              type="text"
                              value={guestInputs[r.id] || ''}
                              onChange={(e) =>
                                setGuestInputs((prev) => ({ ...prev, [r.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddGuest(r.id);
                                }
                              }}
                              placeholder="Adicionar convidado"
                              maxLength={120}
                              className="flex-1 h-[42px] px-[12px] rounded-[10px] border border-ds-border bg-ds-bg text-ds-text text-[13.5px] placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
                            />
                            <button
                              type="button"
                              disabled={addingReservaId === r.id}
                              onClick={() => handleAddGuest(r.id)}
                              className="h-[42px] px-[16px] rounded-[10px] border-0 bg-ds-primary text-ds-primary-ink font-bold text-[13px] cursor-pointer hover:brightness-110 transition-all disabled:opacity-60"
                            >
                              Add
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between items-center mt-[10px] pt-[10px] border-t border-ds-border text-[12.5px] text-ds-dim">
                      <div>
                        <b className="font-mono text-ds-text font-semibold">{convidados.length}</b>{' '}
                        convidados{r.status === 'PENDENTE_APROVACAO' ? ' na lista' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-[84px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg text-[13px] font-semibold py-[11px] px-[18px] rounded-[10px] transition-all duration-250 z-[60] whitespace-nowrap pointer-events-none ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-[80px] opacity-0'
        }`}
      >
        {toastMsg}
      </div>
    </div>
  );
}
