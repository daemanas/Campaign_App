import React, { useEffect, useState } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { CategoryArt, Images, isArtRef, assetSource } from '../assets/images';
import { resolveImage, isImgRef } from '../store/persistence';

function normalise(source) {
  if (!source) return null;
  if (typeof source === 'number') return source;
  if (isArtRef(source)) return assetSource(source);
  if (typeof source === 'object' && (source.uri || source.test)) return source;
  if (typeof source === 'string' && /^(https?:|file:|content:|data:|res:)/.test(source)) return { uri: source };
  return null;
}

// Accepts a bundled asset (or `asset://<name>` ref), a remote/file URI, or an
// `img://` reference to a photo the user picked, read back from AsyncStorage.
export function SmartImage({ source, fallbackSource, category, style, contentFit, ...rest }) {
  const [resolved, setResolved] = useState(() => (isImgRef(source) ? null : normalise(source)));

  useEffect(() => {
    let alive = true;
    if (isImgRef(source)) {
      resolveImage(source).then((uri) => {
        if (alive) setResolved(uri ? { uri } : null);
      });
    } else {
      setResolved(normalise(source));
    }
    return () => {
      alive = false;
    };
  }, [source]);

  const fallback = fallbackSource || (category && CategoryArt[category]) || Images.cleanRivers;

  return <Image source={resolved || fallback} style={style} resizeMode={contentFit || 'cover'} {...rest} />;
}

export function Avatar({ source, name, size = 40, background = '#EDE8FF', color = '#5A3EF0', style, ring }) {
  const initials = String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const box = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: background,
    borderWidth: ring ? 2 : 0,
    borderColor: '#fff',
  };

  if (source) {
    return (
      <View style={[box, styles.clip, style]}>
        <SmartImage source={source} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  return (
    <View style={[box, styles.clip, styles.center, style]}>
      <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: Math.max(10, Math.round(size * 0.36)), color }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
