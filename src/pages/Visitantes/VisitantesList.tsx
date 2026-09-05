import { useState, useEffect } from 'react';
import { UserCheck, Search, Users, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Visitante {
  id: string;
  nome: string;
  documento: string;
  dataVisita: string;
  unidadeDestino: string;
  moradorResponsavel: string;
  tipo: string;
  status: string;
  horaEntrada: string | null;
  horaSaida: string | null;
}

export function VisitantesList() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS'); // TODOS, AGUARDANDO, NO_CONDOMINIO, FINALIZADO

  useWebSocket('/topic/visitantes', () => {
    fetchVisitantes();
  });

  const fetchVisitantes = async () => {
    try {
      setLoading(true);
      // Busca visitantes de hoje
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

  const formatHora = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20">
      <div className="flex justify-between items-center px-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visitantes</h1>
          <p className="text-gray-500 text-sm">Controle de acesso do dia</p>
        </div>
      </div>

      <div className="px-4">
        <div className="flex flex-col gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou unidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="AGUARDANDO">Aguardando Chegada</option>
            <option value="NO_CONDOMINIO">No Condomínio</option>
            <option value="FINALIZADO">Visita Finalizada</option>
          </select>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando visitantes...</div>
        ) : filteredVisitantes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nenhum visitante encontrado.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredVisitantes.map(visitante => (
              <div key={visitante.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{visitante.nome}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                        visitante.tipo === 'VISITANTE' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {visitante.tipo === 'VISITANTE' ? 'VISITANTE' : 'PRESTADOR'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Destino</p>
                    <p className="font-bold text-gray-800 text-sm">{visitante.unidadeDestino}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                  <div className="flex flex-col gap-1.5">
                    {visitante.status === 'AGUARDANDO' && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                        <Clock className="w-3.5 h-3.5" /> Aguardando chegada
                      </span>
                    )}
                    {visitante.status === 'NO_CONDOMINIO' && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <UserCheck className="w-3.5 h-3.5" /> No Condomínio (Entrou às {formatHora(visitante.horaEntrada)})
                      </span>
                    )}
                    {visitante.status === 'FINALIZADO' && (
                      <div className="flex flex-col gap-0.5 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Entrou: {formatHora(visitante.horaEntrada)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 ml-4 pl-4">
                          ↳ Saiu: {formatHora(visitante.horaSaida)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {visitante.status === 'AGUARDANDO' && (
                    <button 
                      onClick={() => handleCheckin(visitante.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
                    >
                      Registrar Entrada
                    </button>
                  )}
                  {visitante.status === 'NO_CONDOMINIO' && (
                    <button 
                      onClick={() => handleCheckout(visitante.id)}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
                    >
                      Registrar Saída
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
