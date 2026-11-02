import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Vote, AlertCircle, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

interface Opcao {
  id: string;
  titulo: string;
}

interface Votacao {
  id: string;
  titulo: string;
  descricao: string;
  dataAbertura: string;
  dataEncerramento: string;
  status: 'ABERTA' | 'ENCERRADA';
  autorNome: string;
  opcoes: Opcao[];
  usuarioJaVotou: boolean;
  usuarioAdimplente?: boolean;
  motivoInaptidao?: string;
}

interface OpcaoResultado {
  opcaoId: string;
  titulo: string;
  votos: number;
  percentual: number;
}

interface VotacaoResultado {
  id: string;
  titulo: string;
  status: string;
  totalVotos: number;
  opcoes: OpcaoResultado[];
}

export function MoradorAssembleia() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ABERTAS' | 'ENCERRADAS'>('ABERTAS');
  const [votacoes, setVotacoes] = useState<Votacao[]>([]);
  const [encerradas, setEncerradas] = useState<Votacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votoLoad, setVotoLoad] = useState<string | null>(null);
  const [votacaoSelecionada, setVotacaoSelecionada] = useState<Votacao | null>(null);

  // Modal / Visualização de Resultados
  const [resultadoModal, setResultadoModal] = useState<VotacaoResultado | null>(null);
  const [carregandoResultado, setCarregandoResultado] = useState(false);

  useEffect(() => {
    fetchVotacoes();
  }, [activeTab]);

  const fetchVotacoes = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'ABERTAS') {
        const response = await api.get('/api/v1/votacoes/ativas');
        setVotacoes(response.data);
      } else {
        const response = await api.get('/api/v1/votacoes/encerradas');
        setEncerradas(response.data);
      }
    } catch (err) {
      setError('Não foi possível carregar as votações.');
    } finally {
      setLoading(false);
    }
  };

  const handleVotar = async (opcaoId: string) => {
    if (!votacaoSelecionada) return;
    setVotoLoad(opcaoId);
    try {
      await api.post(`/api/v1/votacoes/${votacaoSelecionada.id}/votar`, { opcaoId });

      setVotacoes(votacoes.map(v => 
        v.id === votacaoSelecionada.id ? { ...v, usuarioJaVotou: true } : v
      ));
      setVotacaoSelecionada(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar voto');
    } finally {
      setVotoLoad(null);
    }
  };

  const handleVerResultado = async (id: string) => {
    setCarregandoResultado(true);
    try {
      const res = await api.get(`/api/v1/votacoes/${id}/resultado`);
      setResultadoModal(res.data);
    } catch (err) {
      alert('Erro ao carregar o resultado da assembleia.');
    } finally {
      setCarregandoResultado(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      <header className="px-6 py-6 bg-indigo-900/40 border-b border-white/5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Assembleia Virtual</h1>
            <p className="text-indigo-200 text-sm">Participe das decisões do condomínio</p>
          </div>

          {/* Abas */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('ABERTAS')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'ABERTAS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setActiveTab('ENCERRADAS')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'ENCERRADAS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Encerradas / Resultados
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 pb-24">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
          </div>
        ) : activeTab === 'ABERTAS' ? (
          /* Pautas Abertas */
          votacoes.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <CheckCircle2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Tudo tranquilo!</h3>
              <p className="text-slate-400 text-sm">Não há nenhuma assembleia ou votação aberta no momento.</p>
            </div>
          ) : (
            votacoes.map(votacao => {
              const inadimplente = votacao.usuarioAdimplente === false;

              return (
                <div key={votacao.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
                        <Vote className="w-3.5 h-3.5" />
                        Votação Aberta
                      </span>
                      <h3 className="text-lg font-semibold text-white mb-1">{votacao.titulo}</h3>
                      {votacao.descricao && <p className="text-slate-400 text-sm mb-3">{votacao.descricao}</p>}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Encerra em: {format(parseISO(votacao.dataEncerramento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Inadimplência Legal (Art. 1.335, III CC) */}
                  {inadimplente ? (
                    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold">Voto suspenso por pendência financeira</p>
                          <p className="text-[11px] text-amber-200/80 mt-0.5">
                            Conforme o Art. 1.335, III do Código Civil, apenas condôminos quites podem votar em assembleia.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/app/boletos')}
                        className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold hover:brightness-110 flex items-center gap-1 self-start sm:self-auto"
                      >
                        Ver Boletos <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : votacao.usuarioJaVotou ? (
                    <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Seu voto foi registrado com sucesso</span>
                    </div>
                  ) : votacaoSelecionada?.id === votacao.id ? (
                    <div className="mt-4 space-y-3 animate-fade-in-up">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Escolha sua opção de voto:</h4>
                      {votacao.opcoes.map(opcao => (
                        <button
                          key={opcao.id}
                          onClick={() => handleVotar(opcao.id)}
                          disabled={votoLoad !== null}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 transition-colors group disabled:opacity-50"
                        >
                          <span className="font-medium text-white group-hover:text-white transition-colors">{opcao.titulo}</span>
                          {votoLoad === opcao.id ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                          )}
                        </button>
                      ))}
                      <button 
                        onClick={() => setVotacaoSelecionada(null)}
                        className="w-full mt-2 py-3 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setVotacaoSelecionada(votacao)}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
                    >
                      Votar agora
                    </button>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* Pautas Encerradas / Histórico de Decisões */
          encerradas.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <BarChart3 className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhuma ata encerrada</h3>
              <p className="text-slate-400 text-sm">As assembleias finalizadas ficarão disponíveis aqui para consulta.</p>
            </div>
          ) : (
            encerradas.map(votacao => (
              <div key={votacao.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs font-medium mb-2">
                      ENCERRADA
                    </span>
                    <h3 className="text-lg font-semibold text-white">{votacao.titulo}</h3>
                    {votacao.descricao && <p className="text-slate-400 text-xs mt-1">{votacao.descricao}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-400">
                    Encerrada em {format(parseISO(votacao.dataEncerramento), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <button
                    onClick={() => handleVerResultado(votacao.id)}
                    className="px-4 py-2 bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Ver Resultado da Votação
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </main>

      {/* Modal de Resultados da Assembleia */}
      {resultadoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Resultado Oficial</span>
                <h3 className="text-lg font-bold text-white mt-1">{resultadoModal.titulo}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total de votos computados: {resultadoModal.totalVotos}</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              {resultadoModal.opcoes.map(opcao => (
                <div key={opcao.opcaoId} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">{opcao.titulo}</span>
                    <span className="text-indigo-300 font-mono">{opcao.votos} votos ({opcao.percentual.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${opcao.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResultadoModal(null)}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
