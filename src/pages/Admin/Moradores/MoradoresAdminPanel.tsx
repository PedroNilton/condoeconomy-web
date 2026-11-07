import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Ban,
  Building2,
  Mail,
  Phone,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck
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

interface CondominioItem {
  id: string;
  nome: string;
  cnpj: string;
  tenantId: string;
  dataCriacao: string;
  ativo: boolean;
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

  // Multi-tenancy (ROLE_SUPER_ADMIN)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [abaPrincipal, setAbaPrincipal] = useState<'usuarios' | 'condominios'>('usuarios');
  const [condominios, setCondominios] = useState<CondominioItem[]>([]);
  const [loadingCondos, setLoadingCondos] = useState(false);
  const [isCondoModalOpen, setIsCondoModalOpen] = useState(false);
  const [condoNome, setCondoNome] = useState('');
  const [condoCnpj, setCondoCnpj] = useState('');
  const [condoTenantId, setCondoTenantId] = useState('');
  const [salvandoCondo, setSalvandoCondo] = useState(false);
  const [erroCondoForm, setErroCondoForm] = useState('');

  // Modal de novo cadastro de usuário
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

  // Modal de Importação CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [arquivoCsv, setArquivoCsv] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState<{
    totalProcessados: number;
    sucessoCount: number;
    falhaCount: number;
    importados: Array<{ id: string; nome: string; email: string; apartamento: string; bloco: string | null; telefone: string | null }>;
    erros: Array<{ linha: number; email: string; motivo: string }>;
  } | null>(null);
  const [erroImportacao, setErroImportacao] = useState('');

  const handleBaixarModeloCsv = async () => {
    try {
      const res = await api.get('/api/v1/admin/usuarios/modelo-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modelo_importacao_moradores.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Não foi possível baixar o modelo CSV.');
    }
  };

  const handleImportarCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoCsv) {
      setErroImportacao('Selecione um arquivo CSV para continuar.');
      return;
    }
    setErroImportacao('');
    setImportando(true);
    setResultadoImportacao(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoCsv);

      const res = await api.post('/api/v1/admin/usuarios/importar-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResultadoImportacao(res.data);
      carregarUsuarios();
    } catch (err: any) {
      setErroImportacao(err.response?.data?.message || 'Falha ao processar arquivo CSV.');
    } finally {
      setImportando(false);
    }
  };

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('@HabitOS:user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.papel === 'ROLE_SUPER_ADMIN') {
          setIsSuperAdmin(true);
        }
      }
    } catch {
      // Ignora erro de parse
    }
  }, []);

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

  const carregarCondominios = async () => {
    setLoadingCondos(true);
    try {
      const res = await api.get('/api/v1/condominios');
      setCondominios(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setErroLista(err.response?.data?.message || 'Não foi possível carregar os condomínios cadastrados.');
    } finally {
      setLoadingCondos(false);
    }
  };

  useEffect(() => {
    if (abaPrincipal === 'usuarios') {
      carregarUsuarios();
    } else {
      carregarCondominios();
    }
  }, [abaPrincipal]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarUsuarios(filtroPapel, busca);
  };

  const handleAlternarStatus = async (usuario: UsuarioAdmin) => {
    setAcaoId(usuario.id);
    try {
      await api.put(`/api/v1/admin/usuarios/${usuario.id}/status`, {
        ativo: !usuario.ativo
      });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, ativo: !u.ativo } : u))
      );
      setResumo((prev) => ({
        ...prev,
        ativos: usuario.ativo ? prev.ativos - 1 : prev.ativos + 1,
        bloqueados: usuario.ativo ? prev.bloqueados + 1 : prev.bloqueados - 1
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao atualizar o status do usuário.');
    } finally {
      setAcaoId(null);
    }
  };

  const handleCadastrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');

    const nomeLimpo = sanitizarEntrada(novoNome.trim());
    const emailLimpo = novoEmail.trim().toLowerCase();
    const telefoneLimpo = sanitizarEntrada(novoTelefone.trim());
    const aptoLimpo = sanitizarEntrada(novoApartamento.trim());
    const blocoLimpo = sanitizarEntrada(novoBloco.trim());

    if (!nomeLimpo || nomeLimpo.length < 3) {
      setErroForm('Informe o nome completo do morador ou funcionário.');
      return;
    }

    if (!EMAIL_SECURITY_REGEX.test(emailLimpo)) {
      setErroForm('Informe um e-mail válido.');
      return;
    }

    if (!novaSenha || novaSenha.length < 6) {
      setErroForm('A senha inicial deve conter pelo menos 6 caracteres.');
      return;
    }

    if (
      contemAmeacas(nomeLimpo) ||
      contemAmeacas(emailLimpo) ||
      contemAmeacas(telefoneLimpo) ||
      contemAmeacas(aptoLimpo) ||
      contemAmeacas(blocoLimpo)
    ) {
      setErroForm('Conteúdo suspeito detectado nos campos.');
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

  const handleCadastrarCondominio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCondoForm('');

    const nomeLimpo = sanitizarEntrada(condoNome.trim());
    const cnpjLimpo = sanitizarEntrada(condoCnpj.trim());
    const tenantLimpo = condoTenantId.trim();

    if (!nomeLimpo || nomeLimpo.length < 3) {
      setErroCondoForm('Informe o nome completo do condomínio.');
      return;
    }

    if (!cnpjLimpo || cnpjLimpo.length < 14) {
      setErroCondoForm('Informe um CNPJ válido com ao menos 14 dígitos.');
      return;
    }

    if (!tenantLimpo || !/^[a-zA-Z0-9_]{1,63}$/.test(tenantLimpo)) {
      setErroCondoForm('Tenant ID deve conter apenas letras, números e underlines (máx 63 caracteres).');
      return;
    }

    setSalvandoCondo(true);
    try {
      await api.post('/api/v1/condominios', {
        nome: nomeLimpo,
        cnpj: cnpjLimpo,
        tenantId: tenantLimpo
      });
      setIsCondoModalOpen(false);
      setCondoNome('');
      setCondoCnpj('');
      setCondoTenantId('');
      await carregarCondominios();
    } catch (err: any) {
      setErroCondoForm(err.response?.data?.message || 'Falha ao provisionar condomínio.');
    } finally {
      setSalvandoCondo(false);
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
      {/* Abas para Super Admin */}
      {isSuperAdmin && (
        <div className="flex bg-ds-card p-1 rounded-2xl border border-ds-border">
          <button
            type="button"
            onClick={() => setAbaPrincipal('usuarios')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              abaPrincipal === 'usuarios'
                ? 'bg-ds-primary text-ds-primary-ink shadow-sm'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            Moradores & Equipe
          </button>
          <button
            type="button"
            onClick={() => setAbaPrincipal('condominios')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              abaPrincipal === 'condominios'
                ? 'bg-ds-primary text-ds-primary-ink shadow-sm'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            Condomínios (Tenants)
          </button>
        </div>
      )}

      {abaPrincipal === 'usuarios' ? (
        <>
          {/* Cabeçalho Usuários */}
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setArquivoCsv(null);
                  setResultadoImportacao(null);
                  setErroImportacao('');
                  setIsImportModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-ds-text text-xs font-bold flex items-center gap-1.5 hover:bg-ds-card transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-ds-primary" />
                <span>Importar CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setErroForm('');
                  setIsModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo</span>
              </button>
            </div>
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
            <select
              value={filtroPapel}
              onChange={(e) => {
                setFiltroPapel(e.target.value);
                carregarUsuarios(e.target.value, busca);
              }}
              className="px-3 py-2 rounded-xl bg-ds-card border border-ds-border text-xs text-ds-text font-semibold focus:outline-none focus:ring-2 focus:ring-ds-primary"
            >
              <option value="">Todos os Papéis</option>
              <option value="ROLE_MORADOR">Moradores</option>
              <option value="ROLE_PORTEIRO">Portaria</option>
              <option value="ROLE_SINDICO">Síndico</option>
            </select>
          </form>

          {/* Erro */}
          {erroLista && (
            <div className="p-3 bg-ds-danger-dim border border-ds-danger/25 rounded-xl flex items-center gap-2 text-xs text-ds-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erroLista}</span>
            </div>
          )}

          {/* Lista de Usuários */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-ds-dim">
              <Loader2 className="w-6 h-6 animate-spin text-ds-primary" />
              <span className="text-xs">Carregando cadastros...</span>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="bg-ds-card border border-ds-border rounded-2xl p-8 text-center">
              <Users className="w-8 h-8 text-ds-dim mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-ds-text m-0">Nenhum cadastro encontrado</p>
              <p className="text-xs text-ds-dim mt-1 m-0">Cadastre moradores e funcionários da portaria.</p>
            </div>
          ) : (
            <div className="space-y-2">
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
        </>
      ) : (
        /* Aba de Condomínios (Tenants) */
        <>
          <div className="bg-ds-card border border-ds-border rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-ds-text m-0 truncate">Condomínios (Multi-Tenant)</h1>
                <p className="text-xs text-ds-dim m-0 truncate">Gestão de condomínios integrados à plataforma</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setErroCondoForm('');
                setIsCondoModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Condomínio</span>
            </button>
          </div>

          {loadingCondos ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-ds-dim">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-xs">Carregando condomínios...</span>
            </div>
          ) : condominios.length === 0 ? (
            <div className="bg-ds-card border border-ds-border rounded-2xl p-8 text-center">
              <Building2 className="w-8 h-8 text-ds-dim mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-ds-text m-0">Nenhum condomínio cadastrado</p>
              <p className="text-xs text-ds-dim mt-1 m-0">Provisione o primeiro condomínio na plataforma.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {condominios.map((c) => (
                <div key={c.id} className="bg-ds-card border border-ds-border rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-ds-text m-0">{c.nome}</h3>
                      <p className="text-xs text-ds-dim m-0 mt-0.5">CNPJ: {c.cnpj}</p>
                      <p className="text-[11px] font-mono text-purple-400 m-0 mt-1">Tenant ID: {c.tenantId}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      c.ativo ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    }`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal: Cadastrar Morador / Porteiro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ds-text m-0">Novo Cadastro</h2>
                <p className="text-xs text-ds-dim m-0 mt-0.5">Adicionar morador ou membro da equipe</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ds-bg text-ds-dim hover:text-ds-text flex items-center justify-center border border-ds-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {erroForm && (
              <div className="p-3 bg-ds-danger-dim border border-ds-danger/25 rounded-xl flex items-center gap-2 text-xs text-ds-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            <form onSubmit={handleCadastrarUsuario} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Tipo de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoPapel('ROLE_MORADOR')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
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
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      novoPapel === 'ROLE_PORTEIRO'
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-ds-bg text-ds-dim border-ds-border'
                    }`}
                  >
                    Portaria / Recepção
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Nome Completo</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  maxLength={100}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">E-mail</label>
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="carlos@exemplo.com"
                  maxLength={120}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Senha Inicial</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  maxLength={50}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              {novoPapel === 'ROLE_MORADOR' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-ds-text">Unidade / Apto</label>
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

      {/* Modal: Provisionar Condomínio (Super Admin) */}
      {isCondoModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ds-text m-0">Novo Condomínio</h2>
                <p className="text-xs text-ds-dim m-0 mt-0.5">Provisionar novo tenant na plataforma</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCondoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-ds-bg text-ds-dim hover:text-ds-text flex items-center justify-center border border-ds-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {erroCondoForm && (
              <div className="p-3 bg-ds-danger-dim border border-ds-danger/25 rounded-xl flex items-center gap-2 text-xs text-ds-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroCondoForm}</span>
              </div>
            )}

            <form onSubmit={handleCadastrarCondominio} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Nome do Condomínio</label>
                <input
                  type="text"
                  value={condoNome}
                  onChange={(e) => setCondoNome(e.target.value)}
                  placeholder="Ex: Condomínio Residencial Parque Solar"
                  maxLength={100}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">CNPJ</label>
                <input
                  type="text"
                  value={condoCnpj}
                  onChange={(e) => setCondoCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  maxLength={20}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-ds-text">Tenant ID (Identificador)</label>
                <input
                  type="text"
                  value={condoTenantId}
                  onChange={(e) => setCondoTenantId(e.target.value)}
                  placeholder="ex: parque_solar"
                  maxLength={63}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-ds-bg border border-ds-border text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <p className="text-[11px] text-ds-dim mt-1">Apenas letras, números e underline. Sem espaços ou acentos.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCondoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-ds-border text-xs font-bold text-ds-dim hover:text-ds-text cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoCondo}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 disabled:opacity-60 cursor-pointer"
                >
                  {salvandoCondo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisionando...</span>
                    </>
                  ) : (
                    'Provisionar Condomínio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação em Lote via CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ds-card border border-ds-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-5 border-b border-ds-border flex items-center justify-between shrink-0 bg-ds-bg/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ds-primary/10 border border-ds-primary/20 flex items-center justify-center text-ds-primary">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ds-text m-0">Importação em Lote de Moradores</h3>
                  <p className="text-xs text-ds-dim font-medium m-0">
                    Cadastre múltiplos apartamentos e moradores enviando uma planilha CSV
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-ds-border flex items-center justify-center text-ds-dim hover:text-ds-text hover:bg-ds-bg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Card de Instruções e Download do Modelo */}
              <div className="bg-ds-bg p-4 rounded-xl border border-ds-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-ds-text m-0">Modelo Padrão de Planilha</p>
                  <p className="text-[11.5px] text-ds-dim mt-0.5 m-0">
                    Colunas aceitas: <span className="font-mono text-ds-text font-semibold">Nome, Email, Apartamento, Bloco, Telefone, SenhaProvisoria</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Higienização e sanitização contra injeção de fórmulas CSV (CWE-1236) ativas.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBaixarModeloCsv}
                  className="px-3 py-1.5 rounded-lg bg-ds-card border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-card/80 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-ds-primary" />
                  <span>Baixar Modelo CSV</span>
                </button>
              </div>

              {erroImportacao && (
                <div className="p-3 bg-ds-danger-dim border border-ds-danger/20 rounded-xl flex items-center gap-2 text-xs text-ds-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroImportacao}</span>
                </div>
              )}

              {/* Área de Seleção do Arquivo */}
              {!resultadoImportacao && (
                <form onSubmit={handleImportarCsv} className="space-y-4">
                  <div className="border-2 border-dashed border-ds-border hover:border-ds-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors bg-ds-bg/30">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      id="input-csv-moradores"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setArquivoCsv(file);
                        setErroImportacao('');
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="input-csv-moradores"
                      className="cursor-pointer flex flex-col items-center gap-2 w-full"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-ds-primary/10 flex items-center justify-center text-ds-primary">
                        <Upload className="w-6 h-6" />
                      </div>
                      {arquivoCsv ? (
                        <div>
                          <p className="text-sm font-bold text-ds-text m-0">{arquivoCsv.name}</p>
                          <p className="text-xs text-ds-dim mt-0.5 m-0 font-mono">
                            {(arquivoCsv.size / 1024).toFixed(1)} KB • Arquivo CSV pronto para processamento
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-ds-text m-0">Clique para selecionar seu arquivo CSV</p>
                          <p className="text-xs text-ds-dim mt-0.5 m-0">ou arraste e solte o arquivo aqui</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-ds-border text-xs font-bold text-ds-text hover:bg-ds-bg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!arquivoCsv || importando}
                      className="px-5 py-2.5 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                      {importando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processando Planilha...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Processar e Cadastrar Moradores</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Resultado do Processamento */}
              {resultadoImportacao && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-ds-bg p-3.5 rounded-xl border border-ds-border text-center">
                      <p className="text-[10.5px] font-bold text-ds-dim uppercase tracking-wider m-0">Linhas Lidas</p>
                      <p className="text-lg font-bold text-ds-text mt-1 m-0">{resultadoImportacao.totalProcessados}</p>
                    </div>
                    <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-center">
                      <p className="text-[10.5px] font-bold text-emerald-500 uppercase tracking-wider m-0">Cadastrados</p>
                      <p className="text-lg font-bold text-emerald-500 mt-1 m-0">{resultadoImportacao.sucessoCount}</p>
                    </div>
                    <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 text-center">
                      <p className="text-[10.5px] font-bold text-amber-500 uppercase tracking-wider m-0">Não Importados</p>
                      <p className="text-lg font-bold text-amber-500 mt-1 m-0">{resultadoImportacao.falhaCount}</p>
                    </div>
                  </div>

                  {/* Lista de Sucessos */}
                  {resultadoImportacao.importados.length > 0 && (
                    <div className="border border-ds-border rounded-xl bg-ds-bg overflow-hidden">
                      <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Novos Moradores Criados ({resultadoImportacao.importados.length})
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-ds-border">
                        {resultadoImportacao.importados.map((m) => (
                          <div key={m.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-ds-card transition-colors">
                            <div>
                              <p className="font-semibold text-ds-text m-0">{m.nome}</p>
                              <p className="text-[11px] text-ds-dim m-0">{m.email}</p>
                            </div>
                            <span className="font-mono font-bold text-ds-primary bg-ds-primary/10 px-2 py-0.5 rounded text-[11px]">
                              Apto {m.apartamento} {m.bloco ? `(${m.bloco})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de Linhas com Erro/Aviso */}
                  {resultadoImportacao.erros.length > 0 && (
                    <div className="border border-ds-border rounded-xl bg-ds-bg overflow-hidden">
                      <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Linhas Ignoradas com Aviso ({resultadoImportacao.erros.length})
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-ds-border">
                        {resultadoImportacao.erros.map((err, i) => (
                          <div key={i} className="p-2.5 flex items-center justify-between text-xs hover:bg-ds-card transition-colors">
                            <div>
                              <p className="font-semibold text-ds-text m-0">Linha {err.linha} • {err.email}</p>
                              <p className="text-[11px] text-amber-500 mt-0.5 m-0">{err.motivo}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setArquivoCsv(null);
                        setResultadoImportacao(null);
                        setIsImportModalOpen(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-ds-primary text-ds-primary-ink text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
                    >
                      Concluir e Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
