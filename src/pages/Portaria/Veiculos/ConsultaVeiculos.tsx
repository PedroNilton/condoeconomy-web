import React, { useState } from 'react';
import { Search, Car, User, MapPin, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface VeiculoConsulta {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  moradorId: string;
  nomeMorador: string;
  apartamento: string;
  bloco: string;
}

export function ConsultaVeiculos() {
  const [placaBusca, setPlacaBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<VeiculoConsulta[] | null>(null);
  const [error, setError] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const placaLimpa = sanitizarEntrada(placaBusca);
    if (placaLimpa.length < 3) return;
    if (contemAmeacas(placaBusca)) {
      setError(true);
      setResultado(null);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const response = await api.get(
        `/api/v1/portaria/veiculos/consulta?placa=${encodeURIComponent(placaLimpa)}`
      );
      setResultado(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError(true);
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0">
          Garagem e acesso
        </p>
        <h2 className="text-[17px] font-extrabold text-ds-text tracking-[-0.01em] m-0 mt-0.5">
          Consultar placa
        </h2>
      </div>

      {/* Formulário de busca */}
      <form
        onSubmit={handleSearch}
        className="bg-ds-card border border-ds-border rounded-[14px] p-[14px] flex flex-col gap-3"
      >
        <label className="text-[11px] font-bold uppercase tracking-[0.04em] text-ds-dim">
          Placa do veículo
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ds-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={placaBusca}
              onChange={(e) => setPlacaBusca(e.target.value.toUpperCase())}
              maxLength={10}
              autoFocus
              placeholder="ABC-1234"
              className="w-full pl-9 pr-3.5 py-2.5 bg-ds-bg border border-ds-border text-ds-text rounded-[11px] font-mono text-[15px] font-semibold tracking-[0.08em] uppercase placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-ds-faint focus:outline-none focus:border-ds-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || placaBusca.trim().length < 3}
            className="px-4 py-2.5 rounded-[11px] bg-ds-primary text-ds-primary-ink text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[92px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar'}
          </button>
        </div>
      </form>

      {/* Erro */}
      {error && (
        <div className="p-3.5 rounded-[14px] bg-ds-danger-dim border border-ds-danger/25 text-ds-danger text-[12.5px] font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Ocorreu um erro ao buscar a placa. Tente novamente.</span>
        </div>
      )}

      {/* Resultados */}
      {resultado !== null && !loading && !error && (
        <div className="flex flex-col gap-[10px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0">
            Resultados ({resultado.length})
          </p>

          {resultado.length === 0 ? (
            <div className="bg-ds-card border border-ds-border rounded-[14px] py-9 px-4 text-center">
              <div className="w-10 h-10 rounded-[10px] bg-ds-warning-dim text-ds-warning grid place-items-center mx-auto mb-2.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-[13.5px] font-bold text-ds-text m-0">Veículo não encontrado</p>
              <p className="text-[12px] text-ds-dim m-0 mt-1 leading-[1.45]">
                A placa <strong className="font-mono text-ds-text">{placaBusca}</strong> não consta no cadastro de moradores.
              </p>
            </div>
          ) : (
            resultado.map((veiculo) => (
              <div
                key={veiculo.id}
                className="bg-ds-card border border-ds-border rounded-[14px] p-[14px] flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-ds-success-dim text-ds-success grid place-items-center shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-[18px] font-semibold text-ds-text tracking-[0.06em] uppercase block leading-none">
                        {veiculo.placa}
                      </span>
                      <span className="text-[12px] text-ds-dim capitalize block mt-1">
                        {veiculo.modelo} · {veiculo.cor}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[9.5px] font-semibold px-2 py-1 rounded-full bg-ds-success-dim text-ds-success uppercase shrink-0">
                    Autorizado
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[10px] bg-ds-bg border border-ds-border">
                  <div className="min-w-0 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-ds-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.04em] text-ds-faint">
                        Proprietário
                      </span>
                      <span className="block text-[12px] font-bold text-ds-text truncate">
                        {veiculo.nomeMorador}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-ds-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.04em] text-ds-faint">
                        Unidade
                      </span>
                      <span className="block text-[12px] font-bold text-ds-text truncate">
                        {veiculo.bloco ? `Bloco ${veiculo.bloco} · ` : ''}
                        {veiculo.apartamento ? `Apto ${veiculo.apartamento}` : 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
