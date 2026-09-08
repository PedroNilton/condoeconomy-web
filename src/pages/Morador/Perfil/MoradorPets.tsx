import { ArrowLeft, Loader2, PawPrint, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Pet {
  id: string;
  nome: string;
  especie: string;
  raca: string;
}

export function MoradorPets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState('');
  const [raca, setRaca] = useState('');

  const fetchPets = async () => {
    try {
      const res = await api.get('/api/v1/perfil/pets');
      setPets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/v1/perfil/pets', { nome, especie, raca });
      setShowModal(false);
      setNome(''); setEspecie(''); setRaca('');
      fetchPets();
    } catch (err) {
      alert('Erro ao cadastrar pet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover pet?')) {
      try {
        await api.delete(`/api/v1/perfil/pets/${id}`);
        fetchPets();
      } catch (err) {
        alert('Erro ao remover');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 ml-2">Meus Pets</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-6 flex-1 overflow-y-auto pb-24">
        {loading ? (
           <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : pets.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
             <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500 font-medium">Você não tem pets cadastrados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{p.nome}</h3>
                    <p className="text-sm text-gray-500">{p.especie} {p.raca ? `- ${p.raca}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Novo Pet</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pet</label>
                <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder="Ex: Rex" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                <input type="text" required value={especie} onChange={e => setEspecie(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder="Ex: Cachorro, Gato" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raça (Opcional)</label>
                <input type="text" value={raca} onChange={e => setRaca(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder="Ex: Poodle" />
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
