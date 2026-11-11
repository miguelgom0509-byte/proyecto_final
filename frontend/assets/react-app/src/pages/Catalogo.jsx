import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Catalogo() {
  const [motos, setMotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todas');
  const { token } = useAuth();

  useEffect(() => {
    const cargarMotos = async () => {
      try {
        const data = await api.get('/motos', token);
        setMotos(data);
      } catch (error) {
        console.error("Error cargando motos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarMotos();
  }, [token]);

  const formatMoney = (precio, moneda) => {
    return (moneda === 'PEN' ? 'S/ ' : 'US$ ') + precio.toLocaleString('es-PE');
  };

  const motosFiltradas = motos.filter(m => {
    const matchBusqueda = `${m.marca} ${m.modelo}`.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = tipoFiltro === 'Todas' || m.tipo === tipoFiltro;
    return matchBusqueda && matchTipo;
  });

  const tipos = ['Todas', ...new Set(motos.map(m => m.tipo))];

  if (loading) return <div className="text-center text-white mt-20">Cargando catálogo...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Catálogo de motos</h2>
          <p className="text-textSecondary">{motosFiltradas.length} modelos encontrados</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
            <input 
              type="text" 
              placeholder="Buscar modelo..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-surface border border-borderStrong rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {tipos.map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoFiltro(tipo)}
            className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors whitespace-nowrap border ${
              tipoFiltro === tipo 
              ? 'bg-primary border-primary text-white' 
              : 'bg-surface border-borderStrong text-textSecondary hover:bg-surfaceHover hover:text-white'
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {motosFiltradas.map(moto => (
          <div key={moto.id} className="bg-surface border border-borderSubtle rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-borderStrong hover:shadow-2xl transition-all duration-300 flex flex-col group">
            <div className="relative h-48 overflow-hidden bg-black">
              <img 
                src={moto.imagen || '/recursos/image/logo.jpeg'} 
                alt={moto.modelo} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              {moto.stock <= 3 && moto.stock > 0 && (
                <span className="absolute top-3 left-3 bg-accentOrange text-white text-xs font-bold px-3 py-1 rounded-full">
                  Últimas {moto.stock}
                </span>
              )}
              {moto.stock === 0 && (
                <span className="absolute top-3 left-3 bg-accentRed text-white text-xs font-bold px-3 py-1 rounded-full">
                  Agotada
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-primary font-bold text-xs tracking-wider uppercase">{moto.marca}</span>
                <span className="text-textSecondary text-xs bg-background px-2 py-1 rounded">{moto.anio}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{moto.modelo}</h3>
              <p className="text-textSecondary text-sm mb-4">{moto.tipo} · {moto.cc} cc</p>
              
              <div className="mt-auto flex justify-between items-center pt-4 border-t border-borderSubtle">
                <span className="text-xl font-black text-white">{formatMoney(moto.precio, moto.moneda)}</span>
                <Link 
                  to={`/ficha/${moto.id}`}
                  className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Ver ficha
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}