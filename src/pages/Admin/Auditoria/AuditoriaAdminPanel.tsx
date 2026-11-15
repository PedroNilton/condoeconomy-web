import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Search,
  RefreshCw,
  Loader2,
  Globe,
} from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada } from '../../../utils/security';
import { PageHead } from '../../../components/ui';

interface EventoForense {
  id: string;
  usuarioId?: string;
  usuarioEmail: string;
  papel: string;
  evento: string;
  severidade: 'CRITICO' | 'ALERTA' | 'INFO' | string;
  ipOrigem: string;
  detalhes: string;
  criadoEm: string;
}

interface ResumoAuditoria {
  total: number;
  criticos: number;
  alertas: number;
  infos: number;
}

export function AuditoriaAdminPanel() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<EventoForense[]>([]);
  const [resumo, setResumo] = useState<ResumoAuditoria>({
    total: 0,
    criticos: 0,
    alertas: 0,
    infos: 0,
  });
  const [severidadeFiltro, setSeveridadeFiltro] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarAuditoria = async (sev = severidadeFiltro) => {
    setLoading(true);
    setErro(null);
    try {
      const params = sev ? { severidade: sev } : {};
      const res = await api.get('/api/v1/admin/auditoria', { params });
      setEventos(Array.isArray(res.data?.eventos) ? res.data.eventos : []);
      if (res.data?.resumo) {
        setResumo(res.data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar os registros forenses no momento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAuditoria(severidadeFiltro);
  }, [severidadeFiltro]);

  const termoLimpo = sanitizarEntrada(busca, 80).toLowerCase();
  const eventosFiltrados = eventos.filter((ev) => {
    if (!termoLimpo) return true;
    return (
      ev.usuarioEmail?.toLowerCase().includes(termoLimpo) ||
      ev.evento?.toLowerCase().includes(termoLimpo) ||
      ev.detalhes?.toLowerCase().includes(termoLimpo) ||
      ev.ipOrigem?.toLowerCase().includes(termoLimpo)
    );
  });

  const formatarData = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const renderBadgeSeveridade = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-bad-soft text-bad border border-bad/30 shrink-0">
            <ShieldAlert className="w-3 h-3" /> CRÍTICO
          </span>
        );
      case 'ALERTA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-warn-soft text-warn border border-warn/30 shrink-0">
            <AlertTriangle className="w-3 h-3" /> ALERTA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-soft text-brand border border-brand/20 shrink-0">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="-mx-[18px] -mt-[10px]">
        <PageHead
          eyebrow="Administração"
          title="Auditoria Forense"
          subtitle="Monitoramento em tempo real de segurança e conformidade LGPD"
          onBack={() => navigate('/admin')}
          action={
            <button
              type="button"
              onClick={() => carregarAuditoria(severidadeFiltro)}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center text-dim hover:text-brand transition-colors cursor-pointer"
              title="Atualizar trilha"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand' : ''}`} />
            </button>
          }
        />
      </div>

      {/* KPIs de Severidade */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-surface border border-bad/25 rounded-2xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bad">Críticos</span>
          <p className="font-mono text-xl font-extrabold text-ink mt-1 m-0">{resumo.criticos}</p>
        </div>
        <div className="bg-surface border border-warn/25 rounded-2xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-warn">Alertas</span>
          <p className="font-mono text-xl font-extrabold text-ink mt-1 m-0">{resumo.alertas}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-dim">Total</span>
          <p className="font-mono text-xl font-extrabold text-ink mt-1 m-0">{resumo.total}</p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por e-mail, evento, IP ou detalhe..."
            maxLength={80}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-faint focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { label: 'Todos', value: '' },
            { label: 'Críticos', value: 'CRITICO' },
            { label: 'Alertas', value: 'ALERTA' },
            { label: 'Informativos', value: 'INFO' },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSeveridadeFiltro(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 border cursor-pointer ${
                severidadeFiltro === tab.value
                  ? 'bg-brand text-brand-ink border-brand'
                  : 'bg-surface text-dim border-line hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className="p-3 rounded-xl bg-bad-soft border border-bad/30 text-bad text-xs font-semibold">
          {erro}
        </div>
      )}

      {/* Lista de Eventos em Cards Responsivos (412px) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-dim gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
          <span className="text-xs font-medium">Carregando trilha de auditoria...</span>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-faint mx-auto mb-2" />
          <p className="text-sm font-bold text-ink m-0">Nenhum evento encontrado</p>
          <p className="text-xs text-dim mt-1 m-0">Não há registros para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {eventosFiltrados.map((ev) => (
            <div
              key={ev.id}
              className="bg-surface border border-line rounded-2xl p-3.5 space-y-2 transition-colors hover:border-brand/40 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-ink break-words m-0">{ev.evento}</p>
                  <p className="text-[11px] text-dim truncate m-0 mt-0.5">
                    {ev.usuarioEmail}{' '}
                    <span className="text-faint">• {ev.papel?.replace('ROLE_', '') || 'N/A'}</span>
                  </p>
                </div>
                {renderBadgeSeveridade(ev.severidade)}
              </div>

              {ev.detalhes && (
                <p className="text-xs text-ink bg-canvas border border-line rounded-xl p-2.5 leading-relaxed break-words m-0">
                  {ev.detalhes}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 text-[10px] text-dim font-medium pt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1 font-mono text-faint">
                  <Globe className="w-3 h-3" /> {ev.ipOrigem || 'N/A'}
                </span>
                <span className="font-mono text-faint">{formatarData(ev.criadoEm)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

