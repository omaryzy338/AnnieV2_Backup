import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Badge, ListRow, ProductImage, Text } from '@/components/ui';
import { folioTxt, formatDateTimeCorto, fullName, money } from '@/lib/format';
import type { Sale } from '@/lib/types';
import { fechaVenta } from '@/lib/ventas';
import { colors } from '@/theme';

export function VentaItem({ venta }: { venta: Sale }) {
  const router = useRouter();
  const cliente = fullName(venta.client);
  const credito = venta.paymentMethod === 'credito';
  return (
    <ListRow
      onPress={() => router.push({ pathname: '/venta/[id]', params: { id: venta._id } })}
      accessibilityLabel={`Venta folio ${folioTxt(venta.folio)}, ${venta.product?.name ?? 'producto eliminado'}, ${money(venta.total)}`}
      right={
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text variant="subheading" weight="bold" color={colors.success}>
            {money(venta.total)}
          </Text>
          <Badge text={credito ? 'Crédito' : 'Efectivo'} color={credito ? colors.warning : colors.primary} />
        </View>
      }>
      <ProductImage uri={venta.product?.image} size={44} />
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {venta.product?.name ?? 'Producto eliminado'}
          <Text variant="caption"> ×{venta.quantity}</Text>
        </Text>
        <Text variant="caption" numberOfLines={1}>
          Folio {folioTxt(venta.folio)} · {formatDateTimeCorto(fechaVenta(venta))}
        </Text>
        {cliente ? (
          <Text variant="caption" numberOfLines={1} color={colors.primaryDark}>
            {cliente}
          </Text>
        ) : null}
      </View>
    </ListRow>
  );
}
