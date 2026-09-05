import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface Reserva {
  id: string;
  areaComumNome: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  titulo: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: string;
}

export function ReservasApprovalPanel() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useWebSocket('/topic/reservas', () => {
    fetchReservas();
  });

  const fetchReservas = async () => {
    try {
      const res = await api.get('/api/v1/reservas');
      // Filtrar apenas as pendentes
      const pendentes = res.data.filter((r: Reserva) => r.status === 'PENDENTE_APROVACAO');
      setReservas(pendentes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const handleAprovar = async (id: string) => {
    try {
      await api.put(`/api/v1/reservas/${id}/aprovar`);
      fetchReservas();
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar reserva');
    }
  };

  const handleRejeitar = async (id: string) => {
    try {
      await api.put(`/api/v1/reservas/${id}/rejeitar`);
      fetchReservas();
    } catch (err) {
      console.error(err);
      alert('Erro ao rejeitar reserva');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto bg-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
          <Calendar className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Aprovação de Reservas</h2>
      </div>

      {reservas.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Tudo em dia!</h3>
          <p className="text-sm text-gray-500">Não há reservas aguardando sua aprovação.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map(reserva => (
            <div key={reserva.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">
                    <Clock className="w-3 h-3" /> Pendente
                  </span>
                  <h3 className="font-bold text-gray-800">{reserva.titulo}</h3>
                  <p className="text-sm text-gray-500">{reserva.areaComumNome}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Morador</p>
                  <p className="font-medium text-gray-800">{reserva.moradorSolicitante}</p>
                  <p className="text-xs">{reserva.unidadeTexto}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Horário</p>
                  <p className="font-medium text-gray-800">{new Date(reserva.dataReserva).toLocaleDateString('pt-BR')} {reserva.horaInicio.substring(0,5)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleAprovar(reserva.id)}
                  className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar
                </button>
                <button 
                  onClick={() => handleRejeitar(reserva.id)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
