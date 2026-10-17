// Activity feed. Every row is a record the store wrote when something actually
// happened — campaign created, saved, contribution completed, profile updated —
// grouped into Today / Yesterday / This week / Earlier buckets.
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp, logic } from '../store/AppStore';
import { C, money } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Avatar, SmartImage } from '../components/SmartImage';
import { Logo } from '../components/BrandLogo';
import { Card, Chip, Empty, IconButton, Screen, T } from '../components/ui';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'support', label: 'Support' },
  { id: 'updates', label: 'My activity' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'community', label: 'Community' },
];

const KIND_STYLE = {
  support: { icon: 'hand-heart', color: C.green, bg: '#E4F7EE' },
  support_given: { icon: 'currency-inr', color: C.green, bg: '#E4F7EE' },
  created: { icon: 'rocket-launch', color: C.purpleDeep, bg: C.purpleSoft },
  update: { icon: 'bullhorn', color: C.blue, bg: '#E6EFFC' },
  saved: { icon: 'bookmark', color: C.purpleDeep, bg: C.purpleSoft },
  profile: { icon: 'account-edit', color: C.amber, bg: '#FFF3D9' },
  follow: { icon: 'account-plus', color: C.purpleDeep, bg: C.purpleSoft },
  like: { icon: 'heart', color: C.red, bg: '#FFE5EA' },
  comment: { icon: 'comment-text', color: C.blue, bg: '#E6EFFC' },
  mention: { icon: 'at', color: C.purpleDeep, bg: C.purpleSoft },
  views: { icon: 'eye', color: C.muted, bg: '#F0EFF6' },
};

const styleFor = (kind) => KIND_STYLE[kind] || KIND_STYLE.views;

export default function ActivityScreen({ navigation }) {
  const app = useApp();
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const items = useMemo(() => app.selectors.activity(filter, now), [app, filter, now]);
  const groups = useMemo(() => logic.groupByBucket(items), [items]);
  const unread = app.selectors.unread();

  const open = (item) => {
    app.markRead(item.id);
    if (item.campaignId) navigation.navigate('Detail', { id: item.campaignId });
  };

  return (
    <Screen bg={C.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setNow(Date.now());
              setTimeout(() => setRefreshing(false), 350);
            }}
            tintColor={C.purple}
            colors={[C.purple]}
          />
        }
      >
        <View style={styles.topRow}>
          <Logo />
          <IconButton icon="tray-full" onPress={() => app.markAllRead()} badge={unread} />
        </View>

        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <T w={800} s={26} color={C.ink}>
              Activity
            </T>
            <T w={400} s={13.5} color={C.muted} style={{ marginTop: 4, lineHeight: 19 }}>
              Stay updated with your campaigns and community.
            </T>
          </View>
          {unread ? (
            <Pressable onPress={() => app.markAllRead()} hitSlop={6} style={styles.readBtn}>
              <Icon name="check-all" size={14} color={C.purpleDeep} />
              <T w={700} s={12} color={C.purpleDeep} style={{ marginLeft: 5 }}>
                Mark all
              </T>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </ScrollView>

        {groups.length ? (
          groups.map((g) => (
            <View key={g.bucket} style={{ marginTop: 20 }}>
              <T w={700} s={12.5} color={C.mutedLight} style={{ marginBottom: 8, letterSpacing: 0.4 }}>
                {g.bucket.toUpperCase()}
              </T>
              <Card style={{ paddingVertical: 4 }}>
                {g.items.map((item, i) => (
                  <View key={item.id}>
                    {i ? <View style={styles.rowDivider} /> : null}
                    <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.96 }]}>
                      {item.avatar ? (
                        <View>
                          <Avatar source={item.avatar} name={item.title.split(' ').slice(0, 2).join(' ')} size={40} />
                          {item.verified ? (
                            <View style={styles.verifyDot}>
                              <Icon name="check-bold" size={9} color="#fff" />
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <View style={[styles.kindIcon, { backgroundColor: styleFor(item.kind).bg }]}>
                          <Icon name={styleFor(item.kind).icon} size={18} color={styleFor(item.kind).color} />
                        </View>
                      )}

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          <T w={item.unread ? 700 : 600} s={13.5} color={C.ink} style={{ flex: 1 }}>
                            {item.title}
                          </T>
                          {item.unread ? <View style={styles.unreadDot} /> : null}
                        </View>
                        {item.body ? (
                          <T w={400} s={12.5} color={C.muted} numberOfLines={2} style={{ marginTop: 3, lineHeight: 18 }}>
                            {item.kind === 'support' || item.kind === 'support_given' ? money(Number(item.amount || 0)) + ' · ' : ''}
                            {item.body}
                          </T>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                          <Icon name="clock-outline" size={12} color={C.mutedLight} />
                          <T w={500} s={11.5} color={C.mutedLight} style={{ marginLeft: 4 }}>
                            {item.age}
                          </T>
                          {item.campaignTitle ? (
                            <T w={500} s={11.5} color={C.purpleDeep} numberOfLines={1} style={{ marginLeft: 10, flex: 1 }}>
                              {item.campaignTitle}
                            </T>
                          ) : null}
                        </View>
                      </View>

                      {item.campaignId ? (
                        <View style={styles.thumb}>
                          <SmartImage source={item.cover} category={item.category} style={StyleSheet.absoluteFill} />
                        </View>
                      ) : null}
                      {item.campaignId ? <Icon name="chevron-right" size={17} color={C.mutedLight} style={{ marginLeft: 6 }} /> : null}
                    </Pressable>
                  </View>
                ))}
              </Card>
            </View>
          ))
        ) : (
          <Empty
            icon="bell-off-outline"
            title="Nothing here yet"
            body={filter === 'all' ? 'Actions you take — saving, supporting, publishing — appear here as they happen.' : 'No activity in this category yet.'}
            action="Browse campaigns"
            onAction={() => navigation.navigate('Tabs', { screen: 'Explore' })}
          />
        )}

        {items.length > 2 ? (
          <Pressable onPress={() => app.clearActivity()} hitSlop={8} style={{ marginTop: 20, alignSelf: 'center' }}>
            <T w={600} s={12.5} color={C.red}>
              Clear activity on this device
            </T>
          </Pressable>
        ) : null}

        <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 18, textAlign: 'center', lineHeight: 17 }}>
          Demo activity — stored locally so you can see the full flow without a server.
        </T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 14 },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.purpleSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowDivider: { height: 1, backgroundColor: C.borderSoft, marginLeft: 64 },
  kindIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verifyDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.purple, marginTop: 5, marginLeft: 6 },
  thumb: { width: 46, height: 46, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E9E5F7', marginLeft: 10 },
});
