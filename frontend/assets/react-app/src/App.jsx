import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importación de componentes y páginas
import Layout from './components/Layout';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Catalogo from './pages/Catalogo';
import FichaMoto from './pages/FichaMoto';

// Componente para proteger rutas (si no hay usuario, va al login)
function RutaProtegida({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública para iniciar sesión */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas: requieren estar logueado */}
          <Route 
            path="/" 
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route index element={<Inicio />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="ficha/:id" element={<FichaMoto />} />
          </Route>

          {/* Redirección por defecto si la ruta no existe */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}