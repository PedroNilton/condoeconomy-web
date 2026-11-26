import { useState, useEffect } from 'react';
import { Loader2, Copy, CheckCircle2, Download, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { escapeHtml } from '../../../utils/escapeHtml';
import {
  Badge,
  Button,
  EmptyState,
  FilterChips,
  IconButton,
  ListCard,
  PageHead,
  Toast,
} from '../../../components/ui';

interface Boleto {
  id: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  linhaDigitavel: string;
}

const FILTER_OPTIONS = [
  { id: 'Todos' as const, label: 'Todos' },
  { id: 'Pendentes' as const, label: 'Pendentes' },
  { id: 'Pagos' as const, label: 'Pagos' },
  { id: 'Atrasados' as const, label: 'Atrasados' },
];

export function MoradorBoletos() {
  const navigate = useNavigate();
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [filter, setFilter] = useState<'Todos' | 'Pendentes' | 'Pagos' | 'Atrasados'>('Todos');

  useEffect(() => {
    carregarBoletos();
  }, []);

  const carregarBoletos = async () => {
    try {
      const response = await api.get('/api/v1/boletos/meus');
      const data = response.data;
      data.sort(
        (a: Boleto, b: Boleto) =>
          new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime(),
      );
      setBoletos(data);
    } catch (error) {
      console.error('Erro ao carregar boletos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isVencido = (vencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(vencimento) < hoje;
  };

  const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      text || '00190.00009 01234.567890 12345.678901 1 98760000065000',
    );
    setCopiedId(id);
    setToastMsg('Código copiado para a área de transferência');
    setTimeout(() => {
      setCopiedId(null);
      setToastMsg(null);
    }, 2200);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    return month.charAt(0).toUpperCase() + month.slice(1);
  };

  const handleDownloadBoleto = (e: React.MouseEvent, boleto: Boleto) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.opener = null;
    const mes = escapeHtml(getMonthName(boleto.dataVencimento));
    const valorFmt = escapeHtml(formatCurrency(boleto.valor));
    const dataVencFmt = escapeHtml(new Date(boleto.dataVencimento).toLocaleDateString('pt-BR'));
    const statusSafe = escapeHtml(boleto.status);
    const linha = escapeHtml(
      boleto.linhaDigitavel ||
        '34191.09008 63571.277308 71444.640008 3 955300000' + String(boleto.valor).replace('.', '')
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Boleto Condominial - ${mes}</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111318; max-width: 680px; margin: 0 auto; }
          .header { border-bottom: 2px solid #1E40AF; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 20px; font-weight: 800; color: #1E40AF; }
          .title { font-size: 16px; font-weight: 700; margin: 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #F4F5F7; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; }
          .field { margin-bottom: 8px; }
          .label { font-size: 11px; text-transform: uppercase; color: #5B616E; font-weight: bold; }
          .val { font-size: 15px; font-weight: bold; margin-top: 2px; }
          .linha { font-family: monospace; font-size: 13px; background: #ffffff; padding: 12px; border: 1px solid #D1D5DB; border-radius: 8px; word-break: break-all; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #8C929E; margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 16px; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">HabitOS · CondoEconomy</div>
          <div class="title">Boleto / Comprovante Digital</div>
        </div>
        <div class="grid">
          <div class="field"><div class="label">Competência</div><div class="val">${mes} - Taxa Condominial</div></div>
          <div class="field"><div class="label">Vencimento</div><div class="val">${dataVencFmt}</div></div>
          <div class="field"><div class="label">Valor Nominal</div><div class="val" style="color: #1E40AF;">${valorFmt}</div></div>
          <div class="field"><div class="label">Situação</div><div class="val">${statusSafe}</div></div>
        </div>
        <div class="label">Linha Digitável / Código de Pagamento</div>
        <div class="linha">${linha}</div>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 13px; color: #64748b;">Efetue o pagamento pelo aplicativo do seu banco via código de barras ou PIX Copia e Cola.</p>
        </div>
        <div class="footer">Documento gerado eletronicamente pelo CondoEconomy</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getEmAberto = () => {
    return boletos
      .filter((b) => b.status === 'PENDENTE' || b.status === 'VENCIDO')
      .reduce((acc, curr) => acc + curr.valor, 0);
  };

  const temBoletoVencido = boletos.some(
    (b) => b.status === 'VENCIDO' || (b.status === 'PENDENTE' && isVencido(b.dataVencimento)),
  );

  const getProximoVencimento = () => {
    const pendentes = boletos.filter(
      (b) => b.status === 'PENDENTE' && !isVencido(b.dataVencimento),
    );
    if (pendentes.length === 0) return '-';
    pendentes.sort(
      (a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime(),
    );
    const date = new Date(pendentes[0].dataVencimento);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  const filteredBoletos = boletos.filter((b) => {
    const emAberto = b.status === 'PENDENTE' || b.status === 'VENCIDO';
    const venc = b.status === 'VENCIDO' || (b.status === 'PENDENTE' && isVencido(b.dataVencimento));
    if (filter === 'Pendentes') return emAberto && !venc;
    if (filter === 'Pagos') return b.status === 'PAGO';
    if (filter === 'Atrasados') return venc;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-canvas text-ink pb-8">
      <PageHead eyebrow="Financeiro" title="Meus boletos" onBack={() => navigate('/app')}>
        <ListCard className="mb-3.5">
          <div className="flex justify-between items-center gap-3">
            <div>
              <div className="text-[11.5px] text-dim font-semibold">Em aberto</div>
              <div
                className={`font-mono text-[19px] font-extrabold ${
                  temBoletoVencido ? 'text-bad' : 'text-ink'
                } tabular-nums mt-0.5`}
              >
                {formatCurrency(getEmAberto())}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11.5px] text-dim font-semibold">Próximo vencimento</div>
              <div className="font-mono text-[19px] font-extrabold text-ink mt-0.5">
                {getProximoVencimento()}
              </div>
            </div>
          </div>
        </ListCard>

        <div className="pb-3">
          <FilterChips
            items={FILTER_OPTIONS}
            value={filter}
            onChange={(v) => setFilter(v)}
          />
        </div>
      </PageHead>

      <main className="flex-1 px-[18px] flex flex-col gap-2.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : filteredBoletos.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="Tudo limpo por aqui"
            description="Nenhum boleto encontrado para este filtro."
            tone="ok"
          />
        ) : (
          filteredBoletos.map((boleto) => {
            const emAberto = boleto.status === 'PENDENTE' || boleto.status === 'VENCIDO';
            const vencido =
              boleto.status === 'VENCIDO' ||
              (boleto.status === 'PENDENTE' && isVencido(boleto.dataVencimento));
            const isExpanded = expandedId === boleto.id;

            let statusText = boleto.status;
            let tone: 'ok' | 'warn' | 'bad' = 'warn';
            let dateText = `VENCE EM ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            })}`;

            if (vencido) {
              statusText = 'VENCIDO';
              tone = 'bad';
              dateText = `VENCIDO EM ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}`;
            } else if (emAberto) {
              const diffTime = Math.ceil(
                (new Date(boleto.dataVencimento).getTime() - new Date().getTime()) /
                  (1000 * 3600 * 24),
              );
              statusText = diffTime <= 3 ? `VENCE EM ${diffTime} DIAS` : 'A VENCER';
              tone = 'warn';
            } else if (boleto.status === 'PAGO') {
              statusText = 'PAGO';
              tone = 'ok';
              dateText = `PAGO EM ${new Date(
                boleto.dataPagamento || boleto.dataVencimento,
              ).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}`;
            }

            return (
              <ListCard
                key={boleto.id}
                tone={vencido ? 'bad' : 'default'}
                className="cursor-pointer transition-colors"
              >
                <div onClick={(e) => toggleExpand(e, boleto.id)} className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-extrabold text-ink truncate">
                        {getMonthName(boleto.dataVencimento)} — condomínio
                      </div>
                      <div className="font-mono text-[11px] text-dim mt-0.5">{dateText}</div>
                    </div>
                    <Badge tone={tone}>{statusText}</Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[17px] font-extrabold text-ink tabular-nums">
                      {formatCurrency(boleto.valor)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadBoleto(e, boleto)}
                      className="text-brand font-bold text-[12.5px] cursor-pointer hover:underline bg-transparent border-0 p-0"
                    >
                      {boleto.status === 'PAGO'
                        ? 'Ver recibo'
                        : vencido
                        ? 'Pagar agora'
                        : 'Ver boleto'}
                    </button>
                  </div>
                </div>

                {isExpanded && emAberto && (
                  <div className="pt-3 mt-3 border-t border-line space-y-2.5">
                    <div className="bg-canvas border border-line rounded-[10px] p-2.5">
                      <p className="font-mono text-[11.5px] text-ink break-all leading-relaxed m-0">
                        {boleto.linhaDigitavel ||
                          '00190.00009 01234.567890 12345.678901 1 98760000065000'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="card"
                        className="flex-1"
                        onClick={(e) => handleCopy(e, boleto.id, boleto.linhaDigitavel)}
                      >
                        {copiedId === boleto.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-ok" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-dim" />
                            <span>Copiar código</span>
                          </>
                        )}
                      </Button>
                      <IconButton
                        label="Baixar 2ª via / Comprovante"
                        onClick={(e) => handleDownloadBoleto(e, boleto)}
                      >
                        <Download className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                )}
              </ListCard>
            );
          })
        )}
      </main>

      <Toast message={toastMsg} />
    </div>
  );
}
