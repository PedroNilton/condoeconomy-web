import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Flame } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import { sanitizarEntrada, contemAmeacas } from '../../utils/security';
import {
  Badge,
  Button,
  EmptyState,
  IconChip,
  InfoBanner,
  ListCard,
  SearchInput,
  SegmentedTabs,
  Toast,
} from '../../components/ui';

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2000);
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
        `/api/v1/reservas/${reservaId}/convidados/${convidadoId}/toggle-checkin`,
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
          parseDateTime(b.dataReserva, b.horaInicio).getTime(),
      );

  const sets: Record<FilterTab, Reserva[]> = {
    hoje: sortByStart(
      aprovadas.filter((r) => sameDay(parseDateTime(r.dataReserva, r.horaInicio), now)),
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
      if (now < start) return <Badge tone="brand">COMEÇA ÀS {hm(start)}</Badge>;
      if (now <= end) return <Badge tone="ok">EM ANDAMENTO</Badge>;
      return <Badge tone="neutral">ENCERROU</Badge>;
    }
    if (r.status === 'PENDENTE_APROVACAO') return <Badge tone="warn">AGUARDANDO SÍNDICO</Badge>;
    if (r.status === 'REJEITADA') return <Badge tone="bad">RECUSADA</Badge>;
    return <Badge tone="ok">APROVADA</Badge>;
  };

  let lastDayGroup = '';

  return (
    <div className="flex flex-col">
      <div>
        <div className="text-[11px] font-bold text-faint uppercase tracking-[0.06em]">
          Áreas comuns
        </div>
        <h1 className="text-[21px] font-extrabold text-ink mt-[3px] mb-3.5 tracking-[-0.01em]">
          Reservas e convidados
        </h1>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar reserva, morador ou área"
          height="tall"
          className="mb-3"
        />

        <SegmentedTabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'hoje', label: 'Hoje', count: loading ? undefined : sets.hoje.length },
            {
              id: 'pendente',
              label: 'Solicitações',
              count: loading ? undefined : sets.pendente.length,
            },
            {
              id: 'aprovada',
              label: 'Aprovadas',
              count: loading ? undefined : sets.aprovada.length,
            },
            {
              id: 'recusada',
              label: 'Recusadas',
              count: loading ? undefined : sets.recusada.length,
            },
          ]}
        />
      </div>

      {/* Lista de Reservas */}
      <div className="mt-3.5 flex flex-col gap-2.5">
        {loading ? (
          <ListCard className="py-10 text-center">
            <div className="text-[14px] font-bold text-ink mb-1">Carregando...</div>
            <div className="text-[12.5px] text-dim">
              Sincronizando agenda de áreas comuns.
            </div>
          </ListCard>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-6 h-6" />}
            title={emptyTitle}
            description={emptySub}
          />
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
                    className={`text-[11px] font-bold uppercase tracking-[0.06em] text-faint ${
                      idx === 0 ? 'mt-0' : 'mt-2'
                    }`}
                  >
                    {groupHeader}
                  </div>
                )}

                <ListCard tone={isLive ? 'ok' : 'default'}>
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconChip tone="neutral">
                        {isChurrasqueira(r.nomeArea) ? (
                          <Flame className="w-[17px] h-[17px]" />
                        ) : (
                          <CalendarDays className="w-[17px] h-[17px]" />
                        )}
                      </IconChip>
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-extrabold text-ink truncate">
                          {r.nomeArea}
                        </div>
                        <div className="font-mono text-[12px] text-dim mt-0.5">{when}</div>
                      </div>
                    </div>

                    {renderBadge(r, start, end)}
                  </div>

                  <div className="text-[13px] text-ink mt-3">
                    <span className="font-mono font-semibold">{formatUnidade(r.unidade)}</span> ·{' '}
                    {r.moradorSolicitante}
                  </div>

                  {filter === 'hoje' ? (
                    <>
                      <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-line text-[12.5px] text-dim">
                        <div>
                          {convidados.length > 0 ? (
                            <>
                              <b className="font-mono text-ink font-semibold">
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
                          className="bg-transparent border-0 text-brand text-[12.5px] font-bold cursor-pointer py-1.5 pl-2.5 pr-0 hover:underline"
                        >
                          {isOpen ? 'Ocultar' : 'Ver lista'}
                        </button>
                      </div>

                      {isOpen && (
                        <>
                          <div className="mt-2 flex flex-col">
                            {convidados.length === 0 && (
                              <InfoBanner tone="warn" className="mt-2">
                                O morador não enviou lista. Confirme com ele antes de liberar a
                                entrada.
                              </InfoBanner>
                            )}

                            {convidados.map((g) => {
                              const entrou = g.statusEntrada === 'ENTROU';
                              const extra = Boolean(
                                g.adicionadoPortaria || g.documento === 'PORTARIA',
                              );
                              return (
                                <div
                                  key={g.id}
                                  className="flex justify-between items-center gap-2.5 py-2 border-t border-line"
                                >
                                  <span className="text-[13.5px] font-semibold text-ink">
                                    {g.nome}
                                    {extra && (
                                      <span className="text-[10.5px] text-dim block font-medium">
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
                                        ? 'bg-ok-soft border border-ok-soft text-ok font-mono'
                                        : 'border border-line bg-surface text-ink hover:border-line-strong'
                                    }`}
                                  >
                                    {entrou ? `✓ ${formatHoraEntrada(g.horaEntrada)}` : 'Chegou'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex gap-2 mt-2.5">
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
                              className="flex-1 h-[42px] px-3 rounded-[10px] border border-line bg-canvas text-ink text-[13.5px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand"
                            />
                            <Button
                              variant="primary"
                              size="card"
                              disabled={addingReservaId === r.id}
                              onClick={() => handleAddGuest(r.id)}
                              className="!h-[42px]"
                            >
                              Add
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-line text-[12.5px] text-dim">
                      <div>
                        <b className="font-mono text-ink font-semibold">{convidados.length}</b>{' '}
                        convidados{r.status === 'PENDENTE_APROVACAO' ? ' na lista' : ''}
                      </div>
                    </div>
                  )}
                </ListCard>
              </div>
            );
          })
        )}
      </div>

      <Toast message={toastMsg} />
    </div>
  );
}
