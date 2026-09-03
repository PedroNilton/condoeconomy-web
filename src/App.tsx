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

        {/* Rota Futura: Admin */}
        <Route path="/admin" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Painel do Síndico</h1>
              <p className="text-gray-500">Este módulo será construído na próxima fase.</p>
            </div>
          </div>
        } />

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
