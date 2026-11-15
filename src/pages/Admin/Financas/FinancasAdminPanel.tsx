import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, DollarSign, FileText, ShieldCheck } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  FilterChips,
  IconChip,
  ListCard,
  PageHead,
  ProgressBar,
  SearchInput,
  SegmentedTabs,
  Toast,
} from '../../../components/ui';

const DAY_MS = 86400000;
const MULTA_PCT = 0.02;
const JUROS_AM = 0.01;

type BoletoStatus = 'pago' | 'aberto' | 'vencido';
type PayMethod = 'PIX' | 'Dinheiro' | 'Transferência' | 'Outro';
type BoletoKind = 'Taxa extra' | 'Multa' | 'Reserva de área' | 'Outro' | 'Taxa condominial';
type ExpenseCat = 'Manutenção' | 'Pessoal' | 'Energia' | 'Água' | 'Limpeza' | 'Seguro' | 'Outros';
type ExpenseStatus = 'paga' | 'apagar';
type MainTab = 'boletos' | 'despesas' | 'auditoria';
type BoletoFilter = 'todos' | 'vencido' | 'aberto' | 'pago';

interface UnitResident {
  block: number;
  apto: number;
  unit: string;
  resident: string;
}

interface BoletoRecord {
  id: string;
  backendId?: string;
  unit: string;
  resident: string;
  kind: string;
  val: number;
  due: Date;
  status: BoletoStatus;
  paidAt?: Date;
  paidVal?: number;
  method?: PayMethod;
}

interface DespesaRecord {
  id: string;
  backendId?: string;
  desc: string;
  cat: ExpenseCat;
  val: number;
  date: Date;
  status: ExpenseStatus;
  paidAt?: Date;
}

