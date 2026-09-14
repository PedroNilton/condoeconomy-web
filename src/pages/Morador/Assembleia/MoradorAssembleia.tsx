import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { CheckCircle2, ChevronRight, Vote, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

export function MoradorAssembleia() {
  const { user } = useAuth();
  const [votacoes, setVotacoes] = useState<Votacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votoLoad, setVotoLoad] = useState<string | null>(null);
  const [votacaoSelecionada, setVotacaoSelecionada] = useState<Votacao | null>(null);

  useEffect(() => {
    fetchVotacoes();
  }, []);

  const fetchVotacoes = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/votacoes/ativas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar assembleias');
      const data = await response.json();
      setVotacoes(data);
    } catch (err) {
      setError('Não foi possível carregar as votações abertas.');
    } finally {
      setLoading(false);
    }
  };

  const handleVotar = async (opcaoId: string) => {
    if (!votacaoSelecionada) return;
    setVotoLoad(opcaoId);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/votacoes/${votacaoSelecionada.id}/votar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ opcaoId })
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || 'Erro ao registrar voto');
      }

      // Atualiza o estado
      setVotacoes(votacoes.map(v => 
        v.id === votacaoSelecionada.id ? { ...v, usuarioJaVotou: true } : v
      ));
      setVotacaoSelecionada(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVotoLoad(null);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      <header className="px-6 py-8 bg-indigo-900/40 border-b border-white/5 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white mb-1">Assembleia Virtual</h1>
        <p className="text-indigo-200 text-sm">Participe das decisões do condomínio</p>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {votacoes.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
              <CheckCircle2 className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tudo tranquilo!</h3>
            <p className="text-slate-400 text-sm">Não há nenhuma assembleia ou votação aberta no momento.</p>
          </div>
        )}

        {votacoes.map(votacao => (
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

            {votacao.usuarioJaVotou ? (
              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Seu voto foi registrado</span>
              </div>
            ) : votacaoSelecionada?.id === votacao.id ? (
              <div className="mt-4 space-y-3 animate-fade-in-up">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Escolha uma opção:</h4>
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
        ))}
      </main>
    </div>
  );
}
