const estadoTag = e => `<span class="tag ${e}">${ESTADOS[e]}</span>`;

mountPanel({ rol: 'admin', title: 'Panel administrativo', sections: [
  { id: 'resumen', label: 'Resumen', async render(v) {
    const s = await api('/admin/stats'), p = s.pedidos;
    const card = (n, l, icon) => `<div class="card stat"><span style="font-size:1.8rem; margin-bottom:0.5rem">${icon}</span><b>${n ?? 0}</b><span>${l}</span></div>`;
    v.innerHTML = `<div class="cards">
      ${card(s.motos, 'Modelos activos', '🏍️')} ${card(s.unidades, 'Unidades en stock', '📦')}
      ${card(p.pendiente, 'Pedidos pendientes', '⏳')} ${card(p.en_proceso, 'Pedidos en proceso', '⚙️')}
      ${card(p.entregado, 'Pedidos entregados', '✅')} ${card(s.usuarios.cliente, 'Clientes', '👤')}
    </div>`;
  } },
  
  { id: 'motos', label: 'Motos', async render(v, again) {
    const motos = await api('/motos?todas=true');
    v.innerHTML = `<div class="card" style="margin-bottom:2rem;">
      <h2 style="margin-top:0">Agregar nueva moto</h2>
      <form id="nf" class="grid" style="margin-bottom:0;">
        ${field('marca', 'Marca', 'text', 'placeholder="Ej: Honda"')}
        ${field('modelo', 'Modelo', 'text', 'placeholder="Ej: CBR 250R"')}
        ${field('anio', 'Año', 'number', 'min=2000 value=2026')}
        ${field('tipo', 'Tipo (Scooter, Naked...)', 'text')}
        ${field('cc', 'Cilindrada (cc)', 'number', 'min=1')}
        ${field('precio', 'Precio', 'number', 'min=1 step=any')}
        <label>Moneda<select name="moneda"><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label>
        ${field('stock', 'Stock inicial', 'number', 'min=0 value=0')}
        <label style="grid-column: 1 / -1;">URL de la Imagen (Opcional)
            <input name="imagen" type="url" placeholder="https://ejemplo.com/foto-moto.jpg">
        </label>
        <button class="btn" style="grid-column: 1 / -1;">Guardar Moto</button>
      </form>
    </div>
    <h2>Catálogo (${motos.length})</h2>` +
      table([['Foto', m => m.imagen ? `<img src="${m.imagen}" style="width:50px; height:40px; object-fit:cover; border-radius:6px;">` : '—'],
             ['Moto', m => `<b>${esc(m.marca)}</b> ${esc(m.modelo)} <small class="muted">(${m.anio})</small>`], 
             ['Precio', m => money(m.precio, m.moneda)],
             ['Stock', m => `<span class="tag ${m.stock > 0 ? 'on' : 'off'}">${m.stock} un.</span>`], 
             ['Acciones', m => m.activo ? `<button class="btn ghost sm" data-del="${m.id}">Dar de baja</button>` : '']], motos);
             
    $('#nf').onsubmit = e => { e.preventDefault(); const d = formData(e.target);
      ['anio', 'cc', 'precio', 'stock'].forEach(k => d[k] = +d[k]);
      run(() => api('/motos', { method: 'POST', body: d }), 'Moto agregada', again); };
      
    v.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirm('¿Dar de baja esta moto?') && run(() => api('/motos/' + b.dataset.del, { method: 'DELETE' }), 'Moto dada de baja', again));
  } },
  
  { id: 'pedidos', label: 'Pedidos', async render(v) {
    const ps = await api('/pedidos');
    v.innerHTML = table([['N.º', p => `<b>#${p.id}</b>`], ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Cliente', p => esc(p.cliente)], ['Moto', p => `<b>${esc(p.moto)}</b>`], ['Estado', p => estadoTag(p.estado)]], ps, 'No hay pedidos.');
  } },
  
  { id: 'usuarios', label: 'Usuarios', async render(v, again) {
    const us = await api('/admin/usuarios');
    v.innerHTML = `<div class="card" style="margin-bottom:2rem;">
      <h2 style="margin-top:0">Crear nuevo usuario</h2>
      <form id="uf" class="grid" style="margin-bottom:0;">
        ${field('nombre', 'Nombre completo')} ${field('email', 'Correo', 'email')}
        ${field('password', 'Contraseña (mín. 8)', 'password', 'minlength=8')}
        <label>Rol<select name="rol"><option value="trabajador">Trabajador</option><option value="admin">Administrador</option><option value="cliente">Cliente</option></select></label>
        <button class="btn">Crear Usuario</button>
      </form>
    </div>
    <h2>Directorio (${us.length})</h2>` +
      table([['Nombre', u => `<b>${esc(u.nombre)}</b>`], ['Correo', u => `<span class="muted">${esc(u.email)}</span>`], 
        ['Rol', u => `<span class="tag en_proceso" style="text-transform:capitalize">${esc(u.rol)}</span>`],
        ['Estado', u => `<span class="tag ${u.activo ? 'on' : 'off'}">${u.activo ? 'Activo' : 'Inactivo'}</span>`],
        ['Acciones', u => `<button class="btn ghost sm" data-t="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>`]], us);
    $('#uf').onsubmit = e => { e.preventDefault(); run(() => api('/admin/usuarios', { method: 'POST', body: formData(e.target) }), 'Usuario creado', again); };
    v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => run(() => api(`/admin/usuarios/${b.dataset.t}/activo`, { method: 'PATCH' }), 'Estado actualizado', again));
  } },
] });