const estadoTag = e => `<span class="tag ${esc(e)}">${ESTADOS[e] || esc(e)}</span>`;

let chartPedidos = null;
let chartUsuarios = null;

function exportarExcel(datos, nombreArchivo) {
    if (!datos || datos.length === 0) {
        toast('No hay datos para exportar');
        return;
    }
    const cabeceras = Object.keys(datos[0]);
    const filas = datos.map(obj => 
        cabeceras.map(cabecera => {
            let valor = obj[cabecera] === null || obj[cabecera] === undefined ? '' : obj[cabecera];
            valor = String(valor).replace(/"/g, '""');
            return `"${valor}"`;
        }).join(',')
    );
    const csvContent = [cabeceras.join(','), ...filas].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('Archivo exportado correctamente');
}

function animarValor(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

mountPanel({ rol: 'admin', title: 'Admin', sections: [
  { id: 'resumen', label: 'Dashboard', async render(v) {
    const [stats, pedidos, motos] = await Promise.all([
        api('/admin/stats'), 
        api('/pedidos'),
        api('/motos?todas=true')
    ]);
    const p = stats.pedidos;
    
    const ultimosPedidos = pedidos.slice(0, 5);
    const bajoStock = motos.filter(m => m.stock <= 3 && m.activo).sort((a,b) => a.stock - b.stock);

    // Nuevo diseño de KPI Cards
    const kpiCard = (id, n, l, iconSvg, colorVar, bgGlow, delta = '') => `
      <div class="kpi-card animate-up">
        <div class="kpi-header">
          <span class="kpi-label">${l}</span>
          <div class="kpi-icon" style="color: ${colorVar}; background: ${bgGlow};">${iconSvg}</div>
        </div>
        <div class="kpi-value" id="stat-${id}" data-target="${n ?? 0}">0</div>
        ${delta ? `<div class="kpi-delta ${delta.includes('+') ? 'positive' : 'negative'}">${delta}</div>` : ''}
      </div>`;

    v.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 24px;">
        ${kpiCard('motos', stats.motos, 'Modelos Activos', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6h-3l-3 9h6"></path><path d="M15 6l3 4"></path></svg>', 'var(--accent-blue)', 'var(--accent-blue-glow)')}
        ${kpiCard('unidades', stats.unidades, 'Unidades en Stock', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>', 'var(--accent-green)', 'var(--accent-green-glow)')}
        ${kpiCard('pendientes', p.pendiente, 'Pedidos Pendientes', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>', 'var(--accent-orange)', 'rgba(245, 158, 11, 0.15)')}
        ${kpiCard('clientes', stats.usuarios.cliente, 'Total Clientes', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', '#8B5CF6', 'rgba(139, 92, 246, 0.15)')}
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 24px;">
          <div class="chart-card animate-up delay-1">
              <div class="chart-header">
                  <h3 class="chart-title">Estado de Pedidos</h3>
              </div>
              <div class="chart-container">
                  <canvas id="chart-pedidos"></canvas>
              </div>
          </div>
          <div class="chart-card animate-up delay-2">
              <div class="chart-header">
                  <h3 class="chart-title">Usuarios por Rol</h3>
              </div>
              <div class="chart-container">
                  <canvas id="chart-usuarios"></canvas>
              </div>
          </div>
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="table-card animate-up delay-1">
              <div class="table-header">
                  <h3 class="table-title">Últimos Pedidos</h3>
                  <a href="#pedidos" class="btn btn-ghost btn-sm">Ver todos</a>
              </div>
              <div class="table-responsive">
                  ${table([
                      ['Cliente', p => `<b>${esc(p.cliente)}</b>`],
                      ['Moto', p => esc(p.moto)],
                      ['Estado', p => estadoTag(p.estado)]
                  ], ultimosPedidos, 'No hay pedidos recientes.')}
              </div>
          </div>

          <div class="table-card animate-up delay-2">
              <div class="table-header">
                  <h3 class="table-title" style="color: var(--accent-red); display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Alerta de Stock Bajo
                  </h3>
              </div>
              <div style="padding: 0 24px;">
                  ${bajoStock.length === 0 
                      ? '<p class="muted" style="text-align:center; padding:32px 0;">Todo el inventario está en niveles óptimos.</p>' 
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

    setTimeout(() => {
      document.querySelectorAll('[data-target]').forEach(el => {
        animarValor(el, 0, parseInt(el.dataset.target), 1000);
      });

      if (!document.getElementById('chart-pedidos')) return;
      if (typeof Chart === 'undefined') {
        document.querySelectorAll('.chart-container').forEach(c => c.innerHTML = '<p class="muted">No se pudo cargar el gráfico (revisa tu conexión).</p>');
        return;
      }
      if (chartPedidos) chartPedidos.destroy();
      if (chartUsuarios) chartUsuarios.destroy();

      // Configuración global de Chart.js para Dark Mode
      Chart.defaults.color = '#94A3B8';
      Chart.defaults.font.family = 'Montserrat, sans-serif';
      Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

      const ctxPedidos = document.getElementById('chart-pedidos').getContext('2d');
      chartPedidos = new Chart(ctxPedidos, {
        type: 'doughnut',
        data: {
          labels: ['Pendientes', 'En Proceso', 'Entregados', 'Cancelados'],
          datasets: [{
            data: [p.pendiente || 0, p.en_proceso || 0, p.entregado || 0, p.cancelado || 0],
            backgroundColor: ['#F59E0B', '#8B5CF6', '#10B981', '#EF4444'],
            borderWidth: 2,
            borderColor: '#0D111B',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '75%',
          plugins: { 
            legend: { 
              position: 'bottom', 
              labels: { boxWidth: 10, usePointStyle: true, padding: 20, font: { size: 12, weight: '500' } } 
            } 
          }
        }
      });

      const ctxUsuarios = document.getElementById('chart-usuarios').getContext('2d');
      chartUsuarios = new Chart(ctxUsuarios, {
        type: 'bar',
        data: {
          labels: ['Clientes', 'Trabajadores', 'Admins'],
          datasets: [{
            label: 'Cantidad',
            data: [stats.usuarios.cliente || 0, stats.usuarios.trabajador || 0, stats.usuarios.admin || 0],
            backgroundColor: ['#2F6FE0', '#F59E0B', '#EF4444'],
            borderRadius: 6,
            barThickness: 40
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { weight: '600' } } }
          }
        }
      });

    }, 100);
  } },
  
  { id: 'motos', label: 'Inventario', async render(v, again) {
    const motos = await api('/motos?todas=true');
    
    v.innerHTML = `
    <div class="form-card animate-up" style="margin-bottom: 24px;">
      <h2 class="chart-title" style="margin-bottom: 20px;">Agregar nueva moto</h2>
      <form id="nf" class="form-grid">
        ${field('marca', 'Marca', 'text', 'placeholder="Ej: Honda"')}
        ${field('modelo', 'Modelo', 'text', 'placeholder="Ej: CBR 250R"')}
        ${field('anio', 'Año', 'number', 'min=2000 value=2026')}
        ${field('tipo', 'Tipo', 'text', 'placeholder="Ej: Deportiva"')}
        ${field('cc', 'Cilindrada (cc)', 'number', 'min=1')}
        ${field('precio', 'Precio', 'number', 'min=1 step=any')}
        <label class="form-group">
          <span>Moneda</span>
          <select name="moneda"><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select>
        </label>
        ${field('stock', 'Stock inicial', 'number', 'min=0 value=0')}
        <label class="form-group" style="grid-column: 1 / -1;">
            <span>URL de la Imagen</span>
            <input name="imagen" type="url" placeholder="https://...">
        </label>
        <button class="btn btn-primary" style="grid-column: 1 / -1; margin-top: 12px;">Guardar Moto</button>
      </form>
    </div>
    
    <div class="table-card animate-up delay-1">
        <div class="table-header">
            <h2 class="table-title">Catálogo (${motos.length})</h2>
            <button class="btn btn-ghost btn-sm" id="btn-export-motos">📥 Exportar a Excel</button>
        </div>
        <div class="table-responsive">
        ${table([
          ['Foto', m => m.imagen ? `<div style="width:60px; height:40px; border-radius:6px; overflow:hidden; border:1px solid var(--border-subtle);"><img src="${esc(m.imagen)}" style="width:100%; height:100%; object-fit:cover;"></div>` : '—'],
          ['Moto', m => `<b>${esc(m.marca)}</b> ${esc(m.modelo)} <br><small style="color:var(--text-muted)">${m.anio}</small>`], 
          ['Precio', m => `<b style="color:var(--accent-blue)">${money(m.precio, m.moneda)}</b>`],
          ['Stock', m => `<span class="tag ${m.stock > 3 ? 'on' : (m.stock > 0 ? 'en_proceso' : 'off')}">${m.stock} un.</span>`], 
          ['Acciones', m => m.activo ? `<button class="btn btn-danger btn-sm" data-del="${m.id}">Dar de baja</button>` : '<span class="tag off">Inactiva</span>']
        ], motos)}
        </div>
    </div>`;
             
    $('#nf').onsubmit = async e => { 
      e.preventDefault(); 
      const btn = e.target.querySelector('button[type="submit"], button:not([type])');
      btn.disabled = true; btn.textContent = 'Guardando...';
      const d = formData(e.target);
      ['anio', 'cc', 'precio', 'stock'].forEach(k => d[k] = +d[k]);
      
      try {
        await api('/motos', { method: 'POST', body: d });
        toast('Moto agregada'); again();
      } catch (err) {
        toast(err.message); btn.disabled = false; btn.textContent = 'Guardar Moto';
      }
    };

    $('#btn-export-motos').onclick = () => {
        const datosLimpios = motos.map(m => ({
            'Marca': m.marca, 'Modelo': m.modelo, 'Año': m.anio, 'Tipo': m.tipo,
            'Cilindrada (cc)': m.cc, 'Precio': m.precio, 'Moneda': m.moneda,
            'Stock': m.stock, 'Estado': m.activo ? 'Activa' : 'Inactiva'
        }));
        exportarExcel(datosLimpios, 'Inventario_MotoAltiplano');
    };
      
    v.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirm('¿Dar de baja esta moto?') && run(() => api('/motos/' + b.dataset.del, { method: 'DELETE' }), 'Moto dada de baja', again));
  } },
  
  { id: 'pedidos', label: 'Pedidos', async render(v) {
    const ps = await api('/pedidos');
    
    v.innerHTML = `
    <div class="table-card animate-up">
        <div class="table-header">
            <h2 class="table-title">Todos los Pedidos (${ps.length})</h2>
            <button class="btn btn-ghost btn-sm" id="btn-export-pedidos">📥 Exportar a Excel</button>
        </div>
        <div class="table-responsive">
        ${table([
          ['N.º', p => `<b>#${p.id}</b>`], 
          ['Fecha', p => `<span style="color:var(--text-muted)">${fecha(p.creado)}</span>`], 
          ['Cliente', p => esc(p.cliente)], 
          ['Moto', p => `<b>${esc(p.moto)}</b>`], 
          ['Estado', p => estadoTag(p.estado)]
        ], ps, 'No hay pedidos registrados.')}
        </div>
    </div>`;

    $('#btn-export-pedidos').onclick = () => {
        const datosLimpios = ps.map(p => ({
            'N° Pedido': p.id, 'Fecha': fecha(p.creado), 'Cliente': p.cliente,
            'Moto': p.moto, 'Estado': ESTADOS[p.estado], 'Nota': p.nota || ''
        }));
        exportarExcel(datosLimpios, 'Pedidos_MotoAltiplano');
    };
  } },
  
  { id: 'usuarios', label: 'Usuarios', async render(v, again) {
    const us = await api('/admin/usuarios');
    
    v.innerHTML = `
    <div class="form-card animate-up" style="margin-bottom: 24px;">
      <h2 class="chart-title" style="margin-bottom: 20px;">Crear nuevo usuario</h2>
      <form id="uf" class="form-grid">
        ${field('nombre', 'Nombre completo', 'text', 'placeholder="Ej: Ana Torres"')}
        ${field('email', 'Correo electrónico', 'email', 'placeholder="ana@correo.com"')}
        ${field('password', 'Contraseña', 'password', 'minlength=8 placeholder="••••••••"')}
        <label class="form-group">
          <span>Rol</span>
          <select name="rol">
            <option value="cliente">Cliente</option>
            <option value="trabajador">Trabajador</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button class="btn btn-primary" style="grid-column: 1 / -1; margin-top: 12px;">Registrar Usuario</button>
      </form>
    </div>
    
    <div class="table-card animate-up delay-1">
        <div class="table-header">
            <h2 class="table-title">Directorio (${us.length})</h2>
            <button class="btn btn-ghost btn-sm" id="btn-export-usuarios">📥 Exportar a Excel</button>
        </div>
        <div class="table-responsive">
        ${table([
          ['Nombre', u => `<b>${esc(u.nombre)}</b>`], 
          ['Correo', u => `<span style="color:var(--text-muted)">${esc(u.email)}</span>`], 
          ['Rol', u => {
              let colorClass = u.rol === 'admin' ? 'cancelado' : (u.rol === 'trabajador' ? 'en_proceso' : 'pendiente');
              return `<span class="tag ${colorClass}" style="text-transform:capitalize">${esc(u.rol)}</span>`;
          }],
          ['Estado', u => `<span class="tag ${u.activo ? 'on' : 'off'}">${u.activo ? 'Activo' : 'Inactivo'}</span>`],
          ['Acciones', u => `<button class="btn btn-ghost btn-sm" data-t="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>`]
        ], us)}
        </div>
    </div>`;
      
    $('#uf').onsubmit = async e => { 
      e.preventDefault(); 
      const btn = e.target.querySelector('button[type="submit"], button:not([type])');
      btn.disabled = true; btn.textContent = 'Registrando...';
      try { await api('/admin/usuarios', { method: 'POST', body: formData(e.target) }); toast('Usuario creado'); again(); } 
      catch (err) { toast(err.message); btn.disabled = false; btn.textContent = 'Registrar Usuario'; }
    };

    $('#btn-export-usuarios').onclick = () => {
        const datosLimpios = us.map(u => ({
            'Nombre': u.nombre, 'Correo': u.email, 'Rol': u.rol.toUpperCase(), 'Estado': u.activo ? 'Activo' : 'Inactivo'
        }));
        exportarExcel(datosLimpios, 'Usuarios_MotoAltiplano');
    };

    v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => run(() => api(`/admin/usuarios/${b.dataset.t}/activo`, { method: 'PATCH' }), 'Estado actualizado', again));
  } },
] });