import { useState, useEffect, useCallback } from 'react';
import { QrCode, UserPlus, Users } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import {
  RegistrarVisitanteSheet,
  WAIT_STORAGE_KEY,
} from './components/RegistrarVisitanteForm';
import { QrAcessoModal } from './components/QrAcessoModal';
import {
  Badge,
  Button,
  EmptyState,
  ListCard,
  SearchInput,
  SegmentedTabs,
  Toast,
} from '../../components/ui';

interface VisitanteApi {
  id: string;
  nome: string;
  sobrenome: string;
  documento: string;
  dataVisita: string;
  blocoDestino: string;
  unidadeDestino: string;
  moradorResponsavel: string;
  placaVeiculo: string | null;
  tipo: string;
  status: 'AGUARDANDO_LIBERACAO' | 'AGUARDANDO' | 'NO_CONDOMINIO' | 'FINALIZADO';
  horaEntrada?: string | null;
  horaSaida?: string | null;
}

type UiStatus = 'espera' | 'local' | 'saiu';
type FilterTab = 'todos' | UiStatus;

const STATUS_LABELS: Record<UiStatus, string> = {
  espera: 'EM ESPERA',
  local: 'NO LOCAL',
  saiu: 'SAIU',
};

const STATUS_ORDER: Record<UiStatus, number> = {
  espera: 0,
  local: 1,
  saiu: 2,
};

function mapUiStatus(apiStatus: string): UiStatus {
  if (apiStatus === 'NO_CONDOMINIO') return 'local';
  if (apiStatus === 'FINALIZADO') return 'saiu';
  return 'espera';
}

export function formatTipoVisitante(tipo?: string): string {
  const upper = (tipo || 'VISITANTE').toUpperCase();
  if (upper === 'VISITANTE') return 'Visitante';
  if (upper === 'PRESTADOR' || upper === 'PRESTADOR_SERVICO') return 'Prestador';
  if (upper === 'ENTREGADOR') return 'Entregador';
  if (upper === 'MOTORISTA_APP' || upper === 'MOTORISTA DE APP') return 'Motorista de app';
  return tipo || 'Visitante';
}

function formatNomeVisitante(nome?: string, sobrenome?: string): string {
  const n = (nome || '').trim();
  const s = (sobrenome || '').trim();
  if (!s || s.toLowerCase() === 'convidado' || s === '.') {
    return n.replace(/\.$/, '');
  }
  return `${n.replace(/\.$/, '')} ${s.replace(/\.$/, '')}`.trim();
}

function formatDestino(bloco?: string, apto?: string): string {
  const b = (bloco || '—').replace(/^bloco\s*/i, '').trim() || '—';
  const a = (apto || '—').replace(/^apto\.?\s*/i, '').trim() || '—';
  return `Bloco ${b} · Apto ${a}`;
}

