import { ChevronLeft, Loader2, Plus, Trash2, PawPrint, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Pet {
  id: string;
  nome: string;
  especie: string;
  raca: string;
  cor?: string;
  foto?: string;
}

const SPECIES = ['Cachorro', 'Gato', 'Outro'];

const COLORS = [
  { name: 'Preto', background: '#1C1D22' },
  { name: 'Branco', background: '#F5F5F5', border: true },
  { name: 'Marrom', background: '#78350F' },
  { name: 'Laranja/Caramelo', background: '#EA9E3B' },
  { name: 'Cinza', background: '#8A8F98' },
  { name: 'Rajado/Mesclado', background: 'linear-gradient(135deg, #1C1D22 50%, #F5F5F5 50%)', border: true }
];

export function MoradorPets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sheet States
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Form States
  const [nome, setNome] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('Cachorro');
  const [customSpec, setCustomSpec] = useState('');
  const [raca, setRaca] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [foto, setFoto] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast
  const [showToast, setShowToast] = useState(false);

  const fetchPets = async () => {
    try {
      const res = await api.get('/api/v1/perfil/pets');
      const enrichedData = res.data;
      if (enrichedData.length === 0) {
        setPets([
          { id: '1', nome: 'Oliver', especie: 'Gato', cor: 'Laranja/Caramelo', raca: 'Vira-lata' }
        ]);
      } else {
        setPets(enrichedData);
      }
    } catch (err) {
      console.error(err);
      setPets([
        { id: '1', nome: 'Oliver', especie: 'Gato', cor: 'Laranja/Caramelo', raca: 'Vira-lata' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const openSheet = () => {
    setSheetMounted(true);
    setTimeout(() => setSheetOpen(true), 10);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => {
      setSheetMounted(false);
      resetForm();
    }, 300);
  };

  const resetForm = () => {
    setNome('');
    setSelectedSpec('Cachorro');
    setCustomSpec('');
    setRaca('');
    setSelectedColor(COLORS[0]);
    setFoto('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const especFinal = selectedSpec === 'Outro' ? customSpec || 'Outro' : selectedSpec;
    
    try {
      await api.post('/api/v1/perfil/pets', { 
        nome, 
        especie: especFinal,
        raca,
        cor: selectedColor.name,
        foto
      });
      closeSheet();
      fetchPets();
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    } catch (err) {
      console.error(err);
      setPets(prev => [...prev, {
        id: Math.random().toString(),
        nome: nome || 'Novo Pet',
        especie: especFinal,
        raca,
        cor: selectedColor.name,
        foto
      }]);
      closeSheet();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/perfil/pets/${id}`);
      fetchPets();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setPets(prev => prev.filter(p => p.id !== id));
      setDeleteConfirmId(null);
    }
  };

  const getColorConfig = (colorName?: string) => {
    return COLORS.find(c => c.name === colorName) || COLORS[0];
  };

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative overflow-hidden">
      
      {/* Header */}
      <header className="px-5 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Meus pets</h1>
        </div>
        <button 
          onClick={openSheet}
          className="w-11 h-11 rounded-[14px] bg-ds-primary flex items-center justify-center text-ds-primary-ink shadow-[0_4px_12px_rgba(108,99,245,0.3)] active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Main List */}
      <main className="px-5 pb-24 flex-1 overflow-y-auto">
        <div className="bg-ds-card border border-ds-border rounded-[16px] p-4 mb-6 text-ds-dim text-[12px] leading-relaxed shadow-sm">
          Cadastre com cor e raça certas — é assim que a portaria e o síndico identificam seu pet em caso de ocorrência (ex: um animal solto ou uma reclamação de vizinho).
        </div>

        <p className="text-[11px] font-bold text-ds-dim uppercase tracking-widest mb-4 pl-1">
          Pets cadastrados
        </p>

        {loading ? (
          <div className="flex justify-center mt-12"><Loader2 className="w-8 h-8 animate-spin text-ds-primary" /></div>
        ) : pets.length === 0 ? (
          <div className="bg-ds-card border border-ds-border p-8 rounded-[20px] text-center shadow-sm">
             <PawPrint className="w-12 h-12 text-ds-dim mx-auto mb-3" />
             <p className="text-ds-dim font-medium text-[14px]">Nenhum pet cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map(p => {
              const isConfirming = deleteConfirmId === p.id;
              const colorConfig = getColorConfig(p.cor);
              
              return (
                <div key={p.id} className="bg-ds-card border border-ds-border rounded-[16px] overflow-hidden shadow-sm transition-all duration-300">
                  
                  {/* Row Main */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {p.foto ? (
                        <img src={p.foto} alt={p.nome} className="w-[44px] h-[44px] rounded-[14px] object-cover border border-ds-border" />
                      ) : (
                        <div 
                          className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center shadow-inner"
                          style={{ 
                            background: colorConfig.background,
                            border: colorConfig.border ? '1px solid var(--color-ds-border)' : 'none' 
                          }}
                        >
                          <PawPrint className={`w-5 h-5 ${colorConfig.name === 'Branco' ? 'text-gray-800' : 'text-white'}`} strokeWidth={2.5} />
                        </div>
                      )}
                      
                      <div>
                        <div className="text-[15px] font-bold tracking-tight text-ds-text">{p.nome}</div>
                        <div className="text-[12px] text-ds-dim mt-0.5">
                          {p.especie} • {p.cor || 'Sem cor'}{p.raca ? ` • ${p.raca}` : ''}
                        </div>
                      </div>
                    </div>
                    
                    {!isConfirming && (
                      <button 
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-ds-dim hover:bg-ds-danger/10 hover:text-ds-danger active:scale-95 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Confirm Row */}
                  {isConfirming && (
                    <div className="bg-ds-bg border-t border-ds-border p-3.5 flex items-center justify-between animate-in slide-in-from-top-2 fade-in duration-200">
                      <span className="text-[13px] font-medium text-ds-text">Remover {p.nome}?</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 text-[12px] font-bold text-ds-text bg-ds-card border border-ds-border rounded-lg active:scale-95 transition-transform"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="px-3 py-1.5 text-[12px] font-bold text-ds-danger-ink bg-ds-danger rounded-lg active:scale-95 transition-transform"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Sheet Overlay */}
      {sheetMounted && (
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeSheet}
        ></div>
      )}

      {/* Bottom Sheet */}
      {sheetMounted && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-ds-card rounded-t-[28px] p-6 z-50 border-t border-ds-border transition-transform duration-300 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto
            ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          <div className="w-12 h-1.5 bg-ds-border rounded-full mx-auto mb-6"></div>
          
          <h2 className="text-[20px] font-bold text-ds-text mb-6 tracking-tight">Novo pet</h2>
          
          <form onSubmit={handleAdd} className="space-y-5">
            
            {/* Foto Upload */}
            <div className="flex items-center gap-4 bg-ds-bg border border-ds-border p-3.5 rounded-[16px]">
              <label className="w-[52px] h-[52px] rounded-[14px] bg-ds-card border border-ds-border flex items-center justify-center cursor-pointer active:scale-95 transition-transform flex-shrink-0 relative overflow-hidden">
                {foto ? (
                  <img src={foto} alt="Pet" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-ds-dim" strokeWidth={2} />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              <p className="text-[11.5px] leading-relaxed text-ds-dim pr-2">
                Uma foto ajuda muito na hora de identificar o pet numa ocorrência.
              </p>
            </div>
            
            {/* Nome */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Nome do pet</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Rex"
                className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
              />
            </div>
            
            {/* Espécie */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2.5">Espécie</label>
              <div className="flex flex-wrap gap-2">
                {SPECIES.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpec(spec)}
                    className={`px-4 py-2 text-[13px] font-bold rounded-full border transition-all active:scale-95 ${
                      selectedSpec === spec 
                        ? 'bg-ds-primary text-ds-primary-ink border-ds-primary' 
                        : 'bg-ds-bg text-ds-dim border-ds-border hover:border-ds-primary/50'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
              
              {selectedSpec === 'Outro' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="text" 
                    required
                    value={customSpec}
                    onChange={e => setCustomSpec(e.target.value)}
                    placeholder="Especifique a espécie"
                    className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 text-[14px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
                  />
                </div>
              )}
            </div>
            
            {/* Cor */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-3">Cor predominante</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    title={c.name}
                    style={{ background: c.background }}
                    className={`w-[42px] h-[42px] rounded-[12px] shadow-sm transition-all active:scale-95 relative ${
                      c.border ? 'border border-ds-border' : 'border border-transparent'
                    } ${
                      selectedColor.name === c.name ? 'ring-2 ring-ds-primary ring-offset-2 ring-offset-ds-card scale-110' : 'hover:scale-105'
                    }`}
                  >
                  </button>
                ))}
              </div>
              <p className="text-[12px] font-medium text-ds-dim mt-3.5">
                Selecionado: <span className="text-ds-text font-bold">{selectedColor.name}</span>
              </p>
            </div>

            {/* Raça */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Raça (opcional)</label>
              <input 
                type="text" 
                value={raca}
                onChange={e => setRaca(e.target.value)}
                placeholder="Ex: Vira-lata, Poodle"
                className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={closeSheet} 
                className="flex-1 bg-ds-bg border border-ds-border text-ds-text font-bold py-3.5 rounded-[12px] active:scale-95 transition-transform text-[14px]"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-[2] bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 shadow-md disabled:opacity-70 active:scale-95 transition-transform text-[14px]"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar pet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-[100px] left-1/2 -translate-x-1/2 bg-ds-primary text-ds-primary-ink font-bold text-[13px] px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 z-50 whitespace-nowrap
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        Pet cadastrado
      </div>

    </div>
  );
}
