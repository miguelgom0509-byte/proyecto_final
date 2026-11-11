import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Heart, Package, LogOut } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const user = { nombre: 'Lucía Mamani', rol: 'cliente' };

  const menu = [
    { path: '/', name: 'Inicio', icon: <Home size={20} /> },
    { path: '/catalogo', name: 'Catálogo', icon: <ShoppingCart size={20} /> },
    { path: '/favoritos', name: 'Favoritos', icon: <Heart size={20} /> },
    { path: '/pedidos', name: 'Mis pedidos', icon: <Package size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR */}
      <aside className="w-64 bg-surface border-r border-borderSubtle flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-borderSubtle">
          <img src="/recursos/image/logo.jpeg" alt="Logo" className="h-8 bg-white rounded p-1" />
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menu.map(item => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary' 
                : 'text-textSecondary hover:bg-surfaceHover hover:text-textPrimary'
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-borderSubtle">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold">
              {user.nombre.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold">{user.nombre}</p>
              <p className="text-xs text-textSecondary capitalize">{user.rol}</p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-surface border-b border-borderSubtle flex items-center justify-between px-8">
          <h1 className="text-xl font-bold">Panel de Control</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}