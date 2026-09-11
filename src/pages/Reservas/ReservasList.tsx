import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Users, CheckCircle, Clock, Check, X, CalendarClock, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Convidado {
  id: string;
  nome: string;
  documento: string;
  statusEntrada: string;
  horaEntrada?: string;
}

interface Reserva {
  id: string;
  nomeArea: string;
  unidade: string;
  moradorSolicitante: string;
  titulo: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  motivoRejeicao?: string;
  convidados: Convidado[];
}

type TabType = 'PENDENTES' | 'APROVADAS' | 'REJEITADAS';

export function ReservasList() {
  const [activeTab, setActiveTab] = useState<TabType>('PENDENTES');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useWebSocket('/topic/reservas', () => {
    fetchReservas();
  });

  useEffect(() => {
    fetchReservas();
  }, [activeTab]);

  const fetchReservas = async () => {
    try {
      setLoading(true);
      let url = '';
      if (activeTab === 'PENDENTES') {
        url = '/api/v1/reservas?status=PENDENTE_APROVACAO';
      } else if (activeTab === 'APROVADAS') {
        url = `/api/v1/reservas?status=APROVADA`;
      } else {
        url = `/api/v1/reservas?status=REJEITADA`;
      }
      const res = await api.get(url);
      setReservas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (reservaId: string, convidadoId: string) => {
    try {
      await api.put(`/api/v1/reservas/${reservaId}/convidados/${convidadoId}/checkin`);
      fetchReservas();
    } catch (err) {
      alert('Erro ao realizar check-in do convidado.');
    }
  };

  const handleAprovar = async (reservaId: string) => {
    try {
      await api.put(`/api/v1/reservas/${reservaId}/aprovar`);
      fetchReservas();
    } catch (err) {
      alert('Erro ao aprovar reserva.');
    }
  };

  const handleRejeitar = async (reservaId: string) => {
    const motivo = window.prompt('Qual o motivo da recusa? (Obrigatório)');
    if(!motivo || motivo.trim() === '') {
      alert('Motivo da recusa é obrigatório.');
      return;
    }
    try {
      await api.put(`/api/v1/reservas/${reservaId}/rejeitar`, { motivo });
      fetchReservas();
    } catch (err) {
      alert('Erro ao rejeitar reserva.');
    }
  };

  const formatDate = (dateString: string) => {
    if(!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  const filteredReservas = reservas.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.titulo.toLowerCase().includes(term) ||
      r.moradorSolicitante.toLowerCase().includes(term) ||
      r.unidade.toLowerCase().includes(term) ||
      r.nomeArea.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Controle de Reservas
        </h3>
        <p className="text-gray-500 dark:text-gray-400">Gerencie as solicitações e o acesso dos convidados.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('PENDENTES')}
          className={`flex-1 sm:flex-none py-2 px-6 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'PENDENTES'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
          }`}
        >
          Solicitações
        </button>
        <button
          onClick={() => setActiveTab('APROVADAS')}
          className={`flex-1 sm:flex-none py-2 px-6 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'APROVADAS'
              ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
          }`}
        >
          Aprovadas
        </button>
        <button
          onClick={() => setActiveTab('REJEITADAS')}
          className={`flex-1 sm:flex-none py-2 px-6 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'REJEITADAS'
              ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
          }`}
        >
          Recusadas
        </button>
      </div>

      {/* Filtros */}
      {(activeTab === 'APROVADAS' || activeTab === 'REJEITADAS') && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder="Pesquisar por título, morador ou unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">Carregando reservas...</div>
      ) : reservas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nenhuma Reserva</h4>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Não há {activeTab === 'PENDENTES' ? 'solicitações pendentes' : 'reservas aprovadas para este dia'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reservas.map(reserva => (
            <div key={reserva.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{reserva.titulo}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'PENDENTES' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-500' 
                          : activeTab === 'APROVADAS'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-500'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-500'
                      }`}>
                        {activeTab === 'PENDENTES' ? 'PENDENTE' : activeTab === 'APROVADAS' ? 'APROVADA' : 'RECUSADA'}
                      </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Solicitado por <strong className="text-gray-800 dark:text-gray-200">{reserva.moradorSolicitante}</strong> — <span className="text-blue-600 dark:text-blue-400 font-semibold">{reserva.unidade}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {reserva.nomeArea}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-gray-400" /> {formatDate(reserva.dataReserva)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> {reserva.horaInicio} às {reserva.horaFim}</span>
                  </div>
                </div>

                {activeTab === 'PENDENTES' && (
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <button onClick={() => handleRejeitar(reserva.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl font-bold transition-colors">
                      <X className="w-4 h-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleAprovar(reserva.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-sm">
                      <Check className="w-4 h-4" /> Aprovar
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-800/50">
                <h5 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4 text-sm uppercase tracking-wide">
                  <Users className="w-4 h-4 text-gray-400" /> Lista de Convidados ({reserva.convidados.length})
                </h5>
                
                {reserva.convidados.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">Nenhum convidado listado.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reserva.convidados.map(convidado => (
                      <div key={convidado.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${convidado.statusEntrada === 'ENTROU' ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{convidado.nome}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Doc: {convidado.documento || 'N/A'}</p>
                          {convidado.horaEntrada && <p className="text-[11px] font-bold text-green-600 dark:text-green-400 mt-1">Entrou: {new Date(convidado.horaEntrada).toLocaleTimeString('pt-BR')}</p>}
                        </div>
                        {activeTab === 'APROVADAS' && (
                          <>
                            {convidado.statusEntrada === 'PENDENTE' ? (
                              <button 
                                onClick={() => handleCheckIn(reserva.id, convidado.id)}
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-full transition-colors"
                                title="Confirmar Entrada"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
