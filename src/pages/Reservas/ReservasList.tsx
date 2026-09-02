import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Users, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';

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
  convidados: Convidado[];
}

export function ReservasList() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReservas();
  }, [dataSelecionada]);

  const fetchReservas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/reservas?data=${dataSelecionada}`);
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            Agenda de Áreas Comuns
          </h3>
          <p className="text-gray-500 mt-1">Controle os salões e a entrada de convidados no dia.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-600 font-medium">Data:</label>
          <input 
            type="date" 
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando agenda...</div>
      ) : reservas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-purple-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900">Agenda Livre</h4>
          <p className="text-gray-500 mt-1">Nenhuma reserva confirmada para este dia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reservas.map(reserva => (
            <div key={reserva.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg text-gray-800">{reserva.titulo}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {reserva.nomeArea}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {reserva.horaInicio} às {reserva.horaFim}</span>
                    <span className="flex items-center gap-1">Apto: <strong className="text-gray-800">{reserva.unidade}</strong> ({reserva.moradorSolicitante})</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {reserva.status}
                </div>
              </div>

              <div className="p-6">
                <h5 className="font-medium text-gray-800 flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-400" /> Lista de Convidados ({reserva.convidados.length})
                </h5>
                
                {reserva.convidados.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Nenhum convidado listado para este evento.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reserva.convidados.map(convidado => (
                      <div key={convidado.id} className={`flex items-center justify-between p-3 rounded-lg border ${convidado.statusEntrada === 'ENTROU' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div>
                          <p className="font-medium text-gray-800">{convidado.nome}</p>
                          <p className="text-xs text-gray-500">Doc: {convidado.documento || 'N/A'}</p>
                          {convidado.horaEntrada && <p className="text-xs text-green-600 mt-1">Entrou: {new Date(convidado.horaEntrada).toLocaleTimeString('pt-BR')}</p>}
                        </div>
                        {convidado.statusEntrada === 'PENDENTE' ? (
                          <button 
                            onClick={() => handleCheckIn(reserva.id, convidado.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                            title="Confirmar Entrada"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
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
