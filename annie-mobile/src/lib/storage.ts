// Almacenamiento de la sesión. En el teléfono usa SecureStore (cifrado por el
// sistema operativo); en web (solo para pruebas) usa localStorage.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const KEYS = {
  token: 'annie.token',
  user: 'annie.user',
  apiUrl: 'annie.apiUrl',
} as const;

const esWeb = Platform.OS === 'web';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (esWeb) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (esWeb) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (esWeb) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
