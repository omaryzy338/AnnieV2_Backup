// Imprimir el ticket (diálogo del sistema: impresora o "Guardar como PDF") o
// compartirlo como PDF por WhatsApp, correo, etc.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { folioTxt } from './format';
import { ticketHTML } from './ticket';
import type { Business, Sale } from './types';

// Ancho de ticket (80 mm ≈ 302 pt); el alto se ajusta al contenido en el PDF
const ANCHO = 320;

function abrirEnWeb(html: string) {
  const ventana = globalThis.open?.('', '_blank', 'width=420,height=720');
  if (!ventana) throw new Error('Habilita las ventanas emergentes para ver el ticket.');
  ventana.opener = null;
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 300);
}

export async function imprimirTicket(venta: Sale, negocio?: Business | null) {
  const html = ticketHTML(venta, negocio);
  if (Platform.OS === 'web') return abrirEnWeb(html);
  await Print.printAsync({ html });
}

export async function compartirTicket(venta: Sale, negocio?: Business | null) {
  const html = ticketHTML(venta, negocio);
  if (Platform.OS === 'web') return abrirEnWeb(html);
  const { uri } = await Print.printToFileAsync({ html, width: ANCHO, height: 620 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Ticket ${folioTxt(venta.folio)}`,
  });
}
