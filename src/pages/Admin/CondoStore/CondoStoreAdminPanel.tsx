import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Package,
  Receipt,
  AlertTriangle,
  Pencil,
  X,
  Loader2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import { InlineConfirm, PageHead } from '../../../components/ui';

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
  const navigate = useNavigate();
  const [aba, setAba] = useState<'estoque' | 'pedidos'>('estoque');
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [metricas, setMetricas] = useState<MetricasCondoStore>({
    totalProdutos: 0,
    itensSemEstoque: 0,
    totalPedidos: 0,
    receitaTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [confirmZerarId, setConfirmZerarId] = useState<string | null>(null);

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
        quantidadeEstoque: Math.max(0, p.quantidadeEstoque + incremento),
      });
      await carregarResumo();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Falha ao atualizar estoque.');
    }
  };

  const handleConfirmarZerarEstoque = async (p: ProdutoAdmin) => {
    try {
      await api.put(`/api/v1/admin/condostore/produtos/${p.id}`, {
        nome: p.nome,
        descricao: p.descricao || '',
        preco: p.preco,
        quantidadeEstoque: 0,
      });
      setConfirmZerarId(null);
      await carregarResumo();
    } catch (err: any) {
      setConfirmZerarId(null);
      setErro(err.response?.data?.message || 'Falha ao zerar estoque.');
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
        quantidadeEstoque: estoqueNum,
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
      <div className="-mx-[18px] -mt-[10px]">
        <PageHead
          eyebrow="Administração"
          title="Gestão CondoStore"
          subtitle="Estoque do mercadinho e histórico de vendas"
          onBack={() => navigate('/admin')}
          action={
            <button
              type="button"
              onClick={abrirNovoProduto}
              className="px-3 py-2 rounded-xl bg-brand text-brand-ink text-xs font-bold flex items-center gap-1.5 hover:bg-brand-hover transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Produto</span>
            </button>
          }
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-surface border border-line rounded-xl p-3 text-center">
          <p className="text-[10.5px] font-semibold text-dim m-0">Vendas</p>
          <p className="font-mono text-sm font-extrabold text-ok m-0 mt-1">
            {formatarMoeda(metricas.receitaTotal)}
          </p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3 text-center">
          <p className="text-[10.5px] font-semibold text-dim m-0">Pedidos</p>
          <p className="font-mono text-base font-extrabold text-ink m-0 mt-0.5">
            {metricas.totalPedidos}
          </p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3 text-center">
          <p className="text-[10.5px] font-semibold text-dim m-0">Sem Estoque</p>
          <p
            className={`font-mono text-base font-extrabold m-0 mt-0.5 ${
              metricas.itensSemEstoque > 0 ? 'text-bad' : 'text-ink'
            }`}
          >
            {metricas.itensSemEstoque}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="grid grid-cols-2 bg-surface border border-line rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setAba('estoque')}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            aba === 'estoque'
              ? 'bg-brand text-brand-ink'
              : 'text-dim hover:text-ink'
          }`}
        >
          Catálogo & Estoque ({produtos.length})
        </button>
        <button
          type="button"
          onClick={() => setAba('pedidos')}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            aba === 'pedidos'
              ? 'bg-brand text-brand-ink'
              : 'text-dim hover:text-ink'
          }`}
        >
          Pedidos ({pedidos.length})
        </button>
      </div>

      {erro && (
        <div className="p-3 rounded-xl bg-bad-soft border border-bad/20 text-bad text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-line rounded-2xl p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : aba === 'estoque' ? (
        <div className="space-y-2.5">
          {produtos.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center text-xs text-dim">
              <ShoppingBag className="w-7 h-7 text-faint mx-auto mb-2" />
              Nenhum produto cadastrado no catálogo.
            </div>
          ) : (
            produtos.map((p) => (
              <div
                key={p.id}
                className="bg-surface border border-line rounded-2xl p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm font-bold text-ink truncate">{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="font-mono text-xs font-extrabold text-brand">
                        {formatarMoeda(p.preco)}
                      </span>
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                          p.quantidadeEstoque <= 0
                            ? 'bg-bad-soft text-bad'
                            : p.quantidadeEstoque <= 5
                            ? 'bg-warn-soft text-warn'
                            : 'bg-canvas text-dim border border-line'
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
                      className="px-2.5 py-1.5 rounded-xl bg-ok-soft text-ok border border-ok/25 text-[11px] font-bold hover:opacity-90 cursor-pointer"
                    >
                      +5
                    </button>
                    {p.quantidadeEstoque > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmZerarId(confirmZerarId === p.id ? null : p.id)
                        }
                        title="Zerar estoque"
                        className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-dim hover:text-bad cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirEdicaoProduto(p)}
                      title="Editar produto"
                      className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-dim hover:text-ink cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {confirmZerarId === p.id && (
                  <InlineConfirm
                    label="Zerar estoque deste produto?"
                    confirmLabel="Zerar"
                    onCancel={() => setConfirmZerarId(null)}
                    onConfirm={() => handleConfirmarZerarEstoque(p)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-xs text-dim">
          Nenhum pedido registrado até o momento.
        </div>
      ) : (
        <div className="space-y-2.5">
          {pedidos.map((ped) => (
            <div
              key={ped.id}
              className="bg-surface border border-line rounded-2xl p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Receipt className="w-4 h-4 text-brand shrink-0" />
                  <span className="text-xs font-bold text-ink truncate">{ped.moradorNome}</span>
                </div>
                <span className="font-mono text-xs font-extrabold text-ok">
                  {formatarMoeda(ped.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-dim">
                <span>
                  {ped.unidade} • {ped.quantidadeItens}{' '}
                  {ped.quantidadeItens === 1 ? 'item' : 'itens'}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {ped.dataCriacao
                    ? new Date(ped.dataCriacao).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
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
          <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-dim hover:text-ink p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-extrabold text-ink m-0 mb-1">
              {editandoId ? 'Editar Produto / Estoque' : 'Novo Produto CondoStore'}
            </h2>
            <p className="text-xs text-dim m-0 mb-4">
              Disponibilizado em tempo real na vitrine do app do morador.
            </p>

            {erroForm && (
              <div className="p-2.5 rounded-xl bg-bad-soft text-bad text-xs mb-3">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarProduto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-ink">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Água de Coco 330ml"
                  maxLength={150}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ink">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Refrigerador 2 — Bebidas"
                  maxLength={400}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-ink">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="7.90"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-ink">
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-line text-xs font-bold text-dim hover:text-ink cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-ink text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-brand-hover disabled:opacity-60 cursor-pointer"
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

