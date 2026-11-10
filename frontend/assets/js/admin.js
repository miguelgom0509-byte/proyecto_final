const estadoTag = e => `<span class="tag ${esc(e)}">${ESTADOS[e] || esc(e)}</span>`;

let chartPedidos = null;
let chartUsuarios = null;

// --- NUEVA FUNCIÓN PARA EXPORTAR A EXCEL (CSV) ---
function exportarExcel(datos, nombreArchivo) {
    if (!datos || datos.length === 0) {
        toast('No hay datos para exportar');
        return;
    }

    // 1. Obtener los encabezados
    const cabeceras = Object.keys(datos[0]);
    
    // 2. Crear las filas del CSV
    const filas = datos.map(obj => 
        cabeceras.map(cabecera => {
            let valor = obj[cabecera] === null || obj[cabecera] === undefined ? '' : obj[cabecera];
            // Escapar comillas dobles para que Excel no se confunda
            valor = String(valor).replace(/"/g, '""');
            return `"${valor}"`;
        }).join(',')
    );

    // 3. Unir todo
    const csvContent = [cabeceras.join(','), ...filas].join('\n');

    // 4. Crear el archivo y forzar la descarga
    // El \uFEFF es el BOM (Byte Order Mark) que ayuda a Excel a reconocer los acentos (UTF-8)
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

    const card = (id, n, l, icon, color) => `
      <div class="card stat-card animate-up" style="border-left: 4px solid ${color};">
        <div class="stat-icon" style="color: ${color}; background: ${color}15;">${icon}</div>
        <div class="stat-content">
          <b id="stat-${id}" data-target="${n ?? 0}">0</b>
          <span>${l}</span>
        </div>
      </div>`;

    v.innerHTML = `
      <div class="cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        ${card('motos', stats.motos, 'Modelos activos', '🏍️', '#3B82F6')}
        ${card('unidades', stats.unidades, 'Unidades en stock', '📦', '#10B981')}
        ${card('pendientes', p.pendiente, 'Pedidos pendientes', '⏳', '#F59E0B')}
        ${card('clientes', stats.usuarios.cliente, 'Clientes', '👤', '#8B5CF6')}
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;">
          <div class="card animate-up delay-1" style="padding: 1.5rem; display: flex; flex-direction: column;">
              <h3 style="margin:0 0 1rem 0; font-size:1.1rem;">Estado de los Pedidos</h3>
              <div class="chart-container" style="position: relative; height: 250px; width: 100%;">
                  <canvas id="chart-pedidos"></canvas>
              </div>
          </div>
          <div class="card animate-up delay-2" style="padding: 1.5rem; display: flex; flex-direction: column;">
              <h3 style="margin:0 0 1rem 0; font-size:1.1rem;">Usuarios por Rol</h3>
              <div class="chart-container" style="position: relative; height: 250px; width: 100%;">
                  <canvas id="chart-usuarios"></canvas>
              </div>
          </div>
      </div>

      <div class="dashboard-grid">
          <div class="card animate-up delay-1" style="padding:0; overflow:hidden;">
              <div style="padding: 1.5rem; border-bottom: 1px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
                  <h3 style="margin:0; font-size:1.1rem;">Últimos Pedidos</h3>
                  <a href="#pedidos" class="btn ghost sm" style="font-size:0.8rem;">Ver todos</a>
              </div>
              <div class="tbl" style="border:none; box-shadow:none; border-radius:0;">
                  ${table([
                      ['Cliente', p => `<b>${esc(p.cliente)}</b>`],
                      ['Moto', p => esc(p.moto)],
                      ['Estado', p => estadoTag(p.estado)]
                  ], ultimosPedidos, 'No hay pedidos recientes.')}
              </div>
          </div>

          <div class="card animate-up delay-2" style="padding:0; overflow:hidden;">
              <div style="padding: 1.5rem; border-bottom: 1px solid var(--line);">
                  <h3 style="margin:0; font-size:1.1rem; color:var(--bad);">⚠️ Alerta de Stock Bajo</h3>
              </div>
              <div style="padding: 1rem;">
                  ${bajoStock.length === 0 
                      ? '<p class="muted" style="text-align:center; padding:2rem 0;">Todo el inventario está en niveles óptimos.</p>' 
                      : bajoStock.map(m => `
                          <div class="stock-alert-item">
                              <div style="display:flex; gap:1rem; align-items:center;">
                                  ${m.imagen ? `<img src="${esc(m.imagen)}" style="width:40px; height:30px; object-fit:cover; border-radius:4px;">` : ''}
                                  <div>
                                      <b style="display:block; font-size:0.9rem;">${esc(m.marca)} ${esc(m.modelo)}</b>
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

    setTimeout(() => {
      document.querySelectorAll('[data-target]').forEach(el => {
        animarValor(el, 0, parseInt(el.dataset.target), 1000);
      });

      // La vista pudo cambiar durante la espera, o Chart.js no cargó (sin internet)
      if (!document.getElementById('chart-pedidos')) return;
      if (typeof Chart === 'undefined') {
        document.querySelectorAll('.chart-container').forEach(c => c.innerHTML = '<p class="muted">No se pudo cargar el gráfico (revisa tu conexión).</p>');
        return;
      }
      if (chartPedidos) chartPedidos.destroy();
      if (chartUsuarios) chartUsuarios.destroy();

      const ctxPedidos = document.getElementById('chart-pedidos').getContext('2d');
      chartPedidos = new Chart(ctxPedidos, {
        type: 'doughnut',
        data: {
          labels: ['Pendientes', 'En Proceso', 'Entregados', 'Cancelados'],
          datasets: [{
            data: [p.pendiente || 0, p.en_proceso || 0, p.entregado || 0, p.cancelado || 0],
            backgroundColor: ['#F59E0B', '#8B5CF6', '#10B981', '#EF4444'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Montserrat', size: 12 } } } },
          cutout: '70%'
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
            backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444'],
            borderRadius: 6,
            barThickness: 40
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Montserrat' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false }, ticks: { font: { family: 'Montserrat', weight: '600' } } }
          }
        }
      });

    }, 100);
  } },
  
  { id: 'motos', label: 'Inventario', async render(v, again) {
    const motos = await api('/motos?todas=true');
    
    v.innerHTML = `
    <div class="card form-card animate-up">
      <h2 class="section-title">Agregar nueva moto</h2>
      <form id="nf" class="grid">
        ${field('marca', 'Marca', 'text', 'placeholder="Ej: Honda"')}
        ${field('modelo', 'Modelo', 'text', 'placeholder="Ej: CBR 250R"')}
        ${field('anio', 'Año', 'number', 'min=2000 value=2026')}
        ${field('tipo', 'Tipo', 'text', 'placeholder="Ej: Deportiva"')}
        ${field('cc', 'Cilindrada (cc)', 'number', 'min=1')}
        ${field('precio', 'Precio', 'number', 'min=1 step=any')}
        <label>Moneda<select name="moneda"><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label>
        ${field('stock', 'Stock inicial', 'number', 'min=0 value=0')}
        <label style="grid-column: 1 / -1;">URL de la Imagen
            <input name="imagen" type="url" placeholder="https://...">
        </label>
        <button class="btn btn-primary" style="grid-column: 1 / -1;">Guardar Moto</button>
      </form>
    </div>
    
    <!-- AQUÍ ESTÁ EL BOTÓN DE EXPORTAR INVENTARIO -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2.5rem; margin-bottom:1rem;" class="animate-up">
        <h2 class="section-title" style="margin:0;">Catálogo (${motos.length})</h2>
        <button class="btn btn-primary sm" id="btn-export-motos">📥 Exportar a Excel</button>
    </div>
    
    <div class="animate-up delay-1">` +
      table([
        ['Foto', m => m.imagen ? `<div class="table-img-wrapper"><img src="${esc(m.imagen)}" class="table-img"></div>` : '—'],
        ['Moto', m => `<b>${esc(m.marca)}</b> ${esc(m.modelo)} <br><small class="muted">${m.anio}</small>`], 
        ['Precio', m => `<b style="color:var(--gold-h)">${money(m.precio, m.moneda)}</b>`],
        ['Stock', m => `<span class="tag ${m.stock > 3 ? 'on' : (m.stock > 0 ? 'en_proceso' : 'off')}">${m.stock} un.</span>`], 
        ['Acciones', m => m.activo ? `<button class="btn btn-danger sm" data-del="${m.id}">Dar de baja</button>` : '<span class="tag off">Inactiva</span>']
      ], motos) + `</div>`;
             
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

    // Lógica para exportar inventario
    $('#btn-export-motos').onclick = () => {
        // Limpiamos los datos para que no salgan columnas innecesarias en Excel
        const datosLimpios = motos.map(m => ({
            'Marca': m.marca,
            'Modelo': m.modelo,
            'Año': m.anio,
            'Tipo': m.tipo,
            'Cilindrada (cc)': m.cc,
            'Precio': m.precio,
            'Moneda': m.moneda,
            'Stock': m.stock,
            'Estado': m.activo ? 'Activa' : 'Inactiva'
        }));
        exportarExcel(datosLimpios, 'Inventario_MotoAltiplano');
    };
      
    v.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirm('¿Dar de baja esta moto?') && run(() => api('/motos/' + b.dataset.del, { method: 'DELETE' }), 'Moto dada de baja', again));
  } },
  
  { id: 'pedidos', label: 'Pedidos', async render(v) {
    const ps = await api('/pedidos');
    
    v.innerHTML = `
    <!-- AQUÍ ESTÁ EL BOTÓN DE EXPORTAR PEDIDOS -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;" class="animate-up">
        <h2 class="section-title" style="margin:0;">Todos los Pedidos (${ps.length})</h2>
        <button class="btn btn-primary sm" id="btn-export-pedidos">📥 Exportar a Excel</button>
    </div>
    
    <div class="animate-up delay-1">` +
    table([
      ['N.º', p => `<b>#${p.id}</b>`], 
      ['Fecha', p => `<span class="muted">${fecha(p.creado)}</span>`], 
      ['Cliente', p => esc(p.cliente)], 
      ['Moto', p => `<b>${esc(p.moto)}</b>`], 
      ['Estado', p => estadoTag(p.estado)]
    ], ps, 'No hay pedidos registrados.') + `</div>`;

    // Lógica para exportar pedidos
    $('#btn-export-pedidos').onclick = () => {
        const datosLimpios = ps.map(p => ({
            'N° Pedido': p.id,
            'Fecha': fecha(p.creado),
            'Cliente': p.cliente,
            'Moto': p.moto,
            'Estado': ESTADOS[p.estado],
            'Nota': p.nota || ''
        }));
        exportarExcel(datosLimpios, 'Pedidos_MotoAltiplano');
    };
  } },
  
  { id: 'usuarios', label: 'Usuarios', async render(v, again) {
    const us = await api('/admin/usuarios');
    
    v.innerHTML = `
    <div class="card form-card animate-up">
      <h2 class="section-title">Crear nuevo usuario</h2>
      <form id="uf" class="grid">
        ${field('nombre', 'Nombre completo', 'text', 'placeholder="Ej: Ana Torres"')}
        ${field('email', 'Correo electrónico', 'email', 'placeholder="ana@correo.com"')}
        ${field('password', 'Contraseña', 'password', 'minlength=8 placeholder="••••••••"')}
        <label>Rol<select name="rol"><option value="cliente">Cliente</option><option value="trabajador">Trabajador</option><option value="admin">Admin</option></select></label>
        <button class="btn btn-primary" style="grid-column: 1 / -1;">Registrar Usuario</button>
      </form>
    </div>
    
    <!-- AQUÍ ESTÁ EL BOTÓN DE EXPORTAR USUARIOS -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2.5rem; margin-bottom:1rem;" class="animate-up">
        <h2 class="section-title" style="margin:0;">Directorio (${us.length})</h2>
        <button class="btn btn-primary sm" id="btn-export-usuarios">📥 Exportar a Excel</button>
    </div>
    
    <div class="animate-up delay-1">` +
      table([
        ['Nombre', u => `<b>${esc(u.nombre)}</b>`], 
        ['Correo', u => `<span class="muted">${esc(u.email)}</span>`], 
        ['Rol', u => {
            let colorClass = u.rol === 'admin' ? 'cancelado' : (u.rol === 'trabajador' ? 'en_proceso' : 'pendiente');
            return `<span class="tag ${colorClass}" style="text-transform:capitalize">${esc(u.rol)}</span>`;
        }],
        ['Estado', u => `<span class="tag ${u.activo ? 'on' : 'off'}">${u.activo ? 'Activo' : 'Inactivo'}</span>`],
        ['Acciones', u => `<button class="btn ghost sm" data-t="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>`]
      ], us) + `</div>`;
      
    $('#uf').onsubmit = async e => { 
      e.preventDefault(); 
      const btn = e.target.querySelector('button[type="submit"], button:not([type])');
      btn.disabled = true; btn.textContent = 'Registrando...';
      try { await api('/admin/usuarios', { method: 'POST', body: formData(e.target) }); toast('Usuario creado'); again(); } 
      catch (err) { toast(err.message); btn.disabled = false; btn.textContent = 'Registrar Usuario'; }
    };

    // Lógica para exportar usuarios
    $('#btn-export-usuarios').onclick = () => {
        const datosLimpios = us.map(u => ({
            'Nombre': u.nombre,
            'Correo': u.email,
            'Rol': u.rol.toUpperCase(),
            'Estado': u.activo ? 'Activo' : 'Inactivo'
        }));
        exportarExcel(datosLimpios, 'Usuarios_MotoAltiplano');
    };

    v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => run(() => api(`/admin/usuarios/${b.dataset.t}/activo`, { method: 'PATCH' }), 'Estado actualizado', again));
  } },
] });