const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v, c = 'PEN') => (c === 'PEN' ? 'S/ ' : 'US$ ') + Math.round(Number(v) || 0).toLocaleString('es-PE');
const fecha = d => {
    if (!d) return '—';
    try {
        const str = d.endsWith('Z') || d.includes('+') ? d : d + 'Z';
        const f = new Date(str);
        if (isNaN(f)) return 'Fecha inválida';
        return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return 'Fecha inválida'; }
};

const ESTADOS = { pendiente: 'Pendiente', en_proceso: 'En proceso', entregado: 'Entregado', cancelado: 'Cancelado' };
const HOME = { admin: '/admin/', trabajador: '/trabajador/', cliente: '/cliente/' };

const session = {
  get token() { try { return localStorage.getItem('ma_token'); } catch { return null; } },
  get user() { try { return JSON.parse(localStorage.getItem('ma_user')); } catch { return null; } },
  set(t, u) { localStorage.setItem('ma_token', t); localStorage.setItem('ma_user', JSON.stringify(u)); },
  clear() { try { localStorage.removeItem('ma_token'); localStorage.removeItem('ma_user'); } catch { /* sin acceso a storage */ } },
};

// true  = usa el backend FastAPI (uvicorn backend.main:app)
// false = modo Firebase Hosting: todo se guarda en el navegador (localStorage)
const USAR_BACKEND = false;

async function api(path, opts = {}) {
  return USAR_BACKEND ? apiRemota(path, opts) : apiLocal(path, opts);
}

async function apiRemota(path, { method = 'GET', body } = {}) {
  const r = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session.token && { Authorization: 'Bearer ' + session.token }) },
    body: body && JSON.stringify(body),
  });
  if (r.status === 401 && !path.startsWith('/auth/login')) {
    session.clear(); location.href = '/login.html';
    throw new Error('Tu sesión expiró. Inicia sesión de nuevo');
  }
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    let msg = 'Ocurrió un error inesperado';
    if (data?.detail) {
      if (typeof data.detail === 'string') msg = data.detail;
      else if (Array.isArray(data.detail)) msg = data.detail[0]?.msg || 'Revisa los datos ingresados';
    }
    throw new Error(msg);
  }
  return data;
}

// ===================================================================
// BACKEND LOCAL (para Firebase Hosting): imita la API con localStorage
// ===================================================================
const DB_KEY = 'ma_db_v1';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const sha256 = async s => {
  if (globalThis.crypto?.subtle) {
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return 'x' + h.toString(16);
};

async function semilla() {
  const I = 'https://images.unsplash.com/';
  const usr = async (id, nombre, email, pwd, rol) => ({ id, nombre, email, password_hash: await sha256(pwd), rol, activo: true });
  const moto = (id, marca, modelo, anio, tipo, cc, precio, moneda, stock, foto) =>
    ({ id, marca, modelo, anio, tipo, cc, precio, moneda, stock, activo: true, imagen: I + foto + '?q=80&w=800&auto=format&fit=crop' });
  return {
    seq: { usuarios: 3, motos: 5, pedidos: 0 },
    usuarios: [
      await usr(1, 'Administrador', 'admin@motoaltiplano.pe', 'Admin12345', 'admin'),
      await usr(2, 'Carlos Quispe', 'trabajador@motoaltiplano.pe', 'Trabajo12345', 'trabajador'),
      await usr(3, 'Lucía Mamani', 'cliente@motoaltiplano.pe', 'Cliente12345', 'cliente'),
    ],
    motos: [
      moto(1, 'Honda', 'Elite 125', 2026, 'Scooter', 124, 2369, 'USD', 6, 'photo-1558981403-c5f9899a28bc'),
      moto(2, 'Yamaha', 'FZS 4.0 ABS Deluxe', 2026, 'Naked', 150, 3399, 'USD', 4, 'photo-1568772585407-9361f9bf3a87'),
      moto(3, 'Bajaj', 'Boxer 150X UG Disc', 2026, 'Utilitaria', 150, 5432, 'PEN', 10, 'photo-1591637333184-19aa84b3e01f'),
      moto(4, 'Bajaj', 'Dominar 250', 2026, 'Naked', 250, 15593, 'PEN', 3, 'photo-1558980664-10ea292d4342'),
      moto(5, 'Hero', 'Hunk 160R 4V', 2027, 'Pistera', 163, 2899, 'USD', 5, 'photo-1558981403-c5f9899a28bc'),
    ],
    pedidos: [],
  };
}

const guardarDB = d => localStorage.setItem(DB_KEY, JSON.stringify(d));
let semillaPromise = null;
async function cargarDB() {
  const leer = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)); } catch { return null; } };
  let d = leer();
  if (!d) {
    semillaPromise ??= semilla().then(s => { if (!leer()) { try { guardarDB(s); } catch { /* sin storage */ } } return s; });
    const s = await semillaPromise;
    d = leer() ?? s;
  }
  return d;
}

