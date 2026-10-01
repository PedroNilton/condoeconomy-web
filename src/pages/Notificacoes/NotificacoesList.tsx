import { useState, useEffect } from 'react';
import { ChevronLeft, BellOff, Package, FileText, CalendarCheck, Wrench, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataCriacao: string;
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
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notificacoes.filter(n => !n.lida).map(n => n.id);
      await Promise.all(unreadIds.map(id => api.put('/api/v1/notificacoes/' + id + '/lida')));
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const getIconData = (titulo: string) => {
    const t = titulo.toLowerCase();
    if (t.includes('encomenda')) return { icon: Package, isEmergency: false };
    if (t.includes('boleto')) return { icon: FileText, isEmergency: false };
    if (t.includes('reserva')) return { icon: CalendarCheck, isEmergency: false };
    if (t.includes('manuten')) return { icon: Wrench, isEmergency: false };
    if (t.includes('acesso') || t.includes('alerta') || t.includes('emerg')) return { icon: AlertTriangle, isEmergency: true };
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
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
  };

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative overflow-hidden">
      
      <header className="px-5 py-6 pt-10 flex items-center justify-between border-b border-ds-border bg-ds-bg relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm flex-none"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[19px] font-bold tracking-tight text-ds-text">
            {unreadCount > 0 ? `Notificações (${unreadCount})` : 'Notificações'}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-[13px] font-bold text-ds-primary active:scale-95 transition-transform bg-transparent"
          >
            Marcar lidas
          </button>
        )}
      </header>

      <main className="px-5 py-5 pb-24 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-ds-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-ds-faint">
            <BellOff className="w-[44px] h-[44px] mb-[14px]" strokeWidth={1.6} />
            <p className="text-[13.5px] text-ds-dim font-medium m-0">Nenhuma notificação por enquanto</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notificacoes.map((n) => {
              const { icon: Icon, isEmergency } = getIconData(n.titulo);
              return (
                <div 
                  key={n.id}
                  onClick={() => !n.lida && markAsRead(n.id)}
                  className={`p-4 rounded-[16px] flex gap-[14px] transition-colors cursor-pointer border border-transparent
                    ${!n.lida ? 'bg-ds-primary-dim' : 'bg-transparent active:bg-ds-card'}
                  `}
                >
                  <div className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-none 
                    ${isEmergency 
                      ? 'bg-ds-danger-dim text-ds-danger' 
                      : 'bg-ds-card border border-ds-border text-ds-dim'
                    }`}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13.5px] text-ds-text flex items-center gap-[7px]">
                      <span className="truncate">{n.titulo}</span>
                      {!n.lida && <span className="w-[7px] h-[7px] rounded-full bg-ds-primary flex-none"></span>}
                    </div>
                    <div className="text-[12px] text-ds-dim mt-[3px] leading-[1.5]">
                      {n.mensagem}
                    </div>
                    <div className="text-[10.5px] text-ds-faint mt-[5px] font-mono font-bold tracking-wider">
                      {formatTime(n.dataCriacao)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
