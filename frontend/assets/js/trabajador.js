mountPanel({ rol: 'trabajador', title: 'Panel de trabajador', sections: [
  { id: 'resumen', label: 'Resumen', async render(v) {
    const ps = await api('/pedidos');
    const pendientes = ps.filter(p => p.estado === 'pendiente').length;
    const enProceso = ps.filter(p => p.estado === 'en_proceso').length;
    
    v.innerHTML = `<div class="cards">
      <div class="card stat"><span style="font-size:1.8rem">⏳</span><b>${pendientes}</b><span>Pedidos pendientes</span></div>
      <div class="card stat"><span style="font-size:1.8rem">⚙️</span><b>${enProceso}</b><span>Pedidos en proceso</span></div>
    </div>
    <h2>Acciones rápidas</h2>
    <p class="muted">Usa el menú lateral para gestionar el inventario o cambiar el estado de los pedidos.</p>`;
  } },
  
  { id: 'pedidos', label: 'Pedidos', async render(v, again) {
    const ps = await api('/pedidos');
    v.innerHTML = table([
      ['N.º', p => `<b>#${p.id}</b>`], ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Cliente', p => esc(p.cliente)], ['Moto', p => `<b>${esc(p.moto)}</b>`], 
      ['Nota', p => p.nota ? `<i>"${esc(p.nota)}"</i>` : '<span class="muted">—</span>'],
      ['Estado', p => `<select data-p="${p.id}" style="min-height:36px; font-weight:600; ${p.estado === 'entregado' ? 'border-color:var(--ok); color:var(--ok)' : ''}">
        ${Object.entries(ESTADOS).map(([k, l]) => `<option value="${k}" ${k === p.estado ? 'selected' : ''}>${l}</option>`).join('')}
      </select>`]
    ], ps, 'No hay pedidos por atender.');
    v.querySelectorAll('[data-p]').forEach(s => s.onchange = () => run(() => api(`/pedidos/${s.dataset.p}/estado`, { method: 'PATCH', body: { estado: s.value } }), 'Pedido actualizado', again));
  } },
  
  { id: 'inventario', label: 'Inventario', async render(v, again) {
    const ms = await api('/motos');
    v.innerHTML = table([
      ['Moto', m => `<b>${esc(m.marca)}</b> ${esc(m.modelo)}`], 
      ['Stock actual', m => `<span class="tag ${m.stock > 0 ? 'on' : 'off'}">${m.stock} un.</span>`],
      ['Actualizar', m => `<div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="number" min="0" value="${m.stock}" id="s${m.id}" style="width:80px; min-height:36px; text-align:center; font-weight:700; margin:0;">
          <button class="btn sm" data-s="${m.id}">Guardar</button>
        </div>`]
    ], ms);
    v.querySelectorAll('[data-s]').forEach(b => b.onclick = () => run(() => api(`/motos/${b.dataset.s}/stock`, { method: 'PATCH', body: { stock: +$('#s' + b.dataset.s).value } }), 'Stock guardado', again));
  } },
] });