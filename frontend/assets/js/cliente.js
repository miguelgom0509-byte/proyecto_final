document.body.insertAdjacentHTML('beforeend', `
  <dialog id="modal-pedido" class="card" style="border:none; box-shadow:var(--shadow-lg); max-width:420px; width:90%; border-radius:16px; background:var(--card);">
    <h2 style="margin-top:0; font-size:1.4rem; color:var(--ink);">Solicitar Moto</h2>
    <p class="muted" id="modal-moto-nombre" style="margin-bottom:1.5rem; font-weight:600; color:var(--gold-h)"></p>
    <label style="margin-bottom:1rem; color:var(--ink);">Nota o comentario (opcional)
      <input type="text" id="modal-nota" placeholder="Ej: Color rojo, entrega el viernes..." style="background:var(--bg); color:var(--ink);">
    </label>
    <div style="display:flex; gap:1rem; margin-top:1.5rem; justify-content:flex-end;">
      <button class="btn ghost" id="modal-cancel" type="button">Cancelar</button>
      <button class="btn" id="modal-confirm">Confirmar Pedido</button>
    </div>
  </dialog>
`);

let motoSeleccionada = null;
let todasLasMotos = [];
let categoriaActual = 'todos';
let textoBusqueda = '';
let ordenActual = 'recomendados';

// --- Lógica de Favoritos ---
function getFavoritos() {
    try { return JSON.parse(localStorage.getItem('moto_favoritos')) || []; } 
    catch { return []; }
}
function toggleFavorito(id) {
    let favs = getFavoritos();
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.push(id);
    localStorage.setItem('moto_favoritos', JSON.stringify(favs));
    return favs.includes(id);
}

// --- Generador de Descripción Breve ---
function generarDescripcion(m) {
    const tipo = m.tipo.toLowerCase();
    let desc = '';
    if (tipo.includes('scooter')) desc = 'Ágil y eficiente para la ciudad.';
    else if (tipo.includes('naked')) desc = 'Potencia y estilo urbano.';
    else if (tipo.includes('deportiva')) desc = 'Máximo rendimiento y velocidad.';
    else if (tipo.includes('utilitaria')) desc = 'Resistente y económica para el trabajo.';
    else if (tipo.includes('todo terreno') || tipo.includes('enduro')) desc = 'Domina cualquier camino.';
    else desc = 'Calidad y rendimiento garantizado.';
    return `${desc} Motor de ${m.cc} cc, ideal para tus recorridos diarios.`;
}

// --- Enriquecimiento de datos técnicos simulados ---
function enriquecerMoto(m) {
    if (!m.potencia) {
        m.potencia = Math.round(m.cc * 0.08) + ' HP';
        m.torque = Math.round(m.cc * 0.09) + ' Nm';
        m.rendimiento = Math.round(2000 / m.cc) + ' km/gal';
        m.peso = 100 + Math.round(m.cc * 0.2) + ' kg';
        m.garantia = '24 meses / 20,000 km';
        m.colores = ['Negro', 'Rojo', 'Azul'];
        m.motor = '4 Tiempos, Monocilíndrico, OHC';
        m.frenos = 'Disco delantero / Tambor posterior';
        m.llantas = 'Aleación';
    }
    return m;
}

