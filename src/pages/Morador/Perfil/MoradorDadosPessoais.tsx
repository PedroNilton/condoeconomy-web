import { Loader2, Pencil, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import { Avatar, Button, Field, GroupedList, PageHead, Toast } from '../../../components/ui';

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

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
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('Formato inválido. Escolha JPG, PNG ou WebP.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('Imagem muito grande. Máximo permitido: 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 5) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    setTelefone(v);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contemAmeacas(nome) || contemAmeacas(telefone)) {
      showToast('Entrada contém caracteres não permitidos.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/api/v1/perfil/dados', {
        nome: sanitizarEntrada(nome),
        telefone: sanitizarEntrada(telefone),
        foto,
      });
      showToast('Dados salvos com sucesso!');
      setTimeout(() => navigate(-1), 600);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-8">
      <PageHead title="Dados pessoais" onBack={() => navigate(-1)} />

      <main className="px-[18px] flex-1">
        {fetching ? (
          <div className="flex justify-center mt-12">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar + botão lápis */}
            <div className="flex flex-col items-center my-2">
              <div className="relative">
                <Avatar name={nome || 'Carlos Silva'} src={foto || null} size="xl" />
                <label
                  title="Alterar foto"
                  className="absolute bottom-0 right-0 w-[26px] h-[26px] bg-brand text-brand-ink rounded-full flex items-center justify-center cursor-pointer border-2 border-canvas hover:bg-brand-hover transition-colors"
                >
                  <Pencil className="w-[12px] h-[12px]" strokeWidth={2.5} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <p className="text-[12px] text-dim mt-3">Toque no ícone para alterar a foto</p>
            </div>

            <Field
              label="Nome completo"
              type="text"
              required
              surface="surface"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
            />

            <Field
              label="Telefone (WhatsApp)"
              type="text"
              required
              mono
              surface="surface"
              value={telefone}
              onChange={handleTelefoneChange}
              placeholder="(00) 00000-0000"
            />

            {/* Informações da unidade (somente leitura) */}
            <div className="pt-1">
              <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
                Vinculado à Unidade
              </p>

              <GroupedList>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[13.5px] text-dim">E-mail</span>
                  <span className="font-mono text-[13px] font-bold text-ink truncate max-w-[220px]">
                    {email}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[13.5px] text-dim">Apartamento</span>
                  <span className="font-mono text-[13.5px] font-bold text-ink">{apartamento}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[13.5px] text-dim">Bloco</span>
                  <span className="font-mono text-[13.5px] font-bold text-ink">{bloco}</span>
                </div>
              </GroupedList>

              <div className="flex items-start gap-2 mt-3 text-dim px-1">
                <Lock className="w-[14px] h-[14px] shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-relaxed">
                  E-mail, apartamento e bloco são definidos pela administração. Pra mudar algo aqui, fale com a Central de Ajuda.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        )}
      </main>

      <Toast message={toastMsg} hasBottomNav={false} />
    </div>
  );
}
