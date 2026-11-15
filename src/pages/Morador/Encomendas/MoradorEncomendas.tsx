import { useState, useEffect } from 'react';
import { Package, Box, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import {
  Badge,
  EmptyState,
  FilterChips,
  IconChip,
  ListCard,
  PageHead,
  SearchInput,
  type BadgeTone,
} from '../../../components/ui';

interface Encomenda {
  id: string;
  codigoRastreio: string;
  destinatario: string;
  unidade: string;
  transportadora: string;
  status: string;
  dataRecebimento: string;
  dataRetirada?: string;
}

const STATUS_FILTERS = [
  { id: '', label: 'Todos os Status' },
  { id: 'AGUARDANDO_RETIRADA', label: 'Aguardando Retirada' },
  { id: 'RETIRADA', label: 'Retirada' },
];

export function MoradorEncomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/encomendas/minhas');
      setEncomendas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const getStatusTone = (status: string): BadgeTone => {
    if (status === 'AGUARDANDO_RETIRADA') return 'warn';
    if (status === 'RETIRADA' || status === 'ENTREGUE') return 'ok';
    return 'neutral';
  };

  const formatStatus = (status: string) => {
    if (status === 'AGUARDANDO_RETIRADA') return 'Aguardando Retirada';
    if (status === 'RETIRADA') return 'Retirada';
    if (status === 'ENTREGUE') return 'Entregue';
    return status;
  };

  const filteredEncomendas = encomendas.filter((enc) => {
    const matchesSearch = (enc.codigoRastreio || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? enc.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-full bg-canvas text-ink pb-24">
      <PageHead
        eyebrow="Portaria"
        title="Minhas encomendas"
        subtitle="Acompanhe as suas encomendas na portaria."
      >
        <div className="space-y-3 pb-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por código de rastreio..."
          />
          <FilterChips
            items={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </PageHead>

      <main className="flex-1 px-[18px] space-y-3">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : filteredEncomendas.length === 0 ? (
          <EmptyState
            icon={<Box className="w-6 h-6" />}
            title="Nenhuma encomenda encontrada"
            description="Não há encomendas registradas para os filtros selecionados."
          />
        ) : (
          <div className="space-y-3">
            {filteredEncomendas.map((encomenda) => {
              const isPending = encomenda.status === 'AGUARDANDO_RETIRADA';
              return (
                <ListCard
                  key={encomenda.id}
                  tone={isPending ? 'warn' : 'default'}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconChip tone={isPending ? 'warn' : 'ok'} size="md">
                        <Package className="w-5 h-5" />
                      </IconChip>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-bold text-faint uppercase tracking-[0.04em] m-0">
                          Código de rastreio
                        </p>
                        <p className="font-mono text-[14px] font-extrabold text-ink truncate m-0">
                          {encomenda.codigoRastreio}
                        </p>
                      </div>
                    </div>
                    <Badge tone={getStatusTone(encomenda.status)}>
                      {formatStatus(encomenda.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-line text-[12px]">
                    <div>
                      <p className="text-[10.5px] font-bold text-faint uppercase tracking-[0.04em] m-0">
                        Transportadora
                      </p>
                      <p className="text-ink font-semibold mt-0.5 m-0 truncate">
                        {encomenda.transportadora || 'Portaria'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10.5px] font-bold text-faint uppercase tracking-[0.04em] m-0">
                        Recebimento
                      </p>
                      <p className="font-mono text-dim text-[11.5px] mt-0.5 m-0">
                        {new Date(encomenda.dataRecebimento).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {encomenda.dataRetirada && (
                      <div className="col-span-2">
                        <p className="text-[10.5px] font-bold text-faint uppercase tracking-[0.04em] m-0">
                          Data de retirada
                        </p>
                        <p className="font-mono text-ok font-semibold text-[11.5px] mt-0.5 m-0">
                          {new Date(encomenda.dataRetirada).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </ListCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
