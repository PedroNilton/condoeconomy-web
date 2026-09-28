import { ChevronLeft, Search, Plus, MessageSquare, BookOpen, Mail, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';

const faqs = [
  {
    q: 'Como funciona a aprovação de reservas?',
    a: 'Toda reserva de área comum fica com status PENDENTE até o síndico analisar, em até 48h. O valor, se houver, entra automaticamente no seu próximo boleto após a aprovação.'
  },
  {
    q: 'Quando meu boleto é gerado?',
    a: 'Os boletos são gerados todo início de mês, com vencimento no dia 10. Você recebe um aviso assim que ele fica disponível na aba Boletos.'
  },
  {
    q: 'Como cadastro meu veículo ou pet?',
    a: 'No seu Perfil, em "Meus veículos" ou "Meus pets", toque no botão + e preencha os dados. Pets: cor e foto ajudam a portaria a identificar em caso de ocorrência.'
  },
  {
    q: 'Por que não recebi uma notificação?',
    a: 'Confira em Perfil > Notificações se o canal daquele tipo de aviso está ativado. Avisos de emergência sempre chegam, os demais dependem da sua configuração.'
  },
  {
    q: 'Posso dar acesso ao app pra outro morador?',
    a: 'Sim. Em "Moradores adicionais", ative "Dar acesso ao aplicativo" ao cadastrar a pessoa — enviamos um convite por e-mail pra ela criar o próprio login.'
  }
];

export function MoradorAjuda() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return faqs;
    return faqs.filter(f => f.q.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const toggleFaq = (index: number) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative overflow-hidden">
      
      {/* Header */}
      <header className="px-5 py-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm flex-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Central de ajuda</h1>
        </div>

        {/* Search Wrap */}
        <div className="relative">
          <Search className="w-4 h-4 text-ds-dim absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar em perguntas frequentes"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-ds-card border border-ds-border rounded-[12px] pl-10 pr-4 py-3.5 text-[14px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim transition-shadow"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-24 flex-1 overflow-y-auto">
        
        {/* Perguntas frequentes */}
        <section className="mb-8">
          <h2 className="text-[14px] font-bold text-ds-dim mb-3">Perguntas frequentes</h2>
          <div className="bg-ds-card border border-ds-border rounded-[16px] divide-y divide-ds-border overflow-hidden">
            {filteredFaqs.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-ds-dim">Nenhuma pergunta encontrada.</div>
            ) : (
              filteredFaqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={i} className="flex flex-col">
                    <button 
                      onClick={() => toggleFaq(i)}
                      className="flex justify-between items-center px-4 py-4 w-full text-left active:bg-ds-bg transition-colors"
                    >
                      <span className="text-[14px] font-bold text-ds-text pr-4 leading-tight">{faq.q}</span>
                      <div className={`w-[26px] h-[26px] rounded-[8px] bg-ds-bg border border-ds-border flex items-center justify-center text-ds-text flex-none transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                    <div 
                      className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-0 text-[13px] leading-relaxed text-ds-dim">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Canais Oficiais */}
        <section className="mb-8">
          <h2 className="text-[14px] font-bold text-ds-dim mb-3">Canais oficiais</h2>
          <div className="bg-ds-card border border-ds-border rounded-[16px] divide-y divide-ds-border overflow-hidden">
            
            <button onClick={() => navigate('/app/ouvidoria')} className="w-full flex items-center justify-between p-4 active:bg-ds-bg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-ds-bg border border-ds-border flex items-center justify-center text-ds-text flex-none">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-bold text-ds-text">Falar com o síndico</div>
                  <div className="text-[12px] text-ds-dim mt-[1px]">Abrir chamado via ouvidoria</div>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-ds-dim rotate-180" />
            </button>

            <a href="tel:0800000000" className="w-full flex items-center justify-between p-4 active:bg-ds-bg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-ds-bg border border-ds-border flex items-center justify-center text-ds-text flex-none">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-bold text-ds-text">Ligar para portaria</div>
                  <div className="text-[12px] text-ds-dim mt-[1px]">Atendimento 24h</div>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-ds-dim rotate-180" />
            </a>

          </div>
        </section>

        {/* Documentos */}
        <section className="mb-8">
          <h2 className="text-[14px] font-bold text-ds-dim mb-3">Documentos</h2>
          <div className="bg-ds-card border border-ds-border rounded-[16px] divide-y divide-ds-border overflow-hidden">
            
            <button className="w-full flex items-center justify-between p-4 active:bg-ds-bg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-ds-bg border border-ds-border flex items-center justify-center text-ds-text flex-none">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-[14px] font-bold text-ds-text">Regimento interno</div>
              </div>
              <ChevronLeft className="w-4 h-4 text-ds-dim rotate-180" />
            </button>

            <button className="w-full flex items-center justify-between p-4 active:bg-ds-bg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-ds-bg border border-ds-border flex items-center justify-center text-ds-text flex-none">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-[14px] font-bold text-ds-text">Convenção do condomínio</div>
              </div>
              <ChevronLeft className="w-4 h-4 text-ds-dim rotate-180" />
            </button>

          </div>
        </section>

        {/* Support Card */}
        <div className="bg-ds-primary-dim rounded-[16px] p-[18px] mb-4">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-ds-card text-ds-primary flex items-center justify-center mb-3">
            <Mail className="w-[18px] h-[18px]" />
          </div>
          <h2 className="text-[15px] font-[800] text-ds-primary mb-1.5">Problemas com o app?</h2>
          <p className="text-[12.5px] text-ds-primary/85 leading-relaxed mb-3.5">
            Encontrou um bug ou algo que não funciona como deveria? Manda pra gente com print, se puder.
          </p>
          <a 
            href="mailto:suporte@habitos.com"
            className="inline-block bg-ds-card text-ds-primary border-none px-4 py-2.5 rounded-[9px] font-bold text-[13px] active:scale-95 transition-transform"
          >
            Enviar e-mail
          </a>
        </div>

        {/* Version Footer */}
        <div className="text-center font-mono text-[10.5px] font-bold text-ds-dim/50 tracking-wider mt-6">
          HABITOS — V1.0.0
        </div>

      </main>
    </div>
  );
}
