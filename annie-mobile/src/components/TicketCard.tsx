// Resumen de una venta con el formato del ticket: folio, fecha, producto,
// método de pago, total, con cuánto pagó y el cambio.
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Divider, ProductImage, Text } from '@/components/ui';
import { folioTxt, formatDateTime, fullName, money } from '@/lib/format';
import type { Sale } from '@/lib/types';
import { fechaVenta, metodoTxt } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

function Fila({ etiqueta, valor, fuerte, color }: { etiqueta: string; valor: string; fuerte?: boolean; color?: string }) {
  return (
    <View style={styles.fila}>
      <Text variant={fuerte ? 'subheading' : 'body'} color={colors.textMuted} weight={fuerte ? 'semibold' : 'regular'}>
        {etiqueta}
      </Text>
      <Text variant={fuerte ? 'heading' : 'body'} weight={fuerte ? 'bold' : 'semibold'} color={color} style={{ flexShrink: 1, textAlign: 'right' }}>
        {valor}
      </Text>
    </View>
  );
}

export function TicketCard({ venta }: { venta: Sale }) {
  const credito = venta.paymentMethod === 'credito';
  const descuento =
    venta.discount > 0 ? (venta.discountType === 'fijo' ? `-${money(venta.discount)}` : `-${venta.discount}%`) : null;

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.folio}>
        <Text variant="caption">FOLIO</Text>
        <Text variant="title" color={colors.primary} style={{ letterSpacing: 1 }} testID="ticket-folio">
          {folioTxt(venta.folio)}
        </Text>
        <Badge text={metodoTxt(venta.paymentMethod)} color={credito ? colors.warning : colors.primary} style={{ alignSelf: 'center' }} />
      </View>
      <Divider />
      <View style={styles.producto}>
        <ProductImage uri={venta.product?.image} size={48} />
        <View style={{ flex: 1 }}>
          <Text variant="body" weight="semibold">
            {venta.product?.name ?? 'Producto eliminado'}
          </Text>
          <Text variant="caption">
            {venta.quantity} × {money(venta.price)}
            {descuento ? `  ·  Descuento ${descuento}` : ''}
          </Text>
        </View>
      </View>
      <Divider />
      <Fila etiqueta="Fecha" valor={formatDateTime(fechaVenta(venta))} />
      <Fila etiqueta="Cliente" valor={fullName(venta.client) || 'Cliente general'} />
      <Divider />
      <Fila etiqueta="Total" valor={money(venta.total)} fuerte color={colors.success} />
      {credito ? (
        <Fila etiqueta="Cargado a crédito" valor={money(venta.total)} />
      ) : (
        <>
          <Fila etiqueta="Paga con" valor={money(venta.amountPaid ?? venta.total)} />
          <Fila etiqueta="Cambio" valor={money(venta.change ?? 0)} fuerte />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  folio: { alignItems: 'center', gap: 2 },
  producto: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
});
