import { useState, useEffect } from 'react';
import { CalendarDays, Loader2, Plus, Users, ArrowLeft } from 'lucide-react';
import api from '../../../services/api';

interface Area {
  id: string;
  nome: string;
  tipo: string;
  valorReserva: number;
}

interface Reserva {
  id: string;
  nomeArea: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: string;
}

export function MoradorReservas() {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [convidados, setConvidados] = useState<{ nome: string, rg: string }[]>([]);
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [reservasRes, areasRes] = await Promise.all([
        api.get('/api/v1/reservas/minhas'),
        api.get('/api/v1/areas-comuns')
      ]);
      
      const reservasSort = reservasRes.data.sort((a: Reserva, b: Reserva) => 
        new Date(a.dataReserva).getTime() - new Date(b.dataReserva).getTime()
      );
      
      setMinhasReservas(reservasSort);
      setAreas(areasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      setConvidados([...convidados, { nome: guestName.trim(), rg: '' }]);
      setGuestName('');
    }
  };

  const handleRemoveGuest = (index: number) => {
    setConvidados(convidados.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAreaId || !data || !inicio || !fim) return;

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/reservas', {
        areaComunId: selectedAreaId,
        dataReserva: data,
        horaInicio: inicio + ':00',
        horaFim: fim + ':00',
        convidados: convidados
      });
      
      await carregarDados();
      setIsFormOpen(false);
      setSelectedAreaId('');
      setData('');
      setInicio('');
      setFim('');
      setConvidados([]);
    } catch (error) {
      console.error('Erro ao solicitar reserva', error);
      alert('Erro ao solicitar reserva. Verifique conflitos de horários.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeClass = (status: string) => {
    const base = "inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider";
    if (status === 'APROVADA') return `${base} bg-ds-success-dim text-ds-success`;
    if (status === 'REJEITADA') return `${base} bg-ds-danger-dim text-ds-danger`;
    return `${base} bg-ds-disabled-bg text-ds-dim`;
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans pb-32">
        <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-ds-bg sticky top-0 z-10 border-b border-ds-border">
          <button 
            onClick={() => setIsFormOpen(false)}
            className="w-10 h-10 bg-ds-card border border-ds-border rounded-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all text-ds-text"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-ds-text text-xl font-bold tracking-tight">Nova Reserva</h2>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="px-6 pt-6 animate-in slide-in-from-right-4 duration-300">
          <div className="space-y-6">
            
            {/* Escolha o Espaço */}
            <div>
              <label className="block text-xs font-bold text-ds-faint uppercase tracking-wider mb-3">Qual espaço deseja reservar?</label>
              <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                {areas.map(area => (
                  <label 
                    key={area.id}
                    className={`flex-none w-[140px] p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
                      selectedAreaId === area.id 
                        ? 'border-ds-primary bg-ds-primary-dim' 
                        : 'border-transparent bg-ds-card'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="area" 
                      value={area.id}
                      checked={selectedAreaId === area.id}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="hidden"
                    />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAreaId === area.id ? 'bg-ds-primary text-ds-primary-ink' : 'bg-ds-disabled-bg text-ds-dim'}`}>
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold leading-tight ${selectedAreaId === area.id ? 'text-ds-primary' : 'text-ds-text'}`}>{area.nome}</h4>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-ds-faint uppercase tracking-wider mb-2">Data</label>
                <input 
                  type="date" 
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="w-full px-4 py-3.5 bg-ds-card rounded-xl border border-ds-border text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ds-faint uppercase tracking-wider mb-2">Início</label>
                <input 
                  type="time" 
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  className="w-full px-4 py-3.5 bg-ds-card rounded-xl border border-ds-border text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ds-faint uppercase tracking-wider mb-2">Fim</label>
                <input 
                  type="time" 
                  value={fim}
                  onChange={e => setFim(e.target.value)}
                  className="w-full px-4 py-3.5 bg-ds-card rounded-xl border border-ds-border text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Lista de Convidados */}
            <div className="pt-4 border-t border-ds-border">
              <label className="block text-xs font-bold text-ds-faint uppercase tracking-wider mb-3">Lista de Convidados (Opcional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome do convidado"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-ds-card rounded-xl border border-ds-border text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent transition-all outline-none text-sm"
                />
                <button onClick={handleAddGuest} type="button" className="bg-ds-primary text-ds-primary-ink px-5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm">
                  Add
                </button>
              </div>
              {convidados.length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  {convidados.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-ds-card border border-ds-border p-3.5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-ds-dim" />
                        <span className="text-sm text-ds-text font-bold">{c.nome}</span>
                      </div>
                      <button onClick={() => handleRemoveGuest(i)} type="button" className="text-ds-danger w-7 h-7 rounded-full flex items-center justify-center hover:bg-ds-danger-dim transition-colors">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dica */}
            <div className="bg-ds-card p-4 rounded-xl border border-ds-border">
              <p className="text-[11px] text-ds-dim font-medium leading-relaxed">
                Reservas estão sujeitas à aprovação do síndico. Valores serão incluídos automaticamente no seu próximo boleto após aprovação.
              </p>
            </div>
            
          </div>

          <div className="fixed bottom-6 left-6 right-6 max-w-[390px] mx-auto z-30">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-ds-primary text-ds-primary-ink font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Espaços comuns</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight">Reservas</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-12 h-12 bg-ds-primary text-ds-primary-ink rounded-xl flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </header>

      <div className="px-6 pb-32 pt-4">
        <h3 className="text-sm font-bold text-ds-text mb-4">Minhas reservas atuais</h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ds-dim" />
          </div>
        ) : minhasReservas.length === 0 ? (
          <div className="bg-ds-card rounded-[16px] p-8 border border-ds-border text-center shadow-sm">
            <div className="w-16 h-16 bg-ds-bg border border-ds-border rounded-[12px] flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-ds-dim" />
            </div>
            <h3 className="text-ds-text font-bold mb-1">Nenhum evento</h3>
            <p className="text-ds-dim text-sm">Você ainda não agendou nenhum espaço.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {minhasReservas.map(res => {
              let statusLabel = res.status;
              
              if (res.status === 'APROVADA') {
                statusLabel = "APROVADO";
              } else if (res.status === 'PENDENTE_APROVACAO') {
                statusLabel = "EM ANÁLISE";
              } else if (res.status === 'REJEITADA') {
                statusLabel = "REJEITADO";
              }

              return (
              <div key={res.id} className="bg-ds-card rounded-[16px] p-4 shadow-sm border border-ds-border relative overflow-hidden transition-all hover:border-ds-border-strong cursor-pointer flex items-center justify-between">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-ds-bg border border-ds-border rounded-xl flex items-center justify-center text-ds-primary">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ds-text text-[14.5px]">{res.nomeArea}</h4>
                    <p className="text-[11px] text-ds-dim mt-1 font-semibold">
                      {new Date(res.dataReserva).toLocaleDateString('pt-BR')} — {res.horaInicio.substring(0,5)} às {res.horaFim.substring(0,5)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                   <span className={getBadgeClass(res.status)}>
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
