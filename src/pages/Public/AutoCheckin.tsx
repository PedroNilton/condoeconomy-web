import { useState } from 'react';
import { CheckCircle2, Building, User, Car } from 'lucide-react';
import api from '../../services/api';

export function AutoCheckin() {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    blocoDestino: '',
    unidadeDestino: '',
    placaVeiculo: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      await api.post('/visitantes', formData);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Check-in Realizado!</h1>
        <p className="text-gray-600">Aguarde um momento enquanto a portaria entra em contato com o morador para liberar seu acesso.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1e1b4b] p-6 text-center rounded-b-3xl shadow-lg">
        <h1 className="text-white text-2xl font-bold">Auto Check-in</h1>
        <p className="text-blue-200 mt-2 text-sm">Preencha seus dados para entrar.</p>
      </div>

      <div className="flex-1 p-6 flex items-center justify-center -mt-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all p-3"
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
              <input
                type="text"
                required
                className="w-full rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all p-3"
                placeholder="Sobrenome"
                value={formData.sobrenome}
                onChange={(e) => setFormData({...formData, sobrenome: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bloco</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all p-3"
                  placeholder="Ex: A"
                  value={formData.blocoDestino}
                  onChange={(e) => setFormData({...formData, blocoDestino: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apartamento</label>
              <input
                type="text"
                required
                className="w-full rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all p-3"
                placeholder="Ex: 101"
                value={formData.unidadeDestino}
                onChange={(e) => setFormData({...formData, unidadeDestino: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa do Veículo (Opcional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Car className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all p-3 uppercase"
                placeholder="ABC-1234"
                value={formData.placaVeiculo}
                onChange={(e) => setFormData({...formData, placaVeiculo: e.target.value})}
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              Ocorreu um erro ao enviar. Tente novamente.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors mt-4 disabled:opacity-50"
          >
            {status === 'loading' ? 'Enviando...' : 'Pedir Liberação na Portaria'}
          </button>
        </form>
      </div>
    </div>
  );
}
