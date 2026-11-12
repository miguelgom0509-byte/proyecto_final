import { createContext, useContext, useState } from 'react';
import { api } from '../services/api'; // <-- Aquí se corrige el plural

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const leerUsuario = () => {
    try { return localStorage.getItem('token') ? JSON.parse(localStorage.getItem('user')) : null; } catch { return null; }
  };
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  // Se lee de inmediato: si se hiciera en un useEffect, al recargar la página
  // la ruta protegida vería user=null y mandaría al login.
  const [user, setUser] = useState(leerUsuario);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    setToken(data.token);
    setUser(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);