import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import {
  RegistrarVisitanteSheet,
  WAIT_STORAGE_KEY,
} from './components/RegistrarVisitanteForm';
import { QrAcessoModal } from './components/QrAcessoModal';

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
    }, 2200);
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
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
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
      {/* Page Head */}
      <div>
        <div className="text-[11px] font-bold text-ds-faint uppercase tracking-[0.06em]">
          Controle de acesso
        </div>
        <h1 className="text-[21px] font-extrabold text-ds-text mt-[3px] mb-[14px] tracking-[-0.01em]">
          Visitantes hoje
        </h1>

        <div className="grid grid-cols-[1fr_1.3fr] gap-[10px] mb-[14px]">
          <button
            type="button"
            onClick={() => setIsQrOpen(true)}
            className="h-[50px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text text-[14px] font-bold flex items-center justify-center gap-[8px] cursor-pointer hover:border-ds-border-strong transition-colors"
          >
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" />
            </svg>
            <span>Ler QR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="h-[50px] rounded-[12px] border border-ds-primary bg-ds-primary text-ds-primary-ink text-[14px] font-bold flex items-center justify-center gap-[8px] cursor-pointer hover:brightness-110 transition-all"
          >
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            <span>Registrar</span>
          </button>
        </div>

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
            placeholder="Buscar visitante, apto ou placa"
            className="w-full h-[46px] pl-[38px] pr-[13px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text text-[14px] placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
          />
        </div>

        {/* Tabs com contadores empilhados */}
        <div className="grid grid-cols-4 gap-[3px] p-[3px] bg-ds-card border border-ds-border rounded-[12px]">
          {(
            [
              { id: 'todos', label: 'Todos', count: countTodos },
              { id: 'espera', label: 'Espera', count: countEspera },
              { id: 'local', label: 'No local', count: countLocal },
              { id: 'saiu', label: 'Saíram', count: countSaiu },
            ] as const
          ).map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`border-0 text-[12px] font-bold py-[9px] px-[2px] rounded-[9px] cursor-pointer flex flex-col items-center gap-[2px] transition-colors ${
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

      {/* Lista de Visitantes */}
      <div className="mt-[14px] flex flex-col gap-[10px]">
        {loading ? (
          <div className="text-center py-[44px] px-[20px] bg-ds-card border border-ds-border rounded-[14px]">
            <div className="text-[14px] font-bold text-ds-text mb-[4px]">Carregando...</div>
            <div className="text-[12.5px] text-ds-dim leading-[1.5]">
              Sincronizando controle de acesso de hoje.
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-[44px] px-[20px] bg-ds-card border border-ds-border rounded-[14px]">
            <div className="text-[14px] font-bold text-ds-text mb-[4px]">{emptyTitle}</div>
            <div className="text-[12.5px] text-ds-dim leading-[1.5]">{emptySub}</div>
          </div>
        ) : (
          shown.map((v) => {
            const uiStatus = mapUiStatus(v.status);
            const startMs = waitMap[v.id] || nowMs;
            const waitMin = Math.max(0, Math.floor((nowMs - startMs) / 60000));
            const isWaitLong = uiStatus === 'espera' && waitMin >= 5;
            const hasInviteQr = Boolean(
              v.moradorResponsavel && v.moradorResponsavel !== 'A CONFIRMAR'
            );
            const stayText = formatPermanencia(v.horaEntrada, nowMs);

            const badgeClass =
              uiStatus === 'espera'
                ? 'bg-ds-warning-dim text-ds-warning'
                : uiStatus === 'local'
                ? 'bg-ds-success-dim text-ds-success'
                : 'bg-ds-bg text-ds-dim border border-ds-border';

            return (
              <div
                key={v.id}
                className={`bg-ds-card border rounded-[14px] p-[14px] ${
                  isWaitLong ? 'border-ds-warning' : 'border-ds-border'
                }`}
              >
                <div className="flex justify-between items-start gap-[10px]">
                  <div>
                    <div className="text-[14.5px] font-bold text-ds-text">
                      {formatNomeVisitante(v.nome, v.sobrenome)}
                    </div>
                    <div className="text-[11.5px] text-ds-dim mt-[2px] flex items-center gap-[6px] flex-wrap">
                      <span>{formatTipoVisitante(v.tipo)}</span>
                      {hasInviteQr && (
                        <span className="font-mono text-[9px] font-bold py-[2px] px-[6px] rounded-full bg-ds-primary-dim text-ds-primary">
                          CONVITE QR
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`font-mono text-[9.5px] font-bold py-[4px] px-[8px] rounded-full whitespace-nowrap shrink-0 ${badgeClass}`}
                  >
                    {STATUS_LABELS[uiStatus]}
                  </span>
                </div>

                <div className="font-mono text-[12.5px] font-semibold text-ds-text mt-[10px]">
                  {formatDestino(v.blocoDestino, v.unidadeDestino)}
                </div>

                <div className="font-mono text-[11px] text-ds-dim mt-[5px] flex gap-[10px] flex-wrap">
                  {uiStatus === 'espera' && (
                    <span className={isWaitLong ? 'text-ds-warning font-semibold' : ''}>
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
                  <button
                    type="button"
                    onClick={() => handleLiberarEntrada(v.id)}
                    className="mt-[12px] w-full h-[46px] rounded-[11px] text-[13.5px] font-bold cursor-pointer border border-ds-primary bg-ds-primary text-ds-primary-ink hover:brightness-110 transition-all"
                  >
                    Liberar entrada
                  </button>
                )}

                {uiStatus === 'local' && (
                  <button
                    type="button"
                    onClick={() => handleRegistrarSaida(v.id)}
                    className="mt-[12px] w-full h-[46px] rounded-[11px] text-[13.5px] font-bold cursor-pointer border border-ds-border bg-ds-card text-ds-text hover:border-ds-border-strong transition-colors"
                  >
                    Registrar saída
                  </button>
                )}
              </div>
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
