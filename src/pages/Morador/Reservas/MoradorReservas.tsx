import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Loader2, X, Check } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  IconButton,
  IconChip,
  InfoBanner,
  ListCard,
  PageHead,
  Toast,
} from '../../../components/ui';

interface Reserva {
  id: string;
  areaComumId: string;
  nomeArea?: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  motivoRejeicao?: string;
}

interface AreaComum {
  id: string;
  nome: string;
  capacidadeMaxima?: number;
  capacidade?: number;
  taxaLocacao?: number;
}

export function MoradorReservas() {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'list' | 'form' | 'success'>('list');

  const [selectedArea, setSelectedArea] = useState<string>('');
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState('14:00');
  const [fim, setFim] = useState('18:00');
  const [guestName, setGuestName] = useState('');
  const [convidados, setConvidados] = useState<{ nome: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState({ area: '', data: '', hora: '' });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  useEffect(() => {
    carregarDados();
  }, [view]);

  const carregarDados = async () => {
    try {
      const res = await api.get('/api/v1/reservas/minhas');
      setMinhasReservas(res.data);
      const resAreas = await api.get('/api/v1/reservas/areas-comuns');
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
      if (contemAmeacas(guestName)) {
        showToast('Nome de convidado contém caracteres inválidos.');
        return;
      }
      const nomeLimpo = sanitizarEntrada(guestName, 100);
      if (!nomeLimpo) return;
      setConvidados([...convidados, { nome: nomeLimpo }]);
      setGuestName('');
    }
  };

  const handleRemoveGuest = (index: number) => {
    setConvidados(convidados.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !data || !inicio || !fim) {
      showToast('Preencha espaço, data e horário.');
      return;
    }
    if (fim <= inicio) {
      showToast('O horário de término deve ser posterior ao horário de início.');
      return;
    }
    setIsSubmitting(true);
    try {
      const areaName = areas.find((a) => a.id === selectedArea)?.nome || 'Área Comum';
      await api.post('/api/v1/reservas', {
        areaComumId: selectedArea,
        titulo: sanitizarEntrada(`Reserva - ${areaName}`, 120),
        data,
        inicio: inicio.length === 5 ? inicio + ':00' : inicio,
        fim: fim.length === 5 ? fim + ':00' : fim,
        convidados: convidados.map((c) => ({
          nome: sanitizarEntrada(c.nome, 100),
          documento: 'N/A',
        })),
      });

      const formattedDate = new Date(data + 'T00:00').toLocaleDateString('pt-BR');
      setSummaryData({ area: areaName, data: formattedDate, hora: `${inicio} - ${fim}` });

      setData('');
      setInicio('14:00');
      setFim('18:00');
      setConvidados([]);

      setView('success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao solicitar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APROVADA') return <Badge tone="ok">APROVADO</Badge>;
    if (status === 'REJEITADA' || status === 'CANCELADA')
      return <Badge tone="bad">{status === 'REJEITADA' ? 'REJEITADO' : 'CANCELADA'}</Badge>;
    return <Badge tone="warn">PENDENTE</Badge>;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00');
    return d
      .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
      .replace('.', '');
  };

  if (view === 'form') {
    return (
      <div className="flex flex-col min-h-full bg-canvas text-ink pb-10">
        <PageHead title="Nova reserva" onBack={() => setView('list')} />

        <main className="px-[18px] mt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2">
                Qual espaço deseja reservar?
              </p>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {areas.map((area) => {
                  const isSelected = selectedArea === area.id;
                  return (
                    <button
                      type="button"
                      key={area.id}
                      onClick={() => setSelectedArea(area.id)}
                      className={`flex-none w-[160px] p-3.5 rounded-[14px] border text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-brand bg-brand-soft'
                          : 'border-line bg-surface hover:border-line-strong'
                      }`}
                    >
                      <div className="mb-2.5">
                        <CalendarDays
                          className={`w-5 h-5 ${isSelected ? 'text-brand' : 'text-dim'}`}
                        />
                      </div>
                      <div
                        className={`text-[14px] font-extrabold truncate ${
                          isSelected ? 'text-brand' : 'text-ink'
                        }`}
                      >
                        {area.nome}
                      </div>
                      <div className="text-[11.5px] text-dim mt-0.5">
                        Até {area.capacidadeMaxima ?? area.capacidade ?? 20} pessoas
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field
              label="Data"
              type="date"
              required
              surface="surface"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <Field
                label="Início"
                type="time"
                required
                surface="surface"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
              <Field
                label="Fim"
                type="time"
                required
                surface="surface"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>

            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-1.5">
                Lista de convidados (opcional)
              </p>
              <div className="flex gap-2">
                <Field
                  type="text"
                  surface="surface"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nome do convidado"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGuest();
                    }
                  }}
                />
                <Button variant="primary" onClick={handleAddGuest} className="shrink-0">
                  Add
                </Button>
              </div>

              {convidados.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {convidados.map((c, i) => (
                    <span
                      key={`${c.nome}-${i}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-line rounded-full text-[12px] font-semibold text-ink"
                    >
                      {c.nome}
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(i)}
                        className="text-dim hover:text-bad flex items-center justify-center cursor-pointer"
                        aria-label={`Remover ${c.nome}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <InfoBanner tone="brand">
              Reservas estão sujeitas à aprovação do síndico. Valores serão incluídos automaticamente no seu próximo boleto após aprovação.
            </InfoBanner>

            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Solicitar reserva'}
            </Button>
          </form>
        </main>

        <Toast message={toastMsg} hasBottomNav={false} />
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="flex flex-col min-h-full bg-canvas text-ink px-6 py-10 justify-center text-center">
        <div className="w-16 h-16 bg-ok-soft rounded-[18px] flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-ok" strokeWidth={2.5} />
        </div>
        <h2 className="text-[21px] font-extrabold text-ink mb-2">Solicitação enviada!</h2>
        <p className="text-[13.5px] text-dim leading-relaxed mb-6">
          O síndico vai analisar o pedido e você recebe uma notificação assim que houver resposta.
        </p>

        <ListCard className="text-left mb-7">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[12.5px] font-semibold text-dim">Área</span>
              <span className="text-[13.5px] font-extrabold text-ink">{summaryData.area}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12.5px] font-semibold text-dim">Data</span>
              <span className="font-mono text-[13.5px] font-bold text-ink">{summaryData.data}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12.5px] font-semibold text-dim">Horário</span>
              <span className="font-mono text-[13.5px] font-bold text-ink">{summaryData.hora}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12.5px] font-semibold text-dim">Status</span>
              <Badge tone="warn">PENDENTE</Badge>
            </div>
          </div>
        </ListCard>

        <Button variant="primary" fullWidth onClick={() => setView('list')}>
          Ver minhas reservas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-canvas text-ink pb-8">
      <PageHead
        eyebrow="Espaços comuns"
        title="Reservas"
        action={
          <IconButton
            label="Nova reserva"
            onClick={() => setView('form')}
            className="!bg-brand !border-brand !text-brand-ink hover:!bg-brand-hover"
          >
            <Plus className="w-5 h-5" />
          </IconButton>
        }
      />

      <main className="px-[18px] mt-2">
        <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2.5 pl-1">
          Minhas reservas atuais
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : minhasReservas.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-6 h-6" />}
            title="Nenhum evento"
            description="Você ainda não agendou nenhum espaço."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {minhasReservas.map((res) => (
              <ListCard key={res.id} tone={res.status === 'REJEITADA' ? 'bad' : 'default'}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <IconChip tone="neutral" size="lg">
                      <CalendarDays className="w-5 h-5" />
                    </IconChip>
                    <div className="min-w-0">
                      <div className="text-[14px] font-extrabold text-ink truncate">
                        {res.nomeArea}
                      </div>
                      <div className="text-[12px] text-dim mt-0.5 truncate">
                        {formatDateLabel(res.dataReserva)} · {res.horaInicio.substring(0, 5)}h–
                        {res.horaFim.substring(0, 5)}h
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">{getStatusBadge(res.status)}</div>
                </div>
                {res.status === 'REJEITADA' && res.motivoRejeicao && (
                  <div className="mt-2.5 pt-2.5 border-t border-line text-[12px] text-bad leading-relaxed">
                    <span className="font-bold">Motivo da recusa:</span> {res.motivoRejeicao}
                  </div>
                )}
              </ListCard>
            ))}
          </div>
        )}
      </main>

      <Toast message={toastMsg} />
    </div>
  );
}
