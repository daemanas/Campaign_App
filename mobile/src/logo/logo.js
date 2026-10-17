// src/logo/logo.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

export default function Logo({ size = 'md' }) {
  const isSmall = size === 'sm';
  return (
    <View style={styles.container}>
      <View style={[styles.badge, isSmall && styles.badgeSm]}>
        {/* Crisp 4-pointed star */}
        <Text style={[styles.starText, isSmall && styles.starTextSm]}>✦</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, isSmall && styles.titleSm]}>Amplify</Text>
        <Text style={[styles.subtitle, isSmall && styles.subtitleSm]}>CAMPAIGN REACH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeSm: {
    width: 30,
    height: 30,
    borderRadius: 9,
    marginRight: 8,
  },
  starText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  starTextSm: {
    fontSize: 16,
  },
  textCol: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: C.ink,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  titleSm: {
    fontSize: 16,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8D8A9F',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  subtitleSm: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
});