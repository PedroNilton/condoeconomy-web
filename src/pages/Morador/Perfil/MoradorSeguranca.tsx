import {
  Key,
  EyeOff,
  Eye,
  Smartphone,
  Monitor,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  Button,
  IconChip,
  InfoBanner,
  ListCard,
  PageHead,
  Toast,
} from '../../../components/ui';

interface EventoAuditoria {
  id: string;
  evento: string;
  severidade: 'INFO' | 'ALERTA' | 'CRITICO';
  ipOrigem: string;
  detalhes: string;
  criadoEm: string;
}

export function MoradorSeguranca() {
  const navigate = useNavigate();

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');

  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingEncerrar, setLoadingEncerrar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [outrasSessoesEncerradas, setOutrasSessoesEncerradas] = useState(false);
  const [historico, setHistorico] = useState<EventoAuditoria[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const carregarHistorico = async () => {
    try {
      const res = await api.get('/api/v1/perfil/seguranca/historico');
      if (Array.isArray(res.data)) {
        setHistorico(res.data);
      }
    } catch {
      // Silencioso caso ainda não haja eventos
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const strength = useMemo(() => {
    let score = 0;
    if (nova.length >= 8) score++;
    if (/[A-Z]/.test(nova) && /[0-9]/.test(nova)) score++;
    if (/[^A-Za-z0-9]/.test(nova) && nova.length >= 10) score++;
    return score;
  }, [nova]);

  const strengthColors = ['bg-line', 'bg-bad', 'bg-warn', 'bg-ok'];
  const getBarColor = (index: number) => {
    if (nova.length === 0) return 'bg-line';
    if (index < strength) {
      return strengthColors[Math.max(strength, 1)];
    }
    return 'bg-line';
  };

  const strengthText = useMemo(() => {
    if (nova.length === 0) return 'Digite a nova senha';
    if (strength <= 1) return 'Senha fraca';
    if (strength === 2) return 'Senha média';
    return 'Senha forte';
  }, [strength, nova]);

  const mismatch = confirma.length > 0 && confirma !== nova;

  const handleUpdate = async () => {
    setErrorMsg(null);
    if (!atual.trim()) {
      setErrorMsg('Informe sua senha atual para re-autenticação.');
      return;
    }
    if (nova.length < 8) {
      setErrorMsg('A nova senha deve possuir no mínimo 8 caracteres.');
      return;
    }
    if (mismatch) {
      setErrorMsg('A confirmação não coincide com a nova senha.');
      return;
    }
    if (atual === nova) {
      setErrorMsg('A nova senha deve ser diferente da senha atual.');
      return;
    }
    if (contemAmeacas(atual) || contemAmeacas(nova)) {
      setErrorMsg('Entrada com formato ou caracteres potencialmente perigosos.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/api/v1/perfil/seguranca/alterar-senha', {
        senhaAtual: sanitizarEntrada(atual),
        novaSenha: sanitizarEntrada(nova),
      });

      if (res.data?.token) {
        localStorage.setItem('@HabitOS:token', res.data.token);
      }

      showToast(res.data?.message || 'Senha atualizada com sucesso!');
      setAtual('');
      setNova('');
      setConfirma('');
      setOutrasSessoesEncerradas(true);
      carregarHistorico();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao atualizar senha. Verifique sua senha atual.';
      setErrorMsg(msg);
      carregarHistorico();
    } finally {
      setLoading(false);
    }
  };

  const handleEncerrarSessoes = async () => {
    setErrorMsg(null);
    setLoadingEncerrar(true);
    try {
      const res = await api.post('/api/v1/perfil/seguranca/encerrar-sessoes');
      if (res.data?.token) {
        localStorage.setItem('@HabitOS:token', res.data.token);
      }
      showToast(res.data?.message || 'Todas as outras sessões foram encerradas com sucesso.');
      setOutrasSessoesEncerradas(true);
      carregarHistorico();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao encerrar outras sessões.';
      setErrorMsg(msg);
    } finally {
      setLoadingEncerrar(false);
    }
  };

  const formatarEvento = (evento: string) => {
    const mapa: Record<string, string> = {
      LOGIN_SUCESSO: 'Login autenticado',
      LOGIN_FALHA: 'Tentativa de login negada',
      SENHA_ALTERADA: 'Senha redefinida (Step-Up Auth)',
      SESSOES_REVOGADAS_KILL_SWITCH: 'Kill Switch de sessões acionado',
      FALHA_STEP_UP_AUTH: 'Falha na confirmação de senha',
      DADOS_PESSOAIS_ATUALIZADOS: 'Dados pessoais atualizados',
      EXPORTACAO_DADOS_LGPD: 'Relatório LGPD exportado',
    };
    return mapa[evento] || evento;
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-10">
      <PageHead title="Segurança e senha" onBack={() => navigate(-1)} />

      <main className="px-[18px] flex-1 space-y-6">
        <InfoBanner tone="brand">
          Sua senha nunca é armazenada em texto puro (usamos hash) e toda a conexão com o servidor é criptografada via HTTPS. Nunca compartilhe sua senha com terceiros ou com a portaria.
        </InfoBanner>

        {/* Alterar Senha */}
        <section>
          <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-ink mb-3">
            <Key className="w-4 h-4 text-dim" />
            <span>Alterar senha</span>
          </h2>

          <div className="space-y-3.5">
            {errorMsg && <InfoBanner tone="bad">{errorMsg}</InfoBanner>}

            {/* Senha Atual */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-1.5">
                Senha atual
              </label>
              <div className="relative">
                <input
                  type={showAtual ? 'text' : 'password'}
                  value={atual}
                  onChange={(e) => setAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full h-[46px] px-[13px] pr-11 rounded-[10px] border border-line bg-surface text-ink text-[14px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowAtual(!showAtual)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-dim hover:text-ink cursor-pointer"
                >
                  {showAtual ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-1.5">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={showNova ? 'text' : 'password'}
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full h-[46px] px-[13px] pr-11 rounded-[10px] border border-line bg-surface text-ink text-[14px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowNova(!showNova)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-dim hover:text-ink cursor-pointer"
                >
                  {showNova ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              <div className="flex gap-1 mt-2">
                <div className={`h-1 flex-1 rounded-full transition-colors ${getBarColor(0)}`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${getBarColor(1)}`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${getBarColor(2)}`} />
              </div>
              <div className="text-[11.5px] text-dim mt-1.5">{strengthText}</div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-1.5">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  type={showConfirma ? 'text' : 'password'}
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={`w-full h-[46px] px-[13px] pr-11 rounded-[10px] border ${
                    mismatch ? 'border-bad' : 'border-line'
                  } bg-surface text-ink text-[14px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirma(!showConfirma)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-dim hover:text-ink cursor-pointer"
                >
                  {showConfirma ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {mismatch && (
                <div className="text-[11.5px] text-bad mt-1.5">As senhas não coincidem.</div>
              )}
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleUpdate}
              disabled={loading || mismatch || !atual || nova.length < 8}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar senha'}
            </Button>
          </div>
        </section>

        {/* Sessões ativas */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-bad">
            <AlertTriangle className="w-4 h-4" />
            <span>Sessões ativas</span>
          </h2>

          <ListCard>
            <div className="flex items-center gap-3">
              <IconChip tone="neutral" size="sm">
                <Smartphone className="w-4 h-4" />
              </IconChip>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-ink truncate">Dispositivo Atual</div>
                <div className="text-[11.5px] text-dim">Sessão ativa agora</div>
              </div>
              <Badge tone="ok">Este dispositivo</Badge>
            </div>
          </ListCard>

          {outrasSessoesEncerradas ? (
            <InfoBanner tone="ok">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Nenhuma outra sessão ativa. Apenas este dispositivo está autenticado.</span>
              </div>
            </InfoBanner>
          ) : (
            <ListCard>
              <div className="flex items-center gap-3">
                <IconChip tone="neutral" size="sm">
                  <Monitor className="w-4 h-4" />
                </IconChip>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">
                    Outros navegadores ou apps
                  </div>
                  <div className="text-[11.5px] text-dim">Possíveis sessões abertas</div>
                </div>
                <Button variant="mini" onClick={handleEncerrarSessoes} disabled={loadingEncerrar}>
                  Encerrar
                </Button>
              </div>
            </ListCard>
          )}

          <Button
            variant="ghost-danger"
            fullWidth
            onClick={handleEncerrarSessoes}
            disabled={loadingEncerrar || outrasSessoesEncerradas}
          >
            {loadingEncerrar ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Encerrar todas as outras sessões'
            )}
          </Button>
          <p className="text-[11.5px] text-dim leading-relaxed text-center">
            Ao encerrar outras sessões, o token de autenticação de todos os outros dispositivos é invalidado instantaneamente pelo servidor.
          </p>
        </section>

        {/* Trilha de Auditoria Forense */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
            <History className="w-4 h-4 text-brand" />
            <span>Registro de atividades de segurança</span>
          </h2>

          {historico.length === 0 ? (
            <ListCard>
              <p className="text-[12px] text-dim text-center py-2">
                Nenhuma atividade crítica registrada recentemente nesta conta.
              </p>
            </ListCard>
          ) : (
            <div className="space-y-2.5">
              {historico.slice(0, 6).map((item) => (
                <ListCard key={item.id}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[12.5px] font-bold text-ink">
                      {formatarEvento(item.evento)}
                    </span>
                    <Badge
                      tone={
                        item.severidade === 'CRITICO'
                          ? 'bad'
                          : item.severidade === 'ALERTA'
                          ? 'warn'
                          : 'ok'
                      }
                    >
                      {item.severidade}
                    </Badge>
                  </div>
                  <p className="text-[11.5px] text-dim leading-snug">{item.detalhes}</p>
                  <div className="flex items-center justify-between text-[10.5px] text-faint font-mono mt-2 pt-1.5 border-t border-line">
                    <span>IP: {item.ipOrigem}</span>
                    <span>{new Date(item.criadoEm).toLocaleString('pt-BR')}</span>
                  </div>
                </ListCard>
              ))}
            </div>
          )}
        </section>
      </main>

      <Toast message={toastMsg} hasBottomNav={false} />
    </div>
  );
}
