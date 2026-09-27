import { ChevronLeft, ShieldCheck, Key, EyeOff, Eye, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';

export function MoradorSeguranca() {
  const navigate = useNavigate();

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');

  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (nova.length >= 8) score++;
    if (/[A-Z]/.test(nova) && /[0-9]/.test(nova)) score++;
    if (/[^A-Za-z0-9]/.test(nova) && nova.length >= 10) score++;
    return score;
  }, [nova]);

  const strengthColors = ['bg-ds-border', 'bg-ds-danger', 'bg-ds-warning', 'bg-ds-success'];
  const getBarColor = (index: number) => {
    if (nova.length === 0) return 'bg-ds-border';
    if (index < strength) {
      return strengthColors[Math.max(strength, 1)]; // 1=danger, 2=warning, 3=success
    }
    return 'bg-ds-border';
  };

  const strengthText = useMemo(() => {
    if (nova.length === 0) return 'Digite a nova senha';
    if (strength <= 1) return 'Senha fraca';
    if (strength === 2) return 'Senha média';
    return 'Senha forte';
  }, [strength, nova]);

  const mismatch = confirma.length > 0 && confirma !== nova;

  const handleUpdate = () => {
    if (mismatch || nova.length === 0) return;
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
    setAtual('');
    setNova('');
    setConfirma('');
  };

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
        <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Segurança e senha</h1>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-24 flex-1 overflow-y-auto">
        
        {/* Info Banner */}
        <div className="flex gap-2.5 bg-ds-primary-dim text-ds-primary rounded-[12px] p-3 text-[12px] leading-relaxed mb-6 border border-ds-primary/20">
          <ShieldCheck className="w-5 h-5 flex-none mt-[1px]" />
          <div>
            Sua senha nunca é armazenada em texto puro (usamos hash) e toda a conexão com o servidor é criptografada via HTTPS. Nunca compartilhe sua senha com terceiros ou com a portaria.
          </div>
        </div>

        {/* Alterar Senha Section */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ds-text mb-4">
            <Key className="w-4 h-4 text-ds-dim" />
            Alterar senha
          </h2>

          <div className="space-y-4">
            
            {/* Senha Atual */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Senha atual</label>
              <div className="relative">
                <input 
                  type={showAtual ? 'text' : 'password'}
                  value={atual}
                  onChange={(e) => setAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 pr-12 text-[15px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
                />
                <button 
                  type="button"
                  onClick={() => setShowAtual(!showAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ds-dim hover:text-ds-text transition-colors"
                >
                  {showAtual ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Nova senha</label>
              <div className="relative">
                <input 
                  type={showNova ? 'text' : 'password'}
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 pr-12 text-[15px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
                />
                <button 
                  type="button"
                  onClick={() => setShowNova(!showNova)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ds-dim hover:text-ds-text transition-colors"
                >
                  {showNova ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              
              {/* Strength Meter */}
              <div className="flex gap-1 mt-2">
                <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getBarColor(0)}`}></div>
                <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getBarColor(1)}`}></div>
                <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getBarColor(2)}`}></div>
              </div>
              <div className="text-[11px] text-ds-dim mt-1.5">{strengthText}</div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Confirmar nova senha</label>
              <div className="relative">
                <input 
                  type={showConfirma ? 'text' : 'password'}
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={`w-full bg-ds-bg border ${mismatch ? 'border-ds-danger focus:ring-ds-danger' : 'border-ds-border focus:ring-ds-primary'} rounded-[12px] px-4 py-3.5 pr-12 text-[15px] text-ds-text focus:ring-2 focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow`}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirma(!showConfirma)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ds-dim hover:text-ds-text transition-colors"
                >
                  {showConfirma ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {mismatch && (
                <div className="text-[11px] text-ds-danger mt-1.5 animate-in fade-in slide-in-from-top-1">
                  As senhas não coincidem.
                </div>
              )}
            </div>

            <button 
              onClick={handleUpdate}
              disabled={mismatch || nova.length === 0}
              className="w-full bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[10px] active:scale-95 transition-transform text-[14.5px] shadow-md mt-2 disabled:opacity-50 disabled:active:scale-100"
            >
              Atualizar senha
            </button>

          </div>
        </section>

        {/* Sessões ativas Section */}
        <section>
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ds-danger mb-4">
            <AlertTriangle className="w-4 h-4" />
            Sessões ativas
          </h2>

          <div className="flex items-center gap-3 p-3.5 border border-ds-border rounded-[12px] mb-2.5 bg-ds-card shadow-sm">
            <div className="w-[34px] h-[34px] rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-ds-text truncate">iPhone de Carlos</div>
              <div className="text-[11px] text-ds-dim mt-[1px]">Aracaju, SE • agora</div>
            </div>
            <span className="font-mono text-[9px] font-bold px-2 py-1 rounded-full bg-ds-success-dim text-ds-success whitespace-nowrap tracking-wider">
              ESTE DISPOSITIVO
            </span>
          </div>

          <div className="flex items-center gap-3 p-3.5 border border-ds-border rounded-[12px] mb-4 bg-ds-card shadow-sm">
            <div className="w-[34px] h-[34px] rounded-lg bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim flex-none">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-ds-text truncate">Chrome • Windows</div>
              <div className="text-[11px] text-ds-dim mt-[1px]">Aracaju, SE • há 3 dias</div>
            </div>
            <button className="text-[11.5px] font-bold text-ds-danger active:opacity-70 transition-opacity whitespace-nowrap">
              Encerrar
            </button>
          </div>

          <button className="w-full p-3 rounded-[10px] border border-ds-danger bg-ds-danger-dim text-ds-danger font-bold text-[13.5px] active:scale-95 transition-transform mt-1">
            Encerrar todas as outras sessões
          </button>
          <p className="text-[11px] text-ds-dim mt-2 leading-relaxed text-center">
            Isso desconecta qualquer dispositivo que não seja este, sem afetar sua sessão atual.
          </p>
        </section>

      </main>

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-[24px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg font-bold text-[13px] px-[18px] py-[11px] rounded-[10px] shadow-lg transition-all duration-300 z-50 whitespace-nowrap
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[80px] pointer-events-none'}
        `}
      >
        Senha atualizada com sucesso
      </div>

    </div>
  );
}
