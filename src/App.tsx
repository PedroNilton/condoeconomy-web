import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
              <h1 className="text-2xl font-bold text-blue-900 mb-2">Painel da Portaria</h1>
              <p className="text-gray-500">O módulo de Gestão de Encomendas e Visitantes será construído aqui.</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
