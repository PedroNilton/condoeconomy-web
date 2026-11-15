import { Package, FileText, Calendar, Send, Mail, AlertTriangle, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Button, IconChip, InfoBanner, PageHead, Toast } from '../../../components/ui';

function SwitchCell({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`w-[38px] h-[22px] rounded-full p-[2.5px] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-brand ${
        checked ? 'bg-brand' : 'bg-line'
      }`}
    >
      <span
        className={`block w-[17px] h-[17px] rounded-full bg-white transition-transform duration-150 ${
          checked ? 'translate-x-[16px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  useEffect(() => {
    api
      .get('/api/v1/perfil/notificacoes')
      .then((res) => {
        if (res.data) {
          setPrefs(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.put('/api/v1/perfil/notificacoes', prefs);
      if (res.data) {
        setPrefs(res.data);
      }
      showToast('Preferências salvas no servidor');
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      showToast('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-8">
      <PageHead
        title="Configurar notificações"
        subtitle="Escolha como quer ser avisado — suas preferências ficam sincronizadas na sua conta."
        onBack={() => navigate(-1)}
      />

      <main className="px-[18px] flex-1 space-y-5">
        {loading ? (
          <div className="bg-surface border border-line rounded-[14px] p-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-[14px] overflow-hidden divide-y divide-line">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3 text-[10.5px] font-bold text-faint uppercase tracking-[0.06em]">
              <span>Tipo de aviso</span>
              <span className="text-center">Push</span>
              <span className="text-center">E-mail</span>
            </div>

            {/* Encomendas */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3">
              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                <IconChip tone="neutral" size="sm">
                  <Package className="w-4 h-4" />
                </IconChip>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">Encomendas</div>
                  <div className="text-[11px] text-dim truncate">Chegou algo na portaria</div>
                </div>
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.encomendas_push}
                  onChange={() => toggle('encomendas_push')}
                  label="Push para encomendas"
                />
              </div>
              <div className="flex justify-center">
                <span className="text-[13px] text-faint">—</span>
              </div>
            </div>

            {/* Boletos */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3">
              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                <IconChip tone="neutral" size="sm">
                  <FileText className="w-4 h-4" />
                </IconChip>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">Boletos</div>
                  <div className="text-[11px] text-dim truncate">Emissão e vencimento próximo</div>
                </div>
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.boletos_push}
                  onChange={() => toggle('boletos_push')}
                  label="Push para boletos"
                />
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.boletos_email}
                  onChange={() => toggle('boletos_email')}
                  label="E-mail para boletos"
                />
              </div>
            </div>

            {/* Reservas */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3">
              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                <IconChip tone="neutral" size="sm">
                  <Calendar className="w-4 h-4" />
                </IconChip>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">Reservas</div>
                  <div className="text-[11px] text-dim truncate">Aprovação ou recusa do síndico</div>
                </div>
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.reservas_push}
                  onChange={() => toggle('reservas_push')}
                  label="Push para reservas"
                />
              </div>
              <div className="flex justify-center">
                <span className="text-[13px] text-faint">—</span>
              </div>
            </div>

            {/* Comunicados */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3">
              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                <IconChip tone="neutral" size="sm">
                  <Send className="w-4 h-4" />
                </IconChip>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">Comunicados do síndico</div>
                  <div className="text-[11px] text-dim truncate">Avisos oficiais do condomínio</div>
                </div>
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.comunicados_push}
                  onChange={() => toggle('comunicados_push')}
                  label="Push para comunicados"
                />
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.comunicados_email}
                  onChange={() => toggle('comunicados_email')}
                  label="E-mail para comunicados"
                />
              </div>
            </div>

            {/* Resumo semanal */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3">
              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                <IconChip tone="neutral" size="sm">
                  <Mail className="w-4 h-4" />
                </IconChip>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">Resumo semanal</div>
                  <div className="text-[11px] text-dim truncate">Um e-mail por semana com tudo</div>
                </div>
              </div>
              <div className="flex justify-center">
                <span className="text-[13px] text-faint">—</span>
              </div>
              <div className="flex justify-center">
                <SwitchCell
                  checked={prefs.resumo_email}
                  onChange={() => toggle('resumo_email')}
                  label="E-mail para resumo semanal"
                />
              </div>
            </div>

            {/* Emergência */}
            <div className="grid grid-cols-[1fr_52px_52px] items-center px-3.5 py-3">
              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                <IconChip tone="warn" size="sm">
                  <AlertTriangle className="w-4 h-4" />
                </IconChip>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">Emergência</div>
                  <div className="text-[11px] text-dim truncate">Pânico e avisos urgentes</div>
                </div>
              </div>
              <div className="flex justify-center">
                <Lock className="w-4 h-4 text-faint" />
              </div>
              <div className="flex justify-center">
                <Lock className="w-4 h-4 text-faint" />
              </div>
            </div>
          </div>
        )}

        <InfoBanner tone="warn">
          Avisos de emergência (pânico, comunicados urgentes) ficam sempre ativos em todos os canais — não é possível desativar.
        </InfoBanner>

        <Button
          variant="primary"
          fullWidth
          disabled={loading || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar preferências'}
        </Button>
      </main>

      <Toast message={toastMsg} hasBottomNav={false} />
    </div>
  );
}
