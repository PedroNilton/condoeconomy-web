import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useNotification } from '../../../contexts/NotificationContext';
import { RegistrarVisitanteSheet } from '../../Visitantes/components/RegistrarVisitanteForm';

interface VeiculoApi {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  moradorId: string;
  nomeMorador: string;
  apartamento: string;
  bloco: string;
}

interface VisitanteApi {
  id: string;
  nome: string;
  sobrenome: string;
  blocoDestino: string;
  unidadeDestino: string;
  placaVeiculo: string | null;
  tipo: string;
  status: string;
  horaEntrada?: string | null;
}

interface ResidentVehicle {
  plate: string;
  model: string;
  color: string;
  hex: string;
  unit: string;
  who: string;
  vaga: string;
}

interface VisitorVehicle {
  plate: string;
  model: string;
  color: string;
  hex: string;
  who: string;
  dest: string;
  inAt: Date;
}

interface RecentLookup {
  plate: string;
  at: Date;
}

type LookupResult =
  | { type: 'ok'; d: ResidentVehicle }
  | { type: 'vis'; d: VisitorVehicle }
  | { type: 'no'; d: { plate: string } };

const RECENTS_STORAGE_KEY = '@HabitOS:portariaVeiculosRecents';

function norm(s: string): string {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

function fmtPlate(p: string): string {
  const clean = norm(p);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

function validPlate(p: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p);
}

function ago(min: number): Date {
  return new Date(Date.now() - min * 60000);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rel(d: Date, nowMs: number = Date.now()): string {
  const m = Math.max(0, Math.floor((nowMs - d.getTime()) / 60000));
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.floor(h / 24)} d`;
}

function stay(d: Date, nowMs: number = Date.now()): string {
  const m = Math.max(0, Math.floor((nowMs - d.getTime()) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${pad(m % 60)}`;
}

function colorToHex(colorName: string): string {
  const c = (colorName || '').toLowerCase();
  if (c.includes('prata')) return '#DFE3E8';
  if (c.includes('preto') || c.includes('preta')) return '#1C1D22';
  if (c.includes('verde')) return '#4B5320';
  if (c.includes('branco') || c.includes('branca')) return '#F5F5F5';
  if (c.includes('cinza') || c.includes('grafite') || c.includes('chumbo')) return '#6B7280';
  if (c.includes('vermelho') || c.includes('vermelha') || c.includes('vinho')) return '#B91C1C';
  if (c.includes('azul')) return '#2563EB';
  if (c.includes('amarelo') || c.includes('dourado')) return '#D97706';
  if (c.includes('marrom') || c.includes('bege')) return '#78350F';
  return '#DFE3E8';
}

function formatUnit(bloco?: string, apto?: string): string {
  const b = (bloco || '').replace(/^bloco\s*/i, '').trim();
  const a = (apto || '').replace(/^apto\.?\s*/i, '').trim();
  if (b && a) return `Bloco ${b.padStart(2, '0')} · Apto ${a.padStart(3, '0')}`;
  if (a) return `Apto ${a}`;
  if (b) return `Bloco ${b}`;
  return 'Unidade não informada';
}

function formatVisitorWho(nome?: string, sobrenome?: string, tipo?: string): string {
  const n = (nome || '').trim().replace(/\.$/, '');
  const s = (sobrenome || '').trim().replace(/\.$/, '');
  const full = !s || s.toLowerCase() === 'convidado' ? n : `${n} ${s}`.trim();
  const tUpper = (tipo || 'VISITANTE').toUpperCase();
  if (tUpper === 'PRESTADOR' || tUpper === 'PRESTADOR_SERVICO') return `${full} (prestador)`;
  if (tUpper === 'ENTREGADOR') return `${full} (entregador)`;
  if (tUpper === 'MOTORISTA_APP' || tUpper === 'MOTORISTA DE APP') return `${full} (app)`;
  return `${full} (visita)`;
}

const DEFAULT_RESIDENTS: ResidentVehicle[] = [
  { plate: 'ABC1D23', model: 'Fiat Argo', color: 'Prata', hex: '#DFE3E8', unit: 'Bloco 11 · Apto 012', who: 'Carlos Silva', vaga: 'G-14' },
  { plate: 'RDX9F41', model: 'Honda Civic', color: 'Preto', hex: '#1C1D22', unit: 'Bloco 11 · Apto 012', who: 'Carlos Silva', vaga: 'G-15' },
  { plate: 'JQP4C21', model: 'Jeep Renegade', color: 'Verde musgo', hex: '#4B5320', unit: 'Bloco 11 · Apto 012', who: 'Carlos Silva', vaga: 'G-16' },
  { plate: 'KLM8E55', model: 'Chevrolet Onix', color: 'Branco', hex: '#F5F5F5', unit: 'Bloco 03 · Apto 102', who: 'Fernanda Lima', vaga: 'G-22' },
  { plate: 'PQR2G90', model: 'Toyota Corolla', color: 'Cinza', hex: '#6B7280', unit: 'Bloco 05 · Apto 201', who: 'Ana Beatriz', vaga: 'G-07' },
  { plate: 'TUV5H18', model: 'Hyundai HB20', color: 'Vermelho', hex: '#B91C1C', unit: 'Bloco 08 · Apto 011', who: 'Jorge Santos', vaga: 'G-31' },
];

const DEFAULT_VISITORS: VisitorVehicle[] = [
  { plate: 'QRS4F28', model: 'Fiat Strada', color: 'Branco', hex: '#F5F5F5', who: 'Jorge (eletricista)', dest: 'Bloco 08 · Apto 011', inAt: ago(95) },
  { plate: 'HRV3K44', model: 'Honda HR-V', color: 'Prata', hex: '#DFE3E8', who: 'Pedro Henrique (visita)', dest: 'Bloco 07 · Apto 302', inAt: ago(30) },
];

function loadInitialRecents(): RecentLookup[] {
  try {
    const raw = localStorage.getItem(RECENTS_STORAGE_KEY);
    if (raw) {
      const parsed: { plate: string; at: number }[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({ plate: norm(item.plate), at: new Date(item.at) }));
      }
    }
  } catch {
    // ignore
  }
  return [
    { plate: 'ABC1D23', at: ago(12) },
    { plate: 'ZZZ9Z99', at: ago(64) },
    { plate: 'QRS4F28', at: ago(95) },
  ];
}

