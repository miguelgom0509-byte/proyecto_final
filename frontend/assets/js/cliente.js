// 1. Agregamos un modal oculto al body para pedir la nota
document.body.insertAdjacentHTML('beforeend', `
  <dialog id="modal-pedido" class="card" style="border:none; box-shadow:var(--shadow-lg); max-width:400px; width:90%;">
    <h2 style="margin-top:0">Solicitar Moto</h2>
    <p class="muted" id="modal-moto-nombre" style="margin-bottom:1.5rem"></p>
    <label>Nota o comentario (opcional)
      <input type="text" id="modal-nota" placeholder="Ej: Color rojo, entrega el viernes...">
    </label>
    <div style="display:flex; gap:1rem; margin-top:1.5rem; justify-content:flex-end;">
      <button class="btn ghost" id="modal-cancel">Cancelar</button>
      <button class="btn" id="modal-confirm">Confirmar Pedido</button>
    </div>
  </dialog>
`);

let motoSeleccionada = null;

mountPanel({ rol: 'cliente', title: 'Mi cuenta', sections: [
  { id: 'catalogo', label: 'Motos disponibles', async render(v) {
    const ms = await api('/motos');
    
    if(ms.length === 0) {
      v.innerHTML = '<p class="muted">No hay motos disponibles en este momento.</p>';
      return;
    }

    v.innerHTML = `<div class="gallery">${ms.map(m => `
      <article class="card">
        <div style="background:var(--bg); border-radius:10px; height:120px; display:grid; place-items:center; font-size:3rem; margin-bottom:0.5rem;">🏍️</div>
        <span class="muted" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">${esc(m.marca)} · ${m.anio}</span>
        <h2 style="margin:0; font-size:1.4rem;">${esc(m.modelo)}</h2>
        <span class="muted" style="font-size:0.9rem;">${esc(m.tipo)} · ${m.cc} cc</span>
        <span class="price">${money(m.precio, m.moneda)}</span>
        <button class="btn" data-m="${m.id}" data-nombre="${esc(m.marca)} ${esc(m.modelo)}" ${m.stock < 1 ? 'disabled' : ''}>
          ${m.stock < 1 ? 'Agotado' : 'Solicitar esta moto'}
        </button>
      </article>
    `).join('')}</div>`;

    // Lógica del modal
    const modal = $('#modal-pedido');
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

// 3. Eventos del Modal
$('#modal-cancel').onclick = () => $('#modal-pedido').close();
$('#modal-confirm').onclick = async () => {
  const nota = $('#modal-nota').value;
  $('#modal-confirm').disabled = true;
  $('#modal-confirm').textContent = 'Enviando...';
  
  try {
    await api('/pedidos', { method: 'POST', body: { moto_id: +motoSeleccionada, nota } });
    $('#modal-pedido').close();
    toast('Pedido enviado con éxito');
    location.hash = '#pedidos'; // Redirige a la pestaña de pedidos
  } catch (e) {
    toast(e.message);
  } finally {
    $('#modal-confirm').disabled = false;
    $('#modal-confirm').textContent = 'Confirmar Pedido';
  }
};