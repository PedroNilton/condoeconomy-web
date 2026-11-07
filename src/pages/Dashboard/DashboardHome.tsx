import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import { Modal } from '../../components/UI/Modal';
import { NovaEncomendaForm } from '../Encomendas/components/NovaEncomendaForm';
import { RegistrarVisitanteSheet } from '../Visitantes/components/RegistrarVisitanteForm';
import { QrAcessoModal } from '../Visitantes/components/QrAcessoModal';

interface FeedEvent {
  id: string;
  timestamp: number;
  hora: string;
  titulo: string;
  detalhe: string;
}

function formatHora(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatBlocoApto(bloco?: string, apto?: string): string {
  const b = (bloco || '').replace(/^bloco\s*/i, '').trim();
  const a = (apto || '').replace(/^apto\.?\s*/i, '').trim();
  if (b && a) return `Bloco ${b} · Apto ${a}`;
  if (a) return `Apto ${a}`;
  if (b) return `Bloco ${b}`;
  return 'Condomínio';
}

function normalizarUnidadeTexto(raw?: string): string {
  if (!raw) return 'Condomínio';
  if (raw.includes('·')) return raw;
  const parts = raw.split(/\s*[-•]\s*/);
  if (parts.length === 2) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim();
    if (/^apto/i.test(p0) && /^bloco/i.test(p1)) {
      return `${p1} · ${p0}`;
    }
    const b = p0.replace(/^bloco\s*/i, '');
    const a = p1.replace(/^apto\.?\s*/i, '');
    return `Bloco ${b} · Apto ${a}`;
  }
  return raw;
}