function saveRecents(list: RecentLookup[]) {
  try {
    localStorage.setItem(
      RECENTS_STORAGE_KEY,
      JSON.stringify(list.slice(0, 8).map((r) => ({ plate: r.plate, at: r.at.getTime() })))
    );
  } catch {
    // ignore
  }
}

export function ConsultaVeiculos() {
  const [inputValue, setInputValue] = useState('');
  const [residents, setResidents] = useState<ResidentVehicle[]>(DEFAULT_RESIDENTS);
  const [visitors, setVisitors] = useState<VisitorVehicle[]>(DEFAULT_VISITORS);
  const [recents, setRecents] = useState<RecentLookup[]>(() => loadInitialRecents());
  const [result, setResult] = useState<LookupResult | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isRegisterSheetOpen, setIsRegisterSheetOpen] = useState(false);
  const [registerInitialPlaca, setRegisterInitialPlaca] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  }, []);

  const fetchVehiclesAndVisitors = useCallback(async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const [resVeiculos, resVisitantes] = await Promise.allSettled([
        api.get('/api/v1/portaria/veiculos/consulta'),
        api.get(`/api/v1/visitantes?dataVisita=${hoje}`),
      ]);

      const mergedResidentsMap = new Map<string, ResidentVehicle>();
      for (const r of DEFAULT_RESIDENTS) {
        mergedResidentsMap.set(r.plate, r);
      }

      if (resVeiculos.status === 'fulfilled' && Array.isArray(resVeiculos.value.data)) {
        resVeiculos.value.data.forEach((v: VeiculoApi, idx: number) => {
          const p = norm(v.placa);
          if (!p) return;
          const existing = mergedResidentsMap.get(p);
          mergedResidentsMap.set(p, {
            plate: p,
            model: v.modelo || existing?.model || 'Veículo',
            color: v.cor || existing?.color || 'Prata',
            hex: colorToHex(v.cor || existing?.color || ''),
            unit:
              v.bloco || v.apartamento
                ? formatUnit(v.bloco, v.apartamento)
                : existing?.unit || 'Bloco 11 · Apto 012',
            who: v.nomeMorador || existing?.who || 'Morador',
            vaga: existing?.vaga || `G-${String(14 + idx).padStart(2, '0')}`,
          });
        });
      }
      setResidents(Array.from(mergedResidentsMap.values()));

      const mergedVisitorsMap = new Map<string, VisitorVehicle>();
      for (const v of DEFAULT_VISITORS) {
        mergedVisitorsMap.set(v.plate, v);
      }

      if (resVisitantes.status === 'fulfilled' && Array.isArray(resVisitantes.value.data)) {
        resVisitantes.value.data.forEach((v: VisitanteApi) => {
          if (!v.placaVeiculo) return;
          if (v.status !== 'NO_CONDOMINIO' && v.status !== 'AGUARDANDO' && v.status !== 'AGUARDANDO_LIBERACAO') {
            return;
          }
          const p = norm(v.placaVeiculo);
          if (!p) return;
          const existing = mergedVisitorsMap.get(p);
          const inDate = v.horaEntrada ? new Date(v.horaEntrada) : existing?.inAt || new Date();
          mergedVisitorsMap.set(p, {
            plate: p,
            model: existing?.model || 'Veículo de visitante',
            color: existing?.color || 'Prata',
            hex: existing?.hex || '#DFE3E8',
            who: formatVisitorWho(v.nome, v.sobrenome, v.tipo),
            dest: formatUnit(v.blocoDestino, v.unidadeDestino),
            inAt: Number.isNaN(inDate.getTime()) ? new Date() : inDate,
          });
        });
      }
      setVisitors(Array.from(mergedVisitorsMap.values()));
      setNowMs(Date.now());
    } catch {
      // mantém dados locais se houver falha de rede
    }
  }, []);

  useEffect(() => {
    fetchVehiclesAndVisitors();
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => {
      window.clearInterval(interval);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [fetchVehiclesAndVisitors]);

  useWebSocket('/topic/visitantes', fetchVehiclesAndVisitors);

  const findLocal = useCallback(
    (p: string): LookupResult => {
      const r = residents.find((x) => x.plate === p);
      if (r) return { type: 'ok', d: r };
      const v = visitors.find((x) => x.plate === p);
      return v ? { type: 'vis', d: v } : { type: 'no', d: { plate: p } };
    },
    [residents, visitors]
  );

  const kindOf = useCallback(
    (p: string): 'ok' | 'vis' | 'no' => {
      return findLocal(p).type;
    },
    [findLocal]
  );

  const consult = useCallback(
    async (rawPlate: string) => {
      const p = norm(rawPlate);
      if (!p) return;
      setInputValue(fmtPlate(p));

      let found = findLocal(p);

      if (found.type === 'no') {
        try {
          const response = await api.get(
            `/api/v1/portaria/veiculos/consulta?placa=${encodeURIComponent(fmtPlate(p))}`
          );
          const apiList: VeiculoApi[] = Array.isArray(response.data) ? response.data : [];
          const match = apiList.find((item) => norm(item.placa) === p) || apiList[0];
          if (match) {
            const mapped: ResidentVehicle = {
              plate: norm(match.placa) || p,
              model: match.modelo || 'Veículo',
              color: match.cor || 'Prata',
              hex: colorToHex(match.cor),
              unit: formatUnit(match.bloco, match.apartamento),
              who: match.nomeMorador || 'Morador',
              vaga: 'G-14',
            };
            setResidents((prev) =>
              prev.some((x) => x.plate === mapped.plate) ? prev : [mapped, ...prev]
            );
            found = { type: 'ok', d: mapped };
          }
        } catch {
          // segue com resultado local
        }
      }

      setResult(found);
      setRecents((prev) => {
        const next = [{ plate: p, at: new Date() }, ...prev.filter((r) => r.plate !== p)];
        saveRecents(next);
        return next;
      });
    },
    [findLocal]
  );

  const reset = useCallback(() => {
    setInputValue('');
    setResult(null);
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = norm(e.target.value);
    setInputValue(fmtPlate(p));
    setResult(null);
  };

  const pNorm = norm(inputValue);
  const isOk = pNorm.length === 7 && validPlate(pNorm);
  const isInvalidFormat = pNorm.length === 7 && !isOk;

  const suggestions =
    !result && pNorm.length >= 2 && pNorm.length < 7
      ? [
          ...residents.map((r) => ({ kind: 'ok' as const, item: r })),
          ...visitors.map((v) => ({ kind: 'vis' as const, item: v })),
        ]
          .filter((entry) => entry.item.plate.includes(pNorm))
          .slice(0, 5)
      : [];

  return (
    <div className="flex flex-col">
      {/* Page Head */}
      <div className="pt-[6px]">
        <div className="text-[11px] font-bold text-ds-faint uppercase tracking-[0.06em]">
          Garagem e acesso
        </div>
        <h1 className="text-[21px] font-extrabold text-ds-text mt-[3px] mb-[14px] tracking-[-0.01em]">
          Consultar placa
        </h1>

        <div className="bg-ds-card border border-ds-border rounded-[16px] p-[14px]">
          <span className="text-[11px] font-bold text-ds-dim uppercase tracking-[0.05em] mb-[10px] block">
            Placa do veículo
          </span>

          <div className="flex gap-[10px]">
            <div className="relative flex-1">
              <svg
                className="absolute left-[13px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-ds-faint pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isOk) {
                    e.preventDefault();
                    consult(pNorm);
                  }
                }}
                placeholder="ABC-1D23"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="w-full h-[54px] pl-[40px] pr-[38px] rounded-[12px] border border-ds-border bg-ds-bg text-ds-text font-mono text-[19px] font-semibold tracking-[0.08em] uppercase placeholder:text-ds-faint placeholder:font-medium placeholder:tracking-[0.06em] focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
              />

              {inputValue.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Limpar"
                  className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[30px] h-[30px] border-0 bg-transparent text-ds-faint cursor-pointer grid place-items-center hover:text-ds-text transition-colors"
                >
                  <svg
                    className="w-[16px] h-[16px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={!isOk}
              onClick={() => consult(pNorm)}
              className="h-[54px] px-[18px] rounded-[12px] border-0 bg-ds-primary text-ds-primary-ink font-sans text-[14px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              Consultar
            </button>
          </div>

          <div
            className={`text-[11.5px] mt-[10px] leading-[1.45] ${
              isInvalidFormat ? 'text-ds-warning' : 'text-ds-dim'
            }`}
          >
            {isInvalidFormat
              ? 'Formato inválido. Use ABC-1D23 (Mercosul) ou ABC-1234.'
              : 'Digite a placa inteira, ou só um pedaço para ver sugestões.'}
          </div>
        </div>
      </div>

      {/* Main Content Area (#below) */}
      <div className="pt-[16px] flex flex-col gap-[20px]">
        {result ? (
          result.type === 'no' ? (
            <div className="bg-ds-card border border-ds-warning rounded-[16px] p-[16px]">
              <div className="flex justify-between items-center mb-[14px]">
                <span className="font-mono text-[9.5px] font-bold py-[4px] px-[9px] rounded-full bg-ds-warning-dim text-ds-warning">
                  NÃO ENCONTRADA
                </span>
              </div>

              <span className="inline-block border-2 border-ds-text rounded-[9px] py-[6px] px-[14px] font-mono text-[24px] font-semibold tracking-[0.1em] text-ds-text">
                {fmtPlate(result.d.plate)}
              </span>

              <p className="text-[13px] text-ds-dim leading-[1.5] mt-[12px] mb-0">
                Nenhum morador ou visitante no local com essa placa. Se o veículo está entrando
                agora, registre o visitante com a placa já preenchida.
              </p>

              <div className="grid gap-[10px] mt-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterInitialPlaca(fmtPlate(result.d.plate));
                    setIsRegisterSheetOpen(true);
                    showToast('Abrindo cadastro de visitante com a placa');
                  }}
                  className="font-sans text-[14px] font-bold h-[50px] rounded-[12px] border border-ds-primary bg-ds-primary text-ds-primary-ink cursor-pointer hover:brightness-110 transition-all"
                >
                  Registrar como visitante
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="font-sans text-[14px] font-bold h-[50px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text cursor-pointer hover:border-ds-border-strong transition-colors"
                >
                  Nova consulta
                </button>
              </div>
            </div>
          ) : result.type === 'ok' ? (
            <div className="bg-ds-card border border-ds-success rounded-[16px] p-[16px]">
              <div className="flex justify-between items-center mb-[14px]">
                <span className="font-mono text-[9.5px] font-bold py-[4px] px-[9px] rounded-full bg-ds-success-dim text-ds-success">
                  VEÍCULO DE MORADOR
                </span>
              </div>

              <span className="inline-block border-2 border-ds-text rounded-[9px] py-[6px] px-[14px] font-mono text-[24px] font-semibold tracking-[0.1em] text-ds-text">
                {fmtPlate(result.d.plate)}
              </span>

              <div className="flex items-center gap-[8px] mt-[12px] mb-[4px] text-[14px] font-bold text-ds-text">
                <span
                  className="w-[14px] h-[14px] rounded-full border border-ds-border shrink-0"
                  style={{ background: result.d.hex }}
                />
                {result.d.model}{' '}
                <span className="text-ds-dim font-medium">· {result.d.color}</span>
              </div>

              <div className="mt-[12px] border-t border-ds-border">
                <div className="flex justify-between gap-[12px] py-[10px] border-b border-ds-border text-[13px]">
                  <span className="text-ds-dim">Unidade</span>
                  <span className="font-mono font-semibold text-right text-ds-text">
                    {result.d.unit}
                  </span>
                </div>
                <div className="flex justify-between gap-[12px] py-[10px] border-b border-ds-border text-[13px]">
                  <span className="text-ds-dim">Morador</span>
                  <span className="font-bold text-right text-ds-text">{result.d.who}</span>
                </div>
                <div className="flex justify-between gap-[12px] py-[10px] text-[13px]">
                  <span className="text-ds-dim">Vaga</span>
                  <span className="font-mono font-semibold text-right text-ds-text">
                    {result.d.vaga}
                  </span>
                </div>
              </div>

              <div className="grid gap-[10px] mt-[12px]">
                <button
                  type="button"
                  onClick={() => showToast('Morador avisado no app')}
                  className="font-sans text-[14px] font-bold h-[50px] rounded-[12px] border border-ds-primary bg-ds-primary text-ds-primary-ink cursor-pointer hover:brightness-110 transition-all"
                >
                  Avisar morador
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="font-sans text-[14px] font-bold h-[50px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text cursor-pointer hover:border-ds-border-strong transition-colors"
                >
                  Nova consulta
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-ds-card border border-ds-border rounded-[16px] p-[16px]">
              <div className="flex justify-between items-center mb-[14px]">
                <span className="font-mono text-[9.5px] font-bold py-[4px] px-[9px] rounded-full bg-ds-primary-dim text-ds-primary">
                  VISITANTE NO LOCAL
                </span>
              </div>

              <span className="inline-block border-2 border-ds-text rounded-[9px] py-[6px] px-[14px] font-mono text-[24px] font-semibold tracking-[0.1em] text-ds-text">
                {fmtPlate(result.d.plate)}
              </span>

              <div className="flex items-center gap-[8px] mt-[12px] mb-[4px] text-[14px] font-bold text-ds-text">
                <span
                  className="w-[14px] h-[14px] rounded-full border border-ds-border shrink-0"
                  style={{ background: result.d.hex }}
                />
                {result.d.model}{' '}
                <span className="text-ds-dim font-medium">· {result.d.color}</span>
              </div>

              <div className="mt-[12px] border-t border-ds-border">
                <div className="flex justify-between gap-[12px] py-[10px] border-b border-ds-border text-[13px]">
                  <span className="text-ds-dim">Visitante</span>
                  <span className="font-bold text-right text-ds-text">{result.d.who}</span>
                </div>
                <div className="flex justify-between gap-[12px] py-[10px] border-b border-ds-border text-[13px]">
                  <span className="text-ds-dim">Destino</span>
                  <span className="font-mono font-semibold text-right text-ds-text">
                    {result.d.dest}
                  </span>
                </div>
                <div className="flex justify-between gap-[12px] py-[10px] text-[13px]">
                  <span className="text-ds-dim">Entrada</span>
                  <span className="font-mono font-semibold text-right text-ds-text">
                    {hm(result.d.inAt)} · {stay(result.d.inAt, nowMs)} no local
                  </span>
                </div>
              </div>

              <div className="grid gap-[10px] mt-[12px]">
                <button
                  type="button"
                  onClick={() => showToast('Morador avisado no app')}
                  className="font-sans text-[14px] font-bold h-[50px] rounded-[12px] border border-ds-primary bg-ds-primary text-ds-primary-ink cursor-pointer hover:brightness-110 transition-all"
                >
                  Avisar morador do destino
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="font-sans text-[14px] font-bold h-[50px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text cursor-pointer hover:border-ds-border-strong transition-colors"
                >
                  Nova consulta
                </button>
              </div>
            </div>
          )
        ) : pNorm.length >= 2 && pNorm.length < 7 ? (
          suggestions.length > 0 ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint mt-0 mb-[10px]">
                Sugestões
              </p>
              <div className="bg-ds-card border border-ds-border rounded-[14px] overflow-hidden">
                {suggestions.map((entry) => (
                  <button
                    key={entry.item.plate}
                    type="button"
                    onClick={() => consult(entry.item.plate)}
                    className="w-full flex justify-between items-center gap-[12px] py-[13px] px-[14px] border-0 border-b border-ds-border last:border-b-0 bg-transparent text-ds-text font-sans text-left cursor-pointer hover:bg-ds-bg/60 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-[14px] font-semibold tracking-[0.05em]">
                        {fmtPlate(entry.item.plate)}
                      </div>
                      <div className="text-[11.5px] text-ds-dim mt-[2px]">
                        {entry.item.model} · {entry.item.color}
                      </div>
                    </div>
                    <div className="font-mono text-[10.5px] text-ds-faint text-right shrink-0">
                      {entry.kind === 'ok' ? (
                        <>
                          <b className="block font-bold mb-[2px] text-ds-success">MORADOR</b>
                          {(entry.item as ResidentVehicle).unit}
                        </>
                      ) : (
                        <>
                          <b className="block font-bold mb-[2px] text-ds-primary">VISITANTE</b>
                          no local
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11.5px] text-ds-dim mt-[10px] leading-[1.45]">
              Nenhuma placa parecida entre moradores e visitantes no local.
            </div>
          )
        ) : (
          <>
            {/* Visitantes com veículo no local */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint mt-0 mb-[10px]">
                Visitantes com veículo no local
              </p>
              <div className="bg-ds-card border border-ds-border rounded-[14px] overflow-hidden">
                {visitors.map((v) => (
                  <button
                    key={v.plate}
                    type="button"
                    onClick={() => consult(v.plate)}
                    className="w-full flex justify-between items-center gap-[12px] py-[13px] px-[14px] border-0 border-b border-ds-border last:border-b-0 bg-transparent text-ds-text font-sans text-left cursor-pointer hover:bg-ds-bg/60 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-[14px] font-semibold tracking-[0.05em]">
                        {fmtPlate(v.plate)}
                      </div>
                      <div className="text-[11.5px] text-ds-dim mt-[2px]">
                        {v.who} → {v.dest}
                      </div>
                    </div>
                    <div className="font-mono text-[10.5px] text-ds-faint text-right shrink-0">
                      <b className="block font-bold mb-[2px] text-ds-faint">
                        {stay(v.inAt, nowMs)}
                      </b>
                      no local
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Consultas recentes */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint mt-0 mb-[10px]">
                Consultas recentes
              </p>
              <div className="bg-ds-card border border-ds-border rounded-[14px] overflow-hidden">
                {recents.slice(0, 4).map((r) => {
                  const k = kindOf(r.plate);
                  return (
                    <button
                      key={r.plate}
                      type="button"
                      onClick={() => consult(r.plate)}
                      className="w-full flex justify-between items-center gap-[12px] py-[13px] px-[14px] border-0 border-b border-ds-border last:border-b-0 bg-transparent text-ds-text font-sans text-left cursor-pointer hover:bg-ds-bg/60 transition-colors"
                    >
                      <div>
                        <div className="font-mono text-[14px] font-semibold tracking-[0.05em]">
                          {fmtPlate(r.plate)}
                        </div>
                        <div className="text-[11.5px] text-ds-dim mt-[2px]">
                          {rel(r.at, nowMs)}
                        </div>
                      </div>
                      <div className="font-mono text-[10.5px] text-ds-faint text-right shrink-0">
                        {k === 'ok' ? (
                          <b className="block font-bold mb-[2px] text-ds-success">MORADOR</b>
                        ) : k === 'vis' ? (
                          <b className="block font-bold mb-[2px] text-ds-primary">VISITANTE</b>
                        ) : (
                          <b className="block font-bold mb-[2px] text-ds-warning">
                            NÃO ENCONTRADA
                          </b>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sheet de Registro de Visitante com placa pré-preenchida */}
      <RegistrarVisitanteSheet
        isOpen={isRegisterSheetOpen}
        initialPlaca={registerInitialPlaca}
        onClose={() => setIsRegisterSheetOpen(false)}
        onSuccess={() => {
          setIsRegisterSheetOpen(false);
          fetchVehiclesAndVisitors();
          refreshCounts();
          showToast('Visitante registrado na espera');
        }}
      />

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-[84px] left-1/2 -translate-x-1/2 bg-ds-text text-ds-bg text-[13px] font-semibold py-[11px] px-[18px] rounded-[10px] transition-all duration-250 z-[60] whitespace-nowrap pointer-events-none ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-[80px] opacity-0'
        }`}
      >
        {toastMsg}
      </div>
    </div>
  );
}
