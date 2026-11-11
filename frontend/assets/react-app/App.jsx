import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';

// Placeholder para las otras vistas
const Catalogo = () => <div className="text-2xl">Catálogo en construcción...</div>;

export default function App() {
  return (
    <BrowserRouter basename="/assets/react-build">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="catalogo" element={<Catalogo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}