import { useState, useEffect } from 'react';
import {
  Bell,
  CalendarDays,
  Car,
  Users,
  MessageSquare,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  Megaphone,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

interface BoletoResumo {
  id: string;
  competencia: string;
  valor: number;
  dataVencimento: string;
  status: string;
}

interface AvisoItem {
  id: string;
  titulo: string;
  mensagem: string;
  dataCriacao: string;
  autor: string;
}

export function MoradorHome() {
  const navigate = useNavigate();
  const [usuarioNome, setUsuarioNome] = useState('');
  const [iniciais, setIniciais] = useState('');
  const [unidadeLabel, setUnidadeLabel] = useState('Ambiente do Morador');
  const [proximoBoleto, setProximoBoleto] = useState<BoletoResumo | null>(null);
  const [avisosRecentes, setAvisosRecentes] = useState<AvisoItem[]>([]);

  useEffect(() => {
    const nomeSalvo = localStorage.getItem('@HabitOS:nome') || 'Morador';
    aplicarNome(nomeSalvo);

    // 1. Perfil real (nome, bloco, apartamento)
    api.get('/api/v1/perfil/dados')
      .then((res) => {
        if (res.data?.nome) {
          aplicarNome(res.data.nome);
        }
        const apto = res.data?.apartamento;
        const bloco = res.data?.bloco;
        if (apto && bloco) {
          setUnidadeLabel(`Apto ${apto} • Bloco ${bloco}`);
        } else if (apto) {
          setUnidadeLabel(`Unidade ${apto}`);
        }
      })
      .catch(() => {});

    // 2. Próximo boleto em aberto real
    api.get('/api/v1/boletos/meus')
      .then((res) => {
        const lista: BoletoResumo[] = Array.isArray(res.data) ? res.data : [];
        const emAberto = lista
          .filter((b) => b.status !== 'PAGO')
          .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
        setProximoBoleto(emAberto.length > 0 ? emAberto[0] : null);
      })
      .catch(() => {});

    // 3. Avisos oficiais publicados pelo Síndico
    api.get('/api/v1/avisos')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAvisosRecentes(res.data.slice(0, 2));
        }
      })
      .catch(() => {});
  }, []);

  const aplicarNome = (nome: string) => {
    setUsuarioNome(nome);
    const parts = nome.trim().split(/\s+/);
    if (parts.length > 1) {
      setIniciais((parts[0][0] + parts[1][0]).toUpperCase());
    } else if (parts[0]) {
      setIniciais(parts[0][0].toUpperCase());
    }
  };

  const formatarValorInteiroECentavos = (valor: number) => {
    const formatado = Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const [inteiro, centavos] = formatado.split(',');
    return { inteiro, centavos: centavos || '00' };
  };

  const formatarDataCurta = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const valorFormatado = proximoBoleto ? formatarValorInteiroECentavos(proximoBoleto.valor) : null;

  return (
    <div className="flex flex-col min-h-full bg-ds-bg text-ds-text font-sans">

      {/* HEADER SECTION */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-ds-primary-dim rounded-full flex items-center justify-center">
            <span className="text-ds-primary font-bold text-sm tracking-widest">{iniciais}</span>
          </div>
          <div>
            <p className="text-ds-dim text-xs font-semibold">Olá,</p>
            <h2 className="text-ds-text text-base font-extrabold tracking-wide">{usuarioNome}</h2>
            <p className="text-ds-dim text-[11px] mt-0.5">{unidadeLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/notificacoes')}
          className="w-10 h-10 bg-ds-card border border-ds-border rounded-full flex items-center justify-center text-ds-text hover:brightness-110 transition-colors relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {avisosRecentes.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-ds-danger rounded-full"></span>
          )}
        </button>
      </header>

      {/* BOLETO CARD (DADOS REAIS DA API) */}
      <div className="px-6 py-4">
        <div
          onClick={() => navigate('/app/boletos')}
          className="bg-ds-primary rounded-[24px] p-6 shadow-[0_10px_40px_-10px_rgba(108,99,245,0.4)] relative cursor-pointer hover:brightness-110 transition-all"
        >
          {proximoBoleto && valorFormatado ? (
            <>
              <div className="flex justify-between items-start mb-6 text-ds-primary-ink">
                <div>
                  <p className="text-white/70 text-xs font-semibold mb-1">Próximo boleto em aberto</p>
                  <h3 className="text-white text-lg font-bold">
                    Competência {proximoBoleto.competencia}
                  </h3>
                </div>
                <QrCode className="w-6 h-6 text-white/80" />
              </div>

              <div className="flex items-end justify-between text-ds-primary-ink">
                <div>
                  <p className="text-3xl font-black tracking-tight">
                    R$ {valorFormatado.inteiro}
                    <span className="text-xl">,{valorFormatado.centavos}</span>
                  </p>
                  <p className="text-white/70 text-xs mt-1 font-semibold">
                    Vencimento em {formatarDataCurta(proximoBoleto.dataVencimento)} ({proximoBoleto.status})
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-white text-ds-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Pagar agora
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-white py-2">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/75 text-xs font-semibold m-0">Situação financeira</p>
                  <h3 className="text-white text-base font-extrabold m-0 mt-0.5">Nenhuma fatura em aberto</h3>
                  <p className="text-white/75 text-xs m-0 mt-0.5">Toque para consultar seu histórico</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* 2x2 ACTION GRID */}
      <div className="px-6 py-2">
        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() => navigate('/app/reservas')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <CalendarDays className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Agendar área</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/perfil/veiculos')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <Car className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Meus veículos</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/assembleia')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <Users className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Assembleia</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/ouvidoria')}
            className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex flex-col gap-4 text-left hover:border-ds-primary transition-colors active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-ds-primary stroke-[1.5px]" />
            <span className="text-sm font-bold text-ds-text">Ouvidoria</span>
          </button>

        </div>
      </div>

      {/* CONDOSTORE BANNER */}
      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={() => navigate('/app/condostore')}
          className="w-full bg-ds-card border border-ds-border hover:border-ds-primary p-4 rounded-[18px] flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-ds-primary/15 text-ds-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-ds-text m-0">CondoStore 24h</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                  Aberto
                </span>
              </div>
              <p className="text-xs text-ds-dim m-0 mt-0.5">Compre pelo app no mercadinho autônomo</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ds-dim shrink-0" />
        </button>
      </div>

      {/* MURAL DE AVISOS REAIS DO CONDOMÍNIO */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-bold text-ds-dim tracking-wider uppercase m-0">
            Comunicados da Administração
          </h3>
          <button
            type="button"
            onClick={() => navigate('/app/notificacoes')}
            className="text-xs font-bold text-ds-primary flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {avisosRecentes.length > 0 ? (
          <div className="space-y-2.5">
            {avisosRecentes.map((aviso) => (
              <div
                key={aviso.id}
                className="bg-ds-card border border-ds-border p-4 rounded-[16px] flex items-start gap-3"
              >
                <div className="w-9 h-9 bg-ds-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4 text-ds-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-ds-text m-0 truncate">{aviso.titulo}</h4>
                  <p className="text-xs text-ds-dim mt-1 mb-0 line-clamp-2 leading-relaxed">
                    {aviso.mensagem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-ds-card border border-ds-border p-5 rounded-[16px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-ds-success-dim rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-ds-success" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ds-text m-0">Tudo em dia por aqui</h4>
                <p className="text-xs text-ds-dim mt-0.5 mb-0">Nenhum comunicado pendente hoje</p>
              </div>
            </div>
            <span className="text-ds-success text-sm font-bold">OK</span>
          </div>
        )}
      </div>

    </div>
  );
}
