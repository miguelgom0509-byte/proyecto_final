import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FichaMoto() {
  const { id } = useParams();
  const { token } = useAuth();
  const [moto, setMoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarFicha = async () => {
      try {
        // Idealmente, tu backend debería tener una ruta /motos/{id}.
        // Mientras tanto, filtramos desde la lista completa.
        const motos = await api.get('/motos', token);
        const encontrada = motos.find(m => m.id === parseInt(id));
        setMoto(encontrada);
      } catch (error) {
        console.error("Error al cargar la moto:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarFicha();
  }, [id, token]);

  const handleSolicitar = () => {
    // Aquí conectarás con tu API de pedidos (POST /pedidos)
    alert(`¡Has solicitado la ${moto.marca} ${moto.modelo}! Un asesor se contactará contigo.`);
  };

  if (loading) return <div className="text-white text-center mt-20">Cargando ficha técnica...</div>;
  if (!moto) return <div className="text-white text-center mt-20">Moto no encontrada</div>;

  const formatMoney = (precio, moneda) => (moneda === 'PEN' ? 'S/ ' : 'US$ ') + precio.toLocaleString('es-PE');

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <Link to="/catalogo" className="inline-flex items-center gap-2 text-textSecondary hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-surface border border-borderSubtle rounded-3xl p-8 flex items-center justify-center">
          <img 
            src={moto.imagen || '/recursos/image/logo.jpeg'} 
            alt={moto.modelo} 
            className="w-full h-auto rounded-xl object-contain drop-shadow-2xl" 
          />
        </div>

        <div className="flex flex-col">
          <div className="flex gap-3 mb-4">
            <span className="bg-accentGreen/10 text-accentGreen px-3 py-1 rounded-full text-xs font-bold uppercase">Disponible</span>
            <span className="bg-background text-textSecondary px-3 py-1 rounded-full text-xs font-bold">{moto.anio}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{moto.marca} {moto.modelo}</h1>
          <p className="text-xl text-textSecondary mb-8">{moto.tipo} · {moto.cc} cc</p>

          <div className="bg-surface border border-borderSubtle rounded-2xl p-6 mb-8">
            <span className="text-textSecondary text-sm font-bold uppercase tracking-wider block mb-1">Precio referencial</span>
            <span className="text-4xl font-black text-primary">{formatMoney(moto.precio, moto.moneda)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-background rounded-xl p-4 border border-borderSubtle">
              <span className="block text-textSecondary text-xs mb-1">Cilindrada</span>
              <span className="text-lg font-bold text-white">{moto.cc} cc</span>
            </div>
            <div className="bg-background rounded-xl p-4 border border-borderSubtle">
              <span className="block text-textSecondary text-xs mb-1">Stock</span>
              <span className="text-lg font-bold text-white">{moto.stock} unidades</span>
            </div>
          </div>

          <button 
            onClick={handleSolicitar}
            disabled={moto.stock === 0}
            className="w-full bg-primary hover:bg-primaryHover disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(59,130,246,0.4)]"
          >
            {moto.stock === 0 ? 'Agotada temporalmente' : 'Solicitar esta moto'}
          </button>
        </div>
      </div>
    </div>
  );
}