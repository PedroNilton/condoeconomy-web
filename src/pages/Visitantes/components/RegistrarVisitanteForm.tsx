import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

export const WAIT_STORAGE_KEY = '@HabitOS:visitorWaitStart';

export function registrarInicioEsperaLocal(id: string) {
  try {
    const raw = localStorage.getItem(WAIT_STORAGE_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[id] = Date.now();
    localStorage.setItem(WAIT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignora falha de storage
  }
}

const TIPOS_VISITANTE = [
  { value: 'VISITANTE', label: 'Visitante' },
  { value: 'PRESTADOR', label: 'Prestador' },
  { value: 'ENTREGADOR', label: 'Entregador' },
  { value: 'MOTORISTA_APP', label: 'Motorista de app' },
] as const;

interface RegistrarVisitanteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPlaca?: string;
}

export function RegistrarVisitanteSheet({
  isOpen,
  onClose,
  onSuccess,
  initialPlaca,
}: RegistrarVisitanteSheetProps) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [tipo, setTipo] = useState<string>('VISITANTE');
  const [bloco, setBloco] = useState('');
  const [apto, setApto] = useState('');
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setErro('');
    } else if (initialPlaca !== undefined) {
      setPlaca(initialPlaca);
    }
  }, [isOpen, initialPlaca]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    const nomeRaw = nomeCompleto.trim();
    const blocoRaw = bloco.trim();
    const aptoRaw = apto.trim();
    const placaRaw = placa.trim().toUpperCase();

    if (!nomeRaw || !blocoRaw || !aptoRaw) {
      setErro('Preencha nome, bloco e apartamento.');
      return;
    }

    if (
      contemAmeacas(nomeRaw) ||
      contemAmeacas(blocoRaw) ||
      contemAmeacas(aptoRaw) ||
      contemAmeacas(placaRaw)
    ) {
      setErro('Entrada contém caracteres não permitidos.');
      return;
    }

    const nomeSanitizado = sanitizarEntrada(nomeRaw, 100);
    if (nomeSanitizado.length < 2) {
      setErro('Informe um nome válido.');
      return;
    }

    const partes = nomeSanitizado.split(/\s+/);
    const primeiroNome = partes[0].length >= 2 ? partes[0] : `${partes[0]}.`;
    const resto = partes.length > 1 ? partes.slice(1).join(' ') : 'Convidado';
    const sobrenomeFinal = resto.length >= 2 ? resto : `${resto}.`;

    setLoading(true);
    setErro('');

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const res = await api.post('/api/v1/visitantes', {
        nome: primeiroNome,
        sobrenome: sobrenomeFinal,
        blocoDestino: sanitizarEntrada(blocoRaw, 20),
        unidadeDestino: sanitizarEntrada(aptoRaw, 20),
        placaVeiculo: placaRaw ? sanitizarEntrada(placaRaw, 10) : null,
        dataVisita: hoje,
        tipo,
      });

      if (res.data?.id) {
        registrarInicioEsperaLocal(String(res.data.id));
      }

      setNomeCompleto('');
      setBloco('');
      setApto('');
      setPlaca('');
      setTipo('VISITANTE');
      onSuccess();
    } catch (err: any) {
      setErro(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Erro ao registrar visitante.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[rgba(10,10,14,0.45)] transition-opacity duration-200 z-10 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <form
        onSubmit={handleSalvar}
        className={`fixed left-1/2 bottom-0 w-full max-w-[412px] bg-ds-card rounded-t-[20px] pt-[20px] px-[20px] pb-[calc(24px+env(safe-area-inset-bottom,0px))] z-[11] transition-transform duration-250 ease-out max-h-[90vh] overflow-y-auto border-t border-ds-border ${
          isOpen ? '-translate-x-1/2 translate-y-0' : '-translate-x-1/2 translate-y-full'
        }`}
      >
        <h2 className="text-[17px] font-extrabold text-ds-text m-0 mb-[16px]">
          Registrar visitante
        </h2>

        {erro && (
          <div className="mb-[14px] px-3 py-2.5 rounded-[10px] bg-ds-danger-dim text-ds-danger text-[12.5px] font-semibold">
            {erro}
          </div>
        )}

        <span className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-[8px] block">
          Nome
        </span>
        <input
          type="text"
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
          placeholder="Nome completo"
          className="w-full h-[46px] px-[13px] rounded-[10px] border border-ds-border bg-ds-bg text-ds-text text-[14px] mb-[16px] placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
        />

        <span className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-[8px] block">
          Tipo
        </span>
        <div className="flex flex-wrap gap-[8px] mb-[16px]">
          {TIPOS_VISITANTE.map((item) => {
            const sel = tipo === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTipo(item.value)}
                className={`border rounded-[10px] px-[13px] py-[10px] text-[12.5px] font-semibold cursor-pointer transition-colors ${
                  sel
                    ? 'border-ds-primary bg-ds-primary-dim text-ds-primary'
                    : 'border-ds-border bg-ds-bg text-ds-text'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <span className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-[8px] block">
          Destino
        </span>
        <div className="grid grid-cols-2 gap-[10px]">
          <input
            type="text"
            value={bloco}
            onChange={(e) => setBloco(e.target.value)}
            placeholder="Bloco"
            className="w-full h-[46px] px-[13px] rounded-[10px] border border-ds-border bg-ds-bg text-ds-text font-mono font-semibold tracking-[0.04em] text-[14px] mb-[16px] placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
          />
          <input
            type="text"
            value={apto}
            onChange={(e) => setApto(e.target.value)}
            placeholder="Apto"
            className="w-full h-[46px] px-[13px] rounded-[10px] border border-ds-border bg-ds-bg text-ds-text font-mono font-semibold tracking-[0.04em] text-[14px] mb-[16px] placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
          />
        </div>

        <span className="text-[12px] font-bold text-ds-dim uppercase tracking-[0.04em] mb-[8px] block">
          Placa (opcional)
        </span>
        <input
          type="text"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          placeholder="ABC-1D23"
          maxLength={8}
          className="w-full h-[46px] px-[13px] rounded-[10px] border border-ds-border bg-ds-bg text-ds-text font-mono font-semibold tracking-[0.04em] text-[14px] mb-[16px] uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-ds-faint focus-visible:outline-2 focus-visible:outline-ds-primary focus-visible:outline-offset-1"
        />

        <div className="grid grid-cols-[1fr_1.4fr] gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-[50px] rounded-[12px] border border-ds-border bg-ds-card text-ds-text text-[14px] font-bold flex items-center justify-center gap-[8px] cursor-pointer hover:border-ds-border-strong transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-[50px] rounded-[12px] border border-ds-primary bg-ds-primary text-ds-primary-ink text-[14px] font-bold flex items-center justify-center gap-[8px] cursor-pointer hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </>
  );
}
