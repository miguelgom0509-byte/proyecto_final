mountPanel({ rol: 'trabajador', title: 'Trabajador', sections: [
  { id: 'resumen', label: 'Resumen', async render(v) {
    // Obtenemos los pedidos y las motos al mismo tiempo
    const [pedidos, motos] = await Promise.all([
        api('/pedidos'),
        api('/motos?todas=true')
    ]);

    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const enProceso = pedidos.filter(p => p.estado === 'en_proceso').length;
    const bajoStock = motos.filter(m => m.stock <= 3 && m.activo);

    const card = (n, l, icon, color) => `
      <div class="card stat-card animate-up" style="border-left: 4px solid ${color}; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem;">
        <div class="stat-icon" style="color: ${color}; background: ${color}15; width: 55px; height: 55px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.8rem;">${icon}</div>
        <div class="stat-content">
          <b style="font-size: 2rem; display: block; line-height: 1; margin-bottom: 0.2rem;">${n}</b>
          <span style="font-size: 0.8rem; color: var(--muted); font-weight: 600; text-transform: uppercase;">${l}</span>
        </div>
      </div>`;

    v.innerHTML = `
      <div class="cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        ${card(pendientes, 'Pedidos Pendientes', '⏳', '#F59E0B')}
        ${card(enProceso, 'Pedidos en Proceso', '⚙️', '#8B5CF6')}
        ${card(bajoStock.length, 'Motos con Bajo Stock', '⚠️', '#EF4444')}
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 1.5rem;">
        <div class="card animate-up delay-1" style="padding:0; overflow:hidden;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:1.1rem;">⚠️ Alerta de Inventario</h3>
                <a href="#inventario" class="btn ghost sm" style="font-size:0.8rem;">Ir a Inventario</a>
            </div>
            <div style="padding: 1rem;">
                ${bajoStock.length === 0 
                    ? '<p class="muted" style="text-align:center; padding:2rem 0;">Todo el inventario está en niveles óptimos.</p>' 
                    : bajoStock.map(m => `
                        <div class="stock-alert-item" style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid var(--line);">
                            <div style="display:flex; gap:1rem; align-items:center;">
                                ${m.imagen ? `<img src="${m.imagen}" style="width:50px; height:35px; object-fit:cover; border-radius:6px;">` : ''}
                                <div>
                                    <b style="display:block; font-size:0.95rem;">${esc(m.marca)} ${esc(m.modelo)}</b>
                                    <small class="muted">${esc(m.tipo)}</small>
                                </div>
                            </div>
                            <span class="tag off">${m.stock} un.</span>
                        </div>
                    `).join('')}
            </div>
        </div>
      </div>
    `;
  } },
  
  { id: 'pedidos', label: 'Pedidos', async render(v, again) {
    const ps = await api('/pedidos');
    
    v.innerHTML = `<h2 class="section-title animate-up">Gestión de Pedidos</h2>
    <div class="animate-up delay-1">` + table([
      ['N.º', p => `<b>#${p.id}</b>`], 
      ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Cliente', p => `<b>${esc(p.cliente)}</b>`], 
      ['Moto', p => `${esc(p.moto)}`], 
      ['Nota', p => p.nota ? `<i style="color:var(--warning); font-size:0.85rem;">"${esc(p.nota)}"</i>` : '<span class="muted">—</span>'],
      ['Estado', p => `
        <select data-p="${p.id}" style="min-height:36px; font-size:0.85rem; font-weight:700; border-radius:8px; cursor:pointer; padding:0 0.5rem;
            ${p.estado === 'entregado' ? 'border-color:var(--ok); color:var(--ok); background:rgba(16,185,129,0.1);' 
            : p.estado === 'en_proceso' ? 'border-color:var(--warning); color:var(--warning); background:rgba(245,158,11,0.1);' 
            : p.estado === 'cancelado' ? 'border-color:var(--bad); color:var(--bad); background:rgba(239,68,68,0.1);' 
            : 'border-color:var(--line); color:var(--muted); background:var(--bg);'}">
          ${Object.entries(ESTADOS).map(([k, l]) => `<option value="${k}" ${k === p.estado ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      `]
    ], ps, 'No hay pedidos pendientes por atender.') + `</div>`;
    
    // Evento para cambiar estado
    v.querySelectorAll('[data-p]').forEach(s => {
      s.onchange = () => {
        s.disabled = true;
        run(() => api(`/pedidos/${s.dataset.p}/estado`, { method: 'PATCH', body: { estado: s.value } }), 'Pedido actualizado correctamente', again)
        .finally(() => s.disabled = false);
      };
    });
  } },
  
  { id: 'inventario', label: 'Inventario', async render(v, again) {
    const ms = await api('/motos');
    
    v.innerHTML = `<h2 class="section-title animate-up">Control de Inventario</h2>
    <div class="animate-up delay-1">` + table([
      ['Moto', m => `
        <div style="display:flex; align-items:center; gap:1rem;">
            ${m.imagen ? `<img src="${m.imagen}" style="width:60px; height:40px; object-fit:cover; border-radius:6px;">` : ''}
            <div>
                <b>${esc(m.marca)}</b> ${esc(m.modelo)} <br>
                <small class="muted">${esc(m.tipo)} · ${m.cc} cc</small>
            </div>
        </div>
      `], 
      ['Stock Actual', m => `<span class="tag ${m.stock > 3 ? 'on' : (m.stock > 0 ? 'en_proceso' : 'off')}">${m.stock} un.</span>`],
      ['Actualizar Stock', m => `
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="number" min="0" value="${m.stock}" id="s${m.id}" style="width:90px; min-height:38px; text-align:center; font-weight:700; margin:0; padding:0.3rem;">
          <button class="btn btn-primary sm" data-s="${m.id}" style="min-height:38px;">Guardar</button>
        </div>
      `]
    ], ms, 'No hay motos en el inventario.');
    
    // Lógica para guardar stock
    v.querySelectorAll('[data-s]').forEach(b => {
      b.onclick = () => {
        const input = $('#s' + b.dataset.s);
        if (!input) return;
        
        const nuevoStock = +input.value;
        if (nuevoStock < 0) return toast('El stock no puede ser negativo');
        
        b.disabled = true; 
        b.textContent = '...';
        
        run(() => api(`/motos/${b.dataset.s}/stock`, { method: 'PATCH', body: { stock: nuevoStock } }), 'Stock guardado', again)
        .finally(() => { b.disabled = false; b.textContent = 'Guardar'; });
      };
    });
  } },
] });