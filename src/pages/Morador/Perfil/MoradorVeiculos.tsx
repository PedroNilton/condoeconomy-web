import { useState, useEffect } from 'react';
import { Car, Plus, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  Button,
  ColorSwatchPicker,
  EmptyState,
  Field,
  IconButton,
  IconChip,
  InlineConfirm,
  ListCard,
  PageHead,
  Toast,
  type ColorSwatchOption,
} from '../../../components/ui';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  marca?: string;
  vaga?: string;
}

const PRESET_COLORS: ColorSwatchOption[] = [
  { name: 'Prata', value: 'Prata', background: '#E5E7EB', border: 'var(--border-strong)' },
  { name: 'Preto', value: 'Preto', background: '#171717' },
  { name: 'Branco', value: 'Branco', background: '#FFFFFF', border: 'var(--border-strong)' },
  { name: 'Cinza', value: 'Cinza', background: '#6B7280' },
  { name: 'Vermelho', value: 'Vermelho', background: '#DC2626' },
  { name: 'Azul', value: 'Azul', background: '#2563EB' },
  { name: 'Verde Musgo', value: 'Verde Musgo', background: '#4B5320' },
  { name: 'Verde', value: 'Verde', background: '#16A34A' },
  { name: 'Amarelo', value: 'Amarelo', background: '#EAB308' },
  { name: 'Laranja', value: 'Laranja', background: '#EA580C' },
  { name: 'Marrom', value: 'Marrom', background: '#78350F' },
  { name: 'Roxo', value: 'Roxo', background: '#7C3AED' },
];

export function MoradorVeiculos() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('Prata');
  const [vaga, setVaga] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  useEffect(() => {
    if (!showForm) {
      loadVeiculos();
    }
  }, [showForm]);

  const loadVeiculos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/v1/perfil/veiculos');

      const enrichedData: Veiculo[] = (Array.isArray(data) ? data : []).map((v: any) => ({
        ...v,
        marca: v.marca || (v.modelo?.includes(' ') ? v.modelo.split(' ')[0] : ''),
        modelo: v.modelo?.includes(' ') ? v.modelo.substring(v.modelo.indexOf(' ') + 1) : v.modelo,
      }));

      setVeiculos(enrichedData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/perfil/veiculos/${id}`);
      setDeleteConfirmId(null);
      await loadVeiculos();
      showToast('Veículo removido');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover veículo.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (contemAmeacas(placa) || contemAmeacas(marca) || contemAmeacas(modelo) || contemAmeacas(vaga)) {
      setFormError('Entrada inválida: caracteres ou padrões não permitidos detectados.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        placa: sanitizarEntrada(placa).toUpperCase(),
        modelo: sanitizarEntrada(`${marca} ${modelo}`),
        cor: sanitizarEntrada(selectedColor),
        vaga: sanitizarEntrada(vaga),
      };

      await api.post('/api/v1/perfil/veiculos', payload);

      setPlaca('');
      setMarca('');
      setModelo('');
      setSelectedColor('Prata');
      setVaga('');
      setShowForm(false);
      showToast('Veículo cadastrado com sucesso!');
    } catch {
      setFormError('Erro ao cadastrar veículo. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return (
      <div className="bg-canvas min-h-full text-ink pb-8">
        <PageHead title="Cadastrar veículo" onBack={() => setShowForm(false)} />

        <main className="px-[18px] mt-2">
          <form onSubmit={handleAdd} className="space-y-4">
            {formError && (
              <div className="p-2.5 rounded-[10px] bg-bad-soft text-bad text-[12px] font-semibold">
                {formError}
              </div>
            )}

            <Field
              label="Placa"
              type="text"
              required
              mono
              surface="surface"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-1D23"
              maxLength={8}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Marca"
                type="text"
                required
                surface="surface"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Fiat"
              />
              <Field
                label="Modelo"
                type="text"
                required
                surface="surface"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Argo"
              />
            </div>

            <ColorSwatchPicker
              label="Cor"
              options={PRESET_COLORS}
              value={selectedColor}
              onChange={setSelectedColor}
            />

            <Field
              label="Vaga na garagem (Opcional)"
              type="text"
              mono
              surface="surface"
              value={vaga}
              onChange={(e) => setVaga(e.target.value)}
              placeholder="Ex: G-14"
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar veículo'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-full text-ink pb-10">
      <PageHead
        eyebrow="Garagem"
        title="Veículos"
        onBack={() => navigate('/app/perfil')}
        action={
          <IconButton
            label="Cadastrar veículo"
            onClick={() => setShowForm(true)}
            className="!bg-brand !border-brand !text-brand-ink hover:!bg-brand-hover"
          >
            <Plus className="w-5 h-5" />
          </IconButton>
        }
      />

      <main className="px-[18px]">
        <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2.5 pl-1">
          Meus veículos cadastrados
        </p>

        {loading ? (
          <div className="flex justify-center mt-12">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : veiculos.length === 0 ? (
          <EmptyState
            icon={<Car className="w-6 h-6" />}
            title="Nenhum veículo cadastrado"
            description="Nenhum veículo cadastrado na sua unidade. Toque em + para registrar."
          />
        ) : (
          <div className="space-y-3 pb-6">
            {veiculos.map((v) => {
              const isConfirming = deleteConfirmId === v.id;
              return (
                <ListCard key={v.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconChip tone="neutral" size="lg">
                        <Car className="w-5 h-5" />
                      </IconChip>
                      <div className="min-w-0">
                        <div className="font-mono text-[14.5px] font-extrabold text-ink tracking-wide">
                          {v.placa}
                        </div>
                        <div className="text-[12.5px] text-dim capitalize truncate">
                          {v.marca ? `${v.marca} ${v.modelo}` : v.modelo} • {v.cor}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {v.vaga && <Badge tone="brand">Vaga {v.vaga}</Badge>}
                      {!isConfirming && (
                        <IconButton
                          size="sm"
                          label={`Remover ${v.placa}`}
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="text-dim hover:text-bad hover:border-bad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      )}
                    </div>
                  </div>

                  {isConfirming && (
                    <InlineConfirm
                      label={`Remover placa ${v.placa}?`}
                      onCancel={() => setDeleteConfirmId(null)}
                      onConfirm={() => handleDelete(v.id)}
                    />
                  )}
                </ListCard>
              );
            })}
          </div>
        )}
      </main>

      <Toast message={toastMsg} />
    </div>
  );
}
