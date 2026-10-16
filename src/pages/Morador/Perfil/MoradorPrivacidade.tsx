import { ChevronLeft, ShieldCheck, FileText, Lock, Eye, Database, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MoradorPrivacidade() {
  const navigate = useNavigate();

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative">
      
      {/* Header */}
      <header className="px-5 py-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm flex-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Termos e Privacidade</h1>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-24 flex-1 overflow-y-auto space-y-5">
        
        {/* Banner LGPD */}
        <div className="flex gap-3 bg-ds-primary-dim text-ds-primary rounded-[16px] p-4 text-[13px] leading-relaxed border border-ds-primary/20">
          <ShieldCheck className="w-6 h-6 flex-none mt-0.5" />
          <div>
            <span className="font-bold block text-[14px] mb-1">Compromisso com a LGPD (Lei 13.709/2018)</span>
            O CondoEconomy opera sob o princípio de transparência total, minimização de dados e segurança da informação para todos os condôminos, prestadores e visitantes.
          </div>
        </div>

        {/* Seção 1: Dados Coletados */}
        <section className="bg-ds-card border border-ds-border rounded-[16px] p-5 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ds-text">
            <Database className="w-4 h-4 text-ds-primary" />
            Quais dados coletamos?
          </h2>
          <p className="text-[12.5px] text-ds-dim leading-relaxed">
            Coletamos estritamente os dados necessários para o funcionamento e a segurança do condomínio:
          </p>
          <ul className="text-[12.5px] text-ds-dim space-y-1.5 list-disc list-inside">
            <li><strong className="text-ds-text">Identificação:</strong> Nome completo, e-mail, telefone e foto de perfil opcional.</li>
            <li><strong className="text-ds-text">Unidade:</strong> Número do apartamento, bloco e cadastro de moradores dependentes.</li>
            <li><strong className="text-ds-text">Veículos & Pets:</strong> Placa, modelo e identificação visual para controle de vagas e segurança interna.</li>
            <li><strong className="text-ds-text">Registros de Acesso:</strong> Histórico de visitas autorizadas, entregas recebidas e reservas de áreas comuns.</li>
          </ul>
        </section>

        {/* Seção 2: Finalidade e Base Legal */}
        <section className="bg-ds-card border border-ds-border rounded-[16px] p-5 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ds-text">
            <FileText className="w-4 h-4 text-ds-primary" />
            Finalidade do Tratamento
          </h2>
          <p className="text-[12.5px] text-ds-dim leading-relaxed">
            Seus dados são tratados com base no <strong className="text-ds-text">Legítimo Interesse</strong> e na <strong className="text-ds-text">Proteção da Segurança Patrimonial</strong> (Art. 7º, IX da LGPD):
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2 text-[12px] text-ds-dim">
              <CheckCircle className="w-4 h-4 text-ds-success flex-none mt-0.5" />
              <span>Controle estrito de entrada e saída na portaria física e remota.</span>
            </div>
            <div className="flex items-start gap-2 text-[12px] text-ds-dim">
              <CheckCircle className="w-4 h-4 text-ds-success flex-none mt-0.5" />
              <span>Notificações operacionais sobre encomendas recebidas e comunicados do síndico.</span>
            </div>
            <div className="flex items-start gap-2 text-[12px] text-ds-dim">
              <CheckCircle className="w-4 h-4 text-ds-success flex-none mt-0.5" />
              <span>Emissão e conferência de boletos e taxas condominiais regulares.</span>
            </div>
          </div>
        </section>

        {/* Seção 3: Medidas de Segurança */}
        <section className="bg-ds-card border border-ds-border rounded-[16px] p-5 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ds-text">
            <Lock className="w-4 h-4 text-ds-primary" />
            Como protegemos seus dados?
          </h2>
          <div className="space-y-2 text-[12.5px] text-ds-dim leading-relaxed">
            <p>
              • <strong className="text-ds-text">Criptografia forte:</strong> Senhas armazenadas com algoritmo BCrypt irreversível e tráfego HTTPS/TLS ponta a ponta.
            </p>
            <p>
              • <strong className="text-ds-text">Kill Switch de Sessões:</strong> Ao alterar sua senha, todos os dispositivos conectados anteriormente são invalidados instantaneamente no servidor.
            </p>
            <p>
              • <strong className="text-ds-text">Trilha de Auditoria Forense:</strong> Registros inalteráveis de acessos e modificações com carimbo de data, hora e IP de origem.
            </p>
          </div>
        </section>

        {/* Seção 4: Direitos do Titular */}
        <section className="bg-ds-card border border-ds-border rounded-[16px] p-5 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ds-text">
            <Eye className="w-4 h-4 text-ds-primary" />
            Seus Direitos como Titular (Art. 18 LGPD)
          </h2>
          <p className="text-[12.5px] text-ds-dim leading-relaxed">
            Você tem o direito de solicitar a qualquer momento a confirmação de existência de tratamento, correção de dados incompletos ou desatualizados, e esclarecimentos sobre o compartilhamento de registros junto à administração do seu condomínio.
          </p>
          <div className="pt-2 border-t border-ds-border text-[11px] text-ds-dim">
            Encarregado de Dados (DPO): dpo@condoeconomy.com • Versão do Termo: 2.1 (Outubro/2026)
          </div>
        </section>

      </main>

    </div>
  );
}
