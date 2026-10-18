import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  aviso,
  BarChart,
  Button,
  Card,
  ErrorView,
  HBarList,
  Kpi,
  KpiGrid,
  LoadingView,
  Screen,
  SectionTitle,
  Segmented,
  Text,
} from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { money, monthName, plural } from '@/lib/format';
import { exportarVentasCSV } from '@/lib/exportar';
import { useClients, useProducts, useSales } from '@/lib/queries';
import {
  gananciaNeta,
  productosStockBajo,
  resumenMes,
  topClientes,
  topProductos,
  valorInventario,
  ventasPorCategoria,
  ventasPorDia,
  ventasPorDiaSemana,
} from '@/lib/reportes';
import { colors, spacing } from '@/theme';

type Dias = '7' | '15' | '30';

export default function ReportesScreen() {
  const ventas = useSales();
  const productos = useProducts();
  const clientes = useClients();
  const [dias, setDias] = useState<Dias>('30');
  const [exportando, setExportando] = useState(false);

  const r = useMemo(() => {
    const v = ventas.data ?? [];
    const p = productos.data ?? [];
    const mes = resumenMes(v);
    return {
      mes,
      porDia: ventasPorDia(v, Number(dias)),
      porSemana: ventasPorDiaSemana(v),
      top: topProductos(v, 6),
      categorias: ventasPorCategoria(v),
      clientesTop: topClientes(v, 5),
      ganancia: gananciaNeta(mes.ventasMes, p),
      inventario: valorInventario(p),
      stockBajo: productosStockBajo(p).length,
    };
  }, [ventas.data, productos.data, dias]);

  if (ventas.isPending || productos.isPending) return <LoadingView texto="Cargando reportes..." />;
  if (ventas.isError || productos.isError) {
    return (
      <ErrorView
        mensaje={mensajeError(ventas.error ?? productos.error)}
        onRetry={() => {
          ventas.refetch();
          productos.refetch();
        }}
      />
    );
  }

  const exportar = async () => {
    if (!ventas.data.length) return aviso('Sin ventas', 'Todavía no hay ventas para exportar.');
    setExportando(true);
    try {
      await exportarVentasCSV(ventas.data);
    } catch (err) {
      aviso('No se pudo exportar', mensajeError(err));
    } finally {
      setExportando(false);
    }
  };

  const ahora = new Date();
  const { mes } = r;

  return (
    <Screen
      refreshing={ventas.isRefetching || productos.isRefetching}
      onRefresh={() => {
        ventas.refetch();
        productos.refetch();
        clientes.refetch();
      }}>
      <Text variant="caption">Mes actual: {monthName(ahora.getMonth())} de {ahora.getFullYear()}</Text>
      <KpiGrid>
        <Kpi
          icon="calendar"
          label="Ventas del mes"
          value={money(mes.totalMes)}
          hint={mes.cambioPct !== null ? `${mes.cambioPct >= 0 ? '▲' : '▼'} ${Math.abs(mes.cambioPct).toFixed(1)}% vs ${monthName(ahora.getMonth() - 1)}` : undefined}
          hintColor={mes.cambioPct !== null && mes.cambioPct < 0 ? colors.danger : colors.success}
        />
        <Kpi icon="swap-horizontal" label="Transacciones del mes" value={String(mes.transacciones)} />
        <Kpi icon="receipt" label="Ticket promedio" value={money(mes.ticketPromedio)} color={colors.warning} />
        {r.ganancia !== null ? (
          <Kpi
            icon="trending-up"
            label="Ganancia neta del mes (productos con costo)"
            value={money(r.ganancia)}
            color={r.ganancia >= 0 ? colors.success : colors.danger}
          />
        ) : (
          <Kpi icon="pricetags" label="Valor del inventario" value={money(r.inventario)} color={colors.success} />
        )}
      </KpiGrid>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle>Ventas por día</SectionTitle>
        <Segmented
          options={[
            { value: '7', label: '7 días' },
            { value: '15', label: '15 días' },
            { value: '30', label: '30 días' },
          ]}
          value={dias}
          onChange={setDias}
        />
        <BarChart data={r.porDia} />
      </Card>

      <Card>
        <SectionTitle>Productos más vendidos</SectionTitle>
        {r.top.length ? (
          <HBarList
            data={r.top.map((t) => ({ clave: t.id, etiqueta: t.nombre, valor: t.unidades, detalle: `Ingresos ${money(t.total)}` }))}
            formato={(n) => `${n} ${n === 1 ? 'vendido' : 'vendidos'}`}
          />
        ) : (
          <Text variant="caption">Sin datos todavía.</Text>
        )}
      </Card>

      <Card>
        <SectionTitle>Ventas por categoría</SectionTitle>
        {r.categorias.length ? (
          <HBarList data={r.categorias.map((c) => ({ clave: c.nombre, etiqueta: c.nombre, valor: c.valor, detalle: `${c.pct.toFixed(1)}% del total` }))} />
        ) : (
          <Text variant="caption">Sin datos todavía.</Text>
        )}
      </Card>

      <Card>
        <SectionTitle>Ventas por día de la semana</SectionTitle>
        <Text variant="caption" style={{ marginTop: -4, marginBottom: spacing.sm }}>
          Todo el historial · se resalta el mejor día
        </Text>
        <BarChart data={r.porSemana} resaltarMaximo height={120} />
      </Card>

      <Card>
        <SectionTitle>Mejores clientes</SectionTitle>
        {r.clientesTop.length ? (
          <HBarList data={r.clientesTop.map((c) => ({ clave: c.id, etiqueta: c.nombre, valor: c.total, detalle: plural(c.compras, 'compra') }))} />
        ) : (
          <Text variant="caption">Sin ventas con cliente asignado.</Text>
        )}
      </Card>

      <KpiGrid>
        <Kpi icon="cube" label="Productos registrados" value={String(productos.data.length)} />
        <Kpi icon="people" label="Clientes registrados" value={String(clientes.data?.length ?? 0)} />
        <Kpi icon="cart" label="Ventas totales" value={String(ventas.data.length)} color={colors.success} />
        <Kpi icon="warning" label="Productos con stock bajo" value={String(r.stockBajo)} color={r.stockBajo ? colors.danger : colors.success} />
      </KpiGrid>

      <View style={{ gap: spacing.sm }}>
        <Button title="Exportar ventas (CSV / Excel)" icon="download-outline" variant="secondary" onPress={exportar} loading={exportando} />
        <Text variant="caption" align="center">
          Genera un archivo con todas tus ventas para abrirlo en Excel o Google Sheets.
        </Text>
      </View>
    </Screen>
  );
}
