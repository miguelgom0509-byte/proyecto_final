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
    dispatchEvent(new Event('favschange'));
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
const SECCIONES = [
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

    const tipos = ['Todas', ...new Set(motos.map(m => m.tipo))];   // 'Todas' = sin filtro
    let tipo = tipos.includes(tipoInicial) ? tipoInicial : 'Todas';
    const enUsd = m => m.moneda === 'USD' ? m.precio : m.precio / TIPO_CAMBIO;
    calcEtiquetas(motos);
    const nombre = session.user ? session.user.nombre.split(' ')[0] : '';
    const disponibles = motos.filter(m => m.stock > 0);
    const unidades = disponibles.reduce((t, m) => t + m.stock, 0);
    const desde = disponibles.length ? disponibles.reduce((a, b) => enSoles(a) <= enSoles(b) ? a : b) : null;
    const recortadas = disponibles.filter(m => (m.imagen || '').endsWith('.webp'));
    const estrella = recortadas.find(m => /RS200/i.test(m.modelo)) || [...recortadas].sort((a, b) => enSoles(b) - enSoles(a))[0] || null;
    const fotoTipo = {};
    const PREF = { Utilitaria: 'ct-125', Urbana: 'discover-125-st', Naked: 'pulsar-n160-fi', Deportiva: 'pulsar-rs200', Touring: 'dominar-400-2' };
    motos.forEach(m => { if (m.imagen && !fotoTipo[m.tipo]) fotoTipo[m.tipo] = m.imagen; });
    motos.forEach(m => { if (PREF[m.tipo] && (m.imagen || '').includes(PREF[m.tipo])) fotoTipo[m.tipo] = m.imagen; });
    const tiposSolo = tipos.slice(1);
    const cinta = [...motos].sort((a, b) => enSoles(a) - enSoles(b)).map(m => `<span class="tk-item"><b>${esc(m.modelo)}</b> ${esc(money(m.precio, m.moneda))}</span>`).join('<i class="tk-sep" aria-hidden="true"></i>');
    const ico = {
      garantia: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
      credito: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
      taller: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    };

    v.innerHTML = `
      <section class="sh-hero">
        <div class="sh-hero-text">
          <span class="sh-pill"><i></i>${motos.length} modelos listos para pedir</span>
          <h1>Elige tu moto.<span>Pídela hoy.</span></h1>
          <p>${nombre ? esc(nombre) + ', c' : 'C'}ompara modelos, mira tu cuota estimada y envía tu solicitud en minutos. Un asesor te confirma stock y financiamiento.</p>
          <div class="sh-actions">
            <button type="button" class="btn btn-primary btn-xl" id="ir-modelos">Ver modelos</button>
            <a class="btn btn-ghost btn-xl" href="${WA}?text=${encodeURIComponent('Hola, quiero información sobre una moto')}" target="_blank" rel="noopener">Hablar con un asesor</a>
          </div>
          <ul class="sh-stats">
            ${desde ? `<li><b>${esc(money(desde.precio, desde.moneda))}</b><span>precio desde</span></li>` : ''}
            <li><b>36</b><span>meses de financiamiento</span></li>
            <li><b>${unidades}</b><span>unidades en stock</span></li>
          </ul>
        </div>
        <div class="sh-hero-bike">
          ${estrella ? `<span class="sh-ghost" aria-hidden="true">${esc(estrella.modelo.replace(/^Pulsar\s+/i, ''))}</span>
          <img src="${esc(estrella.imagen)}" alt="${esc(estrella.marca)} ${esc(estrella.modelo)}">
          <a class="sh-tag" href="#ficha/${estrella.id}"><small>${esc(estrella.marca)} ${esc(estrella.modelo)}</small><b>${esc(money(estrella.precio, estrella.moneda))}</b><span>Ver ficha</span></a>`
          : `<img class="sh-fondo" src="/recursos/image/fondo.jpeg" alt="Motos nuevas Henvi del Sur">`}
        </div>
      </section>

      <div class="ticker" aria-hidden="true"><div class="ticker-track"><div class="tk-set">${cinta}<i class="tk-sep"></i></div><div class="tk-set">${cinta}<i class="tk-sep"></i></div></div></div>

      <section class="sh-sec" id="tipos">
        <div class="sh-head"><h2>¿Qué tipo de moto buscas?</h2><p>Toca un tipo para filtrar el catálogo.</p></div>
        <div class="sh-tipos" id="tabs">
          ${tiposSolo.map(t => `<button type="button" class="sh-tipo ${t === tipo ? 'active' : ''}" data-tipo="${esc(t)}" aria-pressed="${t === tipo}">
            <img src="${esc(fotoTipo[t] || IMG_FALLBACK)}" alt="" loading="lazy"><b>${esc(t)}</b><span>${motos.filter(m => m.tipo === t).length} modelos</span></button>`).join('')}
        </div>
      </section>

      <section class="sh-sec" id="catalogo-lista">
        <div class="catalog-header">
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
        <div class="gallery" id="grid"></div>
        <div class="sh-more" id="mas"></div>
        <p class="sales-nota">* Cuota referencial con 20 % de inicial, 36 meses y TEA 15 %. No incluye seguros ni gastos administrativos; el asesor confirma la cuota final.</p>
      </section>

      <section class="sh-sec sh-why">
        <div class="sh-head"><h2>Comprar con Henvi del Sur</h2></div>
        <div class="sh-why-grid">
          <article><span class="sh-ico">${ico.garantia}</span><h3>Garantía oficial</h3><p>Todas las motos nuevas salen con garantía del fabricante.</p></article>
          <article><span class="sh-ico">${ico.credito}</span><h3>Financiamiento a tu medida</h3><p>Elige tu inicial y los meses; simula la cuota antes de decidir.</p></article>
          <article><span class="sh-ico">${ico.taller}</span><h3>Servicio técnico</h3><p>Mantenimiento especializado para que tu moto rinda siempre.</p></article>
        </div>
      </section>

      <section class="sh-sec sh-fin" id="financiamiento">
        <div class="sh-fin-card">
          <div class="sh-fin-text">
            <h2>Calcula tu cuota</h2>
            <p>Mueve la inicial y los meses: ves al instante cuánto pagarías al mes.</p>
            <label for="f-moto">Moto</label>
            <select id="f-moto">${disponibles.map(m => `<option value="${m.id}">${esc(m.modelo)}, ${esc(money(m.precio, m.moneda))}</option>`).join('')}</select>
            <label for="f-ini">Inicial: <b id="f-ini-v">20 %</b></label>
            <input id="f-ini" type="range" min="10" max="50" step="5" value="20">
            <label for="f-mes">Plazo</label>
            <select id="f-mes"><option>12</option><option>24</option><option selected>36</option><option>48</option></select>
          </div>
          <div class="sh-fin-out">
            <span>Tu cuota mensual</span>
            <b id="f-cuota">—</b>
            <small id="f-detalle"></small>
            <button type="button" class="btn btn-primary btn-xl" id="f-pedir">Solicitar esta moto</button>
            <em>Cuota referencial con TEA 15 %. El asesor confirma la cuota final.</em>
          </div>
        </div>
      </section>

      <section class="sh-sec sh-steps" id="como">
        <div class="sh-head"><h2>Pedir tu moto es fácil</h2></div>
        <ol>
          <li><b>1</b><div><strong>Elige tu moto</strong><span>Compara modelos y revisa su ficha técnica.</span></div></li>
          <li><b>2</b><div><strong>Envía tu solicitud</strong><span>Con tu cuenta, en un clic y sin salir de casa.</span></div></li>
          <li><b>3</b><div><strong>Un asesor te contacta</strong><span>Confirma disponibilidad, financiamiento y entrega.</span></div></li>
        </ol>
      </section>

      <section class="sh-cta">
        <div><h2>¿Dudas sobre qué moto elegir?</h2><p>Cuéntanos tu presupuesto y para qué la usarás: te recomendamos la mejor opción.</p></div>
        <a class="btn btn-primary btn-xl" href="${WA}?text=${encodeURIComponent('Hola, necesito ayuda para elegir una moto')}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
      </section>`;
    $('#ir-modelos').onclick = () => irA('catalogo-lista');

    // Calculadora de cuota
    const calc = () => {
      const m = motos.find(x => x.id === +$('#f-moto').value); if (!m) return;
      const pct = +$('#f-ini').value / 100, n = +$('#f-mes').value;
      $('#f-ini-v').textContent = Math.round(pct * 100) + ' %';
      $('#f-cuota').textContent = money(cuotaMensual(m, pct, n));
      $('#f-detalle').textContent = `Inicial ${money(enSoles(m) * pct)} · a financiar ${money(enSoles(m) * (1 - pct))} en ${n} meses`;
    };
    ['f-moto', 'f-ini', 'f-mes'].forEach(id => $('#' + id).addEventListener('input', calc));
    $('#f-pedir').onclick = () => solicitar(+$('#f-moto').value, again);
    calc();

    let verTodas = false;
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
      // Sin filtros se muestran las primeras 8; con filtros o al pedirlo, todas
      const hayFiltro = tipo !== 'Todas' || q || ccMax !== null || precioMax !== null;
      const visibles = (verTodas || hayFiltro) ? lista : lista.slice(0, 8);
      grid.innerHTML = lista.length ? visibles.map(tarjeta).join('')
        : vacio('🏍️', 'Sin resultados', 'Prueba con otra búsqueda o categoría.');
      enlazar(grid, { again });
      $('#mas').innerHTML = visibles.length < lista.length
        ? `<button type="button" class="btn btn-ghost btn-xl" id="ver-todas">Ver los ${lista.length} modelos</button>` : '';
      const vt = $('#ver-todas'); if (vt) vt.onclick = () => { verTodas = true; pintar(); };
    };

    $('#q').oninput = e => { texto = e.target.value; pintar(); };
    $('#ord').onchange = e => { orden = e.target.value; pintar(); };
    $('#tabs').onclick = e => {
      const b = e.target.closest('[data-tipo]'); if (!b) return;
      tipo = (tipo === b.dataset.tipo) ? 'Todas' : b.dataset.tipo;   // tocar de nuevo quita el filtro
      document.querySelectorAll('.sh-tipo').forEach(x => { const on = x.dataset.tipo === tipo; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on); });
      pintar();
      if (tipo !== 'Todas') irA('catalogo-lista');
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
];

