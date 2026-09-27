import { ChevronLeft, Package, FileText, Calendar, Send, Mail, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function MoradorNotificacoes() {
  const navigate = useNavigate();
  
  const [prefs, setPrefs] = useState({
    encomendas_push: true,
    boletos_push: true,
    boletos_email: true,
    reservas_push: true,
    comunicados_push: true,
    comunicados_email: true,
    resumo_email: true,
  });

  const [showToast, setShowToast] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  // Reusable custom toggle component
  const CustomToggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer flex-none w-[36px] h-[21px] active:scale-95 transition-transform duration-200">
      <input 
        type="checkbox" 
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="absolute inset-0 bg-ds-border rounded-full transition-colors duration-300 ease-in-out peer-checked:bg-ds-primary"></div>
      <div className="absolute top-[2.5px] left-[2.5px] w-[16px] h-[16px] bg-white rounded-full transition-transform duration-300 ease-in-out shadow-[0_1px_2px_rgba(0,0,0,0.2)] peer-checked:translate-x-[15px]"></div>
    </label>
  );

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative overflow-hidden">
      
      {/* Header */}
      <header className="px-5 py-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm flex-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Configurar notificações</h1>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-24 flex-1 overflow-y-auto">
        <p className="text-[14px] leading-relaxed text-ds-dim mb-6 pr-2">
          Escolha como quer ser avisado — cada tipo de aviso tem o canal que faz mais sentido pra ele.
        </p>

        {/* Table Card */}
        <div className="bg-ds-card border border-ds-border rounded-[20px] shadow-sm mb-6 overflow-hidden">
          
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-4 text-[10px] font-bold text-ds-dim uppercase tracking-wider">
            <span className="text-left">Tipo de aviso</span>
            <span className="text-center">Push</span>
            <span className="text-center">E-mail</span>
          </div>

          {/* Encomendas */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 border-t border-ds-border/50">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ds-text">Encomendas</div>
                <div className="text-[10.5px] text-ds-dim mt-[1px]">Chegou algo na portaria</div>
              </div>
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.encomendas_push} onChange={() => toggle('encomendas_push')} />
            </div>
            <div className="flex justify-center">
              <span className="text-[13px] text-ds-dim/50">—</span>
            </div>
          </div>

          {/* Boletos */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 border-t border-ds-border/50">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ds-text">Boletos</div>
                <div className="text-[10.5px] text-ds-dim mt-[1px]">Emissão e vencimento próximo</div>
              </div>
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.boletos_push} onChange={() => toggle('boletos_push')} />
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.boletos_email} onChange={() => toggle('boletos_email')} />
            </div>
          </div>

          {/* Reservas */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 border-t border-ds-border/50">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ds-text">Reservas</div>
                <div className="text-[10.5px] text-ds-dim mt-[1px]">Aprovação ou recusa do síndico</div>
              </div>
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.reservas_push} onChange={() => toggle('reservas_push')} />
            </div>
            <div className="flex justify-center">
              <span className="text-[13px] text-ds-dim/50">—</span>
            </div>
          </div>

          {/* Comunicados do síndico */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 border-t border-ds-border/50">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
                <Send className="w-4 h-4 -ml-0.5" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ds-text">Comunicados do síndico</div>
                <div className="text-[10.5px] text-ds-dim mt-[1px]">Avisos oficiais do condomínio</div>
              </div>
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.comunicados_push} onChange={() => toggle('comunicados_push')} />
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.comunicados_email} onChange={() => toggle('comunicados_email')} />
            </div>
          </div>

          {/* Resumo semanal */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 border-t border-ds-border/50">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ds-text">Resumo semanal</div>
                <div className="text-[10.5px] text-ds-dim mt-[1px]">Um e-mail por semana com tudo</div>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="text-[13px] text-ds-dim/50">—</span>
            </div>
            <div className="flex justify-center">
              <CustomToggle checked={prefs.resumo_email} onChange={() => toggle('resumo_email')} />
            </div>
          </div>

          {/* Emergência */}
          <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 border-t border-ds-border/50">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ds-text">Emergência</div>
                <div className="text-[10.5px] text-ds-dim mt-[1px]">Pânico e avisos urgentes</div>
              </div>
            </div>
            <div className="flex justify-center">
              <Lock className="w-[18px] h-[18px] text-ds-dim/50" />
            </div>
            <div className="flex justify-center">
              <Lock className="w-[18px] h-[18px] text-ds-dim/50" />
            </div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="flex gap-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-[12px] p-3 text-[12px] leading-relaxed mb-6">
          <AlertTriangle className="w-4 h-4 flex-none mt-[1px]" />
          <div>
            Avisos de emergência (pânico, comunicados urgentes) ficam sempre ativos em todos os canais — não é possível desativar.
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[10px] active:scale-95 transition-transform text-[14.5px] shadow-md"
        >
          Salvar preferências
        </button>
      </main>

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-[24px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg font-bold text-[13px] px-[18px] py-[11px] rounded-[10px] shadow-lg transition-all duration-300 z-50 whitespace-nowrap
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[80px] pointer-events-none'}
        `}
      >
        Preferências salvas
      </div>

    </div>
  );
}
