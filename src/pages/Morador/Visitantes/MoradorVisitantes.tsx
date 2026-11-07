import { useState, useEffect } from 'react';
import { UserCheck, UserPlus, ArrowLeft, Clock, Loader2, QrCode, X } from 'lucide-react';
import api from '../../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface Visitante {
  id: string;
  nome: string;
  sobrenome?: string;
  dataVisita: string;
  tipo: string;
  status: string;
}

export function MoradorVisitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState('VISITANTE');
  const [blocoMorador, setBlocoMorador] = useState('A');
  const [aptoMorador, setAptoMorador] = useState('101');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    api.get('/api/v1/perfil/dados')
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
      alert('O nome informado contém caracteres ou comandos bloqueados por segurança.');
      return;
    }

    const nomeLimpo = sanitizarEntrada(nome, 100);
    if (nomeLimpo.length < 2) {
      alert('Informe um nome válido com pelo menos 2 caracteres.');
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
        tipo: tipo
      });

      setIsFormOpen(false);
      setNome('');
      setTipo('VISITANTE');

      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erro ao autorizar visitante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatarDataVisita = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString('pt-BR');
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col h-full bg-ds-bg text-ds-text relative">
        <header className="bg-ds-card p-4 flex items-center gap-3 border-b border-ds-border sticky top-0 z-10 shadow-sm">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="text-ds-dim hover:text-ds-text p-2 -ml-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-ds-text m-0">Liberar Acesso</h2>
            <p className="text-[11px] text-ds-dim m-0">
              Unidade {aptoMorador} {blocoMorador ? `• Bloco ${blocoMorador}` : ''}
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto pb-20">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Roberto Silva"
                className="w-full p-3.5 bg-ds-card border border-ds-border rounded-xl outline-none focus:ring-2 focus:ring-ds-primary text-ds-text"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text">Data da Visita</label>
              <input
                type="date"
                value={dataVisita}
                onChange={(e) => setDataVisita(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3.5 bg-ds-card border border-ds-border rounded-xl outline-none focus:ring-2 focus:ring-ds-primary text-ds-text"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text">Tipo de Acesso</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full p-3.5 bg-ds-card text-ds-text border border-ds-border rounded-xl outline-none focus:ring-2 focus:ring-ds-primary"
                required
              >
                <option value="VISITANTE">Visitante / Convidado</option>
                <option value="PRESTADOR_SERVICO">Prestador de Serviço</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-ds-primary text-ds-primary-ink font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-8 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Autorizar na Portaria'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 pb-24 bg-ds-bg min-h-full text-ds-text">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h3 className="text-2xl font-bold text-ds-text flex items-center gap-2 m-0">
            <UserCheck className="w-6 h-6 text-ds-primary" />
            Visitantes
          </h3>
          <p className="text-ds-dim text-xs mt-1 mb-0">
            Libere o acesso para convidados da Unidade {aptoMorador}.
          </p>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-ds-primary hover:brightness-110 text-ds-primary-ink font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all mb-6 cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          Nova Autorização
        </button>

        <h3 className="text-xs font-bold text-ds-dim mb-4 tracking-wider uppercase">
          Histórico de Autorizações
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-ds-primary" />
          </div>
        ) : visitantes.length === 0 ? (
          <div className="bg-ds-card rounded-2xl p-8 border border-ds-border text-center shadow-sm">
            <div className="w-14 h-14 bg-ds-bg rounded-full flex items-center justify-center mx-auto mb-3 border border-ds-border">
              <UserCheck className="w-7 h-7 text-ds-dim" />
            </div>
            <p className="text-ds-dim text-xs font-medium m-0">Nenhum visitante autorizado recentemente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visitantes.map((vis) => (
              <div
                key={vis.id}
                className="bg-ds-card rounded-2xl p-4 shadow-sm border border-ds-border relative overflow-hidden flex justify-between items-center"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    vis.status === 'AGUARDANDO' || vis.status === 'AGUARDANDO_LIBERACAO'
                      ? 'bg-amber-500'
                      : vis.status === 'NO_CONDOMINIO'
                      ? 'bg-ds-primary'
                      : 'bg-ds-border'
                  }`}
                ></div>
                <div className="pl-3">
                  <h4 className="font-bold text-ds-text text-sm m-0 mb-0.5">
                    {vis.nome} {vis.sobrenome && vis.sobrenome !== 'Convidado' ? vis.sobrenome : ''}
                  </h4>
                  <p className="text-xs text-ds-dim mb-2.5 mt-0 font-medium">
                    {vis.tipo === 'VISITANTE' ? 'Visitante' : 'Prestador de Serviço'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-ds-dim">
                    <span className="bg-ds-bg px-2 py-1 rounded flex items-center gap-1 border border-ds-border">
                      <Clock className="w-3.5 h-3.5" /> {formatarDataVisita(vis.dataVisita)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md border border-ds-border bg-ds-bg text-ds-text uppercase">
                      {vis.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {(vis.status === 'AGUARDANDO' || vis.status === 'AGUARDANDO_LIBERACAO') && (
                  <button
                    type="button"
                    onClick={() => setSelectedQrCode(vis.id)}
                    className="p-3 bg-ds-bg border border-ds-border text-ds-primary hover:border-ds-primary rounded-xl transition cursor-pointer"
                    title="Ver QR Code"
                  >
                    <QrCode className="w-6 h-6" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      {selectedQrCode && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-3xl w-full max-w-sm p-6 relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedQrCode(null)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-ds-bg text-ds-dim rounded-full hover:text-ds-text transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-ds-primary/15 rounded-full flex items-center justify-center text-ds-primary mb-4 mt-2">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-ds-text mb-1 text-center">Código de Acesso</h3>
            <p className="text-xs text-ds-dim text-center mb-6">
              Apresente este QR Code na portaria para liberação rápida.
            </p>

            <div className="bg-white p-4 border border-ds-border rounded-2xl shadow-sm mb-6">
              <QRCodeSVG value={selectedQrCode} size={200} />
            </div>

            <button
              type="button"
              onClick={() => setSelectedQrCode(null)}
              className="w-full font-bold py-3 text-ds-text bg-ds-bg border border-ds-border rounded-xl hover:border-ds-primary cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
