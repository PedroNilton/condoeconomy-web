import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Smartphone, Mail, AlertTriangle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorNotificacoes() {
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handlePushToggle = async () => {
    if (!pushEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
      } else {
        alert('Permissão de notificação negada no navegador.');
      }
    } else {
      setPushEnabled(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-20">
      
      <header className="bg-white dark:bg-gray-800 pt-10 pb-4 px-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            Configurar Notificações
          </h2>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Escolha como deseja ser avisado sobre encomendas, comunicados e respostas da portaria.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Notificações no Celular (Push)</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pr-4">Receba alertas em tempo real no seu dispositivo quando chegar uma encomenda.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={pushEnabled} onChange={handlePushToggle} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Alertas por E-mail</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pr-4">Resumos semanais, boletos e comunicados oficiais do síndico.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed">
            As notificações de emergência, como pânico ou comunicados urgentes, não podem ser desativadas.
          </p>
        </div>

        <button onClick={() => navigate(-1)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4">
          <Save className="w-5 h-5" />
          Salvar Preferências
        </button>

      </div>
    </div>
  );
}