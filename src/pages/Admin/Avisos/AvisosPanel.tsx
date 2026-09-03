import { useState, useEffect } from 'react';
import { Megaphone, Plus, Loader2 } from 'lucide-react';
import api from '../../../services/api';

interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  dataCriacao: string;
  autor: string;
}

export function AvisosPanel() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');

  const fetchAvisos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/avisos');
      setAvisos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, []);

  const handlePostAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/avisos', {
        titulo: novoTitulo,
        mensagem: novaMensagem,
        autor: 'Síndico'
      });
      setNovoTitulo('');
      setNovaMensagem('');
      setModalOpen(false);
      fetchAvisos();
    } catch (err) {
      alert('Erro ao publicar aviso. Verifique sua conexão.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" />
            Mural de Avisos
          </h3>
          <p className="text-gray-500 text-sm mt-1">Gerencie os comunicados oficiais.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : avisos.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-gray-100">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum aviso no mural.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map(aviso => (
            <div key={aviso.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-800">{aviso.titulo}</h4>
                <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                  {new Date(aviso.dataCriacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-line">{aviso.mensagem}</p>
              <p className="text-xs text-red-600 font-medium mt-3 text-right">Por: {aviso.autor}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Aviso */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Novo Comunicado</h3>
              <button onClick={() => setModalOpen(false)} className="text-red-200 hover:text-white">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handlePostAviso} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: Manutenção na bomba d'água"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mensagem</label>
                <textarea 
                  value={novaMensagem}
                  onChange={e => setNovaMensagem(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 min-h-[120px]"
                  placeholder="Escreva os detalhes do aviso..."
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mt-2 transition-colors"
              >
                Publicar no Mural
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
