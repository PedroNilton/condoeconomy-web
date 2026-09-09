import { useState, useEffect } from 'react';
import { UserCheck, Search, Users, CheckCircle2, Clock, QrCode, X } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { QRCodeCanvas } from 'qrcode.react';

interface Visitante {
  id: string;
  nome: string;
  sobrenome: string;
  documento: string;
  dataVisita: string;
  blocoDestino: string;
  unidadeDestino: string;
  moradorResponsavel: string;
  placaVeiculo: string;
  tipo: 'VISITANTE' | 'PRESTADOR_SERVICO';
  status: 'AGUARDANDO_LIBERACAO' | 'NO_CONDOMINIO' | 'FINALIZADO';
  horaEntrada?: string;
  horaSaida?: string;
}

export function VisitantesList() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useWebSocket('/topic/visitantes', () => {
    fetchVisitantes();
  });

  const fetchVisitantes = async () => {
    try {
      setLoading(true);
      const hoje = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/v1/visitantes?dataVisita=${hoje}`);
      setVisitantes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitantes();
  }, []);

  const handleCheckin = async (id: string) => {
    try {
      await api.put(`/api/v1/visitantes/${id}/checkin`);
      fetchVisitantes();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar entrada.');
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      await api.put(`/api/v1/visitantes/${id}/checkout`);
      fetchVisitantes();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar saída.');
    }
  };

  const filteredVisitantes = visitantes.filter(v => {
    const matchSearch = v.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        v.documento.includes(searchTerm) ||
                        v.unidadeDestino.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'TODOS' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatHora = (dateStr: string | null | undefined) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-900" />
            Visitantes
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Controle de acesso do dia.</p>
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou unidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>
          <select 
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="AGUARDANDO_LIBERACAO">Aguardando Chegada</option>
            <option value="NO_CONDOMINIO">No Condomínio</option>
            <option value="FINALIZADO">Visita Finalizada</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Carregando visitantes...</div>
        ) : filteredVisitantes.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Nenhum visitante encontrado.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredVisitantes.map(visitante => (
              <div key={visitante.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{visitante.nome} {visitante.sobrenome}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                        visitante.tipo === 'VISITANTE' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                      }`}>
                        {visitante.tipo === 'VISITANTE' ? 'VISITANTE' : 'PRESTADOR'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Destino</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Bl {visitante.blocoDestino} - Ap {visitante.unidadeDestino}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col gap-1.5">
                    {visitante.status === 'AGUARDANDO_LIBERACAO' && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                        <Clock className="w-3.5 h-3.5" /> Aguardando liberação da portaria
                      </span>
                    )}
                    {visitante.status === 'NO_CONDOMINIO' && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <UserCheck className="w-3.5 h-3.5" /> No Condomínio (Entrou às {formatHora(visitante.horaEntrada)})
                      </span>
                    )}
                    {visitante.status === 'FINALIZADO' && (
                      <div className="flex flex-col gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Entrou: {formatHora(visitante.horaEntrada)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 ml-4 pl-4">
                          ↳ Saiu: {formatHora(visitante.horaSaida)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {visitante.status === 'AGUARDANDO_LIBERACAO' && (
                    <button 
                      onClick={() => handleCheckin(visitante.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
                    >
                      Permitir Entrada
                    </button>
                  )}
                  {visitante.status === 'NO_CONDOMINIO' && (
                    <button 
                      onClick={() => handleCheckout(visitante.id)}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
                    >
                      Encerrar Visita
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsScannerOpen(true)}
        className="absolute bottom-20 right-4 bg-blue-600 text-white p-4 rounded-full shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition"
      >
        <QrCode className="w-6 h-6" />
      </button>

      {/* Auto-Checkin Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsScannerOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 mt-2">Auto Check-in</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Peça para o visitante ler este QR Code com a câmera do celular.</p>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-center mb-6">
              <QRCodeCanvas 
                value={`${window.location.origin}/auto-checkin`}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-xs text-blue-600 dark:text-blue-400 text-center font-medium bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
              Ele fará o cadastro e aparecerá na lista aguardando sua liberação!
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
