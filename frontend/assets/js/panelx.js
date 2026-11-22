const estadoTag = e => `<span class="tag ${esc(e)}">${ESTADOS[e] || esc(e)}</span>`;


function exportarExcel(datos, nombreArchivo) {
    if (!datos || datos.length === 0) {
        toast('No hay datos para exportar');
        return;
    }
    // Punto y coma: Excel en español (Perú) lo separa en columnas sin asistente.
    const SEP = ';';
    const cabeceras = [];
    datos.forEach(o => Object.keys(o).forEach(k => { if (!cabeceras.includes(k)) cabeceras.push(k); }));
    const celda = v => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'boolean') return v ? 'Sí' : 'No';
        if (typeof v === 'number') return Number.isFinite(v) ? String(v).replace('.', ',') : '';
        let t = String(v).replace(/\r?\n/g, ' ').trim();
        // Evita que Excel interprete texto como fórmula (=, +, -, @)
        if (/^[=+\-@]/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t)) t = "'" + t;
        return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const filas = datos.map(o => cabeceras.map(c => celda(o[c])).join(SEP));
    const csv = ['sep=' + SEP, cabeceras.map(celda).join(SEP), ...filas].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const sello = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}_${sello}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`${datos.length} ${datos.length === 1 ? 'registro exportado' : 'registros exportados'}`);
}

