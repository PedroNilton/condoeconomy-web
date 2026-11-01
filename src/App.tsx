import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthGuard } from './components/AuthGuard';

// Carregamento sob demanda (Code-Splitting) — Público
const AutoCheckin = lazy(() => import('./pages/Public/AutoCheckin').then(m => ({ default: m.AutoCheckin })));

// Carregamento sob demanda — Módulo Portaria
const DashboardLayout = lazy(() => import('./components/Layout').then(m => ({ default: m.DashboardLayout })));
const DashboardHome = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardHome })));
const EncomendasList = lazy(() => import('./pages/Encomendas/EncomendasList').then(m => ({ default: m.EncomendasList })));
const ReservasList = lazy(() => import('./pages/Reservas').then(m => ({ default: m.ReservasList })));
const ChamadosList = lazy(() => import('./pages/Chamados').then(m => ({ default: m.ChamadosList })));
const VisitantesList = lazy(() => import('./pages/Visitantes/VisitantesList').then(m => ({ default: m.VisitantesList })));
const ConsultaVeiculos = lazy(() => import('./pages/Portaria/Veiculos/ConsultaVeiculos').then(m => ({ default: m.ConsultaVeiculos })));

// Carregamento sob demanda — Módulo Admin / Síndico
const AdminLayout = lazy(() => import('./pages/Admin/components/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AvisosPanel = lazy(() => import('./pages/Admin/Avisos/AvisosPanel').then(m => ({ default: m.AvisosPanel })));
const AssembleiaAdminPanel = lazy(() => import('./pages/Admin/Assembleia/AssembleiaAdminPanel').then(m => ({ default: m.AssembleiaAdminPanel })));
const ReservasApprovalPanel = lazy(() => import('./pages/Admin/Reservas/ReservasApprovalPanel').then(m => ({ default: m.ReservasApprovalPanel })));
const OuvidoriaAdminPanel = lazy(() => import('./pages/Admin/Ouvidoria/OuvidoriaAdminPanel').then(m => ({ default: m.OuvidoriaAdminPanel })));
const FinancasAdminPanel = lazy(() => import('./pages/Admin/Financas/FinancasAdminPanel').then(m => ({ default: m.FinancasAdminPanel })));
const AuditoriaAdminPanel = lazy(() => import('./pages/Admin/Auditoria/AuditoriaAdminPanel').then(m => ({ default: m.AuditoriaAdminPanel })));
const MoradoresAdminPanel = lazy(() => import('./pages/Admin/Moradores/MoradoresAdminPanel').then(m => ({ default: m.MoradoresAdminPanel })));
const CondoStoreAdminPanel = lazy(() => import('./pages/Admin/CondoStore/CondoStoreAdminPanel').then(m => ({ default: m.CondoStoreAdminPanel })));

// Carregamento sob demanda — App do Morador
const MoradorLayout = lazy(() => import('./pages/Morador/components/MoradorLayout').then(m => ({ default: m.MoradorLayout })));
const MoradorHome = lazy(() => import('./pages/Morador/Home/MoradorHome').then(m => ({ default: m.MoradorHome })));
const MoradorReservas = lazy(() => import('./pages/Morador/Reservas/MoradorReservas').then(m => ({ default: m.MoradorReservas })));
const MoradorBoletos = lazy(() => import('./pages/Morador/Boletos/MoradorBoletos').then(m => ({ default: m.MoradorBoletos })));
const MoradorOuvidoria = lazy(() => import('./pages/Morador/Ouvidoria/MoradorOuvidoria').then(m => ({ default: m.MoradorOuvidoria })));
const MoradorAssembleia = lazy(() => import('./pages/Morador/Assembleia/MoradorAssembleia').then(m => ({ default: m.MoradorAssembleia })));
const MoradorVisitantes = lazy(() => import('./pages/Morador/Visitantes/MoradorVisitantes').then(m => ({ default: m.MoradorVisitantes })));
const NotificacoesList = lazy(() => import('./pages/Notificacoes/NotificacoesList').then(m => ({ default: m.NotificacoesList })));
const MoradorEncomendas = lazy(() => import('./pages/Morador/Encomendas/MoradorEncomendas').then(m => ({ default: m.MoradorEncomendas })));
const MoradorCondoStore = lazy(() => import('./pages/Morador/CondoStore/MoradorCondoStore').then(m => ({ default: m.MoradorCondoStore })));
const MoradorPerfil = lazy(() => import('./pages/Morador/Perfil/MoradorPerfil').then(m => ({ default: m.MoradorPerfil })));
const MoradorDadosPessoais = lazy(() => import('./pages/Morador/Perfil/MoradorDadosPessoais').then(m => ({ default: m.MoradorDadosPessoais })));
const MoradorVeiculos = lazy(() => import('./pages/Morador/Perfil/MoradorVeiculos').then(m => ({ default: m.MoradorVeiculos })));
const MoradorPets = lazy(() => import('./pages/Morador/Perfil/MoradorPets').then(m => ({ default: m.MoradorPets })));
const MoradorAdicionais = lazy(() => import('./pages/Morador/Perfil/MoradorAdicionais').then(m => ({ default: m.MoradorAdicionais })));
const MoradorNotificacoes = lazy(() => import('./pages/Morador/Perfil/MoradorNotificacoes').then(m => ({ default: m.MoradorNotificacoes })));
const MoradorSeguranca = lazy(() => import('./pages/Morador/Perfil/MoradorSeguranca').then(m => ({ default: m.MoradorSeguranca })));
const MoradorAjuda = lazy(() => import('./pages/Morador/Perfil/MoradorAjuda').then(m => ({ default: m.MoradorAjuda })));
const MoradorPrivacidade = lazy(() => import('./pages/Morador/Perfil/MoradorPrivacidade').then(m => ({ default: m.MoradorPrivacidade })));

function RotaCarregando() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        color: 'var(--text-muted, #64748b)',
        fontSize: '0.9rem',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span>Carregando módulo...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NotificationProvider>
          <Suspense fallback={<RotaCarregando />}>
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
                  <Route path="veiculos" element={<ConsultaVeiculos />} />
                </Route>
              </Route>

              {/* Rotas do Admin */}
              <Route element={<AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SINDICO', 'ROLE_SUPER_ADMIN']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AvisosPanel />} />
                  <Route path="assembleia" element={<AssembleiaAdminPanel />} />
                  <Route path="reservas" element={<ReservasApprovalPanel />} />
                  <Route path="ouvidoria" element={<OuvidoriaAdminPanel />} />
                  <Route path="painel" element={<FinancasAdminPanel />} />
                  <Route path="auditoria" element={<AuditoriaAdminPanel />} />
                  <Route path="moradores" element={<MoradoresAdminPanel />} />
                  <Route path="condostore" element={<CondoStoreAdminPanel />} />
                </Route>
              </Route>

              {/* Rotas do App do Morador */}
              <Route element={<AuthGuard allowedRoles={['ROLE_MORADOR']} />}>
                <Route path="/app" element={<MoradorLayout />}>
                  <Route index element={<MoradorHome />} />
                  <Route path="reservas" element={<MoradorReservas />} />
                  <Route path="boletos" element={<MoradorBoletos />} />
                  <Route path="ouvidoria" element={<MoradorOuvidoria />} />
                  <Route path="assembleia" element={<MoradorAssembleia />} />
                  <Route path="visitantes" element={<MoradorVisitantes />} />
                  <Route path="notificacoes" element={<NotificacoesList />} />
                  <Route path="encomendas" element={<MoradorEncomendas />} />
                  <Route path="condostore" element={<MoradorCondoStore />} />
                  <Route path="perfil" element={<MoradorPerfil />} />
                  <Route path="perfil/dados" element={<MoradorDadosPessoais />} />
                  <Route path="perfil/veiculos" element={<MoradorVeiculos />} />
                  <Route path="perfil/pets" element={<MoradorPets />} />
                  <Route path="perfil/adicionais" element={<MoradorAdicionais />} />
                  <Route path="perfil/notificacoes" element={<MoradorNotificacoes />} />
                  <Route path="perfil/seguranca" element={<MoradorSeguranca />} />
                  <Route path="perfil/ajuda" element={<MoradorAjuda />} />
                  <Route path="perfil/privacidade" element={<MoradorPrivacidade />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
