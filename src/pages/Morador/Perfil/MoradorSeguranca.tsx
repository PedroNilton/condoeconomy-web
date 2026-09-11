import { useState } from 'react';
import { ArrowLeft, ShieldCheck, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorSeguranca() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-20">
      
      <header className="bg-white dark:bg-gray-800 pt-10 pb-4 px-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            Segurança e Senha
          </h2>
        </div>
      </header>

      <div className="p-6 space-y-6">
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Sua conta está protegida por criptografia de ponta a ponta. Nunca compartilhe sua senha com terceiros ou com a portaria.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-500" /> Alterar Senha
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Senha Atual</label>
              <input type="password" placeholder="Digite sua senha atual" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm text-gray-800 dark:text-gray-200" />
            </div>

            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Nova Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Mínimo de 8 caracteres" 
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm text-gray-800 dark:text-gray-200" 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Confirmar Nova Senha</label>
              <input type="password" placeholder="Repita a nova senha" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm text-gray-800 dark:text-gray-200" />
            </div>
          </div>
          
          <div className="pt-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-4">
              Atualizar Senha
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
           <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
             <AlertCircle className="w-4 h-4" /> Zona de Risco
           </h3>
           <button className="w-full py-3.5 bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm">
             Encerrar todas as sessões ativas
           </button>
           <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">Isso fará logoff em todos os seus outros dispositivos.</p>
        </div>

      </div>
    </div>
  );
}