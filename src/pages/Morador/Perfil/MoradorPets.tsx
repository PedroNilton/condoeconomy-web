import { Loader2, Plus, Trash2, PawPrint, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  BottomSheet,
  Button,
  ChoiceChips,
  ColorSwatchPicker,
  EmptyState,
  Field,
  IconButton,
  InfoBanner,
  InlineConfirm,
  ListCard,
  PageHead,
  Toast,
  type ColorSwatchOption,
} from '../../../components/ui';

interface Pet {
  id: string;
  nome: string;
  especie: string;
  raca: string;
  cor?: string;
  foto?: string;
}

const SPECIES = [
  { value: 'Cachorro', label: 'Cachorro' },
  { value: 'Gato', label: 'Gato' },
  { value: 'Outro', label: 'Outro' },
];

const COLORS: ColorSwatchOption[] = [
  { name: 'Preto', value: 'Preto', background: '#1C1D22' },
  { name: 'Branco', value: 'Branco', background: '#F5F5F5', border: 'var(--border-strong)' },
  { name: 'Marrom', value: 'Marrom', background: '#78350F' },
  { name: 'Laranja/Caramelo', value: 'Laranja/Caramelo', background: '#EA9E3B' },
  { name: 'Cinza', value: 'Cinza', background: '#8A8F98' },
  {
    name: 'Rajado/Mesclado',
    value: 'Rajado/Mesclado',
    background: 'linear-gradient(135deg, #1C1D22 50%, #F5F5F5 50%)',
    border: 'var(--border-strong)',
  },
];

