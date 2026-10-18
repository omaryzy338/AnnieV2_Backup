import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { TicketCard } from '@/components/TicketCard';
import { aviso, Banner, Button, confirmar, EmptyState, ErrorView, LoadingView, Row, Screen } from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { folioTxt } from '@/lib/format';
import { useCancelarVenta, useProfile, useSales } from '@/lib/queries';
import { compartirTicket, imprimirTicket } from '@/lib/ticketAcciones';

export default function VentaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ventas = useSales();
  const perfil = useProfile();
  const cancelar = useCancelarVenta();

  if (ventas.isPending) return <LoadingView />;
  if (ventas.isError) return <ErrorView mensaje={mensajeError(ventas.error)} onRetry={() => ventas.refetch()} />;

  const venta = ventas.data.find((v) => v._id === id);
  if (!venta) {
    return (
      <Screen>
        <EmptyState icon="receipt-outline" title="Venta no encontrada" message="Puede que se haya cancelado." action={<Button title="Volver" variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }

  const ticket = async (accion: 'imprimir' | 'compartir') => {
    try {
      if (accion === 'imprimir') await imprimirTicket(venta, perfil.data?.business);
      else await compartirTicket(venta, perfil.data?.business);
    } catch (err) {
      aviso('No se pudo generar el ticket', mensajeError(err));
    }
  };

  const cancelarVenta = async () => {
    const ok = await confirmar(
      '¿Cancelar venta?',
      `Se eliminará la venta folio ${folioTxt(venta.folio)}, el producto regresará al inventario${
        venta.paymentMethod === 'credito' ? ' y se descontará del saldo del cliente' : ''
      }. Esta acción no se puede deshacer.`,
      { textoConfirmar: 'Sí, cancelar venta', textoCancelar: 'No', destructivo: true }
    );
    if (!ok) return;
    try {
      await cancelar.mutateAsync(venta._id);
      router.back();
    } catch (err) {
      aviso('No se pudo cancelar la venta', mensajeError(err));
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `Venta ${folioTxt(venta.folio)}` }} />
      <TicketCard venta={venta} />
      <Row>
        <Button title="Imprimir" icon="print-outline" variant="secondary" onPress={() => ticket('imprimir')} style={{ flex: 1 }} />
        <Button title="Compartir" icon="share-outline" variant="secondary" onPress={() => ticket('compartir')} style={{ flex: 1 }} />
      </Row>
      {!venta.product && <Banner tono="aviso">El producto de esta venta ya fue eliminado del inventario.</Banner>}
      <Button title="Cancelar venta" icon="trash-outline" variant="danger" onPress={cancelarVenta} loading={cancelar.isPending} />
    </Screen>
  );
}
