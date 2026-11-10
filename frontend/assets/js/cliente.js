// Panel de Cliente: catálogo, favoritos, ficha técnica y mis pedidos.
// Depende de core.js (api, mountPanel, session, table, run, toast, esc, money, fecha).

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

function tarjeta(m) {
  const [clase, texto] = stockInfo(m);
  return `
    <article class="card moto-card animate-up">
      <div class="moto-img-container">
        <span class="stock-badge ${clase}">${texto}</span>
        <button class="btn-fav" type="button" data-fav="${m.id}" aria-label="Favorito">${favs.has(m.id) ? '❤️' : '🤍'}</button>
        <img class="moto-img" src="${esc(m.imagen || IMG_FALLBACK)}" alt="${esc(m.marca)} ${esc(m.modelo)}"
             onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
      </div>
      <div class="moto-info">
        <div class="moto-header"><span class="moto-brand">${esc(m.marca)}</span><span class="moto-year">${m.anio}</span></div>
        <h3 class="moto-model">${esc(m.modelo)}</h3>
        <p class="moto-desc">${esc(m.tipo)} · ${m.cc} cc</p>
        <div class="moto-footer">
          <span class="moto-price">${money(m.precio, m.moneda)}</span>
          <span style="display:flex; gap:.5rem;">
            <a class="btn ghost sm" href="#ficha/${m.id}">Ver ficha</a>
            <button class="btn btn-primary btn-buy" type="button" data-sol="${m.id}" ${m.stock < 1 ? 'disabled' : ''}>Solicitar</button>
          </span>
        </div>
      </div>
    </article>`;
}

async function solicitar(id, again) {
  if (!session.token) { location.href = '/login.html?comprar=true'; return; }
  const nota = prompt('¿Quieres dejar una nota para el vendedor? (opcional)');
  if (nota === null) return;
  await run(
    () => api('/pedidos', { method: 'POST', body: { moto_id: id, nota: nota.trim().slice(0, 300) } }),
    'Solicitud enviada. Puedes seguirla en "Mis pedidos"',
    again,
  );
}

// Enlaza favoritos y "Solicitar" dentro de un contenedor (se llama tras cada pintado)
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
  v.innerHTML = '<p class="muted animate-up">Cargando datos...</p>';
  try {
    const m = (await api('/motos')).find(x => x.id === id);
    if (!m) { v.innerHTML = vacio('🔎', 'Moto no encontrada', '<a href="#catalogo">Volver al catálogo</a>'); return; }
    const [clase, texto] = stockInfo(m);
    // Valores referenciales calculados a partir de la cilindrada
    const potencia = (m.cc * 0.095).toFixed(1), torque = (m.cc * 0.085).toFixed(1);
    const rendimiento = Math.max(18, Math.round(58 - m.cc / 12));
    const spec = (l, val) => `<div class="ficha-spec-item"><span class="spec-label">${l}</span><span class="spec-valor">${val}</span></div>`;
    v.innerHTML = `
      <div class="ficha-container animate-up">
        <p><a href="#catalogo">← Volver al catálogo</a></p>
        <div class="ficha-grid">
          <div class="ficha-imagen-col">
            <div class="ficha-imagen-principal">
              <img src="${esc(m.imagen || IMG_FALLBACK)}" alt="${esc(m.marca)} ${esc(m.modelo)}" onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
            </div>
            <div class="ficha-precio-box">
              <span class="ficha-precio-label">Precio</span>
              <span class="ficha-precio-valor">${money(m.precio, m.moneda)}</span>
            </div>
          </div>
          <div class="ficha-detalles-col">
            <div>
              <span class="moto-brand">${esc(m.marca)}</span>
              <h2 class="ficha-titulo">${esc(m.modelo)}</h2>
            </div>
            <p class="ficha-descripcion">${esc(m.tipo)} modelo ${m.anio}. <span class="stock-badge ${clase}" style="position:static; display:inline-block;">${texto}</span></p>
            <div class="ficha-specs-grid">
              ${spec('Cilindrada', m.cc + ' cc')}${spec('Año', m.anio)}${spec('Tipo', esc(m.tipo))}${spec('Unidades', m.stock)}
              ${spec('Potencia', potencia + ' HP')}${spec('Torque', torque + ' Nm')}${spec('Rendimiento', '~' + rendimiento + ' km/l')}
            </div>
            <div class="ficha-seccion"><h3>Nota</h3><p>Potencia, torque y rendimiento son valores referenciales calculados según la cilindrada.</p></div>
            <div style="display:flex; gap:1rem;">
              <button class="btn btn-primary" type="button" data-sol="${m.id}" ${m.stock < 1 ? 'disabled' : ''}>Solicitar esta moto</button>
              <button class="btn ghost" type="button" data-fav="${m.id}">${favs.has(m.id) ? '❤️ En favoritos' : '🤍 Guardar'}</button>
            </div>
          </div>
        </div>
      </div>`;
    enlazar(v, {
      again: () => renderFicha(id),
      onFav: () => renderFicha(id),
    });
  } catch (e) {
    v.innerHTML = `<p class="err">${esc(e.message)}</p>`;
  }
}

const fichaId = () => {
  const h = location.hash.slice(1);
  return h.startsWith('ficha/') ? parseInt(h.slice(6), 10) || null : null;
};

// ---------------------------------------------------------------- Paneles
mountPanel({ rol: 'cliente', title: 'Cliente', sections: [
  { id: 'catalogo', label: 'Catálogo', async render(v, again) {
    const motos = await api('/motos');
    let tipo = 'Todas';
    let orden = '';
    // Búsqueda que viene desde la landing (se usa una sola vez)
    let texto = sessionStorage.getItem('busqueda_inicial') || '';
    sessionStorage.removeItem('busqueda_inicial');

    const tipos = ['Todas', ...new Set(motos.map(m => m.tipo))];
    v.innerHTML = `
      <div class="catalog-header animate-up">
        <div class="catalog-title"><h2>Catálogo de motos</h2><p class="muted" id="conteo"></p></div>
        <div class="catalog-actions">
          <div class="search-wrapper"><span class="search-icon">🔍</span>
            <input id="q" type="search" placeholder="Buscar por marca o modelo..." value="${esc(texto)}"></div>
          <div class="sort-wrapper"><select id="ord" aria-label="Ordenar">
            <option value="">Ordenar por</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="anio-desc">Más recientes</option>
          </select></div>
        </div>
      </div>
      <div class="category-tabs" id="tabs">
        ${tipos.map(t => `<button type="button" class="category-tab ${t === tipo ? 'active' : ''}" data-tipo="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>
      <div class="gallery" id="grid"></div>`;

    const pintar = () => {
      const q = texto.trim().toLowerCase();
      const lista = motos
        .filter(m => (tipo === 'Todas' || m.tipo === tipo) && `${m.marca} ${m.modelo} ${m.tipo}`.toLowerCase().includes(q))
        .sort((a, b) => orden === 'precio-asc' ? a.precio - b.precio
                      : orden === 'precio-desc' ? b.precio - a.precio
                      : orden === 'anio-desc' ? b.anio - a.anio : 0);
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
    const lista = (await api('/motos')).filter(m => ids.includes(m.id));
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

// La ficha técnica (#ficha/<id>) la dibuja este archivo; core.js la deja pasar
addEventListener('hashchange', () => { const id = fichaId(); if (id) renderFicha(id); });
if (fichaId()) renderFicha(fichaId());