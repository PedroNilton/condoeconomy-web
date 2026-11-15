import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, X, CheckCircle2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { sanitizarEntrada, contemAmeacas, EMAIL_SECURITY_REGEX } from '../../utils/security';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const navigate = useNavigate();

  // Estados para modal de Recuperação e Redefinição de Senha (2 etapas reais)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'done'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodigo, setResetCodigo] = useState('');
  const [resetNovaSenha, setResetNovaSenha] = useState('');
  const [resetConfirmacao, setResetConfirmacao] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || lockoutTimer > 0) return;

    const emailSanitizado = sanitizarEntrada(email).toLowerCase();
    const senhaSanitizada = sanitizarEntrada(senha);

    if (contemAmeacas(email) || contemAmeacas(senha)) {
      setError('Entrada inválida. Caracteres ou comandos proibidos detectados.');
      return;
    }

    if (!emailSanitizado || !EMAIL_SECURITY_REGEX.test(emailSanitizado)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!senhaSanitizada || senhaSanitizada.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (senhaSanitizada.length > 128) {
      setError('A senha excede o limite máximo permitido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/v1/auth/login', {
        email: emailSanitizado,
        senha: senhaSanitizada,
      });
      const { token, papel, nome } = response.data;

      localStorage.removeItem('@HabitOS:token');
      localStorage.removeItem('@HabitOS:user');
      localStorage.removeItem('@HabitOS:nome');

      localStorage.setItem('@HabitOS:token', token);
      if (nome) localStorage.setItem('@HabitOS:nome', nome);
      localStorage.setItem('@HabitOS:user', JSON.stringify({ nome, papel, email: emailSanitizado }));

      setTentativasFalhas(0);

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
          setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
        }
      } else {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotLoading) return;
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
    try {
      await api.post('/api/v1/auth/recuperar-senha', { email: emailLimpo });
      setForgotEmail(emailLimpo);
      setResetCodigo('');
      setResetNovaSenha('');
      setResetConfirmacao('');
      setForgotStep('reset');
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || 'Não foi possível enviar o código no momento. Tente novamente.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotLoading) return;
    setForgotError('');

    const emailLimpo = sanitizarEntrada(forgotEmail).trim().toLowerCase();
    const codigoLimpo = resetCodigo.replace(/\D/g, '').slice(0, 6);

    if (!/^\d{6}$/.test(codigoLimpo)) {
      setForgotError('Informe o código numérico de 6 dígitos enviado ao seu e-mail.');
      return;
    }

    if (!resetNovaSenha || resetNovaSenha.length < 8) {
      setForgotError('A nova senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (resetNovaSenha.length > 128 || contemAmeacas(resetNovaSenha)) {
      setForgotError('A nova senha contém caracteres ou tamanho não permitidos.');
      return;
    }

    if (resetNovaSenha !== resetConfirmacao) {
      setForgotError('A confirmação da nova senha não confere.');
      return;
    }

    setForgotLoading(true);
    try {
      await api.post('/api/v1/auth/redefinir-senha', {
        email: emailLimpo,
        codigo: codigoLimpo,
        novaSenha: resetNovaSenha,
      });
      setEmail(emailLimpo);
      setSenha('');
      setForgotStep('done');
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || 'Código inválido ou expirado. Verifique e tente novamente.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex items-center justify-center px-[18px] py-8 font-sans text-ink"
      style={{
        backgroundColor: 'var(--bg)',
        backgroundImage:
          'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '34px 34px',
      }}
    >
      <main className="w-full max-w-[392px]">
        {/* Brand */}
        <div className="flex items-center gap-[9px] mb-7">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-brand grid place-items-center flex-none">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="6" width="4.5" height="9" fill="white" />
              <rect x="6.2" y="1" width="4.5" height="14" fill="white" fillOpacity=".85" />
              <rect x="11.4" y="4" width="3.6" height="11" fill="white" fillOpacity=".7" />
            </svg>
          </div>
          <span className="font-extrabold text-[16px] tracking-[-0.01em] text-ink">CondoEconomy</span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line rounded-[16px] pt-7 px-[26px] pb-6 shadow-[0_1px_2px_rgba(16,17,20,0.04),0_20px_40px_-28px_rgba(16,17,20,0.18)]">
          <h1 className="text-[19px] font-bold m-0 mb-1 tracking-[-0.01em] text-ink">Entrar</h1>
          <p className="text-dim text-[13.5px] m-0 mb-[22px] min-h-[20px] leading-relaxed">
            Acesse sua conta com e-mail e senha.
          </p>

          <form onSubmit={handleLogin} noValidate>
            {error && (
              <div className="bg-bad-soft text-bad p-3 rounded-[10px] text-[12px] font-semibold mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Fields */}
            <div className="mb-[15px]">
              <label htmlFor="login-email" className="block text-[12.5px] font-semibold mb-[6px] text-ink">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                maxLength={255}
                spellCheck={false}
                disabled={loading || lockoutTimer > 0}
                className="w-full px-3 py-[10.5px] rounded-[9px] border border-line bg-canvas text-ink text-[14px] placeholder:text-dim focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1 focus-visible:border-transparent disabled:opacity-60"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-[6px]">
                <label htmlFor="login-senha" className="block text-[12.5px] font-semibold text-ink">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-dim hover:text-ink text-[11px] font-medium flex items-center gap-1 cursor-pointer"
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
                id="login-senha"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                maxLength={128}
                disabled={loading || lockoutTimer > 0}
                className="w-full px-3 py-[10.5px] rounded-[9px] border border-line bg-canvas text-ink text-[14px] placeholder:text-dim focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1 focus-visible:border-transparent disabled:opacity-60"
                required
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mt-[2px] mb-5 text-[12.5px]">
              <label className="flex items-center gap-[7px] text-dim cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-brand w-3.5 h-3.5 rounded-sm" />
                <span>Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError('');
                  setForgotStep('email');
                  setResetCodigo('');
                  setResetNovaSenha('');
                  setResetConfirmacao('');
                  setIsForgotModalOpen(true);
                }}
                className="text-brand font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || lockoutTimer > 0}
              className="w-full p-[11.5px] border-none rounded-[9px] bg-brand text-brand-ink font-bold text-[14.5px] cursor-pointer hover:brightness-108 active:translate-y-[1px] transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
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
            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between font-mono text-[11px] text-dim">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok portaria-live-dot" />
                <span>Sincronização em tempo real ativa</span>
              </span>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="hover:text-ink transition-colors bg-transparent border-0 p-0 cursor-pointer text-left"
              >
                Precisa de ajuda?
              </button>
            </div>
          </form>
        </div>

        {/* Modal: Recuperação de Senha */}
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute top-4 right-4 text-dim hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink m-0">Recuperação de Acesso</h2>
                  <p className="text-xs text-dim m-0">Instruções para redefinição segura</p>
                </div>
              </div>

              {forgotStep === 'done' ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-ok-soft border border-ok/20 text-ok flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-none mt-0.5" />
                    <div className="text-xs leading-relaxed text-ink">
                      <p className="font-semibold text-ok mb-1">Senha redefinida com sucesso!</p>
                      Sua credencial foi atualizada com criptografia BCrypt e todas as sessões anteriores foram encerradas automaticamente.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotStep('email');
                      setResetCodigo('');
                      setResetNovaSenha('');
                      setResetConfirmacao('');
                    }}
                    className="w-full py-2.5 rounded-lg bg-brand text-brand-ink font-bold text-sm hover:bg-brand-hover transition-all cursor-pointer"
                  >
                    Entrar com nova senha
                  </button>
                </div>
              ) : forgotStep === 'reset' ? (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-brand-soft border border-brand/20 text-xs text-ink leading-relaxed">
                    Enviamos um código de <strong>6 dígitos</strong> válido por 15 minutos para <strong>{forgotEmail}</strong> (se a conta estiver ativa).
                  </div>

                  {forgotError && (
                    <div className="p-3 rounded-lg bg-bad-soft border border-bad/20 text-bad text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-none" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ink">Código de 6 dígitos</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={resetCodigo}
                      onChange={(e) => setResetCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-line bg-canvas text-ink text-base font-mono tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-faint"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ink">Nova Senha (mín. 8 caracteres)</label>
                    <input
                      type="password"
                      value={resetNovaSenha}
                      onChange={(e) => setResetNovaSenha(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      maxLength={128}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-line bg-canvas text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-faint"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ink">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={resetConfirmacao}
                      onChange={(e) => setResetConfirmacao(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      maxLength={128}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-line bg-canvas text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-faint"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotError('');
                        setForgotStep('email');
                      }}
                      className="flex-1 py-2.5 rounded-lg border border-line text-dim hover:text-ink font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 rounded-lg bg-brand text-brand-ink font-bold text-xs hover:bg-brand-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Redefinindo...</span>
                        </>
                      ) : (
                        'Confirmar Nova Senha'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className="text-xs text-dim leading-relaxed">
                    Informe seu e-mail cadastrado na administração. Enviaremos um código temporário de 6 dígitos de uso único (expiração em 15 minutos).
                  </p>

                  {forgotError && (
                    <div className="p-3 rounded-lg bg-bad-soft border border-bad/20 text-bad text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-none" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ink">E-mail Cadastrado</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      maxLength={255}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-line bg-canvas text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-faint"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (forgotEmail && EMAIL_SECURITY_REGEX.test(forgotEmail.trim())) {
                          setForgotError('');
                          setForgotStep('reset');
                        } else {
                          setForgotError('Preencha seu e-mail acima antes de informar o código.');
                        }
                      }}
                      className="text-[11px] font-semibold text-brand hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Já tenho um código de 6 dígitos
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="flex-1 py-2.5 rounded-lg border border-line text-dim hover:text-ink font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 rounded-lg bg-brand text-brand-ink font-bold text-xs hover:bg-brand-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        'Enviar Código'
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
            <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-4 right-4 text-dim hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink m-0">Central de Acesso e Ajuda</h2>
                  <p className="text-xs text-dim m-0">Como funciona o acesso ao CondoEconomy</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-dim leading-relaxed">
                <div className="p-3 rounded-xl bg-canvas border border-line">
                  <p className="font-semibold text-ink mb-1 text-[13px]">🏢 Como sou cadastrado no condomínio?</p>
                  <span>
                    O cadastro de moradores, proprietários e colaboradores é realizado diretamente pela <strong>administração do condomínio</strong> ou pelo <strong>síndico</strong>.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-canvas border border-line">
                  <p className="font-semibold text-ink mb-1 text-[13px]">🔑 Primeiro Acesso</p>
                  <span>
                    Após o cadastro pelo síndico, você receberá um e-mail com a senha provisória ou link de primeiro acesso. Ao entrar pela primeira vez, recomendamos a alteração da sua senha no menu Perfil.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-canvas border border-line">
                  <p className="font-semibold text-ink mb-1 text-[13px]">🛡️ Problemas de Acesso?</p>
                  <span>
                    Se você trocou de e-mail ou não tem mais acesso à sua conta, entre em contato com a portaria ou com a administração do seu condomínio com um documento com foto para revalidação cadastral.
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-brand text-brand-ink font-bold text-xs hover:bg-brand-hover transition-all cursor-pointer"
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

