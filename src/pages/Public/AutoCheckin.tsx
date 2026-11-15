import { useState } from 'react';
import { CheckCircle2, Building, User, Car } from 'lucide-react';
import api from '../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../utils/security';

export function AutoCheckin() {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    blocoDestino: '',
    unidadeDestino: '',
    placaVeiculo: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Ocorreu um erro ao enviar. Tente novamente.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação preventiva contra injeções (XSS / SQLi)
    if (contemAmeacas(formData.nome) || 
        contemAmeacas(formData.sobrenome) || 
        contemAmeacas(formData.blocoDestino) || 
        contemAmeacas(formData.unidadeDestino) || 
        contemAmeacas(formData.placaVeiculo)) {
      setErrorMessage('Entrada contém caracteres ou padrões não permitidos.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    
    try {
      const payload = {
        nome: sanitizarEntrada(formData.nome),
        sobrenome: sanitizarEntrada(formData.sobrenome),
        blocoDestino: sanitizarEntrada(formData.blocoDestino),
        unidadeDestino: sanitizarEntrada(formData.unidadeDestino),
        placaVeiculo: formData.placaVeiculo ? sanitizarEntrada(formData.placaVeiculo.toUpperCase()) : ''
      };
      await api.post('/api/v1/visitantes', payload);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || err.response?.data?.message || 'Ocorreu um erro ao enviar. Tente novamente.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center text-ink">
        <CheckCircle2 className="w-20 h-20 text-ok mb-6" />
        <h1 className="text-2xl font-extrabold text-ink mb-2">Check-in realizado!</h1>
        <p className="text-dim text-[14px] max-w-sm">
          Aguarde um momento enquanto a portaria entra em contato com o morador para liberar seu acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col text-ink">
      <div className="bg-brand p-6 text-center rounded-b-[24px]">
        <h1 className="text-brand-ink text-2xl font-extrabold">Auto Check-in</h1>
        <p className="text-brand-ink/85 mt-1 text-sm">Preencha seus dados para entrar.</p>
      </div>

      <div className="flex-1 p-6 flex items-center justify-center -mt-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-surface border border-line rounded-[18px] p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-dim mb-1.5">
                Nome
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-faint" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-9 w-full h-[46px] rounded-[12px] border border-line bg-canvas text-ink text-[14px] focus:border-brand focus:outline-none transition-colors px-3"
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-dim mb-1.5">
                Sobrenome
              </label>
              <input
                type="text"
                required
                className="w-full h-[46px] rounded-[12px] border border-line bg-canvas text-ink text-[14px] focus:border-brand focus:outline-none transition-colors px-3"
                placeholder="Sobrenome"
                value={formData.sobrenome}
                onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-dim mb-1.5">
                Bloco
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-faint" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-9 w-full h-[46px] rounded-[12px] border border-line bg-canvas text-ink font-mono text-[14px] focus:border-brand focus:outline-none transition-colors px-3"
                  placeholder="Ex: 03"
                  value={formData.blocoDestino}
                  onChange={(e) => setFormData({ ...formData, blocoDestino: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-dim mb-1.5">
                Apartamento
              </label>
              <input
                type="text"
                required
                className="w-full h-[46px] rounded-[12px] border border-line bg-canvas text-ink font-mono text-[14px] focus:border-brand focus:outline-none transition-colors px-3"
                placeholder="Ex: 101"
                value={formData.unidadeDestino}
                onChange={(e) => setFormData({ ...formData, unidadeDestino: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-dim mb-1.5">
              Placa do veículo (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Car className="h-4 w-4 text-faint" />
              </div>
              <input
                type="text"
                className="pl-9 w-full h-[46px] rounded-[12px] border border-line bg-canvas text-ink font-mono text-[14px] focus:border-brand focus:outline-none transition-colors px-3 uppercase"
                placeholder="ABC-1D23"
                value={formData.placaVeiculo}
                onChange={(e) => setFormData({ ...formData, placaVeiculo: e.target.value })}
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="p-3 bg-bad-soft text-bad rounded-[12px] text-[12.5px] font-semibold text-center">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-[48px] bg-brand hover:bg-brand-hover text-brand-ink font-bold text-[14px] rounded-[12px] transition-colors mt-4 disabled:bg-disabled disabled:text-disabled-ink cursor-pointer"
          >
            {status === 'loading' ? 'Enviando...' : 'Pedir liberação na portaria'}
          </button>
        </form>
      </div>
    </div>
  );
}
