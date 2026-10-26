import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Al volver a la app, React Query vuelve a pedir los datos que estén viejos
function useRefrescarAlVolver() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (estado) => focusManager.setFocused(estado === 'active'));
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const [fuentesListas, errorFuentes] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  useRefrescarAlVolver();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Navegacion listo={fuentesListas || !!errorFuentes} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function Navegacion({ listo }: { listo: boolean }) {
  const { estado, esDueno } = useAuth();
  const cargando = !listo || estado === 'cargando';

  useEffect(() => {
    if (!cargando) SplashScreen.hideAsync().catch(() => {});
  }, [cargando]);

  if (cargando) return null;
  const dentro = estado === 'dentro';

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
          headerTintColor: colors.primaryDark,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={!dentro}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        </Stack.Protected>

        <Stack.Protected guard={dentro}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="venta/nueva" options={{ title: 'Nueva venta' }} />
          <Stack.Screen name="venta/[id]" options={{ title: 'Venta' }} />
          <Stack.Screen name="producto/[id]" options={{ title: 'Producto' }} />
          <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
          <Stack.Screen name="creditos/index" options={{ title: 'Créditos' }} />
          <Stack.Screen name="creditos/[id]" options={{ title: 'Estado de cuenta' }} />

          {/* Solo el dueño: reportes, datos del negocio y cuentas de empleados */}
          <Stack.Protected guard={esDueno}>
            <Stack.Screen name="reportes" options={{ title: 'Reportes' }} />
            <Stack.Screen name="negocio" options={{ title: 'Mi negocio' }} />
            <Stack.Screen name="empleados/index" options={{ title: 'Empleados' }} />
            <Stack.Screen name="empleados/[id]" options={{ title: 'Empleado' }} />
          </Stack.Protected>
        </Stack.Protected>

        <Stack.Screen name="servidor" options={{ title: 'Servidor' }} />
      </Stack>
    </>
  );
}
