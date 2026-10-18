// Exporta las ventas a un archivo CSV (se abre en Excel o Google Sheets) y
// abre el menú de compartir del teléfono.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { isoLocalDate } from './format';
import { ventasCSV } from './reportes';
import type { Sale } from './types';

export async function exportarVentasCSV(ventas: Sale[]) {
  const contenido = ventasCSV(ventas);
  const nombre = `ventas-annie-${isoLocalDate()}.csv`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.create();
  await archivo.write(contenido);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');
  await Sharing.shareAsync(archivo.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'Exportar ventas' });
}
