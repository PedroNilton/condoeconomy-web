import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Loader2, Send } from 'lucide-react';
import { api } from '../../../services/api';

interface Chamado {
  id: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: string;
  dataAbertura: string;
}

export function MoradorOuvidoria() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [categoria, setCategoria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/chamados');
      // Filtra apenas os chamados desse morador (Apt 101 - Bloco B)
      const meusChamados = response.data.filter((c: Chamado) => c.unidadeTexto === 'Apto 101 - Bloco B');
      
      // Ordena pelos mais recentes
      meusChamados.sort((a: Chamado, b: Chamado) => 
        new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime()
      );
      
      setChamados(meusChamados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !assunto || !descricao) return;

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/chamados', {
        unidadeTexto: 'Apto 101 - Bloco B',
        moradorSolicitante: 'Carlos Silva',
        categoria,
        assunto,
        descricao
      });
      
      // Limpa formulário e fecha
      setCategoria('');
      setAssunto('');
      setDescricao('');
      setIsFormOpen(false);
      
      // Atualiza lista
      fetchChamados();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'ABERTO') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status === 'EM_ANDAMENTO') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'RESOLVIDO') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ABERTO') return 'Enviado';
    if (status === 'EM_ANDAMENTO') return 'Em Andamento';
    if (status === 'RESOLVIDO') return 'Resolvido';
    return status;
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <header className="bg-white p-4 flex items-center gap-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800 p-2 -ml-2">
            Voltar
          </button>
          <h2 className="text-lg font-bold text-gray-800">Nova Mensagem</h2>
        </header>

        <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col">
          <div className="space-y-5 flex-1">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Categoria</label>
              <select 
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              >
                <option value="">Selecione...</option>
                <option value="RECLAMACAO">Reclamação</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="DUVIDA">Dúvida / Informação</option>
                <option value="SUGESTAO">Sugestão</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Assunto</label>
              <input 
                type="text" 
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                placeholder="Ex: Lâmpada queimada no corredor"
                className="w-full p-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Mensagem</label>
              <textarea 
                rows={5}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva com detalhes o que aconteceu..."
                className="w-full p-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
                required
              />
            </div>
            
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? 'Enviando...' : 'Enviar para Síndico'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Header Fixo */}
      <header className="bg-white pt-10 pb-4 px-6 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Ouvidoria
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Fale direto com a administração</p>
        </div>
        
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-10 h-10 bg-blue-600 text-white rounded-full shadow-md flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Lista de Chamados */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : chamados.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Você ainda não enviou nenhuma mensagem.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chamados.map(chamado => (
              <div key={chamado.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{chamado.assunto}</h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border whitespace-nowrap ${getStatusStyle(chamado.status)}`}>
                    {getStatusLabel(chamado.status)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {chamado.descricao}
                </p>

                <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{chamado.categoria}</span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
