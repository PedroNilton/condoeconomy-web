import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Vote,
  AlertCircle,
  BarChart3,
  Lock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import {
  Badge,
  BottomSheet,
  Button,
  EmptyState,
  ListCard,
  PageHead,
  ProgressBar,
  SegmentedTabs,
  Toast,
} from '../../../components/ui';

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

  const [resultadoModal, setResultadoModal] = useState<VotacaoResultado | null>(null);
  const [carregandoResultado, setCarregandoResultado] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const fetchVotacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'ABERTAS') {
        const response = await api.get('/api/v1/votacoes/ativas');
        setVotacoes(Array.isArray(response.data) ? response.data : []);
      } else {
        const response = await api.get('/api/v1/votacoes/encerradas');
        setEncerradas(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      setError('Não foi possível carregar as votações.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVotacoes();
  }, [fetchVotacoes]);

  useWebSocket('/topic/votacoes', fetchVotacoes);

  const handleVotar = async (opcaoId: string) => {
    if (!votacaoSelecionada) return;
    setVotoLoad(opcaoId);
    try {
      await api.post(`/api/v1/votacoes/${votacaoSelecionada.id}/votar`, { opcaoId });

      setVotacoes((prev) =>
        prev.map((v) =>
          v.id === votacaoSelecionada.id ? { ...v, usuarioJaVotou: true } : v,
        ),
      );
      setVotacaoSelecionada(null);
      showToast('Voto registrado com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao registrar voto');
    } finally {
      setVotoLoad(null);
    }
  };

  const handleVerResultado = async (id: string) => {
    setCarregandoResultado(true);
    try {
      const res = await api.get(`/api/v1/votacoes/${id}/resultado`);
      setResultadoModal(res.data);
    } catch {
      showToast('Erro ao carregar o resultado da assembleia.');
    } finally {
      setCarregandoResultado(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-canvas text-ink pb-24">
      <PageHead
        eyebrow="Decisões"
        title="Assembleia Virtual"
        subtitle="Participe das decisões do condomínio."
      >
        <div className="pb-3">
          <SegmentedTabs
            value={activeTab}
            onChange={(v) => setActiveTab(v)}
            items={[
              { id: 'ABERTAS', label: 'Em Andamento' },
              { id: 'ENCERRADAS', label: 'Encerradas / Resultados' },
            ]}
          />
        </div>
      </PageHead>

      <main className="flex-1 px-[18px] space-y-3">
        {error && (
          <div className="bg-bad-soft border border-bad/20 rounded-[14px] p-3.5 flex items-center gap-2.5 text-bad">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-[12.5px] font-semibold m-0">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : activeTab === 'ABERTAS' ? (
          votacoes.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Tudo tranquilo!"
              description="Não há nenhuma assembleia ou votação aberta no momento."
              tone="ok"
            />
          ) : (
            votacoes.map((votacao) => {
              const inadimplente = votacao.usuarioAdimplente === false;

              return (
                <ListCard
                  key={votacao.id}
                  tone={inadimplente ? 'warn' : 'default'}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <Badge tone="brand">
                      <Vote className="w-3 h-3" />
                      <span>Votação Aberta</span>
                    </Badge>
                    <span className="font-mono text-[10.5px] text-faint font-semibold">
                      Até{' '}
                      {format(parseISO(votacao.dataEncerramento), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-extrabold text-ink mb-1 m-0">
                    {votacao.titulo}
                  </h3>
                  {votacao.descricao && (
                    <p className="text-[12.5px] text-dim leading-relaxed mb-3 m-0">
                      {votacao.descricao}
                    </p>
                  )}

                  {/* Alerta de Inadimplência Legal (Art. 1.335, III CC) */}
                  {inadimplente ? (
                    <div className="mt-3 bg-warn-soft border border-warn/25 rounded-[12px] p-3.5 flex flex-col gap-3 text-warn">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12.5px] font-bold m-0">
                            Voto suspenso por pendência financeira
                          </p>
                          <p className="text-[11.5px] text-dim mt-0.5 m-0 leading-relaxed">
                            Conforme o Art. 1.335, III do Código Civil, apenas condôminos quites podem votar em assembleia.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="mini"
                        onClick={() => navigate('/app/boletos')}
                        className="self-start !bg-warn !border-warn !text-white"
                      >
                        <span>Ver Boletos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : votacao.usuarioJaVotou ? (
                    <div className="mt-3 bg-ok-soft border border-ok/20 rounded-[12px] p-3 flex items-center justify-center gap-2 text-ok">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="text-[12.5px] font-bold">
                        Seu voto foi registrado com sucesso
                      </span>
                    </div>
                  ) : votacaoSelecionada?.id === votacao.id ? (
                    <div className="mt-3 space-y-2 pt-3 border-t border-line">
                      <h4 className="text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-2 m-0">
                        Escolha sua opção de voto:
                      </h4>
                      {votacao.opcoes.map((opcao) => (
                        <button
                          key={opcao.id}
                          type="button"
                          onClick={() => handleVotar(opcao.id)}
                          disabled={votoLoad !== null}
                          className="w-full flex items-center justify-between p-3.5 rounded-[12px] bg-canvas hover:bg-brand-soft border border-line hover:border-brand transition-colors group disabled:opacity-50 cursor-pointer text-left"
                        >
                          <span className="text-[13.5px] font-bold text-ink group-hover:text-brand transition-colors">
                            {opcao.titulo}
                          </span>
                          {votoLoad === opcao.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-faint group-hover:text-brand transition-colors" />
                          )}
                        </button>
                      ))}
                      <Button
                        variant="secondary"
                        size="card"
                        fullWidth
                        onClick={() => setVotacaoSelecionada(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button
                        variant="primary"
                        size="card"
                        fullWidth
                        onClick={() => setVotacaoSelecionada(votacao)}
                      >
                        Votar agora
                      </Button>
                    </div>
                  )}
                </ListCard>
              );
            })
          )
        ) : encerradas.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-6 h-6" />}
            title="Nenhuma ata encerrada"
            description="As assembleias finalizadas ficarão disponíveis aqui para consulta."
          />
        ) : (
          encerradas.map((votacao) => (
            <ListCard key={votacao.id}>
              <div className="flex justify-between items-start gap-2 mb-2">
                <Badge tone="neutral">ENCERRADA</Badge>
                <span className="font-mono text-[10.5px] text-faint font-semibold">
                  Encerrada em{' '}
                  {format(parseISO(votacao.dataEncerramento), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>

              <h3 className="text-[15px] font-extrabold text-ink m-0">{votacao.titulo}</h3>
              {votacao.descricao && (
                <p className="text-[12.5px] text-dim mt-1 mb-0 leading-relaxed">
                  {votacao.descricao}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-line flex justify-end">
                <Button
                  variant="secondary"
                  size="mini"
                  disabled={carregandoResultado}
                  onClick={() => handleVerResultado(votacao.id)}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-brand" />
                  <span>Ver Resultado da Votação</span>
                </Button>
              </div>
            </ListCard>
          ))
        )}
      </main>

      <BottomSheet
        open={resultadoModal !== null}
        onClose={() => setResultadoModal(null)}
        title={resultadoModal?.titulo || 'Resultado Oficial'}
        subtitle={
          resultadoModal
            ? `Resultado Oficial · Total de votos computados: ${resultadoModal.totalVotos}`
            : undefined
        }
      >
        {resultadoModal && (
          <div className="space-y-4">
            <div className="space-y-3">
              {resultadoModal.opcoes.map((opcao) => (
                <div key={opcao.opcaoId} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12.5px]">
                    <span className="font-bold text-ink">{opcao.titulo}</span>
                    <span className="font-mono text-[11.5px] font-semibold text-brand">
                      {opcao.votos} votos ({opcao.percentual.toFixed(1)}%)
                    </span>
                  </div>
                  <ProgressBar percent={opcao.percentual} tone="brand" />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="card"
                fullWidth
                onClick={() => setResultadoModal(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <Toast message={toastMsg} />
    </div>
  );
}
