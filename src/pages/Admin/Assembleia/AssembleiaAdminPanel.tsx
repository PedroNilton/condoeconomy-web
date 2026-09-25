import { useState, useEffect } from 'react';
import { Plus, Vote, BarChart3, X } from 'lucide-react';
import api from '../../../services/api';

interface OpcaoVoto {
  opcaoId: string;
  titulo: string;
  votos: number;
  percentual: number;
}

interface VotacaoAdmin {
  id: string;
  titulo: string;
  descricao: string;
  dataCriacao: string;
  dataEncerramento: string;
  status: string;
  totalVotos: number;
  opcoes: OpcaoVoto[];
}

export function AssembleiaAdminPanel() {
  const [votacoes, setVotacoes] = useState<VotacaoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovaModal, setShowNovaModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [opcoes, setOpcoes] = useState<string[]>(['Sim', 'Não']);

  const fetchVotacoes = async () => {
    try {
      const res = await api.get('/api/v1/votacoes');
      setVotacoes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotacoes();
  }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/votacoes', {
        titulo,
        descricao,
        dataEncerramento: dataEncerramento + ':00',
        opcoes
      });
      setShowNovaModal(false);
      setTitulo('');
      setDescricao('');
      setOpcoes(['Sim', 'Não']);
      fetchVotacoes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEncerrar = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja encerrar esta assembleia?')) return;
    try {
      await api.put(`/api/v1/votacoes/${id}/encerrar`);
      fetchVotacoes();
    } catch (err) {
      console.error(err);
    }
  };

  const getBadgeClass = (status: string) => {
    const base = "inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider";
    if (status === 'ABERTA') return `${base} bg-ds-success-dim text-ds-success`;
    return `${base} bg-ds-disabled-bg text-ds-dim`;
  };

  if (loading) return <div className="p-8 text-ds-dim">Carregando...</div>;

  return (
    <div className="p-2 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Decisões</p>
          <h1 className="text-ds-text text-2xl font-extrabold tracking-tight">Assembleias</h1>
        </div>
        <button 
          onClick={() => setShowNovaModal(true)}
          className="bg-ds-primary hover:brightness-110 text-ds-primary-ink px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Pauta
        </button>
      </div>

      <div className="grid gap-6">
        {votacoes.map(votacao => (
          <div key={votacao.id} className="bg-ds-card border border-ds-border rounded-[16px] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-ds-primary"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-ds-text">{votacao.titulo}</h3>
                  <span className={getBadgeClass(votacao.status)}>
                    {votacao.status}
                  </span>
                </div>
                <p className="text-ds-dim text-[13.5px] font-semibold flex items-center gap-2">
                  <Vote className="w-4 h-4" /> {votacao.totalVotos} votos computados
                </p>
              </div>
              
              {votacao.status === 'ABERTA' && (
                <button 
                  onClick={() => handleEncerrar(votacao.id)}
                  className="text-ds-danger text-xs font-bold px-3 py-1.5 border border-ds-danger/30 hover:bg-ds-danger-dim rounded-lg transition-colors"
                >
                  Encerrar Votação
                </button>
              )}
            </div>

            <div className="space-y-4">
              {votacao.opcoes.map(opcao => (
                <div key={opcao.opcaoId}>
                  <div className="flex justify-between text-[13.5px] mb-1.5">
                    <span className="font-bold text-ds-text">{opcao.titulo}</span>
                    <span className="text-ds-dim font-mono text-[12.5px]">{opcao.votos} votos ({opcao.percentual.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-ds-bg border border-ds-border rounded-full h-3">
                    <div 
                      className="bg-ds-primary h-full rounded-full transition-all duration-1000"
                      style={{ width: `${opcao.percentual}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {votacoes.length === 0 && (
          <div className="text-center py-12 bg-ds-card border border-ds-border rounded-[16px]">
            <div className="w-16 h-16 bg-ds-bg border border-ds-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-ds-dim" />
            </div>
            <h3 className="text-ds-text font-bold mb-1">Nenhuma assembleia</h3>
            <p className="text-ds-dim text-sm">Crie uma nova pauta para os moradores votarem.</p>
          </div>
        )}
      </div>

      {showNovaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-ds-border flex justify-between items-center bg-ds-bg">
              <h2 className="text-lg font-extrabold text-ds-text">Nova Assembleia</h2>
              <button onClick={() => setShowNovaModal(false)} className="text-ds-dim hover:text-ds-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCriar} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-ds-text mb-1.5">Título da Pauta</label>
                  <input 
                    type="text" 
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    className="w-full bg-ds-bg border border-ds-border text-ds-text text-[14px] rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                    placeholder="Ex: Aprovação do Orçamento 2027"
                  />
                </div>
                
                <div>
                  <label className="block text-[12.5px] font-semibold text-ds-text mb-1.5">Descrição</label>
                  <textarea 
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full bg-ds-bg border border-ds-border text-ds-text text-[14px] rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all resize-none"
                    rows={2}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-ds-text mb-1.5">Data e Hora de Encerramento</label>
                  <input 
                    type="datetime-local" 
                    value={dataEncerramento}
                    onChange={(e) => setDataEncerramento(e.target.value)}
                    required
                    className="w-full bg-ds-bg border border-ds-border text-ds-text text-[14px] rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-ds-text mb-2">Opções de Voto</label>
                  {opcoes.map((op, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={op}
                        onChange={(e) => {
                          const newOp = [...opcoes];
                          newOp[idx] = e.target.value;
                          setOpcoes(newOp);
                        }}
                        placeholder={`Opção ${idx + 1}`}
                        required={idx < 2} // Pelo menos 2 opções
                        className="flex-1 bg-ds-bg border border-ds-border text-ds-text text-[14px] rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-all"
                      />
                      {idx >= 2 && (
                        <button type="button" onClick={() => setOpcoes(opcoes.filter((_, i) => i !== idx))} className="text-ds-danger px-2 hover:bg-ds-danger-dim rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setOpcoes([...opcoes, ''])}
                    className="text-[12.5px] text-ds-primary font-bold hover:brightness-110 mt-1"
                  >
                    + Adicionar opção
                  </button>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNovaModal(false)} className="px-5 py-2.5 bg-ds-bg border border-ds-border text-ds-text font-bold hover:brightness-95 rounded-xl transition-all">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-ds-primary text-ds-primary-ink font-bold hover:brightness-110 rounded-xl transition-all shadow-sm">
                  Criar Votação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
