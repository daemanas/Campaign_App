// Explore — full-text search, category filter and sort, all working without an
// account. Results are read straight from the store on every render.
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../store/AppStore';
import { useGate } from '../navigation/gate';
import { C } from '../theme/theme';
import { CATEGORIES } from '../store/seed';
import { SORTS } from '../store/logic';
import { Icon } from '../components/Icon';
import { CampaignCard } from '../components/CampaignCard';
import { Logo } from '../components/BrandLogo';
import { Chip, Empty, IconButton, Screen, T } from '../components/ui';

export default function ExploreScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('popular');

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const list = useMemo(
    () => app.selectors.filter({ category, query, sort, now }),
    [app, category, query, sort, now]
  );
  const unread = app.selectors.unread();

  const open = (id) => navigation.navigate('Detail', { id });

  return (
    <Screen bg={C.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setNow(Date.now());
              setTimeout(() => setRefreshing(false), 400);
            }}
            tintColor={C.purple}
            colors={[C.purple]}
          />
        }
      >
        <View style={styles.header}>
          <Logo />
          <IconButton icon="bell-outline" badge={unread} bg="#fff" border onPress={() => navigation.navigate('Activity')} />
        </View>

        <T w={800} s={30} color={C.ink} style={{ letterSpacing: -0.8 }}>
          Explore
        </T>
        <T w={400} s={13.5} color={C.muted} style={{ marginTop: 5, marginBottom: 16 }}>
          Search campaigns, causes and organizers open to everyone.
        </T>

        <View style={styles.searchRow}>
          <Icon name="magnify" size={19} color={C.mutedLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search campaigns and causes…"
            placeholderTextColor="#9C9AB0"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle" size={18} color={C.mutedLight} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          <Chip
            label="All"
            icon="apps"
            active={category === 'All'}
            onPress={() => setCategory('All')}
            style={styles.chipGap}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              icon={c.icon}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
              style={styles.chipGap}
            />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sorts}>
          {SORTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSort(s.id)}
              style={({ pressed }) => [styles.sortPill, sort === s.id && styles.sortOn, pressed && { opacity: 0.85 }]}
            >
              <Icon
                name={SORT_ICONS[s.id]}
                size={14}
                color={sort === s.id ? '#fff' : C.muted}
                style={{ marginRight: 6 }}
              />
              <T w={700} s={12.5} color={sort === s.id ? '#fff' : C.muted}>
                {s.label}
              </T>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.countRow}>
          <T w={700} s={13.5} color={C.ink}>
            {list.length} {list.length === 1 ? 'campaign' : 'campaigns'} found
          </T>
          {(category !== 'All' || query || sort !== 'popular') && (
            <Pressable
              onPress={() => {
                setCategory('All');
                setQuery('');
                setSort('popular');
              }}
              hitSlop={8}
              style={styles.clear}
            >
              <Icon name="filter-remove" size={14} color={C.purple} />
              <T w={700} s={12.5} color={C.purple}>
                Clear
              </T>
            </Pressable>
          )}
        </View>

        {list.length === 0 ? (
          <Empty
            icon="magnify"
            title="No campaigns found"
            body={
              query
                ? 'Nothing matches “' + query.trim() + '”. Try a different word or clear the filters.'
                : 'No live campaigns in this category yet.'
            }
            action="Start a campaign"
            onAction={gate.openCreate}
          />
        ) : (
          list.map((c, i) => (
            <CampaignCard
              key={c.id}
              c={c}
              variant={i === 0 ? 'overlay' : 'row'}
              saved={app.selectors.isSaved(c.id)}
              onSave={() => app.toggleSave(c.id)}
              onPress={() => open(c.id)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const SORT_ICONS = {
  popular: 'fire',
  newest: 'creation',
  ending: 'timer',
  progress: 'chart-line',
  amount: 'currency-inr',
};

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 13,
    height: 50,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: C.ink,
    marginLeft: 9,
    paddingVertical: 0,
  },
  chips: { marginBottom: 12 },
  chipGap: { marginRight: 8 },
  sorts: { marginBottom: 16 },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  sortOn: { backgroundColor: C.purple, borderColor: C.purple },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  clear: { flexDirection: 'row', alignItems: 'center' },
});
