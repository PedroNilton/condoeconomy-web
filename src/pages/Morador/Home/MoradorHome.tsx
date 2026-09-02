import { Package, Bell, CalendarDays, FileText, Settings, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorHome() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Header Topo */}
      <header className="bg-blue-600 pt-12 pb-6 px-6 rounded-b-[30px] shadow-md relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner">
              <UserCircle2 className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Olá, Carlos!</p>
              <h2 className="text-white text-lg font-bold">Apt 101 - Bloco B</h2>
            </div>
          </div>
          <button className="relative w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-700"></span>
          </button>
        </div>

        {/* Card de Boleto Aberto */}
        <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between border-l-4 border-yellow-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Taxa Condominial</p>
              <p className="text-sm font-bold text-gray-800">Vence em 3 dias</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/app/boletos')}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            Pagar
          </button>
        </div>
      </header>

      {/* Grid de Atalhos */}
      <div className="p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide uppercase">Serviços Rápidos</h3>
        
        <div className="grid grid-cols-2 gap-4">
          
          <button 
            onClick={() => navigate('/app/encomendas')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 relative">
              <Package className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                1
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-700">Encomendas</span>
          </button>

          <button 
            onClick={() => navigate('/app/reservas')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Reservar Salão</span>
          </button>

          <button 
            onClick={() => navigate('/app/visitantes')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Visitantes</span>
          </button>

          <button 
            onClick={() => navigate('/app/configuracoes')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <Settings className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Configurações</span>
          </button>

        </div>
      </div>

      {/* Mural de Avisos */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide uppercase">Mural do Síndico</h3>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Manutenção da Piscina</h4>
              <p className="text-xs text-gray-500 mt-1">A piscina ficará interditada nesta quinta-feira (03/09) para tratamento de choque na água.</p>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">Há 2 horas • Administração</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
