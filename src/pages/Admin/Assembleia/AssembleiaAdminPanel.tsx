import React, { useState, useEffect } from 'react';
import { Plus, X, BarChart3, Vote } from 'lucide-react';
import api from '../../../services/api';

interface OpcaoResultado {
  opcaoId: string;
  titulo: string;
  votos: number;
  percentual: number;
}

interface VotacaoResultado {
  id: string;
  titulo: string;
  status: 'ABERTA' | 'ENCERRADA';
  totalVotos: number;
  opcoes: OpcaoResultado[];
}

export function AssembleiaAdminPanel() {
  const [votacoes, setVotacoes] = useState<VotacaoResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovaModal, setShowNovaModal] = useState(false);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [opcoes, setOpcoes] = useState<string[]>(['', '']);

  useEffect(() => {
    fetchVotacoes();
  }, []);

  const fetchVotacoes = async () => {
    try {
      const response = await api.get('/api/v1/votacoes');
      const data = response.data;
      
      // Buscar resultados de cada votação
      const resultados = await Promise.all(
        data.map(async (v: any) => {
          const res = await api.get(`/api/v1/votacoes/${v.id}/resultado`);
          return res.data;
        })
      );
      setVotacoes(resultados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/votacoes', {
        titulo,
        descricao,
        dataEncerramento: new Date(dataEncerramento).toISOString(),
        opcoes: opcoes.filter(o => o.trim() !== '')
      });

      setShowNovaModal(false);
      setTitulo('');
      setDescricao('');
      setDataEncerramento('');
      setOpcoes(['', '']);
      fetchVotacoes();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar votação');
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

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assembleias Virtuais</h1>
          <p className="text-slate-500">Gerencie pautas e votações do condomínio.</p>
        </div>
        <button 
          onClick={() => setShowNovaModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Assembleia
        </button>
      </div>

      <div className="grid gap-6">
        {votacoes.map(votacao => (
          <div key={votacao.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{votacao.titulo}</h3>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    votacao.status === 'ABERTA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {votacao.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <Vote className="w-4 h-4" /> {votacao.totalVotos} votos registrados
                </p>
              </div>
              
              {votacao.status === 'ABERTA' && (
                <button 
                  onClick={() => handleEncerrar(votacao.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Encerrar Votação
                </button>
              )}
            </div>

            <div className="space-y-4">
              {votacao.opcoes.map(opcao => (
                <div key={opcao.opcaoId}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{opcao.titulo}</span>
                    <span className="text-slate-500">{opcao.votos} votos ({opcao.percentual.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${opcao.percentual}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {votacoes.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhuma assembleia</h3>
            <p className="text-slate-500">Crie uma nova assembleia para os moradores votarem.</p>
          </div>
        )}
      </div>

      {showNovaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Nova Assembleia</h2>
              <button onClick={() => setShowNovaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCriar} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título da Pauta</label>
                  <input 
                    type="text" 
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Aprovação do Orçamento 2027"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <textarea 
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows={2}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora de Encerramento</label>
                  <input 
                    type="datetime-local" 
                    value={dataEncerramento}
                    onChange={(e) => setDataEncerramento(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Opções de Voto</label>
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
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      {idx >= 2 && (
                        <button type="button" onClick={() => setOpcoes(opcoes.filter((_, i) => i !== idx))} className="text-red-500 px-2 hover:bg-red-50 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setOpcoes([...opcoes, ''])}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-700 mt-1"
                  >
                    + Adicionar opção
                  </button>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNovaModal(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg">
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
