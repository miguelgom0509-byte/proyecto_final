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


/* =========================================================
   Utilidades del panel: iconos, modal, confirmación, paginación
   ========================================================= */
const I = {
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>',
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  dl: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};
const TC_USD = 3.75;
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const debounce = (fn, ms = 180) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/** Abre un cuadro de diálogo. Devuelve { el, cerrar }. Esc, clic fuera y la X lo cierran. */
function abrirModal({ titulo, subtitulo = '', cuerpo, pie = '', chico = false, alCerrar }) {
  const previo = document.activeElement;
  const el = document.createElement('div');
  el.className = 'am-backdrop';
  el.innerHTML = `
    <div class="am-dialog ${chico ? 'am-sm' : ''}" role="dialog" aria-modal="true" aria-labelledby="am-t">
      <div class="am-head">
        <div><h3 id="am-t">${esc(titulo)}</h3>${subtitulo ? `<p>${esc(subtitulo)}</p>` : ''}</div>
        <button type="button" class="am-x" aria-label="Cerrar" data-x>${I.x}</button>
      </div>
      <div class="am-body">${cuerpo}</div>
      ${pie ? `<div class="am-foot">${pie}</div>` : ''}
    </div>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  const cerrar = (valor) => {
    document.removeEventListener('keydown', tecla);
    el.remove();
    document.body.style.overflow = '';
    if (previo && previo.focus) previo.focus();
    if (alCerrar) alCerrar(valor);
  };
  const tecla = e => { if (e.key === 'Escape') cerrar(); };
  document.addEventListener('keydown', tecla);
  el.addEventListener('mousedown', e => { if (e.target === el) cerrar(); });
  el.querySelector('[data-x]').onclick = () => cerrar();
  const primero = el.querySelector('input:not([type=hidden]):not(:disabled), select:not(:disabled), button.btn');
  if (primero) setTimeout(() => primero.focus(), 30);
  return { el, cerrar };
}

/** Confirmación con botones propios. Devuelve una promesa con true / false. */
function confirmar({ titulo, texto, ok = 'Confirmar', peligro = false }) {
  return new Promise(res => {
    let hecho = false;
    const m = abrirModal({
      titulo, chico: true, cuerpo: `<p class="am-text">${texto}</p>`,
      pie: `<button type="button" class="btn btn-ghost" data-no>Cancelar</button>
            <button type="button" class="btn ${peligro ? 'btn-danger-solid' : 'btn-primary'}" data-si>${esc(ok)}</button>`,
      alCerrar: () => { if (!hecho) res(false); },
    });
    m.el.querySelector('[data-no]').onclick = () => m.cerrar();
    m.el.querySelector('[data-si]').onclick = () => { hecho = true; res(true); m.cerrar(); };
  });
}

/** Campo de formulario del modal. */
function campo(name, label, { type = 'text', val = '', req = false, span = '', attrs = '', hint = '', prefix = '', list = '' } = {}) {
  const input = `<input name="${name}" type="${type}" value="${esc(val)}" ${req ? 'required' : ''} ${list ? `list="${list}"` : ''} ${attrs}>`;
  return `<label class="am-f ${span}"><span>${label}${req ? '<i>*</i>' : ''}</span>${prefix ? `<div class="am-prefix"><em>${prefix}</em>${input}</div>` : input}${hint ? `<small>${hint}</small>` : ''}</label>`;
}
const interruptor = (name, titulo, desc, on, disabled = false) =>
  `<label class="am-switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="trk"></span><span><b>${titulo}</b><small>${desc}</small></span></label>`;

/** Paginación simple: devuelve el HTML del pie y el recorte de la lista. */
function paginar(lista, pag, por = 12) {
  const total = lista.length, pags = Math.max(1, Math.ceil(total / por));
  pag = Math.min(Math.max(1, pag), pags);
  const ini = (pag - 1) * por;
  const nums = [];
  for (let i = 1; i <= pags; i++) if (i === 1 || i === pags || Math.abs(i - pag) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  const html = total <= por ? `<div class="pager"><span>${total} registro${total === 1 ? '' : 's'}</span></div>` : `
    <div class="pager"><span>Mostrando ${ini + 1}–${Math.min(total, ini + por)} de ${total}</span>
      <div class="pager-btns">
        <button type="button" data-pag="${pag - 1}" ${pag === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>
        ${nums.map(n => n === '…' ? '<span>…</span>' : `<button type="button" data-pag="${n}" ${n === pag ? 'aria-current="page"' : ''}>${n}</button>`).join('')}
        <button type="button" data-pag="${pag + 1}" ${pag === pags ? 'disabled' : ''} aria-label="Siguiente">›</button>
      </div></div>`;
  return { pag, filas: lista.slice(ini, ini + por), html };
}

const enSoles = m => (m.moneda === 'USD' ? m.precio * TC_USD : m.precio);
const iniciales = n => String(n || '?').trim().charAt(0).toUpperCase();
const miId = () => session.user && session.user.id;

/* ---------- Estado de filtros (se conserva al cambiar de sección) ---------- */
const inv = { q: '', marca: '', tipo: '', estado: '', orden: 'moto', dir: 1, pag: 1 };
const ped = { q: '', estado: '', pag: 1 };
const usu = { q: '', rol: '', pag: 1 };

/* =========================================================
   INVENTARIO
   ========================================================= */
function formMoto(m) {
  const nuevo = !m;
  m = m || { marca: 'Bajaj', modelo: '', anio: 2026, tipo: '', cc: '', moneda: 'PEN', precio: '', precio_tarjeta: '', bono: '', precio_nota: '', stock: 0, imagen: '', activo: true };
  return `
  <form id="mf" novalidate>
    <fieldset class="am-fieldset"><legend>Datos de la moto</legend><div class="am-grid">
      ${campo('marca', 'Marca', { val: m.marca, req: true, list: 'dl-marcas', span: '' })}
      ${campo('modelo', 'Modelo', { val: m.modelo, req: true, attrs: 'placeholder="Ej: Pulsar N160 FI"' })}
      ${campo('tipo', 'Tipo', { val: m.tipo, req: true, list: 'dl-tipos', span: 's2', attrs: 'placeholder="Ej: Naked"' })}
      ${campo('anio', 'Año', { type: 'number', val: m.anio, req: true, span: 's2', attrs: 'min=2000 max=2100' })}
      ${campo('cc', 'Cilindrada', { type: 'number', val: m.cc, req: true, span: 's2', attrs: 'min=1 max=3000', hint: 'En cc' })}
    </div></fieldset>
    <fieldset class="am-fieldset"><legend>Precios</legend><div class="am-grid">
      <label class="am-f s2"><span>Moneda</span><select name="moneda"><option value="PEN" ${m.moneda === 'PEN' ? 'selected' : ''}>Soles (PEN)</option><option value="USD" ${m.moneda === 'USD' ? 'selected' : ''}>Dólares (USD)</option></select></label>
      ${campo('precio', 'Precio lista', { type: 'number', val: m.precio, req: true, span: 's2', attrs: 'min=1 step=any' })}
      ${campo('precio_tarjeta', 'Precio solo tarjeta', { type: 'number', val: m.precio_tarjeta ?? '', span: 's2', attrs: 'min=1 step=any', hint: 'Opcional' })}
      ${campo('bono', 'Bono de la marca', { type: 'number', val: m.bono ?? '', span: 's2', attrs: 'min=0 step=any', hint: 'Opcional, solo uso interno' })}
      ${campo('precio_nota', 'Nota de precio', { val: m.precio_nota || '', span: 's4', attrs: 'maxlength=120 placeholder="Ej: S/ 9,750 solo en color rojo"', hint: 'Opcional, se muestra bajo el precio' })}
    </div></fieldset>
    <fieldset class="am-fieldset"><legend>Inventario y visibilidad</legend><div class="am-grid">
      ${campo('stock', 'Unidades en stock', { type: 'number', val: m.stock, req: true, span: 's2', attrs: 'min=0 step=1' })}
      <div class="am-f s4">${interruptor('activo', 'Visible en el catálogo', 'Si lo apagas, la moto deja de mostrarse a los clientes.', m.activo)}</div>
    </div></fieldset>
    <fieldset class="am-fieldset"><legend>Imagen</legend>
      <div class="img-prev">
        <div class="box" id="mf-prev"><span>Sin imagen</span></div>
        <label class="am-f" style="flex:1"><span>Ruta o URL de la foto</span>
          <input name="imagen" type="text" value="${esc(m.imagen || '')}" placeholder="/recursos/image/motos/modelo.webp">
          <small>Ruta dentro del sitio (/recursos/…) o dirección completa (https://…).</small></label>
      </div>
    </fieldset>
    <datalist id="dl-marcas">${(window.__marcas || []).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    <datalist id="dl-tipos">${(window.__tipos || []).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
  </form>`;
}

function leerMoto(form) {
  const f = new FormData(form);
  const num = k => (f.get(k) === '' || f.get(k) == null ? null : Number(f.get(k)));
  return {
    marca: String(f.get('marca')).trim(), modelo: String(f.get('modelo')).trim(), tipo: String(f.get('tipo')).trim(),
    anio: num('anio'), cc: num('cc'), moneda: f.get('moneda'), precio: num('precio'), stock: num('stock'),
    precio_tarjeta: num('precio_tarjeta'), bono: num('bono'), precio_nota: String(f.get('precio_nota') || '').trim(),
    imagen: String(f.get('imagen') || '').trim(), activo: form.elements.activo.checked,
  };
}

function validarFormMoto(d) {
  if (d.marca.length < 2) return 'La marca debe tener al menos 2 letras.';
  if (!d.modelo) return 'Escribe el modelo.';
  if (d.tipo.length < 2) return 'Indica el tipo de moto.';
  if (!Number.isInteger(d.anio) || d.anio < 2000 || d.anio > 2100) return 'El año debe estar entre 2000 y 2100.';
  if (!(d.cc > 0 && d.cc <= 3000)) return 'La cilindrada debe estar entre 1 y 3000 cc.';
  if (!(d.precio > 0)) return 'El precio lista debe ser mayor que cero.';
  if (d.precio_tarjeta !== null && !(d.precio_tarjeta > 0)) return 'El precio con tarjeta debe ser mayor que cero.';
  if (d.precio_tarjeta !== null && d.precio_tarjeta >= d.precio) return 'El precio con tarjeta debe ser menor que el precio lista.';
  if (d.bono !== null && !(d.bono >= 0)) return 'El bono no puede ser negativo.';
  if (!Number.isInteger(d.stock) || d.stock < 0) return 'El stock debe ser un número entero, 0 o mayor.';
  return '';
}

function modalMoto(m, guardado) {
  const nuevo = !m;
  const modal = abrirModal({
    titulo: nuevo ? 'Nueva moto' : 'Editar moto',
    subtitulo: nuevo ? 'Completa los datos para publicarla en el catálogo.' : `${m.marca} ${m.modelo}`,
    cuerpo: formMoto(m),
    pie: `<span class="am-error" id="mf-err" role="alert"></span>
          <button type="button" class="btn btn-ghost" data-no>Cancelar</button>
          <button type="button" class="btn btn-primary" data-ok>${nuevo ? 'Crear moto' : 'Guardar cambios'}</button>`,
  });
  const form = modal.el.querySelector('#mf'), err = modal.el.querySelector('#mf-err'), ok = modal.el.querySelector('[data-ok]');
  const prev = modal.el.querySelector('#mf-prev');
  const pintarFoto = () => {
    const v = form.elements.imagen.value.trim();
    prev.innerHTML = v ? `<img src="${esc(v)}" alt="" onerror="this.parentNode.innerHTML='<span>No se pudo cargar la imagen</span>'">` : '<span>Sin imagen</span>';
  };
  pintarFoto();
  form.elements.imagen.addEventListener('input', debounce(pintarFoto, 300));
  modal.el.querySelector('[data-no]').onclick = () => modal.cerrar();
  const enviar = async () => {
    const d = leerMoto(form), msg = validarFormMoto(d);
    if (msg) { err.textContent = msg; return; }
    err.textContent = ''; ok.disabled = true; const txt = ok.textContent; ok.textContent = 'Guardando…';
    try {
      if (nuevo) await api('/motos', { method: 'POST', body: d });
      else await api('/motos/' + m.id, { method: 'PUT', body: d });
      modal.cerrar(); toast(nuevo ? 'Moto creada' : 'Cambios guardados'); guardado();
    } catch (e) { err.textContent = e.message || 'No se pudo guardar.'; ok.disabled = false; ok.textContent = txt; }
  };
  ok.onclick = enviar;
  form.onsubmit = e => { e.preventDefault(); enviar(); };
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); enviar(); } });
}

