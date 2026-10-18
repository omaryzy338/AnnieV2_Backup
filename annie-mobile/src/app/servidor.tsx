// Dirección del backend. Por defecto se usa EXPO_PUBLIC_API_URL (o, en
// desarrollo, la computadora que corre Expo); aquí se puede cambiar.
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Banner, Button, Card, Screen, Text, TextField } from '@/components/ui';
import { getApiBaseUrl, normalizarUrl, probarServidor, setApiBaseUrl, urlPorDefecto } from '@/lib/api';
import { KEYS, storage } from '@/lib/storage';
import { spacing } from '@/theme';

export default function ServidorScreen() {
  const router = useRouter();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [estado, setEstado] = useState<{ ok: boolean; mensaje: string } | null>(null);
  const [probando, setProbando] = useState(false);
  const porDefecto = urlPorDefecto();

  const probar = async () => {
    setProbando(true);
    setEstado(null);
    setEstado(await probarServidor(url));
    setProbando(false);
  };

  const guardar = async () => {
    const limpia = normalizarUrl(url);
    setProbando(true);
    const res = await probarServidor(limpia);
    setProbando(false);
    setEstado(res);
    if (!res.ok) return;
    setApiBaseUrl(limpia);
    if (limpia === porDefecto) await storage.remove(KEYS.apiUrl);
    else await storage.set(KEYS.apiUrl, limpia);
    if (router.canGoBack()) router.back();
  };

  return (
    <Screen>
      <Card style={{ gap: spacing.lg }}>
        <Text variant="body" color="#4B5563">
          Es la dirección del servidor (backend) de Annie: el mismo que usa la página web. Tus ventas, productos y clientes se guardan ahí.
        </Text>
        <TextField
          label="Dirección del servidor"
          value={url}
          onChangeText={(t) => {
            setUrl(t);
            setEstado(null);
          }}
          placeholder="https://annie-backend.onrender.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          hint={porDefecto ? `Por defecto: ${porDefecto}` : undefined}
        />
        {estado && <Banner tono={estado.ok ? 'exito' : 'error'}>{estado.mensaje}</Banner>}
        <Button title="Probar conexión" variant="secondary" icon="pulse" onPress={probar} loading={probando} />
        <Button title="Guardar" icon="checkmark" onPress={guardar} disabled={probando} />
        {porDefecto && normalizarUrl(url) !== porDefecto ? (
          <Button
            title="Usar la dirección por defecto"
            variant="ghost"
            onPress={() => {
              setUrl(porDefecto);
              setEstado(null);
            }}
          />
        ) : null}
      </Card>
      <Banner tono="info">
        Para probar con el backend en tu computadora: corre el backend (puerto 5000) y conecta el celular a la misma red Wi-Fi. La dirección es http://IP-de-tu-computadora:5000.
      </Banner>
    </Screen>
  );
}
