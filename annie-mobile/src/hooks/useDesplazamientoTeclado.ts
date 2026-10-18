import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Alto estándar de la barra de navegación en iOS
const ALTO_ENCABEZADO_IOS = 44;

/**
 * Desplazamiento para KeyboardAvoidingView en pantallas con encabezado: en
 * iOS es el área segura superior (notch / Dynamic Island) más el encabezado.
 * En Android no hace falta porque la ventana se redimensiona sola
 * (softwareKeyboardLayoutMode: "resize" en app.json).
 */
export function useDesplazamientoTeclado() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? insets.top + ALTO_ENCABEZADO_IOS : 0;
}
