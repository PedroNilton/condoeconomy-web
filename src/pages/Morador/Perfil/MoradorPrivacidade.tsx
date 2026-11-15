import { ShieldCheck, FileText, Lock, Eye, Database, CheckCircle, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../../services/api';
import { PageHead, Toast } from '../../../components/ui';

export function MoradorPrivacidade() {
  const navigate = useNavigate();
  const [exportando, setExportando] = useState(false);
  const [exportadoSucesso, setExportadoSucesso] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleExportarDados = async () => {
    setExportando(true);
    try {
      const res = await api.get('/api/v1/perfil/lgpd/exportar-dados');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-lgpd-habitos-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportadoSucesso(true);
      setTimeout(() => setExportadoSucesso(false), 4000);
    } catch {
      showToast('Não foi possível gerar o relatório de portabilidade no momento.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-24">
      <PageHead title="Termos e Privacidade" onBack={() => navigate(-1)} />

      {/* Main Content */}
      <main className="px-[18px] mt-2 flex-1 space-y-5">
        {/* Banner LGPD */}
        <div className="flex gap-3 bg-brand-soft text-brand rounded-[16px] p-4 text-[13px] leading-relaxed border border-brand/20">
          <ShieldCheck className="w-6 h-6 flex-none mt-0.5" />
          <div>
            <span className="font-bold block text-[14px] mb-1">
              Compromisso com a LGPD (Lei 13.709/2018)
            </span>
            O CondoEconomy opera sob o princípio de transparência total, minimização de dados e segurança da informação para todos os condôminos, prestadores e visitantes.
          </div>
        </div>

        {/* Seção 1: Dados Coletados */}
        <section className="bg-surface border border-line rounded-[16px] p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
            <Database className="w-4 h-4 text-brand" />
            Quais dados coletamos?
          </h2>
          <p className="text-[12.5px] text-dim leading-relaxed">
            Coletamos estritamente os dados necessários para o funcionamento e a segurança do condomínio:
          </p>
          <ul className="text-[12.5px] text-dim space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-ink">Identificação:</strong> Nome completo, e-mail, telefone e foto de perfil opcional.
            </li>
            <li>
              <strong className="text-ink">Unidade:</strong> Número do apartamento, bloco e cadastro de moradores dependentes.
            </li>
            <li>
              <strong className="text-ink">Veículos & Pets:</strong> Placa, modelo e identificação visual para controle de vagas e segurança interna.
            </li>
            <li>
              <strong className="text-ink">Registros de Acesso:</strong> Histórico de visitas autorizadas, entregas recebidas e reservas de áreas comuns.
            </li>
          </ul>
        </section>

        {/* Seção 2: Finalidade e Base Legal */}
        <section className="bg-surface border border-line rounded-[16px] p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
            <FileText className="w-4 h-4 text-brand" />
            Finalidade do Tratamento
          </h2>
          <p className="text-[12.5px] text-dim leading-relaxed">
            Seus dados são tratados com base no <strong className="text-ink">Legítimo Interesse</strong> e na <strong className="text-ink">Proteção da Segurança Patrimonial</strong> (Art. 7º, IX da LGPD):
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2 text-[12px] text-dim">
              <CheckCircle className="w-4 h-4 text-ok flex-none mt-0.5" />
              <span>Controle estrito de entrada e saída na portaria física e remota.</span>
            </div>
            <div className="flex items-start gap-2 text-[12px] text-dim">
              <CheckCircle className="w-4 h-4 text-ok flex-none mt-0.5" />
              <span>Notificações operacionais sobre encomendas recebidas e comunicados do síndico.</span>
            </div>
            <div className="flex items-start gap-2 text-[12px] text-dim">
              <CheckCircle className="w-4 h-4 text-ok flex-none mt-0.5" />
              <span>Emissão e conferência de boletos e taxas condominiais regulares.</span>
            </div>
          </div>
        </section>

        {/* Seção 3: Medidas de Segurança */}
        <section className="bg-surface border border-line rounded-[16px] p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
            <Lock className="w-4 h-4 text-brand" />
            Como protegemos seus dados?
          </h2>
          <div className="space-y-2 text-[12.5px] text-dim leading-relaxed">
            <p>
              • <strong className="text-ink">Criptografia forte:</strong> Senhas armazenadas com algoritmo BCrypt irreversível e conexão HTTPS/TLS segura.
            </p>
            <p>
              • <strong className="text-ink">Kill Switch de Sessões:</strong> Ao alterar sua senha, todos os dispositivos conectados anteriormente são invalidados instantaneamente no servidor.
            </p>
            <p>
              • <strong className="text-ink">Confinamento Multi-Condomínio:</strong> Seu token criptográfico está vinculado exclusivamente ao seu condomínio e unidade, impedindo acessos cruzados.
            </p>
            <p>
              • <strong className="text-ink">Trilha de Auditoria Forense:</strong> Registros inalteráveis de acessos e modificações com carimbo de data, hora e IP de origem.
            </p>
          </div>
        </section>

        {/* Seção 4: Direitos do Titular & Portabilidade */}
        <section className="bg-surface border border-line rounded-[16px] p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
            <Eye className="w-4 h-4 text-brand" />
            Seus Direitos como Titular (Art. 18 LGPD)
          </h2>
          <p className="text-[12.5px] text-dim leading-relaxed">
            Você tem o direito de solicitar a qualquer momento a confirmação de existência de tratamento, correção de dados incompletos e a exportação estruturada (portabilidade) de todos os dados vinculados ao seu perfil.
          </p>

          <button
            type="button"
            onClick={handleExportarDados}
            disabled={exportando}
            className="w-full py-3 px-4 rounded-[12px] bg-brand text-brand-ink font-bold text-[13.5px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
          >
            {exportando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar Relatório dos Meus Dados (JSON)
              </>
            )}
          </button>

          {exportadoSucesso && (
            <div className="p-2.5 rounded-[10px] bg-ok-soft text-ok text-[12px] font-semibold text-center">
              Relatório LGPD gerado e baixado com sucesso!
            </div>
          )}

          <div className="pt-2 border-t border-line text-[11px] text-dim">
            Encarregado de Dados (DPO): dpo@condoeconomy.com • Versão do Termo: 2.2 (Outubro/2026)
          </div>
        </section>
      </main>

      <Toast message={toastMsg} hasBottomNav={false} />
    </div>
  );
}
