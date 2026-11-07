import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/UI/Modal';
import { NovaEncomendaForm } from './components/NovaEncomendaForm';
import { useNotification } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import api from '../../services/api';

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
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'AGUARDANDO_RETIRADA' | 'RETIRADA'>('TODAS');

  const { refreshCounts } = useNotification();

  const fetchEncomendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/v1/encomendas');
      setEncomendas(Array.isArray(res.data) ? res.data : []);
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

  const handleRetirar = async (id: string) => {
    if (!window.confirm('Confirmar a entrega deste pacote ao morador?')) return;
    try {
      await api.put(`/api/v1/encomendas/${id}/retirar`);
      fetchEncomendas();
      refreshCounts();
    } catch (err) {
      console.error('Erro ao registrar retirada', err);
      alert('Erro ao confirmar entrega. Tente novamente.');
    }
  };

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

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-ds-faint m-0">
            Recepção
          </p>
          <h2 className="text-[17px] font-extrabold text-ds-text tracking-[-0.01em] m-0 mt-0.5">
            Encomendas
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-[38px] px-3.5 rounded-[11px] bg-ds-primary text-ds-primary-ink text-[12.5px] font-bold flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>Receber</span>
        </button>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-ds-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Código, morador ou unidade..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-ds-card border border-ds-border text-ds-text rounded-[12px] text-[13px] placeholder:text-ds-faint focus:outline-none focus:border-ds-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-ds-card border border-ds-border rounded-[12px]">
          {(
            [
              { id: 'TODAS', label: 'Todas' },
              { id: 'AGUARDANDO_RETIRADA', label: 'Aguardando' },
              { id: 'RETIRADA', label: 'Entregues' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`py-1.5 px-2 rounded-[9px] text-[11px] font-bold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-ds-primary-dim text-ds-primary'
                  : 'text-ds-dim hover:text-ds-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-ds-card border border-ds-border rounded-[14px] py-12 flex flex-col items-center justify-center gap-2 text-ds-dim text-[12.5px]">
          <Loader2 className="w-5 h-5 animate-spin text-ds-primary" />
          <span>Carregando pacotes...</span>
        </div>
      ) : error ? (
        <div className="bg-ds-card border border-ds-border rounded-[14px] py-10 px-4 text-center">
          <p className="text-[12.5px] font-semibold text-ds-danger m-0 mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchEncomendas}
            className="px-4 py-2 rounded-[10px] border border-ds-border bg-ds-bg text-ds-text text-[12px] font-bold cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : filteredEncomendas.length === 0 ? (
        <div className="bg-ds-card border border-ds-border rounded-[14px] py-10 px-4 text-center">
          <div className="w-10 h-10 rounded-[10px] bg-ds-bg border border-ds-border grid place-items-center mx-auto mb-2.5 text-ds-faint">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-[13px] font-bold text-ds-text m-0">Nenhum pacote encontrado</p>
          <p className="text-[11.5px] text-ds-dim m-0 mt-1">
            Registre novas encomendas assim que chegarem na portaria.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {filteredEncomendas.map((enc) => {
            const pendente = enc.status === 'AGUARDANDO_RETIRADA';
            return (
              <div
                key={enc.id}
                className="bg-ds-card border border-ds-border rounded-[14px] p-[14px] flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[13px] font-semibold text-ds-text block truncate">
                      {enc.codigoRastreio}
                    </span>
                    <span className="text-[12px] font-bold text-ds-primary block mt-0.5">
                      {enc.unidade}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[9.5px] font-semibold px-2 py-1 rounded-full uppercase shrink-0 ${
                      pendente
                        ? 'bg-ds-warning-dim text-ds-warning'
                        : 'bg-ds-success-dim text-ds-success'
                    }`}
                  >
                    {pendente ? 'Aguardando' : 'Entregue'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[10px] bg-ds-bg border border-ds-border">
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase tracking-[0.04em] text-ds-faint">
                      Destinatário
                    </span>
                    <span className="block text-[12px] font-bold text-ds-text truncate mt-0.5">
                      {enc.destinatario}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase tracking-[0.04em] text-ds-faint">
                      Transportadora
                    </span>
                    <span className="block text-[12px] font-bold text-ds-text truncate mt-0.5">
                      {enc.transportadora}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-[10.5px] text-ds-dim leading-[1.4]">
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

                  {pendente && (
                    <button
                      type="button"
                      onClick={() => handleRetirar(enc.id)}
                      className="px-3.5 py-2 rounded-[10px] bg-ds-success text-white text-[12px] font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Entregar
                    </button>
                  )}
                </div>
              </div>
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
          }}
        />
      </Modal>
    </div>
  );
}