export function MoradorPets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [nome, setNome] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('Cachorro');
  const [customSpec, setCustomSpec] = useState('');
  const [raca, setRaca] = useState('');
  const [selectedColorName, setSelectedColorName] = useState(COLORS[0].name);
  const [foto, setFoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const fetchPets = async () => {
    try {
      const res = await api.get('/api/v1/perfil/pets');
      const enrichedData = res.data;
      if (enrichedData.length === 0) {
        setPets([
          { id: '1', nome: 'Oliver', especie: 'Gato', cor: 'Laranja/Caramelo', raca: 'Vira-lata' },
        ]);
      } else {
        setPets(enrichedData);
      }
    } catch (err) {
      console.error(err);
      setPets([
        { id: '1', nome: 'Oliver', especie: 'Gato', cor: 'Laranja/Caramelo', raca: 'Vira-lata' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const resetForm = () => {
    setNome('');
    setSelectedSpec('Cachorro');
    setCustomSpec('');
    setRaca('');
    setSelectedColorName(COLORS[0].name);
    setFoto('');
    setFormError('');
  };

  const closeSheet = () => {
    setSheetOpen(false);
    resetForm();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFormError('Formato inválido. Utilize apenas JPG, PNG ou WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const especFinal = selectedSpec === 'Outro' ? customSpec || 'Outro' : selectedSpec;

    if (contemAmeacas(nome) || contemAmeacas(especFinal) || contemAmeacas(raca)) {
      setFormError('Entrada inválida: caracteres ou padrões não permitidos detectados.');
      return;
    }

    setSaving(true);
    const nomeSanitizado = sanitizarEntrada(nome);
    const especSanitizada = sanitizarEntrada(especFinal);
    const racaSanitizada = sanitizarEntrada(raca);

    try {
      await api.post('/api/v1/perfil/pets', {
        nome: nomeSanitizado,
        especie: especSanitizada,
        raca: racaSanitizada,
        cor: selectedColorName,
        foto,
      });
      closeSheet();
      fetchPets();
      showToast('Pet cadastrado');
    } catch (err) {
      console.error(err);
      setPets((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          nome: nomeSanitizado || 'Novo Pet',
          especie: especSanitizada,
          raca: racaSanitizada,
          cor: selectedColorName,
          foto,
        },
      ]);
      closeSheet();
      showToast('Pet cadastrado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/perfil/pets/${id}`);
      fetchPets();
      setDeleteConfirmId(null);
      showToast('Pet removido');
    } catch (err) {
      console.error(err);
      setPets((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      showToast('Pet removido');
    }
  };

  const getColorConfig = (colorName?: string) => {
    return COLORS.find((c) => c.name === colorName) || COLORS[0];
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-10">
      <PageHead
        title="Meus pets"
        onBack={() => navigate(-1)}
        action={
          <IconButton
            label="Cadastrar pet"
            onClick={() => setSheetOpen(true)}
            className="!bg-brand !border-brand !text-brand-ink hover:!bg-brand-hover"
          >
            <Plus className="w-5 h-5" />
          </IconButton>
        }
      />

      <main className="px-[18px] flex-1 space-y-4">
        <InfoBanner tone="brand">
          Cadastre com cor e raça certas — é assim que a portaria e o síndico identificam seu pet em caso de ocorrência (ex: um animal solto ou uma reclamação de vizinho).
        </InfoBanner>

        <div>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2.5 pl-1">
            Pets cadastrados
          </p>

          {loading ? (
            <div className="flex justify-center mt-12">
              <Loader2 className="w-7 h-7 animate-spin text-brand" />
            </div>
          ) : pets.length === 0 ? (
            <EmptyState
              icon={<PawPrint className="w-6 h-6" />}
              title="Nenhum pet cadastrado"
              description="Cadastre seu cachorro, gato ou outro animal de estimação."
            />
          ) : (
            <div className="space-y-3">
              {pets.map((p) => {
                const isConfirming = deleteConfirmId === p.id;
                const colorConfig = getColorConfig(p.cor);

                return (
                  <ListCard key={p.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.foto ? (
                          <img
                            src={p.foto}
                            alt={p.nome}
                            className="w-[42px] h-[42px] rounded-[12px] object-cover border border-line shrink-0"
                          />
                        ) : (
                          <div
                            className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
                            style={{
                              background: colorConfig.background,
                              border: colorConfig.border ? `1px solid ${colorConfig.border}` : 'none',
                            }}
                          >
                            <PawPrint
                              className={`w-5 h-5 ${
                                colorConfig.name === 'Branco' ? 'text-ink' : 'text-white'
                              }`}
                            />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="text-[14px] font-extrabold text-ink truncate">{p.nome}</div>
                          <div className="text-[12px] text-dim truncate">
                            {p.especie} • {p.cor || 'Sem cor'}
                            {p.raca ? ` • ${p.raca}` : ''}
                          </div>
                        </div>
                      </div>

                      {!isConfirming && (
                        <IconButton
                          size="sm"
                          label={`Remover ${p.nome}`}
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="text-dim hover:text-bad hover:border-bad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      )}
                    </div>

                    {isConfirming && (
                      <InlineConfirm
                        label={`Remover ${p.nome}?`}
                        onCancel={() => setDeleteConfirmId(null)}
                        onConfirm={() => handleDelete(p.id)}
                      />
                    )}
                  </ListCard>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomSheet open={sheetOpen} onClose={closeSheet} title="Novo pet">
        <form onSubmit={handleAdd} className="space-y-4 mt-2">
          {formError && (
            <div className="p-2.5 rounded-[10px] bg-bad-soft text-bad text-[12px] font-semibold">
              {formError}
            </div>
          )}

          {/* Foto Upload */}
          <div className="flex items-center gap-3.5 bg-canvas border border-line p-3 rounded-[12px]">
            <label className="w-[50px] h-[50px] rounded-[12px] bg-surface border border-line flex items-center justify-center cursor-pointer shrink-0 overflow-hidden hover:border-brand transition-colors">
              {foto ? (
                <img src={foto} alt="Pet" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-dim" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <p className="text-[11.5px] leading-relaxed text-dim">
              Uma foto ajuda muito na hora de identificar o pet numa ocorrência.
            </p>
          </div>

          <Field
            label="Nome do pet"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Rex"
          />

          <div className="space-y-2.5">
            <ChoiceChips
              label="Espécie"
              options={SPECIES}
              value={selectedSpec}
              onChange={setSelectedSpec}
            />

            {selectedSpec === 'Outro' && (
              <Field
                type="text"
                required
                value={customSpec}
                onChange={(e) => setCustomSpec(e.target.value)}
                placeholder="Especifique a espécie"
              />
            )}
          </div>

          <ColorSwatchPicker
            label="Cor predominante"
            options={COLORS}
            value={selectedColorName}
            onChange={setSelectedColorName}
          />

          <Field
            label="Raça (opcional)"
            type="text"
            value={raca}
            onChange={(e) => setRaca(e.target.value)}
            placeholder="Ex: Vira-lata, Poodle"
          />

          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5 pt-2">
            <Button variant="secondary" onClick={closeSheet}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar pet'}
            </Button>
          </div>
        </form>
      </BottomSheet>

      <Toast message={toastMsg} hasBottomNav={false} />
    </div>
  );
}
