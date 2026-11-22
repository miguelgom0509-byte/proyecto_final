/* =========================================================
   PANEL DEL TRABAJADOR
   Resumen · Pedidos · Inventario · Precios · Cotizador
   (usa los componentes compartidos de panelx.js)
   ========================================================= */
const wp = { q: '', estado: '', pag: 1 };      // pedidos
const wi = { q: '', filtro: '', pag: 1 };      // inventario
const wr = { q: '', marca: '', tipo: '', pag: 1 }; // precios
const wc = { id: 0, pct: 20, n: 36, tel: '' }; // cotizador

const SIGUIENTE = { pendiente: ['en_proceso', 'Atender'], en_proceso: ['entregado', 'Entregar'] };

/** Cambia el estado de un pedido y avisa del resultado. */
async function cambiarEstado(id, estado) {
  try { await api(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }); toast('Pedido actualizado'); return true; }
  catch (e) { toast(e.message); return false; }
}
const refrescarVista = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

/** Modal para sumar unidades (llegada de mercadería) o fijar el stock. */
function modalStock(m, listo) {
  const md = abrirModal({
    titulo: 'Ajustar stock', subtitulo: `${m.marca} ${m.modelo} · hoy hay ${m.stock} unidad${m.stock === 1 ? '' : 'es'}`, chico: true,
    cuerpo: `<form id="ms-f" novalidate>
      <div class="am-grid">
        <label class="am-f s6"><span>Unidades que llegaron</span><input name="mas" type="number" min="0" step="1" value="0" inputmode="numeric"><small>Se suman al stock actual.</small></label>
      </div><p class="am-text" id="ms-res">Quedarán <b>${m.stock}</b> unidades.</p></form>`,
    pie: `<span class="am-error" id="ms-err"></span><button type="button" class="btn btn-ghost" data-no>Cancelar</button><button type="submit" form="ms-f" class="btn btn-primary" id="ms-ok">Guardar</button>`,
  });
  const f = md.el.querySelector('#ms-f'), inp = f.elements.mas;
  inp.oninput = () => { md.el.querySelector('#ms-res').innerHTML = `Quedarán <b>${m.stock + (parseInt(inp.value, 10) || 0)}</b> unidades.`; };
  md.el.querySelector('[data-no]').onclick = () => md.cerrar();
  f.onsubmit = async e => {
    e.preventDefault();
    const mas = parseInt(inp.value, 10);
    if (!Number.isInteger(mas) || mas < 0) { md.el.querySelector('#ms-err').textContent = 'Ingresa un número de 0 en adelante.'; return; }
    const b = md.el.querySelector('#ms-ok'); b.disabled = true;
    try { await api(`/motos/${m.id}/stock`, { method: 'PATCH', body: { stock: m.stock + mas } }); toast('Stock actualizado'); md.cerrar(); listo(); }
    catch (er) { md.el.querySelector('#ms-err').textContent = er.message; b.disabled = false; }
  };
}

