import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { resolveMediaUrl } from '@/lib/api';
import { colors } from '@/theme';

/** Foto del producto, o un ícono si no tiene (o si la imagen falla). */
export function ProductImage({ uri, size = 48, radius = 10 }: { uri?: string | null; size?: number; radius?: number }) {
  const [fallo, setFallo] = useState(false);
  const url = resolveMediaUrl(uri);
  if (!url || fallo) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="cube-outline" size={size * 0.45} color={colors.primary} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.primarySoft }}
      contentFit="cover"
      transition={150}
      onError={() => setFallo(true)}
      accessibilityIgnoresInvertColors
    />
  );
}
