mountPanel({ rol: 'trabajador', title: 'Panel de trabajador', sections: [
  { id: 'pedidos', label: 'Pedidos', async render(v, again) {
    const ps = await api('/pedidos');
    v.innerHTML = table([['N.º', p => p.id], ['Fecha', p => fecha(p.creado)], ['Cliente', p => esc(p.cliente)], ['Moto', p => esc(p.moto)], ['Nota', p => esc(p.nota) || '—'],
      ['Estado', p => `<select data-p="${p.id}" aria-label="Estado del pedido ${p.id}">${Object.entries(ESTADOS).map(([k, l]) => `<option value="${k}" ${k === p.estado ? 'selected' : ''}>${l}</option>`).join('')}</select>`]], ps, 'No hay pedidos por atender.');
    v.querySelectorAll('[data-p]').forEach(s => s.onchange = () => run(() => api(`/pedidos/${s.dataset.p}/estado`, { method: 'PATCH', body: { estado: s.value } }), 'Pedido actualizado', again));
  } },
  { id: 'inventario', label: 'Inventario', async render(v, again) {
    const ms = await api('/motos');
    v.innerHTML = table([['Moto', m => `<b>${esc(m.marca)}</b> ${esc(m.modelo)}`], ['Stock', m => `<input type="number" min="0" value="${m.stock}" id="s${m.id}" style="width:90px" aria-label="Stock de ${esc(m.modelo)}">`],
      ['', m => `<button class="btn sm" data-s="${m.id}">Guardar</button>`]], ms);
    v.querySelectorAll('[data-s]').forEach(b => b.onclick = () => run(() => api(`/motos/${b.dataset.s}/stock`, { method: 'PATCH', body: { stock: +$('#s' + b.dataset.s).value } }), 'Stock guardado', again));
  } },
] });
