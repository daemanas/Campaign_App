// src/screens/SavedCampaignsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/api';
import { C } from '../constants/colors';
import { Images } from '../assets/images';
import Logo from '../logo/logo';
import { BellIcon, BookmarkIcon } from '../components/Icons';

const DEFAULT_SAVED_CAMPAIGNS = [
  {
    id: 's-1',
    title: 'Clean Rivers, Brighter Tomorrow',
    category: 'Environment',
    categoryIcon: '🍃',
    categoryBg: '#E8F5E9',
    categoryColor: '#2E7D32',
    summary:
      'A community-driven campaign to clean local rivers and promote sustainable water management.',
    raised: 48500,
    goal: 100000,
    percent: 48,
    supporters: '342',
    daysLeft: 12,
    image: Images.cleanRivers,
  },
  {
    id: 's-2',
    title: 'Digital Classrooms for Rural Schools',
    category: 'Education',
    categoryIcon: '🎓',
    categoryBg: '#F3E8FF',
    categoryColor: '#7E22CE',
    summary:
      'Provide digital learning resources to underprivileged children.',
    raised: 72300,
    goal: 150000,
    percent: 48,
    supporters: '1.2K',
    daysLeft: 8,
    image: Images.ruralClassroom,
  },
  {
    id: 's-3',
    title: 'Help Stray Animals',
    category: 'Animals',
    categoryIcon: '❤️',
    categoryBg: '#FFE4E6',
    categoryColor: '#E11D48',
    summary:
      'Support food, shelter and medical care for stray animals in your city.',
    raised: 15400,
    goal: 50000,
    percent: 30,
    supporters: '502',
    daysLeft: 18,
    image: Images.strayDog,
  },
  {
    id: 's-4',
    title: 'Mobile Health Camps',
    category: 'Health',
    categoryIcon: '❤️',
    categoryBg: '#FFE4E6',
    categoryColor: '#E11D48',
    summary:
      'Bring essential healthcare services to underserved communities.',
    raised: 28700,
    goal: 75000,
    percent: 38,
    supporters: '892',
    daysLeft: 10,
    image: Images.healthCamp,
  },
];

