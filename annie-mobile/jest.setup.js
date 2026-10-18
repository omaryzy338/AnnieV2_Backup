// Configuración global de las pruebas.

// SecureStore en memoria (en pruebas no hay almacenamiento nativo)
jest.mock('expo-secure-store', () => {
  const datos = new Map();
  return {
    getItemAsync: jest.fn(async (k) => (datos.has(k) ? datos.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => {
      datos.set(k, v);
    }),
    deleteItemAsync: jest.fn(async (k) => {
      datos.delete(k);
    }),
    __limpiar: () => datos.clear(),
  };
});

// Impresión y compartir: no hay sistema operativo en las pruebas
jest.mock('expo-print', () => ({
  printAsync: jest.fn(async () => {}),
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///ticket.pdf', numberOfPages: 1 })),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

// expo-image no encuentra los recursos empaquetados en el entorno de pruebas;
// se reemplaza por una vista simple (las imágenes no son parte de lo que se prueba)
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = ({ accessibilityLabel, style, testID }) => React.createElement(View, { accessibilityLabel, style, testID });
  return { Image };
});

// Los íconos cargan fuentes empaquetadas; en pruebas basta una vista vacía
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icono = ({ name }) => React.createElement(View, { testID: `icono-${name}` });
  Icono.glyphMap = {};
  return { __esModule: true, default: Icono };
});
