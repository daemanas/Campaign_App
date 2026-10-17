// Home — the landing feed. Browsing works with no account; every number on
// these cards is derived from the store, so a save or a contribution from any
// other screen shows up here immediately.
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../store/AppStore';
import { useGate } from '../navigation/gate';
import { C, compact, money } from '../theme/theme';
import { CATEGORIES } from '../store/seed';
import { SORTS } from '../store/logic';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/SmartImage';
import { CampaignCard } from '../components/CampaignCard';
import { Logo } from '../components/BrandLogo';
import { Chip, Empty, IconButton, Progress, Screen, Sheet, T } from '../components/ui';

export default function HomeScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('popular');
  const [filters, setFilters] = useState(false);

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNow(Date.now());
    setTimeout(() => setRefreshing(false), 420);
  }, []);

  const all = useMemo(() => app.selectors.filter({ now }), [app, now]);
  const list = useMemo(
    () => app.selectors.filter({ category, query, sort, now }),
    [app, category, query, sort, now]
  );
  const drafts = app.selectors.drafts();
  const unread = app.selectors.unread();

  const open = useCallback((id) => navigation.navigate('Detail', { id }), [navigation]);
  const save = useCallback((id) => app.toggleSave(id), [app]);

  const featured = list[0];
  const rest = list.slice(1);

  return (
    <Screen bg={C.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.purple}
            colors={[C.purple]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo />
          <View style={styles.headerRight}>
            <IconButton
              icon="bell-outline"
              badge={unread}
              bg="#fff"
              border
              onPress={() => navigation.navigate('Activity')}
            />
            <Pressable style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
              <Avatar
                source={app.user ? app.user.avatar : null}
                name={app.user ? app.user.name : 'Guest'}
                size={42}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="magnify" size={19} color={C.mutedLight} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search campaigns, causes, organizers"
              placeholderTextColor="#9C9AB0"
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Icon name="close-circle" size={18} color={C.mutedLight} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.filterBtn} onPress={() => setFilters(true)}>
            <Icon name="tune-variant" size={20} color={C.purple} />
            {sort !== 'popular' ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {CATEGORY_CHIPS.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              icon={chip.icon}
              active={category === chip.id}
              onPress={() => setCategory(chip.id)}
              style={styles.chipGap}
            />
          ))}
        </ScrollView>

        {drafts.length ? (
          <DraftBanner
            title={drafts[0].title || 'Untitled campaign'}
            onResume={gate.openCreate}
            style={{ marginBottom: 18 }}
          />
        ) : null}

        {list.length === 0 ? (
          <NoResults
            anyCampaigns={all.length > 0}
            onReset={() => {
              setCategory('All');
              setQuery('');
            }}
          />
        ) : (
          <>
            <SectionHeader title="Trending Campaigns" onPress={() => navigation.navigate('Explore')} />
            <CampaignCard
              c={featured}
              variant="featured"
              saved={app.selectors.isSaved(featured.id)}
              onSave={() => save(featured.id)}
              onPress={() => open(featured.id)}
            />

            {rest.length ? (
              <>
                <SectionHeader title="Recommended for you" onPress={() => navigation.navigate('Explore')} style={{ marginTop: 10 }} />
                {rest.map((c) => (
                  <CampaignCard
                    key={c.id}
                    c={c}
                    variant="compact"
                    saved={app.selectors.isSaved(c.id)}
                    onSave={() => save(c.id)}
                    onPress={() => open(c.id)}
                  />
                ))}
              </>
            ) : null}

            <QuickStats campaigns={all.length} raised={all.reduce((s, c) => s + c.raisedAmount, 0)} />
          </>
        )}
      </ScrollView>

      <Sheet visible={filters} onClose={() => setFilters(false)} title="Sort campaigns">
        {SORTS.map((s) => (
          <SortRow key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />
        ))}
        <View style={styles.sheetNote}>
          <T w={500} s={12} color={C.muted}>
            Sorting and filters are applied to the campaigns stored on this device.
          </T>
        </View>
      </Sheet>
    </Screen>
  );
}

const CATEGORY_CHIPS = [{ id: 'All', label: 'All', icon: 'apps' }].concat(
  CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon }))
);

/* ---------------------------------------------------------------- pieces */

function SectionHeader({ title, onPress, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <T w={800} s={18} color={C.ink}>
        {title}
      </T>
      <Pressable onPress={onPress} hitSlop={8} style={styles.seeAll}>
        <T w={700} s={13} color={C.purple}>
          See all
        </T>
        <Icon name="chevron-right" size={15} color={C.purple} />
      </Pressable>
    </View>
  );
}

function DraftBanner({ title, onResume, style }) {
  return (
    <Pressable onPress={onResume} style={[styles.draft, style]}>
      <View style={styles.draftIcon}>
        <Icon name="file-document-edit-outline" size={19} color={C.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <T w={700} s={13.5} color={C.ink}>
          Resume your draft
        </T>
        <T w={400} s={12} color={C.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {title}
        </T>
      </View>
      <Icon name="chevron-right" size={18} color={C.purple} />
    </Pressable>
  );
}

function NoResults({ anyCampaigns, onReset }) {
  if (!anyCampaigns) {
    return (
      <Empty
        icon="sprout"
        title="No campaigns yet"
        body="Create the first campaign and it will appear here right away."
      />
    );
  }
  return (
    <Empty
      icon="magnify"
      title="No campaigns match"
      body="Try another cause or clear the search to see everything again."
      action="Clear filters"
      onAction={onReset}
    />
  );
}

function QuickStats({ campaigns, raised }) {
  return (
    <View style={styles.quick}>
      <T w={700} s={13} color={C.ink}>
        {campaigns} live campaigns
      </T>
      <T w={500} s={12} color={C.muted} style={{ marginTop: 3 }}>
        {compact(raised)} raised across Amplify · {money(raised)} total
      </T>
      <Progress percent={Math.min(100, campaigns * 8)} height={5} style={{ marginTop: 12 }} />
      <T w={500} s={11} color={C.mutedLight} style={{ marginTop: 8, textAlign: 'center' }}>
        Demo data stored on this device
      </T>
    </View>
  );
}

function SortRow({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sortRow, pressed && { opacity: 0.8 }, active && styles.sortActive]}
    >
      <T w={active ? 700 : 500} s={14.5} color={active ? C.purple : C.ink}>
        {label}
      </T>
      <Icon name={active ? 'check-circle' : 'circle-outline'} size={19} color={active ? C.purple : C.mutedLight} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ style */

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBtn: { width: 42, height: 42 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 13,
    height: 48,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13.5,
    color: C.ink,
    marginLeft: 9,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.purple,
  },
  chips: { marginBottom: 18 },
  chipGap: { marginRight: 8 },
  draft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
  },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  quick: {
    marginTop: 22,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderSoft,
    padding: 16,
  },
  sheetNote: { paddingTop: 6, paddingBottom: 18 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  sortActive: { backgroundColor: C.purpleSoft, borderColor: '#DED5FF' },
});
