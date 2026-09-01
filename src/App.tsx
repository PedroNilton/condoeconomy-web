import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/Layout';
import { DashboardHome } from './pages/Dashboard';
import { EncomendasList } from './pages/Encomendas';
import { ReservasList } from './pages/Reservas';
import { BoletosList } from './pages/Boletos';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
