import { useState, useEffect } from 'react';
import {
  BellOff,
  Package,
  FileText,
  CalendarCheck,
  Wrench,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { EmptyState, IconChip, PageHead } from '../../components/ui';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataCriacao: string;
  categoria?: string;
}

export function NotificacoesList() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = async () => {
    try {
      const res = await api.get('/api/v1/notificacoes');
      setNotificacoes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put('/api/v1/notificacoes/' + id + '/lida');
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/v1/notificacoes/todas-lidas');
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const getIconData = (titulo: string, categoria?: string) => {
    const t = `${categoria || ''} ${titulo}`.toLowerCase();
    if (t.includes('encomenda')) return { icon: Package, isEmergency: false };
    if (t.includes('boleto') || t.includes('financ')) return { icon: FileText, isEmergency: false };
    if (t.includes('reserva')) return { icon: CalendarCheck, isEmergency: false };
    if (t.includes('manuten')) return { icon: Wrench, isEmergency: false };
    if (t.includes('acesso') || t.includes('alerta') || t.includes('emerg') || t.includes('segur'))
      return { icon: AlertTriangle, isEmergency: true };
    return { icon: Info, isEmergency: false };
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 60) return diffMins <= 1 ? 'AGORA' : `HÁ ${diffMins} MIN`;
    if (diffHrs < 24) return `HÁ ${diffHrs} H`;
    if (diffDays === 1) return 'ONTEM';
    if (diffDays < 7) return `HÁ ${diffDays} DIAS`;
    return d
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      .replace('.', '')
      .toUpperCase();
  };

  const isFromToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-8">
      <PageHead
        title={unreadCount > 0 ? `Notificações (${unreadCount})` : 'Notificações'}
        onBack={() => navigate(-1)}
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[12.5px] font-bold text-brand hover:underline cursor-pointer bg-transparent border-0 p-0"
            >
              Marcar todas como lidas
            </button>
          ) : undefined
        }
      />

      <main className="px-[18px] mt-2 flex-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : notificacoes.length === 0 ? (
          <EmptyState
            icon={<BellOff className="w-6 h-6" />}
            title="Tudo tranquilo"
            description="Nenhuma notificação por enquanto."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {notificacoes.map((n) => {
              const { icon: Icon, isEmergency } = getIconData(n.titulo, n.categoria);
              const showDot = !n.lida || isFromToday(n.dataCriacao);
              return (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => !n.lida && markAsRead(n.id)}
                  className={`w-full text-left p-3.5 rounded-[14px] flex gap-3 border transition-colors cursor-pointer ${
                    !n.lida
                      ? 'bg-brand-soft border-brand/25'
                      : 'bg-surface border-line hover:bg-canvas'
                  }`}
                >
                  <IconChip tone={isEmergency ? 'bad' : 'neutral'}>
                    <Icon className="w-[17px] h-[17px]" />
                  </IconChip>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13.5px] text-ink flex items-center gap-2">
                      <span className="truncate">{n.titulo}</span>
                      {showDot && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
                    </div>
                    <div className="text-[12px] text-dim mt-0.5 leading-relaxed">{n.mensagem}</div>
                    <div className="font-mono text-[10.5px] text-faint mt-1.5 font-semibold tracking-wider">
                      {formatTime(n.dataCriacao)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
