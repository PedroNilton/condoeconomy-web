import { Package, UserCircle2, CalendarDays, Megaphone, Bell, Loader2, FileText, MessageSquare, Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  dataCriacao: string;
  autor: string;
}

export function MoradorHome() {
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  const [usuarioNome, setUsuarioNome] = useState('Morador');
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/v1/perfil/dados');
      setUsuarioNome(res.data.nome.split(' ')[0]);
      setUsuarioId(res.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/v1/notificacoes/nao-lidas/count');
      setUnreadCount(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Escuta WebSocket de notificacoes privadas para este usuario
  useWebSocket(usuarioId ? `/topic/notificacoes/${usuarioId}` : '', fetchUnreadCount);

  useEffect(() => {
    fetchProfile();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const fetchAvisos = async () => {
      try {
        const res = await api.get('/api/v1/avisos');
        setAvisos(res.data.slice(0, 3)); // Pega apenas os 3 avisos mais recentes para a Home
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAvisos(false);
      }
    };
    fetchAvisos();
  }, []);

  return (
    <div className="flex flex-col animate-fade-in">
      
      {/* Header Topo */}
      <header className="bg-blue-600 pt-12 pb-6 px-6 rounded-b-[30px] shadow-md relative animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
              <UserCircle2 className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>Olá, {usuarioNome}!</p>
              <h2 className="text-white text-lg font-bold animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>Bem-vindo</h2>
            </div>
          </div>
          <button 
            onClick={() => navigate('/app/notificacoes')}
            className="relative w-10 h-10 bg-white/10 dark:bg-slate-800 border border-white/20 dark:border-slate-700 rounded-full flex items-center justify-center text-white hover:bg-white/20 dark:hover:bg-slate-700 transition shadow-sm animate-fade-in-up"
            style={{ animationDelay: '300ms', opacity: 0 }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-blue-600 dark:border-slate-800"></span>
            )}
          </button>
        </div>

        {/* Card de Boleto Aberto */}
        <div 
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center justify-between border-l-[6px] border-amber-400 animate-fade-in-up"
          style={{ animationDelay: '400ms', opacity: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Taxa Condominial</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Vence em 3 dias</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/app/boletos')}
            className="text-xs font-bold text-white bg-slate-800 dark:bg-cyan-600 px-4 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-cyan-500 transition-colors shadow-sm"
          >
            Pagar
          </button>
        </div>
      </header>

      {/* Grid de Atalhos */}
      <div className="p-6 animate-fade-in-up" style={{ animationDelay: '500ms', opacity: 0 }}>
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 tracking-widest uppercase">Serviços Rápidos</h3>
        
        <div className="grid grid-cols-2 gap-4">
          
          <button 
            onClick={() => navigate('/app/encomendas')}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 relative">
              <Package className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                1
              </span>
            </div>
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Encomendas</span>
          </button>

          <button 
            onClick={() => navigate('/app/reservas')}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
              <CalendarDays className="w-6 h-6" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Reservar Salão</span>
          </button>

          <button 
            onClick={() => navigate('/app/visitantes')}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Visitantes</span>
          </button>

          <button 
            onClick={() => navigate('/app/assembleia')}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
              <Vote className="w-6 h-6" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Assembleia</span>
          </button>

          <button 
            onClick={() => navigate('/app/ouvidoria')}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center text-violet-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Ouvidoria</span>
          </button>

        </div>
      </div>

      {/* Mural de Avisos */}
      <div className="px-6 pb-6 animate-fade-in-up" style={{ animationDelay: '600ms', opacity: 0 }}>
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 tracking-widest uppercase">Mural do Síndico</h3>
        
        {loadingAvisos ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
          </div>
        ) : avisos.length === 0 ? (
          <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
             <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
             <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum aviso no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {avisos.map(aviso => (
              <div key={aviso.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-white">{aviso.titulo}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{aviso.mensagem}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium uppercase tracking-wider">
                      {new Date(aviso.dataCriacao).toLocaleDateString('pt-BR')} • {aviso.autor}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
