// Gráficas sencillas hechas con View (sin dependencias nativas). Una sola
// serie por gráfica en el azul de la marca: el título de la tarjeta la nombra,
// así que no lleva leyenda. Al tocar una barra se muestra su valor.
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { money } from '@/lib/format';
import type { Punto } from '@/lib/reportes';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

type BarChartProps = {
  data: Punto[];
  height?: number;
  formato?: (n: number) => string;
  /** Resalta la barra con el valor más alto. */
  resaltarMaximo?: boolean;
};

export function BarChart({ data, height = 150, formato = money, resaltarMaximo = false }: BarChartProps) {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const max = Math.max(0, ...data.map((d) => d.valor));
  const idxMax = data.findIndex((d) => d.valor === max && max > 0);
  const elegido = data.find((d) => d.clave === seleccion);
  // Con muchas barras (15 o 30 días) solo se muestran algunas etiquetas del
  // eje, centradas bajo su barra y sin recortarse
  const cadaCuanto = data.length > 16 ? 6 : data.length > 8 ? 3 : 1;
  const etiquetas = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % cadaCuanto === 0 || i === data.length - 1)
    .filter(({ i }, k, arr) => !(k === arr.length - 2 && data.length - 1 - i < cadaCuanto / 2));

  return (
    <View>
      <View style={styles.cabecera}>
        <Text variant="caption">
          {elegido ? elegido.etiqueta : max > 0 ? 'Máximo' : 'Sin ventas en este período'}
        </Text>
        {max > 0 && (
          <Text variant="subheading" weight="bold">
            {formato(elegido ? elegido.valor : max)}
          </Text>
        )}
      </View>
      <View style={[styles.area, { height }]}>
        <View style={[styles.lineaBase]} />
        {data.map((d, i) => {
          const alto = max > 0 ? Math.max((d.valor / max) * (height - 8), d.valor > 0 ? 3 : 0) : 0;
          const activo = seleccion === d.clave;
          const destacado = activo || (resaltarMaximo && i === idxMax && !seleccion);
          return (
            <Pressable
              key={d.clave}
              onPress={() => setSeleccion(activo ? null : d.clave)}
              accessibilityRole="button"
              accessibilityLabel={`${d.etiqueta}: ${formato(d.valor)}`}
              style={styles.columna}
              hitSlop={{ top: 8, bottom: 8 }}>
              <View
                style={[
                  styles.barra,
                  {
                    height: alto,
                    backgroundColor: destacado ? colors.primaryDark : colors.primary,
                    opacity: seleccion && !activo ? 0.45 : 1,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.eje}>
        {etiquetas.map(({ d, i }) => (
          <View key={d.clave} style={[styles.etiquetaEje, { left: `${((i + 0.5) / data.length) * 100}%` }]}>
            <Text variant="caption" style={{ fontSize: 10, lineHeight: 14 }} numberOfLines={1} align="center">
              {d.etiqueta}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type FilaBarra = { clave: string; etiqueta: string; valor: number; detalle?: string };

/** Lista de barras horizontales con el valor escrito (se lee como tabla). */
export function HBarList({ data, formato = money }: { data: FilaBarra[]; formato?: (n: number) => string }) {
  const max = Math.max(0, ...data.map((d) => d.valor));
  return (
    <View style={{ gap: spacing.md }}>
      {data.map((d) => (
        <View key={d.clave} accessible accessibilityLabel={`${d.etiqueta}: ${formato(d.valor)}${d.detalle ? `, ${d.detalle}` : ''}`}>
          <View style={styles.hFila}>
            <Text variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
              {d.etiqueta}
            </Text>
            <Text variant="body" weight="semibold">
              {formato(d.valor)}
            </Text>
          </View>
          {d.detalle ? <Text variant="caption">{d.detalle}</Text> : null}
          <View style={styles.hFondo}>
            <View style={[styles.hBarra, { width: `${max > 0 ? Math.max((d.valor / max) * 100, 2) : 0}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm },
  area: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  lineaBase: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: colors.border },
  columna: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barra: { width: '78%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  eje: { height: 16, marginTop: 6 },
  etiquetaEje: { position: 'absolute', width: 40, marginLeft: -20, alignItems: 'center' },
  hFila: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginBottom: 4 },
  hFondo: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden', marginTop: 4 },
  hBarra: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
