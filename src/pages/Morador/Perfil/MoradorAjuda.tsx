import { ArrowLeft, MessageSquare, Phone, BookOpen, ExternalLink, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorAjuda() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-20">
      
      <header className="bg-white dark:bg-gray-800 pt-10 pb-4 px-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            Central de Ajuda
          </h2>
        </div>
      </header>

      <div className="p-6 space-y-6">
        
        {/* Contato Sindico/Portaria */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Canais Oficiais</h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <button onClick={() => navigate('/app/ouvidoria')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Falar com o Síndico</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Abrir chamado via Ouvidoria</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </button>
            
            <a href="tel:0800000000" className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Ligar para Portaria</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Atendimento 24h</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </a>
          </div>
        </div>

        {/* Documentos */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Documentos</h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-gray-400 dark:text-gray-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Regimento Interno</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-gray-400 dark:text-gray-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Convenção do Condomínio</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Suporte Tecnico */}
        <div className="bg-blue-600 rounded-2xl p-6 text-center text-white shadow-md relative overflow-hidden mt-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Mail className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h4 className="font-bold text-lg mb-2">Problemas com o App?</h4>
            <p className="text-blue-100 text-sm mb-4">Caso encontre algum bug no aplicativo, reporte ao suporte técnico.</p>
            <a href="mailto:suporte@condoeconomy.com" className="inline-block bg-white text-blue-600 font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm active:scale-95 transition-transform">
              Enviar E-mail
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}