import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, Search, RefreshCw, Loader2, Globe } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada } from '../../../utils/security';

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
  const [eventos, setEventos] = useState<EventoForense[]>([]);
  const [resumo, setResumo] = useState<ResumoAuditoria>({ total: 0, criticos: 0, alertas: 0, infos: 0 });
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-ds-danger-dim text-ds-danger border border-ds-danger/30">
            <ShieldAlert className="w-3 h-3" /> CRÍTICO
          </span>
        );
      case 'ALERTA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-ds-warning-dim text-ds-warning border border-ds-warning/30">
            <AlertTriangle className="w-3 h-3" /> ALERTA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-ds-primary-dim text-ds-primary border border-ds-primary/20">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 py-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-ds-text tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-ds-primary" />
            Auditoria Forense
          </h1>
          <p className="text-xs text-ds-dim mt-0.5">
            Monitoramento em tempo real de segurança e conformidade LGPD
          </p>
        </div>
        <button
          type="button"
          onClick={() => carregarAuditoria(severidadeFiltro)}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-ds-card border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-primary transition-colors"
          title="Atualizar trilha"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-ds-primary' : ''}`} />
        </button>
      </div>

      {/* KPIs de Severidade */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-ds-card border border-ds-danger/25 rounded-2xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ds-danger">Críticos</span>
          <p className="text-xl font-extrabold text-ds-text mt-1">{resumo.criticos}</p>
        </div>
        <div className="bg-ds-card border border-ds-warning/25 rounded-2xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ds-warning">Alertas</span>
          <p className="text-xl font-extrabold text-ds-text mt-1">{resumo.alertas}</p>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-2xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ds-dim">Total</span>
          <p className="text-xl font-extrabold text-ds-text mt-1">{resumo.total}</p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-ds-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por e-mail, evento, IP ou detalhe..."
            maxLength={80}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ds-card border border-ds-border text-xs text-ds-text placeholder:text-ds-dim focus:outline-none focus:border-ds-primary"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
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
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shrink-0 border ${
                severidadeFiltro === tab.value
                  ? 'bg-ds-primary text-white border-ds-primary'
                  : 'bg-ds-card text-ds-dim border-ds-border hover:text-ds-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className="p-3 rounded-xl bg-ds-danger-dim border border-ds-danger/30 text-ds-danger text-xs font-semibold">
          {erro}
        </div>
      )}

      {/* Lista de Eventos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-ds-dim gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-ds-primary" />
          <span className="text-xs font-medium">Carregando trilha de auditoria...</span>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-ds-card border border-ds-border rounded-2xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-ds-dim mx-auto mb-2 opacity-60" />
          <p className="text-sm font-bold text-ds-text">Nenhum evento encontrado</p>
          <p className="text-xs text-ds-dim mt-1">Não há registros para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {eventosFiltrados.map((ev) => (
            <div
              key={ev.id}
              className="bg-ds-card border border-ds-border rounded-2xl p-3.5 space-y-2 transition-colors hover:border-ds-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-ds-text truncate">{ev.evento}</p>
                  <p className="text-[11px] text-ds-dim truncate">
                    {ev.usuarioEmail} <span className="opacity-60">• {ev.papel?.replace('ROLE_', '') || 'N/A'}</span>
                  </p>
                </div>
                {renderBadgeSeveridade(ev.severidade)}
              </div>

              {ev.detalhes && (
                <p className="text-xs text-ds-text/90 bg-ds-bg/70 border border-ds-border/60 rounded-xl p-2.5 leading-relaxed">
                  {ev.detalhes}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-ds-dim font-medium pt-0.5">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Globe className="w-3 h-3" /> {ev.ipOrigem || 'N/A'}
                </span>
                <span>{formatarData(ev.criadoEm)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
