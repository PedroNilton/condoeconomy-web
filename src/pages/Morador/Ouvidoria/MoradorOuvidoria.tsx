import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Camera,
  X,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  IconButton,
  ListCard,
  PageHead,
  TextAreaField,
  Toast,
} from '../../../components/ui';

interface Chamado {
  id: string;
  assunto: string;
  descricao: string;
  categoria: string;
  status: string;
  dataAbertura: string;
  fotoAnexo?: string | null;
}

const CATEGORIAS = [
  { value: 'Reclamação', label: 'Reclamação' },
  { value: 'Manutenção', label: 'Manutenção' },
  { value: 'Dúvida', label: 'Dúvida' },
  { value: 'Sugestão', label: 'Sugestão' },
  { value: 'Outro', label: 'Outro' },
];

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados/meus');
      const meusChamados = res.data || [];

      meusChamados.sort(
        (a: Chamado, b: Chamado) =>
          new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime(),
      );

      setChamados(meusChamados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamados();
  }, []);

  const mapCategoriaToEnum = (cat: string) => {
    switch (cat) {
      case 'Reclamação':
        return 'RECLAMACAO';
      case 'Manutenção':
        return 'MANUTENCAO';
      case 'Dúvida':
        return 'DUVIDA';
      case 'Sugestão':
        return 'SUGESTAO';
      default:
        return 'OUTROS';
    }
  };

  const handleFotoSelecionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroFoto(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      setErroFoto('Formato inválido. Apenas imagens JPEG, PNG ou WebP são permitidas.');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setErroFoto('A imagem deve ter no máximo 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFotoAnexo(reader.result as string);
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
      showToast('Entrada inválida: caracteres ou comandos não permitidos.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/chamados', {
        categoria: mapCategoriaToEnum(categoriaVisual),
        assunto: sanitizarEntrada(assunto),
        descricao: sanitizarEntrada(descricao),
        fotoAnexo: fotoAnexo || null,
      });

      setCategoriaVisual('Reclamação');
      setAssunto('');
      setDescricao('');
      setFotoAnexo(null);
      setIsFormOpen(false);

      showToast('Mensagem enviada');
      fetchChamados();
    } catch (err) {
      console.error(err);
      showToast('Erro ao enviar mensagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ABERTO') return <Badge tone="warn">ABERTO</Badge>;
    if (status === 'EM_ANDAMENTO') return <Badge tone="brand">EM ANDAMENTO</Badge>;
    if (status === 'RESOLVIDO') return <Badge tone="ok">RESOLVIDO</Badge>;
    return <Badge tone="neutral">{status}</Badge>;
  };

  if (isFormOpen) {
    return (
      <div className="bg-canvas min-h-full flex flex-col text-ink pb-8">
        <PageHead title="Nova mensagem" onBack={() => setIsFormOpen(false)} />

        <form onSubmit={handleSubmit} className="px-[18px] flex-1 flex flex-col space-y-5 mt-2">
          <ChoiceChips
            label="Categoria"
            options={CATEGORIAS}
            value={categoriaVisual}
            onChange={setCategoriaVisual}
          />

          <Field
            label="Assunto"
            type="text"
            surface="surface"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Ex: Lâmpada queimada no corredor"
            required
          />

          <div>
            <TextAreaField
              label="Mensagem"
              surface="surface"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={500}
              placeholder="Descreva com detalhes o que aconteceu..."
              className="min-h-[120px]"
              required
            />
            <div className="text-right font-mono text-[10.5px] text-faint mt-1.5 font-semibold">
              {descricao.length}/500
            </div>
          </div>

          {/* Anexo de Foto / Evidência */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-2">
              Foto / Evidência (Opcional)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFotoSelecionada}
              className="hidden"
            />

            {fotoAnexo ? (
              <div className="relative inline-block border border-line rounded-[14px] overflow-hidden bg-surface p-1.5">
                <img
                  src={fotoAnexo}
                  alt="Evidência anexada"
                  className="w-40 h-28 object-cover rounded-[10px]"
                />
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-ink/80 text-canvas rounded-full flex items-center justify-center cursor-pointer"
                  title="Remover foto"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[10.5px] text-dim font-semibold text-center mt-1">
                  Foto anexada
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-line rounded-[14px] flex flex-col items-center justify-center gap-1.5 bg-surface/60 hover:bg-surface text-dim hover:text-brand transition-colors cursor-pointer"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[12.5px] font-bold">Tirar foto ou anexar imagem</span>
                <span className="text-[10.5px] text-faint">JPG, PNG ou WebP até 2.5MB</span>
              </button>
            )}

            {erroFoto && <p className="text-[12px] text-bad font-semibold mt-1.5">{erroFoto}</p>}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting || !assunto.trim() || !descricao.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar para a administração</span>
                </>
              )}
            </Button>
          </div>
        </form>

        <Toast message={toastMsg} hasBottomNav={false} />
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-8">
      <PageHead
        eyebrow="Canal direto"
        title="Ouvidoria"
        subtitle="Fale direto com a administração."
        action={
          <IconButton
            label="Novo chamado"
            onClick={() => setIsFormOpen(true)}
            className="!bg-brand !border-brand !text-brand-ink hover:!bg-brand-hover"
          >
            <Plus className="w-5 h-5" />
          </IconButton>
        }
      />

      <main className="px-[18px] flex-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : chamados.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6" />}
            title="Nenhum chamado aberto"
            description="Precisa reportar algo? Toque no botão + acima para enviar à administração."
          />
        ) : (
          <div className="space-y-3">
            {chamados.map((chamado) => (
              <ListCard key={chamado.id}>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h4 className="font-extrabold text-[14px] text-ink leading-snug line-clamp-1 m-0">
                    {chamado.assunto}
                  </h4>
                  <div className="shrink-0">{getStatusBadge(chamado.status)}</div>
                </div>

                <p className="text-[12.5px] text-dim line-clamp-2 leading-relaxed mb-3 m-0">
                  {chamado.descricao}
                </p>

                {chamado.fotoAnexo && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setFotoModal(chamado.fotoAnexo || null)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-[10px] bg-canvas border border-line hover:border-brand transition-colors text-left cursor-pointer group"
                    >
                      <img
                        src={chamado.fotoAnexo}
                        alt="Miniatura da evidência"
                        className="w-10 h-10 object-cover rounded-[8px] shrink-0 border border-line"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[11.5px] font-bold text-ink group-hover:text-brand">
                          <ImageIcon className="w-3.5 h-3.5 text-brand" />
                          <span>Foto da Evidência</span>
                          <ExternalLink className="w-3 h-3 text-dim" />
                        </div>
                        <p className="text-[10.5px] text-dim truncate m-0">
                          Clique para ampliar a foto
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center font-mono text-[10.5px] font-bold text-faint tracking-wider">
                  <span className="uppercase">{chamado.categoria}</span>
                  <span>
                    {new Date(chamado.dataAbertura)
                      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                      .replace('.', '')}
                  </span>
                </div>
              </ListCard>
            ))}
          </div>
        )}
      </main>

      <BottomSheet
        open={fotoModal !== null}
        onClose={() => setFotoModal(null)}
        title="Evidência Anexada ao Chamado"
      >
        {fotoModal && (
          <div className="mt-2 rounded-[12px] overflow-hidden border border-line bg-canvas flex justify-center">
            <img
              src={fotoModal}
              alt="Evidência ampliada"
              className="max-h-[65vh] w-auto object-contain"
            />
          </div>
        )}
      </BottomSheet>

      <Toast message={toastMsg} />
    </div>
  );
}
