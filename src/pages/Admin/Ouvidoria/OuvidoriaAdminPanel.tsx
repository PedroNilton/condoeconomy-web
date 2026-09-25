import { useState, useEffect } from 'react';
import { MessageSquareWarning, Loader2, RefreshCcw } from 'lucide-react';
import api from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface Chamado {
  id: string;
  unidadeTexto: string;
  moradorSolicitante: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: string;
  dataAbertura: string;
  escaladoSindico: boolean;
}

export function OuvidoriaAdminPanel() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  useWebSocket('/topic/chamados', () => {
    fetchChamados();
  });

  const fetchChamados = async () => {
    try {
      const res = await api.get('/api/v1/chamados');
      const escalados = res.data.filter((c: Chamado) => c.escaladoSindico);
      setChamados(escalados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamados();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ds-bg">
        <Loader2 className="w-8 h-8 text-ds-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-ds-dim text-xs font-bold uppercase tracking-wider mb-1">Ouvidoria</p>
          <h2 className="text-ds-text text-2xl font-extrabold tracking-tight flex items-center gap-2">
            Escalonados
          </h2>
        </div>
        <button onClick={fetchChamados} className="flex items-center gap-2 text-xs font-bold text-ds-dim bg-ds-bg border border-ds-border px-3 py-2 rounded-xl hover:bg-ds-card transition-all shadow-sm">
           <RefreshCcw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {chamados.length === 0 ? (
        <div className="bg-ds-card p-8 rounded-[16px] text-center shadow-sm border border-ds-border">
          <div className="w-16 h-16 bg-ds-bg border border-ds-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquareWarning className="w-8 h-8 text-ds-dim" />
          </div>
          <p className="text-ds-text font-bold mb-1">Tudo tranquilo!</p>
          <p className="text-ds-dim text-sm">Nenhum chamado escalado para a administração no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chamados.map(chamado => (
            <div key={chamado.id} className="bg-ds-card p-5 rounded-[16px] shadow-sm border border-ds-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-ds-danger"></div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-[9px] py-[4px] rounded-full uppercase tracking-wider bg-ds-danger-dim text-ds-danger mb-2">
                    ESCALADO
                  </span>
                  <h3 className="font-bold text-ds-text text-[15px]">{chamado.assunto}</h3>
                  <p className="text-[12.5px] text-ds-dim font-semibold mt-0.5">{chamado.categoria} — {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="text-[13.5px] text-ds-text leading-relaxed mb-5 bg-ds-danger-dim border border-ds-danger/20 p-4 rounded-xl">
                <p>{chamado.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[13px] bg-ds-bg p-3 rounded-xl border border-ds-border">
                <div>
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-0.5">Morador</p>
                  <p className="font-bold text-ds-text">{chamado.moradorSolicitante}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ds-faint font-bold uppercase tracking-wider mb-0.5">Unidade</p>
                  <p className="font-bold text-ds-text">{chamado.unidadeTexto}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
