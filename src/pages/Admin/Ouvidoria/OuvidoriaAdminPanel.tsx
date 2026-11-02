import { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
  X
} from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface Chamado {
  id: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  dataAbertura: string;
  escaladoSindico: boolean;
  fotoAnexo?: string | null;
}

export function OuvidoriaAdminPanel() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  useWebSocket('/topic/chamados', () => {
    fetchChamados();
  });

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chamados');
      const escalados = (Array.isArray(res.data) ? res.data : []).filter((c: Chamado) => c.escaladoSindico);
      setChamados(escalados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamados();
  }, []);

  const handleUpdateStatus = async (id: string, novoStatus: 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    setAtualizandoId(id);
    try {
      await api.put(`/api/v1/chamados/${id}/status`, { novoStatus });
      await fetchChamados();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do chamado.');
    } finally {
      setAtualizandoId(null);
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'MANUTENCAO': return <Wrench className="w-3.5 h-3.5 text-orange-500" />;
      case 'RECLAMACAO': return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case 'SUGESTAO': return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-ds-dim" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1 font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider";
    if (status === 'ABERTO') return `${base} bg-ds-warning-dim text-ds-warning`;
    if (status === 'EM_ANDAMENTO') return `${base} bg-ds-primary-dim text-ds-primary`;
    if (status === 'RESOLVIDO') return `${base} bg-ds-success-dim text-ds-success`;
    return `${base} bg-ds-bg text-ds-dim`;
  };

  const formatStatus = (status: string) => {
    if (status === 'ABERTO') return 'Aberto';
    if (status === 'EM_ANDAMENTO') return 'Em Atendimento';
    if (status === 'RESOLVIDO') return 'Resolvido';
    return status;
  };

  const chamadosFiltrados = chamados.filter(c => {
    if (filtroStatus === 'TODOS') return true;
    return c.status === filtroStatus;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ds-bg">
        <Loader2 className="w-8 h-8 text-ds-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Ouvidoria</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-ds-primary" />
            Demandas dos Moradores
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-ds-card border border-ds-border text-xs text-ds-text font-bold focus:outline-none focus:ring-2 focus:ring-ds-primary"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ABERTO">Abertos</option>
            <option value="EM_ANDAMENTO">Em Atendimento</option>
            <option value="RESOLVIDO">Resolvidos</option>
          </select>

          <button
            onClick={fetchChamados}
            className="p-2 bg-ds-card border border-ds-border rounded-xl text-ds-dim hover:text-ds-text transition-colors shadow-sm cursor-pointer"
            title="Atualizar chamados"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {chamadosFiltrados.length === 0 ? (
        <div className="bg-ds-card border border-ds-border p-12 text-center rounded-[20px] shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-ds-success mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-ds-text mb-1">Tudo em dia!</h3>
          <p className="text-ds-dim text-sm">
            {filtroStatus === 'TODOS'
              ? 'Nenhum chamado escalado para a administração no momento.'
              : 'Nenhum chamado escalado com o filtro selecionado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chamadosFiltrados.map(chamado => (
            <div key={chamado.id} className="bg-ds-card p-5 rounded-[16px] shadow-sm border border-ds-border relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${chamado.status === 'RESOLVIDO' ? 'bg-ds-success' : 'bg-ds-danger'}`}></div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-ds-danger-dim text-ds-danger">
                      ESCALADO
                    </span>
                    <span className={getStatusBadge(chamado.status)}>
                      {formatStatus(chamado.status)}
                    </span>
                  </div>
                  <h3 className="font-bold text-ds-text text-[15px]">{chamado.assunto}</h3>
                  <div className="flex items-center gap-1.5 text-[12px] text-ds-dim font-medium mt-0.5">
                    {getCategoriaIcon(chamado.categoria)}
                    <span>{chamado.categoria}</span>
                    <span>•</span>
                    <span>{new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-[13.5px] text-ds-text leading-relaxed mb-4 bg-ds-bg border border-ds-border p-4 rounded-xl">
                <p>{chamado.descricao}</p>
              </div>

              {/* Evidência / Foto Anexada */}
              {chamado.fotoAnexo && (
                <div className="mb-4">
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-ds-primary" />
                    <span>Evidência Fotográfica Anexada</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setFotoModal(chamado.fotoAnexo || null)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-ds-bg border border-ds-border hover:border-ds-primary transition-all text-left cursor-pointer group w-full"
                  >
                    <img
                      src={chamado.fotoAnexo}
                      alt="Miniatura de evidência"
                      className="w-14 h-14 object-cover rounded-lg shrink-0 border border-ds-border shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ds-text group-hover:text-ds-primary transition-colors">
                        <span>Foto enviada pelo morador</span>
                        <ExternalLink className="w-3.5 h-3.5 text-ds-dim" />
                      </div>
                      <p className="text-[11px] text-ds-dim mt-0.5">Clique para examinar em alta resolução</p>
                    </div>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[13px] bg-ds-bg p-3 rounded-xl border border-ds-border mb-4">
                <div>
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-0.5">Morador</p>
                  <p className="font-bold text-ds-text">{chamado.moradorSolicitante}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-0.5">Unidade</p>
                  <p className="font-bold text-ds-text">{chamado.unidadeTexto}</p>
                </div>
              </div>

              {/* Ações do Síndico */}
              {chamado.status !== 'RESOLVIDO' && (
                <div className="flex justify-end gap-2 pt-1 border-t border-ds-border">
                  {chamado.status === 'ABERTO' && (
                    <button
                      onClick={() => handleUpdateStatus(chamado.id, 'EM_ANDAMENTO')}
                      disabled={atualizandoId === chamado.id}
                      className="px-4 py-2 bg-ds-primary text-ds-primary-ink text-xs font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {atualizandoId === chamado.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      Atender Chamado
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(chamado.id, 'RESOLVIDO')}
                    disabled={atualizandoId === chamado.id}
                    className="px-4 py-2 bg-ds-success text-ds-bg text-xs font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {atualizandoId === chamado.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Resolver Chamado
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Ampliação da Imagem */}
      {fotoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-ds-card border border-ds-border rounded-3xl max-w-lg w-full p-4 relative flex flex-col items-center">
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-ds-bg text-ds-dim hover:text-ds-text rounded-full flex items-center justify-center border border-ds-border cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-ds-text mb-3 self-start">Visualização da Evidência</h3>
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
    </div>
  );
}
