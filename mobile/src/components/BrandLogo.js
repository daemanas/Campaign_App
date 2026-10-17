import React from 'react';
import { View, StyleSheet } from 'react-native';
import { C } from '../theme/theme';
import { Icon } from './Icon';
import { T } from './ui';

const shadowish = {
  shadowColor: '#6B4EFF',
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export function LogoMark({ size = 46, radius = 15 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: C.purple,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadowish,
      }}
    >
      {/* Two vertical bands read as a soft top-to-bottom gradient. */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: '#7C5CFF' }} />
        <View style={{ flex: 1, backgroundColor: '#5A3EF0' }} />
      </View>
      <Icon name="star-four-points" size={size * 0.52} color="#fff" />
    </View>
  );
}

export function Logo({ size = 44, showText = true, light = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <LogoMark size={size} radius={size * 0.33} />
      {showText ? (
        <View style={{ marginLeft: 10 }}>
          <T w={800} s={size * 0.42} color={light ? '#fff' : C.ink} style={{ letterSpacing: -0.3 }}>
            Amplify
          </T>
          <T
            w={600}
            s={size * 0.19}
            color={light ? 'rgba(255,255,255,0.75)' : C.muted}
            style={{ letterSpacing: 1.6, marginTop: 1 }}
          >
            CAMPAIGN REACH
          </T>
        </View>
      ) : null}
    </View>
  );
}

export default Logo;
