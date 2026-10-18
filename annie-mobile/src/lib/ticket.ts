// HTML del ticket de venta. Se usa para imprimir (expo-print) o para generar
// un PDF y compartirlo por WhatsApp, correo, etc.
import { folioTxt, formatDateTime, fullName, money } from './format';
import type { Business, Sale } from './types';
import { fechaVenta, metodoTxt } from './ventas';

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function ticketHTML(v: Sale, negocio?: Pick<Business, 'name' | 'rfc' | 'rfcGenerico' | 'address' | 'phone'> | null, impreso = new Date()) {
  const nombreNegocio = escapar(negocio?.name || 'Mi negocio');
  const rfc = negocio?.rfc && !negocio.rfcGenerico ? `RFC: ${escapar(negocio.rfc)}` : '';
  const cliente = escapar(fullName(v.client) || 'Cliente general');
  const producto = escapar(v.product?.name || 'Producto eliminado');
  const descuento =
    v.discount > 0 ? (v.discountType === 'fijo' ? `-${money(v.discount)}` : `-${v.discount}%`) : '—';

  const pago =
    v.paymentMethod === 'credito'
      ? `<div class="fila"><span>Cargado a crédito</span><strong>${money(v.total)}</strong></div>`
      : `<div class="fila"><span>Paga con</span><strong>${money(v.amountPaid ?? v.total)}</strong></div>
         <div class="fila grande"><span>Cambio</span><strong>${money(v.change ?? 0)}</strong></div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ticket ${folioTxt(v.folio)} - ${nombreNegocio}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1d29; margin: 0; padding: 24px; }
  .ticket { max-width: 360px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0; text-align: center; }
  .sub { color: #6b7280; font-size: 12px; text-align: center; margin: 4px 0 2px; }
  .folio { text-align: center; color: #3284f7; font-weight: 800; font-size: 18px; margin: 14px 0; letter-spacing: 1px; }
  .fila { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; gap: 12px; }
  .fila span { color: #6b7280; }
  hr { border: none; border-top: 1px dashed #d1d5db; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; color: #6b7280; padding: 4px 2px; border-bottom: 1px solid #e5e7eb; }
  td { padding: 6px 2px; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; margin-top: 8px; }
  .grande { font-size: 16px; }
  .grande strong { font-size: 18px; }
  .pie { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 20px; }
</style>
</head>
<body>
<div class="ticket">
  <h1>${nombreNegocio}</h1>
  ${rfc ? `<div class="sub">${rfc}</div>` : ''}
  ${negocio?.address ? `<div class="sub">${escapar(negocio.address)}</div>` : ''}
  ${negocio?.phone ? `<div class="sub">Tel. ${escapar(negocio.phone)}</div>` : ''}
  <div class="folio">FOLIO ${folioTxt(v.folio)}</div>
  <div class="fila"><span>Fecha</span><strong>${formatDateTime(fechaVenta(v))}</strong></div>
  <div class="fila"><span>Cliente</span><strong>${cliente}</strong></div>
  <hr>
  <table>
    <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Desc.</th></tr></thead>
    <tbody><tr><td>${producto}</td><td class="num">${v.quantity}</td><td class="num">${money(v.price)}</td><td class="num">${descuento}</td></tr></tbody>
  </table>
  <div class="total"><span>Total</span><span>${money(v.total)}</span></div>
  <hr>
  <div class="fila"><span>Método de pago</span><strong>${metodoTxt(v.paymentMethod)}</strong></div>
  ${pago}
  <hr>
  <div class="fila"><span>Impreso</span><span>${formatDateTime(impreso)}</span></div>
  <div class="pie">Gracias por su compra · Generado con Annie</div>
</div>
</body>
</html>`;
}
