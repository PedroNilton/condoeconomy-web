import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/Layout';
import { DashboardHome } from './pages/Dashboard';
import { EncomendasList } from './pages/Encomendas';
import { ReservasList } from './pages/Reservas';
import { BoletosList } from './pages/Boletos';
import { ChamadosList } from './pages/Chamados';
import { MoradorLayout } from './pages/Morador/components/MoradorLayout';
import { MoradorLogin } from './pages/Morador/Login/MoradorLogin';
import { MoradorHome } from './pages/Morador/Home/MoradorHome';
import { MoradorOuvidoria } from './pages/Morador/Ouvidoria/MoradorOuvidoria';
import { MoradorReservas } from './pages/Morador/Reservas/MoradorReservas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas (embutidas no Layout da Portaria) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="encomendas" element={<EncomendasList />} />
          <Route path="visitantes" element={
            <div className="text-center py-12 text-gray-500">
              Módulo de Visitantes (Em construção...)
            </div>
          } />
          <Route path="reservas" element={<ReservasList />} />
          <Route path="boletos" element={<BoletosList />} />
          <Route path="chamados" element={<ChamadosList />} />
        </Route>

        {/* Rotas do App do Morador (Mobile PWA) */}
        <Route path="/app/login" element={<MoradorLogin />} />
        <Route path="/app" element={<MoradorLayout />}>
          <Route index element={<MoradorHome />} />
          <Route path="reservas" element={<MoradorReservas />} />
          <Route path="boletos" element={<div className="p-6 text-center text-gray-500">Tela de Boletos (Em construção)</div>} />
          <Route path="ouvidoria" element={<MoradorOuvidoria />} />
          <Route path="perfil" element={<div className="p-6 text-center text-gray-500">Tela de Perfil (Em construção)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
