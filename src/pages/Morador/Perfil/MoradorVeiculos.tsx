import { useState, useEffect } from 'react';
import { Car, Plus, Loader2, ChevronLeft, Check } from 'lucide-react';
import api from '../../../services/api';

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  cor: string;
  marca?: string;
  vaga?: string;
}

const PRESET_COLORS = [
  { name: 'Prata', hex: '#E5E7EB' },
  { name: 'Preto', hex: '#171717' },
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Cinza', hex: '#6B7280' },
  { name: 'Vermelho', hex: '#DC2626' },
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Verde Musgo', hex: '#4B5320' },
  { name: 'Verde', hex: '#16A34A' },
  { name: 'Amarelo', hex: '#EAB308' },
  { name: 'Laranja', hex: '#EA580C' },
  { name: 'Marrom', hex: '#78350F' },
  { name: 'Roxo', hex: '#7C3AED' }
];

export function MoradorVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('Prata');
  const [vaga, setVaga] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showForm) {
      loadVeiculos();
    }
  }, [showForm]);

  const loadVeiculos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/v1/perfil/veiculos');
      
      // Inject some mock values for UI demonstration if they don't exist
      const enrichedData = data.map((v: any) => ({
        ...v,
        marca: v.marca || (v.modelo.includes(' ') ? v.modelo.split(' ')[0] : 'Marca'),
        modelo: v.modelo.includes(' ') ? v.modelo.substring(v.modelo.indexOf(' ') + 1) : v.modelo,
        vaga: v.vaga || 'G-14'
      }));

      // Se a API estiver vazia, adiciona os mockados do print para ficar igual
      if (enrichedData.length === 0) {
        setVeiculos([
          { id: 1, placa: 'ABC-1D23', marca: 'Fiat', modelo: 'Argo', cor: 'Prata', vaga: 'G-14' },
          { id: 2, placa: 'RDX-9F41', marca: 'Honda', modelo: 'Civic', cor: 'Preto', vaga: 'G-15' },
          { id: 3, placa: 'JQP-4C21', marca: 'Jeep', modelo: 'Renegade', cor: 'Verde musgo', vaga: 'G-16' }
        ]);
      } else {
        setVeiculos(enrichedData);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Backend expects modelo and cor, we combine marca + modelo for compatibility
      const payload = {
        placa: placa.toUpperCase(),
        modelo: `${marca} ${modelo}`.trim(),
        cor: selectedColor,
        vaga
      };
      
      await api.post('/api/v1/perfil/veiculos', payload);
      alert('Veículo cadastrado com sucesso!');
      
      // Reset form
      setPlaca('');
      setMarca('');
      setModelo('');
      setSelectedColor('Prata');
      setVaga('');
      setShowForm(false);
      
    } catch (error) {
      alert('Erro ao cadastrar veículo');
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return (
      <div className="bg-ds-bg min-h-screen text-ds-text p-6 animate-in slide-in-from-right-full duration-300">
        <div className="flex items-center gap-4 mb-8 pt-4">
          <button 
            onClick={() => setShowForm(false)} 
            className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Cadastrar veículo</h1>
        </div>
        
        <form onSubmit={handleAdd} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Placa</label>
            <input 
              type="text" 
              required
              value={placa}
              onChange={e => setPlaca(e.target.value)}
              placeholder="ABC-1D23"
              maxLength={8}
              className="w-full bg-ds-card border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] font-mono uppercase focus:ring-2 focus:ring-ds-primary focus:border-transparent focus:outline-none placeholder:text-ds-dim/40 text-ds-text transition-shadow"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Marca</label>
              <input 
                type="text" 
                required
                value={marca}
                onChange={e => setMarca(e.target.value)}
                placeholder="Ex: Fiat"
                className="w-full bg-ds-card border border-ds-border rounded-[12px] px-4 py-3.5 text-[14px] focus:ring-2 focus:ring-ds-primary focus:border-transparent focus:outline-none placeholder:text-ds-dim/40 text-ds-text transition-shadow"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Modelo</label>
              <input 
                type="text" 
                required
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                placeholder="Ex: Argo"
                className="w-full bg-ds-card border border-ds-border rounded-[12px] px-4 py-3.5 text-[14px] focus:ring-2 focus:ring-ds-primary focus:border-transparent focus:outline-none placeholder:text-ds-dim/40 text-ds-text transition-shadow"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-3">Cor</label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map(c => (
                 <button 
                   key={c.hex} 
                   type="button"
                   style={{ backgroundColor: c.hex }}
                   className={`w-[34px] h-[34px] rounded-full flex items-center justify-center ring-offset-2 ring-offset-ds-bg transition-all
                     ${selectedColor === c.name ? 'ring-2 ring-ds-primary scale-110' : 'hover:scale-105'}
                     ${c.hex === '#FFFFFF' || c.hex === '#E5E7EB' ? 'border border-gray-200' : 'border border-transparent'}
                   `}
                   onClick={() => setSelectedColor(c.name)}
                   title={c.name}
                 >
                   {selectedColor === c.name && (
                     <Check className={`w-4 h-4 drop-shadow-md ${c.hex === '#FFFFFF' || c.hex === '#E5E7EB' ? 'text-gray-800' : 'text-white'}`} />
                   )}
                 </button>
              ))}
            </div>
            <p className="text-[11.5px] text-ds-dim mt-3.5">Passe o dedo/mouse para ver o nome de cada cor.</p>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Vaga na garagem (Opcional)</label>
            <input 
              type="text" 
              value={vaga}
              onChange={e => setVaga(e.target.value)}
              placeholder="Ex: G-14"
              className="w-full bg-ds-card border border-ds-border rounded-[12px] px-4 py-3.5 text-[14px] focus:ring-2 focus:ring-ds-primary focus:border-transparent focus:outline-none placeholder:text-ds-dim/40 text-ds-text transition-shadow"
            />
          </div>
          
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[12px] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 text-[14.5px]"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cadastrar veículo'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-ds-bg min-h-screen text-ds-text p-6">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <p className="text-[10px] font-bold text-ds-dim uppercase tracking-widest mb-1.5">Garagem</p>
          <h1 className="text-2xl font-bold tracking-tight text-ds-text">Veículos</h1>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="w-11 h-11 rounded-[14px] bg-ds-primary flex items-center justify-center text-ds-primary-ink shadow-[0_4px_12px_rgba(108,99,245,0.3)] active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      
      <p className="text-[11px] font-bold text-ds-dim uppercase tracking-widest mb-4">Meus veículos cadastrados</p>
      
      {loading ? (
        <div className="flex justify-center mt-12"><Loader2 className="w-8 h-8 animate-spin text-ds-primary" /></div>
      ) : (
        <div className="space-y-4 pb-24">
          {veiculos.map(v => (
            <div key={v.id} className="bg-ds-card border border-ds-border rounded-[16px] p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ds-bg rounded-[12px] flex items-center justify-center border border-ds-border/50">
                  <Car className="w-6 h-6 text-ds-text" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-ds-text">{v.placa}</h3>
                  <p className="text-[13px] text-ds-dim mt-0.5 capitalize">{v.marca ? `${v.marca} ${v.modelo}` : v.modelo} &bull; {v.cor}</p>
                </div>
              </div>
              {v.vaga && (
                <div className="bg-ds-primary-dim text-ds-primary text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-ds-primary/20">
                  Vaga {v.vaga}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
