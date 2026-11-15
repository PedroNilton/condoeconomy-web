import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  UserCircle2,
  Car,
  Users,
  Bell,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  PawPrint,
  Moon,
  QrCode,
  FileText,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  GroupedList,
  IconChip,
  ListRow,
  PageHead,
} from '../../../components/ui';

export function MoradorPerfil() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [nome, setNome] = useState('Carregando...');
  const [apto, setApto] = useState('');
  const [bloco, setBloco] = useState('');
  const [foto, setFoto] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/v1/perfil/dados');
        setNome(res.data.nome || 'Usuário');
        setApto(res.data.apartamento || 'S/N');
        setBloco(res.data.bloco || '');
        setFoto(res.data.foto || '');
      } catch (err) {
        console.error(err);
        setNome('Carlos Silva');
        setApto('01');
        setBloco('AMORGOS');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignora erro de rede no logout
    }
    localStorage.removeItem('@HabitOS:token');
    localStorage.removeItem('@HabitOS:user');
    navigate('/login');
  };

  const unidadeCode = `BLOCO-${bloco || 'UNICO'} • APTO-${apto || 'S/N'}`;

  return (
    <div className="bg-canvas min-h-full flex flex-col pb-6 text-ink">
      <PageHead eyebrow="Conta" title="Perfil" />

      <div className="px-[18px] space-y-5">
        {/* Card do Perfil */}
        <div className="bg-surface border border-line rounded-[16px] p-5 flex flex-col items-center text-center">
          <Avatar name={nome === 'Carregando...' ? 'Morador' : nome} src={foto || null} size="xl" online />
          <div className="text-[17px] font-extrabold tracking-tight text-ink mt-3">{nome}</div>
          <div className="mt-1.5">
            <Badge tone="brand">Morador</Badge>
          </div>
          <div className="font-mono text-[11px] font-semibold text-dim uppercase tracking-[0.05em] mt-2">
            {unidadeCode}
          </div>
        </div>

        {/* Cartão Meu QR de Acesso */}
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="w-full text-left bg-brand-soft border border-brand/25 rounded-[14px] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:brightness-98 active:translate-y-[1px] transition-all focus-visible:outline-2 focus-visible:outline-brand"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[12px] bg-brand text-brand-ink flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-extrabold text-brand truncate">
                Meu QR de acesso
              </div>
              <div className="text-[12px] text-dim truncate">Mostrar na portaria</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-brand shrink-0" />
        </button>

        {/* Grupo: Minha unidade */}
        <section>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
            Minha unidade
          </p>
          <GroupedList>
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <UserCircle2 className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Dados pessoais"
              showChevron
              onClick={() => navigate('/app/perfil/dados')}
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <Users className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Moradores adicionais"
              showChevron
              onClick={() => navigate('/app/perfil/adicionais')}
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <PawPrint className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Meus pets"
              showChevron
              onClick={() => navigate('/app/perfil/pets')}
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <Car className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Meus veículos"
              showChevron
              onClick={() => navigate('/app/perfil/veiculos')}
            />
          </GroupedList>
        </section>

        {/* Grupo: Configurações */}
        <section>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
            Configurações
          </p>
          <GroupedList>
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <Moon className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Modo escuro"
              onClick={toggleTheme}
              right={
                <span
                  role="switch"
                  aria-checked={theme === 'dark'}
                  className={`w-[40px] h-[23px] rounded-full p-[2.5px] transition-colors inline-flex items-center ${
                    theme === 'dark' ? 'bg-brand' : 'bg-line'
                  }`}
                >
                  <span
                    className={`block w-[18px] h-[18px] rounded-full bg-white transition-transform duration-150 ${
                      theme === 'dark' ? 'translate-x-[17px]' : 'translate-x-0'
                    }`}
                  />
                </span>
              }
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <Bell className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Notificações"
              showChevron
              onClick={() => navigate('/app/perfil/notificacoes')}
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <ShieldCheck className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Segurança e senha"
              showChevron
              onClick={() => navigate('/app/perfil/seguranca')}
            />
          </GroupedList>
        </section>

        {/* Grupo: Suporte e Privacidade */}
        <section>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
            Suporte e Privacidade
          </p>
          <GroupedList>
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <HelpCircle className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Central de ajuda"
              showChevron
              onClick={() => navigate('/app/perfil/ajuda')}
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <FileText className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Termos e Privacidade (LGPD)"
              showChevron
              onClick={() => navigate('/app/perfil/privacidade')}
            />
          </GroupedList>
        </section>

        {/* Sair */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 flex items-center justify-center gap-2 text-bad font-bold text-[13.5px] bg-transparent border-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sair do aplicativo</span>
        </button>
      </div>

      <BottomSheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Meu QR de acesso"
        subtitle="Apresente este código na portaria para identificação rápida da sua unidade."
      >
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 border border-line rounded-[16px] mb-3">
            <QRCodeSVG
              value={`MORADOR:${bloco || 'UNICO'}-${apto || 'S/N'}:${nome}`}
              size={200}
            />
          </div>
          <p className="font-mono text-[11.5px] font-bold text-dim uppercase tracking-[0.05em] mb-5">
            {unidadeCode}
          </p>
          <Button variant="secondary" fullWidth onClick={() => setQrOpen(false)}>
            Fechar
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
