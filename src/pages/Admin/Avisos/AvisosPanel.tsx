import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  ShieldCheck,
  Calendar,
  MessageSquareWarning,
  FileText,
  Pin,
  MoreVertical,
  Plus,
  Megaphone,
} from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  GroupedList,
  IconChip,
  InlineConfirm,
  ListRow,
  StatCard,
  TextAreaField,
  Toast,
  Toggle,
} from '../../../components/ui';

interface NoticeItem {
  id: string | number;
  titulo: string;
  mensagem: string;
  autor: string;
  dataCriacao: string;
  categoria?: string;
  pinned?: boolean;
  seen?: number;
  total?: number;
  menu?: 'closed' | 'open' | 'confirm';
}

const TOTAL_UNIDADES = 168;
const PER_BLOCK = 12;

const CATEGORIA_OPTIONS = [
  { value: 'Aviso geral', label: 'Aviso geral' },
  { value: 'Manutenção', label: 'Manutenção' },
  { value: 'Limpeza', label: 'Limpeza' },
  { value: 'Segurança', label: 'Segurança' },
  { value: 'Evento', label: 'Evento' },
  { value: 'Financeiro', label: 'Financeiro' },
] as const;

const AUDIENCIA_OPTIONS = [
  { value: 'all', label: 'Todo o condomínio' },
  { value: 'blocks', label: 'Blocos específicos' },
] as const;

