const FAV_KEY = 'ma_favs';
const IMG_FALLBACK = '/recursos/image/logo.jpeg';

const favs = {
  get() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } },
  has(id) { return this.get().includes(id); },
  toggle(id) {
    const l = this.get(), i = l.indexOf(id);
    i < 0 ? l.push(id) : l.splice(i, 1);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch { /* almacenamiento no disponible */ }
    return i < 0;
  },
};

const stockInfo = m =>
  m.stock < 1 ? ['badge-danger', 'Agotada'] :
  m.stock <= 3 ? ['badge-warning', 'Últimas unidades'] :
  ['badge-success', 'Disponible'];

const estadoTag = e => `<span class="tag ${esc(e)}">${ESTADOS[e] || esc(e)}</span>`;

// ---- Datos comerciales (misma fórmula del simulador de la landing)
const WA = 'https://wa.me/51922681908';
const TIPO_CAMBIO = 3.75, TEA = 0.15;
const enSoles = m => m.moneda === 'USD' ? m.precio * TIPO_CAMBIO : m.precio;
// Cuota referencial: 20 % de inicial, 36 meses, TEA 15 %
function cuotaMensual(m, pct = 0.2, n = 36) {
  const financiar = enSoles(m) * (1 - pct), r = Math.pow(1 + TEA, 1 / 12) - 1;
  return financiar * r / (1 - Math.pow(1 + r, -n));
}
// Etiquetas calculadas con los datos reales del catálogo
const etiquetas = {};
function calcEtiquetas(motos) {
  Object.keys(etiquetas).forEach(k => delete etiquetas[k]);
  const disp = motos.filter(m => m.stock > 0);
  if (disp.length < 2) return;
  const barata = disp.reduce((a, b) => enSoles(a) <= enSoles(b) ? a : b);
  const potente = disp.reduce((a, b) => a.cc >= b.cc ? a : b);
  const nueva = disp.reduce((a, b) => a.anio >= b.anio ? a : b);
  if (nueva.anio > Math.min(...disp.map(m => m.anio))) etiquetas[nueva.id] = '✨ Modelo más nuevo';
  etiquetas[potente.id] = '⚡ Mayor cilindrada';
  etiquetas[barata.id] = '💰 Mejor precio';
}

function tarjeta(m) {
  const [clase, texto] = stockInfo(m);
  const badgeTexto = texto === 'Últimas unidades' ? `Quedan ${m.stock}` : texto;
  const agotada = m.stock < 1;

  return `
    <article class="moto-card sales-card animate-up">
      <div class="moto-img-container">
        <span class="stock-badge ${clase}">${badgeTexto}</span>
        <button class="btn-fav" type="button" data-fav="${m.id}" aria-label="Favorito">${favs.has(m.id) ? '❤️' : '🤍'}</button>
        <a href="#ficha/${m.id}" aria-label="Ver ficha de ${esc(m.marca)} ${esc(m.modelo)}">
          <img class="moto-img ${!m.imagen ? 'sin-foto' : ''}" src="${esc(m.imagen || IMG_FALLBACK)}" alt="${esc(m.marca)} ${esc(m.modelo)}" loading="lazy"
               onerror="this.onerror=null;this.src='${IMG_FALLBACK}';this.classList.add('sin-foto');">
        </a>
        ${etiquetas[m.id] ? `<span class="moto-ribbon">${etiquetas[m.id]}</span>` : ''}
      </div>
      <div class="moto-info">
        <div class="moto-header">
          <span class="moto-brand">${esc(m.marca)}</span>
          <span class="moto-year">${m.anio}</span>
        </div>
        <h3 class="moto-model"><a href="#ficha/${m.id}">${esc(m.modelo)}</a></h3>
        <ul class="moto-chips"><li>${esc(m.tipo)}</li><li>${m.cc} cc</li></ul>

        <div class="moto-pricebox">
          <span class="moto-price">${money(m.precio, m.moneda)}</span>
          <span class="moto-cuota">o desde <b>${money(cuotaMensual(m))}</b> al mes<sup>*</sup></span>
        </div>
        ${m.stock > 0 && m.stock <= 3 ? `<p class="moto-urgencia">🔥 ¡Solo quedan ${m.stock} unidad${m.stock === 1 ? '' : 'es'}!</p>` : ''}

        <div class="moto-actions">
          <button class="btn btn-primary" type="button" data-sol="${m.id}" ${agotada ? 'disabled' : ''}>${agotada ? 'Agotada' : 'Solicitar ahora'}</button>
          <a class="btn btn-ghost" href="#ficha/${m.id}">Ver ficha técnica</a>
        </div>
      </div>
    </article>`;
}

