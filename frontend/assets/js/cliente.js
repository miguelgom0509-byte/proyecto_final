mountPanel({ rol: 'cliente', title: 'Mi cuenta', sections: [
  { id: 'catalogo', label: 'Motos disponibles', async render(v) {
    const ms = await api('/motos');
    v.innerHTML = `<div class="gallery">${ms.map(m => `<article class="card"><span class="muted">${esc(m.marca)} · ${m.anio}</span><h2 style="margin:0">${esc(m.modelo)}</h2>
      <span class="muted">${esc(m.tipo)} · ${m.cc} cc</span><span class="price">${money(m.precio, m.moneda)}</span>
      <button class="btn" data-m="${m.id}" ${m.stock < 1 ? 'disabled' : ''}>${m.stock < 1 ? 'Sin stock' : 'Solicitar esta moto'}</button></article>`).join('')}</div>`;
    v.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const nota = prompt('¿Quieres dejar un comentario para el vendedor? (opcional)') ?? null;
      if (nota !== null) run(() => api('/pedidos', { method: 'POST', body: { moto_id: +b.dataset.m, nota } }), 'Pedido enviado', () => { location.hash = '#pedidos'; });
    });
  } },
  { id: 'pedidos', label: 'Mis pedidos', async render(v) {
    v.innerHTML = table([['N.º', p => p.id], ['Fecha', p => fecha(p.creado)], ['Moto', p => esc(p.moto)], ['Estado', p => `<span class="tag ${p.estado}">${ESTADOS[p.estado]}</span>`]],
      await api('/pedidos/mios'), 'Aún no solicitaste ninguna moto. Elige una en “Motos disponibles”.');
  } },
] });
