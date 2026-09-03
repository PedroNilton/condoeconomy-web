import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas da Portaria */}
        <Route path="/portaria" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="encomendas" element={<EncomendasList />} />
          <Route path="reservas" element={<ReservasList />} />
          <Route path="chamados" element={<ChamadosList />} />
          <Route path="visitantes" element={<VisitantesList />} />
        </Route>

        {/* Rotas do Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AvisosPanel />} />
        </Route>

        {/* Rotas do App do Morador */}
        <Route path="/app" element={<MoradorLayout />}>
          <Route index element={<MoradorHome />} />
          <Route path="reservas" element={<MoradorReservas />} />
          <Route path="boletos" element={<MoradorBoletos />} />
          <Route path="ouvidoria" element={<MoradorOuvidoria />} />
          <Route path="visitantes" element={<MoradorVisitantes />} />
          <Route path="perfil" element={<MoradorPerfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
