import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Users, Loader2, ArrowLeft, X, Check } from 'lucide-react';
import api from '../../../services/api';

interface Reserva {
  id: string;
  areaComumId: string;
  nomeArea?: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: string;
}

interface AreaComum {
  id: string;
  nome: string;
  capacidade: number;
}

export function MoradorReservas() {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for views: 'list' | 'form' | 'success'
  const [view, setView] = useState<'list'|'form'|'success'>('list');

  // Form states
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState('14:00');
  const [fim, setFim] = useState('18:00');
  const [guestName, setGuestName] = useState('');
  const [convidados, setConvidados] = useState<{nome: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success summary
  const [summaryData, setSummaryData] = useState({ area: '', data: '', hora: '' });

  useEffect(() => {
    carregarDados();
  }, [view]);

  const carregarDados = async () => {
    try {
      const res = await api.get('/api/v1/reservas/minhas');
      setMinhasReservas(res.data);
      const resAreas = await api.get('/api/v1/areas-comuns');
      setAreas(resAreas.data);
      if (resAreas.data.length > 0 && !selectedArea) {
        setSelectedArea(resAreas.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = () => {
    if (guestName.trim()) {
      setConvidados([...convidados, { nome: guestName.trim() }]);
      setGuestName('');
    }
  };

  const handleRemoveGuest = (index: number) => {
    setConvidados(convidados.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !data || !inicio || !fim) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/v1/reservas', {
        areaComumId: selectedArea,
        dataReserva: data,
        horaInicio: inicio + ':00',
        horaFim: fim + ':00',
        convidados: convidados
      });
      
      const areaName = areas.find(a => a.id === selectedArea)?.nome || 'Área Comum';
      const formattedDate = new Date(data + 'T00:00').toLocaleDateString('pt-BR');
      setSummaryData({ area: areaName, data: formattedDate, hora: `${inicio} - ${fim}` });
      
      // Reset form
      setData('');
      setInicio('14:00');
      setFim('18:00');
      setConvidados([]);
      
      setView('success');
    } catch (err) {
      console.error(err);
      alert('Erro ao solicitar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeClass = (status: string) => {
    const base = "inline-flex items-center font-mono text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap uppercase";
    if (status === 'APROVADA') return `${base} bg-ds-success-dim text-ds-success`;
    if (status === 'REJEITADA' || status === 'CANCELADA') return `${base} bg-ds-danger-dim text-ds-danger`;
    return `${base} bg-ds-warning-dim text-ds-warning`;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.','');
  };

  // Render Views
  if (view === 'form') {
    return (
      <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans pb-10">
        <header className="sticky top-0 z-10 bg-ds-bg px-[18px] pt-8 pb-4">
          <div className="flex items-center gap-[10px]">
            <button 
              onClick={() => setView('list')}
              className="w-[34px] h-[34px] rounded-[10px] border border-ds-border bg-ds-card flex items-center justify-center text-ds-text hover:brightness-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[17px] font-extrabold m-0">Nova reserva</h1>
          </div>
        </header>

        <main className="px-[18px] flex flex-col gap-[20px]">
          
          {/* Areas */}
          <div>
            <div className="text-[11.5px] font-bold text-ds-dim uppercase tracking-wider mb-2">Qual espaço deseja reservar?</div>
            <div className="flex gap-[10px] overflow-x-auto no-scrollbar pb-1">
              {areas.map(area => {
                const isSelected = selectedArea === area.id;
                return (
                  <div 
                    key={area.id}
                    onClick={() => setSelectedArea(area.id)}
                    className={`flex-none w-[160px] p-3.5 rounded-[14px] border cursor-pointer transition-colors ${isSelected ? 'border-ds-primary bg-ds-primary-dim' : 'border-ds-border bg-ds-card'}`}
                  >
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-transparent flex items-center justify-center text-ds-text mb-2.5">
                      <CalendarDays className={`w-5 h-5 ${isSelected ? 'text-ds-primary' : 'text-ds-dim'}`} />
                    </div>
                    <div className={`text-[14px] font-extrabold ${isSelected ? 'text-ds-primary' : 'text-ds-text'}`}>{area.nome}</div>
                    <div className={`text-[11.5px] mt-1 ${isSelected ? 'text-ds-primary/70' : 'text-ds-dim'}`}>Até {area.capacidade} pessoas</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <div className="text-[11.5px] font-bold text-ds-dim uppercase tracking-wider mb-2">Data</div>
            <input 
              type="date" 
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full bg-ds-card border border-ds-border rounded-[10px] px-3.5 py-3 text-[14px] text-ds-text outline-none focus:border-ds-primary"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <div className="text-[11.5px] font-bold text-ds-dim uppercase tracking-wider mb-2">Início</div>
              <input 
                type="time" 
                value={inicio}
                onChange={e => setInicio(e.target.value)}
                className="w-full bg-ds-card border border-ds-border rounded-[10px] px-3.5 py-3 text-[14px] text-ds-text outline-none focus:border-ds-primary"
              />
            </div>
            <div>
              <div className="text-[11.5px] font-bold text-ds-dim uppercase tracking-wider mb-2">Fim</div>
              <input 
                type="time" 
                value={fim}
                onChange={e => setFim(e.target.value)}
                className="w-full bg-ds-card border border-ds-border rounded-[10px] px-3.5 py-3 text-[14px] text-ds-text outline-none focus:border-ds-primary"
              />
            </div>
          </div>

          {/* Guests */}
          <div>
            <div className="text-[11.5px] font-bold text-ds-dim uppercase tracking-wider mb-2">Lista de convidados (opcional)</div>
            <div className="flex gap-[10px]">
              <input 
                type="text" 
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Nome do convidado"
                className="flex-1 bg-ds-card border border-ds-border rounded-[10px] px-3.5 py-3 text-[14px] text-ds-text outline-none focus:border-ds-primary"
                onKeyDown={e => { if (e.key === 'Enter') handleAddGuest(); }}
              />
              <button 
                onClick={handleAddGuest}
                className="bg-ds-primary text-ds-primary-ink font-bold px-[18px] rounded-[10px] text-[14px]"
              >
                Add
              </button>
            </div>
            
            {convidados.length > 0 && (
              <div className="flex flex-wrap gap-[7px] mt-3">
                {convidados.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-[6px] px-[10px] py-[6px] bg-ds-card border border-ds-border rounded-full text-[12.5px] font-medium text-ds-text">
                    {c.nome}
                    <button onClick={() => handleRemoveGuest(i)} className="text-ds-dim hover:text-ds-danger flex items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-ds-card border border-ds-border rounded-[10px] p-[14px] mt-2">
            <p className="text-[12.5px] text-ds-primary font-medium m-0 leading-[1.4]">
              Reservas estão sujeitas à aprovação do síndico. Valores serão incluídos automaticamente no seu próximo boleto após aprovação.
            </p>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-ds-primary text-ds-primary-ink font-bold text-[15px] py-4 rounded-[12px] mt-2 flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Solicitar reserva'}
          </button>
        </main>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans p-[24px] justify-center text-center">
        <div className="w-[64px] h-[64px] bg-ds-success-dim rounded-[18px] flex items-center justify-center mx-auto mb-[20px]">
          <Check className="w-[32px] h-[32px] text-ds-success" strokeWidth={3} />
        </div>
        <h2 className="text-[22px] font-extrabold text-ds-text mb-[8px]">Solicitação enviada!</h2>
        <p className="text-[14px] text-ds-dim leading-relaxed mb-[24px]">O síndico vai analisar o pedido e você recebe uma notificação assim que houver resposta.</p>
        
        <div className="bg-ds-card border border-ds-border rounded-[14px] p-[16px] flex flex-col gap-[12px] text-left mb-[32px]">
          <div className="flex justify-between items-center">
            <span className="text-[12.5px] font-bold text-ds-dim">Área</span>
            <span className="text-[14px] font-extrabold text-ds-text">{summaryData.area}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12.5px] font-bold text-ds-dim">Data</span>
            <span className="text-[14px] font-extrabold text-ds-text">{summaryData.data}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12.5px] font-bold text-ds-dim">Horário</span>
            <span className="text-[14px] font-extrabold text-ds-text">{summaryData.hora}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12.5px] font-bold text-ds-dim">Status</span>
            <span className={getBadgeClass('PENDENTE_APROVACAO')}>PENDENTE</span>
          </div>
        </div>

        <button 
          onClick={() => setView('list')}
          className="w-full bg-ds-primary text-ds-primary-ink font-bold text-[15px] py-4 rounded-[12px]"
        >
          Ver minhas reservas
        </button>
      </div>
    );
  }

  // list view (default)
  return (
    <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans">
      <header className="px-[18px] pt-8 pb-4 flex items-center justify-between sticky top-0 bg-ds-bg z-10">
        <div>
          <p className="text-ds-dim text-[11px] font-extrabold uppercase tracking-widest mb-1">Espaços comuns</p>
          <h2 className="text-ds-text text-[24px] font-extrabold m-0">Reservas</h2>
        </div>
        <button 
          onClick={() => setView('form')}
          className="w-[46px] h-[46px] bg-ds-primary text-ds-primary-ink rounded-[14px] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </header>

      <main className="px-[18px] pb-32">
        <div className="text-[11.5px] text-ds-dim font-bold uppercase tracking-widest mt-6 mb-3.5">
          Minhas reservas atuais
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ds-dim" />
          </div>
        ) : minhasReservas.length === 0 ? (
          <div className="bg-ds-card rounded-[14px] p-8 border border-ds-border text-center shadow-sm">
            <h3 className="text-ds-text font-bold mb-1">Nenhum evento</h3>
            <p className="text-ds-dim text-[13px]">Você ainda não agendou nenhum espaço.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {minhasReservas.map(res => {
              let statusLabel = res.status;
              if (res.status === 'APROVADA') statusLabel = "APROVADO";
              else if (res.status === 'PENDENTE_APROVACAO') statusLabel = "PENDENTE";
              else if (res.status === 'REJEITADA') statusLabel = "REJEITADO";

              return (
              <div key={res.id} className="bg-ds-card border border-ds-border rounded-[14px] p-3.5 flex items-center justify-between">
                
                <div className="flex items-center gap-[14px]">
                  <div className="w-[42px] h-[42px] rounded-[10px] bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim">
                    <CalendarDays className="w-[20px] h-[20px]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold text-ds-text">{res.nomeArea}</div>
                    <div className="text-[12.5px] text-ds-dim mt-0.5">
                      {formatDateLabel(res.dataReserva)} · {res.horaInicio.substring(0,5)}h–{res.horaFim.substring(0,5)}h
                    </div>
                  </div>
                </div>

                <div className="pl-2">
                   <span className={getBadgeClass(res.status)}>
                     {statusLabel}
                   </span>
                </div>

              </div>
            )})}
          </div>
        )}
      </main>
    </div>
  );
}