/* ---------- RESUMEN ---------- */
async function wkResumen(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  const [pedidos, motos] = await Promise.all([api('/pedidos'), api('/motos?todas=true')]);
  if (v._tk !== tk) return;
  const cola = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_proceso').sort((a, b) => a.id - b.id);
  const pend = pedidos.filter(p => p.estado === 'pendiente').length, proc = pedidos.filter(p => p.estado === 'en_proceso').length;
  const hoy = new Date().toDateString();
  const entHoy = pedidos.filter(p => p.estado === 'entregado' && new Date(p.creado).toDateString() === hoy).length;
  const bajo = motos.filter(m => m.activo && m.stock <= 3).sort((a, b) => a.stock - b.stock);
  const nombre = (session.user && session.user.nombre || '').split(' ')[0] || 'equipo';
  const h = new Date().getHours(), saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const kpi = (l, n, sub, c) => `<div class="kpi-card animate-up"><div class="kpi-header"><span class="kpi-label">${l}</span></div><div class="kpi-value" style="${c ? `color:${c}` : ''}">${n}</div><div class="kpi-sub">${sub}</div></div>`;

  v.innerHTML = `
    <div class="pg-head animate-up"><div><h2>${saludo}, ${esc(nombre)}</h2><p>Esto es lo que necesita tu atención hoy.</p></div>
      <div class="pg-actions"><a class="btn btn-ghost" href="#cotizador">Nueva cotización</a><a class="btn btn-primary" href="#pedidos">Ver todos los pedidos</a></div></div>
    <div class="grid-kpi">
      ${kpi('Por atender', pend, pend ? 'Pedidos nuevos esperando' : 'Sin pedidos nuevos', pend ? 'var(--accent-orange)' : '')}
      ${kpi('En proceso', proc, 'Pedidos en atención')}
      ${kpi('Entregados hoy', entHoy, 'Pedidos cerrados')}
      ${kpi('Stock bajo', bajo.length, bajo.length ? 'Modelos con 3 o menos unidades' : 'Todo en niveles óptimos', bajo.length ? 'var(--accent-red)' : '')}
    </div>
    <div class="wk-grid">
      <div class="table-card animate-up delay-1">
        <div class="table-header"><h3 class="table-title">Cola de trabajo</h3><a href="#pedidos" class="btn btn-ghost btn-sm">Ver todos</a></div>
        <div class="wk-list" id="wk-cola">${cola.length ? cola.slice(0, 8).map(p => {
          const s = SIGUIENTE[p.estado];
          return `<div class="wk-item"><button type="button" class="wk-main" data-det="${p.id}"><b>${esc(p.cliente)}</b><span>${esc(p.moto)} · ${tiempoRel(p.creado)}</span>${p.nota ? `<em>“${esc(p.nota)}”</em>` : ''}</button>
            ${estadoTag(p.estado)}<button type="button" class="btn btn-primary btn-sm" data-go="${p.id}|${s[0]}">${s[1]}</button></div>`;
        }).join('') : '<div class="empty-state" style="border:0"><p>No hay pedidos por atender. ¡Buen trabajo!</p></div>'}</div>
      </div>
      <div class="table-card animate-up delay-2">
        <div class="table-header"><h3 class="table-title">Reponer stock</h3><a href="#inventario" class="btn btn-ghost btn-sm">Inventario</a></div>
        <div class="wk-list" id="wk-bajo">${bajo.length ? bajo.slice(0, 8).map(m => `<div class="wk-item">
          ${m.imagen ? `<img class="stock-img" src="${esc(m.imagen)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="wk-main" style="cursor:default"><b>${esc(m.marca)} ${esc(m.modelo)}</b><span>${esc(m.tipo)}</span></div>
          ${stockTag(m.stock)}<button type="button" class="btn btn-ghost btn-sm" data-rep="${m.id}">Reponer</button></div>`).join('')
          : '<div class="empty-state" style="border:0"><p>Todo el inventario está en niveles óptimos.</p></div>'}</div>
      </div>
    </div>`;

  $('#wk-cola').onclick = async e => {
    const d = e.target.closest('[data-det]'), g = e.target.closest('[data-go]');
    if (d) detallePedido(cola.find(p => p.id === +d.dataset.det), { motos, alCambiar: refrescarVista });
    if (g) { g.disabled = true; const [id, est] = g.dataset.go.split('|'); if (await cambiarEstado(id, est)) refrescarVista(); else g.disabled = false; }
  };
  $('#wk-bajo').onclick = e => { const b = e.target.closest('[data-rep]'); if (b) modalStock(motos.find(m => m.id === +b.dataset.rep), refrescarVista); };
}

/* ---------- PEDIDOS ---------- */
async function wkPedidos(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  let [ps, motos] = await Promise.all([api('/pedidos'), api('/motos?todas=true')]);
  if (v._tk !== tk) return;
  v.innerHTML = `
    <div class="pg-head animate-up"><div><h2>Pedidos</h2><p>Atiende las solicitudes en orden y mantén informado al cliente.</p></div>
      <div class="pg-actions"><button class="btn btn-ghost" id="wp-exp" type="button">${I.dl} Exportar CSV</button></div></div>
    <div class="table-card animate-up delay-1">
      <div class="toolbar"><div class="chips" id="wp-chips" role="group" aria-label="Filtrar por estado"></div>
        <div class="tb-search" style="margin-left:auto;max-width:320px">${I.search}<input id="wp-q" type="search" placeholder="Cliente, moto o nota" aria-label="Buscar" value="${esc(wp.q)}"></div></div>
      <div id="wp-tabla"></div></div>`;
  const filtrar = () => { const q = norm(wp.q); return ps.filter(p => (!wp.estado || p.estado === wp.estado) && (!q || norm(`${p.cliente} ${p.moto} ${p.nota || ''} ${p.id}`).includes(q))); };
  const pintar = () => {
    const cuenta = e => ps.filter(p => !e || p.estado === e).length;
    $('#wp-chips').innerHTML = [['', 'Todos'], ...Object.entries(ESTADOS)].map(([k, l]) => `<button type="button" class="chip" data-est="${k}" aria-pressed="${wp.estado === k}">${l}<span>${cuenta(k)}</span></button>`).join('');
    const lista = filtrar(), p = paginar(lista, wp.pag, 12); wp.pag = p.pag;
    $('#wp-tabla').innerHTML = !lista.length ? '<div class="empty-state" style="border:0;border-radius:0"><p>No hay pedidos con esos filtros.</p></div>' :
      `<div class="table-responsive"><table class="data-table"><thead><tr><th>N.º</th><th>Recibido</th><th>Cliente</th><th>Moto</th><th>Estado</th><th></th></tr></thead><tbody>
      ${p.filas.map(x => { const s = SIGUIENTE[x.estado]; return `<tr>
        <td><b>#${x.id}</b></td><td>${tiempoRel(x.creado)}</td><td><b>${esc(x.cliente)}</b>${x.nota ? `<br><small class="nota-cell" title="${esc(x.nota)}">“${esc(x.nota)}”</small>` : ''}</td><td>${esc(x.moto)}</td><td>${estadoTag(x.estado)}</td>
        <td><div class="row-actions">${s ? `<button type="button" class="btn btn-primary btn-sm" data-go="${x.id}|${s[0]}">${s[1]}</button>` : ''}<button type="button" class="icon-action" data-det="${x.id}" title="Ver detalle" aria-label="Ver detalle del pedido ${x.id}">${I.eye}</button></div></td></tr>`; }).join('')}
      </tbody></table></div>${p.html}`;
  };
  pintar();
  $('#wp-q').oninput = debounce(e => { wp.q = e.target.value; wp.pag = 1; pintar(); });
  $('#wp-chips').onclick = e => { const b = e.target.closest('[data-est]'); if (b) { wp.estado = b.dataset.est; wp.pag = 1; pintar(); } };
  enlazarExport('wp-exp', () => filtrar().map(p => ({ 'N° Pedido': p.id, 'Fecha': fecha(p.creado), 'Cliente': p.cliente, 'Moto': p.moto, 'Estado': ESTADOS[p.estado], 'Nota': p.nota || '' })), 'Pedidos', 'Pedidos');
  const recargar = async () => { [ps, motos] = await Promise.all([api('/pedidos'), api('/motos?todas=true')]); pintar(); };
  $('#wp-tabla').onclick = async e => {
    const pg = e.target.closest('[data-pag]'), d = e.target.closest('[data-det]'), g = e.target.closest('[data-go]');
    if (pg) { wp.pag = +pg.dataset.pag; pintar(); }
    if (d) detallePedido(ps.find(x => x.id === +d.dataset.det), { motos, alCambiar: recargar });
    if (g) { g.disabled = true; const [id, est] = g.dataset.go.split('|'); await cambiarEstado(id, est); recargar(); }
  };
}

/* ---------- INVENTARIO ---------- */
async function wkInventario(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  let ms = await api('/motos?todas=true');
  if (v._tk !== tk) return;
  v.innerHTML = `
    <div class="pg-head animate-up"><div><h2>Inventario</h2><p>Controla las existencias y registra la llegada de unidades.</p></div>
      <div class="pg-actions"><button class="btn btn-ghost" id="wi-exp" type="button">${I.dl} Exportar CSV</button></div></div>
    <div class="mini-stats animate-up" id="wi-res"></div>
    <div class="table-card animate-up delay-1">
      <div class="toolbar"><div class="tb-search">${I.search}<input id="wi-q" type="search" placeholder="Buscar por marca o modelo" aria-label="Buscar" value="${esc(wi.q)}"></div>
        <select id="wi-f" aria-label="Filtrar por stock"><option value="">Todo el stock</option><option value="bajo">Stock bajo (1–3)</option><option value="cero">Sin stock</option><option value="ok">Stock suficiente</option></select>
        <span class="tb-count" id="wi-n"></span></div>
      <div id="wi-tabla"></div></div>`;
  $('#wi-f').value = wi.filtro;
  const filtrar = () => { const q = norm(wi.q); return ms.filter(m => (!q || norm(`${m.marca} ${m.modelo} ${m.tipo}`).includes(q)) &&
    (!wi.filtro || (wi.filtro === 'cero' ? m.stock === 0 : wi.filtro === 'bajo' ? m.stock > 0 && m.stock <= 3 : m.stock > 3))); };
  const pintar = () => {
    const act = ms.filter(m => m.activo);
    $('#wi-res').innerHTML = [['Modelos', act.length], ['Unidades', act.reduce((s, m) => s + m.stock, 0)], ['Stock bajo', act.filter(m => m.stock > 0 && m.stock <= 3).length], ['Sin stock', act.filter(m => m.stock === 0).length]].map(([l, n]) => `<div class="mini-stat"><small>${l}</small><b>${n}</b></div>`).join('');
    const lista = filtrar(), p = paginar(lista, wi.pag, 12); wi.pag = p.pag;
    $('#wi-n').textContent = `${lista.length} de ${ms.length} modelos`;
    $('#wi-tabla').innerHTML = !lista.length ? '<div class="empty-state" style="border:0;border-radius:0"><p>No hay motos con esos filtros.</p></div>' :
      `<div class="table-responsive"><table class="data-table"><thead><tr><th>Moto</th><th>Stock</th><th>Ajuste rápido</th><th></th></tr></thead><tbody>
      ${p.filas.map(m => `<tr data-m="${m.id}">
        <td><div class="cell-moto"><div class="thumb">${m.imagen ? `<img src="${esc(m.imagen)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div><div><b>${esc(m.marca)} ${esc(m.modelo)}</b><small>${esc(m.tipo)} · ${m.cc} cc${m.activo ? '' : ' · oculta'}</small></div></div></td>
        <td>${stockTag(m.stock)}</td>
        <td><div class="stepper"><button type="button" data-d="-1" aria-label="Restar una unidad">−</button><input type="number" min="0" step="1" value="${m.stock}" data-orig="${m.stock}" aria-label="Unidades de ${esc(m.modelo)}"><button type="button" data-d="1" aria-label="Sumar una unidad">+</button>
          <button type="button" class="btn btn-primary btn-sm" data-save disabled>Guardar</button></div></td>
        <td><div class="row-actions"><button type="button" class="btn btn-ghost btn-sm" data-rep="${m.id}">Llegada</button></div></td></tr>`).join('')}
      </tbody></table></div>${p.html}`;
  };
  pintar();
  $('#wi-q').oninput = debounce(e => { wi.q = e.target.value; wi.pag = 1; pintar(); });
  $('#wi-f').onchange = e => { wi.filtro = e.target.value; wi.pag = 1; pintar(); };
  enlazarExport('wi-exp', () => filtrar().map(m => ({ 'Marca': m.marca, 'Modelo': m.modelo, 'Tipo': m.tipo, 'cc': m.cc, 'Stock': m.stock, 'Visible': m.activo ? 'Sí' : 'No' })), 'Inventario', 'Inventario');
  const recargar = async () => { ms = await api('/motos?todas=true'); pintar(); };
  const sucio = fila => { const i = fila.querySelector('input'); fila.querySelector('[data-save]').disabled = String(i.value) === i.dataset.orig || i.value === ''; };
  $('#wi-tabla').oninput = e => { const f = e.target.closest('tr[data-m]'); if (f && e.target.matches('input')) sucio(f); };
  $('#wi-tabla').onclick = async e => {
    const pg = e.target.closest('[data-pag]'), d = e.target.closest('[data-d]'), s = e.target.closest('[data-save]'), r = e.target.closest('[data-rep]');
    if (pg) { wi.pag = +pg.dataset.pag; pintar(); return; }
    if (r) return modalStock(ms.find(m => m.id === +r.dataset.rep), recargar);
    const fila = e.target.closest('tr[data-m]'); if (!fila) return;
    const inp = fila.querySelector('input');
    if (d) { inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + +d.dataset.d); sucio(fila); }
    if (s) {
      const n = parseInt(inp.value, 10);
      if (!Number.isInteger(n) || n < 0) return toast('El stock debe ser un número de 0 en adelante');
      s.disabled = true;
      try { await api(`/motos/${fila.dataset.m}/stock`, { method: 'PATCH', body: { stock: n } }); toast('Stock actualizado'); await recargar(); }
      catch (er) { toast(er.message); s.disabled = false; }
    }
  };
}

