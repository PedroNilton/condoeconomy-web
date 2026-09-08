import { ArrowLeft, Loader2, Car, Plus, Trash2 } from 'lucide-react';
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

  // Form states
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
      await api.post('/api/v1/perfil/veiculos', { placa, modelo, cor });
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
    if (confirm('Remover veículo?')) {
      try {
        await api.delete(`/api/v1/perfil/veiculos/${id}`);
        fetchVeiculos();
      } catch (err) {
        alert('Erro ao remover');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <header className="bg-white px-6 py-4 flex items-center border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 ml-2">Meus Veículos</h1>
      </header>

      <div className="p-6 flex-1 overflow-y-auto pb-24">
        {loading ? (
           <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : veiculos.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
             <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500 font-medium">Você ainda não tem veículos cadastrados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {veiculos.map(v => (
              <div key={v.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 uppercase tracking-wide">{v.placa}</h3>
                    <p className="text-sm text-gray-500">{v.modelo} - {v.cor}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 right-6">
        <button 
          onClick={() => setShowModal(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Novo Veículo</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                <input type="text" required value={placa} onChange={e => setPlaca(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 uppercase" placeholder="ABC-1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input type="text" required value={modelo} onChange={e => setModelo(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder="Ex: Honda Civic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input type="text" required value={cor} onChange={e => setCor(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder="Ex: Prata" />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
