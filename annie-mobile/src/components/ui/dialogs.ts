// Diálogos de confirmación y aviso. En el teléfono usan Alert nativo; en web
// (pruebas) Alert de react-native-web no muestra botones, así que se usa
// window.confirm / window.alert.
import { Alert, Platform } from 'react-native';

export function confirmar(
  titulo: string,
  mensaje: string,
  { textoConfirmar = 'Aceptar', textoCancelar = 'Cancelar', destructivo = false } = {}
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${titulo}\n\n${mensaje}`) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: textoCancelar, style: 'cancel', onPress: () => resolve(false) },
        { text: textoConfirmar, style: destructivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export function aviso(titulo: string, mensaje: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
}