// --- Renderizado de la Galería ---
function actualizarGaleria() {
  const container = $('#gallery-container');
  if (!container) return;

  const favs = getFavoritos();

  let filtradas = categoriaActual === 'todos' 
    ? [...todasLasMotos] 
    : todasLasMotos.filter(m => m.tipo.toLowerCase() === categoriaActual.toLowerCase());

  if (textoBusqueda) {
    filtradas = filtradas.filter(m => 
      m.marca.toLowerCase().includes(textoBusqueda) || 
      m.modelo.toLowerCase().includes(textoBusqueda)
    );
  }

  if (ordenActual === 'menor_precio') filtradas.sort((a, b) => a.precio - b.precio);
  else if (ordenActual === 'mayor_precio') filtradas.sort((a, b) => b.precio - a.precio);
  else if (ordenActual === 'recientes') filtradas.sort((a, b) => b.anio - a.anio);

  if(filtradas.length === 0) {
    container.innerHTML = '<p class="muted" style="text-align:center; grid-column:1/-1; padding: 3rem 1rem;">No se encontraron motos con esos filtros.</p>';
    return;
  }

  const IMAGEN_FALLBACK = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop';

  container.innerHTML = `<div class="gallery">${filtradas.map(m => {
    let stockBadge = m.stock === 0 ? '<span class="stock-badge badge-danger">Agotado</span>' 
                  : (m.stock <= 3 ? `<span class="stock-badge badge-warning">Últimas ${m.stock} un.</span>` 
                  : `<span class="stock-badge badge-success">Disponible</span>`);
    
    const imgUrl = m.imagen ? m.imagen : IMAGEN_FALLBACK;
    const esFav = favs.includes(m.id);
    const descripcionBreve = generarDescripcion(m);

    return `
    <article class="card moto-card animate-up">
      <div class="moto-img-container">
        <img src="${imgUrl}" class="moto-img" alt="${esc(m.marca)} ${esc(m.modelo)}" onerror="this.onerror=null; this.src='${IMAGEN_FALLBACK}';">
        ${stockBadge}
        <button class="btn-fav ${esFav ? 'active' : ''}" data-fav="${m.id}" aria-label="Agregar a favoritos">
            ${esFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="moto-info">
        <div class="moto-header">
            <span class="moto-brand">${esc(m.marca)}</span>
            <span class="moto-year">${m.anio}</span>
        </div>
        <h3 class="moto-model">${esc(m.modelo)}</h3>
        <p class="moto-desc">${descripcionBreve}</p>
        
        <div class="moto-footer">
            <span class="moto-price">${money(m.precio, m.moneda)}</span>
            <div style="display:flex; gap:0.5rem;">
                <a href="#ficha/${m.id}" class="btn btn-outline sm">Ver Ficha</a>
                <button class="btn btn-buy" data-m="${m.id}" data-nombre="${esc(m.marca)} ${esc(m.modelo)}" ${m.stock < 1 ? 'disabled' : ''}>
                ${m.stock < 1 ? 'Sin Stock' : 'Solicitar'}
                </button>
            </div>
        </div>
      </div>
    </article>
    `;
  }).join('')}</div>`;

  // Eventos
  const modalPedido = $('#modal-pedido');

  container.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    if (!session.token) { location.href = '/login.html?comprar=true'; return; }
    motoSeleccionada = b.dataset.m;
    $('#modal-moto-nombre').textContent = `Estás solicitando: ${b.dataset.nombre}`;
    $('#modal-nota').value = '';
    modalPedido.showModal();
  });

  container.querySelectorAll('[data-fav]').forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const id = parseInt(b.dataset.fav);
    const isFav = toggleFavorito(id);
    b.classList.toggle('active', isFav);
    b.innerHTML = isFav ? '❤️' : '🤍';
    if(isFav) toast('Agregado a favoritos');
  });
}

