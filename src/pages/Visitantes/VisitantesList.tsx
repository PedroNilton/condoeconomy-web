import { useState, useEffect } from 'react';
import { UserCheck, Search, Users, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Controle de Acesso</h1>
          <p className="text-gray-500">Gerenciamento de visitantes e prestadores de serviço</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por nome, documento ou unidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-sm text-gray-600">Visitante / Documento</th>
                <th className="p-4 font-semibold text-sm text-gray-600">Tipo</th>
                <th className="p-4 font-semibold text-sm text-gray-600">Destino / Responsável</th>
                <th className="p-4 font-semibold text-sm text-gray-600">Status / Horários</th>
                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Carregando visitantes de hoje...</td>
                </tr>
              ) : filteredVisitantes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum visitante encontrado para hoje.</td>
                </tr>
              ) : (
                filteredVisitantes.map(visitante => (
                  <tr key={visitante.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{visitante.nome}</p>
                          <p className="text-sm text-gray-500">{visitante.documento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        visitante.tipo === 'VISITANTE' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {visitante.tipo === 'VISITANTE' ? 'Visitante' : 'Prest. de Serviço'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-800">{visitante.unidadeDestino}</p>
                      <p className="text-sm text-gray-500">Aut: {visitante.moradorResponsavel}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {visitante.status === 'AGUARDANDO' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-yellow-600">
                            <Clock className="w-4 h-4" /> Aguardando
                          </span>
                        )}
                        {visitante.status === 'NO_CONDOMINIO' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                            <UserCheck className="w-4 h-4" /> No Condomínio (Entrou {formatHora(visitante.horaEntrada)})
                          </span>
                        )}
                        {visitante.status === 'FINALIZADO' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
                            <CheckCircle2 className="w-4 h-4" /> Saiu às {formatHora(visitante.horaSaida)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {visitante.status === 'AGUARDANDO' && (
                        <button 
                          onClick={() => handleCheckin(visitante.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Registrar Entrada
                        </button>
                      )}
                      {visitante.status === 'NO_CONDOMINIO' && (
                        <button 
                          onClick={() => handleCheckout(visitante.id)}
                          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Registrar Saída
                        </button>
                      )}
                      {visitante.status === 'FINALIZADO' && (
                        <span className="text-gray-400 text-sm italic pr-4">Finalizado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
