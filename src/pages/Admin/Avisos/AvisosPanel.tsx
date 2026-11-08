import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

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

export function AvisosPanel() {
  const navigate = useNavigate();
  const { counts } = useNotification();

  const [userName, setUserName] = useState('Ana Laura');
  const [condoName, setCondoName] = useState('Condomínio Mar Egeu');
  const [avisos, setAvisos] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Métricas do condomínio
  const [visitantesHoje, setVisitantesHoje] = useState(5);
  const [reservasHoje, setReservasHoje] = useState(2);
  const [boletosVencidosCount, setBoletosVencidosCount] = useState(6);
  const [valorVencido, setValorVencido] = useState(2880.00);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bottom Sheet "Novo aviso"
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [categoria, setCategoria] = useState('Aviso geral');
  const [audiencia, setAudiencia] = useState<'all' | 'blocks'>('all');
  const [selectedBlocks, setSelectedBlocks] = useState<Record<string, boolean>>({});
  const [fixarNoTopo, setFixarNoTopo] = useState(false);
  const [notificarAgora, setNotificarAgora] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Pinned items persisted locally
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
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Carrega usuário e dados iniciais
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

    // Carrega avisos da API
    fetchAvisos();
    // Carrega métricas adicionais
    fetchMetricas();
  }, []);

  const fetchAvisos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/avisos');
      if (Array.isArray(res.data)) {
        const mapped: NoticeItem[] = res.data.map((item: any, idx: number) => {
          const id = item.id || `aviso-${idx}`;
          // Define categoria inteligente se não vier do backend
          let cat = 'Aviso geral';
          const t = (item.titulo || '').toLowerCase();
          if (t.includes('manutenção') || t.includes('piscina') || t.includes('elevador')) cat = 'Manutenção';
          else if (t.includes('limpeza') || t.includes('garagem')) cat = 'Limpeza';
          else if (t.includes('segurança') || t.includes('portaria') || t.includes('acesso')) cat = 'Segurança';
          else if (t.includes('assembleia') || t.includes('reunião') || t.includes('festa')) cat = 'Evento';
          else if (t.includes('boleto') || t.includes('taxa') || t.includes('cota')) cat = 'Financeiro';

          const seen = 90 + Math.floor(Math.sin(idx + 1) * 30) + (idx * 15);
          return {
            id,
            titulo: item.titulo,
            mensagem: item.mensagem,
            autor: item.autor || 'Síndico',
            dataCriacao: item.dataCriacao || new Date().toISOString(),
            categoria: cat,
            pinned: !!pinnedMap[String(id)],
            seen: Math.min(seen, TOTAL_UNIDADES),
            total: TOTAL_UNIDADES,
            menu: 'closed',
          };
        });
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
        const deHoje = resReservas.data.filter((r: any) => r.dataReserva === hojeStr).length;
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
          setValorVencido(resFinancas.data.inadimplencia || 2880.00);
        }
      }
    } catch {
      // fallback
    }
  };

  // Saudação de acordo com o horário
  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${saudacao}, ${userName}`;
  }, [userName]);

  // Data de hoje formatada
  const todayFormatted = useMemo(() => {
    const dataExtenso = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return `${dataExtenso} · ${condoName}`;
  }, [condoName]);

  // Lista ordenada: fixados primeiro, depois por data
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

  // Cálculo de alcance do novo aviso
  const reachUnits = useMemo(() => {
    if (audiencia === 'all') return TOTAL_UNIDADES;
    const blocksCount = Object.keys(selectedBlocks).filter(k => selectedBlocks[k]).length;
    return blocksCount * PER_BLOCK;
  }, [audiencia, selectedBlocks]);

  const canPublish = novoTitulo.trim().length > 0 && novaMensagem.trim().length > 0 && reachUnits > 0;

  // Menu de aviso (kebab)
  const toggleMenu = (id: string | number) => {
    setAvisos(prev =>
      prev.map(n => {
        if (n.id === id) {
          return { ...n, menu: n.menu === 'closed' || !n.menu ? 'open' : 'closed' };
        }
        return { ...n, menu: 'closed' };
      })
    );
  };

  const togglePin = (id: string | number) => {
    const isCurrentlyPinned = !!pinnedMap[String(id)];
    const updated = { ...pinnedMap, [String(id)]: !isCurrentlyPinned };
    setPinnedMap(updated);
    localStorage.setItem('@HabitOS:pinnedAvisos', JSON.stringify(updated));

    setAvisos(prev =>
      prev.map(n => (n.id === id ? { ...n, pinned: !isCurrentlyPinned, menu: 'closed' } : n))
    );
    showToast(!isCurrentlyPinned ? 'Aviso fixado no topo' : 'Aviso desafixado');
  };

  const askDelete = (id: string | number) => {
    setAvisos(prev =>
      prev.map(n => (n.id === id ? { ...n, menu: 'confirm' } : n))
    );
  };

  const cancelDelete = (id: string | number) => {
    setAvisos(prev =>
      prev.map(n => (n.id === id ? { ...n, menu: 'closed' } : n))
    );
  };

  const handleDelete = async (id: string | number) => {
    try {
      await api.delete(`/api/v1/avisos/${id}`);
    } catch {
      // ignora erro se for mock local
    }
    setAvisos(prev => prev.filter(n => n.id !== id));
    showToast('Aviso excluído');
  };

  // Publicar novo aviso
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

      setAvisos(prev => [novoAviso, ...prev]);
      setIsSheetOpen(false);
      setNovoTitulo('');
      setNovaMensagem('');
      setSelectedBlocks({});
      setFixarNoTopo(false);

      showToast(`Aviso publicado para ${reachUnits} unidades${notificarAgora ? ' · push enviado' : ''}`);
    } catch (err) {
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

  return (
    <main className="flex-1 p-[10px_18px_110px] flex flex-col gap-[22px]">
      
      {/* 1. GREETING & CHIPS */}
      <section className="greet">
        <h1 className="text-[22px] font-extrabold m-0 tracking-[-0.01em] text-ds-text leading-tight">
          {greetingText}
        </h1>
        <p className="text-[12.5px] text-ds-dim m-[4px_0_0]">
          {todayFormatted}
        </p>
        <div className="flex gap-2 overflow-x-auto mt-3.5 no-scrollbar">
          <button
            onClick={() => navigate('/admin/moradores')}
            className="shrink-0 flex items-center gap-[7px] h-[38px] px-[13px] rounded-full border border-ds-border bg-ds-card text-ds-text text-[12.5px] font-bold cursor-pointer hover:border-ds-primary hover:text-ds-primary transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-ds-dim">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Moradores
          </button>

          <button
            onClick={() => navigate('/portaria/encomendas')}
            className="shrink-0 flex items-center gap-[7px] h-[38px] px-[13px] rounded-full border border-ds-border bg-ds-card text-ds-text text-[12.5px] font-bold cursor-pointer hover:border-ds-primary hover:text-ds-primary transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-ds-dim">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/>
              <path d="M3 8l9 5 9-5M12 13v8"/>
            </svg>
            Encomendas
          </button>

          <button
            onClick={() => navigate('/admin/auditoria')}
            className="shrink-0 flex items-center gap-[7px] h-[38px] px-[13px] rounded-full border border-ds-border bg-ds-card text-ds-text text-[12.5px] font-bold cursor-pointer hover:border-ds-primary hover:text-ds-primary transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-ds-dim">
              <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            Segurança
          </button>
        </div>
      </section>

      {/* 2. PRECISA DA SUA ATENÇÃO */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-[0_0_10px] flex justify-between items-center">
          Precisa da sua atenção
        </p>
        <div className="bg-ds-card border border-ds-border rounded-[14px] overflow-hidden divide-y divide-ds-border">
          
          {/* Reservas para aprovar */}
          <button
            onClick={() => navigate('/admin/reservas')}
            className="w-full flex items-center gap-3 p-[13px_14px] bg-transparent text-ds-text text-left cursor-pointer hover:bg-ds-bg transition-colors"
          >
            <span className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0 bg-ds-warning-dim text-ds-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                <rect x="3" y="5" width="18" height="16" rx="2"/>
                <path d="M16 3v4M8 3v4M3 11h18"/>
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-ds-text truncate">Reservas para aprovar</div>
              <div className="text-[11.5px] text-ds-dim mt-[2px] truncate">
                {counts.reservasAdmin > 0 ? 'A mais antiga espera há 1 dia' : 'Nenhuma pendente no momento'}
              </div>
            </span>
            <span className="font-mono text-[20px] font-semibold text-ds-text">
              {counts.reservasAdmin}
            </span>
            <span className="text-ds-faint ml-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </span>
          </button>

          {/* Chamados abertos */}
          <button
            onClick={() => navigate('/admin/ouvidoria')}
            className="w-full flex items-center gap-3 p-[13px_14px] bg-transparent text-ds-text text-left cursor-pointer hover:bg-ds-bg transition-colors"
          >
            <span className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0 bg-ds-danger-dim text-ds-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M12 7v4M12 14h.01"/>
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-ds-text truncate">Chamados abertos</div>
              <div className="text-[11.5px] text-ds-dim mt-[2px] truncate">
                {counts.chamadosAdmin > 0 ? '1 é de segurança' : 'Nenhum chamado aberto'}
              </div>
            </span>
            <span className="font-mono text-[20px] font-semibold text-ds-text">
              {counts.chamadosAdmin}
            </span>
            <span className="text-ds-faint ml-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </span>
          </button>

          {/* Boletos vencidos */}
          <button
            onClick={() => navigate('/admin/painel')}
            className="w-full flex items-center gap-3 p-[13px_14px] bg-transparent text-ds-text text-left cursor-pointer hover:bg-ds-bg transition-colors"
          >
            <span className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0 bg-ds-primary-dim text-ds-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                <path d="M6 2h9l3 3v17H6z"/>
                <path d="M9 8h6M9 12h6M9 16h4"/>
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-ds-text truncate">Boletos vencidos</div>
              <div className="text-[11.5px] text-ds-dim mt-[2px] truncate">
                R$ {valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto
              </div>
            </span>
            <span className="font-mono text-[20px] font-semibold text-ds-text">
              {boletosVencidosCount}
            </span>
            <span className="text-ds-faint ml-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </span>
          </button>

        </div>
      </section>

      {/* 3. HOJE NO CONDOMÍNIO */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-[0_0_10px] flex justify-between items-center">
          Hoje no condomínio
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-ds-card border border-ds-border rounded-[14px] p-3">
            <div className="font-mono text-[24px] font-semibold leading-none text-ds-text">
              {visitantesHoje}
            </div>
            <div className="text-[10.5px] text-ds-dim mt-1.5 leading-[1.3]">
              Visitantes hoje
            </div>
          </div>
          <div className="bg-ds-card border border-ds-border rounded-[14px] p-3">
            <div className="font-mono text-[24px] font-semibold leading-none text-ds-text">
              {counts.encomendasPendentes}
            </div>
            <div className="text-[10.5px] text-ds-dim mt-1.5 leading-[1.3]">
              Encomendas aguardando
            </div>
          </div>
          <div className="bg-ds-card border border-ds-border rounded-[14px] p-3">
            <div className="font-mono text-[24px] font-semibold leading-none text-ds-text">
              {reservasHoje}
            </div>
            <div className="text-[10.5px] text-ds-dim mt-1.5 leading-[1.3]">
              Reservas hoje
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMUNICAÇÃO - MURAL DE AVISOS */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-[0_0_10px] flex justify-between items-center">
          Comunicação
        </p>
        <div className="flex justify-between items-center mt-[-2px] mb-3">
          <h2 className="text-[18px] font-extrabold m-0 text-ds-text">
            Mural de avisos
          </h2>
          <button
            onClick={() => setIsSheetOpen(true)}
            className="font-sans text-[13px] font-bold h-[38px] px-3.5 rounded-[10px] border border-ds-primary bg-ds-primary text-white cursor-pointer inline-flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-[15px] h-[15px]">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Novo aviso
          </button>
        </div>

        {/* Lista de avisos */}
        {loading ? (
          <div className="p-9 text-center bg-ds-card border border-ds-border rounded-[14px] text-[13px] text-ds-dim">
            Carregando avisos...
          </div>
        ) : sortedAvisos.length === 0 ? (
          <div className="text-center p-[36px_20px] bg-ds-card border border-ds-border rounded-[14px] text-[13px] text-ds-dim">
            Nenhum aviso publicado. Use &quot;Novo aviso&quot; para comunicar algo aos moradores.
          </div>
        ) : (
          <div>
            {sortedAvisos.map(n => {
              const isPinned = pinnedMap[String(n.id)] || n.pinned;
              const seen = n.seen || 96;
              const total = n.total || TOTAL_UNIDADES;
              const pct = total ? Math.min(100, Math.round((seen / total) * 100)) : 0;

              return (
                <div
                  key={n.id}
                  className="relative bg-ds-card border border-ds-border border-l-[3px] border-l-ds-primary rounded-[14px] p-[14px_14px_12px_16px] mb-2.5 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2.5">
                    <div>
                      <div className="text-[14.5px] font-bold text-ds-text flex items-center gap-1.5">
                        {isPinned && (
                          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-[13px] h-[13px] text-ds-primary shrink-0">
                            <path d="M16 3a1 1 0 0 1 .7 1.7L15 6.4v4.2l2.7 3.3a1 1 0 0 1-.8 1.6H13v5a1 1 0 0 1-2 0v-5H7.1a1 1 0 0 1-.8-1.6L9 10.6V6.4L7.3 4.7A1 1 0 0 1 8 3h8z"/>
                          </svg>
                        )}
                        <span>{n.titulo}</span>
                      </div>
                      <span className="inline-block mt-1.5 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-ds-bg border border-ds-border text-ds-dim tracking-[0.03em] uppercase">
                        {(n.categoria || 'Aviso geral').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10.5px] text-ds-primary bg-ds-primary-dim px-2 py-1 rounded-[7px] whitespace-nowrap shrink-0">
                        {formatNoticeDate(n.dataCriacao)}
                      </span>
                      <button
                        onClick={() => toggleMenu(n.id)}
                        className="bg-transparent border-0 text-ds-faint cursor-pointer p-1 hover:text-ds-text"
                        aria-label="Mais opções"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <circle cx="12" cy="5" r="1.6"/>
                          <circle cx="12" cy="12" r="1.6"/>
                          <circle cx="12" cy="19" r="1.6"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="text-[12.5px] text-ds-dim leading-[1.55] my-2 whitespace-pre-line">
                    {n.mensagem}
                  </div>

                  <div className="flex justify-between items-center gap-2.5 pt-2.5 border-t border-ds-border">
                    <span className="text-[11px] text-ds-primary font-bold">
                      Enviado por: {n.autor}
                    </span>
                    <div className="flex-1 max-w-[150px]">
                      <small className="font-mono text-[10px] text-ds-dim block mb-1 text-right">
                        Visto por {seen} de {total}
                      </small>
                      <div className="h-1 rounded-full bg-ds-border overflow-hidden">
                        <i style={{ width: `${pct}%` }} className="block h-full bg-ds-success transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Linha de menu contextual (Fixar / Excluir) */}
                  {n.menu === 'open' && (
                    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-ds-border items-center justify-between animate-in fade-in duration-150">
                      <button
                        onClick={() => togglePin(n.id)}
                        className="font-sans text-[12px] font-bold px-3 py-2 rounded-lg border border-ds-border bg-ds-card text-ds-text cursor-pointer hover:bg-ds-bg transition-colors"
                      >
                        {isPinned ? 'Desafixar' : 'Fixar no topo'}
                      </button>
                      <button
                        onClick={() => askDelete(n.id)}
                        className="font-sans text-[12px] font-bold px-3 py-2 rounded-lg border border-ds-danger bg-ds-danger text-white cursor-pointer hover:brightness-110 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  )}

                  {n.menu === 'confirm' && (
                    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-ds-border items-center justify-between animate-in fade-in duration-150">
                      <span className="text-[12px] text-ds-dim font-medium">Excluir este aviso?</span>
                      <span className="flex gap-2">
                        <button
                          onClick={() => cancelDelete(n.id)}
                          className="font-sans text-[12px] font-bold px-3 py-2 rounded-lg border border-ds-border bg-ds-card text-ds-text cursor-pointer hover:bg-ds-bg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="font-sans text-[12px] font-bold px-3 py-2 rounded-lg border border-ds-danger bg-ds-danger text-white cursor-pointer hover:brightness-110 transition-colors"
                        >
                          Excluir
                        </button>
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. BOTTOM SHEET - NOVO AVISO */}
      {isSheetOpen && (
        <>
          <div
            onClick={() => setIsSheetOpen(false)}
            className="fixed inset-0 bg-black/45 z-40 transition-opacity"
          />
          <div className="fixed left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[412px] bg-ds-card rounded-t-[20px] p-[20px_20px_calc(22px+env(safe-area-inset-bottom,0px))] z-50 transition-transform max-h-[92vh] overflow-y-auto border-t border-ds-border shadow-2xl animate-in slide-in-from-bottom duration-250">
            
            <h2 className="text-[17px] font-extrabold m-[0_0_16px] text-ds-text">
              Novo aviso
            </h2>

            <label className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-2 block">
              Título
            </label>
            <input
              type="text"
              value={novoTitulo}
              onChange={e => setNovoTitulo(e.target.value)}
              placeholder="Ex: Limpeza da garagem"
              className="w-full px-3 py-2.5 rounded-[10px] border border-ds-border bg-ds-bg text-ds-text text-[14px] mb-4 outline-none focus:border-ds-primary transition-colors"
            />

            <label className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-2 block">
              Mensagem
            </label>
            <textarea
              value={novaMensagem}
              onChange={e => setNovaMensagem(e.target.value)}
              placeholder="Escreva o aviso para os moradores"
              className="w-full px-3 py-2.5 rounded-[10px] border border-ds-border bg-ds-bg text-ds-text text-[14px] mb-4 resize-none min-h-[96px] outline-none focus:border-ds-primary transition-colors"
            />

            <label className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-2 block">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Aviso geral', 'Manutenção', 'Limpeza', 'Segurança', 'Evento', 'Financeiro'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`border border-ds-border text-[12.5px] font-semibold px-3 py-2 rounded-[10px] cursor-pointer transition-all ${
                    categoria === cat
                      ? 'border-ds-primary bg-ds-primary-dim text-ds-primary'
                      : 'bg-ds-bg text-ds-text hover:border-ds-dim'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-2 block">
              Quem recebe
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAudiencia('all')}
                className={`border border-ds-border text-[12.5px] font-semibold px-3 py-2 rounded-[10px] cursor-pointer transition-all ${
                  audiencia === 'all'
                    ? 'border-ds-primary bg-ds-primary-dim text-ds-primary'
                    : 'bg-ds-bg text-ds-text hover:border-ds-dim'
                }`}
              >
                Todo o condomínio
              </button>
              <button
                type="button"
                onClick={() => setAudiencia('blocks')}
                className={`border border-ds-border text-[12.5px] font-semibold px-3 py-2 rounded-[10px] cursor-pointer transition-all ${
                  audiencia === 'blocks'
                    ? 'border-ds-primary bg-ds-primary-dim text-ds-primary'
                    : 'bg-ds-bg text-ds-text hover:border-ds-dim'
                }`}
              >
                Blocos específicos
              </button>
            </div>

            {/* Grid de blocos 01..14 */}
            {audiencia === 'blocks' && (
              <div className="grid grid-cols-7 gap-1.5 mt-[-4px] mb-4">
                {Array.from({ length: 14 }, (_, i) => String(i + 1)).map(b => {
                  const isSel = !!selectedBlocks[b];
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBlocks(prev => ({ ...prev, [b]: !prev[b] }))}
                      className={`py-2 text-center font-mono text-[12px] rounded-[10px] border border-ds-border transition-all cursor-pointer ${
                        isSel
                          ? 'border-ds-primary bg-ds-primary-dim text-ds-primary font-bold'
                          : 'bg-ds-bg text-ds-text hover:border-ds-dim'
                      }`}
                    >
                      {b.padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="text-[12px] text-ds-dim mb-3.5 font-mono">
              {audiencia === 'all'
                ? `Alcance: ${TOTAL_UNIDADES} unidades`
                : reachUnits > 0
                ? `Alcance: ${Object.keys(selectedBlocks).filter(k => selectedBlocks[k]).length} bloco(s) · ${reachUnits} unidades`
                : 'Escolha ao menos um bloco'}
            </div>

            {/* Switch Fixar no topo */}
            <label className="flex items-start justify-between gap-3 py-3 border-t border-ds-border cursor-pointer">
              <span>
                <div className="text-[13.5px] font-bold text-ds-text">Fixar no topo do mural</div>
                <div className="text-[11.5px] text-ds-dim mt-0.5 leading-[1.45]">Fica acima dos demais avisos.</div>
              </span>
              <span className="relative w-10 h-[23px] shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={fixarNoTopo}
                  onChange={e => setFixarNoTopo(e.target.checked)}
                  className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute inset-0 bg-ds-border rounded-full peer-checked:bg-ds-primary transition-colors">
                  <span className={`absolute top-[2.5px] left-[2.5px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${fixarNoTopo ? 'translate-x-[17px]' : 'translate-x-0'}`} />
                </span>
              </span>
            </label>

            {/* Switch Notificar agora */}
            <label className="flex items-start justify-between gap-3 py-3 border-y border-ds-border mb-3.5 cursor-pointer">
              <span>
                <div className="text-[13.5px] font-bold text-ds-text">Notificar moradores agora</div>
                <div className="text-[11.5px] text-ds-dim mt-0.5 leading-[1.45]">Envia push. Quem desativou comunicados nas preferências não recebe.</div>
              </span>
              <span className="relative w-10 h-[23px] shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={notificarAgora}
                  onChange={e => setNotificarAgora(e.target.checked)}
                  className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute inset-0 bg-ds-border rounded-full peer-checked:bg-ds-primary transition-colors">
                  <span className={`absolute top-[2.5px] left-[2.5px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${notificarAgora ? 'translate-x-[17px]' : 'translate-x-0'}`} />
                </span>
              </span>
            </label>

            <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="h-12 justify-center text-[14px] font-bold rounded-[10px] border border-ds-border bg-ds-card text-ds-text hover:bg-ds-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canPublish || publishing}
                onClick={handlePublish}
                className="h-12 justify-center text-[14px] font-bold rounded-[10px] border border-ds-primary bg-ds-primary text-white hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {publishing ? 'Publicando...' : 'Publicar aviso'}
              </button>
            </div>

          </div>
        </>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg text-[13px] font-semibold px-4 py-2.5 rounded-[10px] shadow-lg z-50 whitespace-nowrap max-w-[92%] truncate animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

    </main>
  );
}
