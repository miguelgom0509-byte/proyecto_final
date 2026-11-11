mountPanel({ rol: 'trabajador', title: 'Trabajador', sections: [
  { id: 'resumen', label: 'Resumen', async render(v) {
    // Obtenemos los pedidos y las motos al mismo tiempo
    const [pedidos, motos] = await Promise.all([
        api('/pedidos'),
        api('/motos?todas=true')
    ]);

    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const enProceso = pedidos.filter(p => p.estado === 'en_proceso').length;
    const bajoStock = motos.filter(m => m.stock <= 3 && m.activo).sort((a, b) => a.stock - b.stock);

    // Reutilizamos la estructura visual de las KPI Cards del Admin
    const kpiCard = (n, l, iconSvg, colorVar, bgGlow) => `
      <div class="kpi-card animate-up">
        <div class="kpi-header">
          <span class="kpi-label">${l}</span>
          <div class="kpi-icon" style="color: ${colorVar}; background: ${bgGlow};">${iconSvg}</div>
        </div>
        <div class="kpi-value">${n}</div>
      </div>`;

    v.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 24px;">
        ${kpiCard(pendientes, 'Pedidos Pendientes', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>', 'var(--accent-orange)', 'rgba(245, 158, 11, 0.15)')}
        ${kpiCard(enProceso, 'En Proceso', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>', 'var(--accent-purple)', 'rgba(139, 92, 246, 0.15)')}
        ${kpiCard(bajoStock.length, 'Alertas de Stock', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', 'var(--accent-red)', 'rgba(239, 68, 68, 0.15)')}
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr;">
        <div class="table-card animate-up delay-1">
            <div class="table-header">
                <h3 class="table-title" style="color: var(--accent-red); display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  Alerta de Inventario
                </h3>
                <a href="#inventario" class="btn btn-ghost btn-sm">Ir a Inventario</a>
            </div>
            <div style="padding: 0 24px;">
                ${bajoStock.length === 0 
                    ? '<p class="text-muted" style="text-align:center; padding:32px 0;">Todo el inventario está en niveles óptimos.</p>' 
                    : bajoStock.map(m => `
                        <div class="stock-alert-item">
                            <div style="display:flex; gap:16px; align-items:center;">
                                ${m.imagen ? `<img src="${esc(m.imagen)}" class="stock-img">` : ''}
                                <div>
                                    <b style="display:block; font-size:14px; color:var(--text-primary);">${esc(m.marca)} ${esc(m.modelo)}</b>
                                    <small style="color:var(--text-secondary);">${esc(m.tipo)}</small>
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
    
    v.innerHTML = `
    <div class="table-card animate-up">
        <div class="table-header">
            <h2 class="table-title">Gestión de Pedidos</h2>
        </div>
        <div class="table-responsive">
        ${table([
          ['N.º', p => `<b>#${p.id}</b>`], 
          ['Fecha', p => `<span style="color:var(--text-muted)">${fecha(p.creado)}</span>`], 
          ['Cliente', p => `<b>${esc(p.cliente)}</b>`], 
          ['Moto', p => `${esc(p.moto)}`], 
          ['Nota', p => p.nota ? `<i style="color:var(--accent-orange); font-size:13px;">"${esc(p.nota)}"</i>` : '<span class="text-muted">—</span>'],
          ['Estado', p => `
            <select data-p="${p.id}" class="select-status" style="
                background: ${p.estado === 'entregado' ? 'var(--accent-green-glow)' : p.estado === 'en_proceso' ? 'rgba(245, 158, 11, 0.15)' : p.estado === 'cancelado' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)'};
                color: ${p.estado === 'entregado' ? 'var(--accent-green)' : p.estado === 'en_proceso' ? 'var(--accent-orange)' : p.estado === 'cancelado' ? 'var(--accent-red)' : 'var(--text-secondary)'};
                border: 1px solid ${p.estado === 'entregado' ? 'var(--accent-green)' : p.estado === 'en_proceso' ? 'var(--accent-orange)' : p.estado === 'cancelado' ? 'var(--accent-red)' : 'var(--border-strong)'};
                font-weight: 600; padding: 6px 12px; border-radius: 20px; cursor: pointer; outline: none; transition: all 0.2s;
            ">
              ${Object.entries(ESTADOS).map(([k, l]) => `<option value="${k}" ${k === p.estado ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          `]
        ], ps, 'No hay pedidos registrados.')}
        </div>
    </div>`;
    
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
    
    v.innerHTML = `
    <div class="table-card animate-up">
        <div class="table-header">
            <h2 class="table-title">Control de Inventario</h2>
        </div>
        <div class="table-responsive">
        ${table([
          ['Moto', m => `
            <div style="display:flex; align-items:center; gap:16px;">
                ${m.imagen ? `<img src="${esc(m.imagen)}" class="stock-img" style="width:60px; height:40px;">` : ''}
                <div>
                    <b>${esc(m.marca)}</b> ${esc(m.modelo)} <br>
                    <small style="color:var(--text-muted)">${esc(m.tipo)} · ${m.cc} cc</small>
                </div>
            </div>
          `], 
          ['Stock Actual', m => `<span class="tag ${m.stock > 3 ? 'on' : (m.stock > 0 ? 'en_proceso' : 'off')}">${m.stock} un.</span>`],
          ['Actualizar Stock', m => `
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="number" min="0" value="${m.stock}" id="s${m.id}" class="stock-input" style="
                width: 80px; 
                padding: 8px; 
                text-align: center; 
                font-weight: 600;
                background: var(--bg-body);
                border: 1px solid var(--border-strong);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                outline: none;
              ">
              <button class="btn btn-primary btn-sm" data-s="${m.id}" style="padding: 8px 12px;">Guardar</button>
            </div>
          `]
        ], ms, 'No hay motos en el inventario.')}
        </div>
    </div>`;
    
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