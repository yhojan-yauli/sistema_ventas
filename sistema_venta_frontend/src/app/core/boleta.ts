import { ConfiguracionResponse, ItemVentaResponse, VentaResponse } from './models';
import { dateTime, money, tipoComprobanteLabel, tipoPagoLabel } from './utils';

function num(v: VentaResponse): string {
  return String(v.numero).padStart(4, '0');
}

function comprobante(v: VentaResponse): string {
  return `${v.serie}-${num(v)}`;
}

function kg(gramos: number | null | undefined): string {
  const g = gramos ?? 0;
  return (g / 1000).toFixed(3).replace(/\.?0+$/, '') || '0';
}

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function boletaHtml(v: VentaResponse, n: ConfiguracionResponse): string {
  const filas = v.items
    .map((it) => lineaHtml(it))
    .join('');

  const clienteHtml = v.clienteNombre
    ? `<div class="line"><span class="l">Cliente: ${esc(v.clienteNombre)}</span></div>
       <div class="line"><span class="l">${esc(v.clienteDocumento ?? '')}</span></div>
       <div class="hr"></div>`
    : '';

  const descuentoHtml = v.descuento > 0
    ? `<div class="line"><span class="l">DESCUENTO</span><span class="r">-${money(v.descuento)}</span></div>`
    : '';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${comprobante(v)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 4mm 0; background: #fff; }
  .ticket { width: 76mm; margin: 0 auto; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.35; color: #000; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .small { font-size: 11px; }
  .ticket .line { display: flex; justify-content: space-between; gap: 6px; }
  .ticket .line .l { white-space: nowrap; }
  .ticket .line .r { white-space: nowrap; }
  .hr { border-top: 1px dashed #000; margin: 6px 0; }
  .hrs { border-top: 1px solid #000; margin: 6px 0; }
  .item-name { font-weight: 700; }
  .detalle { display: flex; justify-content: space-between; gap: 6px; }
  .detalle .l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .detalle .r { white-space: nowrap; }
  .footer { margin-top: 8px; text-align: center; }
  @media screen {
    body { padding: 12px; }
    .ticket { border: 1px dashed #999; padding: 8px; }
  }
</style>
</head>
<body>
<div class="ticket">
  <div class="c b" style="font-size: 15px;">${esc(n.razonSocial)}</div>
  ${n.ruc ? `<div class="c">RUC: ${esc(n.ruc)}</div>` : ''}
  ${n.direccion ? `<div class="c">${esc(n.direccion)}</div>` : ''}
  ${n.telefono ? `<div class="c">Tel: ${esc(n.telefono)}</div>` : ''}
  <div class="hr"></div>
  <div class="c b" style="font-size: 13px;">${esc(tipoComprobanteLabel(v.tipoComprobante))}</div>
  <div class="c b" style="font-size: 16px;">${comprobante(v)}</div>
  <div class="c small">${esc(dateTime(v.fecha))}</div>
  <div class="hr"></div>
  ${clienteHtml}
  <div class="detalle b"><span class="l">Producto</span><span class="r">Importe</span></div>
  ${filas}
  <div class="hr"></div>
  <div class="line"><span class="l">SUBTOTAL</span><span class="r">${money(v.subtotal)}</span></div>
  ${descuentoHtml}
  <div class="line"><span class="l">IGV (${v.igvPorcentaje}%)</span><span class="r">${money(v.igv)}</span></div>
  <div class="hrs"></div>
  <div class="line b"><span class="l" style="font-size: 14px;">TOTAL</span><span class="r" style="font-size: 14px;">${money(v.total)}</span></div>
  <div class="line"><span class="l">PAGO</span><span class="r">${esc(tipoPagoLabel(v.tipoPago))}</span></div>
  <div class="hr"></div>
  <div class="footer b">¡GRACIAS POR SU COMPRA!</div>
  <div class="footer small">Atendió: ${esc(v.vendedorNombre)} · ${esc(v.cajaNombre)}</div>
</div>
</body>
</html>`;
}

function lineaHtml(it: ItemVentaResponse): string {
  const detalle = it.pesoGramos
    ? `<div class="detalle"><span class="l">${kg(it.pesoGramos)} kg</span><span class="r">${money(it.subtotal)}</span></div>`
    : `<div class="detalle"><span class="l">${it.cantidad} x ${money(it.precioVenta)}</span><span class="r">${money(it.subtotal)}</span></div>`;
  return `<div class="item-name">${esc(it.productoNombre)}</div>${detalle}`;
}

export function boletaTexto(v: VentaResponse, n: ConfiguracionResponse): string {
  const lineas: string[] = [];
  const sep = '━━━━━━━━━━━━━━━━━━━━━━━━';
  if (n.razonSocial) lineas.push(n.razonSocial.toUpperCase());
  if (n.ruc) lineas.push(`RUC: ${n.ruc}`);
  if (n.direccion) lineas.push(n.direccion);
  if (n.telefono) lineas.push(`Tel: ${n.telefono}`);
  lineas.push(sep);
  lineas.push(tipoComprobanteLabel(v.tipoComprobante).toUpperCase());
  lineas.push(`${comprobante(v)}`);
  lineas.push(dateTime(v.fecha));
  lineas.push(sep);
  if (v.clienteNombre) {
    lineas.push(`Cliente: ${v.clienteNombre}`);
    if (v.clienteDocumento) lineas.push(v.clienteDocumento);
    lineas.push(sep);
  }
  for (const it of v.items) {
    lineas.push(it.productoNombre.toUpperCase());
    if (it.pesoGramos) {
      lineas.push(`${kg(it.pesoGramos)} kg  ${money(it.subtotal)}`);
    } else {
      lineas.push(`${it.cantidad} x ${money(it.precioVenta)}  ${money(it.subtotal)}`);
    }
  }
  lineas.push(sep);
  lineas.push(`SUBTOTAL: ${money(v.subtotal)}`);
  if (v.descuento > 0) lineas.push(`DESCUENTO: -${money(v.descuento)}`);
  lineas.push(`IGV (${v.igvPorcentaje}%): ${money(v.igv)}`);
  lineas.push(`TOTAL: ${money(v.total)}`);
  lineas.push(`PAGO: ${tipoPagoLabel(v.tipoPago).toUpperCase()}`);
  lineas.push(sep);
  lineas.push('¡GRACIAS POR SU COMPRA!');
  return lineas.join('\n');
}

export function printBoleta(v: VentaResponse, n: ConfiguracionResponse): void {
  const w = window.open('', '_blank', 'width=380,height=620');
  if (!w) {
    alert('Permite las ventanas emergentes para imprimir la boleta.');
    return;
  }
  w.document.open();
  w.document.write(boletaHtml(v, n));
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 250);
}

export function waLink(telefono: string | null | undefined, texto: string): string {
  let t = (telefono ?? '').replace(/\D/g, '');
  if (!t) return '';
  if (t.length === 9 && t.startsWith('9')) t = '51' + t;
  else if (t.startsWith('0')) t = '51' + t.slice(1);
  return `https://wa.me/${t}?text=${encodeURIComponent(texto)}`;
}

export function mailLink(email: string | null | undefined, asunto: string, cuerpo: string): string {
  if (!email) return '';
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
