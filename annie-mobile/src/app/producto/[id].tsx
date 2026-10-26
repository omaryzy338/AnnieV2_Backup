import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import {
  aviso,
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  confirmar,
  Divider,
  EmptyState,
  ErrorView,
  LoadingView,
  ProductImage,
  Row,
  Screen,
  Text,
  TextField,
} from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useDesplazamientoTeclado } from '@/hooks/useDesplazamientoTeclado';
import { mensajeError } from '@/lib/api';
import { money, parseAmount } from '@/lib/format';
import {
  camposAProducto,
  productoACampos,
  productoVacio,
  validarProducto,
  type CamposProducto,
  type Errores,
} from '@/lib/formularios';
import { elegirImagen, type Origen } from '@/lib/imagenes';
import { subirImagenProducto, useEliminarProducto, useGuardarProducto, useProducts } from '@/lib/queries';
import { colorStock } from '@/lib/reportes';
import type { Product } from '@/lib/types';
import { CATEGORIAS_PRODUCTO, UNIDADES } from '@/lib/validacion';
import { colors, spacing } from '@/theme';

export default function ProductoFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { esDueno } = useAuth();
  const productos = useProducts();

  // Solo el dueño crea y edita productos; el empleado los consulta
  if (id === 'nuevo') return esDueno ? <ProductoForm id={id} existente={null} /> : <SoloDueno />;
  if (productos.isPending) return <LoadingView />;
  if (productos.isError) return <ErrorView mensaje={mensajeError(productos.error)} onRetry={() => productos.refetch()} />;
  const existente = productos.data.find((p) => p._id === id);
  if (!existente) return <ErrorView mensaje="Este producto ya no existe." />;
  if (!esDueno) return <ProductoDetalle producto={existente} />;
  return <ProductoForm key={id} id={id} existente={existente} />;
}

/** Un empleado que llega a "nuevo producto" (p. ej. desde un enlace). */
function SoloDueno() {
  const router = useRouter();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Nuevo producto' }} />
      <Card>
        <EmptyState
          icon="lock-closed-outline"
          title="Solo el dueño puede agregar productos"
          message="Pídele al dueño del negocio que lo registre en el inventario."
          action={<Button title="Volver" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/productos'))} />}
        />
      </Card>
    </Screen>
  );
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Text variant="body" color={colors.textMuted}>
        {etiqueta}
      </Text>
      <Text variant="body" weight="semibold" color={color} style={{ flexShrink: 1, textAlign: 'right' }}>
        {valor}
      </Text>
    </Row>
  );
}

/** Vista de solo lectura para el empleado: sin costo, margen ni botones para editar. */
function ProductoDetalle({ producto: p }: { producto: Product }) {
  const router = useRouter();
  const unidad = UNIDADES.find((u) => u.valor === (p.unit ?? ''))?.texto ?? p.unit;
  const descuento = p.discount ?? 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Producto' }} />
      <Card style={{ alignItems: 'center', gap: spacing.sm }}>
        <ProductImage uri={p.image} size={120} radius={18} />
        <Text variant="heading" align="center">
          {p.name}
        </Text>
        <Text variant="title" color={colors.primary}>
          {money(p.price)}
        </Text>
        {descuento > 0 ? <Badge text={`${descuento}% de descuento`} color={colors.success} style={{ alignSelf: 'center' }} /> : null}
      </Card>

      <Card style={{ gap: spacing.xs }}>
        <Dato etiqueta="Stock" valor={`${p.quantity} ${p.unit || 'uds.'}`} color={colorStock(p.quantity)} />
        <Divider />
        <Dato etiqueta="Unidad" valor={unidad || 'Sin unidad'} />
        <Divider />
        <Dato etiqueta="Categoría" valor={p.category || 'Sin categoría'} />
        <Divider />
        <Dato etiqueta="Marca" valor={p.brand || '—'} />
        {p.description ? (
          <>
            <Divider />
            <Text variant="label" style={styles.label}>
              Descripción
            </Text>
            <Text variant="body">{p.description}</Text>
          </>
        ) : null}
      </Card>

      <Button
        title="Vender este producto"
        icon="cart-outline"
        size="lg"
        disabled={p.quantity < 1}
        onPress={() => router.push({ pathname: '/venta/nueva', params: { productId: p._id } })}
      />
      {p.quantity < 1 && (
        <Text variant="caption" align="center">
          Sin existencias: avísale al dueño para que lo resurta.
        </Text>
      )}
    </Screen>
  );
}

