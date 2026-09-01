import React, { useState } from 'react';
import { Package, User, MapPin, Truck } from 'lucide-react';
import { api } from '../../../services/api';

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
    unidade: '',
    transportadora: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Por padrão, a API deve iniciar a encomenda como AGUARDANDO_RETIRADA
      await api.post('/api/v1/encomendas', {
        ...formData,
        status: 'AGUARDANDO_RETIRADA'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar encomenda. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Código de Rastreio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código de Rastreio</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Package size={18} />
          </div>
          <input
            type="text"
            name="codigoRastreio"
            required
            value={formData.codigoRastreio}
            onChange={handleChange}
            className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
            placeholder="Ex: BR123456789BR"
          />
        </div>
      </div>

      {/* Destinatário */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destinatário (Morador)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <User size={18} />
          </div>
          <input
            type="text"
            name="destinatario"
            required
            value={formData.destinatario}
            onChange={handleChange}
            className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
            placeholder="Nome do morador"
          />
        </div>
      </div>

      {/* Unidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unidade / Apartamento</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MapPin size={18} />
          </div>
          <input
            type="text"
            name="unidade"
            required
            value={formData.unidade}
            onChange={handleChange}
            className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
            placeholder="Ex: Bloco A - Apto 204"
          />
        </div>
      </div>

      {/* Transportadora */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transportadora</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Truck size={18} />
          </div>
          <input
            type="text"
            name="transportadora"
            required
            value={formData.transportadora}
            onChange={handleChange}
            className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
            placeholder="Ex: Correios, Loggi, Mercado Livre"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center justify-center min-w-[120px]"
        >
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