mountShop(SECCIONES);

if (fichaId()) renderFicha(fichaId());
// ---------------------------------------------------------------- Estructura de la tienda (página de ventas)
let pendienteScroll = null;
function irA(id) {
  const el = document.getElementById(id);
  if (el && ($('#view') || document).contains(el)) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  pendienteScroll = id;
  if (location.hash.slice(1) === 'catalogo') dispatchEvent(new Event('hashchange')); else location.hash = 'catalogo';
}

function mountShop(sections) {
  const u = session.user;
  if (session.token && u && u.rol !== 'cliente') { location.href = HOME[u.rol] || '/login.html'; return; }
  const nombre = u ? (u.nombre || 'Cliente') : '';
  const volver = encodeURIComponent(location.pathname + location.hash);
  document.body.className = 'theme-dark shop';
  document.body.innerHTML = `
    <a class="skip-link" href="#view">Saltar al contenido</a>
    <div class="shop-bar">Financiamiento a 36 meses · Atención por <a href="${WA}" target="_blank" rel="noopener">WhatsApp</a></div>
    <header class="shop-nav">
      <div class="shop-nav-in">
        <a href="/" class="shop-logo" aria-label="Henvi del Sur, ir al inicio"><img src="/recursos/image/logo.jpeg" alt="Henvi del Sur"></a>
        <button class="shop-burger" id="burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="shop-links"><span></span><span></span><span></span></button>
        <nav class="shop-links" id="shop-links" aria-label="Principal">
          <a href="#catalogo" data-nav="catalogo">Modelos</a>
          <a href="#catalogo" data-scroll="financiamiento">Financiamiento</a>
          <a href="#catalogo" data-scroll="como">Cómo comprar</a>
          <a href="#favoritos" data-nav="favoritos">Favoritos <i class="shop-count" id="fav-count" hidden>0</i></a>
          <a href="#pedidos" data-nav="pedidos">Mis pedidos</a>
        </nav>
        <div class="shop-user">
          ${u ? `<span class="shop-avatar" aria-hidden="true">${esc(nombre.charAt(0).toUpperCase())}</span><span class="shop-name">${esc(nombre.split(' ')[0])}</span><button id="out" class="btn btn-ghost btn-sm" type="button">Salir</button>`
              : `<a class="btn btn-primary btn-sm" href="/login.html?comprar=true&next=${volver}">Iniciar sesión</a>`}
        </div>
      </div>
    </header>
    <main id="view" class="shop-main" aria-live="polite"></main>
    <footer class="shop-foot">
      <div class="shop-foot-in">
        <div><img src="/recursos/image/logo.jpeg" alt="Henvi del Sur"><p>Motos nuevas con financiamiento y atención personalizada.</p></div>
        <div><b>Tienda</b><a href="#catalogo">Modelos</a><a href="#favoritos">Favoritos</a><a href="#pedidos">Mis pedidos</a></div>
        <div><b>Contacto</b><a href="${WA}" target="_blank" rel="noopener">WhatsApp 922 681 908</a><a href="/">Volver al inicio</a></div>
      </div>
      <p class="shop-copy">© ${new Date().getFullYear()} Henvi del Sur EIRL</p>
    </footer>
    <a class="wa-float" href="${WA}?text=${encodeURIComponent('Hola, quiero información sobre una moto')}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.8.9.9-2.7-.2-.3a9 9 0 1 1 7 3.6zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4.1c1.7.7 2.4.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>
    </a>
    <span id="ttl" hidden></span>
    <div id="toast" role="status"></div>`;

  if (u) $('#out').onclick = () => { session.clear(); location.href = '/login.html'; };
  const burger = $('#burger'), links = $('#shop-links');
  burger.onclick = () => { const a = links.classList.toggle('open'); burger.setAttribute('aria-expanded', a); };
  links.onclick = e => {
    const a = e.target.closest('a'); if (!a) return;
    links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
    if (a.dataset.scroll) { e.preventDefault(); irA(a.dataset.scroll); }
  };
  const contarFavs = () => { const n = favs.get().length, c = $('#fav-count'); c.textContent = n; c.hidden = !n; };
  addEventListener('favschange', contarFavs); contarFavs();

  let ultimo = 0, hashPrevio = null;
  const go = async (conservar) => {
    const hash = location.hash.slice(1);
    const mio = ++ultimo;
    const cambio = hash !== hashPrevio; hashPrevio = hash;
    const v = $('#view');
    const id = fichaId();
    const s = sections.find(x => x.id === hash) || sections[0];
    document.querySelectorAll('.shop-links [data-nav]').forEach(a => a.classList.toggle('active', !id && a.dataset.nav === s.id));
    v.className = 'shop-main' + (s.id === 'catalogo' && !id ? '' : ' shop-narrow');
    if (cambio && !conservar) window.scrollTo(0, 0);
    const y = window.scrollY;
    if (!conservar || id) v.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';
    try {
      if (id) await renderFicha(id);
      else await s.render(v, () => go(true));
      if (mio !== ultimo) return;
      if (conservar && !id) window.scrollTo(0, y);
      if (pendienteScroll) { const el = document.getElementById(pendienteScroll); pendienteScroll = null; el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    } catch (e) {
      if (mio === ultimo) v.innerHTML = `<div class="error-state"><p>${esc(e.message)}</p></div>`;
    }
  };
  window.onhashchange = () => go();
  go();
}