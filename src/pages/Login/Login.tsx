import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, ShieldCheck, AlertCircle, Mail, X, CheckCircle2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { sanitizarEntrada, contemAmeacas, EMAIL_SECURITY_REGEX } from '../../utils/security';

type Role = 'sindico' | 'portaria' | 'morador';

const roleSubtitles = {
  sindico: 'Painel da administração — financeiro, reservas e ouvidoria.',
  portaria: 'Encomendas, visitantes e prestadores de serviço.',
  morador: 'Seus boletos, reservas e chamados em um só lugar.'
};

const demoCredentials = {
  sindico: 'sindico@condominio.com',
  portaria: 'porteiro@condominio.com',
  morador: 'carlos.silva@email.com'
};

export function Login() {
  const [activeRole, setActiveRole] = useState<Role>('sindico');
  const [email, setEmail] = useState(demoCredentials.sindico);
  const [senha, setSenha] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const navigate = useNavigate();

  // Estados para modal de Recuperação de Senha / Primeiro Acesso
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Estados para modal de Ajuda
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Temporizador regressivo de segurança após tentativas falhas sucessivas
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Preenchimento de conveniência em desenvolvimento
  useEffect(() => {
    setEmail(demoCredentials[activeRole]);
    setSenha('123456');
    setError('');
  }, [activeRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || lockoutTimer > 0) return;

    // 1. Sanitização e remoção de caracteres de controle e bytes nulos
    const emailSanitizado = sanitizarEntrada(email).toLowerCase();
    const senhaSanitizada = sanitizarEntrada(senha);

    // 2. Detecção ativa de injeções (SQLi, XSS, scripts ou caracteres maliciosos)
    if (contemAmeacas(email) || contemAmeacas(senha)) {
      setError('Entrada inválida. Caracteres ou comandos proibidos detectados.');
      return;
    }

    // 3. Validação de formato de e-mail (Prevenção contra requisições malformadas)
    if (!emailSanitizado || !EMAIL_SECURITY_REGEX.test(emailSanitizado)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // 4. Validação de tamanho mínimo de senha
    if (!senhaSanitizada || senhaSanitizada.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    // 5. Validação de tamanho máximo (Proteção contra payload excessivo/DoS)
    if (senhaSanitizada.length > 128) {
      setError('A senha excede o limite máximo permitido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/v1/auth/login', { 
        email: emailSanitizado, 
        senha: senhaSanitizada 
      });
      const { token, papel, nome } = response.data;
      
      // Limpeza de tokens ou perfis anteriores para prevenir contaminação de sessão
      localStorage.removeItem('@HabitOS:token');
      localStorage.removeItem('@HabitOS:user');
      localStorage.removeItem('@HabitOS:nome');

      // Persistência segura e consistente do estado de autenticação
      localStorage.setItem('@HabitOS:token', token);
      if (nome) localStorage.setItem('@HabitOS:nome', nome);
      localStorage.setItem('@HabitOS:user', JSON.stringify({ nome, papel, email: emailSanitizado }));
      
      setTentativasFalhas(0);

      // Redirecionamento por privilégio verificado
      if (papel === 'ROLE_PORTEIRO') {
        navigate('/portaria');
      } else if (papel === 'ROLE_ADMIN' || papel === 'ROLE_SINDICO' || papel === 'ROLE_SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
      
    } catch (err: any) {
      const novasTentativas = tentativasFalhas + 1;
      setTentativasFalhas(novasTentativas);

      if (err.response?.status === 429) {
        setLockoutTimer(60);
        setError('Muitas tentativas sem sucesso. Por segurança, aguarde 60 segundos antes de tentar novamente.');
      } else if (err.response?.status === 401 || err.response?.status === 400) {
        if (novasTentativas >= 4) {
          setLockoutTimer(30);
          setError('Múltiplas tentativas incorretas. Bloqueio temporário de 30 segundos ativado.');
        } else {
          setError(err.response?.data?.message || 'E-mail ou senha inválidos.');
        }
      } else {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const emailLimpo = sanitizarEntrada(forgotEmail).trim().toLowerCase();

    if (!emailLimpo) {
      setForgotError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    if (!EMAIL_SECURITY_REGEX.test(emailLimpo) || contemAmeacas(emailLimpo)) {
      setForgotError('Informe um endereço de e-mail válido e seguro.');
      return;
    }

    setForgotLoading(true);
    // Simula validação com delay para mitigar enumeração de contas / timing attack
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
    }, 800);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans text-ds-text"
      style={{
        backgroundColor: 'var(--color-ds-bg)',
        backgroundImage: `linear-gradient(var(--color-ds-card) 1px, transparent 1px), linear-gradient(90deg, var(--color-ds-card) 1px, transparent 1px)`,
        backgroundSize: '34px 34px'
      }}
    >
      <main className="w-full max-w-[392px]">
        
        {/* Brand */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-ds-primary grid place-items-center flex-none">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="6" width="4.5" height="9" fill="white"/>
              <rect x="6.2" y="1" width="4.5" height="14" fill="white" fillOpacity=".85"/>
              <rect x="11.4" y="4" width="3.6" height="11" fill="white" fillOpacity=".7"/>
            </svg>
          </div>
          <span className="font-extrabold text-[16px] tracking-tight text-ds-text">HabitOS</span>
        </div>

        {/* Card */}
        <div className="bg-ds-card border border-ds-border rounded-[16px] p-7 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_20px_40px_-28px_rgba(0,0,0,0.3)]">
          <h1 className="text-[19px] font-bold m-0 mb-1 tracking-tight text-ds-text">Entrar</h1>
          <p className="text-ds-dim text-[13.5px] m-0 mb-5 min-h-[20px] leading-relaxed">
            {roleSubtitles[activeRole]}
          </p>

          <form onSubmit={handleLogin} noValidate>
            
            {/* Roles Picker */}
            <div className="grid grid-cols-3 bg-ds-bg border border-ds-border rounded-[10px] p-[3px] gap-[3px] mb-6">
              {(['sindico', 'portaria', 'morador'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`flex items-center justify-center text-[12.5px] font-semibold py-2 px-1 rounded-lg transition-colors capitalize ${
                    activeRole === role 
                      ? 'bg-ds-primary-dim text-ds-primary' 
                      : 'text-ds-dim hover:text-ds-text'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-ds-danger-dim border border-ds-danger/20 text-ds-danger p-3 rounded-lg text-xs font-semibold mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Fields */}
            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-ds-text">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="username"
                maxLength={255}
                spellCheck="false"
                disabled={loading || lockoutTimer > 0}
                className="w-full px-3 py-2.5 rounded-lg border border-ds-border bg-ds-bg text-ds-text text-[14px] focus:outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-shadow disabled:opacity-60"
                required
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12.5px] font-semibold text-ds-text">Senha</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ds-dim hover:text-ds-text text-[11px] font-medium flex items-center gap-1 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Exibir</span>
                    </>
                  )}
                </button>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                maxLength={128}
                disabled={loading || lockoutTimer > 0}
                className="w-full px-3 py-2.5 rounded-lg border border-ds-border bg-ds-bg text-ds-text text-[14px] focus:outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-shadow disabled:opacity-60"
                required
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mt-0.5 mb-5 text-[12.5px]">
              <label className="flex items-center gap-2 text-ds-dim cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-ds-primary w-3.5 h-3.5 rounded-sm" /> 
                <span className="mt-[1px]">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError('');
                  setForgotSuccess(false);
                  setIsForgotModalOpen(true);
                }}
                className="text-ds-primary font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading || lockoutTimer > 0}
              className="w-full p-3 border-none rounded-lg bg-ds-primary text-ds-primary-ink font-bold text-[14.5px] cursor-pointer hover:brightness-110 active:translate-y-[1px] transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : lockoutTimer > 0 ? (
                `Aguarde ${lockoutTimer}s para tentar novamente`
              ) : (
                'Entrar'
              )}
            </button>

            {/* Footer Status */}
            <div className="mt-5 pt-4 border-t border-ds-border flex items-center justify-between font-mono text-[11px] text-ds-dim">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-ds-success" />
                <span>Ambiente Seguro HabitOS</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="hover:text-ds-text transition-colors bg-transparent border-0 p-0 cursor-pointer text-left"
              >
                Precisa de ajuda?
              </button>
            </div>

          </form>
        </div>

        {/* Modal: Recuperação de Senha */}
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute top-4 right-4 text-ds-dim hover:text-ds-text p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-ds-primary/10 text-ds-primary flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ds-text m-0">Recuperação de Acesso</h2>
                  <p className="text-xs text-ds-dim m-0">Instruções para redefinição segura</p>
                </div>
              </div>

              {forgotSuccess ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-none mt-0.5" />
                    <div className="text-xs leading-relaxed text-ds-text">
                      <p className="font-semibold text-emerald-500 mb-1">Solicitação processada com sucesso!</p>
                      Se o e-mail informado estiver vinculado a uma conta ativa no condomínio, você receberá em instantes as orientações para cadastrar uma nova senha.
                    </div>
                  </div>
                  <p className="text-[11.5px] text-ds-dim text-center">
                    Verifique também a sua caixa de spam ou lixo eletrônico.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSuccess(false);
                      setForgotEmail('');
                    }}
                    className="w-full py-2.5 rounded-lg bg-ds-primary text-ds-primary-ink font-bold text-sm hover:brightness-110 transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className="text-xs text-ds-dim leading-relaxed">
                    Informe seu e-mail cadastrado na administração. Por políticas de segurança, enviaremos um link de uso único e temporário.
                  </p>

                  {forgotError && (
                    <div className="p-3 rounded-lg bg-ds-danger-dim border border-ds-danger/20 text-ds-danger text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-none" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ds-text">E-mail Cadastrado</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      maxLength={255}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-ds-border bg-ds-bg text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="flex-1 py-2.5 rounded-lg border border-ds-border text-ds-dim hover:text-ds-text font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 rounded-lg bg-ds-primary text-ds-primary-ink font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        'Enviar Instruções'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Central de Ajuda e Acesso */}
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-4 right-4 text-ds-dim hover:text-ds-text p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-ds-primary/10 text-ds-primary flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ds-text m-0">Central de Acesso e Ajuda</h2>
                  <p className="text-xs text-ds-dim m-0">Como funciona o acesso ao HabitOS</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-ds-dim leading-relaxed">
                <div className="p-3 rounded-xl bg-ds-bg border border-ds-border">
                  <p className="font-semibold text-ds-text mb-1 text-[13px]">🏢 Como sou cadastrado no condomínio?</p>
                  <span>
                    O cadastro de moradores, proprietários e colaboradores é realizado diretamente pela <strong>administração do condomínio</strong> ou pelo <strong>síndico</strong>.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-ds-bg border border-ds-border">
                  <p className="font-semibold text-ds-text mb-1 text-[13px]">🔑 Primeiro Acesso</p>
                  <span>
                    Após o cadastro pelo síndico, você receberá um e-mail com a senha provisória ou link de primeiro acesso. Ao entrar pela primeira vez, recomendamos a alteração da sua senha no menu Perfil.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-ds-bg border border-ds-border">
                  <p className="font-semibold text-ds-text mb-1 text-[13px]">🛡️ Problemas de Acesso?</p>
                  <span>
                    Se você trocou de e-mail ou não tem mais acesso à sua conta, entre em contato com a portaria ou com a administração do seu condomínio com um documento com foto para revalidação cadastral.
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-ds-border">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-ds-primary text-ds-primary-ink font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