async function solicitar(id, again) {
  if (!session.token) { location.href = '/login.html?comprar=true&next=' + encodeURIComponent(location.pathname + location.hash); return; }
  const nota = prompt('¿Quieres dejar una nota para el vendedor? (opcional)');
  if (nota === null) return;
  await run(
    () => api('/pedidos', { method: 'POST', body: { moto_id: id, nota: nota.trim().slice(0, 300) } }),
    'Solicitud enviada. Puedes seguirla en "Mis pedidos"',
    again,
  );
}

function enlazar(cont, { onFav, again }) {
  cont.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => {
    const activo = favs.toggle(+b.dataset.fav);
    toast(activo ? 'Agregada a favoritos' : 'Quitada de favoritos');
    onFav ? onFav() : (b.textContent = activo ? '❤️' : '🤍');
  });
  cont.querySelectorAll('[data-sol]').forEach(b => b.onclick = () => solicitar(+b.dataset.sol, again));
}

const vacio = (icono, titulo, texto) =>
  `<div class="empty-state animate-up"><div style="font-size:3rem">${icono}</div><h3>${titulo}</h3><p class="muted">${texto}</p></div>`;

// ---------------------------------------------------------------- Ficha técnica
async function renderFicha(id) {
  const v = $('#view');
  $('#ttl').textContent = 'Ficha técnica';
  v.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando ficha...</p></div>';
  
  try {
    const m = (await api('/motos')).find(x => x.id === id);
    if (!m) { v.innerHTML = vacio('🔎', 'Moto no encontrada', '<a href="#catalogo">Volver al catálogo</a>'); return; }
    
    const [clase, texto] = stockInfo(m);
    const potencia = (m.cc * 0.095).toFixed(1), torque = (m.cc * 0.085).toFixed(1);
    const rendimiento = Math.max(18, Math.round(58 - m.cc / 12));
    
    const especificaciones = [
      { label: 'Cilindrada', value: `${m.cc} cc` },
      { label: 'Potencia', value: `${potencia} HP` },
      { label: 'Torque', value: `${torque} Nm` },
      { label: 'Rendimiento', value: `~${rendimiento} km/l` },
      { label: 'Peso', value: '135 kg' },
      { label: 'Capacidad de tanque', value: '12 L' },
      { label: 'Frenos', value: 'Disco / Tambor' },
      { label: 'Suspensión', value: 'Telescópica / Monoshock' },
    ];

    const destacados = [
      { icon: '💡', title: 'Iluminación LED', desc: 'Faros y luces traseras de bajo consumo y alta durabilidad.' },
      { icon: '🛡️', title: 'Frenos ABS', desc: 'Sistema de frenado antibloqueo para mayor seguridad.' },
      { icon: '🔋', title: 'Tablero digital', desc: 'Lectura clara de velocidad, RPM y nivel de combustible.' },
      { icon: '🛠️', title: 'Garantía oficial', desc: '12 meses o 12,000 km, lo que ocurra primero.' },
    ];

    const colores = ['#1E3A8A', '#DC2626', '#111827', '#F3F4F6'];

    v.innerHTML = `
      <div class="ficha-container animate-up">
        
        <nav class="breadcrumb">
          <a href="#catalogo">Catálogo</a> 
          <span>/</span> 
          <a href="#catalogo">${esc(m.tipo)}</a> 
          <span>/</span> 
          <span>${esc(m.marca)} ${esc(m.modelo)}</span>
        </nav>

        <div class="ficha-grid">
          <div class="ficha-imagen-col">
            <div class="ficha-imagen-principal">
              <img src="${esc(m.imagen || IMG_FALLBACK)}" alt="${esc(m.marca)} ${esc(m.modelo)}" onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
            </div>
            <div class="ficha-galeria">
              <img src="${esc(m.imagen || IMG_FALLBACK)}" class="miniatura activa" alt="Vista 1">
              <img src="${esc(m.imagen || IMG_FALLBACK)}" class="miniatura" alt="Vista 2">
              <img src="${esc(m.imagen || IMG_FALLBACK)}" class="miniatura" alt="Vista 3">
            </div>
          </div>

          <div class="ficha-detalles-col">
            <div class="ficha-badge-container">
              <span class="tag ${clase === 'badge-danger' ? 'off' : clase === 'badge-warning' ? 'en_proceso' : 'on'}">${texto}</span>
              <span class="tag pendiente">${m.anio}</span>
            </div>
            
            <h1 class="ficha-titulo">${esc(m.marca)} ${esc(m.modelo)}</h1>
            
            <div class="ficha-precio-box">
              <span class="ficha-precio-label">Precio referencial</span>
              <span class="ficha-precio-valor">${money(m.precio, m.moneda)}</span>
              ${m.moneda === 'PEN' ? `<span class="ficha-precio-alt">Aprox. US$ ${Math.round(m.precio / 3.75).toLocaleString('es-PE')}</span>` : ''}
            </div>

            <div class="ficha-acciones">
              <button class="btn btn-primary" type="button" data-sol="${m.id}" ${m.stock < 1 ? 'disabled' : ''}>Solicitar esta moto</button>
              <button class="btn btn-ghost" type="button" data-fav="${m.id}">${favs.has(m.id) ? '❤️ En favoritos' : '🤍 Guardar'}</button>
            </div>

            <div class="ficha-specs-grid">
              ${especificaciones.slice(0, 4).map(s => `
                <div class="ficha-spec-item">
                  <span class="spec-label">${s.label}</span>
                  <span class="spec-valor">${s.value}</span>
                </div>
              `).join('')}
            </div>

            <div class="ficha-seccion">
              <h3>Colores disponibles</h3>
              <div class="colores-container">
                ${colores.map(c => `<span class="color-circle" style="background:${c};" title="Color"></span>`).join('')}
              </div>
            </div>

            <div class="ficha-seccion">
              <h3>Descripción</h3>
              <p>${esc(m.tipo)} modelo ${m.anio}. Potencia, torque y rendimiento son valores referenciales calculados según la cilindrada. Diseño moderno y eficiente para tu día a día.</p>
            </div>
          </div>
        </div>

        <div class="ficha-section-card animate-up delay-1">
          <h2 class="section-title">Especificaciones técnicas</h2>
          <div class="specs-tabla">
            ${especificaciones.map(s => `
              <div class="spec-row">
                <span class="spec-label">${s.label}</span>
                <span class="spec-valor">${s.value}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ficha-section-card animate-up delay-2">
          <h2 class="section-title">Destacados</h2>
          <div class="destacados-grid">
            ${destacados.map(d => `
              <div class="destacado-card">
                <div class="destacado-icon">${d.icon}</div>
                <h3>${d.title}</h3>
                <p>${d.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>`;
    
    enlazar(v, {
      again: () => renderFicha(id),
      onFav: () => renderFicha(id),
    });

    v.querySelectorAll('.miniatura').forEach(img => {
      img.onclick = () => {
        v.querySelectorAll('.miniatura').forEach(i => i.classList.remove('activa'));
        img.classList.add('activa');
        const principal = v.querySelector('.ficha-imagen-principal img');
        if (principal) principal.src = img.src;
      };
    });

  } catch (e) {
    v.innerHTML = `<div class="error-state">${esc(e.message)}</div>`;
  }
}

const fichaId = () => {
  const h = location.hash.slice(1);
  return h.startsWith('ficha/') ? parseInt(h.slice(6), 10) || null : null;
};

// ---------------------------------------------------------------- Paneles
mountPanel({ rol: 'cliente', title: 'Cliente', sections: [
  // NUEVA SECCIÓN DE BIENVENIDA (HERO)
  { id: 'inicio', label: 'Inicio', async render(v) {
    const nombre = session.user ? session.user.nombre.split(' ')[0] : 'Invitado';
    
    v.innerHTML = `
      <div class="hero-cliente animate-up">
        <img src="/recursos/image/fondo.jpeg" class="hero-bg" alt="Bienvenida Henvi">
        <div class="hero-overlay"></div>
        
        <div class="hero-content">
          <span class="hero-badge">Bienvenido, ${esc(nombre)}</span>
          <h1 class="hero-title">Tu próxima<br>moto ideal</h1>
          <p class="hero-subtitle">Explora nuestro catálogo exclusivo, simula tu financiamiento al instante y encuentra el modelo perfecto para dominar las calles.</p>
          <div class="hero-actions">
            <a href="#catalogo" class="btn btn-primary" style="padding: 14px 28px; font-size: 16px;">Explorar Catálogo</a>
          </div>
        </div>

        <a href="#catalogo" class="scroll-down" aria-label="Bajar al catálogo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </a>
      </div>
    `;
  } },

  { id: 'catalogo', label: 'Catálogo', async render(v, again) {
    const motos = await api('/motos');
    let orden = '';
    // Filtros que vienen de la landing (buscador, tipo, cilindrada y precio máximo)
    const leer = k => { try { const v = sessionStorage.getItem(k) || ''; sessionStorage.removeItem(k); return v; } catch { return ''; } };
    let texto = leer('busqueda_inicial');
    const tipoInicial = leer('filtro_tipo');
    let [ccMin, ccMax] = leer('filtro_cc').split('-').map(Number);
    if (!(ccMax > 0)) ccMin = ccMax = null;
    let precioMax = +leer('filtro_precio') || null;   // en US$

    const tipos = ['Todas', ...new Set(motos.map(m => m.tipo))];
    let tipo = tipos.includes(tipoInicial) ? tipoInicial : 'Todas';
    const enUsd = m => m.moneda === 'USD' ? m.precio : m.precio / TIPO_CAMBIO;
    calcEtiquetas(motos);
    const nombre = session.user ? session.user.nombre.split(' ')[0] : '';
    v.innerHTML = `
      <section class="sales-hero animate-up">
        <div class="sales-hero-text">
          <h2>${nombre ? esc(nombre) + ', e' : 'E'}lige tu moto y <em>pídela hoy</em></h2>
          <p>Compara modelos, mira tu cuota estimada y envía tu solicitud en minutos. Un asesor te confirma disponibilidad y financiamiento.</p>
          <div class="sales-hero-actions">
            <button type="button" class="btn btn-primary" id="ir-modelos">Ver modelos disponibles</button>
            <a class="btn btn-ghost" href="${WA}?text=${encodeURIComponent('Hola, quiero información sobre una moto')}" target="_blank" rel="noopener">💬 Hablar con un asesor</a>
          </div>
        </div>
        <img class="sales-hero-img" src="/recursos/image/fondo.jpeg" alt="Motos nuevas Henvi del Sur">
      </section>

      <ul class="trust-bar animate-up">
        <li><span>🛡️</span><div><b>Garantía oficial</b><small>En todas las motos nuevas</small></div></li>
        <li><span>💳</span><div><b>Financiamiento</b><small>12 a 48 meses, inicial desde 10 %</small></div></li>
        <li><span>📦</span><div><b>${motos.filter(m => m.stock > 0).reduce((t, m) => t + m.stock, 0)} unidades</b><small>Disponibles ahora</small></div></li>
        <li><span>🛠️</span><div><b>Servicio técnico</b><small>Mantenimiento especializado</small></div></li>
      </ul>

      <div class="catalog-header animate-up" id="catalogo-lista">
        <div class="catalog-title"><h2>Modelos disponibles</h2><p class="muted" id="conteo"></p></div>
        <div class="catalog-actions">
          <div class="search-wrapper">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input id="q" type="search" placeholder="Buscar por marca o modelo..." value="${esc(texto)}">
          </div>
          <div class="sort-wrapper">
            <select id="ord" aria-label="Ordenar">
              <option value="">Destacadas</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="anio-desc">Más recientes</option>
            </select>
          </div>
        </div>
      </div>
      <div id="filtros-extra" class="muted" style="margin-bottom:12px"></div>
      <div class="category-tabs" id="tabs">
        ${tipos.map(t => `<button type="button" class="category-tab ${t === tipo ? 'active' : ''}" data-tipo="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>
      <div class="gallery" id="grid"></div>
      <p class="sales-nota">* Cuota referencial con 20 % de inicial, 36 meses y TEA 15 %. No incluye seguros ni gastos administrativos; el asesor confirma la cuota final.</p>

      <section class="steps-sales animate-up">
        <h3>Pedir tu moto es fácil</h3>
        <ol>
          <li><b>1</b><div><strong>Elige tu moto</strong><span>Compara modelos y revisa su ficha técnica.</span></div></li>
          <li><b>2</b><div><strong>Envía tu solicitud</strong><span>Con tu cuenta, en un clic y sin salir de casa.</span></div></li>
          <li><b>3</b><div><strong>Un asesor te contacta</strong><span>Confirma disponibilidad, financiamiento y entrega.</span></div></li>
        </ol>
      </section>

      <section class="cta-sales animate-up">
        <div>
          <h3>¿Dudas sobre qué moto elegir?</h3>
          <p>Cuéntanos tu presupuesto y para qué la usarás: te recomendamos la mejor opción.</p>
        </div>
        <a class="btn btn-primary" href="${WA}?text=${encodeURIComponent('Hola, necesito ayuda para elegir una moto')}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
      </section>`;
    $('#ir-modelos').onclick = () => $('#catalogo-lista').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const pintar = () => {
      const q = texto.trim().toLowerCase();
      const lista = motos
        .filter(m => (tipo === 'Todas' || m.tipo === tipo)
                  && `${m.marca} ${m.modelo} ${m.tipo}`.toLowerCase().includes(q)
                  && (ccMax === null || (m.cc >= ccMin && m.cc <= ccMax))
                  && (precioMax === null || enUsd(m) <= precioMax))
        .sort((a, b) => orden === 'precio-asc' ? a.precio - b.precio
                      : orden === 'precio-desc' ? b.precio - a.precio
                      : orden === 'anio-desc' ? b.anio - a.anio : 0);
      const extra = [];
      if (ccMax !== null) extra.push(ccMax >= 9999 ? `Más de ${ccMin - 1} cc` : `${ccMin}–${ccMax} cc`);
      if (precioMax !== null) extra.push(`Hasta US$ ${precioMax.toLocaleString('es-PE')}`);
      $('#filtros-extra').innerHTML = extra.length
        ? `Filtros: <b>${extra.join(' · ')}</b> <button type="button" class="btn btn-ghost btn-sm" id="limpiar-filtros">Quitar</button>` : '';
      const lf = $('#limpiar-filtros');
      if (lf) lf.onclick = () => { ccMin = ccMax = precioMax = null; pintar(); };
      $('#conteo').textContent = `${lista.length} modelo${lista.length === 1 ? '' : 's'}`;
      const grid = $('#grid');
      grid.innerHTML = lista.length ? lista.map(tarjeta).join('')
        : vacio('🏍️', 'Sin resultados', 'Prueba con otra búsqueda o categoría.');
      enlazar(grid, { again });
    };

    $('#q').oninput = e => { texto = e.target.value; pintar(); };
    $('#ord').onchange = e => { orden = e.target.value; pintar(); };
    $('#tabs').onclick = e => {
      const b = e.target.closest('[data-tipo]'); if (!b) return;
      tipo = b.dataset.tipo;
      document.querySelectorAll('.category-tab').forEach(x => x.classList.toggle('active', x === b));
      pintar();
    };
    pintar();
  } },

  { id: 'favoritos', label: 'Favoritos', async render(v, again) {
    const ids = favs.get();
    const todas = await api('/motos'); calcEtiquetas(todas);
    const lista = todas.filter(m => ids.includes(m.id));
    v.innerHTML = lista.length
      ? `<h2 class="section-title animate-up">Mis favoritos (${lista.length})</h2><div class="gallery">${lista.map(tarjeta).join('')}</div>`
      : vacio('❤️', 'Aún no tienes favoritos', 'Toca el corazón en cualquier moto del <a href="#catalogo">catálogo</a>.');
    enlazar(v, { again, onFav: again });
  } },

  { id: 'pedidos', label: 'Mis pedidos', async render(v) {
    if (!session.token) { location.href = '/login.html?comprar=true'; return; }
    const ps = await api('/pedidos/mios');
    v.innerHTML = `<h2 class="section-title animate-up">Historial de pedidos</h2><div class="animate-up delay-1">` + table([
      ['N.º', p => `<b>#${p.id}</b>`],
      ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`],
      ['Moto', p => `<b>${esc(p.moto)}</b>`],
      ['Nota', p => p.nota ? `<i>"${esc(p.nota)}"</i>` : '<span class="muted">—</span>'],
      ['Estado', p => estadoTag(p.estado)],
    ], ps, 'Todavía no has solicitado ninguna moto.') + `</div>`;
  } },
] });

addEventListener('hashchange', () => { const id = fichaId(); if (id) renderFicha(id); });
if (fichaId()) renderFicha(fichaId());