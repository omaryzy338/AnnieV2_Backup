import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { Avatar, Badge, Card, confirmar, Divider, ListRow, Row, Screen, Text } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { getApiBaseUrl, resolveMediaUrl } from '@/lib/api';
import { fullName, money } from '@/lib/format';
import { useCreditSummary, useProfile } from '@/lib/queries';
import { colors, spacing } from '@/theme';

type Opcion = { icono: keyof typeof Ionicons.glyphMap; titulo: string; detalle?: string; ruta: Href; color?: string };

function Icono({ nombre, color = colors.primary }: { nombre: keyof typeof Ionicons.glyphMap; color?: string }) {
  return (
    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${color}1A`, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={nombre} size={20} color={color} />
    </View>
  );
}

export default function MasScreen() {
  const router = useRouter();
  const { user, esDueno, cerrarSesion } = useAuth();
  const perfil = useProfile();
  const credito = useCreditSummary();
  const negocio = perfil.data?.business;

  // Reportes, Mi negocio y Empleados son solo del dueño
  const soloDueno: Opcion[] = [
    { icono: 'bar-chart', titulo: 'Reportes', detalle: 'Ventas, productos, clientes y exportar', ruta: '/reportes', color: colors.success },
    { icono: 'briefcase', titulo: 'Mi negocio', detalle: 'Datos del negocio, RFC, logo y propietario', ruta: '/negocio' },
    { icono: 'people-circle-outline', titulo: 'Empleados', detalle: 'Cuentas para tu personal', ruta: '/empleados', color: colors.primaryDark },
  ];
  const opciones: Opcion[] = [
    {
      icono: 'card',
      titulo: 'Créditos (mayoreo)',
      detalle: credito.data ? `Por cobrar: ${money(credito.data.totalPorCobrar)}` : 'Clientes con línea de crédito',
      ruta: '/creditos',
      color: colors.warning,
    },
    ...(esDueno ? soloDueno : []),
    { icono: 'server', titulo: 'Servidor', detalle: getApiBaseUrl().replace(/^https?:\/\//, ''), ruta: '/servidor', color: colors.textMuted },
  ];

  const salir = async () => {
    const ok = await confirmar('Cerrar sesión', '¿Quieres cerrar tu sesión en este teléfono?', { textoConfirmar: 'Cerrar sesión', destructivo: true });
    if (ok) await cerrarSesion();
  };

  return (
    <Screen>
      <Card>
        <Row>
          <Avatar text={(negocio?.name ?? user?.businessName ?? 'A').charAt(0).toUpperCase()} uri={resolveMediaUrl(negocio?.logo)} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="heading" numberOfLines={1}>
              {negocio?.name ?? user?.businessName ?? 'Mi negocio'}
            </Text>
            <Text variant="caption" numberOfLines={1}>
              {fullName(user)}
            </Text>
            <Text variant="caption" numberOfLines={1}>
              {user?.email}
            </Text>
            {user ? (
              <Badge text={esDueno ? 'Dueño' : 'Empleado'} color={esDueno ? colors.primary : colors.success} style={{ marginTop: spacing.xs }} />
            ) : null}
          </View>
        </Row>
      </Card>

      <Card padded={false}>
        {opciones.map((o, i) => (
          <View key={o.titulo}>
            {i > 0 && <Divider />}
            <ListRow onPress={() => router.push(o.ruta)} accessibilityLabel={o.titulo}>
              <Icono nombre={o.icono} color={o.color} />
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold">
                  {o.titulo}
                </Text>
                {o.detalle ? (
                  <Text variant="caption" numberOfLines={1}>
                    {o.detalle}
                  </Text>
                ) : null}
              </View>
            </ListRow>
          </View>
        ))}
      </Card>

      <Card padded={false}>
        <ListRow onPress={salir} showChevron={false} accessibilityLabel="Cerrar sesión">
          <Icono nombre="log-out-outline" color={colors.danger} />
          <Text variant="body" weight="semibold" color={colors.danger}>
            Cerrar sesión
          </Text>
        </ListRow>
      </Card>

      <Text variant="caption" align="center" style={{ marginTop: spacing.sm }}>
        Annie {Constants.expoConfig?.version ?? ''} · Hecho para pequeños negocios
      </Text>
    </Screen>
  );
}
