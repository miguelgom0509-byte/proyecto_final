import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Luces de fondo */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-surface/70 backdrop-blur-xl border border-borderStrong rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <img src="/recursos/image/logo.jpeg" alt="Henvi" className="h-12 mx-auto mb-4 bg-white p-1 rounded" />
          <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
          <p className="text-textSecondary text-sm">Ingresa tus credenciales para continuar</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-borderSubtle rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-borderSubtle rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5">
            Ingresar al sistema
          </button>
        </form>
      </div>
    </div>
  );
}