import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Building2,
  Mail,
  Phone,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas, EMAIL_SECURITY_REGEX } from '../../../utils/security';

interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  papel: string;
  telefone: string | null;
  apartamento: string | null;
  bloco: string | null;
  ativo: boolean;
}

interface ResumoUsuarios {
  total: number;
  ativos: number;
  bloqueados: number;
  moradores: number;
  portaria: number;
}

export function MoradoresAdminPanel() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [resumo, setResumo] = useState<ResumoUsuarios>({
    total: 0,
    ativos: 0,
    bloqueados: 0,
    moradores: 0,
    portaria: 0
  });
  const [filtroPapel, setFiltroPapel] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [erroLista, setErroLista] = useState<string>('');
  const [acaoId, setAcaoId] = useState<string | null>(null);

  // Modal de novo cadastro
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoPapel, setNovoPapel] = useState<'ROLE_MORADOR' | 'ROLE_PORTEIRO'>('ROLE_MORADOR');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoApartamento, setNovoApartamento] = useState('');
  const [novoBloco, setNovoBloco] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregarUsuarios = async (papel = filtroPapel, termo = busca) => {
    setLoading(true);
    setErroLista('');
    try {
      const params: Record<string, string> = {};
      if (papel) params.papel = papel;
      if (termo.trim()) params.busca = sanitizarEntrada(termo.trim());
      const res = await api.get('/api/v1/admin/usuarios', { params });
      setUsuarios(res.data?.usuarios || []);
      if (res.data?.resumo) {
        setResumo(res.data.resumo);
      }
    } catch (err: any) {
      setErroLista(err.response?.data?.message || 'Não foi possível carregar os cadastros do condomínio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios(filtroPapel, busca);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroPapel]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (contemAmeacas(busca)) {
      setErroLista('Termo de busca contém caracteres não permitidos.');
      return;
    }
    carregarUsuarios(filtroPapel, busca);
  };

  const handleAlternarStatus = async (usuario: UsuarioAdmin) => {
    if (acaoId) return;
    setAcaoId(usuario.id);
    setErroLista('');
    try {
      await api.patch(`/api/v1/admin/usuarios/${usuario.id}/status`, {
        ativo: !usuario.ativo
      });
      await carregarUsuarios(filtroPapel, busca);
    } catch (err: any) {
      setErroLista(err.response?.data?.message || 'Erro ao alterar o status da conta.');
    } finally {
      setAcaoId(null);
    }
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setErroForm('');

    const nomeLimpo = sanitizarEntrada(novoNome).trim();
    const emailLimpo = sanitizarEntrada(novoEmail).trim().toLowerCase();
    const telefoneLimpo = sanitizarEntrada(novoTelefone).trim();
    const aptoLimpo = sanitizarEntrada(novoApartamento).trim();
    const blocoLimpo = sanitizarEntrada(novoBloco).trim();

    if (
      contemAmeacas(novoNome) ||
      contemAmeacas(novoEmail) ||
      contemAmeacas(novaSenha) ||
      contemAmeacas(novoTelefone) ||
      contemAmeacas(novoApartamento) ||
      contemAmeacas(novoBloco)
    ) {
      setErroForm('Caracteres ou comandos proibidos detectados no formulário.');
      return;
    }

    if (!nomeLimpo || nomeLimpo.length < 3) {
      setErroForm('Informe o nome completo (mínimo 3 caracteres).');
      return;
    }

    if (!EMAIL_SECURITY_REGEX.test(emailLimpo)) {
      setErroForm('Informe um e-mail válido.');
      return;
    }

    if (!novaSenha || novaSenha.length < 8) {
      setErroForm('A senha provisória deve ter pelo menos 8 caracteres.');
      return;
    }

    if (novoPapel === 'ROLE_MORADOR' && !aptoLimpo) {
      setErroForm('Informe a unidade/apartamento do morador.');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/api/v1/admin/usuarios', {
        nome: nomeLimpo,
        email: emailLimpo,
        senhaInicial: novaSenha,
        papel: novoPapel,
        telefone: telefoneLimpo || null,
        apartamento: aptoLimpo || null,
        bloco: blocoLimpo || null
      });
      setIsModalOpen(false);
      setNovoNome('');
      setNovoEmail('');
      setNovaSenha('');
      setNovoTelefone('');
      setNovoApartamento('');
      setNovoBloco('');
      await carregarUsuarios(filtroPapel, busca);
    } catch (err: any) {
      setErroForm(err.response?.data?.message || 'Não foi possível concluir o cadastro.');
    } finally {
      setSalvando(false);
    }
  };

  const formatarPapel = (papel: string) => {
    switch (papel) {
      case 'ROLE_MORADOR':
        return { label: 'Morador', cor: 'bg-ds-primary/15 text-ds-primary border-ds-primary/25' };
      case 'ROLE_PORTEIRO':
        return { label: 'Portaria', cor: 'bg-amber-500/15 text-amber-500 border-amber-500/25' };
      case 'ROLE_SINDICO':
        return { label: 'Síndico', cor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' };
      default:
        return { label: papel.replace('ROLE_', ''), cor: 'bg-ds-bg text-ds-dim border-ds-border' };
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* Cabeçalho */}
      <div className="bg-ds-card border border-ds-border rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-ds-primary/10 text-ds-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-ds-text m-0 truncate">Moradores & Equipe</h1>
            <p className="text-xs text-ds-dim m-0 truncate">Cadastros e revogação instantânea de acesso</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setErroForm('');
            setIsModalOpen(true);
          }}
          className="px-3 py-2 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-ds-dim m-0">Ativos</p>
          <p className="text-lg font-extrabold text-emerald-500 m-0 mt-0.5">{resumo.ativos}</p>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-ds-dim m-0">Moradores</p>
          <p className="text-lg font-extrabold text-ds-text m-0 mt-0.5">{resumo.moradores}</p>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-ds-dim m-0">Portaria</p>
          <p className="text-lg font-extrabold text-amber-500 m-0 mt-0.5">{resumo.portaria}</p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <form onSubmit={handleBuscar} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ds-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, e-mail ou apto..."
            maxLength={80}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-ds-card border border-ds-border text-xs text-ds-text placeholder:text-ds-dim focus:outline-none focus:ring-2 focus:ring-ds-primary"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-ds-card border border-ds-border text-xs font-bold text-ds-text hover:border-ds-primary transition-colors cursor-pointer"
        >
          Filtrar
        </button>
      </form>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {[
          { valor: '', rotulo: `Todos (${resumo.total})` },
          { valor: 'ROLE_MORADOR', rotulo: 'Moradores' },
          { valor: 'ROLE_PORTEIRO', rotulo: 'Portaria' },
          { valor: 'ROLE_SINDICO', rotulo: 'Administração' }
        ].map((chip) => (
          <button
            key={chip.valor || 'ALL'}
            type="button"
            onClick={() => setFiltroPapel(chip.valor)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
              filtroPapel === chip.valor
                ? 'bg-ds-primary text-ds-primary-ink border-ds-primary'
                : 'bg-ds-card text-ds-dim border-ds-border hover:text-ds-text'
            }`}
          >
            {chip.rotulo}
          </button>
        ))}
      </div>

      {erroLista && (
        <div className="p-3 rounded-xl bg-ds-danger-dim border border-ds-danger/20 text-ds-danger text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{erroLista}</span>
        </div>
      )}

      {/* Lista de Usuários */}
      {loading ? (
        <div className="bg-ds-card border border-ds-border rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-ds-dim">
          <Loader2 className="w-6 h-6 animate-spin text-ds-primary" />
          <span className="text-xs font-medium">Carregando cadastros...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-ds-card border border-ds-border rounded-2xl p-8 text-center text-xs text-ds-dim">
          Nenhum usuário encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-2.5">
          {usuarios.map((u) => {
            const badge = formatarPapel(u.papel);
            return (
              <div
                key={u.id}
                className={`bg-ds-card border rounded-2xl p-3.5 transition-all ${
                  u.ativo ? 'border-ds-border' : 'border-ds-danger/30 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-ds-text truncate">{u.nome}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cor}`}>
                        {badge.label}
                      </span>
                      {!u.ativo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ds-danger-dim text-ds-danger border border-ds-danger/25">
                          Bloqueado
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1 text-[11.5px] text-ds-dim">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      {(u.apartamento || u.bloco) && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {u.bloco ? `Bloco ${u.bloco} • ` : ''}
                            {u.apartamento ? `Unidade ${u.apartamento}` : ''}
                          </span>
                        </div>
                      )}
                      {u.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{u.telefone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {u.papel !== 'ROLE_SINDICO' && u.papel !== 'ROLE_ADMIN' && u.papel !== 'ROLE_SUPER_ADMIN' && (
                    <button
                      type="button"
                      disabled={acaoId === u.id}
                      onClick={() => handleAlternarStatus(u)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 shrink-0 transition-all cursor-pointer disabled:opacity-50 ${
                        u.ativo
                          ? 'bg-ds-bg text-ds-danger border-ds-danger/30 hover:bg-ds-danger-dim'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {acaoId === u.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : u.ativo ? (
                        <>
                          <Ban className="w-3.5 h-3.5" />
                          <span>Bloquear</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cadastrar Morador / Porteiro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-ds-dim hover:text-ds-text p-1 rounded-lg cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-extrabold text-ds-text m-0 mb-1">Novo Cadastro no Condomínio</h2>
            <p className="text-xs text-ds-dim m-0 mb-4">
              Cadastre moradores ou colaboradores da portaria com acesso imediato.
            </p>

            {erroForm && (
              <div className="p-3 rounded-xl bg-ds-danger-dim border border-ds-danger/20 text-ds-danger text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            <form onSubmit={handleCadastrar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Perfil de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoPapel('ROLE_MORADOR')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      novoPapel === 'ROLE_MORADOR'
                        ? 'bg-ds-primary text-ds-primary-ink border-ds-primary'
                        : 'bg-ds-bg text-ds-dim border-ds-border'
                    }`}
                  >
                    Morador
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoPapel('ROLE_PORTEIRO')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      novoPapel === 'ROLE_PORTEIRO'
                        ? 'bg-ds-primary text-ds-primary-ink border-ds-primary'
                        : 'bg-ds-bg text-ds-dim border-ds-border'
                    }`}
                  >
                    Portaria
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Nome Completo</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Mariana Costa"
                  maxLength={120}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">E-mail de Acesso</label>
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="morador@email.com"
                  maxLength={255}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Senha Provisória (mín. 8 caracteres)</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={128}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              {novoPapel === 'ROLE_MORADOR' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ds-text">Apartamento / Unidade</label>
                    <input
                      type="text"
                      value={novoApartamento}
                      onChange={(e) => setNovoApartamento(e.target.value)}
                      placeholder="Ex: 302"
                      maxLength={20}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ds-text">Bloco / Torre</label>
                    <input
                      type="text"
                      value={novoBloco}
                      onChange={(e) => setNovoBloco(e.target.value)}
                      placeholder="Ex: A"
                      maxLength={20}
                      className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Telefone / WhatsApp (opcional)</label>
                <input
                  type="tel"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={30}
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
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
                  {salvando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    'Cadastrar Conta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
