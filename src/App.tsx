import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { MoradorDadosPessoais } from './pages/Morador/Perfil/MoradorDadosPessoais';
import { MoradorVeiculos } from './pages/Morador/Perfil/MoradorVeiculos';
import { MoradorPets } from './pages/Morador/Perfil/MoradorPets';
import { MoradorAdicionais } from './pages/Morador/Perfil/MoradorAdicionais';
import { MoradorNotificacoes } from './pages/Morador/Perfil/MoradorNotificacoes';
import { MoradorSeguranca } from './pages/Morador/Perfil/MoradorSeguranca';
import { MoradorAjuda } from './pages/Morador/Perfil/MoradorAjuda';
import { DashboardLayout } from './components/Layout';
import { DashboardHome } from './pages/Dashboard';
import { EncomendasList } from './pages/Encomendas/EncomendasList';
import { ReservasList } from './pages/Reservas';
import { ChamadosList } from './pages/Chamados';
import { VisitantesList } from './pages/Visitantes/VisitantesList';
import { MoradorLayout } from './pages/Morador/components/MoradorLayout';
import { MoradorHome } from './pages/Morador/Home/MoradorHome';
import { MoradorOuvidoria } from './pages/Morador/Ouvidoria/MoradorOuvidoria';
import { MoradorReservas } from './pages/Morador/Reservas/MoradorReservas';
import { MoradorBoletos } from './pages/Morador/Boletos/MoradorBoletos';
import { MoradorPerfil } from './pages/Morador/Perfil/MoradorPerfil';
import { MoradorVisitantes } from './pages/Morador/Visitantes/MoradorVisitantes';
import { AdminLayout } from './pages/Admin/components/AdminLayout';
import { AvisosPanel } from './pages/Admin/Avisos/AvisosPanel';
import { ReservasApprovalPanel } from './pages/Admin/Reservas/ReservasApprovalPanel';
import { OuvidoriaAdminPanel } from './pages/Admin/Ouvidoria/OuvidoriaAdminPanel';
import { FinancasAdminPanel } from './pages/Admin/Financas/FinancasAdminPanel';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AutoCheckin } from './pages/Public/AutoCheckin';
import { NotificacoesList } from './pages/Notificacoes/NotificacoesList';
import { MoradorEncomendas } from './pages/Morador/Encomendas/MoradorEncomendas';
import { AuthGuard } from './components/AuthGuard';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NotificationProvider>
          <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auto-checkin" element={<AutoCheckin />} />
          
          {/* Rotas protegidas da Portaria */}
          <Route element={<AuthGuard allowedRoles={['ROLE_PORTEIRO', 'ROLE_SUPER_ADMIN']} />}>
            <Route path="/portaria" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="encomendas" element={<EncomendasList />} />
              <Route path="reservas" element={<ReservasList />} />
              <Route path="chamados" element={<ChamadosList />} />
              <Route path="visitantes" element={<VisitantesList />} />
            </Route>
          </Route>

          {/* Rotas do Admin */}
          <Route element={<AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SINDICO', 'ROLE_SUPER_ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AvisosPanel />} />
              <Route path="reservas" element={<ReservasApprovalPanel />} />
              <Route path="ouvidoria" element={<OuvidoriaAdminPanel />} />
              <Route path="painel" element={<FinancasAdminPanel />} />
            </Route>
          </Route>

          {/* Rotas do App do Morador */}
          <Route element={<AuthGuard allowedRoles={['ROLE_MORADOR']} />}>
            <Route path="/app" element={<MoradorLayout />}>
              <Route index element={<MoradorHome />} />
              <Route path="reservas" element={<MoradorReservas />} />
              <Route path="boletos" element={<MoradorBoletos />} />
              <Route path="ouvidoria" element={<MoradorOuvidoria />} />
              <Route path="visitantes" element={<MoradorVisitantes />} />
              <Route path="notificacoes" element={<NotificacoesList />} />
              <Route path="encomendas" element={<MoradorEncomendas />} />
              <Route path="perfil" element={<MoradorPerfil />} />
              <Route path="perfil/dados" element={<MoradorDadosPessoais />} />
              <Route path="perfil/veiculos" element={<MoradorVeiculos />} />
              <Route path="perfil/pets" element={<MoradorPets />} />
              <Route path="perfil/adicionais" element={<MoradorAdicionais />} />
              <Route path="perfil/notificacoes" element={<MoradorNotificacoes />} />
              <Route path="perfil/seguranca" element={<MoradorSeguranca />} />
              <Route path="perfil/ajuda" element={<MoradorAjuda />} />
            </Route>
          </Route>
        </Routes>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
