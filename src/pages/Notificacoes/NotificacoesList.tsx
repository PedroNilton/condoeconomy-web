import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react';
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

  const fetchNotificacoes = async () => {
    try {
      const res = await api.get('/api/v1/notificacoes');
      setNotificacoes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put('/api/v1/notificacoes/' + id + '/lida');
      fetchNotificacoes();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  return (
    <div className="flex flex-col h-full pb-20 animate-fade-in-up">
      <header className="bg-blue-600 p-6 flex items-center gap-4 text-white shadow-md rounded-b-[40px] relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Notificações</h1>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {notificacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
            <Bell className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-medium">Nenhuma notificação por enquanto</p>
          </div>
        ) : (
          notificacoes.map((n, idx) => (
            <div 
              key={n.id} 
              className={`p-5 rounded-3xl shadow-sm border animate-fade-in-up relative overflow-hidden ${
                n.lida 
                  ? 'bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50' 
                  : 'bg-white dark:bg-slate-800 border-cyan-200 dark:border-cyan-800/50 shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)]'
              }`}
              style={{ animationDelay: `${(idx + 1) * 100}ms`, opacity: 0 }}
            >
              {!n.lida && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>}
              <div className="flex justify-between items-start mb-3">
                <h3 className={`font-bold ${n.lida ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                  {n.titulo}
                </h3>
                {!n.lida && (
                  <button onClick={() => markAsRead(n.id)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 p-1 bg-cyan-50 dark:bg-cyan-500/10 rounded-full transition-colors active:scale-95" title="Marcar como lida">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-sm mb-3 leading-relaxed text-slate-600 dark:text-slate-300">
                {n.mensagem}
              </p>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {new Date(n.dataCriacao).toLocaleString('pt-BR')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
