import { Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorLogin() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulando login
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white h-screen flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Background Decorativo */}
        <div className="absolute top-0 w-full h-64 bg-gradient-to-br from-blue-700 to-blue-950 rounded-b-[40px] shadow-lg"></div>

        <div className="relative z-10 flex flex-col h-full px-8 pt-20">
          
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">CondoEconomy</h1>
            <p className="text-blue-100 text-sm mt-1">O app do seu condomínio</p>
          </div>

          <div className="flex-1">
            <form onSubmit={handleLogin} className="space-y-5 mt-10">
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">E-mail ou CPF</label>
                <input 
                  type="text" 
                  defaultValue="morador@jardins.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Senha</label>
                  <a href="#" className="text-xs text-blue-600 font-medium">Esqueceu?</a>
                </div>
                <input 
                  type="password" 
                  defaultValue="123456"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
              >
                Entrar
                <ArrowRight className="w-5 h-5" />
              </button>

            </form>
          </div>

          <div className="pb-8 text-center">
            <p className="text-sm text-gray-500">
              Ainda não tem acesso? <br/>
              <a href="#" className="text-blue-600 font-semibold underline decoration-2 underline-offset-2">Fale com a portaria</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
