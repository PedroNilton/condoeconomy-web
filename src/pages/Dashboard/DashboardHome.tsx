import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Package, QrCode, Search, AlertCircle, Users } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../contexts/NotificationContext';
import { Modal } from '../../components/UI/Modal';
import { NovaEncomendaForm } from '../Encomendas/components/NovaEncomendaForm';
import { RegistrarVisitanteSheet } from '../Visitantes/components/RegistrarVisitanteForm';
import { QrAcessoModal } from '../Visitantes/components/QrAcessoModal';
import { GroupedList, LiveIndicator, Toast } from '../../components/ui';

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

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
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
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint m-0 mb-2.5">
          Ações rápidas
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIsVisitanteSheetOpen(true)}
            className="min-h-[92px] rounded-[16px] border border-brand bg-brand text-brand-ink p-3.5 flex flex-col justify-between items-start cursor-pointer text-left hover:bg-brand-hover active:translate-y-[1px] transition-all"
          >
            <UserPlus className="w-[22px] h-[22px]" />
            <span className="text-[13.5px] font-bold leading-[1.25]">Registrar visitante</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEncomendaModalOpen(true)}
            className="min-h-[92px] rounded-[16px] border border-line bg-surface text-ink p-3.5 flex flex-col justify-between items-start cursor-pointer text-left hover:border-line-strong active:translate-y-[1px] transition-all"
          >
            <Package className="w-[22px] h-[22px] text-brand" />
            <span className="text-[13.5px] font-bold leading-[1.25]">Receber encomenda</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="min-h-[92px] rounded-[16px] border border-line bg-surface text-ink p-3.5 flex flex-col justify-between items-start cursor-pointer text-left hover:border-line-strong active:translate-y-[1px] transition-all"
          >
            <QrCode className="w-[22px] h-[22px] text-brand" />
            <span className="text-[13.5px] font-bold leading-[1.25]">Ler QR de acesso</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/portaria/veiculos')}
            className="min-h-[92px] rounded-[16px] border border-line bg-surface text-ink p-3.5 flex flex-col justify-between items-start cursor-pointer text-left hover:border-line-strong active:translate-y-[1px] transition-all"
          >
            <Search className="w-[22px] h-[22px] text-brand" />
            <span className="text-[13.5px] font-bold leading-[1.25]">Consultar placa</span>
          </button>
        </div>
      </section>

      {/* SEÇÃO 2: Visão geral */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint m-0 mb-2.5">
          Visão geral
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/portaria/encomendas')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/portaria/encomendas')}
            className="bg-surface border border-line rounded-[14px] p-3 cursor-pointer hover:border-line-strong transition-colors"
          >
            <div
              className={`w-[28px] h-[28px] rounded-[8px] grid place-items-center mb-2.5 ${
                encomendasCount > 0 ? 'bg-brand-soft text-brand' : 'bg-canvas text-faint'
              }`}
            >
              <Package className="w-[14px] h-[14px]" />
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-none tabular-nums ${
                encomendasCount > 0 ? 'text-ink' : 'text-faint'
              }`}
            >
              {loading ? '–' : encomendasCount}
            </div>
            <div className="text-[10.5px] text-dim mt-1.5 leading-[1.3]">
              Encomendas aguardando
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/portaria/visitantes')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/portaria/visitantes')}
            className="bg-surface border border-line rounded-[14px] p-3 cursor-pointer hover:border-line-strong transition-colors"
          >
            <div
              className={`w-[28px] h-[28px] rounded-[8px] grid place-items-center mb-2.5 ${
                visitantesCount > 0 ? 'bg-brand-soft text-brand' : 'bg-canvas text-faint'
              }`}
            >
              <Users className="w-[14px] h-[14px]" />
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-none tabular-nums ${
                visitantesCount > 0 ? 'text-ink' : 'text-faint'
              }`}
            >
              {loading ? '–' : visitantesCount}
            </div>
            <div className="text-[10.5px] text-dim mt-1.5 leading-[1.3]">
              Visitantes hoje
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/portaria/chamados')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/portaria/chamados')}
            className="bg-surface border border-line rounded-[14px] p-3 cursor-pointer hover:border-line-strong transition-colors"
          >
            <div
              className={`w-[28px] h-[28px] rounded-[8px] grid place-items-center mb-2.5 ${
                ouvidoriaCount > 0 ? 'bg-warn-soft text-warn' : 'bg-canvas text-faint'
              }`}
            >
              <AlertCircle className="w-[14px] h-[14px]" />
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-none tabular-nums ${
                ouvidoriaCount > 0 ? 'text-ink' : 'text-faint'
              }`}
            >
              {loading ? '–' : ouvidoriaCount}
            </div>
            <div className="text-[10.5px] text-dim mt-1.5 leading-[1.3]">
              Ouvidoria pendente
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: Atividade recente AO VIVO */}
      <section>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint m-0 mb-2.5 flex justify-between items-center">
          <span>Atividade recente</span>
          <LiveIndicator />
        </div>

        <GroupedList>
          {loading ? (
            <div className="px-3.5 py-4 text-[12px] text-dim text-center">
              Sincronizando atividade...
            </div>
          ) : feed.length === 0 ? (
            <div className="px-3.5 py-4 text-[12px] text-dim text-center">
              Nenhuma movimentação registrada recentemente.
            </div>
          ) : (
            feed.map((ev) => (
              <div key={ev.id} className="flex gap-3 items-start px-3.5 py-3">
                <span className="font-mono text-[11px] text-faint w-[38px] shrink-0 pt-[1px]">
                  {ev.hora}
                </span>
                <div className="text-[12.5px] leading-[1.45] min-w-0">
                  <b className="font-bold text-ink">{ev.titulo}</b>
                  <small className="block text-[11px] text-dim mt-[1px] truncate">
                    {ev.detalhe}
                  </small>
                </div>
              </div>
            ))
          )}
        </GroupedList>
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

      <Toast message={toastMsg} />
    </>
  );
}
