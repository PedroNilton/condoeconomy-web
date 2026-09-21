import { useState, useEffect } from 'react';
import { Bell, CalendarDays, Car, Users, MessageSquare, QrCode, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

export function MoradorHome() {
  const navigate = useNavigate();
  const [usuarioNome, setUsuarioNome] = useState('');
  const [iniciais, setIniciais] = useState('');
  const [loadingAvisos, setLoadingAvisos] = useState(false);

  useEffect(() => {
    const nome = localStorage.getItem('@CondoEconomy:nome') || 'Usuário';
    setUsuarioNome(nome);
    
    // Pegar iniciais para o Avatar
    const parts = nome.split(' ');
    if (parts.length > 1) {
      setIniciais(parts[0][0] + parts[1][0]);
    } else {
      setIniciais(parts[0][0]);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-[#09090b] text-white">
      
      {/* HEADER SECTION */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-cyan-200 rounded-full flex items-center justify-center">
            <span className="text-cyan-950 font-bold text-sm tracking-widest">{iniciais}</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Bom dia,</p>
            <h2 className="text-white text-base font-bold tracking-wide">{usuarioNome}</h2>
            <p className="text-slate-500 text-[11px] mt-0.5">Apto 101 - Bloco B</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/app/notificacoes')}
          className="w-10 h-10 bg-[#18181b] border border-white/5 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-white rounded-full"></span>
        </button>
      </header>

      {/* BOLETO CARD */}
      <div className="px-6 py-4">
        <div 
          onClick={() => navigate('/app/boletos')}
          className="bg-slate-100 rounded-[2rem] p-6 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.15)] relative cursor-pointer"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-slate-500 text-xs font-medium mb-1">Próximo boleto</p>
              <h3 className="text-slate-900 text-lg font-bold">Fatura de Setembro</h3>
            </div>
            <QrCode className="w-6 h-6 text-slate-800" />
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">R$ 650<span className="text-xl">,00</span></p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Vence em 3 dias · 10/09/2026</p>
            </div>
            <button 
              className="bg-white text-slate-900/40 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm opacity-60"
            >
              Pagar agora
            </button>
          </div>
        </div>
      </div>

      {/* 2x2 ACTION GRID */}
      <div className="px-6 py-2">
        <div className="grid grid-cols-2 gap-3">
          
          <button 
            onClick={() => navigate('/app/reservas')}
            className="bg-[#18181b] border border-white/5 p-5 rounded-2xl flex flex-col gap-4 text-left hover:bg-[#27272a] transition-colors active:scale-95"
          >
            <CalendarDays className="w-6 h-6 text-slate-200 stroke-[1.5px]" />
            <span className="text-sm font-semibold text-white">Agendar área</span>
          </button>

          <button 
            onClick={() => navigate('/app/perfil/veiculos')}
            className="bg-[#18181b] border border-white/5 p-5 rounded-2xl flex flex-col gap-4 text-left hover:bg-[#27272a] transition-colors active:scale-95"
          >
            <Car className="w-6 h-6 text-slate-200 stroke-[1.5px]" />
            <span className="text-sm font-semibold text-white">Meus veículos</span>
          </button>

          <button 
            onClick={() => {}}
            className="bg-[#18181b] border border-white/5 p-5 rounded-2xl flex flex-col gap-4 text-left hover:bg-[#27272a] transition-colors active:scale-95"
          >
            <Users className="w-6 h-6 text-slate-200 stroke-[1.5px]" />
            <span className="text-sm font-semibold text-white">Assembleia</span>
          </button>

          <button 
            onClick={() => {}}
            className="bg-[#18181b] border border-white/5 p-5 rounded-2xl flex flex-col gap-4 text-left hover:bg-[#27272a] transition-colors active:scale-95"
          >
            <MessageSquare className="w-6 h-6 text-slate-200 stroke-[1.5px]" />
            <span className="text-sm font-semibold text-white">Ouvidoria</span>
          </button>

        </div>
      </div>

      {/* ACOMPANHE SEU CONDOMINIO */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-white tracking-wide">Acompanhe seu condomínio</h3>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
        
        <div className="bg-[#18181b] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Tudo em dia por aqui</h4>
              <p className="text-xs text-slate-400 mt-0.5">Financeiro atualizado hoje</p>
            </div>
          </div>
          <span className="text-emerald-500 text-sm font-bold">100%</span>
        </div>
      </div>

    </div>
  );
}
