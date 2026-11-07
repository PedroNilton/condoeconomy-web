import React, { useState } from 'react';
import { Package, User, MapPin, Truck, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface NovaEncomendaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NovaEncomendaForm({ onSuccess, onCancel }: NovaEncomendaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    codigoRastreio: '',
    destinatario: '',
    bloco: '',
    apartamento: '',
    transportadora: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      contemAmeacas(formData.codigoRastreio) ||
      contemAmeacas(formData.destinatario) ||
      contemAmeacas(formData.bloco) ||
      contemAmeacas(formData.apartamento) ||
      contemAmeacas(formData.transportadora)
    ) {
      setError('Entrada contém caracteres ou padrões não permitidos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/api/v1/encomendas', {
        codigoRastreio: sanitizarEntrada(formData.codigoRastreio),
        transportadora: sanitizarEntrada(formData.transportadora),
        destinatario: sanitizarEntrada(formData.destinatario),
        unidade: `Bloco ${sanitizarEntrada(formData.bloco)} · Apto ${sanitizarEntrada(formData.apartamento)}`,
        status: 'AGUARDANDO_RETIRADA'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Erro ao registrar encomenda. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full pl-9 pr-3.5 py-2.5 bg-ds-bg border border-ds-border text-ds-text rounded-[11px] text-[13px] placeholder:text-ds-faint focus:outline-none focus:border-ds-primary transition-colors';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {error && (
        <div className="p-3 bg-ds-danger-dim text-ds-danger border border-ds-danger/25 rounded-[11px] text-[12px] font-semibold">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-ds-dim mb-1.5">
          Código de rastreio
        </label>
        <div className="relative">
          <Package className="w-4 h-4 text-ds-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            name="codigoRastreio"
            required
            value={formData.codigoRastreio}
            onChange={handleChange}
            className={`${inputBase} font-mono uppercase`}
            placeholder="BR123456789BR"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-ds-dim mb-1.5">
          Destinatário (Morador)
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-ds-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            name="destinatario"
            required
            value={formData.destinatario}
            onChange={handleChange}
            className={inputBase}
            placeholder="Nome do morador"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-ds-dim mb-1.5">
            Bloco
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-ds-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="bloco"
              required
              value={formData.bloco}
              onChange={handleChange}
              className={inputBase}
              placeholder="05"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-ds-dim mb-1.5">
            Apartamento
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-ds-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="apartamento"
              required
              value={formData.apartamento}
              onChange={handleChange}
              className={inputBase}
              placeholder="201"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-ds-dim mb-1.5">
          Transportadora
        </label>
        <div className="relative">
          <Truck className="w-4 h-4 text-ds-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            name="transportadora"
            required
            value={formData.transportadora}
            onChange={handleChange}
            className={inputBase}
            placeholder="Correios, Loggi, Mercado Livre"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="py-2.5 px-4 rounded-[11px] border border-ds-border bg-ds-bg text-ds-text text-[13px] font-bold hover:border-ds-border-strong transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-4 rounded-[11px] border border-ds-primary bg-ds-primary text-ds-primary-ink text-[13px] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Receber pacote'}
        </button>
      </div>
    </form>
  );
}
