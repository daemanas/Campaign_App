import React from 'react';
import { Text } from 'react-native';
import glyphs from '../assets/glyphmaps/MaterialCommunityIcons.json';

// The glyph map is bundled directly and the TTF lives in
// android/app/src/main/assets/fonts, so no native icon module is required.
const cache = {};
const warned = {};

function code(name) {
  if (cache[name] !== undefined) return cache[name];
  const key = name && name.includes('-') ? name : kebab(name);
  const cp = glyphs[key] != null ? glyphs[key] : glyphs[name];
  const char = cp != null ? String.fromCodePoint(cp) : null;
  cache[name] = char;
  if (!char && __DEV__ && name && !warned[name]) {
    warned[name] = true;
    console.warn('MaterialCommunityIcons has no glyph named "' + name + '"');
  }
  return char;
}

function kebab(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

export function Icon({ name, size = 20, color = '#17152D', style, ...rest }) {
  const char = code(name);
  if (!char) return null;
  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontFamily: 'MaterialCommunityIcons',
          fontSize: size,
          color,
          lineHeight: Math.round(size * 1.25),
          includeFontPadding: false,
          textAlign: 'center',
        },
        style,
      ]}
      {...rest}
    >
      {char}
    </Text>
  );
}

export function hasIcon(name) {
  return !!code(name);
}

export default Icon;
