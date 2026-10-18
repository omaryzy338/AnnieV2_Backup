import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

type Icono = keyof typeof Ionicons.glyphMap;

function icono(activo: Icono, inactivo: Icono) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? activo : inactivo} size={size} color={color as string} />;
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15 },
        // Alto suficiente para la etiqueta en Poppins más el área segura inferior
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 66 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 10) },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerShown: false, tabBarIcon: icono('home', 'home-outline') }} />
      <Tabs.Screen name="ventas" options={{ title: 'Ventas', tabBarIcon: icono('cart', 'cart-outline') }} />
      <Tabs.Screen name="productos" options={{ title: 'Productos', tabBarIcon: icono('cube', 'cube-outline') }} />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes', tabBarIcon: icono('people', 'people-outline') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icono('menu', 'menu-outline') }} />
    </Tabs>
  );
}
