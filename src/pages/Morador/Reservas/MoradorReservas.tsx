import { useState, useEffect } from 'react';
import { CalendarDays, Loader2, Plus, ArrowLeft, Users, ChevronRight } from 'lucide-react';
import api from '../../../services/api';

interface Reserva {
  id: string;
  titulo: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  motivoRejeicao?: string;
  areaComumId: string;
  nomeArea: string;
}

interface AreaComum {
  id: string;
  nome: string;
  descricao: string;
  capacidade: number;
  valorReserva: number;
}

export function MoradorReservas() {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [areasComuns, setAreasComuns] = useState<AreaComum[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States do Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [areaId, setAreaId] = useState('');
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [convidados, setConvidados] = useState<{nome: string, rg: string}[]>([]);
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [resReservas, resAreas] = await Promise.all([
        api.get('/api/v1/reservas'),
        api.get('/api/v1/areas-comuns')
      ]);
      
      const list = resReservas.data;
      list.sort((a: Reserva, b: Reserva) => new Date(a.dataReserva).getTime() - new Date(b.dataReserva).getTime());
      
      setMinhasReservas(list);
      setAreasComuns(resAreas.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = (e: React.MouseEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setConvidados([...convidados, { nome: guestName, rg: '' }]);
      setGuestName('');
    }
  };

  const handleRemoveGuest = (index: number) => {
    setConvidados(convidados.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/v1/reservas', {
        areaComumId: areaId,
        titulo: titulo,
        dataReserva: data,
        horaInicio: inicio,
        horaFim: fim,
        convidados: convidados
      });
      
      setIsFormOpen(false);
      fetchDados();
      // Reset
      setTitulo(''); setAreaId(''); setData(''); setInicio(''); setFim(''); setConvidados([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao solicitar reserva. Verifique a disponibilidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col min-h-full bg-[#09090b] text-white">
        <header className="pt-12 pb-6 px-6 sticky top-0 z-20 bg-[#09090b] flex items-center gap-4">
          <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center text-white hover:bg-[#27272a] transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Nova Reserva</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Agende um espaço</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="p-6 pb-32">
          
          <div className="space-y-6">
            
            {/* Título do Evento */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título do Evento</label>
              <input 
                type="text" 
                placeholder="Ex: Aniversário da Maria"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#18181b] rounded-xl border border-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none shadow-sm"
                required
              />
            </div>

            {/* Seleção de Espaço (Carrossel Horizontal) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Qual espaço?</label>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                {areasComuns.map(area => (
                  <label key={area.id} className={`flex-none w-56 relative bg-[#18181b] rounded-2xl p-4 border transition-all shadow-sm cursor-pointer ${areaId === area.id ? 'border-white/40 ring-2 ring-white/10' : 'border-white/5 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name="area" 
                      value={area.id}
                      checked={areaId === area.id}
                      onChange={(e) => setAreaId(e.target.value)}
                      className="hidden"
                      required
                    />
                    <div className="w-10 h-10 bg-[#27272a] rounded-xl flex items-center justify-center text-slate-300 mb-3">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm">{area.nome}</h4>
                    <p className="text-xs text-slate-400 mt-1">Capacidade: {area.capacidade}</p>
                    {area.valorReserva > 0 && <p className="text-xs font-bold text-white mt-2">R$ {area.valorReserva.toFixed(2)}</p>}
                  </label>
                ))}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data</label>
                <input 
                  type="date" 
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#18181b] rounded-xl border border-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Início</label>
                <input 
                  type="time" 
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#18181b] rounded-xl border border-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fim</label>
                <input 
                  type="time" 
                  value={fim}
                  onChange={e => setFim(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#18181b] rounded-xl border border-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Lista de Convidados */}
            <div className="pt-4 border-t border-white/5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Lista de Convidados (Opcional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome do convidado"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-[#18181b] rounded-xl border border-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none text-sm"
                />
                <button onClick={handleAddGuest} className="bg-slate-200 text-slate-900 px-5 rounded-xl font-bold hover:bg-white active:scale-95 transition-all shadow-sm">
                  Add
                </button>
              </div>
              {convidados.length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  {convidados.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#18181b] border border-white/5 p-3.5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-200 font-bold">{c.nome}</span>
                      </div>
                      <button onClick={() => handleRemoveGuest(i)} type="button" className="text-rose-500 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dica */}
            <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Reservas estão sujeitas à aprovação do síndico. Valores serão incluídos automaticamente no seu próximo boleto após aprovação.
              </p>
            </div>
            
          </div>

          <div className="fixed bottom-6 left-6 right-6 max-w-[390px] mx-auto z-30">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#09090b] text-white">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium">Espaços comuns</p>
          <h2 className="text-white text-2xl font-bold tracking-tight">Reservas</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-12 h-12 bg-slate-100 text-slate-900 rounded-[1.2rem] flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </header>

      <div className="px-6 pb-32 pt-4">
        <h3 className="text-sm font-bold text-white mb-4">Minhas reservas atuais</h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : minhasReservas.length === 0 ? (
          <div className="bg-[#18181b] rounded-3xl p-8 border border-white/5 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#27272a] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-white font-bold mb-1">Nenhum evento</h3>
            <p className="text-slate-400 text-sm">Você ainda não agendou nenhum espaço.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {minhasReservas.map(res => {
              let statusColor = "text-orange-500";
              let statusLabel = res.status;
              
              if (res.status === 'APROVADA') {
                statusColor = "text-emerald-500";
                statusLabel = "APROVADO";
              } else if (res.status === 'PENDENTE_APROVACAO') {
                statusColor = "text-orange-500";
                statusLabel = "EM ANÁLISE";
              } else if (res.status === 'REJEITADA') {
                statusColor = "text-rose-500";
                statusLabel = "REJEITADO";
              }

              return (
              <div key={res.id} className="bg-[#18181b] rounded-[1.5rem] p-4 shadow-sm border border-white/5 relative overflow-hidden transition-all hover:bg-[#1f1f22] cursor-pointer flex items-center justify-between">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#27272a] rounded-2xl flex items-center justify-center text-slate-300">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[15px]">{res.nomeArea}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      {new Date(res.dataReserva).toLocaleDateString('pt-BR')} • {res.horaInicio.substring(0,5)} às {res.horaFim.substring(0,5)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                   <span className={`text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                     {statusLabel}
                   </span>
                </div>

              </div>
            )})}
          </div>
        )}
      </div>

    </div>
  );
}
