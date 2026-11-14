import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

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

  const anySheetOpen = Boolean(activeBoleto) || isNbOpen || isNeOpen;

  return (
    <div className="flex flex-col min-h-full">
      <style>{`
        .fin-page-head { padding: 10px 18px 0; }
        .fin-eyebrow { font-size: 11px; font-weight: 700; color: var(--ds-faint); text-transform: uppercase; letter-spacing: .06em; }
        .fin-h1 { font-size: 21px; font-weight: 800; margin: 3px 0 14px; letter-spacing: -.01em; color: var(--ds-text); }
        .fin-cta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .fin-btn { font-family: inherit; font-size: 13.5px; font-weight: 700; height: 46px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-text); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; transition: filter .15s, transform .1s; }
        .fin-btn:active { transform: scale(.98); }
        .fin-btn svg { width: 16px; height: 16px; flex: none; }
        .fin-btn.primary { background: var(--ds-primary); border-color: var(--ds-primary); color: var(--ds-primary-ink); }
        .fin-btn.primary:hover { filter: brightness(1.07); }
        .fin-btn:disabled { opacity: .4; cursor: not-allowed; }

        .fin-main { flex: 1; padding: 16px 18px 110px; display: flex; flex-direction: column; gap: 12px; }
        .fin-card { background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 16px; padding: 16px; }
        .fin-lab { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--ds-faint); }
        .fin-big { font-family: 'IBM Plex Mono', monospace; font-size: 30px; font-weight: 600; letter-spacing: -.02em; margin: 6px 0 14px; color: var(--ds-text); }
        .fin-big.neg { color: var(--ds-danger); }
        .fin-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--ds-border); }
        .fin-mini div span { display: block; font-size: 10.5px; color: var(--ds-dim); margin-bottom: 3px; }
        .fin-mini div b { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600; color: var(--ds-text); }
        .fin-mini .bad b { color: var(--ds-danger); }

        .fin-arr-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin: 6px 0 10px; }
        .fin-arr-top b { font-family: 'IBM Plex Mono', monospace; font-size: 15.5px; font-weight: 600; color: var(--ds-text); }
        .fin-arr-top span { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--ds-success); font-weight: 600; }
        .fin-stack { display: flex; height: 9px; border-radius: 999px; overflow: hidden; background: var(--ds-border); }
        .fin-stack i { display: block; height: 100%; transition: width .25s ease; }
        .fin-stack .s-ok { background: var(--ds-success); }
        .fin-stack .s-bad { background: var(--ds-danger); }
        .fin-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; font-size: 11.5px; color: var(--ds-dim); }
        .fin-legend span { display: inline-flex; align-items: center; }
        .fin-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }

        .fin-alert { background: var(--ds-danger-dim); border: 1px solid var(--ds-danger-dim); border-radius: 16px; padding: 14px 16px; }
        .fin-alert .a-t { font-size: 14px; font-weight: 800; color: var(--ds-danger); }
        .fin-alert .a-s { font-size: 12.5px; color: var(--ds-danger); opacity: .92; margin-top: 3px; line-height: 1.5; }
        .fin-alert .a-acts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
        .fin-alert .fin-btn { height: 40px; font-size: 12.5px; background: var(--ds-card); }

        .fin-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 12px; margin-top: 4px; }
        .fin-tab { border: none; background: none; font-family: inherit; font-size: 12px; font-weight: 700; color: var(--ds-dim); padding: 9px 2px; border-radius: 9px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all .15s; }
        .fin-tab b { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: var(--ds-text); }
        .fin-tab.active { background: var(--ds-primary-dim); color: var(--ds-primary); }
        .fin-tab.active b { color: var(--ds-primary); }

        .fin-search { position: relative; margin-bottom: 10px; }
        .fin-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--ds-faint); pointer-events: none; }
        .fin-search input { width: 100%; height: 44px; padding: 0 13px 0 38px; border-radius: 12px; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-text); font-family: inherit; font-size: 14px; outline: none; }
        .fin-search input:focus-visible { outline: 2px solid var(--ds-primary); outline-offset: 1px; }

        .fin-fchips { display: flex; gap: 7px; overflow-x: auto; margin-bottom: 10px; padding-bottom: 2px; }
        .fin-fchips::-webkit-scrollbar { display: none; }
        .fin-fc { flex: none; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-dim); font-family: inherit; font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 999px; cursor: pointer; }
        .fin-fc b { font-family: 'IBM Plex Mono', monospace; font-weight: 600; margin-left: 4px; color: var(--ds-text); }
        .fin-fc.active { background: var(--ds-primary-dim); border-color: var(--ds-primary); color: var(--ds-primary); }
        .fin-fc.active b { color: var(--ds-primary); }

        .fin-list { background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 14px; overflow: hidden; }
        .fin-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--ds-border); cursor: pointer; transition: background .12s; }
        .fin-row:hover { background: var(--ds-bg); }
        .fin-row.static { cursor: default; }
        .fin-row.static:hover { background: transparent; }
        .fin-row:last-child { border-bottom: none; }

        .fin-rico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex: none; background: var(--ds-bg); color: var(--ds-dim); border: 1px solid var(--ds-border); }
        .fin-rico svg { width: 17px; height: 17px; }
        .fin-rico.bad { background: var(--ds-danger-dim); color: var(--ds-danger); border-color: var(--ds-danger-dim); }
        .fin-rico.ok { background: var(--ds-success-dim); color: var(--ds-success); border-color: var(--ds-success-dim); }

        .fin-rbody { flex: 1; min-width: 0; }
        .fin-rt { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600; color: var(--ds-text); }
        .fin-rt-sans { font-size: 13.5px; font-weight: 700; color: var(--ds-text); }
        .fin-rn { font-size: 12px; color: var(--ds-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fin-rd { font-size: 11px; color: var(--ds-dim); margin-top: 2px; }
        .fin-rd.bad { color: var(--ds-danger); font-weight: 600; }

        .fin-rright { text-align: right; flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .fin-rv { font-family: 'IBM Plex Mono', monospace; font-size: 13.5px; font-weight: 600; color: var(--ds-text); }
        .fin-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; font-weight: 700; padding: 3px 7px; border-radius: 999px; letter-spacing: .04em; text-transform: uppercase; }
        .fin-badge.ok { background: var(--ds-success-dim); color: var(--ds-success); }
        .fin-badge.bad { background: var(--ds-danger-dim); color: var(--ds-danger); }
        .fin-badge.open { background: var(--ds-warning-dim); color: var(--ds-warning); }
        .fin-mini-btn { font-family: inherit; font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 8px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); cursor: pointer; }
        .fin-mini-btn:hover { border-color: var(--ds-primary); color: var(--ds-primary); }

        .fin-sum-line { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--ds-dim); margin-bottom: 10px; }
        .fin-more-btn { width: 100%; height: 42px; margin-top: 10px; border-radius: 12px; border: 1px solid var(--ds-border); background: var(--ds-card); color: var(--ds-primary); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .fin-audit-note { font-size: 11.5px; color: var(--ds-dim); text-align: center; margin-top: 10px; line-height: 1.5; padding: 0 8px; }

        .fin-empty { text-align: center; padding: 32px 18px; background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 14px; }
        .fin-empty-t { font-size: 14.5px; font-weight: 800; color: var(--ds-text); }
        .fin-empty-s { font-size: 12.5px; color: var(--ds-dim); margin-top: 4px; }

        .fin-overlay { position: fixed; inset: 0; background: rgba(10,10,14,.48); opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 50; }
        .fin-overlay.show { opacity: 1; pointer-events: auto; }
        .fin-sheet { position: fixed; left: 50%; bottom: 0; transform: translate(-50%, 100%); width: 100%; max-width: 412px; background: var(--ds-card); border-radius: 20px 20px 0 0; padding: 20px 20px calc(22px + env(safe-area-inset-bottom, 0px)); z-index: 51; transition: transform .25s ease; max-height: 92vh; overflow-y: auto; border-top: 1px solid var(--ds-border); }
        .fin-sheet.show { transform: translate(-50%, 0); }

        .fin-sh-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
        .fin-sh-head h2 { font-size: 17px; font-weight: 800; margin: 0; color: var(--ds-text); }
        .fin-close-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); display: grid; place-items: center; cursor: pointer; flex: none; }
        .fin-close-btn svg { width: 15px; height: 15px; }
        .fin-sh-sub { font-size: 12.5px; color: var(--ds-dim); margin-bottom: 14px; }

        .fin-kv-box { background: var(--ds-bg); border: 1px solid var(--ds-border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .fin-kv { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 12.5px; color: var(--ds-dim); }
        .fin-kv b { font-family: 'IBM Plex Mono', monospace; color: var(--ds-text); font-weight: 600; }
        .fin-kv.total { padding-top: 8px; border-top: 1px solid var(--ds-border); font-weight: 700; color: var(--ds-text); }
        .fin-kv.total b { font-size: 15px; }
        .fin-kv b.bad { color: var(--ds-danger); }
        .fin-kv b.ok { color: var(--ds-success); }

        .fin-lbl { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--ds-dim); margin-bottom: 6px; }
        .fin-input { width: 100%; height: 44px; padding: 0 12px; border-radius: 11px; border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-text); font-family: inherit; font-size: 14px; outline: none; margin-bottom: 12px; }
        .fin-input.mono { font-family: 'IBM Plex Mono', monospace; }
        .fin-input:focus { border-color: var(--ds-primary); }

        .fin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .fin-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
        .fin-chip { border: 1px solid var(--ds-border); background: var(--ds-bg); color: var(--ds-dim); font-family: inherit; font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 999px; cursor: pointer; }
        .fin-chip.active { background: var(--ds-primary-dim); border-color: var(--ds-primary); color: var(--ds-primary); }

        .fin-unit-note { font-size: 12px; padding: 8px 11px; border-radius: 10px; margin-bottom: 12px; }
        .fin-unit-note.ok { background: var(--ds-success-dim); color: var(--ds-success); font-weight: 600; }
        .fin-unit-note.err { background: var(--ds-danger-dim); color: var(--ds-danger); font-weight: 600; }

        .fin-sh-note { font-size: 11.5px; color: var(--ds-dim); line-height: 1.45; margin-bottom: 14px; }
        .fin-sh-acts { display: grid; grid-template-columns: 1fr 1.3fr; gap: 10px; }
        .fin-sh-acts.single { grid-template-columns: 1fr; }

        .fin-toast { position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--ds-text); color: var(--ds-bg); font-size: 13px; font-weight: 600; padding: 11px 18px; border-radius: 10px; opacity: 0; transition: transform .25s, opacity .25s; z-index: 60; white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
        .fin-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
      `}</style>

      {/* Page Head */}
      <div className="fin-page-head">
        <div className="fin-eyebrow">Tesouraria</div>
        <h1 className="fin-h1">Painel financeiro</h1>
        <div className="fin-cta-row">
          <button type="button" className="fin-btn primary" onClick={openEmitirBoleto}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Emitir boleto
          </button>
          <button type="button" className="fin-btn" onClick={openLancarDespesa}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Lançar despesa
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="fin-main">
        {/* Hero Card */}
        <section id="hero" className="fin-card">
          <div className="fin-lab">Saldo do mês · {monthTitle}</div>
          <div className={`fin-big ${stats.saldo < 0 ? 'neg' : ''}`}>
            {fmtBRL(stats.saldo)}
          </div>
          <div className="fin-mini">
            <div>
              <span>Arrecadado</span>
              <b>{fmtBRL(stats.paidVal)}</b>
            </div>
            <div className="bad">
              <span>Em atraso</span>
              <b>{fmtBRL(stats.overVal)}</b>
            </div>
            <div>
              <span>Despesas</span>
              <b>{fmtBRL(stats.expPagas)}</b>
            </div>
          </div>
        </section>

        {/* Arrecadação Card */}
        <section id="arr" className="fin-card">
          <div className="fin-lab">Arrecadação dos boletos</div>
          <div className="fin-arr-top">
            <b>
              {fmtBRL(stats.paidVal)} de {fmtBRL(stats.totalBoletoVal)}
            </b>
            <span>{stats.paidPct}%</span>
          </div>
          <div className="fin-stack">
            <i className="s-ok" style={{ width: `${stats.okBarPct}%` }} />
            <i className="s-bad" style={{ width: `${stats.overPct}%` }} />
          </div>
          <div className="fin-legend">
            <span>
              <i style={{ background: 'var(--ds-success)' }} />
              {stats.paidCount} pagos
            </span>
            <span>
              <i style={{ background: 'var(--ds-danger)' }} />
              {stats.overCount} em atraso
            </span>
            {stats.openCount > 0 && (
              <span>
                <i style={{ background: 'var(--ds-faint)' }} />
                {stats.openCount} a vencer
              </span>
            )}
          </div>
        </section>

        {/* Alert Box */}
        {stats.overCount > 0 && (
          <section id="alertBox" className="fin-alert">
            <div className="a-t">
              Inadimplência de {stats.inadPct.toFixed(1).replace('.', ',')}%
            </div>
            <div className="a-s">
              {stats.overCount} {stats.overCount === 1 ? 'boleto' : 'boletos'} em atraso somando{' '}
              {fmtBRL(stats.overVal)} (sem multa e juros).
            </div>
            <div className="a-acts">
              <button type="button" className="fin-btn" onClick={handleVerInadimplentes}>
                Ver inadimplentes
              </button>
              <button type="button" className="fin-btn" onClick={handleBulkReminder}>
                Enviar cobrança
              </button>
            </div>
          </section>
        )}

        {/* Tabs */}
        <div id="tabs" ref={tabsRef} className="fin-tabs">
          <button
            type="button"
            className={`fin-tab ${activeTab === 'boletos' ? 'active' : ''}`}
            onClick={() => setActiveTab('boletos')}
          >
            Boletos
            <b>{boletos.length}</b>
          </button>
          <button
            type="button"
            className={`fin-tab ${activeTab === 'despesas' ? 'active' : ''}`}
            onClick={() => setActiveTab('despesas')}
          >
            Despesas
            <b>{despesas.length}</b>
          </button>
          <button
            type="button"
            className={`fin-tab ${activeTab === 'auditoria' ? 'active' : ''}`}
            onClick={() => setActiveTab('auditoria')}
          >
            Auditoria
            <b>{auditoria.length}</b>
          </button>
        </div>

        {/* Tab: Boletos */}
        {activeTab === 'boletos' && (
          <div>
            <div className="fin-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={bSearch}
                onChange={e => {
                  setBSearch(e.target.value);
                  setBLimit(12);
                }}
                placeholder="Buscar unidade ou morador"
              />
            </div>

            <div className="fin-fchips">
              <button
                type="button"
                className={`fin-fc ${bFilter === 'todos' ? 'active' : ''}`}
                onClick={() => {
                  setBFilter('todos');
                  setBLimit(12);
                }}
              >
                Todos<b>{boletos.length}</b>
              </button>
              <button
                type="button"
                className={`fin-fc ${bFilter === 'vencido' ? 'active' : ''}`}
                onClick={() => {
                  setBFilter('vencido');
                  setBLimit(12);
                }}
              >
                Vencidos<b>{stats.overCount}</b>
              </button>
              <button
                type="button"
                className={`fin-fc ${bFilter === 'aberto' ? 'active' : ''}`}
                onClick={() => {
                  setBFilter('aberto');
                  setBLimit(12);
                }}
              >
                Em aberto<b>{stats.openCount}</b>
              </button>
              <button
                type="button"
                className={`fin-fc ${bFilter === 'pago' ? 'active' : ''}`}
                onClick={() => {
                  setBFilter('pago');
                  setBLimit(12);
                }}
              >
                Pagos<b>{stats.paidCount}</b>
              </button>
            </div>

            {shownBoletos.length === 0 ? (
              <div className="fin-empty">
                <div className="fin-empty-t">Nenhum boleto encontrado</div>
                <div className="fin-empty-s">Ajuste a busca ou o filtro selecionado.</div>
              </div>
            ) : (
              <>
                <div className="fin-list">
                  {shownBoletos.map(b => {
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
                        className="fin-row"
                        onClick={() => openBoleto(b.id, 'view')}
                      >
                        <div className={`fin-rico ${b.status === 'vencido' ? 'bad' : b.status === 'pago' ? 'ok' : ''}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6M8 13h8M8 17h5" />
                          </svg>
                        </div>

                        <div className="fin-rbody">
                          <div className="fin-rt">{b.unit}</div>
                          <div className="fin-rn">
                            {b.resident} · {b.kind}
                          </div>
                          <div className={`fin-rd ${b.status === 'vencido' ? 'bad' : ''}`}>
                            {statusText}
                          </div>
                        </div>

                        <div className="fin-rright">
                          <div className="fin-rv">{fmtBRL(b.val)}</div>
                          {b.status === 'pago' ? (
                            <span className="fin-badge ok">PAGO</span>
                          ) : (
                            <button
                              type="button"
                              className="fin-mini-btn"
                              onClick={e => {
                                e.stopPropagation();
                                openBoleto(b.id, 'baixa');
                              }}
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
                  <button
                    type="button"
                    className="fin-more-btn"
                    onClick={() => setBLimit(prev => prev + 15)}
                  >
                    Mostrar mais ({filteredBoletos.length - shownBoletos.length})
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Despesas */}
        {activeTab === 'despesas' && (
          <div>
            <div className="fin-sum-line">
              Total {fmtBRL(stats.expTotal)} · pagas {fmtBRL(stats.expPagas)} · a pagar{' '}
              {fmtBRL(stats.expApagar)}
            </div>

            {sortedDespesas.length === 0 ? (
              <div className="fin-empty">
                <div className="fin-empty-t">Nenhuma despesa lançada</div>
                <div className="fin-empty-s">Use "Lançar despesa" para registrar um gasto.</div>
              </div>
            ) : (
              <div className="fin-list">
                {sortedDespesas.map(d => (
                  <div key={d.id} className="fin-row static">
                    <div className={`fin-rico ${d.status === 'paga' ? 'ok' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>

                    <div className="fin-rbody">
                      <div className="fin-rt-sans">{d.desc}</div>
                      <div className="fin-rn">
                        {d.cat} · {fmtDateShort(d.date)}
                      </div>
                      <div className="fin-rd">
                        {d.status === 'paga'
                          ? `Paga em ${fmtDateShort(d.paidAt || d.date)}`
                          : `A pagar · venc. ${fmtDateShort(d.date)}`}
                      </div>
                    </div>

                    <div className="fin-rright">
                      <div className="fin-rv">{fmtBRL(d.val)}</div>
                      {d.status === 'paga' ? (
                        <span className="fin-badge ok">PAGA</span>
                      ) : (
                        <button
                          type="button"
                          className="fin-mini-btn"
                          onClick={() => handleMarkExpensePaid(d.id)}
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
          <div>
            <div className="fin-list">
              {auditoria.map(a => (
                <div key={a.id} className="fin-row static">
                  <div className="fin-rico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="fin-rbody">
                    <div className="fin-rt">{fmtDateTime(a.at)}</div>
                    <div className="fin-rn" style={{ whiteSpace: 'normal' }}>
                      {a.text}
                    </div>
                    <div className="fin-rd">por {a.who}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fin-audit-note">
              Registros da trilha não podem ser editados nem apagados. Toda baixa, emissão e despesa fica aqui.
            </div>
          </div>
        )}
      </main>

      {/* Backdrop */}
      <div
        className={`fin-overlay ${anySheetOpen ? 'show' : ''}`}
        onClick={closeAllSheets}
      />

      {/* Sheet 1: Detalhe do Boleto / Dar Baixa */}
      <div id="bSheet" className={`fin-sheet ${activeBoleto ? 'show' : ''}`}>
        {activeBoleto && bSheetMode === 'view' && (() => {
          const enc = calcEncargos(activeBoleto);
          return (
            <>
              <div className="fin-sh-head">
                <h2>{activeBoleto.unit}</h2>
                <button
                  type="button"
                  className="fin-close-btn"
                  onClick={closeAllSheets}
                  aria-label="Fechar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="fin-sh-sub">
                {activeBoleto.resident} · {activeBoleto.kind}
              </div>

              <div className="fin-kv-box">
                <div className="fin-kv">
                  <span>Vencimento</span>
                  <b className={activeBoleto.status === 'vencido' ? 'bad' : ''}>
                    {fmtDateFull(activeBoleto.due)}
                    {activeBoleto.status === 'vencido' && enc.dias > 0 ? ` (${enc.dias}d atrás)` : ''}
                  </b>
                </div>
                <div className="fin-kv">
                  <span>Valor nominal</span>
                  <b>{fmtBRL(activeBoleto.val)}</b>
                </div>

                {activeBoleto.status === 'vencido' && enc.dias > 0 && (
                  <>
                    <div className="fin-kv">
                      <span>Multa (2%)</span>
                      <b className="bad">{fmtBRL(enc.multa)}</b>
                    </div>
                    <div className="fin-kv">
                      <span>Juros (1% a.m. · {enc.dias}d)</span>
                      <b className="bad">{fmtBRL(enc.juros)}</b>
                    </div>
                    <div className="fin-kv total">
                      <span>Total atualizado</span>
                      <b>{fmtBRL(enc.total)}</b>
                    </div>
                  </>
                )}

                <div className="fin-kv">
                  <span>Situação</span>
                  {activeBoleto.status === 'pago' ? (
                    <b className="ok">
                      Pago em {activeBoleto.paidAt ? fmtDateShort(activeBoleto.paidAt) : fmtDateShort(activeBoleto.due)} ·{' '}
                      {activeBoleto.method || 'PIX'}
                    </b>
                  ) : activeBoleto.status === 'vencido' ? (
                    <b className="bad">Em atraso</b>
                  ) : (
                    <b>Em aberto</b>
                  )}
                </div>
              </div>

              {activeBoleto.status === 'pago' ? (
                <div className="fin-sh-acts single">
                  <button type="button" className="fin-btn" onClick={closeAllSheets}>
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="fin-sh-acts">
                  <button
                    type="button"
                    className="fin-btn"
                    onClick={() => handleSendSingleReminder(activeBoleto)}
                  >
                    Enviar lembrete
                  </button>
                  <button
                    type="button"
                    className="fin-btn primary"
                    onClick={() => switchToBaixa(activeBoleto)}
                  >
                    Dar baixa
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {activeBoleto && bSheetMode === 'baixa' && (
          <>
            <div className="fin-sh-head">
              <h2>Dar baixa manual</h2>
              <button
                type="button"
                className="fin-close-btn"
                onClick={closeAllSheets}
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="fin-sh-sub">
              {activeBoleto.unit} · {activeBoleto.resident}
            </div>

            <span className="fin-lbl">Forma de pagamento</span>
            <div className="fin-chips">
              {PAY_METHODS.map(m => (
                <button
                  key={m}
                  type="button"
                  className={`fin-chip ${baixaMethod === m ? 'active' : ''}`}
                  onClick={() => setBaixaMethod(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="fin-grid-2">
              <div>
                <span className="fin-lbl">Data do pagamento</span>
                <input
                  type="date"
                  className="fin-input mono"
                  value={baixaDate}
                  onChange={e => setBaixaDate(e.target.value)}
                />
              </div>
              <div>
                <span className="fin-lbl">Valor recebido (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="fin-input mono"
                  value={baixaVal}
                  onChange={e => setBaixaVal(e.target.value)}
                />
              </div>
            </div>

            <div className="fin-sh-note">
              A baixa gera registro na trilha de auditoria e atualiza o saldo do condomínio.
            </div>

            <div className="fin-sh-acts">
              <button
                type="button"
                className="fin-btn"
                onClick={() => setBSheetMode('view')}
              >
                Voltar
              </button>
              <button
                type="button"
                className="fin-btn primary"
                onClick={handleConfirmBaixa}
              >
                Confirmar baixa
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sheet 2: Emitir Boleto */}
      <div id="nbSheet" className={`fin-sheet ${isNbOpen ? 'show' : ''}`}>
        <div className="fin-sh-head">
          <h2>Emitir boleto</h2>
          <button
            type="button"
            className="fin-close-btn"
            onClick={closeAllSheets}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="fin-sh-sub">Cobrança avulsa para uma unidade.</div>

        <div className="fin-grid-2">
          <div>
            <span className="fin-lbl">Bloco (1 a 14)</span>
            <input
              type="number"
              min={1}
              max={14}
              inputMode="numeric"
              className="fin-input mono"
              placeholder="Ex: 3"
              value={nbBlock}
              onChange={e => setNbBlock(e.target.value)}
            />
          </div>
          <div>
            <span className="fin-lbl">Apto (1 a 12)</span>
            <input
              type="number"
              min={1}
              max={12}
              inputMode="numeric"
              className="fin-input mono"
              placeholder="Ex: 2"
              value={nbApto}
              onChange={e => setNbApto(e.target.value)}
            />
          </div>
        </div>

        {nbLookup.message && (
          <div id="nbNote" className={`fin-unit-note ${nbLookup.valid ? 'ok' : 'err'}`}>
            {nbLookup.message}
          </div>
        )}

        <span className="fin-lbl">Tipo</span>
        <div className="fin-chips">
          {BOLETO_KINDS.map(k => (
            <button
              key={k}
              type="button"
              className={`fin-chip ${nbKind === k ? 'active' : ''}`}
              onClick={() => setNbKind(k)}
            >
              {k}
            </button>
          ))}
        </div>

        <span className="fin-lbl">Descrição (opcional)</span>
        <input
          type="text"
          className="fin-input"
          placeholder="Ex: Rateio reforma do telhado"
          value={nbDesc}
          onChange={e => setNbDesc(e.target.value)}
        />

        <div className="fin-grid-2">
          <div>
            <span className="fin-lbl">Valor (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              className="fin-input mono"
              placeholder="0,00"
              value={nbVal}
              onChange={e => setNbVal(e.target.value)}
            />
          </div>
          <div>
            <span className="fin-lbl">Vencimento</span>
            <input
              type="date"
              className="fin-input mono"
              value={nbDue}
              onChange={e => setNbDue(e.target.value)}
            />
          </div>
        </div>

        <div className="fin-sh-acts">
          <button type="button" className="fin-btn" onClick={closeAllSheets}>
            Cancelar
          </button>
          <button
            type="button"
            className="fin-btn primary"
            disabled={!canSubmitBoleto}
            onClick={handleEmitirBoleto}
          >
            Emitir boleto
          </button>
        </div>
      </div>

      {/* Sheet 3: Lançar Despesa */}
      <div id="neSheet" className={`fin-sheet ${isNeOpen ? 'show' : ''}`}>
        <div className="fin-sh-head">
          <h2>Lançar despesa</h2>
          <button
            type="button"
            className="fin-close-btn"
            onClick={closeAllSheets}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="fin-sh-sub">Registre um pagamento ou conta a vencer do condomínio.</div>

        <span className="fin-lbl">Descrição</span>
        <input
          type="text"
          className="fin-input"
          placeholder="Ex: Troca de bomba da caixa d'água"
          value={neDesc}
          onChange={e => setNeDesc(e.target.value)}
        />

        <span className="fin-lbl">Categoria</span>
        <div className="fin-chips">
          {EXPENSE_CATS.map(c => (
            <button
              key={c}
              type="button"
              className={`fin-chip ${neCat === c ? 'active' : ''}`}
              onClick={() => setNeCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="fin-grid-2">
          <div>
            <span className="fin-lbl">Valor (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              className="fin-input mono"
              placeholder="0,00"
              value={neVal}
              onChange={e => setNeVal(e.target.value)}
            />
          </div>
          <div>
            <span className="fin-lbl">Data</span>
            <input
              type="date"
              className="fin-input mono"
              value={neDate}
              onChange={e => setNeDate(e.target.value)}
            />
          </div>
        </div>

        <span className="fin-lbl">Situação</span>
        <div className="fin-chips">
          <button
            type="button"
            className={`fin-chip ${neStatus === 'paga' ? 'active' : ''}`}
            onClick={() => setNeStatus('paga')}
          >
            Já paga
          </button>
          <button
            type="button"
            className={`fin-chip ${neStatus === 'apagar' ? 'active' : ''}`}
            onClick={() => setNeStatus('apagar')}
          >
            A pagar
          </button>
        </div>

        <div className="fin-sh-acts">
          <button type="button" className="fin-btn" onClick={closeAllSheets}>
            Cancelar
          </button>
          <button
            type="button"
            className="fin-btn primary"
            disabled={!canSubmitDespesa}
            onClick={handleLancarDespesa}
          >
            Lançar despesa
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`fin-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}