function validarMoto(d) {
  const marca = String(d?.marca ?? '').trim(), modelo = String(d?.modelo ?? '').trim(), tipo = String(d?.tipo ?? '').trim();
  const anio = Number(d?.anio), cc = Number(d?.cc), precio = Number(d?.precio), stock = Number(d?.stock ?? 0);
  const moneda = d?.moneda || 'PEN';
  const ok = marca.length >= 2 && modelo.length >= 1 && tipo.length >= 2 &&
    Number.isInteger(anio) && anio >= 2000 && anio <= 2100 &&
    Number.isFinite(cc) && cc > 0 && cc <= 3000 &&
    Number.isFinite(precio) && precio > 0 &&
    ['PEN', 'USD'].includes(moneda) && Number.isInteger(stock) && stock >= 0;
  if (!ok) throw new Error('Revisa los datos ingresados');
  const r = { marca, modelo, anio, tipo, cc, precio, moneda, stock };
  if (d.imagen !== undefined) r.imagen = String(d.imagen || '').slice(0, 500);
  return r;
}

async function apiLocal(path, { method = 'GET', body } = {}) {
  const db = await cargarDB();
  const [ruta, qs] = path.split('?');
  const q = new URLSearchParams(qs || '');
  const [a, b, c, d] = ruta.split('/').filter(Boolean);
  const guardar = () => guardarDB(db);

  const token = session.token || '';
  const yo = token.startsWith('local-') ? db.usuarios.find(u => u.id === +token.slice(6) && u.activo) : null;
  const exigir = (...roles) => {
    if (!yo) { session.clear(); location.href = '/login.html'; throw new Error('Inicia sesión para continuar'); }
    if (!roles.includes(yo.rol)) throw new Error('No tienes permisos para esta acción');
  };

  const pub = u => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo });
  const pedidoPub = x => {
    const cli = db.usuarios.find(u => u.id === x.cliente_id), mo = db.motos.find(m => m.id === x.moto_id);
    return { id: x.id, estado: x.estado, nota: x.nota, creado: x.creado, cliente: cli?.nombre ?? '—',
             moto: mo ? `${mo.marca} ${mo.modelo}` : '—', moto_id: x.moto_id };
  };
  const contar = (arr, k) => arr.reduce((o, x) => (o[x[k]] = (o[x[k]] || 0) + 1, o), {});
  const crearUsuario = async (datos, rol) => {
    const nombre = String(datos?.nombre || '').trim(), email = String(datos?.email || '').trim().toLowerCase(),
          pwd = String(datos?.password || '');
    if (nombre.length < 3 || !EMAIL_RE.test(email) || pwd.length < 8) throw new Error('Revisa los datos ingresados');
    if (db.usuarios.some(u => u.email === email)) throw new Error('Ese correo ya está registrado');
    return { id: ++db.seq.usuarios, nombre, email, password_hash: await sha256(pwd), rol, activo: true };
  };

  if (a === 'auth' && b === 'login' && method === 'POST') {
    const email = String(body?.email || '').trim().toLowerCase();
    const u = db.usuarios.find(x => x.email === email);
    if (!u || !u.activo || u.password_hash !== await sha256(String(body?.password || '')))
      throw new Error('Correo o contraseña incorrectos');
    return { token: 'local-' + u.id, usuario: pub(u) };
  }
  if (a === 'auth' && b === 'registro' && method === 'POST') {
    const u = await crearUsuario(body, 'cliente');
    db.usuarios.push(u); guardar();
    return { token: 'local-' + u.id, usuario: pub(u) };
  }
  if (a === 'auth' && b === 'me') { exigir('admin', 'trabajador', 'cliente'); return pub(yo); }

  if (a === 'motos') {
    if (!b && method === 'GET') {
      const todas = q.get('todas') === 'true' && !!yo && ['admin', 'trabajador'].includes(yo.rol);
      return db.motos.filter(m => todas || m.activo)
        .sort((x, y) => x.marca.localeCompare(y.marca) || x.modelo.localeCompare(y.modelo)).map(m => ({ ...m }));
    }
    if (!b && method === 'POST') {
      exigir('admin');
      const m = { id: ++db.seq.motos, imagen: '', ...validarMoto(body), activo: true };
      db.motos.push(m); guardar(); return { ...m };
    }
    if (b) {
      if (c === 'stock') {
        exigir('admin', 'trabajador');
        const m = db.motos.find(x => x.id === +b);
        if (!m) throw new Error('Moto no encontrada');
        if (method === 'PATCH') {
          const s = Number(body?.stock);
          if (!Number.isInteger(s) || s < 0) throw new Error('Revisa los datos ingresados');
          m.stock = s; guardar(); return { ...m };
        }
      } else if (!c) {
        exigir('admin');
        const m = db.motos.find(x => x.id === +b);
        if (!m) throw new Error('Moto no encontrada');
        if (method === 'PUT') { Object.assign(m, validarMoto(body)); guardar(); return { ...m }; }
        if (method === 'DELETE') { m.activo = false; guardar(); return null; }
      }
    }
  }

  if (a === 'pedidos') {
    if (!b && method === 'POST') {
      exigir('cliente');
      const m = db.motos.find(x => x.id === +body?.moto_id);
      if (!m || !m.activo) throw new Error('Moto no disponible');
      if (m.stock < 1) throw new Error('Esta moto no tiene stock por ahora');
      const x = { id: ++db.seq.pedidos, cliente_id: yo.id, moto_id: m.id, estado: 'pendiente',
                  nota: String(body.nota || '').trim().slice(0, 300), creado: new Date().toISOString() };
      db.pedidos.push(x); guardar(); return pedidoPub(x);
    }
    if (b === 'mios' && method === 'GET') {
      exigir('cliente');
      return db.pedidos.filter(x => x.cliente_id === yo.id).sort((x, y) => y.id - x.id).map(pedidoPub);
    }
    if (!b && method === 'GET') {
      exigir('admin', 'trabajador');
      const est = q.get('estado');
      return db.pedidos.filter(x => !est || x.estado === est).sort((x, y) => y.id - x.id).map(pedidoPub);
    }
    if (c === 'estado' && method === 'PATCH') {
      exigir('admin', 'trabajador');
      const x = db.pedidos.find(r => r.id === +b);
      if (!x) throw new Error('Pedido no encontrado');
      const est = body?.estado;
      if (!Object.hasOwn(ESTADOS, est)) throw new Error('Revisa los datos ingresados');
      const m = db.motos.find(r => r.id === x.moto_id);
      if (est === 'entregado' && x.estado !== 'entregado') {
        if (!m) throw new Error('La moto de este pedido ya no existe');
        if (m.stock < 1) throw new Error('No hay stock para entregar esta moto');
        m.stock -= 1;
      } else if (x.estado === 'entregado' && est !== 'entregado' && m) {
        m.stock += 1;
      }
      x.estado = est; guardar(); return pedidoPub(x);
    }
  }

  if (a === 'admin') {
    exigir('admin');
    if (b === 'stats') return {
      motos: db.motos.filter(m => m.activo).length,
      unidades: db.motos.reduce((s, m) => s + m.stock, 0),
      pedidos: contar(db.pedidos, 'estado'),
      usuarios: contar(db.usuarios, 'rol'),
    };
    if (b === 'usuarios' && !c && method === 'GET') return db.usuarios.map(pub);
    if (b === 'usuarios' && !c && method === 'POST') {
      if (!['admin', 'trabajador', 'cliente'].includes(body?.rol)) throw new Error('Revisa los datos ingresados');
      const u = await crearUsuario(body, body.rol);
      db.usuarios.push(u); guardar(); return pub(u);
    }
    if (b === 'usuarios' && d === 'activo' && method === 'PATCH') {
      const u = db.usuarios.find(x => x.id === +c);
      if (!u) throw new Error('Usuario no encontrado');
      if (u.id === yo.id) throw new Error('No puedes desactivar tu propia cuenta');
      u.activo = !u.activo; guardar(); return pub(u);
    }
  }

  throw new Error('Ruta no encontrada');
}

