import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Inicio() {
  const { user } = useAuth();

  return (
    <div className="relative h-full min-h-[600px] rounded-2xl overflow-hidden shadow-2xl group flex items-center">
      <img 
        src="/recursos/image/fondo.jpeg" 
        alt="Moto" 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent"></div>

      <div className="relative z-10 w-full max-w-4xl px-8 md:px-12">
        <div className="bg-surface/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-6 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Bienvenido, {user?.nombre?.split(' ')[0] || 'Cliente'}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter mb-6">
            Tu próxima <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-purple-500">
              moto ideal
            </span>
          </h1>
          
          <p className="text-textSecondary text-lg mb-8 max-w-md leading-relaxed">
            Explora nuestro catálogo exclusivo, revisa el stock en tiempo real y encuentra el modelo perfecto para dominar las calles.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/catalogo" 
              className="bg-primary hover:bg-primaryHover text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(59,130,246,0.4)]"
            >
              Explorar Catálogo
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}