function ProductoForm({ id, existente }: { id: string; existente: Product | null }) {
  const desplazamientoTeclado = useDesplazamientoTeclado();
  const esNuevo = !existente;
  const router = useRouter();
  const guardar = useGuardarProducto();
  const eliminar = useEliminarProducto();

  const [c, setC] = useState<CamposProducto>(() => (existente ? productoACampos(existente, CATEGORIAS_PRODUCTO) : productoVacio));
  const [errores, setErrores] = useState<Errores<keyof CamposProducto>>({});
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const set = <K extends keyof CamposProducto>(campo: K, valor: CamposProducto[K]) => {
    setC((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const subirFoto = async (origen: Origen) => {
    try {
      const archivo = await elegirImagen(origen, { limiteMB: 5 });
      if (!archivo) return;
      setSubiendo(true);
      const { url } = await subirImagenProducto(archivo);
      set('image', url);
    } catch (err) {
      aviso('No se pudo subir la imagen', mensajeError(err));
    } finally {
      setSubiendo(false);
    }
  };

  const onGuardar = async () => {
    setError(null);
    const e = validarProducto(c);
    setErrores(e);
    if (Object.keys(e).length) return setError('Revisa los campos marcados.');
    try {
      await guardar.mutateAsync({ id: esNuevo ? undefined : id, datos: camposAProducto(c) });
      router.back();
    } catch (err) {
      setError(mensajeError(err, 'Error al guardar el producto'));
    }
  };

  const onEliminar = async () => {
    const ok = await confirmar('¿Eliminar producto?', `Se eliminará "${existente?.name}". Sus ventas anteriores se conservan. Esta acción no se puede deshacer.`, {
      textoConfirmar: 'Sí, eliminar',
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync(id);
      router.back();
    } catch (err) {
      aviso('No se pudo eliminar', mensajeError(err));
    }
  };

  const precio = parseAmount(c.price);
  const costo = parseAmount(c.cost);
  const margen = precio > 0 && costo > 0 ? ((precio - costo) / precio) * 100 : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={desplazamientoTeclado}>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo producto' : 'Editar producto' }} />
      <Screen>
        {error && <Banner tono="error">{error}</Banner>}

        {/* Imagen */}
        <Card style={{ gap: spacing.md }}>
          <Row>
            <View>
              <ProductImage uri={c.image} size={84} radius={14} />
              {subiendo && (
                <View style={styles.subiendo}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </View>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Button title="Galería" icon="images-outline" variant="secondary" size="sm" onPress={() => subirFoto('galeria')} disabled={subiendo} />
              {Platform.OS !== 'web' && (
                <Button title="Tomar foto" icon="camera-outline" variant="secondary" size="sm" onPress={() => subirFoto('camara')} disabled={subiendo} />
              )}
              {c.image ? <Button title="Quitar imagen" variant="ghost" size="sm" onPress={() => set('image', '')} disabled={subiendo} /> : null}
            </View>
          </Row>
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <TextField label="Nombre" required value={c.name} onChangeText={(t) => set('name', t)} placeholder="Ej: Coca-Cola 600 ml" error={errores.name} />
          <TextField label="Marca" value={c.brand} onChangeText={(t) => set('brand', t)} placeholder="Ej: Coca-Cola, Bimbo, Nestlé..." />
          <View style={{ gap: 8 }}>
            <Text variant="label" style={styles.label}>
              Categoría
            </Text>
            <View style={styles.chips}>
              {[...CATEGORIAS_PRODUCTO, 'Otro'].map((cat) => (
                <Chip key={cat} label={cat} selected={c.categoria === cat} onPress={() => set('categoria', c.categoria === cat ? '' : cat)} />
              ))}
            </View>
            {c.categoria === 'Otro' && (
              <TextField value={c.categoriaOtra} onChangeText={(t) => set('categoriaOtra', t)} placeholder="Escribe la categoría" error={errores.categoriaOtra} accessibilityLabel="Otra categoría" />
            )}
          </View>
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <TextField label="Precio de venta" required value={c.price} onChangeText={(t) => set('price', t)} placeholder="0.00" keyboardType="decimal-pad" prefix="$" error={errores.price} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Precio de costo" value={c.cost} onChangeText={(t) => set('cost', t)} placeholder="0.00" keyboardType="decimal-pad" prefix="$" error={errores.cost} />
            </View>
          </Row>
          {margen !== null && (
            <Row gap={6}>
              <Ionicons name="trending-up" size={16} color={margen >= 0 ? colors.success : colors.danger} />
              <Text variant="caption" weight="semibold" color={margen >= 0 ? colors.success : colors.danger}>
                Margen de ganancia: {margen.toFixed(1)}%
              </Text>
            </Row>
          )}
          <TextField
            label="Stock (existencias)"
            required
            value={c.quantity}
            onChangeText={(t) => set('quantity', t.replace(/[^\d]/g, ''))}
            placeholder="0"
            keyboardType="number-pad"
            error={errores.quantity}
          />
          <View style={{ gap: 8 }}>
            <Text variant="label" style={styles.label}>
              Unidad
            </Text>
            <View style={styles.chips}>
              {UNIDADES.map((u) => (
                <Chip key={u.valor || 'ninguna'} label={u.texto} selected={c.unit === u.valor} onPress={() => set('unit', u.valor)} />
              ))}
            </View>
          </View>
          <TextField label="Descripción" value={c.description} onChangeText={(t) => set('description', t)} placeholder="Descripción opcional del producto" multiline />
        </Card>

        <Button title={esNuevo ? 'Crear producto' : 'Guardar cambios'} icon="checkmark" size="lg" onPress={onGuardar} loading={guardar.isPending} disabled={subiendo} />
        {!esNuevo && existente && (
          <>
            <Button
              title="Vender este producto"
              icon="cart-outline"
              variant="secondary"
              disabled={existente.quantity < 1}
              onPress={() => router.push({ pathname: '/venta/nueva', params: { productId: existente._id } })}
            />
            <Button title="Eliminar producto" icon="trash-outline" variant="danger" onPress={onEliminar} loading={eliminar.isPending} />
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subiendo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