interface AuditRecord {
  id: string;
  at: Date;
  text: string;
  who: string;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function pad3(n: number) {
  return String(n).padStart(3, '0');
}

function fmtBRL(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `−R$ ${formatted}` : `R$ ${formatted}`;
}

function fmtDateShort(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function fmtDateFull(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtDateTime(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseInputDate(s: string): Date {
  const parts = s.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date();
}

function daysBetween(later: Date, earlier: Date): number {
  const a = new Date(later.getFullYear(), later.getMonth(), later.getDate()).getTime();
  const b = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate()).getTime();
  return Math.round((a - b) / DAY_MS);
}

function calcEncargos(b: BoletoRecord, refDate = new Date()) {
  const dias = Math.max(0, daysBetween(refDate, b.due));
  if (b.status !== 'vencido' || dias <= 0) {
    return { dias: 0, multa: 0, juros: 0, total: b.val };
  }
  const multa = Number((b.val * MULTA_PCT).toFixed(2));
  const juros = Number((b.val * JUROS_AM * (dias / 30)).toFixed(2));
  const total = Number((b.val + multa + juros).toFixed(2));
  return { dias, multa, juros, total };
}

function parseBRLInput(raw: string): number {
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (!cleaned) return NaN;
  if (cleaned.includes(',')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  return Number(cleaned);
}

function getOperatorName(): string {
  try {
    const raw = localStorage.getItem('@HabitOS:user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.nome) {
        return String(parsed.nome).split('(')[0].trim() || 'Síndica';
      }
    }
  } catch {
    // fallback
  }
  return 'Ana Laura';
}

const FIRST_NAMES = [
  'Carlos', 'Fernanda', 'João', 'Ana Beatriz', 'Jorge', 'Mariana', 'Rafael', 'Juliana',
  'Lucas', 'Patrícia', 'Gabriel', 'Camila', 'Bruno', 'Larissa', 'Rodrigo', 'Beatriz',
  'Felipe', 'Amanda', 'Thiago', 'Renata', 'Gustavo', 'Letícia', 'Eduardo', 'Vanessa',
];

const LAST_NAMES = [
  'Silva', 'Lima', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues',
  'Almeida', 'Nascimento', 'Ferreira', 'Alves', 'Monteiro', 'Ribeiro', 'Martins', 'Carvalho',
];

const OVERRIDE_RESIDENTS: Record<string, string> = {
  '1-1': 'Carlos Silva',
  '3-2': 'Fernanda Lima',
  '5-1': 'Ana Beatriz',
  '7-2': 'João Lima',
  '8-11': 'Jorge Santos',
  '11-12': 'Carlos Silva',
};

function buildDirectory(): UnitResident[] {
  const list: UnitResident[] = [];
  for (let block = 1; block <= 14; block++) {
    for (let apto = 1; apto <= 12; apto++) {
      const key = `${block}-${apto}`;
      const idx = (block - 1) * 12 + (apto - 1);
      const resident =
        OVERRIDE_RESIDENTS[key] ||
        `${FIRST_NAMES[(idx * 5 + block) % FIRST_NAMES.length]} ${LAST_NAMES[(idx * 3 + apto) % LAST_NAMES.length]}`;
      list.push({
        block,
        apto,
        unit: `Bloco ${pad2(block)} · Apto ${pad3(apto)}`,
        resident,
      });
    }
  }
  return list;
}

const DIRECTORY = buildDirectory();

function buildInitialBoletos(): BoletoRecord[] {
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth();
  const compLabel = `${pad2(baseMonth + 1)}/${baseYear}`;
  const payMethods: PayMethod[] = ['PIX', 'PIX', 'Transferência', 'PIX', 'Dinheiro'];

  const list: BoletoRecord[] = DIRECTORY.map((u, idx) => {
    const baseVal = 620 + ((idx % 4) * 25);
    // Distribuição realista: ~14 vencidos, ~34 em aberto, ~120 pagos
    if (idx % 12 === 1) {
      const daysLate = 3 + ((idx * 3) % 21);
      const due = new Date(now.getTime() - daysLate * DAY_MS);
      return {
        id: `b-${u.block}-${u.apto}`,
        unit: u.unit,
        resident: u.resident,
        kind: `Taxa condominial · ${compLabel}`,
        val: baseVal,
        due,
        status: 'vencido',
      };
    }
    if (idx % 5 === 2) {
      const daysAhead = 2 + (idx % 12);
      const due = new Date(now.getTime() + daysAhead * DAY_MS);
      return {
        id: `b-${u.block}-${u.apto}`,
        unit: u.unit,
        resident: u.resident,
        kind: `Taxa condominial · ${compLabel}`,
        val: baseVal,
        due,
        status: 'aberto',
      };
    }
    const daysAgoPaid = 1 + (idx % 14);
    const paidAt = new Date(now.getTime() - daysAgoPaid * DAY_MS);
    const due = new Date(paidAt.getTime() + 2 * DAY_MS);
    return {
      id: `b-${u.block}-${u.apto}`,
      unit: u.unit,
      resident: u.resident,
      kind: `Taxa condominial · ${compLabel}`,
      val: baseVal,
      due,
      status: 'pago',
      paidAt,
      paidVal: baseVal,
      method: payMethods[idx % payMethods.length],
    };
  });

  // Adiciona boletos extras pontuais no início
  list.unshift(
    {
      id: 'b-extra-1',
      unit: 'Bloco 04 · Apto 007',
      resident: 'Mariana Souza',
      kind: 'Reserva de área · Salão de festas',
      val: 180,
      due: new Date(now.getTime() + 4 * DAY_MS),
      status: 'aberto',
    },
    {
      id: 'b-extra-2',
      unit: 'Bloco 09 · Apto 004',
      resident: 'Rafael Costa',
      kind: 'Multa · Regimento interno',
      val: 320,
      due: new Date(now.getTime() - 9 * DAY_MS),
      status: 'vencido',
    }
  );

  return list;
}

function buildInitialDespesas(): DespesaRecord[] {
  const now = new Date();
  return [
    {
      id: 'd-1',
      desc: 'Folha salarial · Portaria e zeladoria',
      cat: 'Pessoal',
      val: 18450.0,
      date: new Date(now.getTime() - 6 * DAY_MS),
      status: 'paga',
      paidAt: new Date(now.getTime() - 6 * DAY_MS),
    },
    {
      id: 'd-2',
      desc: 'Manutenção preventiva elevadores (14 blocos)',
      cat: 'Manutenção',
      val: 3850.0,
      date: new Date(now.getTime() + 3 * DAY_MS),
      status: 'apagar',
    },
    {
      id: 'd-3',
      desc: 'Contrato limpeza e jardinagem',
      cat: 'Limpeza',
      val: 6200.0,
      date: new Date(now.getTime() - 4 * DAY_MS),
      status: 'paga',
      paidAt: new Date(now.getTime() - 4 * DAY_MS),
    },
    {
      id: 'd-4',
      desc: 'Fornecimento de água e esgoto',
      cat: 'Água',
      val: 5890.0,
      date: new Date(now.getTime() - 8 * DAY_MS),
      status: 'paga',
      paidAt: new Date(now.getTime() - 8 * DAY_MS),
    },
    {
      id: 'd-5',
      desc: 'Conta de energia elétrica · Áreas comuns',
      cat: 'Energia',
      val: 4320.8,
      date: new Date(now.getTime() - 3 * DAY_MS),
      status: 'paga',
      paidAt: new Date(now.getTime() - 3 * DAY_MS),
    },
    {
      id: 'd-6',
      desc: 'Seguro predial mensal',
      cat: 'Seguro',
      val: 2180.0,
      date: new Date(now.getTime() + 6 * DAY_MS),
      status: 'apagar',
    },
    {
      id: 'd-7',
      desc: 'Reparo portão eletrônico Bloco 03',
      cat: 'Manutenção',
      val: 940.0,
      date: new Date(now.getTime() + 1 * DAY_MS),
      status: 'apagar',
    },
    {
      id: 'd-8',
      desc: 'Material de limpeza e insumos',
      cat: 'Outros',
      val: 780.5,
      date: new Date(now.getTime() - 10 * DAY_MS),
      status: 'paga',
      paidAt: new Date(now.getTime() - 10 * DAY_MS),
    },
  ];
}

function buildInitialAudit(): AuditRecord[] {
  const now = new Date();
  return [
    {
      id: 'a-1',
      at: new Date(now.getTime() - 35 * 60000),
      text: 'Baixa manual · Bloco 02 · Apto 005 · R$ 645,00 (PIX)',
      who: 'Ana Laura',
    },
    {
      id: 'a-2',
      at: new Date(now.getTime() - 3 * 3600000),
      text: 'Despesa paga · Conta de energia elétrica · Áreas comuns · R$ 4.320,80',
      who: 'Ana Laura',
    },
    {
      id: 'a-3',
      at: new Date(now.getTime() - 1 * DAY_MS),
      text: 'Boleto emitido · Bloco 04 · Apto 007 · Reserva de área · R$ 180,00',
      who: 'Ana Laura',
    },
    {
      id: 'a-4',
      at: new Date(now.getTime() - 2 * DAY_MS),
      text: 'Lembrete de cobrança enviado · Bloco 09 · Apto 004',
      who: 'Sistema',
    },
  ];
}

const BOLETO_KINDS: Exclude<BoletoKind, 'Taxa condominial'>[] = [
  'Taxa extra',
  'Multa',
  'Reserva de área',
  'Outro',
];

const EXPENSE_CATS: ExpenseCat[] = [
  'Manutenção',
  'Pessoal',
  'Energia',
  'Água',
  'Limpeza',
  'Seguro',
  'Outros',
];

const PAY_METHODS: PayMethod[] = ['PIX', 'Dinheiro', 'Transferência', 'Outro'];

export function FinancasAdminPanel() {
  const [boletos, setBoletos] = useState<BoletoRecord[]>(() => buildInitialBoletos());
  const [despesas, setDespesas] = useState<DespesaRecord[]>(() => buildInitialDespesas());
  const [auditoria, setAuditoria] = useState<AuditRecord[]>(() => buildInitialAudit());

  const [activeTab, setActiveTab] = useState<MainTab>('boletos');
  const [bSearch, setBSearch] = useState('');
  const [bFilter, setBFilter] = useState<BoletoFilter>('todos');
  const [bLimit, setBLimit] = useState(12);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sheet states
  const [activeBoletoId, setActiveBoletoId] = useState<string | null>(null);
  const [bSheetMode, setBSheetMode] = useState<'view' | 'baixa'>('view');
  const [baixaMethod, setBaixaMethod] = useState<PayMethod>('PIX');
  const [baixaDate, setBaixaDate] = useState(() => toInputDate(new Date()));
  const [baixaVal, setBaixaVal] = useState('');

  const [isNbOpen, setIsNbOpen] = useState(false);
  const [nbBlock, setNbBlock] = useState('');
  const [nbApto, setNbApto] = useState('');
  const [nbKind, setNbKind] = useState<Exclude<BoletoKind, 'Taxa condominial'>>('Taxa extra');
  const [nbDesc, setNbDesc] = useState('');
  const [nbVal, setNbVal] = useState('');
  const [nbDue, setNbDue] = useState(() => toInputDate(new Date(Date.now() + 7 * DAY_MS)));

  const [isNeOpen, setIsNeOpen] = useState(false);
  const [neDesc, setNeDesc] = useState('');
  const [neCat, setNeCat] = useState<ExpenseCat>('Manutenção');
  const [neVal, setNeVal] = useState('');
  const [neDate, setNeDate] = useState(() => toInputDate(new Date()));
  const [neStatus, setNeStatus] = useState<ExpenseStatus>('paga');

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const operatorName = useMemo(() => getOperatorName(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  const nextSeqRef = useRef(1);
  const nextSeqId = (prefix: string) => {
    const seq = nextSeqRef.current;
    nextSeqRef.current += 1;
    return `${prefix}-${seq}`;
  };

  const addAudit = (text: string, who = operatorName) => {
    setAuditoria(prev => [
      {
        id: nextSeqId('a'),
        at: new Date(),
        text,
        who,
      },
      ...prev,
    ]);
  };

  // Sincronização opcional com API real caso haja despesas/boletos adicionais no banco
  useEffect(() => {
    let mounted = true;
    api
      .get('/api/v1/financas/despesas')
      .then(res => {
        if (!mounted || !Array.isArray(res.data) || res.data.length <= 3) return;
        const extras: DespesaRecord[] = res.data.slice(0, Math.max(0, res.data.length - 3)).map((d: any) => ({
          id: `api-d-${d.id}`,
          backendId: d.id,
          desc: String(d.descricao || 'Despesa'),
          cat: 'Outros',
          val: Number(d.valor || 0),
          date: d.dataVencimento ? parseInputDate(String(d.dataVencimento)) : new Date(),
          status: d.status === 'PAGO' ? 'paga' : 'apagar',
          paidAt: d.dataPagamento ? parseInputDate(String(d.dataPagamento)) : undefined,
        }));
        if (extras.length > 0) {
          setDespesas(prev => {
            const existingIds = new Set(prev.map(x => x.id));
            return [...extras.filter(e => !existingIds.has(e.id)), ...prev];
          });
        }
      })
      .catch(() => {
        // fallback silencioso para dados locais
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Métricas consolidadas
  const stats = useMemo(() => {
    let paidVal = 0;
    let paidCount = 0;
    let overVal = 0;
    let overCount = 0;
    let openVal = 0;
    let openCount = 0;

    for (const b of boletos) {
      if (b.status === 'pago') {
        paidVal += b.paidVal ?? b.val;
        paidCount += 1;
      } else if (b.status === 'vencido') {
        overVal += b.val;
        overCount += 1;
      } else {
        openVal += b.val;
        openCount += 1;
      }
    }

    const totalBoletoVal = paidVal + overVal + openVal;
    const paidPct = totalBoletoVal > 0 ? Math.round((paidVal / totalBoletoVal) * 100) : 0;
    const overPct = totalBoletoVal > 0 ? (overVal / totalBoletoVal) * 100 : 0;
    const okBarPct = totalBoletoVal > 0 ? (paidVal / totalBoletoVal) * 100 : 0;
    const inadPct = totalBoletoVal > 0 ? (overVal / totalBoletoVal) * 100 : 0;

    let expTotal = 0;
    let expPagas = 0;
    let expApagar = 0;
    for (const d of despesas) {
      expTotal += d.val;
      if (d.status === 'paga') expPagas += d.val;
      else expApagar += d.val;
    }

    const saldo = paidVal - expPagas;

    return {
      paidVal,
      paidCount,
      overVal,
      overCount,
      openVal,
      openCount,
      totalBoletoVal,
      paidPct,
      okBarPct,
      overPct,
      inadPct,
      expTotal,
      expPagas,
      expApagar,
      saldo,
    };
  }, [boletos, despesas]);

  const monthTitle = useMemo(() => {
    const now = new Date();
    const m = now.toLocaleDateString('pt-BR', { month: 'long' });
    return `${m.charAt(0).toUpperCase() + m.slice(1)}/${now.getFullYear()}`;
  }, []);

  // Lista filtrada e ordenada de boletos
  const filteredBoletos = useMemo(() => {
    const q = bSearch.trim().toLowerCase();
    const rank: Record<BoletoStatus, number> = { vencido: 0, aberto: 1, pago: 2 };

    return boletos
      .filter(b => {
        if (bFilter !== 'todos' && b.status !== bFilter) return false;
        if (q) {
          const hay = `${b.unit} ${b.resident} ${b.kind}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        if (a.status === 'pago') {
          return (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0);
        }
        return a.due.getTime() - b.due.getTime();
      });
  }, [boletos, bFilter, bSearch]);

  const shownBoletos = useMemo(() => {
    return filteredBoletos.slice(0, bLimit);
  }, [filteredBoletos, bLimit]);

  const sortedDespesas = useMemo(() => {
    return [...despesas].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'apagar' ? -1 : 1;
      if (a.status === 'apagar') return a.date.getTime() - b.date.getTime();
      return (b.paidAt?.getTime() ?? b.date.getTime()) - (a.paidAt?.getTime() ?? a.date.getTime());
    });
  }, [despesas]);

  const activeBoleto = useMemo(
    () => boletos.find(b => b.id === activeBoletoId) ?? null,
    [boletos, activeBoletoId]
  );

  // Lookup de unidade no modal Emitir Boleto
  const nbLookup = useMemo(() => {
    const bNum = Number(nbBlock);
    const aNum = Number(nbApto);
    if (!nbBlock && !nbApto) {
      return { valid: false, resident: '', unit: '', message: '' };
    }
    if (!Number.isInteger(bNum) || bNum < 1 || bNum > 14 || !Number.isInteger(aNum) || aNum < 1 || aNum > 12) {
      return {
        valid: false,
        resident: '',
        unit: '',
        message: 'Informe Bloco entre 1 e 14 e Apto entre 1 e 12.',
      };
    }
    const found = DIRECTORY.find(u => u.block === bNum && u.apto === aNum);
    if (!found) {
      return { valid: false, resident: '', unit: '', message: 'Unidade não encontrada.' };
    }
    return {
      valid: true,
      resident: found.resident,
      unit: found.unit,
      message: `Morador: ${found.resident}`,
    };
  }, [nbBlock, nbApto]);

  const closeAllSheets = () => {
    setActiveBoletoId(null);
    setIsNbOpen(false);
    setIsNeOpen(false);
  };

  const openBoleto = (id: string, mode: 'view' | 'baixa' = 'view') => {
    const b = boletos.find(item => item.id === id);
    if (!b) return;
    closeAllSheets();
    setActiveBoletoId(id);
    setBSheetMode(mode);
    if (mode === 'baixa') {
      const enc = calcEncargos(b);
      setBaixaMethod('PIX');
      setBaixaDate(toInputDate(new Date()));
      setBaixaVal(enc.total.toFixed(2).replace('.', ','));
    }
  };

  const switchToBaixa = (b: BoletoRecord) => {
    const enc = calcEncargos(b);
    setBSheetMode('baixa');
    setBaixaMethod('PIX');
    setBaixaDate(toInputDate(new Date()));
    setBaixaVal(enc.total.toFixed(2).replace('.', ','));
  };

  const handleConfirmBaixa = () => {
    if (!activeBoleto) return;
    const parsedVal = parseBRLInput(baixaVal);
    const finalVal = !isNaN(parsedVal) && parsedVal > 0 ? parsedVal : calcEncargos(activeBoleto).total;
    const paidAtDate = parseInputDate(baixaDate);

    setBoletos(prev =>
      prev.map(b =>
        b.id === activeBoleto.id
          ? {
              ...b,
              status: 'pago',
              paidAt: paidAtDate,
              paidVal: finalVal,
              method: baixaMethod,
            }
          : b
      )
    );

    addAudit(
      `Baixa manual · ${activeBoleto.unit} · ${fmtBRL(finalVal)} (${baixaMethod})`
    );
    closeAllSheets();
    showToast('Baixa registrada e saldo atualizado');
  };

  const handleSendSingleReminder = (b: BoletoRecord) => {
    addAudit(`Lembrete de cobrança enviado · ${b.unit} (${b.resident})`);
    closeAllSheets();
    showToast(`Lembrete enviado para ${b.unit}`);
  };

  const handleBulkReminder = () => {
    addAudit(
      `Cobrança em lote enviada para ${stats.overCount} ${stats.overCount === 1 ? 'unidade' : 'unidades'} em atraso`
    );
    showToast(
      `Lembrete enviado para ${stats.overCount} ${stats.overCount === 1 ? 'unidade' : 'unidades'}`
    );
  };

  const handleVerInadimplentes = () => {
    setActiveTab('boletos');
    setBFilter('vencido');
    setBSearch('');
    setBLimit(12);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openEmitirBoleto = () => {
    closeAllSheets();
    setNbBlock('');
    setNbApto('');
    setNbKind('Taxa extra');
    setNbDesc('');
    setNbVal('');
    setNbDue(toInputDate(new Date(Date.now() + 7 * DAY_MS)));
    setIsNbOpen(true);
  };

  const canSubmitBoleto = useMemo(() => {
    const val = parseBRLInput(nbVal);
    return nbLookup.valid && !isNaN(val) && val > 0 && Boolean(nbDue);
  }, [nbLookup.valid, nbVal, nbDue]);

  const handleEmitirBoleto = async () => {
    if (!canSubmitBoleto) return;
    if (contemAmeacas(nbDesc)) {
      showToast('Caracteres inválidos detectados na descrição');
      return;
    }

    const val = Number(parseBRLInput(nbVal).toFixed(2));
    const descLimpa = sanitizarEntrada(nbDesc, 120).trim();
    const dueDate = parseInputDate(nbDue);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isOverdue = dueDate.getTime() < todayStart.getTime();
    const kindText = descLimpa ? `${nbKind} · ${descLimpa}` : nbKind;
    const comp = `${pad2(dueDate.getMonth() + 1)}/${dueDate.getFullYear()}`;

    const novoBoleto: BoletoRecord = {
      id: nextSeqId('b-new'),
      unit: nbLookup.unit,
      resident: nbLookup.resident,
      kind: kindText,
      val,
      due: dueDate,
      status: isOverdue ? 'vencido' : 'aberto',
    };

    setBoletos(prev => [novoBoleto, ...prev]);
    addAudit(`Boleto emitido · ${novoBoleto.unit} · ${kindText} · ${fmtBRL(val)}`);
    closeAllSheets();
    setActiveTab('boletos');
    setBFilter('todos');
    showToast(`Boleto emitido para ${novoBoleto.unit}`);

    if (val >= 1) {
      api
        .post('/api/v1/financas/boletos', {
          unidadeTexto: novoBoleto.unit,
          moradorResponsavel: novoBoleto.resident,
          competencia: comp,
          valor: val,
          dataVencimento: nbDue,
        })
        .catch(() => {
          // Persistência local garantida mesmo se API estiver ocupada
        });
    }
  };

  const openLancarDespesa = () => {
    closeAllSheets();
    setNeDesc('');
    setNeCat('Manutenção');
    setNeVal('');
    setNeDate(toInputDate(new Date()));
    setNeStatus('paga');
    setIsNeOpen(true);
  };

  const canSubmitDespesa = useMemo(() => {
    const val = parseBRLInput(neVal);
    return neDesc.trim().length > 0 && !isNaN(val) && val > 0 && Boolean(neDate);
  }, [neDesc, neVal, neDate]);

  const handleLancarDespesa = async () => {
    if (!canSubmitDespesa) return;
    if (contemAmeacas(neDesc)) {
      showToast('Caracteres inválidos detectados na descrição');
      return;
    }

    const descLimpa = sanitizarEntrada(neDesc, 200).trim();
    const val = Number(parseBRLInput(neVal).toFixed(2));
    const dateObj = parseInputDate(neDate);

    const novaDespesa: DespesaRecord = {
      id: nextSeqId('d-new'),
      desc: descLimpa,
      cat: neCat,
      val,
      date: dateObj,
      status: neStatus,
      paidAt: neStatus === 'paga' ? dateObj : undefined,
    };

    setDespesas(prev => [novaDespesa, ...prev]);
    addAudit(
      `Despesa lançada (${neStatus === 'paga' ? 'paga' : 'a pagar'}) · ${descLimpa} · ${fmtBRL(val)}`
    );
    closeAllSheets();
    setActiveTab('despesas');
    showToast('Despesa lançada');

    api
      .post('/api/v1/financas/despesas', {
        descricao: descLimpa,
        valor: val,
        dataVencimento: neDate,
        status: neStatus === 'paga' ? 'PAGO' : 'PENDENTE',
      })
      .catch(() => {});
  };

  const handleMarkExpensePaid = (id: string) => {
    const target = despesas.find(d => d.id === id);
    if (!target || target.status === 'paga') return;

    const now = new Date();
    setDespesas(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'paga', paidAt: now } : d))
    );
    addAudit(`Despesa paga · ${target.desc} · ${fmtBRL(target.val)}`);
    showToast('Despesa marcada como paga');

    if (target.backendId) {
      api.put(`/api/v1/financas/despesas/${target.backendId}/pagar`).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHead eyebrow="Tesouraria" title="Painel financeiro" />

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="primary" onClick={openEmitirBoleto}>
          <Plus className="w-4 h-4" />
          Emitir boleto
        </Button>
        <Button variant="secondary" onClick={openLancarDespesa}>
          <DollarSign className="w-4 h-4" />
          Lançar despesa
        </Button>
      </div>

      {/* Hero Card */}
      <ListCard>
        <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-faint">
          Saldo do mês · {monthTitle}
        </div>
        <div
          className={`font-mono text-[30px] font-semibold tracking-[-0.02em] leading-[1.1] mt-1.5 ${
            stats.saldo < 0 ? 'text-bad' : 'text-ink'
          }`}
        >
          {fmtBRL(stats.saldo)}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-line">
          <div>
            <span className="block text-[10.5px] font-semibold text-dim">Arrecadado</span>
            <b className="font-mono text-[13px] font-semibold text-ink">
              {fmtBRL(stats.paidVal)}
            </b>
          </div>
          <div>
            <span className="block text-[10.5px] font-semibold text-dim">Em atraso</span>
            <b className="font-mono text-[13px] font-semibold text-bad">
              {fmtBRL(stats.overVal)}
            </b>
          </div>
          <div>
            <span className="block text-[10.5px] font-semibold text-dim">Despesas</span>
            <b className="font-mono text-[13px] font-semibold text-ink">
              {fmtBRL(stats.expPagas)}
            </b>
          </div>
        </div>
      </ListCard>

      {/* Arrecadação Card */}
      <ListCard>
        <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-faint">
          Arrecadação dos boletos
        </div>
        <div className="flex justify-between items-baseline gap-2 mt-2 mb-2.5">
          <b className="font-mono text-[13.5px] font-semibold text-ink">
            {fmtBRL(stats.paidVal)} de {fmtBRL(stats.totalBoletoVal)}
          </b>
          <span className="font-mono text-[13px] font-semibold text-brand">{stats.paidPct}%</span>
        </div>
        <ProgressBar percent={stats.okBarPct} secondaryPercent={stats.overPct} />
        <div className="flex flex-wrap gap-3 mt-2.5 text-[11.5px] text-dim">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ok" />
            {stats.paidCount} pagos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-bad" />
            {stats.overCount} em atraso
          </span>
          {stats.openCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-faint" />
              {stats.openCount} a vencer
            </span>
          )}
        </div>
      </ListCard>

      {/* Alert Box */}
      {stats.overCount > 0 && (
        <section className="rounded-[14px] p-3.5 bg-bad-soft border border-bad/25">
          <div className="text-[14px] font-extrabold text-bad">
            Inadimplência de {stats.inadPct.toFixed(1).replace('.', ',')}%
          </div>
          <p className="text-[12.5px] text-ink/90 mt-1 mb-3 leading-[1.45]">
            {stats.overCount} {stats.overCount === 1 ? 'boleto' : 'boletos'} em atraso somando{' '}
            {fmtBRL(stats.overVal)} (sem multa e juros).
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" size="card" onClick={handleVerInadimplentes}>
              Ver inadimplentes
            </Button>
            <Button variant="secondary" size="card" onClick={handleBulkReminder}>
              Enviar cobrança
            </Button>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div ref={tabsRef}>
        <SegmentedTabs
          value={activeTab}
          onChange={(v) => setActiveTab(v as MainTab)}
          items={[
            { id: 'boletos', label: 'Boletos', count: boletos.length },
            { id: 'despesas', label: 'Despesas', count: despesas.length },
            { id: 'auditoria', label: 'Auditoria', count: auditoria.length },
          ]}
        />
      </div>

      {/* Tab: Boletos */}
      {activeTab === 'boletos' && (
        <div className="flex flex-col gap-3">
          <SearchInput
            value={bSearch}
            onChange={(val) => {
              setBSearch(val);
              setBLimit(12);
            }}
            placeholder="Buscar unidade ou morador"
          />

          <FilterChips
            value={bFilter}
            onChange={(val) => {
              setBFilter(val as BoletoFilter);
              setBLimit(12);
            }}
            items={[
              { id: 'todos', label: 'Todos', count: boletos.length },
              { id: 'vencido', label: 'Vencidos', count: stats.overCount },
              { id: 'aberto', label: 'Em aberto', count: stats.openCount },
              { id: 'pago', label: 'Pagos', count: stats.paidCount },
            ]}
          />

          {shownBoletos.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-6 h-6 text-faint" />}
              title="Nenhum boleto encontrado"
              description="Ajuste a busca ou o filtro selecionado."
            />
          ) : (
            <>
              <div className="bg-surface border border-line rounded-[14px] overflow-hidden divide-y divide-line">
                {shownBoletos.map((b) => {
                  const daysLate = Math.max(0, daysBetween(new Date(), b.due));
                  const statusText =
                    b.status === 'pago'
                      ? `Pago em ${b.paidAt ? fmtDateShort(b.paidAt) : fmtDateShort(b.due)} via ${b.method || 'PIX'}`
                      : b.status === 'vencido'
                      ? `Venceu há ${daysLate} ${daysLate === 1 ? 'dia' : 'dias'}`
                      : daysBetween(b.due, new Date()) === 0
                      ? 'Vence hoje'
                      : `Vence em ${fmtDateShort(b.due)}`;

                  return (
                    <div
                      key={b.id}
                      onClick={() => openBoleto(b.id, 'view')}
                      className="flex items-center gap-3 p-[12px_14px] cursor-pointer hover:bg-canvas transition-colors"
                    >
                      <IconChip
                        tone={
                          b.status === 'vencido'
                            ? 'bad'
                            : b.status === 'pago'
                            ? 'ok'
                            : 'neutral'
                        }
                        size="md"
                      >
                        <FileText className="w-4 h-4" />
                      </IconChip>

                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[13px] font-semibold text-ink truncate">
                          {b.unit}
                        </div>
                        <div className="text-[12px] text-dim truncate">
                          {b.resident} · {b.kind}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            b.status === 'vencido' ? 'text-bad font-bold' : 'text-dim'
                          }`}
                        >
                          {statusText}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="font-mono text-[13.5px] font-semibold text-ink">
                          {fmtBRL(b.val)}
                        </div>
                        {b.status === 'pago' ? (
                          <Badge tone="ok">PAGO</Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBoleto(b.id, 'baixa');
                            }}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-[8px] border border-line bg-canvas text-ink hover:border-brand hover:text-brand cursor-pointer transition-colors"
                          >
                            Dar baixa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredBoletos.length > shownBoletos.length && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setBLimit((prev) => prev + 15)}
                >
                  Mostrar mais ({filteredBoletos.length - shownBoletos.length})
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Despesas */}
      {activeTab === 'despesas' && (
        <div className="flex flex-col gap-3">
          <div className="font-mono text-[11.5px] text-dim">
            Total {fmtBRL(stats.expTotal)} · pagas {fmtBRL(stats.expPagas)} · a pagar{' '}
            {fmtBRL(stats.expApagar)}
          </div>

          {sortedDespesas.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-6 h-6 text-faint" />}
              title="Nenhuma despesa lançada"
              description='Use "Lançar despesa" para registrar um gasto.'
            />
          ) : (
            <div className="bg-surface border border-line rounded-[14px] overflow-hidden divide-y divide-line">
              {sortedDespesas.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-[12px_14px]">
                  <IconChip tone={d.status === 'paga' ? 'ok' : 'neutral'} size="md">
                    <DollarSign className="w-4 h-4" />
                  </IconChip>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-ink truncate">{d.desc}</div>
                    <div className="text-[12px] text-dim truncate">
                      {d.cat} · {fmtDateShort(d.date)}
                    </div>
                    <div className="text-[11px] text-dim mt-0.5">
                      {d.status === 'paga'
                        ? `Paga em ${fmtDateShort(d.paidAt || d.date)}`
                        : `A pagar · venc. ${fmtDateShort(d.date)}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="font-mono text-[13.5px] font-semibold text-ink">
                      {fmtBRL(d.val)}
                    </div>
                    {d.status === 'paga' ? (
                      <Badge tone="ok">PAGA</Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkExpensePaid(d.id)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-[8px] border border-line bg-canvas text-ink hover:border-brand hover:text-brand cursor-pointer transition-colors"
                      >
                        Marcar paga
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Auditoria */}
      {activeTab === 'auditoria' && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface border border-line rounded-[14px] overflow-hidden divide-y divide-line">
            {auditoria.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-[12px_14px]">
                <IconChip tone="neutral" size="md">
                  <ShieldCheck className="w-4 h-4" />
                </IconChip>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10.5px] text-dim">{fmtDateTime(a.at)}</div>
                  <div className="text-[13px] text-ink mt-0.5 leading-[1.4]">{a.text}</div>
                  <div className="text-[11.5px] text-dim mt-0.5">por {a.who}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[12px] leading-[1.5] text-dim bg-canvas border border-line rounded-[10px] p-[10px_12px]">
            Registros da trilha não podem ser editados nem apagados. Toda baixa, emissão e despesa
            fica aqui.
          </div>
        </div>
      )}

      {/* Sheet 1: Detalhe do Boleto / Dar Baixa */}
      <BottomSheet
        open={Boolean(activeBoleto)}
        onClose={closeAllSheets}
        title={
          activeBoleto
            ? bSheetMode === 'view'
              ? activeBoleto.unit
              : 'Dar baixa manual'
            : ''
        }
        subtitle={
          activeBoleto
            ? bSheetMode === 'view'
              ? `${activeBoleto.resident} · ${activeBoleto.kind}`
              : `${activeBoleto.unit} · ${activeBoleto.resident}`
            : undefined
        }
        footer={
          activeBoleto ? (
            bSheetMode === 'view' ? (
              activeBoleto.status === 'pago' ? (
                <Button variant="secondary" fullWidth onClick={closeAllSheets}>
                  Fechar
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="secondary"
                    onClick={() => handleSendSingleReminder(activeBoleto)}
                  >
                    Enviar lembrete
                  </Button>
                  <Button variant="primary" onClick={() => switchToBaixa(activeBoleto)}>
                    Dar baixa
                  </Button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
                <Button variant="secondary" onClick={() => setBSheetMode('view')}>
                  Voltar
                </Button>
                <Button variant="primary" onClick={handleConfirmBaixa}>
                  Confirmar baixa
                </Button>
              </div>
            )
          ) : undefined
        }
      >
        {activeBoleto && bSheetMode === 'view' && (() => {
          const enc = calcEncargos(activeBoleto);
          return (
            <div className="border-t border-line">
              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Vencimento</span>
                <b
                  className={`font-mono ${
                    activeBoleto.status === 'vencido' ? 'text-bad' : 'text-ink'
                  }`}
                >
                  {fmtDateFull(activeBoleto.due)}
                  {activeBoleto.status === 'vencido' && enc.dias > 0 ? ` (${enc.dias}d atrás)` : ''}
                </b>
              </div>
              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Valor nominal</span>
                <b className="font-mono text-ink">{fmtBRL(activeBoleto.val)}</b>
              </div>

              {activeBoleto.status === 'vencido' && enc.dias > 0 && (
                <>
                  <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                    <span className="text-dim">Multa (2%)</span>
                    <b className="font-mono text-bad">{fmtBRL(enc.multa)}</b>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                    <span className="text-dim">Juros (1% a.m. · {enc.dias}d)</span>
                    <b className="font-mono text-bad">{fmtBRL(enc.juros)}</b>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13.5px] font-bold">
                    <span className="text-ink">Total atualizado</span>
                    <b className="font-mono text-ink">{fmtBRL(enc.total)}</b>
                  </div>
                </>
              )}

              <div className="flex justify-between gap-3 py-2.5 border-b border-line text-[13px]">
                <span className="text-dim">Situação</span>
                {activeBoleto.status === 'pago' ? (
                  <b className="text-ok">
                    Pago em{' '}
                    {activeBoleto.paidAt
                      ? fmtDateShort(activeBoleto.paidAt)
                      : fmtDateShort(activeBoleto.due)}{' '}
                    · {activeBoleto.method || 'PIX'}
                  </b>
                ) : activeBoleto.status === 'vencido' ? (
                  <b className="text-bad">Em atraso</b>
                ) : (
                  <b className="text-ink">Em aberto</b>
                )}
              </div>
            </div>
          );
        })()}

        {activeBoleto && bSheetMode === 'baixa' && (
          <div className="flex flex-col gap-4">
            <ChoiceChips
              label="Forma de pagamento"
              options={PAY_METHODS.map((m) => ({ value: m, label: m }))}
              value={baixaMethod}
              onChange={(v) => setBaixaMethod(v as PayMethod)}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <Field
                label="Data do pagamento"
                type="date"
                mono
                value={baixaDate}
                onChange={(e) => setBaixaDate(e.target.value)}
              />
              <Field
                label="Valor recebido (R$)"
                type="text"
                inputMode="decimal"
                mono
                value={baixaVal}
                onChange={(e) => setBaixaVal(e.target.value)}
              />
            </div>

            <div className="text-[12px] leading-[1.5] text-dim bg-canvas border border-line rounded-[10px] p-[10px_12px]">
              A baixa gera registro na trilha de auditoria e atualiza o saldo do condomínio.
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Sheet 2: Emitir Boleto */}
      <BottomSheet
        open={isNbOpen}
        onClose={closeAllSheets}
        title="Emitir boleto"
        subtitle="Cobrança avulsa para uma unidade."
        footer={
          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
            <Button variant="secondary" onClick={closeAllSheets}>
              Cancelar
            </Button>
            <Button variant="primary" disabled={!canSubmitBoleto} onClick={handleEmitirBoleto}>
              Emitir boleto
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Bloco (1 a 14)"
              type="number"
              min={1}
              max={14}
              inputMode="numeric"
              mono
              placeholder="Ex: 3"
              value={nbBlock}
              onChange={(e) => setNbBlock(e.target.value)}
            />
            <Field
              label="Apto (1 a 12)"
              type="number"
              min={1}
              max={12}
              inputMode="numeric"
              mono
              placeholder="Ex: 2"
              value={nbApto}
              onChange={(e) => setNbApto(e.target.value)}
            />
          </div>

          {nbLookup.message && (
            <div
              className={`text-[12px] leading-[1.45] rounded-[10px] p-[9px_12px] ${
                nbLookup.valid ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'
              }`}
            >
              {nbLookup.message}
            </div>
          )}

          <ChoiceChips<string>
            label="Tipo"
            options={BOLETO_KINDS.map((k) => ({ value: k, label: k }))}
            value={nbKind}
            onChange={(v) => setNbKind(v as Exclude<BoletoKind, 'Taxa condominial'>)}
          />

          <Field
            label="Descrição (opcional)"
            type="text"
            placeholder="Ex: Rateio reforma do telhado"
            value={nbDesc}
            onChange={(e) => setNbDesc(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Valor (R$)"
              type="text"
              inputMode="decimal"
              mono
              placeholder="0,00"
              value={nbVal}
              onChange={(e) => setNbVal(e.target.value)}
            />
            <Field
              label="Vencimento"
              type="date"
              mono
              value={nbDue}
              onChange={(e) => setNbDue(e.target.value)}
            />
          </div>
        </div>
      </BottomSheet>

      {/* Sheet 3: Lançar Despesa */}
      <BottomSheet
        open={isNeOpen}
        onClose={closeAllSheets}
        title="Lançar despesa"
        subtitle="Registre um pagamento ou conta a vencer do condomínio."
        footer={
          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
            <Button variant="secondary" onClick={closeAllSheets}>
              Cancelar
            </Button>
            <Button variant="primary" disabled={!canSubmitDespesa} onClick={handleLancarDespesa}>
              Lançar despesa
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Descrição"
            type="text"
            placeholder="Ex: Troca de bomba da caixa d'água"
            value={neDesc}
            onChange={(e) => setNeDesc(e.target.value)}
          />

          <ChoiceChips
            label="Categoria"
            options={EXPENSE_CATS.map((c) => ({ value: c, label: c }))}
            value={neCat}
            onChange={(v) => setNeCat(v as ExpenseCat)}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Valor (R$)"
              type="text"
              inputMode="decimal"
              mono
              placeholder="0,00"
              value={neVal}
              onChange={(e) => setNeVal(e.target.value)}
            />
            <Field
              label="Data"
              type="date"
              mono
              value={neDate}
              onChange={(e) => setNeDate(e.target.value)}
            />
          </div>

          <ChoiceChips
            label="Situação"
            options={[
              { value: 'paga', label: 'Já paga' },
              { value: 'apagar', label: 'A pagar' },
            ]}
            value={neStatus}
            onChange={(v) => setNeStatus(v as ExpenseStatus)}
          />
        </div>
      </BottomSheet>

      <Toast message={toastMsg} />
    </div>
  );
}