async function renderInventario(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  let motos = await api('/motos?todas=true');
  if (v._tk !== tk) return;
  window.__marcas = [...new Set(motos.map(m => m.marca))].sort();
  window.__tipos = [...new Set(motos.map(m => m.tipo))].sort();

  v.innerHTML = `
    <div class="pg-head animate-up">
      <div><h2>Inventario</h2><p>Administra el catálogo: precios, existencias y qué motos ven los clientes.</p></div>
      <div class="pg-actions">
        <button class="btn btn-ghost" id="inv-exp" type="button">${I.dl} Exportar CSV</button>
        <button class="btn btn-primary" id="inv-new" type="button">${I.plus} Nueva moto</button>
      </div>
    </div>
    <div class="mini-stats animate-up" id="inv-stats"></div>
    <div class="table-card animate-up delay-1">
      <div class="toolbar">
        <div class="tb-search">${I.search}<input id="inv-q" type="search" placeholder="Buscar por marca o modelo" aria-label="Buscar" value="${esc(inv.q)}"></div>
        <select id="inv-marca" aria-label="Marca"></select>
        <select id="inv-tipo" aria-label="Tipo"></select>
        <select id="inv-estado" aria-label="Estado">
          <option value="">Todas</option><option value="activa">Visibles</option><option value="inactiva">Dadas de baja</option>
          <option value="bajo">Stock bajo (3 o menos)</option><option value="sin">Sin stock</option>
        </select>
        <span class="tb-count" id="inv-count"></span>
      </div>
      <div id="inv-tabla"></div>
    </div>`;

  const opciones = (sel, todas, lista, actual) => { sel.innerHTML = `<option value="">${todas}</option>` + lista.map(x => `<option ${x === actual ? 'selected' : ''} value="${esc(x)}">${esc(x)}</option>`).join(''); };
  opciones($('#inv-marca'), 'Todas las marcas', window.__marcas, inv.marca);
  opciones($('#inv-tipo'), 'Todos los tipos', window.__tipos, inv.tipo);
  $('#inv-estado').value = inv.estado;

  const pintarStats = () => {
    const act = motos.filter(m => m.activo);
    const valor = act.reduce((s, m) => s + enSoles(m) * m.stock, 0);
    const bajo = act.filter(m => m.stock > 0 && m.stock <= 3).length, sin = act.filter(m => m.stock === 0).length;
    $('#inv-stats').innerHTML = `
      <div class="mini-stat"><small>Modelos</small><b>${motos.length}</b></div>
      <div class="mini-stat"><small>Visibles</small><b>${act.length}</b></div>
      <div class="mini-stat"><small>Unidades</small><b>${act.reduce((s, m) => s + m.stock, 0)}</b></div>
      <div class="mini-stat"><small>Stock bajo</small><b class="${bajo ? 'warn' : ''}">${bajo}</b></div>
      <div class="mini-stat"><small>Sin stock</small><b class="${sin ? 'bad' : ''}">${sin}</b></div>
      <div class="mini-stat"><small>Valor en stock</small><b>${money(valor)}</b></div>`;
  };

  const filtrar = () => {
    const q = norm(inv.q);
    let l = motos.filter(m =>
      (!q || norm(`${m.marca} ${m.modelo} ${m.tipo}`).includes(q)) && (!inv.marca || m.marca === inv.marca) && (!inv.tipo || m.tipo === inv.tipo) &&
      (!inv.estado || (inv.estado === 'activa' ? m.activo : inv.estado === 'inactiva' ? !m.activo : inv.estado === 'bajo' ? (m.activo && m.stock > 0 && m.stock <= 3) : (m.activo && m.stock === 0))));
    const key = { moto: m => norm(`${m.marca} ${m.modelo}`), precio: enSoles, stock: m => m.stock, cc: m => m.cc }[inv.orden];
    return l.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * inv.dir; });
  };

  const th = (k, txt, cls = '') => `<th class="${cls}" aria-sort="${inv.orden === k ? (inv.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-ord="${k}">${txt} <span class="arr">${inv.orden === k && inv.dir < 0 ? '▼' : '▲'}</span></button></th>`;

  const pintar = () => {
    const lista = filtrar(), p = paginar(lista, inv.pag, 12); inv.pag = p.pag;
    $('#inv-count').textContent = `${lista.length} de ${motos.length} modelos`;
    $('#inv-tabla').innerHTML = !lista.length
      ? '<div class="empty-state" style="border:0;border-radius:0"><p>Ninguna moto coincide con los filtros.</p></div>'
      : `<div class="table-responsive"><table class="data-table"><thead><tr>
          ${th('moto', 'Moto')}${th('cc', 'Cilindrada')}${th('precio', 'Precio')}${th('stock', 'Stock')}<th>Estado</th><th class="row-actions-th">Acciones</th></tr></thead><tbody>
          ${p.filas.map(m => `<tr class="${m.activo ? '' : 'is-off'}">
            <td><div class="cell-moto"><div class="thumb">${m.imagen ? `<img src="${esc(m.imagen)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
              <div><b>${esc(m.marca)} ${esc(m.modelo)}</b><small>${esc(m.tipo)} · ${m.anio}</small></div></div></td>
            <td>${m.cc} cc</td>
            <td><span class="price-main">${money(m.precio, m.moneda)}</span>${m.precio_tarjeta ? `<span class="price-sub">Tarjeta ${money(m.precio_tarjeta, m.moneda)}${m.bono ? ' · Bono ' + money(m.bono, m.moneda) : ''}</span>` : ''}</td>
            <td><span class="tag ${m.stock > 3 ? 'on' : (m.stock > 0 ? 'en_proceso' : 'off')}">${m.stock} un.</span></td>
            <td><span class="tag ${m.activo ? 'on' : 'off'}">${m.activo ? 'Visible' : 'De baja'}</span></td>
            <td><div class="row-actions">
              <a class="icon-action" href="/cliente/#ficha/${m.id}" target="_blank" rel="noopener" title="Ver en la tienda" aria-label="Ver en la tienda">${I.eye}</a>
              <button type="button" class="icon-action" data-edit="${m.id}" title="Editar" aria-label="Editar ${esc(m.modelo)}">${I.edit}</button>
              ${m.activo
                ? `<button type="button" class="icon-action danger" data-baja="${m.id}" title="Dar de baja" aria-label="Dar de baja ${esc(m.modelo)}">${I.off}</button>`
                : `<button type="button" class="icon-action ok" data-alta="${m.id}" title="Reactivar" aria-label="Reactivar ${esc(m.modelo)}">${I.on}</button>`}
            </div></td></tr>`).join('')}
          </tbody></table></div>${p.html}`;
  };

  const recargar = async () => { motos = await api('/motos?todas=true'); window.__marcas = [...new Set(motos.map(m => m.marca))].sort(); window.__tipos = [...new Set(motos.map(m => m.tipo))].sort();
    opciones($('#inv-marca'), 'Todas las marcas', window.__marcas, inv.marca); opciones($('#inv-tipo'), 'Todos los tipos', window.__tipos, inv.tipo); pintarStats(); pintar(); };

  pintarStats(); pintar();

  $('#inv-q').oninput = debounce(e => { inv.q = e.target.value; inv.pag = 1; pintar(); });
  $('#inv-marca').onchange = e => { inv.marca = e.target.value; inv.pag = 1; pintar(); };
  $('#inv-tipo').onchange = e => { inv.tipo = e.target.value; inv.pag = 1; pintar(); };
  $('#inv-estado').onchange = e => { inv.estado = e.target.value; inv.pag = 1; pintar(); };
  $('#inv-new').onclick = () => modalMoto(null, recargar);
  $('#inv-exp').onclick = () => exportarExcel(filtrar().map(m => ({
    'Marca': m.marca, 'Modelo': m.modelo, 'Año': m.anio, 'Tipo': m.tipo, 'Cilindrada (cc)': m.cc, 'Moneda': m.moneda, 'Precio lista': m.precio,
    'Bono': m.bono ?? '', 'Precio solo tarjeta': m.precio_tarjeta ?? '', 'Stock': m.stock, 'Estado': m.activo ? 'Visible' : 'De baja' })), 'Inventario_MotoAltiplano');

  $('#inv-tabla').onclick = async e => {
    const t = e.target.closest('button, a'); if (!t) return;
    if (t.dataset.ord) { inv.dir = inv.orden === t.dataset.ord ? -inv.dir : 1; inv.orden = t.dataset.ord; return pintar(); }
    if (t.dataset.pag) { inv.pag = +t.dataset.pag; return pintar(); }
    const id = +(t.dataset.edit || t.dataset.baja || t.dataset.alta); if (!id) return;
    const m = motos.find(x => x.id === id); if (!m) return;
    if (t.dataset.edit) return modalMoto(m, recargar);
    if (t.dataset.baja) {
      if (await confirmar({ titulo: 'Dar de baja esta moto', texto: `<b>${esc(m.marca)} ${esc(m.modelo)}</b> dejará de mostrarse a los clientes. Los pedidos anteriores se conservan y puedes reactivarla cuando quieras.`, ok: 'Dar de baja', peligro: true }))
        try { await api('/motos/' + id, { method: 'DELETE' }); toast('Moto dada de baja'); await recargar(); } catch (er) { toast(er.message); }
    } else {
      try { await api('/motos/' + id, { method: 'PUT', body: { ...m, activo: true } }); toast('Moto reactivada'); await recargar(); } catch (er) { toast(er.message); }
    }
  };
}

/* =========================================================
   PEDIDOS
   ========================================================= */
async function renderPedidos(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  let ps = await api('/pedidos');
  if (v._tk !== tk) return;
  v.innerHTML = `
    <div class="pg-head animate-up">
      <div><h2>Pedidos</h2><p>Revisa las solicitudes de los clientes y actualiza su estado.</p></div>
      <div class="pg-actions"><button class="btn btn-ghost" id="ped-exp" type="button">${I.dl} Exportar CSV</button></div>
    </div>
    <div class="table-card animate-up delay-1">
      <div class="toolbar">
        <div class="chips" id="ped-chips" role="group" aria-label="Filtrar por estado"></div>
        <div class="tb-search" style="margin-left:auto;max-width:320px">${I.search}<input id="ped-q" type="search" placeholder="Cliente, moto o nota" aria-label="Buscar" value="${esc(ped.q)}"></div>
      </div>
      <div id="ped-tabla"></div>
    </div>`;

  const filtrar = () => { const q = norm(ped.q);
    return ps.filter(p => (!ped.estado || p.estado === ped.estado) && (!q || norm(`${p.cliente} ${p.moto} ${p.nota || ''} ${p.id}`).includes(q))); };

  const pintar = () => {
    const cuenta = e => ps.filter(p => !e || p.estado === e).length;
    $('#ped-chips').innerHTML = [['', 'Todos'], ...Object.entries(ESTADOS)].map(([k, l]) =>
      `<button type="button" class="chip" data-est="${k}" aria-pressed="${ped.estado === k}">${l}<span>${cuenta(k)}</span></button>`).join('');
    const lista = filtrar(), p = paginar(lista, ped.pag, 12); ped.pag = p.pag;
    $('#ped-tabla').innerHTML = !lista.length
      ? '<div class="empty-state" style="border:0;border-radius:0"><p>No hay pedidos con esos filtros.</p></div>'
      : `<div class="table-responsive"><table class="data-table"><thead><tr><th>N.º</th><th>Fecha</th><th>Cliente</th><th>Moto</th><th>Nota</th><th>Estado</th></tr></thead><tbody>
        ${p.filas.map(x => `<tr>
          <td><b>#${x.id}</b></td><td>${fecha(x.creado)}</td><td><b>${esc(x.cliente)}</b></td><td>${esc(x.moto)}</td>
          <td class="nota-cell" title="${esc(x.nota || '')}">${esc(x.nota) || '<span style="opacity:.4">—</span>'}</td>
          <td><select class="select-estado ${esc(x.estado)}" data-id="${x.id}" aria-label="Estado del pedido ${x.id}">
            ${Object.entries(ESTADOS).map(([k, l]) => `<option value="${k}" ${k === x.estado ? 'selected' : ''}>${l}</option>`).join('')}</select></td></tr>`).join('')}
        </tbody></table></div>${p.html}`;
  };
  pintar();

  $('#ped-q').oninput = debounce(e => { ped.q = e.target.value; ped.pag = 1; pintar(); });
  $('#ped-chips').onclick = e => { const b = e.target.closest('[data-est]'); if (!b) return; ped.estado = b.dataset.est; ped.pag = 1; pintar(); };
  $('#ped-exp').onclick = () => exportarExcel(filtrar().map(p => ({ 'N° Pedido': p.id, 'Fecha': fecha(p.creado), 'Cliente': p.cliente, 'Moto': p.moto, 'Estado': ESTADOS[p.estado], 'Nota': p.nota || '' })), 'Pedidos_MotoAltiplano');
  $('#ped-tabla').onclick = e => { const b = e.target.closest('[data-pag]'); if (b) { ped.pag = +b.dataset.pag; pintar(); } };
  $('#ped-tabla').onchange = async e => {
    const s = e.target.closest('.select-estado'); if (!s) return;
    try { await api(`/pedidos/${s.dataset.id}/estado`, { method: 'PATCH', body: { estado: s.value } }); toast('Estado actualizado'); }
    catch (er) { toast(er.message); }
    ps = await api('/pedidos'); pintar();
  };
}

/* =========================================================
   USUARIOS
   ========================================================= */
const ROLES = { admin: 'Administrador', trabajador: 'Trabajador', cliente: 'Cliente' };
const rolTag = r => `<span class="tag ${r === 'admin' ? 'cancelado' : r === 'trabajador' ? 'en_proceso' : 'pendiente'}">${esc(ROLES[r] || r)}</span>`;

function modalUsuario(u, guardado) {
  const nuevo = !u, yo = !nuevo && u.id === miId();
  u = u || { nombre: '', email: '', rol: 'cliente', activo: true };
  const modal = abrirModal({
    titulo: nuevo ? 'Nuevo usuario' : 'Editar usuario', subtitulo: nuevo ? 'Crea una cuenta con el rol que necesite.' : u.email,
    cuerpo: `<form id="uf" novalidate><div class="am-grid">
      ${campo('nombre', 'Nombre completo', { val: u.nombre, req: true, span: 's6', attrs: 'minlength=3 autocomplete=off' })}
      ${campo('email', 'Correo electrónico', { type: 'email', val: u.email, req: true, span: 's6', attrs: 'autocomplete=off' })}
      <label class="am-f s3"><span>Rol</span><select name="rol" ${yo ? 'disabled' : ''}>${Object.entries(ROLES).map(([k, l]) => `<option value="${k}" ${k === u.rol ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${yo ? '<small>No puedes cambiar tu propio rol.</small>' : ''}</label>
      <div class="am-f s3"><span>Cuenta</span>${interruptor('activo', 'Activa', yo ? 'No puedes desactivarte a ti mismo.' : 'Si la apagas, no podrá iniciar sesión.', u.activo, yo)}</div>
      ${campo('password', nuevo ? 'Contraseña' : 'Nueva contraseña', { type: 'password', req: nuevo, span: 's6', attrs: 'minlength=8 autocomplete=new-password', hint: nuevo ? 'Mínimo 8 caracteres.' : 'Déjala vacía para conservar la actual. Mínimo 8 caracteres.' })}
    </div></form>`,
    pie: `<span class="am-error" id="uf-err" role="alert"></span>
          <button type="button" class="btn btn-ghost" data-no>Cancelar</button>
          <button type="button" class="btn btn-primary" data-ok>${nuevo ? 'Crear usuario' : 'Guardar cambios'}</button>`,
  });
  const form = modal.el.querySelector('#uf'), err = modal.el.querySelector('#uf-err'), ok = modal.el.querySelector('[data-ok]');
  modal.el.querySelector('[data-no]').onclick = () => modal.cerrar();
  const enviar = async () => {
    const f = new FormData(form);
    const d = { nombre: String(f.get('nombre')).trim(), email: String(f.get('email')).trim(), rol: yo ? u.rol : f.get('rol'), activo: yo ? true : form.elements.activo.checked };
    const pw = String(f.get('password') || '');
    if (d.nombre.length < 3) { err.textContent = 'El nombre debe tener al menos 3 letras.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.email)) { err.textContent = 'Escribe un correo válido.'; return; }
    if ((nuevo || pw) && pw.length < 8) { err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
    if (pw) d.password = pw;
    err.textContent = ''; ok.disabled = true; const txt = ok.textContent; ok.textContent = 'Guardando…';
    try {
      if (nuevo) await api('/admin/usuarios', { method: 'POST', body: d });
      else await api('/admin/usuarios/' + u.id, { method: 'PUT', body: d });
      modal.cerrar(); toast(nuevo ? 'Usuario creado' : 'Cambios guardados'); guardado();
    } catch (e) { err.textContent = e.message || 'No se pudo guardar.'; ok.disabled = false; ok.textContent = txt; }
  };
  ok.onclick = enviar;
  form.onsubmit = e => { e.preventDefault(); enviar(); };
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); enviar(); } });
}