function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    <span>${esc(msg)}</span>
  `;
  t.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 3000);
}

function table(cols, rows, vacio = 'Aún no hay registros.') {
  if (!rows || !rows.length) return `<div class="empty-state"><p class="muted">${vacio}</p></div>`;
  return `<div class="table-responsive"><table><thead><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${cols.map(c => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const field = (name, label, type = 'text', extra = '') => `<label class="form-group"><span>${label}</span><input name="${name}" type="${type}" required ${extra}></label>`;
const formData = f => Object.fromEntries(new FormData(f));

async function run(fn, ok, again) {
  try { await fn(); toast(ok); await again(); } catch (e) { toast(e.message); }
}

function mountPanel({ rol, title, sections }) {
  const u = session.user;

  if (rol === 'cliente') {
      if (session.token && u && u.rol !== 'cliente') { location.href = HOME[u.rol] || '/login.html'; return; }
  } else {
      if (!session.token || !u || u.rol !== rol) { location.href = '/login.html'; return; }
  }

  // Iconos SVG para el menú lateral
  const icons = {
    resumen: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    motos: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6h-3l-3 9h6"></path><path d="M15 6l3 4"></path></svg>`,
    pedidos: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    usuarios: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    catalogo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    inventario: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    favoritos: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    default: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  const esInvitado = !u;
  const nombreUsuario = esInvitado ? 'Invitado' : (u.nombre || 'Usuario');
  const inicial = nombreUsuario.charAt(0).toUpperCase();
  const botonSesion = esInvitado
      ? `<button class="btn btn-primary w-full" onclick="location.href='/login.html?comprar=true'">Iniciar Sesión</button>`
      : `<button id="out" class="btn btn-logout w-full" type="button"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Cerrar Sesión</button>`;

  // Aplicamos el tema oscuro al body
  document.body.className = 'theme-dark';

  document.body.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="/" class="brand">
          <img src="/recursos/image/logo.jpeg" alt="Henvi" class="brand-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <span class="brand-fallback" style="display:none;">HENVI</span>
        </a>
        <button class="collapse-btn" id="collapse-btn" aria-label="Colapsar menú">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
        </button>
      </div>
      
      <nav class="sidebar-nav" aria-label="Secciones">
        ${sections.map(s => `
          <a href="#${esc(s.id)}" data-id="${esc(s.id)}" class="nav-item" title="${esc(s.label)}">
            <span class="nav-icon">${icons[s.id] || icons.default}</span>
            <span class="nav-label">${esc(s.label)}</span>
          </a>
        `).join('')}
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="avatar">${esc(inicial)}</div>
          <div class="user-info">
            <span class="user-name">${esc(nombreUsuario)}</span>
            <span class="user-role">${esInvitado ? 'Visitante' : esc(u.rol)}</span>
          </div>
        </div>
        ${botonSesion}
      </div>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <div class="topbar-left">
              <h1 id="ttl" class="page-title"></h1>
            </div>
            <div class="topbar-right">
                <span class="date-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  ${new Date().toLocaleDateString('es-PE', {weekday: 'short', day: 'numeric', month: 'short'})}
                </span>
                <button class="icon-btn" aria-label="Notificaciones">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  <span class="notification-dot"></span>
                </button>
            </div>
        </header>
        <main class="content-area">
            <section id="view" aria-live="polite"></section>
        </main>
    </div>
    <div id="toast" role="status"></div>`;

  if (!esInvitado) {
      $('#out').onclick = () => { session.clear(); location.href = '/login.html'; };
  }

  // Lógica para colapsar el sidebar
  const collapseBtn = $('#collapse-btn');
  const sidebar = $('#sidebar');
  if (collapseBtn) {
    collapseBtn.onclick = () => {
      sidebar.classList.toggle('collapsed');
      // Guardar preferencia
      localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    };
    // Restaurar preferencia al cargar
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      sidebar.classList.add('collapsed');
    }
  }

  let ultimo = 0;
  const go = async () => {
    const hash = location.hash.slice(1);

    if (hash.startsWith('ficha/')) {
        ultimo++;
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        return;
    }

    const s = sections.find(x => x.id === hash) || sections[0];
    const mio = ++ultimo;
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.toggle('active', a.dataset.id === s.id));
    $('#ttl').textContent = s.label;
    const v = $('#view');
    v.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando datos...</p></div>';
    
    try { 
      await s.render(v, () => go()); 
    }
    catch (e) { 
      if (mio === ultimo) {
        v.innerHTML = `<div class="error-state"><p>${esc(e.message)}</p></div>`; 
      }
    }
  };

  window.onhashchange = go;
  go();
}