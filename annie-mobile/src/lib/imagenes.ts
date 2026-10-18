// Elegir una foto de la galería o tomarla con la cámara, lista para subirse
// al backend (que acepta jpg, png o webp según la extensión del nombre).
import * as ImagePicker from 'expo-image-picker';

import type { ArchivoLocal } from './api';

export type Origen = 'galeria' | 'camara';

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class ImagenError extends Error {}

/** Regresa null si el usuario canceló. */
export async function elegirImagen(origen: Origen, { limiteMB = 5, cuadrada = true } = {}): Promise<ArchivoLocal | null> {
  const permiso =
    origen === 'camara'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    throw new ImagenError(
      origen === 'camara'
        ? 'Annie necesita permiso para usar la cámara. Actívalo en los ajustes del teléfono.'
        : 'Annie necesita permiso para ver tus fotos. Actívalo en los ajustes del teléfono.'
    );
  }

  const opciones: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: cuadrada ? [1, 1] : undefined,
    // Con calidad < 1 el sistema entrega JPEG comprimido (también en iPhone,
    // que de otro modo podría entregar HEIC, que el backend no acepta)
    quality: 0.7,
  };
  const res =
    origen === 'camara' ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  if (res.canceled || !res.assets?.length) return null;

  const a = res.assets[0];
  if (a.fileSize && a.fileSize > limiteMB * 1024 * 1024) {
    throw new ImagenError(`La imagen pesa más de ${limiteMB} MB. Elige otra o recórtala.`);
  }
  const tipo = a.mimeType && EXTENSIONES[a.mimeType] ? a.mimeType : 'image/jpeg';
  return { uri: a.uri, name: `foto-${Date.now()}.${EXTENSIONES[tipo]}`, type: tipo };
}
