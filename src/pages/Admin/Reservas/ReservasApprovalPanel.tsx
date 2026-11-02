import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Clock, X, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface Reserva {
  id: string;
  nomeArea?: string;
  areaComumNome?: string;
  unidade?: string;
  unidadeTexto?: string;
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
  
  // Modal de Recusa
  const [reservaParaRecusa, setReservaParaRecusa] = useState<Reserva | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [recusando, setRecusando] = useState(false);
  const [erroRecusa, setErroRecusa] = useState<string | null>(null);

  useWebSocket('/topic/reservas', () => {
    fetchReservas();
  });

  const fetchReservas = async () => {
    try {
      setLoading(true);
      // Busca todas as reservas pendentes independentemente da data
      const res = await api.get('/api/v1/reservas?status=PENDENTE_APROVACAO');
      const lista = (Array.isArray(res.data) ? res.data : []).map((r: any) => ({
        ...r,
        areaComumNome: r.areaComumNome || r.nomeArea || 'Área Comum',
        unidadeTexto: r.unidadeTexto || r.unidade || 'Unidade'
      }));
      setReservas(lista);
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
      alert('Erro ao aprovar reserva.');
    }
  };

  const handleAbrirRecusa = (reserva: Reserva) => {
    setReservaParaRecusa(reserva);
    setMotivoRecusa('');
    setErroRecusa(null);
  };

  const handleConfirmarRecusa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaParaRecusa) return;
    setErroRecusa(null);

    if (!motivoRecusa.trim()) {
      setErroRecusa('O motivo da recusa é obrigatório.');
      return;
    }

    if (contemAmeacas(motivoRecusa)) {
      setErroRecusa('O motivo informado contém caracteres não permitidos.');
      return;
    }

    setRecusando(true);
    try {
      const motivoLimpo = sanitizarEntrada(motivoRecusa, 300);
      await api.put(`/api/v1/reservas/${reservaParaRecusa.id}/rejeitar`, { motivo: motivoLimpo });
      setReservaParaRecusa(null);
      fetchReservas();
    } catch (err: any) {
      setErroRecusa(err.response?.data?.message || 'Erro ao rejeitar reserva.');
    } finally {
      setRecusando(false);
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
                  onClick={() => handleAbrirRecusa(reserva)}
                  className="flex-1 bg-ds-bg border border-ds-border text-ds-text font-bold py-3 rounded-[9px] hover:bg-ds-danger-dim hover:text-ds-danger hover:border-ds-danger/30 transition flex items-center justify-center gap-2 text-[13.5px]"
                >
                  <XCircle className="w-4 h-4" /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Recusa com Motivo Obrigatório */}
      {reservaParaRecusa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-ds-border bg-ds-bg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-ds-danger" />
                <h3 className="font-bold text-ds-text">Recusar Reserva</h3>
              </div>
              <button 
                onClick={() => setReservaParaRecusa(null)}
                className="text-ds-dim hover:text-ds-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRecusa} className="p-5 space-y-4">
              <p className="text-xs text-ds-dim">
                Informe o motivo da recusa para <strong>{reservaParaRecusa.moradorSolicitante}</strong> ({reservaParaRecusa.areaComumNome}).
              </p>

              <div>
                <label className="block text-xs font-bold text-ds-dim uppercase tracking-wider mb-1.5">
                  Motivo da Recusa (Obrigatório)
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  placeholder="Ex: Área em manutenção técnica na data solicitada."
                  className="w-full bg-ds-bg border border-ds-border text-ds-text rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ds-danger focus:border-transparent placeholder:text-ds-dim transition-all"
                />
              </div>

              {erroRecusa && (
                <div className="p-3 bg-ds-danger-dim border border-ds-danger/20 rounded-xl text-xs text-ds-danger font-medium">
                  {erroRecusa}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReservaParaRecusa(null)}
                  className="px-4 py-2.5 rounded-xl border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recusando}
                  className="px-5 py-2.5 rounded-xl bg-ds-danger text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {recusando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Recusa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
