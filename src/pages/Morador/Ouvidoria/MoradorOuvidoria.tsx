import { useState, useEffect } from 'react';
import { MessageSquare, Plus, ChevronLeft, Send, Loader2 } from 'lucide-react';
import api from '../../../services/api';

interface Chamado {
  id: number;
  assunto: string;
  descricao: string;
  categoria: string;
  status: string;
  dataAbertura: string;
}

export function MoradorOuvidoria() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [categoriaVisual, setCategoriaVisual] = useState('Reclamação');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados');
      const meusChamados = res.data.filter((c: any) => c.moradorSolicitante === 'Carlos Silva');
      
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

  const mapCategoriaToEnum = (cat: string) => {
    switch(cat) {
      case 'Reclamação': return 'RECLAMACAO';
      case 'Manutenção': return 'MANUTENCAO';
      case 'Dúvida': return 'DUVIDA';
      case 'Sugestão': return 'SUGESTAO';
      default: return 'OUTROS';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaVisual || !assunto.trim() || !descricao.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/chamados', {
        unidadeTexto: 'Apto 101 - Bloco B',
        moradorSolicitante: 'Carlos Silva',
        categoria: mapCategoriaToEnum(categoriaVisual),
        assunto: assunto.trim(),
        descricao: descricao.trim()
      });
      
      setCategoriaVisual('Reclamação');
      setAssunto('');
      setDescricao('');
      setIsFormOpen(false);
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);

      fetchChamados();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeStyle = (status: string) => {
    if (status === 'ABERTO') return 'bg-ds-warning-dim text-ds-warning border-ds-warning/20';
    if (status === 'EM_ANDAMENTO') return 'bg-ds-primary-dim text-ds-primary border-ds-primary/20';
    if (status === 'RESOLVIDO') return 'bg-ds-success-dim text-ds-success border-ds-success/20';
    return 'bg-ds-bg text-ds-dim border-ds-border';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ABERTO') return 'ABERTO';
    if (status === 'EM_ANDAMENTO') return 'EM ANDAMENTO';
    if (status === 'RESOLVIDO') return 'RESOLVIDO';
    return status;
  };

  if (isFormOpen) {
    return (
      <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative">
        <header className="px-5 py-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFormOpen(false)} 
              className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm flex-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Nova mensagem</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="px-5 pb-24 flex-1 overflow-y-auto flex flex-col">
          <div className="space-y-6 flex-1">
            
            {/* Categoria Chips */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2.5">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {['Reclamação', 'Manutenção', 'Dúvida', 'Sugestão', 'Outro'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaVisual(cat)}
                    className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-colors whitespace-nowrap
                      ${categoriaVisual === cat 
                        ? 'border-ds-primary bg-ds-primary-dim text-ds-primary' 
                        : 'border-ds-border bg-ds-card text-ds-dim'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2.5">Assunto</label>
              <input 
                type="text" 
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                placeholder="Ex: Lâmpada queimada no corredor"
                className="w-full p-[13px] rounded-[10px] border border-ds-border bg-ds-card text-ds-text font-sans text-[14px] outline-none focus:border-ds-primary focus:ring-1 focus:ring-ds-primary transition-all placeholder:text-ds-dim/40"
                required
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2.5">Mensagem</label>
              <textarea 
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                maxLength={500}
                placeholder="Descreva com detalhes o que aconteceu..."
                className="w-full p-[13px] rounded-[10px] border border-ds-border bg-ds-card text-ds-text font-sans text-[14px] outline-none focus:border-ds-primary focus:ring-1 focus:ring-ds-primary transition-all resize-none min-h-[120px] placeholder:text-ds-dim/40"
                required
              />
              <div className="text-right text-[10.5px] text-ds-faint mt-1.5 font-bold">
                {descricao.length}/500
              </div>
            </div>
            
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !assunto.trim() || !descricao.trim()}
            className="w-full bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[10px] flex items-center justify-center gap-2 active:scale-95 transition-transform mt-6 shadow-md disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-[18px] h-[18px] ml-1" />}
            {isSubmitting ? 'Enviando...' : 'Enviar para o síndico'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in fade-in duration-300 relative overflow-hidden">
      
      {/* Header */}
      <header className="px-5 py-6 pt-10">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-[22px] h-[22px] text-ds-text" />
              <h1 className="text-[22px] font-[800] tracking-tight text-ds-text">Ouvidoria</h1>
            </div>
            <p className="text-[13px] text-ds-dim font-medium">Fale direto com a administração.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-11 h-11 bg-ds-primary text-ds-primary-ink rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform flex-none"
            aria-label="Novo chamado"
          >
            <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-28 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-ds-primary" />
          </div>
        ) : chamados.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-ds-card border border-ds-border rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-ds-dim opacity-50" />
            </div>
            <p className="text-ds-dim text-[14px]">Nenhum chamado aberto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chamados.map(chamado => (
              <div key={chamado.id} className="bg-ds-card border border-ds-border rounded-[16px] p-4 shadow-sm">
                
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h4 className="font-bold text-[14px] text-ds-text leading-tight line-clamp-1">{chamado.assunto}</h4>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap tracking-wide ${getBadgeStyle(chamado.status)}`}>
                    {getStatusLabel(chamado.status)}
                  </span>
                </div>
                
                <p className="text-[13px] text-ds-dim line-clamp-2 leading-relaxed mb-3 pr-2">
                  {chamado.descricao}
                </p>

                <div className="flex justify-between items-center text-[10.5px] font-bold text-ds-faint tracking-wider">
                  <span className="uppercase">{chamado.categoria}</span>
                  <span>
                    {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-[90px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg font-bold text-[13px] px-[18px] py-[11px] rounded-[10px] shadow-lg transition-all duration-300 z-50 whitespace-nowrap
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[80px] pointer-events-none'}
        `}
      >
        Mensagem enviada
      </div>

    </div>
  );
}