async function renderUsuarios(v) {
  const tk = v._tk = (v._tk || 0) + 1;
  let us = await api('/admin/usuarios');
  if (v._tk !== tk) return;
  v.innerHTML = `
    <div class="pg-head animate-up">
      <div><h2>Usuarios</h2><p>Gestiona quién puede entrar al sistema y con qué permisos.</p></div>
      <div class="pg-actions">
        <button class="btn btn-ghost" id="usu-exp" type="button">${I.dl} Exportar CSV</button>
        <button class="btn btn-primary" id="usu-new" type="button">${I.plus} Nuevo usuario</button>
      </div>
    </div>
    <div class="table-card animate-up delay-1">
      <div class="toolbar">
        <div class="tb-search">${I.search}<input id="usu-q" type="search" placeholder="Buscar por nombre o correo" aria-label="Buscar" value="${esc(usu.q)}"></div>
        <select id="usu-rol" aria-label="Rol"><option value="">Todos los roles</option>${Object.entries(ROLES).map(([k, l]) => `<option value="${k}" ${usu.rol === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <span class="tb-count" id="usu-count"></span>
      </div>
      <div id="usu-tabla"></div>
    </div>`;

  const filtrar = () => { const q = norm(usu.q); return us.filter(u => (!usu.rol || u.rol === usu.rol) && (!q || norm(`${u.nombre} ${u.email}`).includes(q))); };
  const pintar = () => {
    const lista = filtrar(), p = paginar(lista, usu.pag, 12); usu.pag = p.pag;
    $('#usu-count').textContent = `${lista.length} de ${us.length} usuarios`;
    $('#usu-tabla').innerHTML = !lista.length
      ? '<div class="empty-state" style="border:0;border-radius:0"><p>Ningún usuario coincide con la búsqueda.</p></div>'
      : `<div class="table-responsive"><table class="data-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th class="row-actions-th">Acciones</th></tr></thead><tbody>
        ${p.filas.map(u => { const yo = u.id === miId(); return `<tr class="${u.activo ? '' : 'is-off'}">
          <td><div class="cell-moto" style="min-width:0"><div class="avatar-sm r-${esc(u.rol)}">${esc(iniciales(u.nombre))}</div>
            <div><b>${esc(u.nombre)}${yo ? ' <span class="tag pendiente" style="margin-left:6px">Tú</span>' : ''}</b><small>${esc(u.email)}</small></div></div></td>
          <td>${rolTag(u.rol)}</td>
          <td><span class="tag ${u.activo ? 'on' : 'off'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td><div class="row-actions">
            <button type="button" class="icon-action" data-edit="${u.id}" title="Editar" aria-label="Editar ${esc(u.nombre)}">${I.edit}</button>
            ${yo ? '' : (u.activo
              ? `<button type="button" class="icon-action danger" data-tog="${u.id}" title="Desactivar" aria-label="Desactivar ${esc(u.nombre)}">${I.off}</button>`
              : `<button type="button" class="icon-action ok" data-tog="${u.id}" title="Activar" aria-label="Activar ${esc(u.nombre)}">${I.on}</button>`)}
          </div></td></tr>`; }).join('')}
        </tbody></table></div>${p.html}`;
  };
  const recargar = async () => { us = await api('/admin/usuarios'); pintar(); };
  pintar();

  $('#usu-q').oninput = debounce(e => { usu.q = e.target.value; usu.pag = 1; pintar(); });
  $('#usu-rol').onchange = e => { usu.rol = e.target.value; usu.pag = 1; pintar(); };
  $('#usu-new').onclick = () => modalUsuario(null, recargar);
  $('#usu-exp').onclick = () => exportarExcel(filtrar().map(u => ({ 'Nombre': u.nombre, 'Correo': u.email, 'Rol': ROLES[u.rol], 'Estado': u.activo ? 'Activo' : 'Inactivo' })), 'Usuarios_MotoAltiplano');
  $('#usu-tabla').onclick = async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.pag) { usu.pag = +t.dataset.pag; return pintar(); }
    const u = us.find(x => x.id === +(t.dataset.edit || t.dataset.tog)); if (!u) return;
    if (t.dataset.edit) return modalUsuario(u, recargar);
    if (u.activo && !(await confirmar({ titulo: 'Desactivar usuario', texto: `<b>${esc(u.nombre)}</b> ya no podrá iniciar sesión. Puedes activarlo de nuevo cuando quieras.`, ok: 'Desactivar', peligro: true }))) return;
    try { await api(`/admin/usuarios/${u.id}/activo`, { method: 'PATCH' }); toast(u.activo ? 'Usuario desactivado' : 'Usuario activado'); await recargar(); } catch (er) { toast(er.message); }
  };
}

/* =========================================================
   Montaje del panel
   ========================================================= */
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
      <div class="pg-head"><div><h2>Resumen general</h2><p>Estado del catálogo, los pedidos y los usuarios de un vistazo.</p></div>
        <div class="pg-actions"><a class="btn btn-ghost btn-sm" href="#pedidos">Ver pedidos</a><a class="btn btn-primary btn-sm" href="#motos">Ir al inventario</a></div></div>
      <div class="grid-kpi">
        ${kpiCard('motos', stats.motos, 'Modelos Activos', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6h-3l-3 9h6"></path><path d="M15 6l3 4"></path></svg>', 'var(--accent-blue)', 'var(--accent-blue-glow)')}
        ${kpiCard('unidades', stats.unidades, 'Unidades en Stock', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>', 'var(--accent-green)', 'var(--accent-green-glow)')}
        ${kpiCard('pendientes', p.pendiente, 'Pedidos Pendientes', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>', 'var(--accent-orange)', 'rgba(245, 158, 11, 0.15)')}
        ${kpiCard('clientes', stats.usuarios.cliente, 'Total Clientes', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', '#8B5CF6', 'rgba(139, 92, 246, 0.15)')}
      </div>

      <div class="grid-2">
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

      <div class="grid-2">
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
      const totalPed = (p.pendiente || 0) + (p.en_proceso || 0) + (p.entregado || 0) + (p.cancelado || 0);
      if (!totalPed) {
        document.getElementById('chart-pedidos').parentElement.innerHTML = '<div class="empty-state" style="border:0;min-height:260px"><p>Aún no hay pedidos para graficar.</p></div>';
      } else chartPedidos = new Chart(ctxPedidos, {
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
  
  { id: 'motos', label: 'Inventario', render: renderInventario },
  { id: 'pedidos', label: 'Pedidos', render: renderPedidos },
  { id: 'usuarios', label: 'Usuarios', render: renderUsuarios },
] });
document.body.classList.add('admin');