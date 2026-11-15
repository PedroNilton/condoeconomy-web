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
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { Avatar, Badge, IconButton, IconChip, ListCard } from '../../../components/ui';

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
  const { theme, toggleTheme } = useTheme();
  const [usuarioNome, setUsuarioNome] = useState('');
  const [unidadeLabel, setUnidadeLabel] = useState('Ambiente do Morador');
  const [proximoBoleto, setProximoBoleto] = useState<BoletoResumo | null>(null);
  const [avisosRecentes, setAvisosRecentes] = useState<AvisoItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const nomeSalvo = localStorage.getItem('@HabitOS:nome') || 'Morador';
    setUsuarioNome(nomeSalvo);

    api
      .get('/api/v1/perfil/dados')
      .then((res) => {
        if (res.data?.nome) {
          setUsuarioNome(res.data.nome);
        }
        const apto = res.data?.apartamento;
        const bloco = res.data?.bloco;
        if (apto && bloco) {
          setUnidadeLabel(`Bloco ${bloco} · Apto ${apto}`);
        } else if (apto) {
          setUnidadeLabel(`Unidade ${apto}`);
        }
      })
      .catch(() => {});

    api
      .get('/api/v1/boletos/meus')
      .then((res) => {
        const lista: BoletoResumo[] = Array.isArray(res.data) ? res.data : [];
        const emAberto = lista
          .filter((b) => b.status !== 'PAGO')
          .sort(
            (a, b) =>
              new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime(),
          );
        setProximoBoleto(emAberto.length > 0 ? emAberto[0] : null);
      })
      .catch(() => {});

    api
      .get('/api/v1/avisos')
      .then((res) => {
        if (Array.isArray(res.data)) {
          const recentes: AvisoItem[] = res.data.slice(0, 2);
          setAvisosRecentes(recentes);
          recentes.forEach((a) => {
            if (a.id) {
              api.post(`/api/v1/avisos/${a.id}/visualizar`).catch(() => {});
            }
          });
        }
      })
      .catch(() => {});

    api
      .get('/api/v1/notificacoes/nao-lidas/count')
      .then((res) => {
        if (typeof res.data === 'number') {
          setUnreadCount(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const formatarValorInteiroECentavos = (valor: number) => {
    const formatado = Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
    <div className="flex flex-col min-h-full bg-canvas text-ink font-sans pb-8">
      {/* Cabeçalho */}
      <header className="px-[18px] pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={usuarioNome || 'Morador'} size="md" />
          <div className="min-w-0">
            <p className="text-dim text-[11.5px] font-semibold m-0">Olá,</p>
            <h2 className="text-ink text-[15.5px] font-extrabold tracking-tight m-0 truncate">
              {usuarioNome}
            </h2>
            <p className="font-mono text-dim text-[11px] m-0 mt-0.5 truncate">{unidadeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IconButton
            label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>
          <IconButton
            label="Notificações"
            onClick={() => navigate('/app/notificacoes')}
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-bad rounded-full" />
            )}
          </IconButton>
        </div>
      </header>

      {/* Card Boleto em Aberto */}
      <div className="px-[18px] py-2">
        <div
          onClick={() => navigate('/app/boletos')}
          className="bg-brand rounded-[18px] p-5 relative cursor-pointer hover:bg-brand-hover transition-colors"
        >
          {proximoBoleto && valorFormatado ? (
            <>
              <div className="flex justify-between items-start mb-5 text-brand-ink">
                <div>
                  <p className="text-brand-ink/80 text-[12px] font-semibold m-0 mb-0.5">
                    Próximo boleto em aberto
                  </p>
                  <h3 className="text-brand-ink text-[16px] font-extrabold m-0">
                    Competência {proximoBoleto.competencia}
                  </h3>
                </div>
                <QrCode className="w-6 h-6 text-brand-ink/85" />
              </div>

              <div className="flex items-end justify-between gap-3 text-brand-ink">
                <div>
                  <p className="font-mono text-[28px] font-black tracking-tight m-0 tabular-nums leading-none">
                    R$ {valorFormatado.inteiro}
                    <span className="text-[18px]">,{valorFormatado.centavos}</span>
                  </p>
                  <p className="text-brand-ink/80 text-[11.5px] mt-1.5 mb-0 font-semibold">
                    Vencimento em {formatarDataCurta(proximoBoleto.dataVencimento)} (
                    {proximoBoleto.status})
                  </p>
                </div>
                <span className="bg-white text-brand text-[12px] font-extrabold px-3.5 py-2 rounded-[10px] shrink-0">
                  Pagar agora
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-brand-ink py-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[12px] bg-white/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-brand-ink" />
                </div>
                <div>
                  <p className="text-brand-ink/80 text-[11.5px] font-semibold m-0">
                    Situação financeira
                  </p>
                  <h3 className="text-brand-ink text-[15px] font-extrabold m-0 mt-0.5">
                    Nenhuma fatura em aberto
                  </h3>
                  <p className="text-brand-ink/80 text-[11.5px] m-0 mt-0.5">
                    Toque para consultar seu histórico
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-ink/85 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Grid 2x2 de Ações */}
      <div className="px-[18px] py-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/app/reservas')}
            className="bg-surface border border-line p-4 rounded-[14px] flex flex-col gap-3 text-left hover:border-brand transition-colors cursor-pointer"
          >
            <IconChip tone="brand" size="sm">
              <CalendarDays className="w-4 h-4" />
            </IconChip>
            <span className="text-[13.5px] font-bold text-ink">Agendar área</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/perfil/veiculos')}
            className="bg-surface border border-line p-4 rounded-[14px] flex flex-col gap-3 text-left hover:border-brand transition-colors cursor-pointer"
          >
            <IconChip tone="brand" size="sm">
              <Car className="w-4 h-4" />
            </IconChip>
            <span className="text-[13.5px] font-bold text-ink">Meus veículos</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/assembleia')}
            className="bg-surface border border-line p-4 rounded-[14px] flex flex-col gap-3 text-left hover:border-brand transition-colors cursor-pointer"
          >
            <IconChip tone="brand" size="sm">
              <Users className="w-4 h-4" />
            </IconChip>
            <span className="text-[13.5px] font-bold text-ink">Assembleia</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/ouvidoria')}
            className="bg-surface border border-line p-4 rounded-[14px] flex flex-col gap-3 text-left hover:border-brand transition-colors cursor-pointer"
          >
            <IconChip tone="brand" size="sm">
              <MessageSquare className="w-4 h-4" />
            </IconChip>
            <span className="text-[13.5px] font-bold text-ink">Ouvidoria</span>
          </button>
        </div>
      </div>

      {/* Banner CondoStore 24h */}
      <div className="px-[18px] pt-2">
        <button
          type="button"
          onClick={() => navigate('/app/condostore')}
          className="w-full bg-surface border border-line hover:border-brand p-3.5 rounded-[14px] flex items-center justify-between transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <IconChip tone="brand" size="lg">
              <ShoppingBag className="w-5 h-5" />
            </IconChip>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13.5px] font-extrabold text-ink m-0">CondoStore 24h</h4>
                <Badge tone="ok">Aberto</Badge>
              </div>
              <p className="text-[12px] text-dim m-0 mt-0.5 truncate">
                Compre pelo app no mercadinho autônomo
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-dim shrink-0" />
        </button>
      </div>

      {/* Mural de Avisos Reais */}
      <div className="px-[18px] pt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold text-faint tracking-[0.06em] uppercase m-0">
            Comunicados da Administração
          </h3>
          <button
            type="button"
            onClick={() => navigate('/app/notificacoes')}
            className="text-[12px] font-bold text-brand flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0 hover:underline"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {avisosRecentes.length > 0 ? (
          <div className="space-y-2.5">
            {avisosRecentes.map((aviso) => (
              <ListCard key={aviso.id}>
                <div className="flex items-start gap-3">
                  <IconChip tone="brand" size="sm">
                    <Megaphone className="w-4 h-4" />
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13.5px] font-bold text-ink m-0 truncate">{aviso.titulo}</h4>
                    <p className="text-[12px] text-dim mt-1 mb-0 line-clamp-2 leading-relaxed">
                      {aviso.mensagem}
                    </p>
                  </div>
                </div>
              </ListCard>
            ))}
          </div>
        ) : (
          <ListCard>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <IconChip tone="ok" size="md">
                  <ShieldCheck className="w-5 h-5" />
                </IconChip>
                <div className="min-w-0">
                  <h4 className="text-[13.5px] font-bold text-ink m-0">Tudo em dia por aqui</h4>
                  <p className="text-[12px] text-dim mt-0.5 mb-0">
                    Nenhum comunicado pendente hoje
                  </p>
                </div>
              </div>
              <Badge tone="ok">OK</Badge>
            </div>
          </ListCard>
        )}
      </div>
    </div>
  );
}
