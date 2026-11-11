// Usamos la URL de tu Firebase o localhost si estás desarrollando
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000/api' 
  : 'https://motos-henvi.web.app/api';

export const api = {
  get: async (endpoint, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Error en la petición');
    }
    return res.json();
  },

  post: async (endpoint, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Error en la petición');
    }
    return res.json();
  }
};