// src/components/CardCampaign.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { P } from './ui';
import { C } from '../constants/colors';
import { Images } from '../assets/images';

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const pct = c => Math.min(100, Math.round(100 * Number(c.raisedAmount || 0) / Math.max(1, Number(c.goalAmount || 1))));

function getCampaignImage(c) {
  if (c.imageUrl) return { uri: c.imageUrl };
  if (c.title?.includes('River') || c.category === 'Environment') return Images.cleanRivers;
  if (c.title?.includes('Classroom') || c.title?.includes('Book') || c.category === 'Education') return Images.ruralClassroom;
  if (c.title?.includes('Animal') || c.title?.includes('Stray') || c.category === 'Animals') return Images.strayDog;
  if (c.title?.includes('Health') || c.category === 'Health') return Images.healthCamp;
  return Images.cleanRivers;
}

export function CardCampaign({ c, onPress, onSave }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.cardContainer}>
      <View style={styles.cardImagePlaceholder}>
        <Image source={getCampaignImage(c)} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardCategoryBadge}>{c.category || 'Community'}</Text>
          <Text onPress={onSave} style={styles.cardSaveButton}>♡</Text>
        </View>
        <Text style={styles.cardTitle}>{c.title}</Text>
        <P style={{ marginTop: 5 }} numberOfLines={2}>{c.summary}</P>
        <View style={styles.cardProgressBarTrack}>
          <View style={[styles.cardProgressBarFill, { width: pct(c) + '%' }]} />
        </View>
        <View style={styles.cardStatsRow}>
          <Text style={styles.cardRaisedText}>{money(c.raisedAmount)} raised</Text>
          <Text style={styles.cardPercentageText}>{pct(c)}% of {money(c.goalAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 21,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EFEDF5',
  },
  cardImagePlaceholder: {
    height: 160,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 15,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategoryBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: C.purple,
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardSaveButton: {
    fontSize: 20,
    color: C.purple,
    paddingHorizontal: 5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: C.ink,
    marginTop: 8,
  },
  cardProgressBarTrack: {
    height: 6,
    backgroundColor: '#EEEAF8',
    borderRadius: 9,
    overflow: 'hidden',
    marginTop: 12,
  },
  cardProgressBarFill: {
    height: 6,
    backgroundColor: C.purple,
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardRaisedText: {
    fontWeight: '900',
    color: C.ink,
  },
  cardPercentageText: {
    fontSize: 12,
    color: C.muted,
  },
});