export function SavedCampaignsScreen({ navigation, user }) {
  const [activeSegment, setActiveSegment] = useState('Campaigns');
  const [savedItems, setSavedItems] = useState(DEFAULT_SAVED_CAMPAIGNS);
  const [busy, setBusy] = useState(false);

  const loadSaved = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.saved();
      if (res.campaigns && res.campaigns.length > 0) {
        const mapped = res.campaigns.map((c, i) => ({
          id: c._id,
          title: c.title,
          category: c.category || 'Environment',
          categoryIcon:
            c.category === 'Education'
              ? '🎓'
              : c.category === 'Animals' || c.category === 'Health'
              ? '❤️'
              : '🍃',
          categoryBg:
            c.category === 'Education'
              ? '#F3E8FF'
              : c.category === 'Animals' || c.category === 'Health'
              ? '#FFE4E6'
              : '#E8F5E9',
          categoryColor:
            c.category === 'Education'
              ? '#7E22CE'
              : c.category === 'Animals' || c.category === 'Health'
              ? '#E11D48'
              : '#2E7D32',
          summary: c.summary || '',
          raised: c.raisedAmount || 0,
          goal: c.goalAmount || 100000,
          percent: Math.min(
            100,
            Math.round(
              (100 * (c.raisedAmount || 0)) / Math.max(1, c.goalAmount || 1)
            )
          ),
          supporters: `${c.contributionCount || 342}`,
          daysLeft: Math.max(1, 20 - (i * 3)),
          image: [
            Images.cleanRivers,
            Images.ruralClassroom,
            Images.strayDog,
            Images.healthCamp,
          ][i % 4],
        }));
        setSavedItems(mapped);
      }
    } catch (e) {
      // Keep reference items
    } finally {
      setBusy(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved])
  );

  async function handleToggleSave(item) {
    try {
      await api.save(item.id);
      setSavedItems(prev => prev.filter(x => x.id !== item.id));
      Alert.alert('Bookmark Removed', `${item.title} removed from saved.`);
    } catch (e) {
      // If mock or offline
      setSavedItems(prev => prev.filter(x => x.id !== item.id));
      Alert.alert('Bookmark Removed', `${item.title} removed from saved.`);
    }
  }

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FE" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={loadSaved} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Logo />
          <View style={styles.topRightWrap}>
            <TouchableOpacity
              style={styles.bellBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Activity')}
            >
              <BellIcon size={20} color={C.ink} count="dot" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarBtn}
            >
              <Image source={Images.daemAvatar} style={styles.avatarImg} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen Title & Subtitle */}
        <View style={styles.titleWrap}>
          <Text style={styles.screenTitle}>Saved Campaigns</Text>
          <Text style={styles.screenSubtitle}>
            Campaigns you've bookmarked to support later.
          </Text>
        </View>

        {/* Segment Switcher: Campaigns | Posts */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Campaigns' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Campaigns')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Campaigns' && styles.segmentTextActive,
              ]}
            >
              Campaigns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Posts' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Posts')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Posts' && styles.segmentTextActive,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saved Campaigns List */}
        {activeSegment === 'Campaigns' ? (
          <View style={styles.cardsList}>
            {savedItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('Detail', { id: item.id })}
              >
                {/* Left Thumbnail */}
                <Image source={item.image} style={styles.cardImage} />

                {/* Right Content */}
                <View style={styles.cardContent}>
                  {/* Category Pill & Bookmark Icon */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.catBadge,
                        { backgroundColor: item.categoryBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          { color: item.categoryColor },
                        ]}
                      >
                        {item.categoryIcon} {item.category}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleSave(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <BookmarkIcon size={20} color={C.purple} />
                    </TouchableOpacity>
                  </View>

                  {/* Title */}
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  {/* Description */}
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.summary}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${item.percent}%` }]}
                    />
                  </View>

                  {/* Footer Stats: Raised, Supporters, Days Left */}
                  <View style={styles.footerRow}>
                    <Text style={styles.raisedText}>
                      ₹ {item.raised.toLocaleString('en-IN')}{' '}
                      <Text style={styles.raisedSub}>raised</Text>
                    </Text>

                    <View style={styles.footerStat}>
                      <Text style={styles.footerIcon}>👤</Text>
                      <Text style={styles.footerText}>
                        {item.supporters} supporters
                      </Text>
                    </View>

                    <View style={styles.footerStat}>
                      <Text style={styles.footerIcon}>🕒</Text>
                      <Text style={styles.footerText}>
                        {item.daysLeft} days left
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 36, color: C.purple, marginBottom: 8 }}>
              🔖
            </Text>
            <Text style={styles.emptyTitle}>No saved posts</Text>
            <Text style={styles.emptyDesc}>
              Campaign updates and stories you bookmark will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  topRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAF4',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDE9FE',
  },
  titleWrap: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.ink,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#73718A',
    marginTop: 3,
  },

  /* Segment Switcher */
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F8',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: C.purple,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#73718A',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  /* Cards List */
  cardsList: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEAF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardImage: {
    width: 96,
    height: 104,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: C.ink,
    marginTop: 3,
  },
  cardDesc: {
    fontSize: 11.5,
    color: '#73718A',
    lineHeight: 16,
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#ECEAF4',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 7,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.purple,
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  raisedText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: C.ink,
  },
  raisedSub: {
    fontWeight: 'normal',
    color: '#8D8A9F',
    fontSize: 10,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerIcon: {
    fontSize: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#8D8A9F',
    fontWeight: '600',
  },

  /* Empty state */
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.ink,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#73718A',
    textAlign: 'center',
    marginTop: 6,
  },
});
