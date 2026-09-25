import { useState, useEffect } from 'react';
import { Package, Search, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/UI/Modal';
import { NovaEncomendaForm } from './components/NovaEncomendaForm';
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
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/v1/encomendas');
      setEncomendas(res.data);
    } catch (err) {
      setError('Falha ao carregar encomendas. Verifique a conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const handleRetirar = async (id: string) => {
    if (!window.confirm('Confirmar a entrega deste pacote ao morador?')) return;
    
    try {
      await api.put(`/api/v1/encomendas/${id}/retirar`);
      fetchEncomendas();
    } catch (err) {
      console.error('Erro ao registrar retirada', err);
      alert('Erro ao confirmar entrega. Tente novamente.');
    }
  };

  const getStatusClass = (status: string) => {
    const base = "inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider";
    if (status === 'AGUARDANDO_RETIRADA') return `${base} bg-ds-warning-dim text-ds-warning`;
    if (status === 'RETIRADA' || status === 'ENTREGUE') return `${base} bg-ds-success-dim text-ds-success`;
    return `${base} bg-ds-disabled-bg text-ds-dim`;
  };

  const formatStatus = (status: string) => {
    if (status === 'AGUARDANDO_RETIRADA') return 'Aguardando Retirada';
    if (status === 'RETIRADA') return 'Retirada';
    if (status === 'ENTREGUE') return 'Entregue';
    return status;
  };

  const filteredEncomendas = encomendas.filter(enc => {
    const matchesSearch = 
      enc.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.unidade.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? enc.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Recepção</p>
          <h3 className="text-2xl font-extrabold text-ds-text flex items-center gap-2">
            Gestão de Encomendas
          </h3>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-ds-primary hover:brightness-110 active:scale-[0.98] text-ds-primary-ink rounded-xl transition-all font-bold shadow-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5px]" />
          Registrar Pacote
        </button>
      </div>

      {/* Área de Filtros / Busca */}
      <div className="bg-ds-card p-4 rounded-[16px] border border-ds-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ds-dim" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, destinatário ou unidade..." 
            className="w-full pl-11 pr-4 py-2.5 bg-ds-bg border border-ds-border text-ds-text rounded-xl focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none transition-all placeholder:text-ds-dim text-[14px]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-ds-bg border border-ds-border text-ds-text rounded-xl outline-none focus:ring-2 focus:ring-ds-primary text-[14px]"
        >
          <option value="">Todos os Status</option>
          <option value="AGUARDANDO_RETIRADA">Aguardando Retirada</option>
          <option value="RETIRADA">Retirada</option>
        </select>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-ds-card rounded-[16px] border border-ds-border shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-ds-primary">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-ds-dim font-medium">Carregando pacotes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-4">
            <p className="text-ds-danger font-medium mb-4">{error}</p>
            <button onClick={fetchEncomendas} className="px-5 py-2.5 bg-ds-bg hover:bg-ds-border border border-ds-border text-ds-text rounded-xl transition-colors font-bold">
              Tentar Novamente
            </button>
          </div>
        ) : filteredEncomendas.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="bg-ds-bg w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-ds-border">
              <Package className="w-8 h-8 text-ds-dim" />
            </div>
            <h4 className="text-lg font-bold text-ds-text">Nenhum pacote encontrado</h4>
            <p className="text-ds-dim text-[14px] mt-1 max-w-sm mx-auto">Não há encomendas registradas ou elas não correspondem aos filtros aplicados.</p>
          </div>
        ) : (
          <div className="flex flex-col p-4 bg-ds-card">
            {filteredEncomendas.map((enc) => (
              <div key={enc.id} className="bg-ds-card p-5 rounded-[16px] border border-ds-border flex flex-col gap-3 transition-colors hover:border-ds-border-strong mb-4 last:mb-0">
                
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-ds-text text-[15px]">{enc.codigoRastreio}</h4>
                    <div className="mt-1.5">
                      <span className={getStatusClass(enc.status)}>
                        {formatStatus(enc.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ds-faint">Unidade</p>
                    <p className="font-bold text-ds-primary text-[15px]">{enc.unidade}</p>
                  </div>
                </div>

                {/* Detalhes (Destinatário e Transp) */}
                <div className="grid grid-cols-2 gap-2 bg-ds-bg p-3.5 rounded-xl border border-ds-border">
                  <div>
                    <p className="text-[10px] text-ds-faint uppercase font-bold tracking-wider">Destinatário</p>
                    <p className="text-[13.5px] font-bold text-ds-text mt-0.5">{enc.destinatario}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ds-faint uppercase font-bold tracking-wider">Transportadora</p>
                    <p className="text-[13.5px] font-bold text-ds-text mt-0.5 line-clamp-1">{enc.transportadora}</p>
                  </div>
                </div>

                {/* Datas e Ação */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col text-[12px] font-medium text-ds-dim">
                    <span>Chegada: {enc.dataRecebimento ? new Date(enc.dataRecebimento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                    {enc.status !== 'AGUARDANDO_RETIRADA' && (
                      <span>Retirada: {enc.dataRetirada ? new Date(enc.dataRetirada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                    )}
                  </div>
                  
                  {enc.status === 'AGUARDANDO_RETIRADA' && (
                    <button 
                      onClick={() => handleRetirar(enc.id)}
                      className="bg-ds-success text-ds-bg px-4 py-2 rounded-[9px] text-[13px] font-bold shadow-sm transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Entregar
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Nova Encomenda */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nova Encomenda"
      >
        <div className="p-1">
        <NovaEncomendaForm 
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEncomendas();
          }}
        />
        </div>
      </Modal>
    </div>
  );
}
