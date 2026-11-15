import { useState } from 'react';
import { Receipt, Package, ShieldCheck, Check, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  AppHeader,
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  ColorSwatchPicker,
  EmptyState,
  Field,
  FilterChips,
  GroupedList,
  IconChip,
  InfoBanner,
  InlineConfirm,
  ListCard,
  ListRow,
  LiveIndicator,
  PageHead,
  ProgressBar,
  SearchInput,
  SegmentedTabs,
  StatCard,
  Thread,
  Toast,
  Toggle,
} from '../../components/ui';

const SWATCHES = [
  { name: 'Fundo', cssVar: '--bg', hex: '#FAFAFA / #0E0F12', border: true },
  { name: 'Superfície', cssVar: '--card', hex: '#FFFFFF / #17181D', border: true },
  { name: 'Texto', cssVar: '--text', hex: '#16181D / #ECEDF0' },
  { name: 'Texto dim', cssVar: '--dim', hex: '#75767E / #90919A' },
  { name: 'Primária', cssVar: '--primary', hex: '#4338CA / #6C63F5' },
  { name: 'Primária hover', cssVar: '--primary-hover', hex: '#372CB0 / #8079F7' },
  { name: 'Sucesso', cssVar: '--success', hex: '#16A34A / #34D399' },
  { name: 'Alerta', cssVar: '--warning', hex: '#B45309 / #F5A855' },
  { name: 'Erro', cssVar: '--danger', hex: '#DC2626 / #F87171' },
  { name: 'Desabilitado', cssVar: '--disabled-bg', hex: '#F1F1F3 / #1D1E24', border: true },
];

const PET_COLORS = [
  { name: 'Preto', value: 'Preto', background: '#1C1D22' },
  { name: 'Branco', value: 'Branco', background: '#F5F5F5', border: '#D8D8DC' },
  { name: 'Marrom', value: 'Marrom', background: '#78350F' },
  { name: 'Caramelo', value: 'Caramelo', background: '#EA9E3B' },
  { name: 'Cinza', value: 'Cinza', background: '#8A8F98' },
  {
    name: 'Rajado',
    value: 'Rajado',
    background: 'linear-gradient(135deg,#1C1D22 50%,#F5F5F5 50%)',
    border: '#D8D8DC',
  },
];

