import { ArrowLeft, Loader2, Users, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Morador {
  id: string;
  nome: string;
  parentesco: string;
}

export function MoradorAdicionais() {
  const navigate = useNavigate();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [parentesco, setParentesco] = useState('');

  const fetchMoradores = async () => {
    try {
      const res = await api.get('/api/v1/perfil/moradores');
      setMoradores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoradores();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/v1/perfil/moradores', { nome, parentesco });
      setShowModal(false);
      setNome(''); setParentesco('');
      fetchMoradores();
    } catch (err) {
      alert('Erro ao cadastrar morador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover este morador?')) {
      try {
        await api.delete(`/api/v1/perfil/moradores/${id}`);
        fetchMoradores();
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
        <h1 className="text-lg font-bold text-gray-800 ml-2">Moradores Adicionais</h1>
      </header>

      <div className="p-6 flex-1 overflow-y-auto pb-24">
        {loading ? (
           <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : moradores.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
             <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500 font-medium">Você é o único morador cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moradores.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{m.nome}</h3>
                    <p className="text-sm text-gray-500">{m.parentesco}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
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
          className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Novo Morador</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" placeholder="Ex: Maria Souza" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grau de Parentesco</label>
                <select required value={parentesco} onChange={e => setParentesco(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white">
                  <option value="">Selecione...</option>
                  <option value="Esposa(o)">Esposa(o)</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Parente">Parente</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
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