function formatHora(iso?: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatPermanencia(horaEntrada?: string | null, nowMs: number = Date.now()): string {
  if (!horaEntrada) return 'agora';
  const start = new Date(horaEntrada).getTime();
  if (Number.isNaN(start)) return 'agora';
  const diffMin = Math.max(0, Math.floor((nowMs - start) / 60000));
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}` : `${h}h`;
}

function obterMapaEspera(visitantes: VisitanteApi[]): Record<string, number> {
  try {
    const raw = localStorage.getItem(WAIT_STORAGE_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    let changed = false;
    const agora = Date.now();
    for (const v of visitantes) {
      if (mapUiStatus(v.status) === 'espera' && !map[v.id]) {
        map[v.id] = agora;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(WAIT_STORAGE_KEY, JSON.stringify(map));
    }
    return map;
  } catch {
    return {};
  }
}

export function VisitantesList() {
  const [visitantes, setVisitantes] = useState<VisitanteApi[]>([]);
  const [waitMap, setWaitMap] = useState<Record<string, number>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('todos');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const fetchVisitantes = useCallback(async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/v1/visitantes?dataVisita=${hoje}`);
      const lista: VisitanteApi[] = Array.isArray(res.data) ? res.data : [];
      setVisitantes(lista);
      setWaitMap(obterMapaEspera(lista));
      setNowMs(Date.now());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitantes();
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => {
      window.clearInterval(interval);
    };
  }, [fetchVisitantes]);

  useWebSocket('/topic/visitantes', fetchVisitantes);

  const handleLiberarEntrada = async (id: string) => {
    try {
      await api.put(`/api/v1/visitantes/${id}/checkin`);
      await fetchVisitantes();
      refreshCounts();
      showToast('Entrada liberada');
    } catch (err) {
      console.error(err);
      showToast('Erro ao liberar entrada');
    }
  };

  const handleRegistrarSaida = async (id: string) => {
    try {
      await api.put(`/api/v1/visitantes/${id}/checkout`);
      await fetchVisitantes();
      refreshCounts();
      showToast('Saída registrada');
    } catch (err) {
      console.error(err);
      showToast('Erro ao registrar saída');
    }
  };

  const countTodos = visitantes.length;
  const countEspera = visitantes.filter((v) => mapUiStatus(v.status) === 'espera').length;
  const countLocal = visitantes.filter((v) => mapUiStatus(v.status) === 'local').length;
  const countSaiu = visitantes.filter((v) => mapUiStatus(v.status) === 'saiu').length;

  const qTrim = query.trim().toLowerCase();

  const shown = visitantes
    .filter((v) => {
      const st = mapUiStatus(v.status);
      const okFilter = filter === 'todos' || st === filter;
      if (!okFilter) return false;
      if (!qTrim) return true;
      const nomeStr = formatNomeVisitante(v.nome, v.sobrenome);
      const destStr = formatDestino(v.blocoDestino, v.unidadeDestino);
      const hay = `${nomeStr} ${destStr} ${v.placaVeiculo || ''}`.toLowerCase();
      return hay.includes(qTrim);
    })
    .sort((a, b) => STATUS_ORDER[mapUiStatus(a.status)] - STATUS_ORDER[mapUiStatus(b.status)]);

  const getEmptyMessage = (): [string, string] => {
    if (qTrim) {
      return ['Nada encontrado', 'Confira o nome, o apartamento ou a placa digitados.'];
    }
    if (filter === 'espera') {
      return ['Ninguém na espera', 'Quando alguém chegar, ele aparece aqui até ser liberado.'];
    }
    if (filter === 'local') {
      return ['Ninguém no local agora', 'Visitantes liberados ficam aqui até registrar a saída.'];
    }
    if (filter === 'saiu') {
      return ['Nenhuma saída hoje', 'As saídas registradas aparecem aqui.'];
    }
    return ['Nenhum visitante hoje', 'Registre entradas na hora ou leia o QR de convite.'];
  };

  const [emptyTitle, emptySub] = getEmptyMessage();

  return (
    <div className="flex flex-col">
      <div>
        <div className="text-[11px] font-bold text-faint uppercase tracking-[0.06em]">
          Controle de acesso
        </div>
        <h1 className="text-[21px] font-extrabold text-ink mt-[3px] mb-3.5 tracking-[-0.01em]">
          Visitantes hoje
        </h1>

        <div className="grid grid-cols-[1fr_1.3fr] gap-2.5 mb-3.5">
          <Button variant="secondary" size="portaria" onClick={() => setIsQrOpen(true)}>
            <QrCode className="w-[18px] h-[18px]" />
            <span>Ler QR</span>
          </Button>

          <Button variant="primary" size="portaria" onClick={() => setIsSheetOpen(true)}>
            <UserPlus className="w-[18px] h-[18px]" />
            <span>Registrar</span>
          </Button>
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar visitante, apto ou placa"
          height="tall"
          className="mb-3"
        />

        <SegmentedTabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'todos', label: 'Todos', count: loading ? undefined : countTodos },
            { id: 'espera', label: 'Espera', count: loading ? undefined : countEspera },
            { id: 'local', label: 'No local', count: loading ? undefined : countLocal },
            { id: 'saiu', label: 'Saíram', count: loading ? undefined : countSaiu },
          ]}
        />
      </div>

      {/* Lista de Visitantes */}
      <div className="mt-3.5 flex flex-col gap-2.5">
        {loading ? (
          <ListCard className="py-10 text-center">
            <div className="text-[14px] font-bold text-ink mb-1">Carregando...</div>
            <div className="text-[12.5px] text-dim">
              Sincronizando controle de acesso de hoje.
            </div>
          </ListCard>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title={emptyTitle}
            description={emptySub}
          />
        ) : (
          shown.map((v) => {
            const uiStatus = mapUiStatus(v.status);
            const startMs = waitMap[v.id] || nowMs;
            const waitMin = Math.max(0, Math.floor((nowMs - startMs) / 60000));
            const isWaitLong = uiStatus === 'espera' && waitMin >= 5;
            const hasInviteQr = Boolean(
              v.moradorResponsavel && v.moradorResponsavel !== 'A CONFIRMAR',
            );
            const stayText = formatPermanencia(v.horaEntrada, nowMs);

            const statusTone =
              uiStatus === 'espera' ? 'warn' : uiStatus === 'local' ? 'ok' : 'neutral';

            return (
              <ListCard key={v.id} tone={isWaitLong ? 'warn' : 'default'}>
                <div className="flex justify-between items-start gap-2.5">
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-extrabold text-ink truncate">
                      {formatNomeVisitante(v.nome, v.sobrenome)}
                    </div>
                    <div className="text-[11.5px] text-dim mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{formatTipoVisitante(v.tipo)}</span>
                      {hasInviteQr && <Badge tone="brand">CONVITE QR</Badge>}
                    </div>
                  </div>

                  <Badge tone={statusTone}>{STATUS_LABELS[uiStatus]}</Badge>
                </div>

                <div className="font-mono text-[12.5px] font-semibold text-ink mt-2.5">
                  {formatDestino(v.blocoDestino, v.unidadeDestino)}
                </div>

                <div className="font-mono text-[11px] text-dim mt-1.5 flex gap-2.5 flex-wrap">
                  {uiStatus === 'espera' && (
                    <span className={isWaitLong ? 'text-warn font-semibold' : ''}>
                      Aguardando há {waitMin} min
                    </span>
                  )}
                  {uiStatus === 'local' && (
                    <>
                      <span>Entrada {formatHora(v.horaEntrada)}</span>
                      <span>
                        {stayText === 'agora' ? 'agora no local' : `${stayText} no local`}
                      </span>
                    </>
                  )}
                  {uiStatus === 'saiu' && (
                    <>
                      <span>Entrada {formatHora(v.horaEntrada)}</span>
                      <span>Saída {formatHora(v.horaSaida)}</span>
                    </>
                  )}
                  {v.placaVeiculo && <span>{v.placaVeiculo}</span>}
                </div>

                {uiStatus === 'espera' && (
                  <Button
                    variant="primary"
                    size="card"
                    fullWidth
                    onClick={() => handleLiberarEntrada(v.id)}
                    className="mt-3"
                  >
                    Liberar entrada
                  </Button>
                )}

                {uiStatus === 'local' && (
                  <Button
                    variant="secondary"
                    size="card"
                    fullWidth
                    onClick={() => handleRegistrarSaida(v.id)}
                    className="mt-3"
                  >
                    Registrar saída
                  </Button>
                )}
              </ListCard>
            );
          })
        )}
      </div>

      {/* Bottom Sheet: Registrar visitante */}
      <RegistrarVisitanteSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={() => {
          setIsSheetOpen(false);
          setFilter('espera');
          fetchVisitantes();
          refreshCounts();
          showToast('Visitante registrado na espera');
        }}
      />

      {/* Modal: Ler QR */}
      <QrAcessoModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onApproved={() => {
          fetchVisitantes();
          refreshCounts();
          showToast('Entrada liberada');
        }}
      />

      <Toast message={toastMsg} />
    </div>
  );
}