const _cargarScript = src => new Promise((ok, mal) => {
    if (document.querySelector(`script[data-lib="${src}"]`)) return ok();
    const el = document.createElement('script');
    el.src = src; el.dataset.lib = src; el.onload = ok; el.onerror = () => mal(new Error('No se pudo cargar ' + src));
    document.head.appendChild(el);
});
async function _libsPDF() {
    if (!(window.jspdf && window.jspdf.jsPDF)) await _cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    if (!(window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable)) await _cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
}
const _txt = v => v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v);
function _imprimirTabla(cab, filas, titulo, sello, quien) {
    const e = t => _txt(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const w = window.open('', '_blank');
    if (!w) { toast('Permite las ventanas emergentes para exportar'); return; }
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${e(titulo)}</title><style>
      body{font:12px Arial,sans-serif;color:#111;margin:24px}h1{font-size:20px;margin:0}p{color:#555;margin:2px 0 14px}
      table{border-collapse:collapse;width:100%}th{background:#1f4fb0;color:#fff;text-align:left}th,td{padding:6px 8px;border:1px solid #ccd}
      tr:nth-child(even) td{background:#f3f6fc}@page{size:landscape;margin:12mm}</style>
      <h1>Henvi del Sur · ${e(titulo)}</h1><p>${e(sello)}${quien ? ' · ' + e(quien) : ''} · ${filas.length} registros</p>
      <table><thead><tr>${cab.map(c => `<th>${e(c)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(f => `<tr>${f.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>onload=()=>setTimeout(()=>print(),300)<\/script>`);
    w.document.close();
}
async function exportarPDF(datos, nombreArchivo, titulo) {
    if (!datos || datos.length === 0) { toast('No hay datos para exportar'); return; }
    const cab = [];
    datos.forEach(o => Object.keys(o).forEach(k => { if (!cab.includes(k)) cab.push(k); }));
    const filas = datos.map(o => cab.map(c => _txt(o[c])));
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const fechaTxt = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
    const sello = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
    const u = session.user, quien = u ? `${u.nombre || u.email}` : '';
    toast('Generando PDF…');
    try {
        await _libsPDF();
        const doc = new window.jspdf.jsPDF({ orientation: cab.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
        const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
        doc.setFillColor(31, 79, 176); doc.rect(0, 0, W, 64, 'F');
        doc.setFillColor(255, 210, 31); doc.rect(0, 64, W, 4, 'F');
        doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Henvi del Sur', 40, 30);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(titulo || nombreArchivo, 40, 48);
        doc.setFontSize(9); doc.text(`Generado: ${fechaTxt}`, W - 40, 30, { align: 'right' });
        if (quien) doc.text(`Por: ${quien}`, W - 40, 46, { align: 'right' });
        doc.setTextColor(90); doc.setFontSize(9); doc.text(`${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}`, 40, 90);
        const num = cab.map((c, i) => filas.every(f => f[i] === '' || /^-?[\d.,]+$/.test(f[i])));
        doc.autoTable({
            head: [cab], body: filas, startY: 98, margin: { left: 40, right: 40, bottom: 44 },
            styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, overflow: 'linebreak', lineColor: [220, 226, 238], lineWidth: .4 },
            headStyles: { fillColor: [31, 79, 176], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [243, 246, 252] },
            columnStyles: Object.fromEntries(num.map((n, i) => [i, { halign: n ? 'right' : 'left' }]).filter(x => x[1].halign === 'right')),
            didDrawPage: () => {
                const n = doc.internal.getNumberOfPages();
                doc.setFontSize(8); doc.setTextColor(120);
                doc.text('Henvi del Sur · Moto Altiplano', 40, H - 22);
                doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber}`, W - 40, H - 22, { align: 'right' });
            }
        });
        doc.save(`${nombreArchivo}_${sello}.pdf`);
        toast(`PDF generado · ${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}`);
    } catch (err) {
        // Sin conexión a la librería: abre una vista imprimible (Guardar como PDF)
        _imprimirTabla(cab, filas, titulo || nombreArchivo, fechaTxt, quien);
    }
}
// Enlaza el botón CSV existente y agrega junto a él un botón PDF.
function enlazarExport(idBoton, obtenerDatos, nombre, titulo) {
    const csv = document.getElementById(idBoton); if (!csv) return;
    csv.onclick = () => exportarExcel(obtenerDatos(), nombre);
    if (!csv.dataset.pdf) {
        csv.dataset.pdf = '1';
        const b = document.createElement('button');
        b.type = 'button'; b.className = csv.className; b.id = idBoton + '-pdf';
        b.innerHTML = csv.innerHTML.replace(/Exportar CSV|CSV/, 'PDF').replace(/(>|^)\s*(Pedidos|Inventario)\s*$/, '$1$2 PDF');
        if (!/PDF/.test(b.textContent)) b.insertAdjacentText('beforeend', ' PDF');
        csv.insertAdjacentElement('afterend', b);
    }
    document.getElementById(idBoton + '-pdf').onclick = () => exportarPDF(obtenerDatos(), nombre, titulo);
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

/* =========================================================
   COMPARTIDO ENTRE PANELES (admin y trabajador)
   Detalle de pedido, ficha rápida, cotización, notificaciones
   y buscador global (Ctrl + K)
   ========================================================= */
Object.assign(I, {
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  wa: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 3.2 16.8L2 22l5.3-1.4A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3a9 9 0 1 1 7.4 4zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.5-.1-.7.1-.8.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5a.6.6 0 0 0 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.7 14.7 0 0 0 5.6 4.9c2 .8 2.7.9 3.7.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3z"/></svg>',
  cmd: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
});
const WA_NEGOCIO = '51922681908';
const SEGURO = true;

const tiempoRel = iso => {
  const t = new Date(iso).getTime(); if (!t) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
  return fecha(iso);
};

/** Cuota referencial: inicial %, n meses, TEA 15 % (mismos supuestos que la tienda). */
function cuotaRef(m, pct = 0.2, n = 36, tea = 0.15) {
  const financiar = enSoles(m) * (1 - pct), r = Math.pow(1 + tea, 1 / 12) - 1;
  return n ? financiar * r / (1 - Math.pow(1 + r, -n)) : 0;
}
const solesTxt = v => 'S/ ' + Math.round(Number(v) || 0).toLocaleString('es-PE');

function textoCotizacion(m, pct = 0.2, n = 36) {
  const l = [`*Cotización Henvi del Sur*`, `${m.marca} ${m.modelo} ${m.anio} · ${m.cc} cc`, `Precio lista: ${money(m.precio, m.moneda)}`];
  if (m.precio_tarjeta) l.push(`Precio solo con tarjeta: ${money(m.precio_tarjeta, m.moneda)}`);
  if (m.precio_nota) l.push(`Nota: ${m.precio_nota}`);
  if (n) l.push(`Financiamiento referencial: inicial ${Math.round(pct * 100)} % (${solesTxt(enSoles(m) * pct)}) y ${n} cuotas de ${solesTxt(cuotaRef(m, pct, n))} (TEA 15 %).`);
  l.push('Precios y cuota sujetos a confirmación del asesor.');
  return l.join('\n');
}

async function copiarTexto(txt, ok = 'Copiado al portapapeles') {
  try { await navigator.clipboard.writeText(txt); toast(ok); }
  catch { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast(ok); } catch { toast('No se pudo copiar'); } t.remove(); }
}

const stockTag = n => `<span class="tag ${n > 3 ? 'on' : n > 0 ? 'en_proceso' : 'off'}">${n} un.</span>`;

/** Línea de tiempo del pedido + acciones de estado. */
function detallePedido(p, { motos = [], alCambiar } = {}) {
  const m = motos.find(x => x.id === p.moto_id);
  const pasos = [['pendiente', 'Solicitud recibida'], ['en_proceso', 'En atención'], ['entregado', 'Entregada']];
  const idx = pasos.findIndex(x => x[0] === p.estado);
  const cancel = p.estado === 'cancelado';
  const linea = pasos.map(([k, l], i) => {
    const cls = cancel ? (i === 0 ? 'done' : '') : i < idx ? 'done' : i === idx ? 'now' : '';
    return `<li class="${cls}"><i></i><b>${l}</b>${i === 0 ? `<small>${fecha(p.creado)}</small>` : ''}</li>`;
  }).join('') + (cancel ? '<li class="bad"><i></i><b>Cancelada</b></li>' : '');
  const sig = { pendiente: ['en_proceso', 'Atender pedido'], en_proceso: ['entregado', 'Marcar entregado'] }[p.estado];
  const fila = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
  const cuerpo = `
    <div class="nx-ped-top">
      ${m && m.imagen ? `<img src="${esc(m.imagen)}" alt="" onerror="this.style.display='none'">` : ''}
      <div><h4>${esc(p.moto)}</h4><p>Pedido #${p.id} · ${estadoTag(p.estado)}</p></div>
    </div>
    <div class="nx-datos">
      ${fila('Cliente', esc(p.cliente))}
      ${fila('Recibido', `${fecha(p.creado)} · ${tiempoRel(p.creado)}`)}
      ${m ? fila('Precio lista', money(m.precio, m.moneda)) : ''}
      ${m ? fila('Stock actual', stockTag(m.stock)) : ''}
    </div>
    ${p.nota ? `<div class="nx-nota"><span>Nota del cliente</span>“${esc(p.nota)}”</div>` : ''}
    <ol class="nx-linea">${linea}</ol>
    ${m && m.stock < 1 && p.estado === 'en_proceso' ? '<p class="am-error" style="margin:12px 0 0">Esta moto no tiene stock: repón unidades antes de marcarla como entregada.</p>' : ''}`;
  const pie = `
    <button type="button" class="btn btn-ghost" data-copiar>${I.copy} Copiar resumen</button>
    ${!cancel && p.estado !== 'entregado' ? '<button type="button" class="btn btn-ghost nx-danger" data-est="cancelado">Cancelar pedido</button>' : ''}
    ${cancel ? '<button type="button" class="btn btn-ghost" data-est="pendiente">Reabrir pedido</button>' : ''}
    ${sig ? `<button type="button" class="btn btn-primary" data-est="${sig[0]}">${sig[1]}</button>` : ''}`;
  const md = abrirModal({ titulo: `Pedido #${p.id}`, subtitulo: `Solicitado ${tiempoRel(p.creado)}`, cuerpo, pie, chico: true });
  md.el.querySelector('[data-copiar]').onclick = () => copiarTexto(`Pedido #${p.id}\nCliente: ${p.cliente}\nMoto: ${p.moto}\nEstado: ${ESTADOS[p.estado]}\nFecha: ${fecha(p.creado)}${p.nota ? `\nNota: ${p.nota}` : ''}`);
  md.el.querySelectorAll('[data-est]').forEach(b => b.onclick = async () => {
    if (b.dataset.est === 'cancelado' && !(await confirmar({ titulo: 'Cancelar pedido', texto: `¿Cancelar el pedido <b>#${p.id}</b> de <b>${esc(p.cliente)}</b>?`, ok: 'Cancelar pedido', peligro: true }))) return;
    b.disabled = true;
    try { await api(`/pedidos/${p.id}/estado`, { method: 'PATCH', body: { estado: b.dataset.est } }); toast('Pedido actualizado'); md.cerrar(); if (alCambiar) alCambiar(); }
    catch (e) { toast(e.message); b.disabled = false; }
  });
  return md;
}

/** Ficha rápida de una moto (consulta). */
function fichaRapida(m) {
  const fila = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
  const cuerpo = `
    <div class="nx-ped-top">
      ${m.imagen ? `<img src="${esc(m.imagen)}" alt="" onerror="this.style.display='none'">` : ''}
      <div><h4>${esc(m.marca)} ${esc(m.modelo)}</h4><p>${esc(m.tipo)} · ${m.cc} cc · ${m.anio}</p></div>
    </div>
    <div class="nx-datos">
      ${fila('Precio lista', money(m.precio, m.moneda))}
      ${fila('Solo con tarjeta', m.precio_tarjeta ? money(m.precio_tarjeta, m.moneda) : '—')}
      ${fila('Bono de la marca', m.bono ? money(m.bono, m.moneda) : '—')}
      ${fila('Stock', stockTag(m.stock))}
      ${fila('En la tienda', m.activo ? '<span class="tag on">Visible</span>' : '<span class="tag off">Oculta</span>')}
    </div>
    ${m.precio_nota ? `<div class="nx-nota"><span>Nota de precio</span>${esc(m.precio_nota)}</div>` : ''}`;
  const pie = `<button type="button" class="btn btn-ghost" data-cot>${I.copy} Copiar cotización</button>
    <a class="btn btn-primary" href="/cliente/#ficha/${m.id}" target="_blank" rel="noopener">Ver en la tienda</a>`;
  const md = abrirModal({ titulo: 'Ficha rápida', cuerpo, pie, chico: true });
  md.el.querySelector('[data-cot]').onclick = () => copiarTexto(textoCotizacion(m), 'Cotización copiada');
  return md;
}

/* ---------- Notificaciones y buscador global ---------- */
const PX = { cache: null, t: 0 };
async function pxDatos(forzar = false, admin = false) {
  if (!forzar && PX.cache && Date.now() - PX.t < 20000) return PX.cache;
  const [pedidos, motos, usuarios] = await Promise.all([
    api('/pedidos').catch(() => []), api('/motos?todas=true').catch(() => []),
    admin ? api('/admin/usuarios').catch(() => []) : Promise.resolve([]),
  ]);
  PX.cache = { pedidos, motos, usuarios }; PX.t = Date.now(); return PX.cache;
}

function panelX({ admin = false, inventario = 'inventario', alCambiar } = {}) {
  const top = document.querySelector('.topbar-right'); if (!top) return;
  const refrescar = () => { PX.cache = null; if (alCambiar) alCambiar(); campana(); };

  /* Botón de búsqueda */
  const bs = document.createElement('button');
  bs.type = 'button'; bs.className = 'nx-buscar-btn'; bs.setAttribute('aria-label', 'Buscar en el panel');
  bs.innerHTML = `${I.cmd}<span>Buscar…</span><kbd>Ctrl K</kbd>`;
  top.prepend(bs);

  /* Campana */
  const bell = top.querySelector('.icon-btn');
  let pop = null;
  async function campana() {
    if (!bell) return;
    const { pedidos, motos } = await pxDatos(true, admin).catch(() => ({ pedidos: [], motos: [] }));
    const pend = pedidos.filter(p => p.estado === 'pendiente'), bajo = motos.filter(m => m.activo && m.stock <= 3);
    const dot = bell.querySelector('.notification-dot'); if (dot) dot.style.display = (pend.length + bajo.length) ? '' : 'none';
    bell._n = { pend, bajo, motos, pedidos };
  }
  if (bell) {
    bell.parentElement.style.position = 'relative';
    bell.onclick = async e => {
      e.stopPropagation();
      if (pop) { pop.remove(); pop = null; return; }
      await campana();
      const { pend, bajo, motos } = bell._n;
      pop = document.createElement('div'); pop.className = 'nx-pop'; pop.setAttribute('role', 'dialog');
      pop.innerHTML = `<h4>Notificaciones</h4>
        <section><h5>Pedidos por atender <em>${pend.length}</em></h5>${pend.length ? pend.slice(0, 5).map(p => `<button type="button" data-ped="${p.id}"><b>${esc(p.cliente)}</b><span>${esc(p.moto)} · ${tiempoRel(p.creado)}</span></button>`).join('') : '<p>Sin pedidos pendientes.</p>'}</section>
        <section><h5>Stock bajo <em>${bajo.length}</em></h5>${bajo.length ? bajo.slice(0, 5).map(m => `<button type="button" data-inv="${m.id}"><b>${esc(m.marca)} ${esc(m.modelo)}</b><span>${m.stock === 0 ? 'Sin stock' : m.stock + ' unidad' + (m.stock === 1 ? '' : 'es')}</span></button>`).join('') : '<p>Todo el inventario está en niveles óptimos.</p>'}</section>`;
      bell.parentElement.appendChild(pop);
      pop.onclick = ev => {
        const a = ev.target.closest('[data-ped]'), b = ev.target.closest('[data-inv]');
        if (a) { const p = pend.find(x => x.id === +a.dataset.ped); pop.remove(); pop = null; detallePedido(p, { motos, alCambiar: refrescar }); }
        if (b) { pop.remove(); pop = null; location.hash = '#' + inventario; }
      };
    };
    document.addEventListener('click', e => { if (pop && !pop.contains(e.target)) { pop.remove(); pop = null; } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop) { pop.remove(); pop = null; } });
    campana(); setInterval(campana, 60000);
  }

  /* Buscador global */
  async function paleta() {
    if (document.querySelector('.nx-pal')) return;
    const el = document.createElement('div'); el.className = 'am-backdrop nx-pal';
    el.innerHTML = `<div class="nx-pal-box" role="dialog" aria-modal="true" aria-label="Buscar en el panel">
      <div class="nx-pal-in">${I.cmd}<input type="text" placeholder="Busca una moto, un pedido, una sección…" aria-label="Buscar" autocomplete="off"><kbd>Esc</kbd></div>
      <div class="nx-pal-res" role="listbox"></div></div>`;
    document.body.appendChild(el); document.body.style.overflow = 'hidden';
    const inp = el.querySelector('input'), res = el.querySelector('.nx-pal-res'); inp.focus();
    const datos = await pxDatos(false, admin);
    const secciones = [...document.querySelectorAll('.sidebar-nav a')].map(a => ({ t: 's', txt: a.textContent.trim(), id: a.dataset.id }));
    let items = [], sel = 0;
    const cerrar = () => { el.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', tecla); };
    const ejecutar = it => {
      cerrar();
      if (it.t === 's') location.hash = '#' + it.id;
      else if (it.t === 'm') fichaRapida(it.d);
      else if (it.t === 'p') detallePedido(it.d, { motos: datos.motos, alCambiar: refrescar });
      else if (it.t === 'u') location.hash = '#usuarios';
    };
    const pintar = () => {
      const q = norm(inp.value.trim());
      const hit = (s) => !q || norm(s).includes(q);
      items = [
        ...secciones.filter(s => hit(s.txt)).slice(0, 5).map(s => ({ t: 's', txt: s.txt, id: s.id, sub: 'Ir a la sección' })),
        ...datos.motos.filter(m => q && hit(`${m.marca} ${m.modelo} ${m.tipo} ${m.cc}`)).slice(0, 6).map(m => ({ t: 'm', txt: `${m.marca} ${m.modelo}`, sub: `${m.tipo} · ${money(m.precio, m.moneda)} · ${m.stock} un.`, d: m })),
        ...datos.pedidos.filter(p => q && hit(`${p.cliente} ${p.moto} ${p.id} ${p.nota || ''}`)).slice(0, 5).map(p => ({ t: 'p', txt: `Pedido #${p.id} · ${p.cliente}`, sub: `${p.moto} · ${ESTADOS[p.estado]}`, d: p })),
        ...(admin ? datos.usuarios.filter(u => q && hit(`${u.nombre} ${u.email}`)).slice(0, 4).map(u => ({ t: 'u', txt: u.nombre, sub: `${u.email} · ${u.rol}`, d: u })) : []),
      ];
      sel = Math.min(sel, Math.max(0, items.length - 1));
      const etq = { s: 'Secciones', m: 'Motos', p: 'Pedidos', u: 'Usuarios' };
      let ult = '';
      res.innerHTML = items.length ? items.map((it, i) => {
        const cab = it.t !== ult ? `<h6>${etq[it.t]}</h6>` : ''; ult = it.t;
        return `${cab}<button type="button" role="option" class="${i === sel ? 'on' : ''}" data-i="${i}"><b>${esc(it.txt)}</b><span>${esc(it.sub)}</span></button>`;
      }).join('') : '<p>Sin resultados.</p>';
      const on = res.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    const tecla = e => {
      if (e.key === 'Escape') cerrar();
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); pintar(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); pintar(); }
      else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); ejecutar(items[sel]); }
    };
    document.addEventListener('keydown', tecla);
    inp.oninput = () => { sel = 0; pintar(); };
    res.onclick = e => { const b = e.target.closest('[data-i]'); if (b) ejecutar(items[+b.dataset.i]); };
    el.addEventListener('mousedown', e => { if (e.target === el) cerrar(); });
    pintar();
  }
  bs.onclick = paleta;
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); paleta(); } });
}