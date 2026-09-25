import { useState, useEffect } from 'react';
import { Megaphone, Plus, Loader2, X } from 'lucide-react';
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
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Comunicação</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight flex items-center gap-2">
            Mural de Avisos
          </h2>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-ds-primary text-ds-primary-ink p-3 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-ds-dim" />
        </div>
      ) : avisos.length === 0 ? (
        <div className="bg-ds-card p-8 rounded-[16px] text-center shadow-sm border border-ds-border">
          <div className="w-16 h-16 bg-ds-bg border border-ds-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-ds-dim" />
          </div>
          <p className="text-ds-text font-bold mb-1">Mural Vazio</p>
          <p className="text-ds-dim text-sm">Nenhum aviso publicado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map(aviso => (
            <div key={aviso.id} className="bg-ds-card p-5 rounded-[16px] border border-ds-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-ds-primary"></div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-ds-text text-[14.5px] pr-2">{aviso.titulo}</h4>
                <span className="text-[10px] text-ds-dim font-mono bg-ds-bg border border-ds-border px-2 py-1 rounded-md whitespace-nowrap">
                  {new Date(aviso.dataCriacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-ds-dim text-[13.5px] leading-relaxed whitespace-pre-line">{aviso.mensagem}</p>
              <p className="text-[11px] text-ds-primary font-bold mt-3 text-right">Enviado por: {aviso.autor}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Aviso */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-ds-bg border-b border-ds-border p-5 flex justify-between items-center">
              <h3 className="font-extrabold text-ds-text text-lg">Novo Comunicado</h3>
              <button onClick={() => setModalOpen(false)} className="text-ds-dim hover:text-ds-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePostAviso} className="p-5 space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-ds-text mb-1.5">Título do aviso</label>
                <input 
                  type="text" 
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text text-[14px] rounded-lg p-3 outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                  placeholder="Ex: Manutenção preventiva"
                  required
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-ds-text mb-1.5">Mensagem detalhada</label>
                <textarea 
                  value={novaMensagem}
                  onChange={e => setNovaMensagem(e.target.value)}
                  className="w-full bg-ds-bg border border-ds-border text-ds-text text-[14px] rounded-lg p-3 outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all min-h-[120px]"
                  placeholder="Escreva os detalhes do aviso..."
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-xl mt-2 hover:brightness-110 active:scale-[0.98] transition-all"
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
