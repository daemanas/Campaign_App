// Campaign detail. The hero, organizer, progress and tabs all read the derived
// campaign view, so a contribution or save recorded anywhere updates this page.
import React, { useCallback, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Share, StatusBar, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp, logic } from '../store/AppStore';
import { C, CATEGORY_COLORS, compact, money, timeAgo } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Avatar, SmartImage } from '../components/SmartImage';
import {
  Card,
  Empty,
  GradButton,
  IconButton,
  Pill,
  Progress,
  Screen,
  SoftButton,
  T,
} from '../components/ui';

const W = Dimensions.get('window').width;

const TABS = ['About', 'Updates', 'Supporters'];

export default function DetailScreen({ navigation, route }) {
  const app = useApp();
  const id = route.params?.id;
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState('About');
  const [page, setPage] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      StatusBar.setBarStyle('light-content', true);
      return () => StatusBar.setBarStyle('dark-content', true);
    }, [])
  );

  const c = app.selectors.campaignView(id, now);

  if (!c) {
    return (
      <Screen bg={C.bg}>
        <Empty
          icon="file-remove-outline"
          title="This campaign is gone"
          body="It may have been deleted from this device."
          action="Back to Explore"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const cat = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Community;
  const slides = c.gallery && c.gallery.length ? c.gallery : [c.cover].filter(Boolean);
  const mine = c.ownerId && c.ownerId === app.actor;
  const saved = app.selectors.isSaved(c.id);
  const following = app.selectors.isFollowing(c.organizer.id);
  const liked = app.selectors.isLiked(c.id);
  const records = logic
    .contributionsForCampaign(app.state, c.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const share = async () => {
    try {
      await Share.share({
        message: c.title + ' — ' + c.summary + '\n' + money(c.raisedAmount) + ' raised of ' + money(c.goalAmount),
        title: c.title,
      });
    } catch (e) {
      // The user dismissed the share sheet.
    }
  };

  return (
    <Screen bg={C.bg} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ------------------------------------------------------------- hero */}
        <View style={styles.hero}>
          {slides.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              key={c.id}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
            >
              {slides.map((src, i) => (
                <SmartImage
                  key={i}
                  source={src}
                  category={c.category}
                  style={{ width: W, height: 300 }}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ width: W, height: 300, backgroundColor: '#E9E5F7' }} />
          )}
          <View style={styles.heroTop}>
            <IconButton icon="arrow-left" bg="rgba(20,18,40,0.42)" color="#fff" onPress={() => navigation.goBack()} />
            <View style={{ flex: 1 }} />
            <IconButton
              icon={liked ? 'heart' : 'heart-outline'}
              bg="rgba(20,18,40,0.42)"
              color="#fff"
              onPress={() => app.toggleLike(c.id)}
            />
            <IconButton
              icon={saved ? 'bookmark-check' : 'bookmark-outline'}
              bg="rgba(20,18,40,0.42)"
              color="#fff"
              style={{ marginLeft: 8 }}
              onPress={() => app.toggleSave(c.id)}
            />
            <IconButton icon="share-variant" bg="rgba(20,18,40,0.42)" color="#fff" style={{ marginLeft: 8 }} onPress={share} />
          </View>

          <View style={styles.heroBottom}>
            <Pill label={c.category} icon={cat.icon} fg="#fff" bg={hexToTranslucent(cat.fg)} size={11.5} />
            <View style={styles.statusRow}>
              {c.status === 'completed' ? (
                <Pill label="Campaign closed" icon="check-decagram" fg={C.green} bg="#DCF5E7" style={{ marginLeft: 8 }} />
              ) : (
                <Pill label={c.daysLeft + ' days left'} icon="clock-outline" fg="#fff" bg="rgba(20,18,40,0.45)" style={{ marginLeft: 8 }} />
              )}
            </View>
          </View>

          {slides.length > 1 ? (
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View key={i} style={[styles.dot, i === Math.min(page, slides.length - 1) && styles.dotOn]} />
              ))}
            </View>
          ) : null}
        </View>

        {/* ------------------------------------------------------------- body */}
        <View style={styles.body}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <T w={800} s={24} color={C.ink} style={[styles.title, { flex: 1 }]}>
              {c.title}
            </T>
          </View>
          <T w={400} s={14} color={C.muted} style={{ marginTop: 7, lineHeight: 21 }}>
            {c.summary}
          </T>

          {c.tags && c.tags.length ? (
            <View style={styles.tags}>
              {c.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <T w={600} s={11.5} color={C.purple}>
                    #{t}
                  </T>
                </View>
              ))}
            </View>
          ) : null}

          {/* organizer */}
          <Card style={{ marginTop: 16, padding: 14 }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('Organizer', { id: c.organizer.id, campaignId: c.id })}>
              <Avatar source={c.organizer.avatar} name={c.organizer.name} size={46} ring />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <T w={700} s={15} color={C.ink} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {c.organizer.name}
                  </T>
                  {c.organizer.verified ? (
                    <View style={styles.verified}>
                      <Icon name="check-decagram" size={11} color={C.purple} />
                    </View>
                  ) : null}
                </View>
                <T w={500} s={12} color={C.muted} style={{ marginTop: 3 }}>
                  {c.organizer.tagline} · {compact(c.organizer.followers)} followers
                </T>
              </View>
            </Pressable>
            <SoftButton
              label={following ? 'Following' : 'Follow'}
              icon={following ? 'check' : 'plus'}
              color={following ? C.green : C.purple}
              bg={following ? '#DCF5E7' : C.purpleSoft}
              style={{ marginLeft: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 13 }}
              onPress={() => app.toggleFollow(c.organizer.id)}
            />
          </Card>

          {/* progress */}
          <Card style={{ marginTop: 14, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <T w={500} s={13.5} color={C.muted}>
                <T w={800} s={26} color={C.purple}>{money(c.raisedAmount)}</T>
                {'  raised'}
              </T>
              <T w={500} s={13} color={C.muted}>
                of {money(c.goalAmount)}
              </T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
              <Progress percent={c.percent} height={8} style={{ flex: 1 }} />
              <T w={800} s={13} color={C.ink} style={{ marginLeft: 10 }}>
                {c.percent}%
              </T>
            </View>
            <View style={styles.metrics}>
              <Metric icon="account-group-outline" value={compact(c.supporters)} label="supporters" />
              <View style={styles.metricDiv} />
              <Metric icon="clock-outline" value={c.status === 'completed' ? 'Closed' : c.daysLeft} label="days left" />
              <View style={styles.metricDiv} />
              <Metric icon="eye-outline" value={compact(c.views || 0)} label="views" />
            </View>
            {c.remaining > 0 ? (
              <T w={500} s={12} color={C.mutedLight} style={{ marginTop: 14, textAlign: 'center' }}>
                {money(c.remaining)} still needed to reach the goal
              </T>
            ) : (
              <T w={600} s={12} color={C.green} style={{ marginTop: 14, textAlign: 'center' }}>
                Goal reached — thank you to every supporter
              </T>
            )}
          </Card>

          {mine ? (
            <View style={{ marginTop: 14 }}>
              <Card style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="account-circle-outline" size={18} color={C.purple} />
                  <T w={700} s={13} color={C.ink} style={{ marginLeft: 8, flex: 1 }}>
                    You created this campaign
                  </T>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <SoftButton label="Manage" icon="cog-outline" style={{ flex: 1, marginRight: 8 }} onPress={() => navigation.navigate('MyCampaigns')} />
                  <SoftButton label="Add update" icon="plus" style={{ flex: 1 }} onPress={() => navigation.navigate('MyCampaigns', { openUpdate: c.id })} />
                </View>
              </Card>
            </View>
          ) : (
            <GradButton
              label="Support Now"
              icon="heart"
              arrow
              style={{ marginTop: 16 }}
              onPress={() => navigation.navigate('Contribution', { id: c.id })}
            />
          )}

          {app.state.prefs.showDemoTips !== false ? <DemoNote /> : null}

          {/* tabs */}
          <View style={styles.tabBar}>
            {TABS.map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
                <T w={700} s={14} color={tab === t ? C.ink : C.mutedLight}>
                  {t}
                </T>
                <View style={[styles.tabLine, tab === t && { backgroundColor: C.purple }]} />
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 18 }}>
            {tab === 'About' ? <About c={c} cat={cat} records={records} onSupporters={() => setTab('Supporters')} /> : null}
            {tab === 'Updates' ? <Updates c={c} now={now} /> : null}
            {tab === 'Supporters' ? <Supporters c={c} records={records} now={now} /> : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* --------------------------------------------------------------- tab bodies */

function About({ c, cat, records, onSupporters }) {
  return (
    <View>
      <T w={800} s={17} color={C.ink}>
        About This Campaign
      </T>
      <T w={400} s={14} color={C.inkSoft} style={{ marginTop: 10, lineHeight: 23 }}>
        {c.description || c.summary}
      </T>

      {c.location ? (
        <View style={styles.row}>
          <Icon name="map-marker-outline" size={17} color={C.purple} />
          <T w={500} s={13.5} color={C.ink} style={{ marginLeft: 8 }}>
            {c.location}
          </T>
        </View>
      ) : null}
      <View style={styles.row}>
        <Icon name="calendar-outline" size={17} color={C.purple} />
        <T w={500} s={13.5} color={C.ink} style={{ marginLeft: 8 }}>
          Runs until {new Date(c.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </T>
      </View>

      {c.gallery && c.gallery.length > 1 ? (
        <View style={styles.gallery}>
          {c.gallery.slice(0, 4).map((src, i) => (
            <View key={i} style={[styles.galleryCell, i === 3 && { marginRight: 0 }]}>
              <SmartImage source={src} category={c.category} style={StyleSheet.absoluteFill} />
              {i === 3 && c.gallery.length > 4 ? (
                <View style={styles.galleryMore}>
                  <T w={700} s={13} color="#fff">
                    +{c.gallery.length - 4}
                  </T>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <Pressable onPress={onSupporters} style={styles.supporterStrip}>
        <View style={styles.faces}>
          {records.slice(0, 4).map((r, i) => (
            <Avatar
              key={r.id}
              source={r.donorAvatar}
              name={r.donorName || 'A'}
              size={28}
              style={{ marginLeft: i === 0 ? 0 : -9 }}
            />
          ))}
          {records.length === 0 ? (
            <T w={400} s={12.5} color={C.muted}>
              Be the first to support this campaign
            </T>
          ) : null}
        </View>
        <T w={500} s={13} color={C.muted} style={{ flex: 1, marginLeft: records.length ? 10 : 0 }}>
          Supported by <T w={800} s={13} color={C.ink}>{compact(c.supporters)}</T> people
        </T>
        <Icon name="chevron-right" size={17} color={C.mutedLight} />
      </Pressable>
    </View>
  );
}

function Updates({ c, now }) {
  const items = c.updates || [];
  if (!items.length) {
    return (
      <Empty
        icon="bullhorn-outline"
        title="No updates yet"
        body="The organizer has not posted an update on this campaign so far."
      />
    );
  }
  return (
    <View>
      <T w={800} s={17} color={C.ink} style={{ marginBottom: 4 }}>
        Latest Updates
      </T>
      {items.map((u, i) => (
        <View key={u.id} style={styles.update}>
          <View style={styles.updateDotCol}>
            <View style={styles.updateDot} />
            {i < items.length - 1 ? <View style={styles.updateLine} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 18 }}>
            <T w={700} s={14} color={C.ink}>
              Update {items.length - i}
            </T>
            <T w={500} s={11.5} color={C.mutedLight} style={{ marginTop: 3 }}>
              {timeAgo(u.createdAt)} · {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </T>
            <T w={400} s={13.5} color={C.inkSoft} style={{ marginTop: 8, lineHeight: 21 }}>
              {u.text}
            </T>
          </View>
        </View>
      ))}
      <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 2 }}>
        Last checked {timeAgo(now)}
      </T>
    </View>
  );
}

function Supporters({ c, records, now }) {
  const total = c.supporters;
  if (!records.length) {
    return (
      <Empty
        icon="hand-heart"
        title="No itemised support yet"
        body={'This campaign shows ' + compact(total) + ' supporters. Contributions made in this demo build are listed here one by one.'}
      />
    );
  }
  return (
    <View>
      <T w={800} s={17} color={C.ink}>
        Recent Supporters
      </T>
      {records.map((r) => (
        <View key={r.id} style={styles.supporter}>
          <Avatar source={r.donorAvatar} name={r.donorName || 'A'} size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T w={700} s={14} color={C.ink} numberOfLines={1}>
              {r.donorName || 'A supporter'}
            </T>
            <T w={400} s={12} color={C.muted} style={{ marginTop: 2 }}>
              {money(r.amount)} · {timeAgo(r.createdAt)}
            </T>
          </View>
          <View style={styles.supportBadge}>
            <Icon name="currency-inr" size={13} color={C.green} />
          </View>
        </View>
      ))}
      <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 10 }}>
        {records.length} contribution{records.length === 1 ? '' : 's'} recorded on this device · total{' '}
        {money(records.reduce((s, r) => s + r.amount, 0))}
      </T>
    </View>
  );
}

/* -------------------------------------------------------------------- bits */

function Metric({ icon, value, label }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name={icon} size={14} color={C.mutedLight} style={{ marginRight: 5 }} />
        <T w={800} s={16} color={C.ink}>
          {value}
        </T>
      </View>
      <T w={500} s={11.5} color={C.muted} style={{ marginTop: 3 }}>
        {label}
      </T>
    </View>
  );
}

function DemoNote() {
  return (
    <View style={styles.demoNote}>
      <Icon name="information-outline" size={15} color={C.amber} />
      <T w={500} s={11.5} color="#8A6A1E" style={{ flex: 1, marginLeft: 8 }}>
        Demo campaign — supporting it records a simulated contribution on this device. No real payment is taken.
      </T>
    </View>
  );
}

function hexToTranslucent(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',0.9)';
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 300, backgroundColor: '#E9E5F7', position: 'relative' },
  heroTop: {
    position: 'absolute',
    top: 44,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBottom: { position: 'absolute', left: 16, bottom: 18, flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  dots: {
    position: 'absolute',
    bottom: 66,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)', marginHorizontal: 3 },
  dotOn: { backgroundColor: '#fff', width: 18 },
  body: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
    paddingHorizontal: 18,
    paddingTop: 22,
    minHeight: 300,
  },
  title: { letterSpacing: -0.6, lineHeight: 31 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tag: {
    backgroundColor: C.purpleSoft,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginRight: 7,
    marginBottom: 7,
  },
  verified: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  metricDiv: { width: 1, height: 30, backgroundColor: C.borderSoft },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, gap: 10 },
  galleryCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EFEDF7',
  },
  galleryMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,40,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supporterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: C.bg,
  },
  faces: { flexDirection: 'row', alignItems: 'center' },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6E5',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  tabBar: { flexDirection: 'row', marginTop: 24, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabLine: { height: 3, borderRadius: 2, width: 0, marginTop: 8, backgroundColor: 'transparent' },
  update: { flexDirection: 'row', marginTop: 14 },
  updateDotCol: { width: 18, alignItems: 'center', paddingTop: 5 },
  updateDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.purple },
  updateLine: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 4 },
  supporter: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  supportBadge: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#DCF5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
