const motosMock = [
  {
    id: 1,
    marca: "Honda",
    modelo: "Elite 125",
    anio: 2026,
    tipo: "Scooter",
    cc: 124,
    precio: 2369,
    moneda: "USD",
    stock: 6,
    imagen: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    marca: "Yamaha",
    modelo: "FZS 4.0 ABS Deluxe",
    anio: 2026,
    tipo: "Naked",
    cc: 150,
    precio: 3399,
    moneda: "USD",
    stock: 4,
    imagen: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    marca: "Bajaj",
    modelo: "Boxer 150X UG Disc",
    anio: 2026,
    tipo: "Utilitaria",
    cc: 150,
    precio: 5432,
    moneda: "PEN",
    stock: 10,
    imagen: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    marca: "Bajaj",
    modelo: "Dominar 250",
    anio: 2026,
    tipo: "Naked",
    cc: 250,
    precio: 15593,
    moneda: "PEN",
    stock: 2,
    imagen: "https://images.unsplash.com/photo-1558980664-10ea292d4342?q=80&w=800&auto=format&fit=crop"
  }
];

// Con el backend FastAPI corriendo se usa /api (en desarrollo: localhost:8000).
// En Firebase Hosting no existe backend: la petición devuelve HTML (por el rewrite a
// index.html) o falla, y entonces se usa el modo demo con datos locales.
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

const USUARIOS_DEMO = [
  { id: 1, nombre: 'Administrador', email: 'admin@motoaltiplano.pe', password: 'Admin12345', rol: 'admin', activo: true },
  { id: 2, nombre: 'Carlos Quispe', email: 'trabajador@motoaltiplano.pe', password: 'Trabajo12345', rol: 'trabajador', activo: true },
  { id: 3, nombre: 'Lucía Mamani', email: 'cliente@motoaltiplano.pe', password: 'Cliente12345', rol: 'cliente', activo: true },
];

function demo(endpoint, body) {
  if (endpoint === '/motos') return motosMock.map(m => ({ activo: true, ...m }));
  if (endpoint === '/auth/login') {
    const email = String(body?.email || '').trim().toLowerCase();
    const u = USUARIOS_DEMO.find(x => x.email === email && x.password === body?.password);
    if (!u) throw new Error('Correo o contraseña incorrectos');
    const { password, ...usuario } = u;
    return { token: 'local-' + u.id, usuario };
  }
  throw new Error('Esta función requiere el servidor (backend)');
}

async function request(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token && !token.startsWith('local-')) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    return demo(endpoint, body);                 // sin servidor
  }
  if (!(res.headers.get('content-type') || '').includes('json')) {
    return demo(endpoint, body);                 // hosting estático: respondió HTML
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const d = data?.detail;
    throw new Error(typeof d === 'string' ? d : d?.[0]?.msg || 'Error en la petición');
  }
  return data;
}

export const api = {
  get: (endpoint, token = null) => request(endpoint, { token }),
  post: (endpoint, body, token = null) => request(endpoint, { method: 'POST', body, token }),
};