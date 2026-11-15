import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Clock,
  AlertCircle,
  Loader2,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

interface ProdutoCondoStore {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidadeEstoque: number;
}

interface ItemPedido {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface PedidoCondoStore {
  id: string;
  status: string;
  dataCriacao: string;
  total: number;
  itens: ItemPedido[];
}

export function MoradorCondoStore() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<'vitrine' | 'pedidos'>('vitrine');
  const [produtos, setProdutos] = useState<ProdutoCondoStore[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCondoStore[]>([]);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [finalizando, setFinalizando] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [sucessoMsg, setSucessoMsg] = useState<string>('');

  const carregarDados = async () => {
    setLoading(true);
    setErro('');
    try {
      const [resProdutos, resPedidos] = await Promise.all([
        api.get('/api/v1/condostore/produtos'),
        api.get('/api/v1/condostore/pedidos/meus')
      ]);
      setProdutos(resProdutos.data || []);
      setPedidos(resPedidos.data || []);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível carregar o catálogo do CondoStore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const alterarQuantidade = (produto: ProdutoCondoStore, delta: number) => {
    setSucessoMsg('');
    setErro('');
    setCarrinho((atual) => {
      const qtdAtual = atual[produto.id] || 0;
      const novaQtd = Math.max(0, Math.min(produto.quantidadeEstoque, qtdAtual + delta));
      const proximo = { ...atual };
      if (novaQtd === 0) {
        delete proximo[produto.id];
      } else {
        proximo[produto.id] = novaQtd;
      }
      return proximo;
    });
  };

  const totalItensCarrinho = Object.values(carrinho).reduce((acc, q) => acc + q, 0);
  const valorTotalCarrinho = Object.entries(carrinho).reduce((acc, [id, qtd]) => {
    const prod = produtos.find((p) => p.id === id);
    return acc + (prod ? Number(prod.preco) * qtd : 0);
  }, 0);

  const handleFinalizarPedido = async () => {
    if (finalizando || totalItensCarrinho === 0) return;
    setFinalizando(true);
    setErro('');
    setSucessoMsg('');

    try {
      await api.post('/api/v1/condostore/pedidos', {
        itens: carrinho
      });
      setCarrinho({});
      setSucessoMsg('Compra registrada com sucesso! Retire seus itens no mercadinho autônomo.');
      await carregarDados();
      setAbaAtiva('pedidos');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível concluir o pedido.');
    } finally {
      setFinalizando(false);
    }
  };

  const formatarMoeda = (valor: number) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const nomeProdutoPorId = (id: string) => {
    const prod = produtos.find((p) => p.id === id);
    return prod ? prod.nome : 'Item da loja';
  };

  return (
    <div className="flex flex-col min-h-full bg-canvas text-ink font-sans pb-28">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center gap-3 border-b border-line bg-canvas/90 sticky top-0 z-10 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:border-brand transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand" />
            <h1 className="text-base font-extrabold text-ink m-0">CondoStore 24h</h1>
          </div>
          <p className="text-[11px] text-dim m-0">Mercadinho autônomo do condomínio</p>
        </div>
      </header>

      {/* Seletor de Abas */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-2 bg-surface border border-line rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setAbaAtiva('vitrine')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              abaAtiva === 'vitrine'
                ? 'bg-brand text-brand-ink shadow-sm'
                : 'text-dim hover:text-ink'
            }`}
          >
            Vitrine ({produtos.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('pedidos')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              abaAtiva === 'pedidos'
                ? 'bg-brand text-brand-ink shadow-sm'
                : 'text-dim hover:text-ink'
            }`}
          >
            Meus Pedidos ({pedidos.length})
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        {erro && (
          <div className="p-3 rounded-xl bg-bad-soft border border-bad/20 text-bad text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {sucessoMsg && (
          <div className="p-3.5 rounded-xl bg-ok-soft border border-ok/25 text-ok text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{sucessoMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-surface border border-line rounded-2xl p-10 flex flex-col items-center justify-center gap-2 text-dim">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
            <span className="text-xs">Sincronizando estoque da loja...</span>
          </div>
        ) : abaAtiva === 'vitrine' ? (
          produtos.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center text-xs text-dim">
              Nenhum produto disponível no momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {produtos.map((produto) => {
                const qtdNoCarrinho = carrinho[produto.id] || 0;
                const esgotado = produto.quantidadeEstoque <= 0;

                return (
                  <div
                    key={produto.id}
                    className={`bg-surface border rounded-2xl p-4 flex items-center justify-between gap-3 transition-all ${
                      qtdNoCarrinho > 0 ? 'border-brand/50' : 'border-line'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-brand shrink-0" />
                        <h3 className="text-sm font-bold text-ink m-0 truncate">{produto.nome}</h3>
                      </div>
                      {produto.descricao && (
                        <p className="text-xs text-dim mt-1 mb-2 leading-relaxed">{produto.descricao}</p>
                      )}
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-black text-brand">
                          {formatarMoeda(produto.preco)}
                        </span>
                        <span
                          className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                            esgotado
                              ? 'bg-bad-soft text-bad'
                              : 'bg-canvas text-dim border border-line'
                          }`}
                        >
                          {esgotado ? 'Sem estoque' : `${produto.quantidadeEstoque} em estoque`}
                        </span>
                      </div>
                    </div>

                    {!esgotado && (
                      <div className="flex items-center gap-2 bg-canvas border border-line rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto, -1)}
                          disabled={qtdNoCarrinho === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink hover:bg-surface disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-extrabold text-ink">
                          {qtdNoCarrinho}
                        </span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto, 1)}
                          disabled={qtdNoCarrinho >= produto.quantidadeEstoque}
                          className="w-7 h-7 rounded-lg bg-brand text-brand-ink flex items-center justify-center hover:brightness-110 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : pedidos.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-xs text-dim">
            Você ainda não realizou compras no CondoStore.
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-surface border border-line rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-ink">
                      Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ok-soft text-ok border border-ok/25">
                    {pedido.status}
                  </span>
                </div>

                <div className="space-y-1 border-t border-b border-line py-2">
                  {pedido.itens.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-dim">
                      <span className="truncate pr-2">
                        {item.quantidade}x {nomeProdutoPorId(item.produtoId)}
                      </span>
                      <span className="font-semibold text-ink shrink-0">
                        {formatarMoeda(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="flex items-center gap-1 text-dim">
                    <Clock className="w-3.5 h-3.5" />
                    {pedido.dataCriacao
                      ? new Date(pedido.dataCriacao).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Agora'}
                  </span>
                  <span className="text-sm font-black text-brand">
                    Total: {formatarMoeda(pedido.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra Flutuante de Checkout */}
      {abaAtiva === 'vitrine' && totalItensCarrinho > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-40">
          <div className="bg-surface border border-brand/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-dim m-0">
                {totalItensCarrinho} {totalItensCarrinho === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
              <p className="text-base font-black text-ink m-0">
                {formatarMoeda(valorTotalCarrinho)}
              </p>
            </div>
            <button
              type="button"
              disabled={finalizando}
              onClick={handleFinalizarPedido}
              className="px-4 py-2.5 rounded-xl bg-brand text-brand-ink text-xs font-extrabold flex items-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-60 cursor-pointer"
            >
              {finalizando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Concluir Compra</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