// --- Renderizado de la Ficha Técnica ---
function renderFicha(motoId, container) {
    const moto = todasLasMotos.find(m => m.id === parseInt(motoId));
    if (!moto) {
        container.innerHTML = `<p class="err">Moto no encontrada.</p>`;
        return;
    }
    const m = enriquecerMoto(moto);
    const IMAGEN_FALLBACK = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop';
    const imgUrl = m.imagen ? m.imagen : IMAGEN_FALLBACK;

    container.innerHTML = `
    <div class="ficha-container animate-up">
        <div style="margin-bottom: 1.5rem;">
            <a href="#catalogo" class="btn ghost sm">← Volver al catálogo</a>
        </div>

        <div class="ficha-grid">
            <div class="ficha-imagen-col">
                <div class="ficha-imagen-principal">
                    <img src="${imgUrl}" alt="${esc(m.marca)} ${esc(m.modelo)}" onerror="this.onerror=null; this.src='${IMAGEN_FALLBACK}';">
                </div>
                <div class="ficha-precio-box">
                    <span class="ficha-precio-label">Precio referencial</span>
                    <span class="ficha-precio-valor">${money(m.precio, m.moneda)}</span>
                    <button class="btn btn-primary" id="ficha-btn-solicitar" style="width:100%; margin-top:1rem;" ${m.stock < 1 ? 'disabled' : ''}>
                        ${m.stock < 1 ? 'Sin Stock' : 'Solicitar esta moto'}
                    </button>
                </div>
            </div>

            <div class="ficha-detalles-col">
                <span class="moto-brand" style="font-size:0.9rem;">${esc(m.marca)} · ${m.anio}</span>
                <h1 class="ficha-titulo">${esc(m.modelo)}</h1>
                <p class="ficha-descripcion">${generarDescripcion(m)}</p>

                <div class="ficha-specs-grid">
                    <div class="ficha-spec-item">
                        <span class="spec-label">Cilindrada</span>
                        <span class="spec-valor">${m.cc} cc</span>
                    </div>
                    <div class="ficha-spec-item">
                        <span class="spec-label">Potencia</span>
                        <span class="spec-valor">${m.potencia}</span>
                    </div>
                    <div class="ficha-spec-item">
                        <span class="spec-label">Torque</span>
                        <span class="spec-valor">${m.torque}</span>
                    </div>
                    <div class="ficha-spec-item">
                        <span class="spec-label">Rendimiento</span>
                        <span class="spec-valor">${m.rendimiento}</span>
                    </div>
                    <div class="ficha-spec-item">
                        <span class="spec-label">Peso</span>
                        <span class="spec-valor">${m.peso}</span>
                    </div>
                    <div class="ficha-spec-item">
                        <span class="spec-label">Garantía</span>
                        <span class="spec-valor">${m.garantia}</span>
                    </div>
                </div>

                <div class="ficha-seccion">
                    <h3>Motor y Sistema Eléctrico</h3>
                    <p>${m.motor}</p>
                </div>
                <div class="ficha-seccion">
                    <h3>Frenos y Llantas</h3>
                    <p>${m.frenos} · Llantas de ${m.llantas}</p>
                </div>
                <div class="ficha-seccion">
                    <h3>Colores Disponibles</h3>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
                        ${m.colores.map(c => `<span class="tag pendiente">${c}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    const btnSolicitar = $('#ficha-btn-solicitar');
    if (btnSolicitar) {
        btnSolicitar.onclick = () => {
            if (!session.token) { location.href = '/login.html?comprar=true'; return; }
            motoSeleccionada = m.id;
            $('#modal-moto-nombre').textContent = `Estás solicitando: ${m.marca} ${m.modelo}`;
            $('#modal-nota').value = '';
            $('#modal-pedido').showModal();
        };
    }
}

