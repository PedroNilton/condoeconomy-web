import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/UI/Modal';
import { NovaEncomendaForm } from './components/NovaEncomendaForm';
import { useNotification } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import api from '../../services/api';
import {
  Badge,
  Button,
  ChoiceChips,
  ConfirmSheet,
  EmptyState,
  Field,
  ListCard,
  SearchInput,
  SegmentedTabs,
  Toast,
} from '../../components/ui';

interface Encomenda {
  id: string;
  codigoRastreio: string;
  destinatario: string;
  unidade: string;
  status: string;
  transportadora: string;
  dataRecebimento: string;
  dataRetirada: string | null;
}

export function EncomendasList() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'AGUARDANDO_RETIRADA' | 'RETIRADA'>(
    'TODAS',
  );
  const [confirmRetiradaId, setConfirmRetiradaId] = useState<string | null>(null);
  const [quemRetira, setQuemRetira] = useState<'destinatario' | 'outra'>('destinatario');
  const [nomeRetirada, setNomeRetirada] = useState('');
  const [erroRetirada, setErroRetirada] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { refreshCounts } = useNotification();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const fetchEncomendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/v1/encomendas');
      setEncomendas(Array.isArray(res.data) ? res.data : []);
      setNowMs(Date.now());
    } catch (err) {
      setError('Falha ao carregar encomendas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEncomendas();
  }, [fetchEncomendas]);

  useWebSocket('/topic/encomendas', fetchEncomendas);

  const abrirConfirmRetirada = (id: string) => {
    setConfirmRetiradaId(id);
    setQuemRetira('destinatario');
    setNomeRetirada('');
    setErroRetirada('');
  };

  const fecharConfirmRetirada = () => {
    setConfirmRetiradaId(null);
    setQuemRetira('destinatario');
    setNomeRetirada('');
    setErroRetirada('');
  };

  const handleConfirmRetirar = async () => {
    if (!confirmRetiradaId) return;
    if (quemRetira === 'outra' && !nomeRetirada.trim()) {
      setErroRetirada('Informe o nome de quem está retirando.');
      return;
    }

    try {
      const target = encomendas.find((e) => e.id === confirmRetiradaId);
      const retiradoPor =
        quemRetira === 'outra' ? nomeRetirada.trim() : target?.destinatario || 'Destinatário';
      await api.put(`/api/v1/encomendas/${confirmRetiradaId}/retirar`, { retiradoPor });
      fecharConfirmRetirada();
      fetchEncomendas();
      refreshCounts();
      showToast('Entrega confirmada');
    } catch (err) {
      console.error('Erro ao registrar retirada', err);
      fecharConfirmRetirada();
      showToast('Erro ao confirmar entrega. Tente novamente.');
    }
  };

  const countTodas = encomendas.length;
  const countAguardando = encomendas.filter((e) => e.status === 'AGUARDANDO_RETIRADA').length;
  const countEntregues = encomendas.filter(
    (e) => e.status === 'RETIRADA' || e.status === 'ENTREGUE',
  ).length;

  const filteredEncomendas = encomendas.filter((enc) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      enc.codigoRastreio.toLowerCase().includes(term) ||
      enc.destinatario.toLowerCase().includes(term) ||
      enc.unidade.toLowerCase().includes(term) ||
      (enc.transportadora?.toLowerCase().includes(term) ?? false);

    const matchesStatus =
      statusFilter === 'TODAS' ||
      (statusFilter === 'RETIRADA' && (enc.status === 'RETIRADA' || enc.status === 'ENTREGUE')) ||
      enc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isEncomendaAtrasada = (enc: Encomenda) => {
    if (enc.status !== 'AGUARDANDO_RETIRADA' || !enc.dataRecebimento) return false;
    const diffDias =
      (nowMs - new Date(enc.dataRecebimento).getTime()) / (1000 * 60 * 60 * 24);
    return diffDias >= 3;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint m-0">
            Recepção
          </p>
          <h1 className="text-[21px] font-extrabold text-ink tracking-[-0.01em] m-0 mt-[3px]">
            Encomendas
          </h1>
        </div>

        <Button variant="primary" size="card" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Receber</span>
        </Button>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col gap-2.5">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Código, morador ou unidade..."
        />

        <SegmentedTabs
          value={statusFilter}
          onChange={setStatusFilter}
          items={[
            { id: 'TODAS', label: 'Todas', count: countTodas },
            { id: 'AGUARDANDO_RETIRADA', label: 'Aguardando', count: countAguardando },
            { id: 'RETIRADA', label: 'Entregues', count: countEntregues },
          ]}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <ListCard className="py-12 flex flex-col items-center justify-center gap-2 text-dim text-[12.5px]">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
          <span>Carregando pacotes...</span>
        </ListCard>
      ) : error ? (
        <ListCard className="py-10 text-center">
          <p className="text-[12.5px] font-semibold text-bad m-0 mb-3">{error}</p>
          <Button variant="secondary" size="card" onClick={fetchEncomendas}>
            Tentar novamente
          </Button>
        </ListCard>
      ) : filteredEncomendas.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="Nenhum pacote encontrado"
          description="Registre novas encomendas assim que chegarem na portaria."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredEncomendas.map((enc) => {
            const pendente = enc.status === 'AGUARDANDO_RETIRADA';
            const atrasada = isEncomendaAtrasada(enc);
            return (
              <ListCard key={enc.id} tone={atrasada ? 'warn' : 'default'}>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-mono text-[14.5px] font-bold text-ink block truncate">
                      {enc.unidade}
                    </span>
                    <Badge tone={pendente ? 'warn' : 'ok'}>
                      {pendente ? 'Aguardando' : 'Entregue'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[10px] bg-canvas border border-line">
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.04em] text-faint">
                        Destinatário
                      </span>
                      <span className="block text-[12px] font-bold text-ink truncate mt-0.5">
                        {enc.destinatario}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.04em] text-faint">
                        Transportadora
                      </span>
                      <span className="block text-[12px] font-bold text-ink truncate mt-0.5">
                        {enc.transportadora}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] text-faint block truncate">
                        {enc.codigoRastreio}
                      </span>
                      <div className="font-mono text-[10.5px] text-dim leading-[1.4] mt-0.5">
                        <div>
                          Chegada:{' '}
                          {enc.dataRecebimento
                            ? new Date(enc.dataRecebimento).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </div>
                        {!pendente && enc.dataRetirada && (
                          <div>
                            Retirada:{' '}
                            {new Date(enc.dataRetirada).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {pendente && (
                      <Button
                        variant="primary"
                        size="card"
                        onClick={() => abrirConfirmRetirada(enc.id)}
                        className="!bg-ok !border-ok !text-white shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </ListCard>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Receber encomenda"
      >
        <NovaEncomendaForm
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEncomendas();
            refreshCounts();
            showToast('Encomenda registrada');
          }}
        />
      </Modal>

      <ConfirmSheet
        open={confirmRetiradaId !== null}
        onClose={fecharConfirmRetirada}
        onConfirm={handleConfirmRetirar}
        title="Confirmar entrega"
        description="Confirmar a entrega deste pacote ao morador?"
        confirmLabel="Confirmar entrega"
      >
        <div className="flex flex-col gap-3 py-1">
          <ChoiceChips
            label="Quem está retirando?"
            options={[
              { value: 'destinatario', label: 'O próprio destinatário' },
              { value: 'outra', label: 'Outra pessoa' },
            ]}
            value={quemRetira}
            onChange={(val) => {
              setQuemRetira(val);
              setErroRetirada('');
            }}
          />

          {quemRetira === 'outra' && (
            <Field
              label="Nome de quem está retirando"
              placeholder="Nome completo do retirante"
              value={nomeRetirada}
              onChange={(e) => {
                setNomeRetirada(e.target.value);
                if (erroRetirada) setErroRetirada('');
              }}
              error={erroRetirada || undefined}
              required
            />
          )}
        </div>
      </ConfirmSheet>

      <Toast message={toastMsg} />
    </div>
  );
}

