// src/components/Icons.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

export function ChevronRight({ size = 16, color = '#A3A0B4' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size, fontWeight: '700', color, transform: [{ scaleY: 1.1 }] }}>›</Text>
    </View>
  );
}

export function ChevronLeft({ size = 20, color = C.ink }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 1.1, fontWeight: '800', color, transform: [{ scaleY: 1.1 }] }}>‹</Text>
    </View>
  );
}

export function BookmarkIcon({ size = 18, color = C.purple }) {
  return (
    <View style={{ width: size * 0.85, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.9,
          backgroundColor: color,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          position: 'relative',
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            marginLeft: -size * 0.35,
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.35,
            borderRightWidth: size * 0.35,
            borderBottomWidth: 5,
            borderStyle: 'solid',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#ffffff',
          }}
        />
      </View>
    </View>
  );
}

export function HeartFilled({ size = 16, color = '#EF4444' }) {
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>❤️</Text>
  );
}

export function BellIcon({ size = 20, color = C.ink, count = 0 }) {
  return (
    <View style={{ position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size, color }}>🔔</Text>
      {count > 0 && (
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>{count}</Text>
        </View>
      )}
      {count === 'dot' && <View style={styles.bellDot} />}
    </View>
  );
}

export function EyeIcon({ size = 16, color = C.purple }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: size, color, marginRight: 3 }}>👁</Text>
    </View>
  );
}

export function UserPlusIcon({ size = 18, color = C.purple }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size, color }}>👤⁺</Text>
    </View>
  );
}

export function ThreeDotsIcon({ size = 18, color = C.muted }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size, fontWeight: '900', color, lineHeight: size }}>⋮</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