/* ---------- PRECIOS (consulta) ---------- */
async function wkPrecios(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  const ms = (await api('/motos?todas=true')).filter(m => m.activo);
  if (v._tk !== tk) return;
  const marcas = [...new Set(ms.map(m => m.marca))].sort(), tipos = [...new Set(ms.map(m => m.tipo))].sort();
  v.innerHTML = `
    <div class="pg-head animate-up"><div><h2>Precios y bonos</h2><p>Consulta rápida para atender al cliente. Solo lectura.</p></div></div>
    <div class="table-card animate-up delay-1">
      <div class="toolbar"><div class="tb-search">${I.search}<input id="wr-q" type="search" placeholder="Buscar por marca o modelo" aria-label="Buscar" value="${esc(wr.q)}"></div>
        <select id="wr-m" aria-label="Marca"><option value="">Todas las marcas</option>${marcas.map(x => `<option ${wr.marca === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
        <select id="wr-t" aria-label="Tipo"><option value="">Todos los tipos</option>${tipos.map(x => `<option ${wr.tipo === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
        <span class="tb-count" id="wr-n"></span></div>
      <div id="wr-tabla"></div></div>`;
  const filtrar = () => { const q = norm(wr.q); return ms.filter(m => (!q || norm(`${m.marca} ${m.modelo}`).includes(q)) && (!wr.marca || m.marca === wr.marca) && (!wr.tipo || m.tipo === wr.tipo)); };
  const pintar = () => {
    const lista = filtrar(), p = paginar(lista, wr.pag, 14); wr.pag = p.pag;
    $('#wr-n').textContent = `${lista.length} modelos`;
    $('#wr-tabla').innerHTML = !lista.length ? '<div class="empty-state" style="border:0;border-radius:0"><p>No hay motos con esos filtros.</p></div>' :
      `<div class="table-responsive"><table class="data-table"><thead><tr><th>Moto</th><th>Precio lista</th><th>Solo tarjeta</th><th>Bono</th><th>Stock</th><th></th></tr></thead><tbody>
      ${p.filas.map(m => `<tr><td><div class="cell-moto"><div class="thumb">${m.imagen ? `<img src="${esc(m.imagen)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div><div><b>${esc(m.marca)} ${esc(m.modelo)}</b><small>${esc(m.tipo)} · ${m.cc} cc</small></div></div></td>
        <td><b>${money(m.precio, m.moneda)}</b>${m.precio_nota ? `<br><small class="nota-cell" title="${esc(m.precio_nota)}">${esc(m.precio_nota)}</small>` : ''}</td>
        <td>${m.precio_tarjeta ? money(m.precio_tarjeta, m.moneda) : '<span style="opacity:.4">—</span>'}</td>
        <td>${m.bono ? money(m.bono, m.moneda) : '<span style="opacity:.4">—</span>'}</td><td>${stockTag(m.stock)}</td>
        <td><div class="row-actions"><button type="button" class="icon-action" data-ver="${m.id}" title="Ficha rápida" aria-label="Ficha rápida de ${esc(m.modelo)}">${I.eye}</button><button type="button" class="icon-action" data-cot="${m.id}" title="Copiar cotización" aria-label="Copiar cotización de ${esc(m.modelo)}">${I.copy}</button><a class="icon-action" href="#cotizador" data-q="${m.id}" title="Abrir en el cotizador" aria-label="Cotizar ${esc(m.modelo)}">${I.wa}</a></div></td></tr>`).join('')}
      </tbody></table></div>${p.html}`;
  };
  pintar();
  $('#wr-q').oninput = debounce(e => { wr.q = e.target.value; wr.pag = 1; pintar(); });
  $('#wr-m').onchange = e => { wr.marca = e.target.value; wr.pag = 1; pintar(); };
  $('#wr-t').onchange = e => { wr.tipo = e.target.value; wr.pag = 1; pintar(); };
  $('#wr-tabla').onclick = e => {
    const pg = e.target.closest('[data-pag]'), a = e.target.closest('[data-ver]'), b = e.target.closest('[data-cot]'), q = e.target.closest('[data-q]');
    if (pg) { wr.pag = +pg.dataset.pag; pintar(); }
    if (a) fichaRapida(ms.find(m => m.id === +a.dataset.ver));
    if (b) copiarTexto(textoCotizacion(ms.find(m => m.id === +b.dataset.cot)), 'Cotización copiada');
    if (q) wc.id = +q.dataset.q;
  };
}

/* ---------- COTIZADOR ---------- */
async function wkCotizador(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  const ms = (await api('/motos?todas=true')).filter(m => m.activo);
  if (v._tk !== tk) return;
  if (!ms.find(m => m.id === wc.id)) wc.id = ms[0] ? ms[0].id : 0;
  const marcas = [...new Set(ms.map(m => m.marca))].sort();
  v.innerHTML = `
    <div class="pg-head animate-up"><div><h2>Cotizador</h2><p>Arma una cotización para el cliente y envíala por WhatsApp.</p></div></div>
    <div class="cq-grid">
      <div class="table-card animate-up delay-1"><div class="cq-form">
        <label class="am-f"><span>Moto</span><select id="cq-m">${marcas.map(x => `<optgroup label="${esc(x)}">${ms.filter(m => m.marca === x).map(m => `<option value="${m.id}" ${m.id === wc.id ? 'selected' : ''}>${esc(m.modelo)} — ${money(m.precio, m.moneda)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <label class="am-f"><span>Inicial: <b id="cq-pv">${wc.pct} %</b></span><input id="cq-p" type="range" min="10" max="60" step="5" value="${wc.pct}"></label>
        <label class="am-f"><span>Plazo</span><select id="cq-n">${[12, 24, 36, 48].map(n => `<option value="${n}" ${n === wc.n ? 'selected' : ''}>${n} meses</option>`).join('')}<option value="0" ${wc.n === 0 ? 'selected' : ''}>Al contado</option></select></label>
        <label class="am-f"><span>WhatsApp del cliente <small style="font-weight:400">(opcional)</small></span><input id="cq-t" type="tel" inputmode="numeric" placeholder="Ej: 987654321" value="${esc(wc.tel)}"></label>
      </div></div>
      <div class="table-card animate-up delay-2"><div class="cq-res" id="cq-res"></div></div>
    </div>`;
  const pintar = () => {
    const m = ms.find(x => x.id === wc.id); if (!m) return;
    const sol = enSoles(m), ini = sol * wc.pct / 100, fin = sol - ini, cuota = wc.n ? cuotaRef(m, wc.pct / 100, wc.n) : 0;
    const txt = textoCotizacion(m, wc.pct / 100, wc.n);
    const tel = String(wc.tel).replace(/\D/g, '');
    const num = tel.length === 9 ? '51' + tel : tel.length >= 10 ? tel : '';
    $('#cq-res').innerHTML = `
      <div class="nx-ped-top">${m.imagen ? `<img src="${esc(m.imagen)}" alt="" onerror="this.style.display='none'">` : ''}<div><h4>${esc(m.marca)} ${esc(m.modelo)}</h4><p>${esc(m.tipo)} · ${m.cc} cc · ${stockTag(m.stock)}</p></div></div>
      <div class="cq-cuota"><span>${wc.n ? `${wc.n} cuotas de` : 'Pago al contado'}</span><b>${wc.n ? solesTxt(cuota) : solesTxt(sol)}</b></div>
      <div class="nx-datos"><div><span>Precio lista</span><b>${money(m.precio, m.moneda)}</b></div>
        ${wc.n ? `<div><span>Inicial (${wc.pct} %)</span><b>${solesTxt(ini)}</b></div><div><span>Monto a financiar</span><b>${solesTxt(fin)}</b></div><div><span>Total en cuotas</span><b>${solesTxt(cuota * wc.n)}</b></div>` : ''}
        ${m.precio_tarjeta ? `<div><span>Solo con tarjeta</span><b>${money(m.precio_tarjeta, m.moneda)}</b></div>` : ''}</div>
      <label class="am-f"><span>Mensaje para el cliente</span><textarea id="cq-txt" rows="7" readonly>${esc(txt)}</textarea></label>
      <p class="cq-nota">Cuota referencial con TEA 15 % y tipo de cambio S/ 3.75. No incluye seguros ni gastos administrativos.</p>
      <div class="cq-act"><button type="button" class="btn btn-ghost" id="cq-copy">${I.copy} Copiar mensaje</button>
        <a class="btn btn-primary" id="cq-wa" target="_blank" rel="noopener" href="https://wa.me/${num}?text=${encodeURIComponent(txt)}">${I.wa} Enviar por WhatsApp</a></div>`;
    $('#cq-copy').onclick = () => copiarTexto(txt, 'Mensaje copiado');
  };
  pintar();
  $('#cq-m').onchange = e => { wc.id = +e.target.value; pintar(); };
  $('#cq-p').oninput = e => { wc.pct = +e.target.value; $('#cq-pv').textContent = wc.pct + ' %'; pintar(); };
  $('#cq-n').onchange = e => { wc.n = +e.target.value; pintar(); };
  $('#cq-t').oninput = e => { wc.tel = e.target.value; pintar(); };
}

mountPanel({ rol: 'trabajador', title: 'Trabajador', sections: [
  { id: 'resumen', label: 'Resumen', render: wkResumen },
  { id: 'pedidos', label: 'Pedidos', render: wkPedidos },
  { id: 'inventario', label: 'Inventario', render: wkInventario },
  { id: 'precios', label: 'Precios', render: wkPrecios },
  { id: 'cotizador', label: 'Cotizador', render: wkCotizador },
] });
document.body.classList.add('admin');
panelX({ admin: false, inventario: 'inventario', alCambiar: refrescarVista });