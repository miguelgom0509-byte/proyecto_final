const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v, c = 'PEN') => (c === 'PEN' ? 'S/ ' : 'US$ ') + Math.round(v).toLocaleString('es-PE');
const fecha = d => {
    if (!d) return '—';
    try {
        const str = d.endsWith('Z') || d.includes('+') ? d : d + 'Z';
        return new Date(str).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return 'Fecha inválida'; }
};

const ESTADOS = { pendiente: 'Pendiente', en_proceso: 'En proceso', entregado: 'Entregado', cancelado: 'Cancelado' };
const HOME = { admin: '/admin/', trabajador: '/trabajador/', cliente: '/cliente/' };

const session = {
  get token() { return localStorage.getItem('ma_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('ma_user')); } catch { return null; } },
  set(t, u) { localStorage.setItem('ma_token', t); localStorage.setItem('ma_user', JSON.stringify(u)); },
  clear() { localStorage.removeItem('ma_token'); localStorage.removeItem('ma_user'); },
};

async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session.token && { Authorization: 'Bearer ' + session.token }) },
    body: body && JSON.stringify(body),
  });
  if (r.status === 401) { session.clear(); location.href = '/login.html'; return; }
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

function toast(msg) {
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2600);
}

function table(cols, rows, vacio = 'Aún no hay registros.') {
  if (!rows || !rows.length) return `<p class="muted" style="padding:1rem;">${vacio}</p>`;
  return `<div class="tbl"><table><thead><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${cols.map(c => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const field = (name, label, type = 'text', extra = '') => `<label>${label}<input name="${name}" type="${type}" required ${extra}></label>`;
const formData = f => Object.fromEntries(new FormData(f));

async function run(fn, ok, again) {
  try { await fn(); toast(ok); await again(); } catch (e) { toast(e.message); }
}

function mountPanel({ rol, title, sections }) {
  const u = session.user;
  
  if (rol === 'cliente') {
      if (session.token && u && u.rol !== 'cliente') { location.href = HOME[u.rol]; return; }
  } else {
      if (!session.token || !u || u.rol !== rol) { location.href = '/login.html'; return; }
  }
  
  const iconos = { resumen: '📊', motos: '🏍️', pedidos: '📦', usuarios: '👥', catalogo: '🛒', inventario: '📋', favoritos: '❤️' };
  const esInvitado = !u;
  const nombreUsuario = esInvitado ? 'Invitado' : u.nombre;
  const inicial = esInvitado ? 'I' : u.nombre.charAt(0).toUpperCase();
  const botonSesion = esInvitado 
      ? `<button class="btn sm" onclick="location.href='/login.html?comprar=true'">Iniciar Sesión</button>`
      : `<button id="out" class="btn ghost sm" type="button">Salir</button>`;

  document.body.innerHTML = `
    <aside class="side">
      <div class="brand"><i></i>Moto Altiplano<small>${title}</small></div>
      <nav aria-label="Secciones">
        ${sections.map(s => `<a href="#${s.id}" data-id="${s.id}"><span style="font-size:1.2rem">${iconos[s.id] || '📌'}</span> ${s.label}</a>`).join('')}
      </nav>
      <div class="me">
        <div class="user-info">
            <div class="avatar">${inicial}</div>
            <div>
                <span style="display:block; font-size:0.9rem;">${esc(nombreUsuario)}</span>
                <small style="color:#94A3B8; text-transform:capitalize; font-size:0.75rem;">${esInvitado ? 'Visitante' : u.rol}</small>
            </div>
        </div>
        ${botonSesion}
      </div>
    </aside>
    
    <div class="main-wrapper">
        <header class="topbar">
            <h1 id="ttl" style="margin:0; font-size:1.4rem;"></h1>
            <div class="topbar-right">
                <span class="date-badge">📅 ${new Date().toLocaleDateString('es-PE', {weekday: 'long', day: 'numeric', month: 'long'})}</span>
            </div>
        </header>
        <main>
            <section id="view" aria-live="polite"></section>
        </main>
    </div>
    <div id="toast" role="status"></div>`;
    
  if (!esInvitado) {
      $('#out').onclick = () => { session.clear(); location.href = '/login.html'; };
  }
  
  const go = async () => {
    const hash = location.hash.slice(1);
    
    // Si la ruta es una ficha, NO HACEMOS NADA. Dejamos que cliente.js lo maneje.
    if (hash.startsWith('ficha/')) {
        document.querySelectorAll('.side nav a').forEach(a => a.classList.remove('on'));
        return;
    }

    const s = sections.find(x => x.id === hash) || sections[0];
    document.querySelectorAll('.side nav a').forEach(a => a.classList.toggle('on', a.dataset.id === s.id));
    $('#ttl').textContent = s.label;
    const v = $('#view'); 
    v.innerHTML = '<p class="muted animate-up">Cargando datos...</p>';
    
    try { await s.render(v, () => go()); } 
    catch (e) { v.innerHTML = `<p class="err" style="background:rgba(239,68,68,0.1); padding:1rem; border-radius:8px;">${esc(e.message)}</p>`; }
  };
  
  addEventListener('hashchange', go); 
  go();
}