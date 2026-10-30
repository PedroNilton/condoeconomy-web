import { useState, useEffect } from 'react';
import { Bell, CalendarDays, Car, Users, MessageSquare, QrCode, ShieldCheck, ChevronRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorHome() {
  const navigate = useNavigate();
  const [usuarioNome, setUsuarioNome] = useState('');
  const [iniciais, setIniciais] = useState('');

  useEffect(() => {
    const nome = localStorage.getItem('@HabitOS:nome') || 'Usuário';
    setUsuarioNome(nome);

    const parts = nome.trim().split(/\s+/);
    if (parts.length > 1) {
      setIniciais((parts[0][0] + parts[1][0]).toUpperCase());
    } else if (parts[0]) {
      setIniciais(parts[0][0].toUpperCase());
    }
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans">

      {/* HEADER SECTION */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-ds-primary-dim rounded-full flex items-center justify-center">
            <span className="text-ds-primary font-bold text-sm tracking-widest">{iniciais}</span>
          </div>
          <div>
            <p className="text-ds-dim text-xs font-semibold">Olá,</p>
            <h2 className="text-ds-text text-base font-extrabold tracking-wide">{usuarioNome}</h2>
            <p className="text-ds-dim text-[11px] mt-0.5">Ambiente do Morador • HabitOS</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/notificacoes')}
          className="w-10 h-10 bg-ds-card border border-ds-border rounded-full flex items-center justify-center text-ds-text hover:brightness-110 transition-colors relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-ds-danger rounded-full"></span>
        </button>
      </header>

      {/* BOLETO CARD */}
      <div className="px-6 py-4">
        <div
          onClick={() => navigate('/app/boletos')}
          className="bg-ds-primary rounded-[24px] p-6 shadow-[0_10px_40px_-10px_rgba(108,99,245,0.4)] relative cursor-pointer hover:brightness-110 transition-all"
        >
          <div className="flex justify-between items-start mb-6 text-ds-primary-ink">
            <div>
              <p className="text-white/70 text-xs font-semibold mb-1">Próximo boleto</p>
              <h3 className="text-white text-lg font-bold">Taxa Condominial</h3>
            </div>
            <QrCode className="w-6 h-6 text-white/80" />
          </div>

          <div className="flex items-end justify-between text-ds-primary-ink">
            <div>
              <p className="text-3xl font-black tracking-tight">R$ 650<span className="text-xl">,00</span></p>
              <p className="text-white/70 text-xs mt-1 font-semibold">Consulte faturas e PIX</p>
            </div>
            <button
              type="button"
              className="bg-white text-ds-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer"
            >
              Ver faturas
            </button>
          </div>
        </div>
      </div>

      {/* 2x2 ACTION GRID */}
      <div className="px-6 py-2">
        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() => navigate('/app/reservas')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <CalendarDays className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Agendar área</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/perfil/veiculos')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <Car className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Meus veículos</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/assembleia')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <Users className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Assembleia</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/ouvidoria')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Ouvidoria</span>
          </button>

        </div>
      </div>

      {/* CONDOSTORE BANNER */}
      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={() => navigate('/app/condostore')}
          className="w-full bg-ds-card border border-ds-border hover:border-ds-primary p-4 rounded-[18px] flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-ds-primary/15 text-ds-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-ds-text m-0">CondoStore 24h</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                  Aberto
                </span>
              </div>
              <p className="text-xs text-ds-dim m-0 mt-0.5">Compre pelo app no mercadinho autônomo</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ds-dim shrink-0" />
        </button>
      </div>

      {/* ACOMPANHE SEU CONDOMINIO */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-ds-faint tracking-wider uppercase">Acompanhe seu condomínio</h3>
          <ChevronRight className="w-4 h-4 text-ds-dim" />
        </div>

        <div className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-ds-success-dim rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-ds-success" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ds-text">Tudo em dia por aqui</h4>
              <p className="text-xs text-ds-dim mt-0.5">Segurança e financeiro sincronizados</p>
            </div>
          </div>
          <span className="text-ds-success text-sm font-bold">100%</span>
        </div>
      </div>

    </div>
  );
}