// --- Estructura Principal del Panel de Cliente ---
mountPanel({ rol: 'cliente', title: 'Mi cuenta', sections: [
  { id: 'catalogo', label: 'Catálogo', async render(v) {
    // Solo cargamos las motos si no las tenemos ya
    if(todasLasMotos.length === 0) {
        todasLasMotos = await api('/motos');
    }
    
    const categoriasDB = [...new Set(todasLasMotos.map(m => m.tipo))].sort();
    
    let categoriasHTML = `<button class="category-tab active" data-cat="todos">Todos los modelos</button>`;
    categoriasDB.forEach(cat => {
      categoriasHTML += `<button class="category-tab" data-cat="${cat}">${cat}</button>`;
    });

    v.innerHTML = `
      <div class="catalog-header animate-up">
        <div class="catalog-title">
            <h2>Catálogo de Motos</h2>
            <p class="muted">Encuentra el modelo perfecto para ti</p>
        </div>
        
        <div class="catalog-actions">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="search-moto" placeholder="Buscar modelo o marca...">
            </div>
            <div class="sort-wrapper">
                <select id="sort-moto">
                    <option value="recomendados">Recomendados</option>
                    <option value="menor_precio">Precio más bajo</option>
                    <option value="mayor_precio">Precio más alto</option>
                    <option value="recientes">Más Recientes</option>
                </select>
            </div>
        </div>
      </div>

      <div class="category-tabs animate-up delay-1">
        ${categoriasHTML}
      </div>
      
      <div id="gallery-container"></div>
    `;

    actualizarGaleria();

    v.querySelectorAll('.category-tab').forEach(btn => {
      btn.onclick = () => {
        v.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        categoriaActual = btn.dataset.cat;
        actualizarGaleria();
      };
    });

    $('#search-moto').oninput = (e) => {
      textoBusqueda = e.target.value.toLowerCase();
      actualizarGaleria();
    };

    $('#sort-moto').onchange = (e) => {
        ordenActual = e.target.value;
        actualizarGaleria();
    };

    const busquedaInicial = sessionStorage.getItem('busqueda_inicial');
    if (busquedaInicial) {
        $('#search-moto').value = busquedaInicial;
        textoBusqueda = busquedaInicial.toLowerCase();
        sessionStorage.removeItem('busqueda_inicial');
        actualizarGaleria();
    }
  } },
  
  { id: 'favoritos', label: 'Mis Favoritos', async render(v) {
    const favsIds = getFavoritos();
    if(favsIds.length === 0) {
        v.innerHTML = `<div class="empty-state animate-up">
            <div style="font-size: 4rem; margin-bottom: 1rem;">💔</div>
            <h2>Aún no tienes favoritos</h2>
            <p class="muted">Explora el catálogo y guarda las motos que más te gusten.</p>
            <a href="#catalogo" class="btn btn-primary" style="margin-top: 1rem;">Ir al catálogo</a>
        </div>`;
        return;
    }
    
    if(todasLasMotos.length === 0) todasLasMotos = await api('/motos');
    const favoritas = todasLasMotos.filter(m => favsIds.includes(m.id));
    
    v.innerHTML = `<h2 class="section-title animate-up">Mis Favoritos (${favoritas.length})</h2>
    <div class="gallery animate-up delay-1" id="fav-gallery"></div>`;
    
    const originalGallery = $('#gallery-container');
    const favContainer = $('#fav-gallery');
    
    favContainer.id = 'gallery-container'; 
    const motosGuardadas = todasLasMotos; // Guardamos temporal
    todasLasMotos = favoritas;
    categoriaActual = 'todos';
    textoBusqueda = '';
    actualizarGaleria();
    
    favContainer.id = 'fav-gallery';
    todasLasMotos = motosGuardadas; // Restauramos
    if(originalGallery) originalGallery.id = 'gallery-container';
  } },
  
  { id: 'pedidos', label: 'Mis Pedidos', async render(v) {
    const ps = await api('/pedidos/mios');
    v.innerHTML = `<h2 class="section-title animate-up">Historial de Pedidos</h2>
    <div class="animate-up delay-1">` + table([
      ['N.º', p => `<b>#${p.id}</b>`], 
      ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Moto', p => `<b>${esc(p.moto)}</b>`], 
      ['Nota', p => p.nota ? esc(p.nota) : '<span class="muted">—</span>'],
      ['Estado', p => `<span class="tag ${p.estado}">${ESTADOS[p.estado]}</span>`]
    ], ps, 'Aún no has solicitado ninguna moto.') + `</div>`;
  } },
] });

// --- Eventos Globales de los Modales ---
$('#modal-cancel').onclick = () => $('#modal-pedido').close();
$('#modal-confirm').onclick = async () => {
  const nota = $('#modal-nota').value;
  $('#modal-confirm').disabled = true; $('#modal-confirm').textContent = 'Enviando...';
  try {
    await api('/pedidos', { method: 'POST', body: { moto_id: +motoSeleccionada, nota } });
    $('#modal-pedido').close(); toast('¡Pedido enviado con éxito!');
    location.hash = '#pedidos'; 
  } catch (e) { toast(e.message); } 
  finally { $('#modal-confirm').disabled = false; $('#modal-confirm').textContent = 'Confirmar Pedido'; }
};

// --- LÓGICA DEFINITIVA DE ENRUTAMIENTO PARA LA FICHA ---
async function checkFichaRoute() {
    if (location.hash.startsWith('#ficha/')) {
        const id = location.hash.split('/')[1];
        const view = $('#view');
        if (view) {
            view.innerHTML = '<p class="muted" style="padding:2rem;">Cargando ficha técnica...</p>';
            
            // Si la lista está vacía (el usuario recargó la página en la ficha), descargamos los datos.
            if (todasLasMotos.length === 0) {
                try {
                    todasLasMotos = await api('/motos');
                } catch (e) {
                    view.innerHTML = '<p class="err">Error de conexión al cargar la moto.</p>';
                    return;
                }
            }
            
            renderFicha(id, view);
            
            // Actualizar la barra lateral
            document.querySelectorAll('.side nav a').forEach(a => a.classList.remove('on'));
            const title = document.getElementById('ttl');
            if(title) title.textContent = 'Ficha Técnica';
        }
    }
}

// Escuchar cambios en la URL
window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#ficha/')) {
        checkFichaRoute();
    }
});

// Ejecutar al cargar la página por si el usuario ya estaba en una ficha
setTimeout(checkFichaRoute, 100);