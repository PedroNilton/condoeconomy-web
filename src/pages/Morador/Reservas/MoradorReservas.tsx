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
  status: string;\n  motivoRejeicao?: string;
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
  const [convidados, setConvidados] = useState<{nome: string, documento: string}[]>([]);
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddGuest = (e: React.MouseEvent) => {
    e.preventDefault();
    if(guestName.trim() === '') return;
    setConvidados([...convidados, { nome: guestName, documento: '' }]);
    setGuestName('');
  };

  const handleRemoveGuest = (index: number) => {
    setConvidados(convidados.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Busca áreas
      const areasRes = await api.get('/api/v1/reservas/areas-comuns');
      setAreas(areasRes.data);

      // Busca as reservas do próprio morador! (Todas, incluindo as pendentes)
      const reservasRes = await api.get(`/api/v1/reservas/minhas`);
      
      setMinhasReservas(reservasRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados', err);
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
        convidados
      });
      
      setIsFormOpen(false);
      setTitulo('');
      setDataSelecionada('');
      setConvidados([]);
      
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
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
        <header className="bg-white dark:bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Nova Reserva</h2>
        </header>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto pb-20">
          <div className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">O que você quer reservar?</label>
              <select 
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
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
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Título do Evento</label>
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Aniversário do João"
                className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Data do Evento</label>
              <input 
                type="date" 
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Início</label>
                <input 
                  type="time" 
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Fim</label>
                <input 
                  type="time" 
                  value={fim}
                  onChange={e => setFim(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Convidados Opcionais */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Convidados (Opcional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome do convidado"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="flex-1 p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm text-sm"
                />
                <button onClick={handleAddGuest} className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-3.5 rounded-xl font-bold hover:bg-blue-200 transition-colors">
                  + Adicionar
                </button>
              </div>
              {convidados.length > 0 && (
                <div className="flex flex-col gap-2 mt-3">
                  {convidados.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{c.nome}</span>
                      <button onClick={() => handleRemoveGuest(i)} type="button" className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
                    </div>
                  ))}
                </div>
              )}
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
    <div className="space-y-6 p-4 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-900 dark:text-blue-400" />
            Reservas
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os espaços do condomínio.</p>
        </div>
      </div>

      <div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors mb-6"
        >
          <Plus className="w-5 h-5" />
          Nova Reserva
        </button>

        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 tracking-wide uppercase">Próximos Eventos</h3>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : minhasReservas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Você não tem reservas agendadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {minhasReservas.map(res => {
              let statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
              let statusLabel = res.status;
              
              if (res.status === 'APROVADA') {
                statusColor = "bg-green-50 text-green-700 border-green-200";
                statusLabel = "Aprovada";
              } else if (res.status === 'PENDENTE_APROVACAO') {
                statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                statusLabel = "Em Revisão";
              } else if (res.status === 'REJEITADA') {
                statusColor = "bg-red-50 text-red-700 border-red-200";
                statusLabel = "Rejeitada";
              }

              return (
              <div key={res.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${res.status === 'APROVADA' ? 'bg-green-500' : res.status === 'REJEITADA' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{res.titulo}</h4>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-3">{res.nomeArea}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                      📅 {new Date(res.dataReserva).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                      ⏰ {res.horaInicio} às {res.horaFim}
                    </span>
                  </div>
                  {res.status === 'REJEITADA' && res.motivoRejeicao && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-2.5 rounded-lg">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">Motivo da recusa: {res.motivoRejeicao}</p>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

    </div>
  );
}
