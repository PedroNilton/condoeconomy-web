import { useState, useEffect } from 'react';
import { CalendarDays, Loader2, Plus, ArrowLeft } from 'lucide-react';
import api from '../../../services/api';

interface AreaComum {
  id: string;
  nome: string;
  capacidade: number;
}

interface Reserva {
  id: string;
  areaComumId: string;
  areaComumNome: string;
  titulo: string;
  data: string;
  inicio: string;
  fim: string;
  unidade: string;
  morador: string;
  status: string;
}

export function MoradorReservas() {
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [selectedArea, setSelectedArea] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [titulo, setTitulo] = useState('');
  const [inicio, setInicio] = useState('10:00');
  const [fim, setFim] = useState('18:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Busca áreas
      const areasRes = await api.get('/api/v1/reservas/areas-comuns');
      setAreas(areasRes.data);

      // Para o MVP, vamos buscar as reservas do dia atual para popular a lista,
      // idealmente teríamos uma rota /api/v1/reservas/minhas
      // Aqui vamos simular pegando reservas de vários dias e filtrando pelo morador
      
      // Simulação: buscar reservas do mês atual (gambiarra MVP)
      const dataHoje = new Date().toISOString().split('T')[0];
      const reservasRes = await api.get(`/api/v1/reservas?data=${dataHoje}`);
      
      // Filtra apenas do apartamento
      const filtered = reservasRes.data.filter((r: Reserva) => r.unidade === 'Apto 101 - Bloco B');
      setMinhasReservas(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !dataSelecionada || !titulo || !inicio || !fim) return;

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/reservas', {
        areaComumId: selectedArea,
        unidade: 'Apto 101 - Bloco B',
        morador: 'Carlos Silva',
        titulo,
        data: dataSelecionada,
        inicio,
        fim,
        convidados: [] // Lista vazia para o MVP
      });
      
      setIsFormOpen(false);
      setTitulo('');
      setDataSelecionada('');
      
      // Atualiza lista
      fetchData();
      alert('Reserva solicitada com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erro ao realizar reserva. Verifique a disponibilidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col h-full bg-gray-50 relative">
        <header className="bg-white p-4 flex items-center gap-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800 p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-800">Nova Reserva</h2>
        </header>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto pb-20">
          <div className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">O que você quer reservar?</label>
              <select 
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="w-full p-3.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                required
              >
                <option value="">Selecione uma área...</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.nome} (Capacidade: {area.capacidade} pessoas)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Título do Evento</label>
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Aniversário do João"
                className="w-full p-3.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Data do Evento</label>
              <input 
                type="date" 
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Início</label>
                <input 
                  type="time" 
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  className="w-full p-3.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Fim</label>
                <input 
                  type="time" 
                  value={fim}
                  onChange={e => setFim(e.target.value)}
                  className="w-full p-3.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
              <CalendarDays className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                As reservas estão sujeitas a aprovação da administração. Caso a data já esteja ocupada, você será notificado no momento da solicitação.
              </p>
            </div>
            
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-8"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Header Fixo */}
      <header className="bg-white pt-10 pb-4 px-6 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Minhas Reservas
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Gerencie os espaços do condomínio</p>
        </div>
      </header>

      {/* Botão Flutuante (FAB) */}
      <div className="p-6">
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors mb-6"
        >
          <Plus className="w-5 h-5" />
          Nova Reserva
        </button>

        <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide uppercase">Próximos Eventos</h3>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : minhasReservas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Você não tem reservas agendadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {minhasReservas.map(res => (
              <div key={res.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 text-sm">{res.titulo}</h4>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md border bg-yellow-50 text-yellow-700 border-yellow-200 uppercase">
                      {res.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-3">{res.areaComumNome}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-gray-50 px-2 py-1 rounded">
                      📅 {new Date(res.data).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="bg-gray-50 px-2 py-1 rounded">
                      ⏰ {res.inicio} às {res.fim}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
