import { useState, useEffect } from 'react';
import { UserCheck, UserPlus, Clock, Loader2, QrCode } from 'lucide-react';
import api from '../../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import {
  Badge,
  BottomSheet,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  IconButton,
  ListCard,
  PageHead,
  Toast,
  type BadgeTone,
} from '../../../components/ui';

interface Visitante {
  id: string;
  nome: string;
  sobrenome?: string;
  dataVisita: string;
  tipo: string;
  status: string;
}

const TIPO_OPTIONS = [
  { value: 'VISITANTE', label: 'Visitante / Convidado' },
  { value: 'PRESTADOR_SERVICO', label: 'Prestador de Serviço' },
] as const;

export function MoradorVisitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState('VISITANTE');
  const [blocoMorador, setBlocoMorador] = useState('A');
  const [aptoMorador, setAptoMorador] = useState('101');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  useEffect(() => {
    fetchData();
    api
      .get('/api/v1/perfil/dados')
      .then((res) => {
        if (res.data?.bloco) setBlocoMorador(res.data.bloco);
        if (res.data?.apartamento) setAptoMorador(res.data.apartamento);
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/visitantes');
      setVisitantes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataVisita) return;

    if (contemAmeacas(nome)) {
      showToast('O nome informado contém caracteres ou comandos bloqueados por segurança.');
      return;
    }

    const nomeLimpo = sanitizarEntrada(nome, 100);
    if (nomeLimpo.length < 2) {
      showToast('Informe um nome válido com pelo menos 2 caracteres.');
      return;
    }

    const partes = nomeLimpo.split(/\s+/);
    const primeiroNome = partes[0];
    const sobrenome = partes.length > 1 ? partes.slice(1).join(' ') : 'Convidado';

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/visitantes', {
        nome: primeiroNome,
        sobrenome: sobrenome,
        blocoDestino: blocoMorador,
        unidadeDestino: aptoMorador,
        dataVisita: dataVisita,
        tipo: tipo,
      });

      setIsFormOpen(false);
      setNome('');
      setTipo('VISITANTE');
      showToast('Visitante autorizado na portaria!');

      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Erro ao autorizar visitante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatarDataVisita = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString('pt-BR');
  };

  const getStatusTone = (status: string): BadgeTone => {
    if (status === 'AGUARDANDO' || status === 'AGUARDANDO_LIBERACAO') return 'warn';
    if (status === 'NO_CONDOMINIO') return 'brand';
    if (status === 'FINALIZADO' || status === 'SAIU') return 'ok';
    return 'neutral';
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col min-h-full bg-canvas text-ink pb-20">
        <PageHead
          title="Liberar Acesso"
          subtitle={`Unidade ${aptoMorador}${blocoMorador ? ` • Bloco ${blocoMorador}` : ''}`}
          onBack={() => setIsFormOpen(false)}
        />

        <form onSubmit={handleSubmit} className="px-[18px] mt-2 space-y-5 flex-1">
          <Field
            label="Nome Completo"
            type="text"
            surface="surface"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Roberto Silva"
            required
          />

          <Field
            label="Data da Visita"
            type="date"
            surface="surface"
            value={dataVisita}
            onChange={(e) => setDataVisita(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />

          <ChoiceChips
            label="Tipo de Acesso"
            options={TIPO_OPTIONS}
            value={tipo}
            onChange={setTipo}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Autorizar na Portaria'
              )}
            </Button>
          </div>
        </form>

        <Toast message={toastMsg} hasBottomNav={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-canvas text-ink pb-24">
      <PageHead
        eyebrow="Portaria"
        title="Visitantes"
        subtitle={`Libere o acesso para convidados da Unidade ${aptoMorador}.`}
      />

      <main className="px-[18px] space-y-5">
        <Button variant="primary" fullWidth onClick={() => setIsFormOpen(true)}>
          <UserPlus className="w-5 h-5" />
          <span>Nova Autorização</span>
        </Button>

        <div>
          <h3 className="text-[11px] font-bold text-faint mb-3 tracking-[0.06em] uppercase pl-1">
            Histórico de Autorizações
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
          ) : visitantes.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="w-6 h-6" />}
              title="Nenhum visitante autorizado"
              description="Nenhum visitante autorizado recentemente."
            />
          ) : (
            <div className="space-y-3">
              {visitantes.map((vis) => {
                const isPending =
                  vis.status === 'AGUARDANDO' || vis.status === 'AGUARDANDO_LIBERACAO';
                return (
                  <ListCard
                    key={vis.id}
                    tone={isPending ? 'warn' : 'default'}
                    className="relative overflow-hidden flex justify-between items-center gap-3"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isPending
                          ? 'bg-warn'
                          : vis.status === 'NO_CONDOMINIO'
                          ? 'bg-brand'
                          : 'bg-line'
                      }`}
                    />
                    <div className="pl-2 min-w-0 flex-1">
                      <h4 className="font-extrabold text-ink text-[14px] m-0 mb-0.5 truncate">
                        {vis.nome}{' '}
                        {vis.sobrenome && vis.sobrenome !== 'Convidado' ? vis.sobrenome : ''}
                      </h4>
                      <p className="text-[12px] text-dim mb-2.5 mt-0 font-medium">
                        {vis.tipo === 'VISITANTE' ? 'Visitante' : 'Prestador de Serviço'}
                      </p>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-[11px] bg-canvas px-2 py-1 rounded-[8px] flex items-center gap-1 border border-line text-dim">
                          <Clock className="w-3.5 h-3.5" /> {formatarDataVisita(vis.dataVisita)}
                        </span>
                        <Badge tone={getStatusTone(vis.status)}>
                          {vis.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {isPending && (
                      <IconButton
                        label="Ver QR Code"
                        onClick={() => setSelectedQrCode(vis.id)}
                        className="!text-brand hover:!border-brand shrink-0"
                      >
                        <QrCode className="w-5 h-5" />
                      </IconButton>
                    )}
                  </ListCard>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomSheet
        open={selectedQrCode !== null}
        onClose={() => setSelectedQrCode(null)}
        title="Código de Acesso"
        subtitle="Apresente este QR Code na portaria para liberação rápida."
      >
        {selectedQrCode && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 border border-line rounded-[16px] mb-5">
              <QRCodeSVG value={selectedQrCode} size={200} />
            </div>

            <Button variant="secondary" fullWidth onClick={() => setSelectedQrCode(null)}>
              Fechar
            </Button>
          </div>
        )}
      </BottomSheet>

      <Toast message={toastMsg} />
    </div>
  );
}
