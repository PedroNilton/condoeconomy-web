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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-blue-600 p-6 flex items-center gap-4 text-white shadow-md rounded-b-[20px]">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Notificações</h1>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {notificacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bell className="w-16 h-16 mb-4 opacity-50" />
            <p>Nenhuma notificação por enquanto</p>
          </div>
        ) : (
          notificacoes.map(n => (
            <div 
              key={n.id} 
              className={`p-4 rounded-xl shadow-sm border ${n.lida ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 dark:text-white">{n.titulo}</h3>
                {!n.lida && (
                  <button onClick={() => markAsRead(n.id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1" title="Marcar como lida">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{n.mensagem}</p>
              <span className="text-xs text-gray-400">
                {new Date(n.dataCriacao).toLocaleString('pt-BR')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