export function DashboardHome() {
  const [encomendasCount, setEncomendasCount] = useState(0);
  const [visitantesCount, setVisitantesCount] = useState(0);
  const [ouvidoriaCount, setOuvidoriaCount] = useState(0);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [isVisitanteSheetOpen, setIsVisitanteSheetOpen] = useState(false);
  const [isEncomendaModalOpen, setIsEncomendaModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const carregarPainel = useCallback(async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const [resEnc, resVisHoje, resVisRecentes, resCham] = await Promise.all([
        api.get('/api/v1/encomendas').catch(() => ({ data: [] })),
        api.get(`/api/v1/visitantes?dataVisita=${hoje}`).catch(() => ({ data: [] })),
        api.get('/api/v1/visitantes').catch(() => ({ data: [] })),
        api.get('/api/v1/chamados').catch(() => ({ data: [] })),
      ]);

      const listaEnc = Array.isArray(resEnc.data) ? resEnc.data : [];
      const listaVisHoje = Array.isArray(resVisHoje.data) ? resVisHoje.data : [];
      const listaVis = Array.isArray(resVisRecentes.data) ? resVisRecentes.data : [];
      const listaCham = Array.isArray(resCham.data) ? resCham.data : [];

      const aguardando = listaEnc.filter((e: any) => e.status === 'AGUARDANDO_RETIRADA').length;
      const abertos = listaCham.filter((c: any) => c.status === 'ABERTO').length;

      setEncomendasCount(aguardando);
      setVisitantesCount(listaVisHoje.length);
      setOuvidoriaCount(abertos);

      const eventos: FeedEvent[] = [];

      for (const enc of listaEnc) {
        const unidadeFmt = normalizarUnidadeTexto(enc.unidade);
        if (enc.dataRecebimento) {
          const ts = new Date(enc.dataRecebimento).getTime();
          if (!Number.isNaN(ts)) {
            eventos.push({
              id: `enc-in-${enc.id}`,
              timestamp: ts,
              hora: formatHora(enc.dataRecebimento),
              titulo: 'Encomenda registrada',
              detalhe: unidadeFmt,
            });
          }
        }
        if (enc.dataRetirada && (enc.status === 'RETIRADA' || enc.status === 'ENTREGUE')) {
          const tsRet = new Date(enc.dataRetirada).getTime();
          if (!Number.isNaN(tsRet)) {
            eventos.push({
              id: `enc-out-${enc.id}`,
              timestamp: tsRet,
              hora: formatHora(enc.dataRetirada),
              titulo: 'Encomenda entregue',
              detalhe: enc.destinatario
                ? `${unidadeFmt} · retirada por ${enc.destinatario.split(' ')[0]}`
                : unidadeFmt,
            });
          }
        }
      }

      for (const vis of listaVis) {
        const s = (vis.sobrenome || '').trim();
        const nomeCompleto = `${(vis.nome || '').replace(/\.$/, '')} ${
          s && s.toLowerCase() !== 'convidado' && s !== '.' ? s.replace(/\.$/, '') : ''
        }`.trim();
        const destinoFmt = formatBlocoApto(vis.blocoDestino, vis.unidadeDestino);

        if (vis.horaEntrada) {
          const tsIn = new Date(vis.horaEntrada).getTime();
          if (!Number.isNaN(tsIn)) {
            eventos.push({
              id: `vis-in-${vis.id}`,
              timestamp: tsIn,
              hora: formatHora(vis.horaEntrada),
              titulo: 'Visitante entrou',
              detalhe: `${nomeCompleto} → ${destinoFmt}`,
            });
          }
        }
        if (vis.horaSaida) {
          const tsOut = new Date(vis.horaSaida).getTime();
          if (!Number.isNaN(tsOut)) {
            eventos.push({
              id: `vis-out-${vis.id}`,
              timestamp: tsOut,
              hora: formatHora(vis.horaSaida),
              titulo: 'Visitante saiu',
              detalhe: `${nomeCompleto} · ${destinoFmt}`,
            });
          }
        }
      }

      for (const ch of listaCham) {
        if (ch.dataAbertura) {
          const tsCh = new Date(ch.dataAbertura).getTime();
          if (!Number.isNaN(tsCh)) {
            eventos.push({
              id: `ch-${ch.id}`,
              timestamp: tsCh,
              hora: formatHora(ch.dataAbertura),
              titulo: 'Ouvidoria aberta',
              detalhe: `${normalizarUnidadeTexto(ch.unidadeTexto)} · ${ch.assunto}`,
            });
          }
        }
      }

      eventos.sort((a, b) => b.timestamp - a.timestamp);
      setFeed(eventos.slice(0, 6));
    } catch (err) {
      console.error('Erro ao carregar painel da portaria:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPainel();
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [carregarPainel]);

  useWebSocket('/topic/visitantes', carregarPainel);
  useWebSocket('/topic/encomendas', carregarPainel);
  useWebSocket('/topic/chamados', carregarPainel);
  useWebSocket('/topic/reservas', carregarPainel);

  const handleActionComplete = (msg?: string) => {
    carregarPainel();
    refreshCounts();
    if (msg) showToast(msg);
  };

  return (
    <>
      {/* SEÇÃO 1: Ações rápidas */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0 mb-[10px] flex justify-between items-center">
          Ações rápidas
        </p>

        <div className="grid grid-cols-2 gap-[10px]">
          <button
            type="button"
            onClick={() => setIsVisitanteSheetOpen(true)}
            className="min-h-[92px] rounded-[16px] border border-ds-primary bg-ds-primary text-ds-primary-ink p-[14px] flex flex-col justify-between items-start cursor-pointer text-left hover:brightness-110 active:scale-[0.99] transition-all"
          >
            <svg
              className="w-[22px] h-[22px] text-ds-primary-ink"
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
            <span className="text-[13.5px] font-bold leading-[1.25]">Registrar visitante</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEncomendaModalOpen(true)}
            className="min-h-[92px] rounded-[16px] border border-ds-border bg-ds-card text-ds-text p-[14px] flex flex-col justify-between items-start cursor-pointer text-left hover:border-ds-border-strong active:scale-[0.99] transition-all"
          >
            <svg
              className="w-[22px] h-[22px] text-ds-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
            <span className="text-[13.5px] font-bold leading-[1.25]">Receber encomenda</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="min-h-[92px] rounded-[16px] border border-ds-border bg-ds-card text-ds-text p-[14px] flex flex-col justify-between items-start cursor-pointer text-left hover:border-ds-border-strong active:scale-[0.99] transition-all"
          >
            <svg
              className="w-[22px] h-[22px] text-ds-primary"
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
            <span className="text-[13.5px] font-bold leading-[1.25]">Ler QR de acesso</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/portaria/veiculos')}
            className="min-h-[92px] rounded-[16px] border border-ds-border bg-ds-card text-ds-text p-[14px] flex flex-col justify-between items-start cursor-pointer text-left hover:border-ds-border-strong active:scale-[0.99] transition-all"
          >
            <svg
              className="w-[22px] h-[22px] text-ds-primary"
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
            <span className="text-[13.5px] font-bold leading-[1.25]">Consultar placa</span>
          </button>
        </div>
      </section>

      {/* SEÇÃO 2: Visão geral */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0 mb-[10px] flex justify-between items-center">
          Visão geral
        </p>

        <div className="grid grid-cols-3 gap-[10px]">
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/portaria/encomendas')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/portaria/encomendas')}
            className="bg-ds-card border border-ds-border rounded-[14px] p-[12px] cursor-pointer hover:border-ds-border-strong transition-colors"
          >
            <div
              className={`w-[28px] h-[28px] rounded-[8px] grid place-items-center mb-[10px] ${
                encomendasCount > 0
                  ? 'bg-ds-primary-dim text-ds-primary'
                  : 'bg-ds-bg text-ds-faint'
              }`}
            >
              <svg
                className="w-[14px] h-[14px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
                <path d="M3 8l9 5 9-5M12 13v8" />
              </svg>
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-none ${
                encomendasCount > 0 ? 'text-ds-text' : 'text-ds-faint'
              }`}
            >
              {loading ? '–' : encomendasCount}
            </div>
            <div className="text-[10.5px] text-ds-dim mt-[6px] leading-[1.3]">
              Encomendas aguardando
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/portaria/visitantes')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/portaria/visitantes')}
            className="bg-ds-card border border-ds-border rounded-[14px] p-[12px] cursor-pointer hover:border-ds-border-strong transition-colors"
          >
            <div
              className={`w-[28px] h-[28px] rounded-[8px] grid place-items-center mb-[10px] ${
                visitantesCount > 0
                  ? 'bg-ds-primary-dim text-ds-primary'
                  : 'bg-ds-bg text-ds-faint'
              }`}
            >
              <svg
                className="w-[14px] h-[14px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-none ${
                visitantesCount > 0 ? 'text-ds-text' : 'text-ds-faint'
              }`}
            >
              {loading ? '–' : visitantesCount}
            </div>
            <div className="text-[10.5px] text-ds-dim mt-[6px] leading-[1.3]">
              Visitantes hoje
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/portaria/chamados')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/portaria/chamados')}
            className="bg-ds-card border border-ds-border rounded-[14px] p-[12px] cursor-pointer hover:border-ds-border-strong transition-colors"
          >
            <div
              className={`w-[28px] h-[28px] rounded-[8px] grid place-items-center mb-[10px] ${
                ouvidoriaCount > 0
                  ? 'bg-ds-warning-dim text-ds-warning'
                  : 'bg-ds-bg text-ds-faint'
              }`}
            >
              <svg
                className="w-[14px] h-[14px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-none ${
                ouvidoriaCount > 0 ? 'text-ds-text' : 'text-ds-faint'
              }`}
            >
              {loading ? '–' : ouvidoriaCount}
            </div>
            <div className="text-[10.5px] text-ds-dim mt-[6px] leading-[1.3]">
              Ouvidoria pendente
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: Atividade recente AO VIVO */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0 mb-[10px] flex justify-between items-center">
          <span>Atividade recente</span>
          <span className="flex items-center gap-[6px] font-mono text-[10px] text-ds-success tracking-[0.03em]">
            <i className="w-[6px] h-[6px] rounded-full bg-ds-success portaria-live-dot inline-block" />
            AO VIVO
          </span>
        </p>

        <div className="bg-ds-card border border-ds-border rounded-[14px] overflow-hidden">
          {loading ? (
            <div className="px-[14px] py-[18px] text-[12px] text-ds-dim text-center">
              Sincronizando atividade...
            </div>
          ) : feed.length === 0 ? (
            <div className="px-[14px] py-[18px] text-[12px] text-ds-dim text-center">
              Nenhuma movimentação registrada recentemente.
            </div>
          ) : (
            feed.map((ev) => (
              <div
                key={ev.id}
                className="flex gap-[12px] items-start px-[14px] py-[12px] border-b border-ds-border last:border-b-0"
              >
                <span className="font-mono text-[11px] text-ds-faint w-[38px] shrink-0 pt-[1px]">
                  {ev.hora}
                </span>
                <div className="text-[12.5px] leading-[1.45] min-w-0">
                  <b className="font-bold text-ds-text">{ev.titulo}</b>
                  <small className="block text-[11px] text-ds-dim mt-[1px] truncate">
                    {ev.detalhe}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bottom Sheet: Registrar visitante */}
      <RegistrarVisitanteSheet
        isOpen={isVisitanteSheetOpen}
        onClose={() => setIsVisitanteSheetOpen(false)}
        onSuccess={() => {
          setIsVisitanteSheetOpen(false);
          handleActionComplete('Visitante registrado na espera');
        }}
      />

      {/* Modal: Receber encomenda */}
      <Modal
        isOpen={isEncomendaModalOpen}
        onClose={() => setIsEncomendaModalOpen(false)}
        title="Receber encomenda"
      >
        <NovaEncomendaForm
          onCancel={() => setIsEncomendaModalOpen(false)}
          onSuccess={() => {
            setIsEncomendaModalOpen(false);
            handleActionComplete('Encomenda registrada');
          }}
        />
      </Modal>

      {/* Modal: Ler QR de acesso */}
      <QrAcessoModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onApproved={() => handleActionComplete('Entrada liberada')}
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
    </>
  );
}
