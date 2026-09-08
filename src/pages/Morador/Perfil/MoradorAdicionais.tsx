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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
      <header className="bg-white dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 ml-2">Moradores Adicionais</h1>
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
        ) : moradores.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
             <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500 dark:text-gray-400 font-medium">Você é o único morador cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moradores.map(m => (
              <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{m.nome}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{m.parentesco}</p>
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

      {showModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Novo Morador</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nome Completo</label>
                <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600" placeholder="Ex: Maria Souza" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Grau de Parentesco</label>
                <input 
                  type="text" 
                  required 
                  value={parentesco} 
                  onChange={e => setParentesco(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  placeholder="Ex: Esposa, Filho, Avó, Parente..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-200">Cancelar</button>
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
