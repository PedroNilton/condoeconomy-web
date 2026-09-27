import { ChevronLeft, Loader2, Pencil, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

export function MoradorDadosPessoais() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [apartamento, setApartamento] = useState('');
  const [bloco, setBloco] = useState('');
  const [foto, setFoto] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/v1/perfil/dados');
        setNome(res.data.nome || '');
        setTelefone(res.data.telefone || '');
        setApartamento(res.data.apartamento || '01');
        setBloco(res.data.bloco || 'Amorgos');
        setEmail(res.data.email || 'c.silva@email.com');
        setFoto(res.data.foto || '');
      } catch (err) {
        console.error(err);
        setNome('Carlos Silva');
        setTelefone('(79) 99692-1016');
        setApartamento('01');
        setBloco('Amorgos');
        setEmail('c.silva@email.com');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/v1/perfil/dados', { nome, telefone, foto });
      alert('Dados salvos com sucesso!');
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'CS';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300">
      
      {/* Header */}
      <header className="px-5 py-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Dados pessoais</h1>
      </header>

      <main className="px-5 pb-8 flex-1 overflow-y-auto">
        {fetching ? (
           <div className="flex justify-center mt-12"><Loader2 className="w-8 h-8 animate-spin text-ds-primary" /></div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Foto Profile Editor */}
            <div className="flex flex-col items-center mb-4 mt-2">
              <div className="relative">
                <div className="w-[84px] h-[84px] rounded-full bg-ds-primary/20 flex items-center justify-center text-ds-primary text-3xl font-bold tracking-wide overflow-hidden shadow-inner">
                  {foto ? (
                    <img src={foto} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(nome)
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-[26px] h-[26px] bg-ds-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-md border-[2.5px] border-ds-bg active:scale-95 transition-transform">
                  <Pencil className="w-[12px] h-[12px]" strokeWidth={2.5} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <p className="text-[12px] text-ds-dim mt-3.5">Toque no ícone para alterar a foto</p>
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Nome completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full bg-ds-card border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] font-medium text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent focus:outline-none placeholder:text-ds-dim/40 transition-shadow shadow-sm"
                placeholder="Seu nome"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Telefone (WhatsApp)</label>
              <input 
                type="text" 
                required
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full bg-ds-card border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] font-medium text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent focus:outline-none placeholder:text-ds-dim/40 transition-shadow shadow-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            
            {/* Readonly Unidade Info */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-3">Vinculado à Unidade</label>
              
              <div className="bg-ds-card border border-ds-border rounded-[16px] overflow-hidden shadow-sm">
                
                <div className="flex items-center justify-between p-4 border-b border-ds-border/50">
                  <span className="text-[14px] text-ds-dim">E-mail</span>
                  <span className="text-[13px] font-mono font-black text-slate-900 dark:text-white">{email}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 border-b border-ds-border/50">
                  <span className="text-[14px] text-ds-dim">Apartamento</span>
                  <span className="text-[14px] font-mono font-black text-slate-900 dark:text-white">{apartamento}</span>
                </div>
                
                <div className="flex items-center justify-between p-4">
                  <span className="text-[14px] text-ds-dim">Bloco</span>
                  <span className="text-[14px] font-mono font-black text-slate-900 dark:text-white">{bloco}</span>
                </div>

              </div>
              
              <div className="flex items-start gap-2 mt-3.5 text-ds-dim px-1">
                <Lock className="w-[14px] h-[14px] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[11.5px] leading-relaxed">
                  E-mail, apartamento e bloco são definidos pela administração. Pra mudar algo aqui, fale com a Central de Ajuda.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-ds-primary text-ds-primary-ink font-bold py-4 rounded-[12px] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md disabled:opacity-70 text-[15px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar alterações'}
              </button>
            </div>

          </form>
        )}
      </main>

    </div>
  );
}
