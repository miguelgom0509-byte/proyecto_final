const estadoTag = e => `<span class="tag ${e}">${ESTADOS[e]}</span>`;
mountPanel({ rol: 'admin', title: 'Panel administrativo', sections: [
  { id: 'resumen', label: 'Resumen', async render(v) {
    const s = await api('/admin/stats'), p = s.pedidos;
    const card = (n, l) => `<div class="card stat"><b>${n ?? 0}</b><span>${l}</span></div>`;
    v.innerHTML = `<div class="cards">${card(s.motos, 'Modelos activos')}${card(s.unidades, 'Unidades en stock')}
      ${card(p.pendiente, 'Pedidos pendientes')}${card(p.en_proceso, 'Pedidos en proceso')}${card(p.entregado, 'Pedidos entregados')}
      ${card(s.usuarios.cliente, 'Clientes')}${card(s.usuarios.trabajador, 'Trabajadores')}</div>`;
  } },
  { id: 'motos', label: 'Motos', async render(v, again) {
    const motos = await api('/motos?todas=true');
    v.innerHTML = `<form id="nf" class="grid card">${field('marca', 'Marca')}${field('modelo', 'Modelo')}${field('anio', 'Año', 'number', 'min=2000 value=2026')}
      ${field('tipo', 'Tipo')}${field('cc', 'Cilindrada (cc)', 'number', 'min=1')}${field('precio', 'Precio', 'number', 'min=1 step=any')}
      <label>Moneda<select name="moneda"><option>PEN</option><option>USD</option></select></label>${field('stock', 'Stock', 'number', 'min=0 value=0')}
      <button class="btn">Agregar moto</button></form><h2>Catálogo (${motos.length})</h2>` +
      table([['Moto', m => `<b>${esc(m.marca)}</b> ${esc(m.modelo)} ${m.anio}`], ['cc', m => m.cc], ['Precio', m => money(m.precio, m.moneda)],
        ['Stock', m => m.stock], ['Estado', m => `<span class="tag ${m.activo ? 'on' : 'off'}">${m.activo ? 'Activa' : 'Dada de baja'}</span>`],
        ['', m => m.activo ? `<button class="btn ghost sm" data-del="${m.id}">Dar de baja</button>` : '']], motos);
    $('#nf').onsubmit = e => { e.preventDefault(); const d = formData(e.target);
      ['anio', 'cc', 'precio', 'stock'].forEach(k => d[k] = +d[k]);
      run(() => api('/motos', { method: 'POST', body: d }), 'Moto agregada', again); };
    v.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirm('¿Dar de baja esta moto? Dejará de verse en el catálogo.') && run(() => api('/motos/' + b.dataset.del, { method: 'DELETE' }), 'Moto dada de baja', again));
  } },
  { id: 'pedidos', label: 'Pedidos', async render(v) {
    v.innerHTML = table([['N.º', p => p.id], ['Fecha', p => fecha(p.creado)], ['Cliente', p => esc(p.cliente)], ['Moto', p => esc(p.moto)], ['Estado', p => estadoTag(p.estado)]], await api('/pedidos'), 'Todavía no hay pedidos.');
  } },
  { id: 'usuarios', label: 'Usuarios', async render(v, again) {
    const us = await api('/admin/usuarios');
    v.innerHTML = `<form id="uf" class="grid card">${field('nombre', 'Nombre')}${field('email', 'Correo', 'email')}${field('password', 'Contraseña (mín. 8)', 'password', 'minlength=8')}
      <label>Rol<select name="rol"><option value="trabajador">Trabajador</option><option value="admin">Administrador</option><option value="cliente">Cliente</option></select></label>
      <button class="btn">Crear usuario</button></form><h2>Usuarios (${us.length})</h2>` +
      table([['Nombre', u => esc(u.nombre)], ['Correo', u => esc(u.email)], ['Rol', u => esc(u.rol)],
        ['Estado', u => `<span class="tag ${u.activo ? 'on' : 'off'}">${u.activo ? 'Activo' : 'Inactivo'}</span>`],
        ['', u => `<button class="btn ghost sm" data-t="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>`]], us);
    $('#uf').onsubmit = e => { e.preventDefault(); run(() => api('/admin/usuarios', { method: 'POST', body: formData(e.target) }), 'Usuario creado', again); };
    v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => run(() => api(`/admin/usuarios/${b.dataset.t}/activo`, { method: 'PATCH' }), 'Estado actualizado', again));
  } },
] });
