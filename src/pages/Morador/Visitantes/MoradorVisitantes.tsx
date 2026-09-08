import { useState, useEffect } from 'react';
import { UserCheck, UserPlus, ArrowLeft, Clock, Loader2, QrCode, X } from 'lucide-react';
import api from '../../../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface Visitante {
  id: string;
  nome: string;
  dataVisita: string;
  tipo: string;
  status: string;
}

export function MoradorVisitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState('VISITANTE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Pega todos autorizados pela unidade, independente da data
      const res = await api.get('/api/v1/visitantes?unidadeDestino=Apto 101 - Bloco B');
      setVisitantes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataVisita) return;

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/visitantes', {
        nome,
        documento: 'N/A', // Oculto da UI, preenchimento padrão
        dataVisita,
        unidadeDestino: 'Apto 101 - Bloco B',
        moradorResponsavel: 'Carlos Silva',
        tipo
      });
      
      setIsFormOpen(false);
      setNome('');
      setTipo('VISITANTE');
      
      fetchData();
      alert('Acesso autorizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao autorizar visitante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
        <header className="bg-white dark:bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Liberar Acesso</h2>
        </header>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto pb-20">
          <div className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nome Completo</label>
              <input 
                type="text" 
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Roberto Silva"
                className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Data da Visita</label>
              <input 
                type="date" 
                value={dataVisita}
                onChange={e => setDataVisita(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tipo de Acesso</label>
              <select 
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                required
              >
                <option value="VISITANTE">Visitante / Convidado</option>
                <option value="PRESTADOR_SERVICO">Prestador de Serviço</option>
              </select>
            </div>
            
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-8"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Autorizar na Portaria'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      
      <header className="bg-white dark:bg-gray-800 pt-10 pb-4 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Autorizações
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Libere o acesso para seus convidados</p>
        </div>
      </header>

      <div className="p-6">
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors mb-6"
        >
          <UserPlus className="w-5 h-5" />
          Nova Autorização
        </button>

        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 tracking-wide uppercase">Histórico de Autorizações</h3>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : visitantes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Nenhum visitante autorizado recentemente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitantes.map(vis => (
              <div key={vis.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex justify-between items-center">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  vis.status === 'AGUARDANDO' ? 'bg-yellow-500' :
                  vis.status === 'NO_CONDOMINIO' ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{vis.nome}</h4>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                    {vis.tipo === 'VISITANTE' ? 'Visitante' : 'Prest. Serviço'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded flex items-center gap-1 border border-gray-100 dark:border-gray-700">
                      <Clock className="w-3.5 h-3.5" /> {new Date(vis.dataVisita).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${
                      vis.status === 'AGUARDANDO' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      vis.status === 'NO_CONDOMINIO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}>
                      {vis.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {vis.status === 'AGUARDANDO' && (
                  <button 
                    onClick={() => setSelectedQrCode(vis.id)}
                    className="p-3 bg-gray-50 dark:bg-gray-900 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title="Ver QR Code"
                  >
                    <QrCode className="w-6 h-6" />
                  </button>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      {selectedQrCode && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedQrCode(null)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 mt-2">
              <QrCode className="w-6 h-6" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 text-center">Código de Acesso</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Apresente este QR Code na portaria para entrar mais rápido.</p>

            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm mb-6">
              <QRCodeSVG value={selectedQrCode} size={200} />
            </div>
            
            <button 
              onClick={() => setSelectedQrCode(null)}
              className="w-full font-bold py-3 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
