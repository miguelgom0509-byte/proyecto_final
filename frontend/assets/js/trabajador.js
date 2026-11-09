mountPanel({ rol: 'trabajador', title: 'Panel de trabajador', sections: [
  { id: 'pedidos', label: 'Pedidos', async render(v, again) {
    const ps = await api('/pedidos');
    v.innerHTML = table([
      ['N.º', p => `<b>#${p.id}</b>`], 
      ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Cliente', p => esc(p.cliente)], 
      ['Moto', p => `<b>${esc(p.moto)}</b>`], 
      ['Nota', p => p.nota ? `<i>"${esc(p.nota)}"</i>` : '<span class="muted">—</span>'],
      ['Estado', p => `<select data-p="${p.id}" style="min-height:36px; font-size:0.85rem; font-weight:600; ${p.estado === 'entregado' ? 'border-color:var(--ok); color:var(--ok)' : ''}">
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
      ['Actualizar', m => `
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="number" min="0" value="${m.stock}" id="s${m.id}" style="width:80px; min-height:36px; text-align:center; font-weight:700;">
          <button class="btn sm" data-s="${m.id}">Guardar</button>
        </div>`]
    ], ms);
    
    v.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      const nuevoStock = +$('#s' + b.dataset.s).value;
      run(() => api(`/motos/${b.dataset.s}/stock`, { method: 'PATCH', body: { stock: nuevoStock } }), 'Stock guardado correctamente', again);
    });
  } },
] });