export function AvisosPanel() {
  const navigate = useNavigate();
  const { counts } = useNotification();

  const [userName, setUserName] = useState('Ana Laura');
  const [condoName, setCondoName] = useState('Condomínio Mar Egeu');
  const [avisos, setAvisos] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [visitantesHoje, setVisitantesHoje] = useState(5);
  const [reservasHoje, setReservasHoje] = useState(2);
  const [boletosVencidosCount, setBoletosVencidosCount] = useState(6);
  const [valorVencido, setValorVencido] = useState(2880.0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [categoria, setCategoria] = useState('Aviso geral');
  const [audiencia, setAudiencia] = useState<'all' | 'blocks'>('all');
  const [selectedBlocks, setSelectedBlocks] = useState<Record<string, boolean>>({});
  const [fixarNoTopo, setFixarNoTopo] = useState(false);
  const [notificarAgora, setNotificarAgora] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [pinnedMap, setPinnedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('@HabitOS:pinnedAvisos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const fetchAvisos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/avisos');
      if (Array.isArray(res.data)) {
        const mapped: NoticeItem[] = res.data.map(
          (
            item: {
              id?: string | number;
              titulo?: string;
              mensagem?: string;
              autor?: string;
              dataCriacao?: string;
            },
            idx: number,
          ) => {
            const id = item.id || `aviso-${idx}`;
            let cat = 'Aviso geral';
            const t = (item.titulo || '').toLowerCase();
            if (t.includes('manutenção') || t.includes('piscina') || t.includes('elevador'))
              cat = 'Manutenção';
            else if (t.includes('limpeza') || t.includes('garagem')) cat = 'Limpeza';
            else if (t.includes('segurança') || t.includes('portaria') || t.includes('acesso'))
              cat = 'Segurança';
            else if (t.includes('assembleia') || t.includes('reunião') || t.includes('festa'))
              cat = 'Evento';
            else if (t.includes('boleto') || t.includes('taxa') || t.includes('cota'))
              cat = 'Financeiro';

            const seen = 90 + Math.floor(Math.sin(idx + 1) * 30) + idx * 15;
            return {
              id,
              titulo: item.titulo || '',
              mensagem: item.mensagem || '',
              autor: item.autor || 'Síndico',
              dataCriacao: item.dataCriacao || new Date().toISOString(),
              categoria: cat,
              pinned: !!pinnedMap[String(id)],
              seen: Math.min(seen, TOTAL_UNIDADES),
              total: TOTAL_UNIDADES,
              menu: 'closed',
            };
          },
        );
        setAvisos(mapped);
      }
    } catch (err) {
      console.error('Erro ao buscar avisos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const resVisitantes = await api.get(`/api/v1/visitantes?dataVisita=${hoje}`);
      if (Array.isArray(resVisitantes.data)) {
        setVisitantesHoje(resVisitantes.data.length || 5);
      }
    } catch {
      // fallback
    }

    try {
      const resReservas = await api.get('/api/v1/reservas');
      if (Array.isArray(resReservas.data)) {
        const hojeStr = new Date().toISOString().split('T')[0];
        const deHoje = resReservas.data.filter(
          (r: { dataReserva?: string }) => r.dataReserva === hojeStr,
        ).length;
        setReservasHoje(deHoje || 2);
      }
    } catch {
      // fallback
    }

    try {
      const resFinancas = await api.get('/api/v1/financas/dashboard');
      if (resFinancas.data) {
        if (resFinancas.data.unidadesInadimplentes !== undefined) {
          setBoletosVencidosCount(resFinancas.data.unidadesInadimplentes || 6);
        }
        if (resFinancas.data.inadimplencia !== undefined) {
          setValorVencido(resFinancas.data.inadimplencia || 2880.0);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('@HabitOS:user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.nome) setUserName(u.nome);
        if (u?.condominioNome) setCondoName(u.condominioNome);
      }
    } catch {
      // mantém padrões
    }

    fetchAvisos();
    fetchMetricas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${saudacao}, ${userName}`;
  }, [userName]);

  const todayFormatted = useMemo(() => {
    const dataExtenso = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return `${dataExtenso} · ${condoName}`;
  }, [condoName]);

  const sortedAvisos = useMemo(() => {
    return [...avisos].sort((a, b) => {
      const aPinned = pinnedMap[String(a.id)] || a.pinned ? 1 : 0;
      const bPinned = pinnedMap[String(b.id)] || b.pinned ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      const timeA = new Date(a.dataCriacao).getTime();
      const timeB = new Date(b.dataCriacao).getTime();
      return timeB - timeA;
    });
  }, [avisos, pinnedMap]);

  const reachUnits = useMemo(() => {
    if (audiencia === 'all') return TOTAL_UNIDADES;
    const blocksCount = Object.keys(selectedBlocks).filter((k) => selectedBlocks[k]).length;
    return blocksCount * PER_BLOCK;
  }, [audiencia, selectedBlocks]);

  const canPublish =
    novoTitulo.trim().length > 0 && novaMensagem.trim().length > 0 && reachUnits > 0;

  const toggleMenu = (id: string | number) => {
    setAvisos((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return { ...n, menu: n.menu === 'closed' || !n.menu ? 'open' : 'closed' };
        }
        return { ...n, menu: 'closed' };
      }),
    );
  };

  const togglePin = (id: string | number) => {
    const isCurrentlyPinned = !!pinnedMap[String(id)];
    const updated = { ...pinnedMap, [String(id)]: !isCurrentlyPinned };
    setPinnedMap(updated);
    localStorage.setItem('@HabitOS:pinnedAvisos', JSON.stringify(updated));

    setAvisos((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !isCurrentlyPinned, menu: 'closed' } : n)),
    );
    showToast(!isCurrentlyPinned ? 'Aviso fixado no topo' : 'Aviso desafixado');
  };

  const askDelete = (id: string | number) => {
    setAvisos((prev) => prev.map((n) => (n.id === id ? { ...n, menu: 'confirm' } : n)));
  };

  const cancelDelete = (id: string | number) => {
    setAvisos((prev) => prev.map((n) => (n.id === id ? { ...n, menu: 'closed' } : n)));
  };

  const handleDelete = async (id: string | number) => {
    try {
      await api.delete(`/api/v1/avisos/${id}`);
    } catch {
      // ignora erro se for mock local
    }
    setAvisos((prev) => prev.filter((n) => n.id !== id));
    showToast('Aviso excluído');
  };

  const handlePublish = async () => {
    if (!canPublish || publishing) return;

    if (contemAmeacas(novoTitulo) || contemAmeacas(novaMensagem)) {
      showToast('Entrada inválida detectada');
      return;
    }

    try {
      setPublishing(true);
      const res = await api.post('/api/v1/avisos', {
        titulo: sanitizarEntrada(novoTitulo),
        mensagem: sanitizarEntrada(novaMensagem),
        autor: userName || 'Síndico',
      });

      const newId = res.data?.id || `aviso-${Date.now()}`;
      if (fixarNoTopo) {
        const updated = { ...pinnedMap, [String(newId)]: true };
        setPinnedMap(updated);
        localStorage.setItem('@HabitOS:pinnedAvisos', JSON.stringify(updated));
      }

      const novoAviso: NoticeItem = {
        id: newId,
        titulo: novoTitulo.trim(),
        mensagem: novaMensagem.trim(),
        autor: userName || 'Síndico',
        dataCriacao: new Date().toISOString(),
        categoria,
        pinned: fixarNoTopo,
        seen: 0,
        total: reachUnits,
        menu: 'closed',
      };

      setAvisos((prev) => [novoAviso, ...prev]);
      setIsSheetOpen(false);
      setNovoTitulo('');
      setNovaMensagem('');
      setSelectedBlocks({});
      setFixarNoTopo(false);

      showToast(
        `Aviso publicado para ${reachUnits} unidades${notificarAgora ? ' · push enviado' : ''}`,
      );
    } catch {
      showToast('Erro ao publicar aviso');
    } finally {
      setPublishing(false);
    }
  };

  const formatNoticeDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${mon}/${year}`;
    } catch {
      return isoStr;
    }
  };

  const selectedBlocksCount = Object.keys(selectedBlocks).filter((k) => selectedBlocks[k]).length;

  return (
    <div className="flex flex-col gap-[22px]">
      {/* 1. Saudação e atalhos */}
      <section>
        <h1 className="text-[22px] font-extrabold m-0 tracking-[-0.01em] text-ink leading-tight">
          {greetingText}
        </h1>
        <p className="text-[12.5px] text-dim mt-1 m-0">{todayFormatted}</p>

        <div className="flex gap-2 overflow-x-auto mt-3.5 no-scrollbar">
          <button
            type="button"
            onClick={() => navigate('/admin/moradores')}
            className="shrink-0 flex items-center gap-[7px] h-[38px] px-[13px] rounded-full border border-line bg-surface text-ink text-[12.5px] font-bold cursor-pointer hover:border-brand hover:text-brand transition-colors"
          >
            <Users className="w-[15px] h-[15px] text-dim" />
            Moradores
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/condostore')}
            className="shrink-0 flex items-center gap-[7px] h-[38px] px-[13px] rounded-full border border-line bg-surface text-ink text-[12.5px] font-bold cursor-pointer hover:border-brand hover:text-brand transition-colors"
          >
            <Package className="w-[15px] h-[15px] text-dim" />
            CondoStore
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/auditoria')}
            className="shrink-0 flex items-center gap-[7px] h-[38px] px-[13px] rounded-full border border-line bg-surface text-ink text-[12.5px] font-bold cursor-pointer hover:border-brand hover:text-brand transition-colors"
          >
            <ShieldCheck className="w-[15px] h-[15px] text-dim" />
            Auditoria
          </button>
        </div>
      </section>

      {/* 2. Precisa da sua atenção */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint mb-2.5 m-0">
          Precisa da sua atenção
        </p>
        <GroupedList>
          <ListRow
            icon={
              <IconChip tone="warn" size="md">
                <Calendar className="w-[17px] h-[17px]" />
              </IconChip>
            }
            title="Reservas para aprovar"
            subtitle={
              counts.reservasAdmin > 0
                ? 'A mais antiga espera há 1 dia'
                : 'Nenhuma pendente no momento'
            }
            right={
              <span className="font-mono text-[20px] font-semibold text-ink">
                {counts.reservasAdmin}
              </span>
            }
            onClick={() => navigate('/admin/reservas')}
            showChevron
          />
          <ListRow
            icon={
              <IconChip tone="bad" size="md">
                <MessageSquareWarning className="w-[17px] h-[17px]" />
              </IconChip>
            }
            title="Chamados abertos"
            subtitle={counts.chamadosAdmin > 0 ? '1 é de segurança' : 'Nenhum chamado aberto'}
            right={
              <span className="font-mono text-[20px] font-semibold text-ink">
                {counts.chamadosAdmin}
              </span>
            }
            onClick={() => navigate('/admin/ouvidoria')}
            showChevron
          />
          <ListRow
            icon={
              <IconChip tone="brand" size="md">
                <FileText className="w-[17px] h-[17px]" />
              </IconChip>
            }
            title="Boletos vencidos"
            subtitle={`R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto`}
            right={
              <span className="font-mono text-[20px] font-semibold text-ink">
                {boletosVencidosCount}
              </span>
            }
            onClick={() => navigate('/admin/painel')}
            showChevron
          />
        </GroupedList>
      </section>

      {/* 3. Hoje no condomínio */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint mb-2.5 m-0">
          Hoje no condomínio
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="Visitantes hoje" value={visitantesHoje} />
          <StatCard label="Encomendas aguardando" value={counts.encomendasPendentes} />
          <StatCard label="Reservas hoje" value={reservasHoje} />
        </div>
      </section>

      {/* 4. Mural de avisos */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint mb-2 m-0">
          Comunicação
        </p>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[18px] font-extrabold m-0 text-ink">Mural de avisos</h2>
          <Button
            variant="primary"
            size="mini"
            onClick={() => setIsSheetOpen(true)}
            className="!h-[38px] !px-3.5 !text-[13px]"
          >
            <Plus className="w-[15px] h-[15px]" />
            Novo aviso
          </Button>
        </div>

        {loading ? (
          <div className="p-9 text-center bg-surface border border-line rounded-[14px] text-[13px] text-dim">
            Carregando avisos...
          </div>
        ) : sortedAvisos.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="w-6 h-6 text-dim" />}
            title="Nenhum aviso publicado"
            description='Use "Novo aviso" para comunicar algo aos moradores.'
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sortedAvisos.map((n) => {
              const isPinned = pinnedMap[String(n.id)] || n.pinned;
              const seen = n.seen || 96;
              const total = n.total || TOTAL_UNIDADES;
              const pct = total ? Math.min(100, Math.round((seen / total) * 100)) : 0;

              return (
                <div
                  key={n.id}
                  className="relative bg-surface border border-line border-l-[3px] border-l-brand rounded-[14px] p-[14px_14px_12px_16px]"
                >
                  <div className="flex justify-between items-start gap-2.5">
                    <div>
                      <div className="text-[14.5px] font-bold text-ink flex items-center gap-1.5">
                        {isPinned && <Pin className="w-[13px] h-[13px] text-brand shrink-0" />}
                        <span>{n.titulo}</span>
                      </div>
                      <div className="mt-1.5">
                        <Badge tone="neutral">{(n.categoria || 'Aviso geral').toUpperCase()}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10.5px] text-brand bg-brand-soft px-2 py-1 rounded-[7px] whitespace-nowrap shrink-0">
                        {formatNoticeDate(n.dataCriacao)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMenu(n.id)}
                        className="bg-transparent border-0 text-faint cursor-pointer p-1 hover:text-ink"
                        aria-label="Mais opções"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[12.5px] text-dim leading-[1.55] my-2 whitespace-pre-line">
                    {n.mensagem}
                  </p>

                  <div className="flex justify-between items-center gap-2.5 pt-2.5 border-t border-line">
                    <span className="text-[11px] text-brand font-bold">
                      Enviado por: {n.autor}
                    </span>
                    <div className="flex-1 max-w-[150px]">
                      <small className="font-mono text-[10px] text-dim block mb-1 text-right">
                        Visto por {seen} de {total}
                      </small>
                      <div className="h-1 rounded-full bg-line overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-ok transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {n.menu === 'open' && (
                    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-line items-center justify-between">
                      <Button variant="secondary" size="mini" onClick={() => togglePin(n.id)}>
                        {isPinned ? 'Desafixar' : 'Fixar no topo'}
                      </Button>
                      <Button variant="danger" size="mini" onClick={() => askDelete(n.id)}>
                        Excluir
                      </Button>
                    </div>
                  )}

                  {n.menu === 'confirm' && (
                    <InlineConfirm
                      label="Excluir este aviso?"
                      confirmLabel="Excluir"
                      onCancel={() => cancelDelete(n.id)}
                      onConfirm={() => handleDelete(n.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sheet Novo aviso */}
      <BottomSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Novo aviso"
        footer={
          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!canPublish || publishing}
              onClick={handlePublish}
            >
              {publishing ? 'Publicando...' : 'Publicar aviso'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Título"
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            placeholder="Ex: Limpeza da garagem"
          />

          <TextAreaField
            label="Mensagem"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Escreva o aviso para os moradores"
          />

          <ChoiceChips
            label="Categoria"
            options={CATEGORIA_OPTIONS}
            value={categoria}
            onChange={setCategoria}
          />

          <ChoiceChips
            label="Quem recebe"
            options={AUDIENCIA_OPTIONS}
            value={audiencia}
            onChange={(v) => setAudiencia(v as 'all' | 'blocks')}
          />

          {audiencia === 'blocks' && (
            <div className="grid grid-cols-7 gap-1.5 -mt-1">
              {Array.from({ length: 14 }, (_, i) => String(i + 1)).map((b) => {
                const isSel = !!selectedBlocks[b];
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBlocks((prev) => ({ ...prev, [b]: !prev[b] }))}
                    className={`py-2 text-center font-mono text-[12px] rounded-[10px] border transition-colors cursor-pointer ${
                      isSel
                        ? 'border-brand bg-brand-soft text-brand font-bold'
                        : 'border-line bg-canvas text-ink hover:border-line-strong'
                    }`}
                  >
                    {b.padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-[12px] text-dim font-mono m-0">
            {audiencia === 'all'
              ? `Alcance: ${TOTAL_UNIDADES} unidades`
              : reachUnits > 0
              ? `Alcance: ${selectedBlocksCount} bloco(s) · ${reachUnits} unidades`
              : 'Escolha ao menos um bloco'}
          </p>

          <div className="divide-y divide-line border-y border-line">
            <div className="py-1">
              <Toggle
                checked={fixarNoTopo}
                onChange={setFixarNoTopo}
                title="Fixar no topo do mural"
                description="Fica acima dos demais avisos."
              />
            </div>
            <div className="py-1">
              <Toggle
                checked={notificarAgora}
                onChange={setNotificarAgora}
                title="Notificar moradores agora"
                description="Envia push. Quem desativou comunicados nas preferências não recebe."
              />
            </div>
          </div>
        </div>
      </BottomSheet>

      <Toast message={toastMessage} />
    </div>
  );
}
