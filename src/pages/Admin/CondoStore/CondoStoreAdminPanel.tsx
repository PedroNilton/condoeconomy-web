import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Package,
  Receipt,
  AlertTriangle,
  Pencil,
  X,
  Loader2,
  Clock
} from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';

interface ProdutoAdmin {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidadeEstoque: number;
}

interface PedidoAdmin {
  id: string;
  moradorNome: string;
  unidade: string;
  status: string;
  dataCriacao: string;
  total: number;
  quantidadeItens: number;
}

interface MetricasCondoStore {
  totalProdutos: number;
  itensSemEstoque: number;
  totalPedidos: number;
  receitaTotal: number;
}

export function CondoStoreAdminPanel() {
  const [aba, setAba] = useState<'estoque' | 'pedidos'>('estoque');
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [metricas, setMetricas] = useState<MetricasCondoStore>({
    totalProdutos: 0,
    itensSemEstoque: 0,
    totalPedidos: 0,
    receitaTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Modal de Produto (Criar ou Editar/Repor Estoque)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('10');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregarResumo = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await api.get('/api/v1/admin/condostore/resumo');
      setProdutos(res.data?.produtos || []);
      setPedidos(res.data?.pedidos || []);
      if (res.data?.metricas) {
        setMetricas(res.data.metricas);
      }
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível carregar os dados do CondoStore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarResumo();
  }, []);

  const abrirNovoProduto = () => {
    setEditandoId(null);
    setNome('');
    setDescricao('');
    setPreco('');
    setEstoque('15');
    setErroForm('');
    setIsModalOpen(true);
  };

  const abrirEdicaoProduto = (p: ProdutoAdmin) => {
    setEditandoId(p.id);
    setNome(p.nome);
    setDescricao(p.descricao || '');
    setPreco(String(p.preco));
    setEstoque(String(p.quantidadeEstoque));
    setErroForm('');
    setIsModalOpen(true);
  };

  const handleReporRapido = async (p: ProdutoAdmin, incremento: number) => {
    try {
      await api.put(`/api/v1/admin/condostore/produtos/${p.id}`, {
        nome: p.nome,
        descricao: p.descricao || '',
        preco: p.preco,
        quantidadeEstoque: Math.max(0, p.quantidadeEstoque + incremento)
      });
      await carregarResumo();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Falha ao atualizar estoque.');
    }
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setErroForm('');

    if (contemAmeacas(nome) || contemAmeacas(descricao)) {
      setErroForm('Caracteres proibidos detectados.');
      return;
    }

    const nomeLimpo = sanitizarEntrada(nome, 150).trim();
    const descLimpa = sanitizarEntrada(descricao, 400).trim();
    const precoNum = Number(preco.replace(',', '.'));
    const estoqueNum = parseInt(estoque, 10);

    if (!nomeLimpo) {
      setErroForm('Informe o nome do produto.');
      return;
    }
    if (isNaN(precoNum) || precoNum <= 0) {
      setErroForm('Informe um preço válido maior que zero.');
      return;
    }
    if (isNaN(estoqueNum) || estoqueNum < 0) {
      setErroForm('O estoque não pode ser negativo.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nomeLimpo,
        descricao: descLimpa,
        preco: precoNum,
        quantidadeEstoque: estoqueNum
      };
      if (editandoId) {
        await api.put(`/api/v1/admin/condostore/produtos/${editandoId}`, payload);
      } else {
        await api.post('/api/v1/admin/condostore/produtos', payload);
      }
      setIsModalOpen(false);
      await carregarResumo();
    } catch (err: any) {
      setErroForm(err.response?.data?.message || 'Erro ao salvar produto.');
    } finally {
      setSalvando(false);
    }
  };

  const formatarMoeda = (valor: number) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4 py-2">
      {/* Header */}
      <div className="bg-ds-card border border-ds-border rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-ds-primary/10 text-ds-primary flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-ds-text m-0 truncate">Gestão CondoStore</h1>
            <p className="text-xs text-ds-dim m-0 truncate">Estoque do mercadinho e histórico de vendas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={abrirNovoProduto}
          className="px-3 py-2 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Produto</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-center">
          <p className="text-[10.5px] font-semibold text-ds-dim m-0">Vendas</p>
          <p className="text-sm font-extrabold text-emerald-500 m-0 mt-1">
            {formatarMoeda(metricas.receitaTotal)}
          </p>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-center">
          <p className="text-[10.5px] font-semibold text-ds-dim m-0">Pedidos</p>
          <p className="text-base font-extrabold text-ds-text m-0 mt-0.5">{metricas.totalPedidos}</p>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-center">
          <p className="text-[10.5px] font-semibold text-ds-dim m-0">Sem Estoque</p>
          <p className={`text-base font-extrabold m-0 mt-0.5 ${metricas.itensSemEstoque > 0 ? 'text-ds-danger' : 'text-ds-text'}`}>
            {metricas.itensSemEstoque}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="grid grid-cols-2 bg-ds-card border border-ds-border rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setAba('estoque')}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            aba === 'estoque'
              ? 'bg-ds-primary text-ds-primary-ink'
              : 'text-ds-dim hover:text-ds-text'
          }`}
        >
          Catálogo & Estoque ({produtos.length})
        </button>
        <button
          type="button"
          onClick={() => setAba('pedidos')}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            aba === 'pedidos'
              ? 'bg-ds-primary text-ds-primary-ink'
              : 'text-ds-dim hover:text-ds-text'
          }`}
        >
          Pedidos ({pedidos.length})
        </button>
      </div>

      {erro && (
        <div className="p-3 rounded-xl bg-ds-danger-dim border border-ds-danger/20 text-ds-danger text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-ds-card border border-ds-border rounded-2xl p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-ds-primary" />
        </div>
      ) : aba === 'estoque' ? (
        <div className="space-y-2.5">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="bg-ds-card border border-ds-border rounded-2xl p-3.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-ds-primary shrink-0" />
                  <span className="text-sm font-bold text-ds-text truncate">{p.nome}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-xs font-extrabold text-ds-primary">{formatarMoeda(p.preco)}</span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      p.quantidadeEstoque <= 0
                        ? 'bg-ds-danger-dim text-ds-danger'
                        : p.quantidadeEstoque <= 5
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-ds-bg text-ds-dim border border-ds-border'
                    }`}
                  >
                    Estoque: {p.quantidadeEstoque}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReporRapido(p, 5)}
                  title="Repor +5 unidades"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-[11px] font-bold hover:bg-emerald-500/20 cursor-pointer"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => abrirEdicaoProduto(p)}
                  title="Editar produto"
                  className="w-8 h-8 rounded-xl bg-ds-bg border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-text cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-ds-card border border-ds-border rounded-2xl p-8 text-center text-xs text-ds-dim">
          Nenhum pedido registrado até o momento.
        </div>
      ) : (
        <div className="space-y-2.5">
          {pedidos.map((ped) => (
            <div key={ped.id} className="bg-ds-card border border-ds-border rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Receipt className="w-4 h-4 text-ds-primary shrink-0" />
                  <span className="text-xs font-bold text-ds-text truncate">{ped.moradorNome}</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-500">{formatarMoeda(ped.total)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ds-dim">
                <span>
                  {ped.unidade} • {ped.quantidadeItens} {ped.quantidadeItens === 1 ? 'item' : 'itens'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ped.dataCriacao
                    ? new Date(ped.dataCriacao).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-ds-dim hover:text-ds-text p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-extrabold text-ds-text m-0 mb-1">
              {editandoId ? 'Editar Produto / Estoque' : 'Novo Produto CondoStore'}
            </h2>
            <p className="text-xs text-ds-dim m-0 mb-4">
              Disponibilizado em tempo real na vitrine do app do morador.
            </p>

            {erroForm && (
              <div className="p-2.5 rounded-xl bg-ds-danger-dim text-ds-danger text-xs mb-3">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarProduto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Nome do Produto</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Água de Coco 330ml"
                  maxLength={150}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Refrigerador 2 — Bebidas"
                  maxLength={400}
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-ds-text">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="7.90"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text outline-none focus:ring-2 focus:ring-ds-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-ds-text">Quantidade em Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text outline-none focus:ring-2 focus:ring-ds-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-ds-border text-xs font-bold text-ds-dim hover:text-ds-text cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 disabled:opacity-60 cursor-pointer"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