export function DesignSystemShowcase() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<'boletos' | 'despesas' | 'auditoria'>('boletos');
  const [chip, setChip] = useState<'todos' | 'vencidos' | 'pagos'>('todos');
  const [search, setSearch] = useState('');
  const [choice, setChoice] = useState('pix');
  const [petColor, setPetColor] = useState('Preto');
  const [toggleOn, setToggleOn] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-16">
      <div className="max-w-[820px] mx-auto px-5 pt-6">
        <AppHeader
          title="CondoEconomy — Design System"
          subtitle="BASE MODERNO & TECH · FASE 0 & 1"
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="mt-6">
          <PageHead
            eyebrow="Tokens e Componentes"
            title="Showcase de UI"
            subtitle="Fonte Manrope + IBM Plex Mono, alternância de tema claro/escuro e todos os blocos base C1–C22."
            rightBadge={<LiveIndicator />}
          />
        </div>

        <div className="px-[18px] space-y-10 mt-6">
          {/* Cores */}
          <section>
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint mb-4">
              Cor
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SWATCHES.map((s) => (
                <div
                  key={s.name}
                  className="border border-line rounded-[12px] overflow-hidden bg-surface"
                >
                  <div
                    className={`h-[52px] ${s.border ? 'border-b border-line' : ''}`}
                    style={{ background: `var(${s.cssVar})` }}
                  />
                  <div className="p-2.5">
                    <span className="block text-[12px] font-bold text-ink">{s.name}</span>
                    <span className="font-mono text-[10px] text-dim">{s.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tipografia */}
          <section>
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint mb-3">
              Tipografia — Manrope + IBM Plex Mono
            </h2>
            <div className="bg-surface border border-line rounded-[14px] px-4 divide-y divide-line">
              <div className="flex items-baseline gap-4 py-3.5">
                <span className="w-[88px] shrink-0 font-mono text-[11px] text-dim">display</span>
                <span className="font-mono text-[30px] font-semibold tracking-[-0.02em]">
                  R$ 1.240,00
                </span>
              </div>
              <div className="flex items-baseline gap-4 py-3.5">
                <span className="w-[88px] shrink-0 font-mono text-[11px] text-dim">h1 · 21/800</span>
                <span className="text-[21px] font-extrabold tracking-[-0.01em]">
                  Boletos do condomínio
                </span>
              </div>
              <div className="flex items-baseline gap-4 py-3.5">
                <span className="w-[88px] shrink-0 font-mono text-[11px] text-dim">body</span>
                <span className="text-[14.5px] font-medium">
                  Bloco B, apartamento 204 — vencimento dia 10.
                </span>
              </div>
              <div className="flex items-baseline gap-4 py-3.5">
                <span className="w-[88px] shrink-0 font-mono text-[11px] text-dim">mono</span>
                <span className="font-mono text-[12px] font-semibold">BLOCO 02 · APTO 204</span>
              </div>
            </div>
          </section>

          {/* Botões & Badges */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">
              Botões e Badges (C8, C9)
            </h2>
            <ListCard className="space-y-4">
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary" onClick={() => showToast('Ação primária executada')}>
                  Salvar alterações
                </Button>
                <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                  Abrir BottomSheet
                </Button>
                <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                  Excluir item
                </Button>
                <Button variant="primary" disabled>
                  Indisponível
                </Button>
                <Button variant="mini">Dar baixa</Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                <Badge tone="ok">EM DIA</Badge>
                <Badge tone="warn">VENCE EM 3 DIAS</Badge>
                <Badge tone="bad">VENCIDO</Badge>
                <Badge tone="brand">EM VOTAÇÃO</Badge>
                <Badge tone="neutral">AGUARDANDO</Badge>
              </div>
            </ListCard>
          </section>

          {/* Controles de busca, abas e formulário */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">
              Navegação, Busca e Formulários (C4–C6, C10–C12)
            </h2>
            <ListCard className="space-y-4">
              <SegmentedTabs
                value={tab}
                onChange={setTab}
                items={[
                  { id: 'boletos', label: 'Boletos', count: 168 },
                  { id: 'despesas', label: 'Despesas', count: 8 },
                  { id: 'auditoria', label: 'Auditoria', count: 14 },
                ]}
              />
              <FilterChips
                value={chip}
                onChange={setChip}
                items={[
                  { id: 'todos', label: 'Todos', count: 168 },
                  { id: 'vencidos', label: 'Vencidos', count: 10 },
                  { id: 'pagos', label: 'Pagos', count: 158 },
                ]}
              />
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar unidade ou morador" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="E-mail" placeholder="seu@email.com" />
                <Field
                  label="Unidade"
                  mono
                  defaultValue="Bloco 03 · Apto 99"
                  error="Esse apartamento não existe neste bloco."
                />
              </div>
              <ChoiceChips
                label="Forma de pagamento"
                value={choice}
                onChange={setChoice}
                options={[
                  { value: 'pix', label: 'PIX' },
                  { value: 'dinheiro', label: 'Dinheiro' },
                  { value: 'transf', label: 'Transferência' },
                ]}
              />
              <ColorSwatchPicker
                label="Cor do pet"
                options={PET_COLORS}
                value={petColor}
                onChange={setPetColor}
              />
              <Toggle
                checked={toggleOn}
                onChange={setToggleOn}
                title="Notificar moradores agora"
                description="Envia push para quem ativou comunicados."
              />
            </ListCard>
          </section>

          {/* Cards, KPIs, Progresso, Banners e Thread */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">
              Cards, KPIs, Progresso e Conversa (C7, C15–C22)
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard label="Encomendas" value={4} emphasis="brand" />
              <StatCard label="Visitantes" value={0} />
              <StatCard label="Ouvidoria" value={2} emphasis="warn" />
            </div>

            <ListCard className="space-y-2.5">
              <div className="flex justify-between text-[12px] font-bold">
                <span>Participação · 72 de 168 unidades</span>
                <span className="font-mono text-warn">43%</span>
              </div>
              <ProgressBar percent={43} quorumPercent={50} tone="warn" />
            </ListCard>

            <InfoBanner tone="brand">
              Reservas estão sujeitas à aprovação do síndico. Valores entram no próximo boleto.
            </InfoBanner>

            <GroupedList>
              <ListRow
                icon={
                  <IconChip tone="ok">
                    <Receipt className="w-4 h-4" />
                  </IconChip>
                }
                title="Bloco 02 · Apto 104"
                subtitle="Carlos Silva · Taxa condominial"
                right={<Badge tone="ok">PAGO</Badge>}
              />
              <ListRow
                icon={
                  <IconChip tone="warn">
                    <Package className="w-4 h-4" />
                  </IconChip>
                }
                title="Bloco 05 · Apto 201"
                subtitle="Mercado Livre · Chegou hoje"
                showChevron
                onClick={() => showToast('Encomenda selecionada')}
              />
            </GroupedList>

            <ListCard>
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold">Pet · Thor (Cachorro)</span>
                <Trash2 className="w-4 h-4 text-faint" />
              </div>
              <InlineConfirm
                label="Remover Thor?"
                onCancel={() => showToast('Cancelado')}
                onConfirm={() => showToast('Removido')}
              />
            </ListCard>

            <ListCard>
              <Thread
                messages={[
                  {
                    senderRole: 'morador',
                    senderLabel: 'Morador',
                    text: 'O portão da garagem não fechou hoje cedo.',
                    timeLabel: 'há 30 min',
                  },
                  {
                    senderRole: 'portaria',
                    senderLabel: 'Portaria',
                    text: 'Recebido, escalando para a administração.',
                    timeLabel: 'há 15 min',
                  },
                  {
                    senderRole: 'sindico',
                    senderLabel: 'Você',
                    text: 'Técnico acionado para hoje à tarde.',
                    timeLabel: 'agora',
                  },
                ]}
                onSend={(msg) => showToast(`Enviado: ${msg}`)}
              />
            </ListCard>

            <EmptyState
              tone="ok"
              icon={<ShieldCheck className="w-[26px] h-[26px]" />}
              title="Tudo em dia!"
              description="Nenhuma pendência aguardando sua ação neste momento."
            />
          </section>
        </div>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Exemplo de BottomSheet"
        subtitle="Fecha com Esc, botão fechar ou clicando fora."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSheetOpen(false);
                showToast('Confirmado!');
              }}
            >
              <Check className="w-4 h-4" /> Confirmar
            </Button>
          </>
        }
      >
        <Field label="Observação" placeholder="Digite algo…" />
      </BottomSheet>

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar exclusão"
        subtitle="Esta ação não pode ser desfeita."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(false);
                showToast('Item removido');
              }}
            >
              Remover
            </Button>
          </>
        }
      >
        <InfoBanner tone="bad">
          O registro será removido permanentemente da lista.
        </InfoBanner>
      </BottomSheet>

      <Toast message={toast} hasBottomNav={false} />
    </div>
  );
}
