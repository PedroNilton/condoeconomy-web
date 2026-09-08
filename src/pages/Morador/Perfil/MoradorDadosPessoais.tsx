import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

export function MoradorDadosPessoais() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [apartamento, setApartamento] = useState('');
  const [bloco, setBloco] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/v1/perfil/dados');
        setNome(res.data.nome || '');
        setTelefone(res.data.telefone || '');
        setApartamento(res.data.apartamento || '');
        setBloco(res.data.bloco || '');
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/v1/perfil/dados', { nome, telefone, apartamento, bloco });
      alert('Dados salvos com sucesso!');
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 ml-2">Dados Pessoais</h1>
      </header>

      <div className="p-6 flex-1">
        {fetching ? (
           <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
              <input 
                type="text" 
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apartamento</label>
                <input 
                  type="text" 
                  value={apartamento}
                  onChange={e => setApartamento(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bloco</label>
                <input 
                  type="text" 
                  value={bloco}
                  onChange={e => setBloco(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: B"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
