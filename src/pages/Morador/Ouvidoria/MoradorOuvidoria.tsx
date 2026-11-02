import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, ChevronLeft, Send, Loader2, Camera, X, Image as ImageIcon, ExternalLink } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface Chamado {
  id: string;
  assunto: string;
  descricao: string;
  categoria: string;
  status: string;
  dataAbertura: string;
  fotoAnexo?: string | null;
}

export function MoradorOuvidoria() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [categoriaVisual, setCategoriaVisual] = useState('Reclamação');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotoAnexo, setFotoAnexo] = useState<string | null>(null);
  const [fotoModal, setFotoModal] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados/meus');
      const meusChamados = res.data || [];
      
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

  const handleFotoSelecionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroFoto(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo MIME
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      setErroFoto('Formato inválido. Apenas imagens JPEG, PNG ou WebP são permitidas.');
      return;
    }

    // Limite de 2.5MB
    if (file.size > 2.5 * 1024 * 1024) {
      setErroFoto('A imagem deve ter no máximo 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFotoAnexo(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverFoto = () => {
    setFotoAnexo(null);
    setErroFoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaVisual || !assunto.trim() || !descricao.trim()) return;

    if (contemAmeacas(assunto) || contemAmeacas(descricao)) {
      alert('Entrada inválida: caracteres ou comandos não permitidos detectados.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/chamados', {
        categoria: mapCategoriaToEnum(categoriaVisual),
        assunto: sanitizarEntrada(assunto),
        descricao: sanitizarEntrada(descricao),
        fotoAnexo: fotoAnexo || null
      });
      
      setCategoriaVisual('Reclamação');
      setAssunto('');
      setDescricao('');
      setFotoAnexo(null);
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
              className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm flex-none cursor-pointer"
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
                    className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-colors whitespace-nowrap cursor-pointer
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

            {/* Anexo de Foto / Evidência */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2.5">
                Foto / Evidência (Opcional)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFotoSelecionada}
                className="hidden"
              />

              {fotoAnexo ? (
                <div className="relative inline-block border border-ds-border rounded-2xl overflow-hidden bg-ds-card p-1 shadow-sm">
                  <img
                    src={fotoAnexo}
                    alt="Evidência anexada"
                    className="w-40 h-28 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemoverFoto}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md"
                    title="Remover foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-ds-dim font-bold text-center mt-1">Foto anexada</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-ds-border rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-ds-card/50 hover:bg-ds-card text-ds-dim hover:text-ds-primary transition-all cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-ds-dim" />
                  <span className="text-xs font-bold">Tirar foto ou anexar imagem</span>
                  <span className="text-[10px] text-ds-faint">JPG, PNG ou WebP até 2.5MB</span>
                </button>
              )}

              {erroFoto && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5">{erroFoto}</p>
              )}
            </div>
            
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !assunto.trim() || !descricao.trim()}
            className="w-full bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[10px] flex items-center justify-center gap-2 active:scale-95 transition-transform mt-6 shadow-md disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
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
            className="w-11 h-11 bg-ds-primary text-ds-primary-ink rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform flex-none cursor-pointer"
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

                {/* Evidência Anexada */}
                {chamado.fotoAnexo && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setFotoModal(chamado.fotoAnexo || null)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-ds-bg border border-ds-border hover:border-ds-primary transition-all text-left cursor-pointer group"
                    >
                      <img
                        src={chamado.fotoAnexo}
                        alt="Miniatura da evidência"
                        className="w-10 h-10 object-cover rounded-lg shrink-0 border border-ds-border"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-ds-text group-hover:text-ds-primary transition-colors">
                          <ImageIcon className="w-3.5 h-3.5 text-ds-primary" />
                          <span>Foto da Evidência</span>
                          <ExternalLink className="w-3 h-3 text-ds-dim" />
                        </div>
                        <p className="text-[10px] text-ds-dim truncate">Clique para ampliar a foto</p>
                      </div>
                    </button>
                  </div>
                )}

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

      {/* Modal de Visualização da Foto */}
      {fotoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-ds-card border border-ds-border rounded-3xl max-w-lg w-full p-4 relative flex flex-col items-center">
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-ds-bg text-ds-dim hover:text-ds-text rounded-full flex items-center justify-center border border-ds-border cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-ds-text mb-3 self-start">Evidência Anexada ao Chamado</h3>
            <div className="max-h-[70vh] overflow-hidden rounded-2xl border border-ds-border bg-black">
              <img
                src={fotoModal}
                alt="Evidência ampliada"
                className="max-h-[70vh] w-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

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
