// 1. Insertar el modal oculto en el body
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

// Función auxiliar para asignar imágenes según la marca
const getImagenMoto = (marca) => {
  const m = marca.toLowerCase();
  if (m.includes('honda')) return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop';
  if (m.includes('yamaha')) return 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600&auto=format&fit=crop';
  if (m.includes('bajaj')) return 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=600&auto=format&fit=crop';
  if (m.includes('hero')) return 'https://images.unsplash.com/photo-1558980664-10ea292d4342?q=80&w=600&auto=format&fit=crop';
  // Imagen por defecto (moto genérica)
  return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop';
};

mountPanel({ rol: 'cliente', title: 'Mi cuenta', sections: [
  { id: 'catalogo', label: 'Motos disponibles', async render(v) {
    const ms = await api('/motos');
    
    if(ms.length === 0) {
      v.innerHTML = '<p class="muted">No hay motos disponibles en este momento.</p>';
      return;
    }

    v.innerHTML = `<div class="gallery">${ms.map(m => {
      // Lógica para mostrar advertencia de stock
      let stockBadge = '';
      if (m.stock === 0) stockBadge = '<span class="stock-badge" style="background:var(--bad); color:#fff">Agotado</span>';
      else if (m.stock <= 3) stockBadge = `<span class="stock-badge" style="background:var(--gold); color:#101B25">¡Solo ${m.stock}!</span>`;
      else stockBadge = `<span class="stock-badge">Stock: ${m.stock}</span>`;

      return `
      <article class="card moto-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column;">
        <div class="moto-img-container">
          <img src="${getImagenMoto(m.marca)}" class="moto-img" alt="${esc(m.marca)} ${esc(m.modelo)}">
          ${stockBadge}
        </div>
        <div style="padding: 1.5rem; display:flex; flex-direction:column; gap:0.4rem; flex:1;">
          <span class="muted" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">${esc(m.marca)} · ${m.anio}</span>
          <h2 style="margin:0; font-size:1.3rem; line-height:1.2;">${esc(m.modelo)}</h2>
          <span class="muted" style="font-size:0.9rem; margin-bottom: 0.5rem;">${esc(m.tipo)} · ${m.cc} cc</span>
          <span class="price" style="margin-top:auto;">${money(m.precio, m.moneda)}</span>
          <button class="btn" data-m="${m.id}" data-nombre="${esc(m.marca)} ${esc(m.modelo)}" ${m.stock < 1 ? 'disabled' : ''} style="width:100%; margin-top:0.5rem;">
            ${m.stock < 1 ? 'Sin Stock' : 'Solicitar esta moto'}
          </button>
        </div>
      </article>
    `}).join('')}</div>`;

    const modal = $('#modal-pedido');
    
    // Evento para abrir el modal
    v.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      motoSeleccionada = b.dataset.m;
      $('#modal-moto-nombre').textContent = `Estás solicitando: ${b.dataset.nombre}`;
      $('#modal-nota').value = '';
      modal.showModal();
    });
  } },
  
  { id: 'pedidos', label: 'Mis pedidos', async render(v) {
    const ps = await api('/pedidos/mios');
    v.innerHTML = table([
      ['N.º', p => `<b>#${p.id}</b>`], 
      ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Moto', p => `<b>${esc(p.moto)}</b>`], 
      ['Estado', p => `<span class="tag ${p.estado}">${ESTADOS[p.estado]}</span>`]
    ], ps, 'Aún no solicitaste ninguna moto. Elige una en “Motos disponibles”.');
  } },
] });

// Eventos del Modal
$('#modal-cancel').onclick = () => $('#modal-pedido').close();

$('#modal-confirm').onclick = async () => {
  const nota = $('#modal-nota').value;
  $('#modal-confirm').disabled = true;
  $('#modal-confirm').textContent = 'Enviando...';
  
  try {
    await api('/pedidos', { method: 'POST', body: { moto_id: +motoSeleccionada, nota } });
    $('#modal-pedido').close();
    toast('¡Pedido enviado con éxito!');
    location.hash = '#pedidos'; // Redirige a la pestaña de pedidos
  } catch (e) {
    toast(e.message);
  } finally {
    $('#modal-confirm').disabled = false;
    $('#modal-confirm').textContent = 'Confirmar Pedido';
  }
};