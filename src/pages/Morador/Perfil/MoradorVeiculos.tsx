import { ArrowLeft, Loader2, Car, Plus, Trash2, ShieldCheck, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
}

export function MoradorVeiculos() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');

  const fetchVeiculos = async () => {
    try {
      const res = await api.get('/api/v1/perfil/veiculos');
      setVeiculos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/v1/perfil/veiculos', { placa: placa.toUpperCase(), modelo, cor });
      setShowModal(false);
      setPlaca(''); setModelo(''); setCor('');
      fetchVeiculos();
    } catch (err) {
      alert('Erro ao cadastrar veículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover veículo? Isso revogará o acesso automático pela portaria.')) {
      try {
        await api.delete(`/api/v1/perfil/veiculos/${id}`);
        fetchVeiculos();
      } catch (err) {
        alert('Erro ao remover');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 relative">
      
      {/* Header Premium */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl pt-12 pb-6 px-6 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800/50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Meus Veículos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Gestão de acesso à garagem</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-10 h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-500 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-6 flex-1 overflow-y-auto pb-32">
        {loading ? (
           <div className="flex justify-center mt-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
        ) : veiculos.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center shadow-sm mt-4">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
               <Car className="w-8 h-8 text-slate-300 dark:text-slate-600" />
             </div>
             <h3 className="text-slate-800 dark:text-white font-bold mb-1">Nenhum Veículo</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Adicione seu veículo para liberar o acesso rápido pela portaria.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {veiculos.map(v => (
              <div key={v.id} className="bg-white dark:bg-slate-800/80 rounded-[1.5rem] p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden transition-all hover:shadow-md">
                
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500"></div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg capitalize">{v.modelo}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{v.cor}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(v.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Placa "Detran" Style */}
                <div className="mt-5 ml-16">
                  <div className="inline-block border-2 border-slate-800 dark:border-slate-400 rounded-lg overflow-hidden shadow-sm bg-white">
                    <div className="bg-blue-700 px-3 py-0.5 flex justify-between items-center h-4">
                      <div className="w-3 h-2 bg-yellow-400 rounded-sm"></div>
                      <span className="text-[8px] font-bold text-white tracking-widest uppercase">Brasil</span>
                      <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
                    </div>
                    <div className="px-4 py-1.5 text-center bg-white dark:bg-slate-100">
                      <span className="font-mono text-xl font-black text-slate-900 tracking-[0.2em]">{v.placa}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-3 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <p className="text-xs font-semibold">Liberado via Leitura de Placa (LPR)</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Premium */}
      {showModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 border-t border-slate-200 dark:border-slate-800">
            
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Cadastrar Veículo</h2>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Placa do Veículo</label>
                <div className="relative">
                  <input type="text" required value={placa} onChange={e => setPlaca(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 uppercase font-mono text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none" placeholder="ABC-1234" maxLength={8} />
                  <Camera className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Modelo</label>
                  <input type="text" required value={modelo} onChange={e => setModelo(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/50 transition-all outline-none" placeholder="Ex: Corolla" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cor</label>
                  <input type="text" required value={cor} onChange={e => setCor(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/50 transition-all outline-none" placeholder="Ex: Prata" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 pb-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-[2] bg-cyan-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-500 active:scale-95 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-70">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
