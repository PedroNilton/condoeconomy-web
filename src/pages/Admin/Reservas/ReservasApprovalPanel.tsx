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
      <div className="flex h-full items-center justify-center bg-ds-bg">
        <Loader2 className="w-8 h-8 text-ds-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Aprovações</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight flex items-center gap-2">
            Reservas Pendentes
          </h2>
        </div>
      </div>

      {reservas.length === 0 ? (
        <div className="bg-ds-card p-8 rounded-[16px] text-center shadow-sm border border-ds-border">
          <div className="w-16 h-16 bg-ds-success-dim border border-ds-success/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-ds-success" />
          </div>
          <p className="text-ds-text font-bold mb-1">Tudo em dia!</p>
          <p className="text-ds-dim text-sm">Não há reservas aguardando sua aprovação.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map(reserva => (
            <div key={reserva.id} className="bg-ds-card p-5 rounded-[16px] shadow-sm border border-ds-border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider bg-ds-warning-dim text-ds-warning mb-2">
                    <Clock className="w-3 h-3" /> Pendente
                  </span>
                  <h3 className="font-bold text-ds-text text-[15px]">{reserva.titulo}</h3>
                  <p className="text-[13.5px] text-ds-dim mt-0.5">{reserva.areaComumNome}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-5 text-[13px] text-ds-dim bg-ds-bg p-3 rounded-xl border border-ds-border">
                <div>
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-0.5">Morador</p>
                  <p className="font-bold text-ds-text">{reserva.moradorSolicitante}</p>
                  <p className="text-xs">{reserva.unidadeTexto}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-0.5">Horário</p>
                  <p className="font-bold text-ds-text">{new Date(reserva.dataReserva).toLocaleDateString('pt-BR')}</p>
                  <p className="text-xs">{reserva.horaInicio.substring(0,5)} às {reserva.horaFim.substring(0,5)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleAprovar(reserva.id)}
                  className="flex-1 bg-ds-success text-ds-bg font-bold py-3 rounded-[9px] hover:brightness-110 transition flex items-center justify-center gap-2 text-[13.5px] shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar
                </button>
                <button 
                  onClick={() => handleRejeitar(reserva.id)}
                  className="flex-1 bg-ds-bg border border-ds-border text-ds-text font-bold py-3 rounded-[9px] hover:bg-ds-danger-dim hover:text-ds-danger hover:border-ds-danger/30 transition flex items-center justify-center gap-2 text-[13.5px]"
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
