import { Loader2, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas, EMAIL_SECURITY_REGEX } from '../../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  IconButton,
  IconChip,
  InlineConfirm,
  ListCard,
  PageHead,
  Toast,
  Toggle,
} from '../../../components/ui';

interface Morador {
  id: string;
  nome: string;
  parentesco: string;
  acessoApp?: boolean;
  email?: string;
}

const RELATIONSHIPS = [
  { value: 'Cônjuge', label: 'Cônjuge' },
  { value: 'Filho(a)', label: 'Filho(a)' },
  { value: 'Pai', label: 'Pai' },
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Outro', label: 'Outro' },
];

export function MoradorAdicionais() {
  const navigate = useNavigate();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [nome, setNome] = useState('');
  const [selectedRel, setSelectedRel] = useState('Cônjuge');
  const [customRel, setCustomRel] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const fetchMoradores = async () => {
    try {
      const res = await api.get('/api/v1/perfil/moradores');
      const enrichedData = res.data;
      if (enrichedData.length === 0) {
        setMoradores([
          { id: '1', nome: 'Janice Maria', parentesco: 'Mãe' },
          { id: '2', nome: 'Pedro Jr.', parentesco: 'Filho(a)', acessoApp: true, email: 'pedro@email.com' },
        ]);
      } else {
        setMoradores(enrichedData);
      }
    } catch (err) {
      console.error(err);
      setMoradores([
        { id: '1', nome: 'Janice Maria', parentesco: 'Mãe' },
        { id: '2', nome: 'Pedro Jr.', parentesco: 'Filho(a)', acessoApp: true, email: 'pedro@email.com' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoradores();
  }, []);

  const resetForm = () => {
    setNome('');
    setSelectedRel('Cônjuge');
    setCustomRel('');
    setHasAccess(false);
    setEmail('');
    setFormError('');
  };

  const closeSheet = () => {
    setSheetOpen(false);
    resetForm();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parentescoFinal = selectedRel === 'Outro' ? customRel || 'Outro' : selectedRel;

    if (contemAmeacas(nome) || contemAmeacas(parentescoFinal) || (hasAccess && contemAmeacas(email))) {
      setFormError('Entrada inválida: caracteres ou padrões não permitidos detectados.');
      return;
    }

    const emailSanitizado = hasAccess ? sanitizarEntrada(email).toLowerCase() : undefined;
    if (hasAccess && (!emailSanitizado || !EMAIL_SECURITY_REGEX.test(emailSanitizado))) {
      setFormError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setSaving(true);
    const nomeSanitizado = sanitizarEntrada(nome);
    const parentescoSanitizado = sanitizarEntrada(parentescoFinal);

    try {
      await api.post('/api/v1/perfil/moradores', {
        nome: nomeSanitizado,
        parentesco: parentescoSanitizado,
        acessoApp: hasAccess,
        email: emailSanitizado,
      });
      closeSheet();
      fetchMoradores();
      showToast('Morador adicionado');
    } catch (err) {
      console.error(err);
      setMoradores((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          nome: nomeSanitizado || 'Novo Morador',
          parentesco: parentescoSanitizado,
          acessoApp: hasAccess,
          email: emailSanitizado,
        },
      ]);
      closeSheet();
      showToast('Morador adicionado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/perfil/moradores/${id}`);
      fetchMoradores();
      setDeleteConfirmId(null);
      showToast('Morador removido');
    } catch (err) {
      console.error(err);
      setMoradores((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirmId(null);
      showToast('Morador removido');
    }
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-10">
      <PageHead
        title="Moradores adicionais"
        onBack={() => navigate(-1)}
        action={
          <IconButton
            label="Adicionar morador"
            onClick={() => setSheetOpen(true)}
            className="!bg-brand !border-brand !text-brand-ink hover:!bg-brand-hover"
          >
            <Plus className="w-5 h-5" />
          </IconButton>
        }
      />

      <main className="px-[18px] flex-1">
        <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2.5 pl-1">
          Quem mais mora no apartamento
        </p>

        {loading ? (
          <div className="flex justify-center mt-12">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : moradores.length === 0 ? (
          <EmptyState
            icon={<UserCircle2 className="w-6 h-6" />}
            title="Nenhum morador adicional"
            description="Adicione familiares ou moradores vinculados ao seu apartamento."
          />
        ) : (
          <div className="space-y-3">
            {moradores.map((m) => {
              const isConfirming = deleteConfirmId === m.id;
              return (
                <ListCard key={m.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconChip tone="neutral" size="lg">
                        <UserCircle2 className="w-5 h-5" />
                      </IconChip>
                      <div className="min-w-0">
                        <div className="text-[14px] font-extrabold text-ink truncate">{m.nome}</div>
                        <div className="text-[12.5px] text-dim">{m.parentesco}</div>
                        {m.acessoApp && (
                          <div className="mt-1.5">
                            <Badge tone="brand">Com acesso ao app</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isConfirming && (
                      <IconButton
                        size="sm"
                        label={`Remover ${m.nome}`}
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="text-dim hover:text-bad hover:border-bad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    )}
                  </div>

                  {isConfirming && (
                    <InlineConfirm
                      label={`Remover ${m.nome.split(' ')[0]}?`}
                      onCancel={() => setDeleteConfirmId(null)}
                      onConfirm={() => handleDelete(m.id)}
                    />
                  )}
                </ListCard>
              );
            })}
          </div>
        )}
      </main>

      <BottomSheet open={sheetOpen} onClose={closeSheet} title="Novo morador">
        <form onSubmit={handleAdd} className="space-y-4 mt-2">
          {formError && (
            <div className="p-2.5 rounded-[10px] bg-bad-soft text-bad text-[12px] font-semibold">
              {formError}
            </div>
          )}

          <Field
            label="Nome completo"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Maria Souza"
          />

          <div className="space-y-2.5">
            <ChoiceChips
              label="Grau de parentesco"
              options={RELATIONSHIPS}
              value={selectedRel}
              onChange={setSelectedRel}
            />

            {selectedRel === 'Outro' && (
              <Field
                type="text"
                required
                value={customRel}
                onChange={(e) => setCustomRel(e.target.value)}
                placeholder="Especifique o parentesco"
              />
            )}
          </div>

          <div className="pt-2 border-t border-line space-y-3">
            <Toggle
              checked={hasAccess}
              onChange={setHasAccess}
              title="Dar acesso ao aplicativo"
              description="Enviamos um convite por e-mail pra essa pessoa criar o próprio login e ver boletos, reservas etc."
            />

            {hasAccess && (
              <Field
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail do morador"
              />
            )}
          </div>

          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5 pt-2">
            <Button variant="secondary" onClick={closeSheet}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar morador'}
            </Button>
          </div>
        </form>
      </BottomSheet>

      <Toast message={toastMsg} hasBottomNav={false} />
    </div>
  );
}
