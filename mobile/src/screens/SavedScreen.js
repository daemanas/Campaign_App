// Saved campaigns. The bookmark list is one record per campaign per actor, so
// saving from Home, Explore, Detail or Profile always shows the same state here.
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Pressable, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../store/AppStore';
import { C, money } from '../theme/theme';
import { Icon } from '../components/Icon';
import { CampaignCard } from '../components/CampaignCard';
import { Chip, Empty, IconButton, Screen, SoftButton, T } from '../components/ui';

const SORTS = [
  { id: 'recent', label: 'Recently saved' },
  { id: 'progress', label: 'Closest to goal' },
  { id: 'ending', label: 'Ending soon' },
  { id: 'amount', label: 'Amount raised' },
];

export default function SavedScreen({ navigation }) {
  const app = useApp();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [now, setNow] = useState(Date.now());

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = app.selectors.saved(now);
    if (q) {
      items = items.filter((c) => [c.title, c.summary, c.category, c.location].join(' ').toLowerCase().includes(q));
    }
    const savedAt = (id) => {
      const rec = app.state.saved[app.actor] || [];
      // The stored order is the save order, so "recently saved" needs no extra field.
      return rec.length - rec.indexOf(id);
    };
    const by = {
      recent: (a, b) => savedAt(b.id) - savedAt(a.id),
      progress: (a, b) => b.percent - a.percent,
      ending: (a, b) => a.daysLeft - b.daysLeft,
      amount: (a, b) => b.raisedAmount - a.raisedAmount,
    };
    return items.sort(by[sort] || by.recent);
  }, [app, now, query, sort]);

  const total = list.reduce((s, c) => s + c.goalAmount, 0);
  const ids = app.state.saved[app.actor] || [];

  return (
    <Screen bg={C.bg}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" bg="#fff" border onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <T w={800} s={20} color={C.ink}>
            Saved campaigns
          </T>
          <T w={400} s={12.5} color={C.muted} style={{ marginTop: 2 }}>
            {ids.length} bookmark{ids.length === 1 ? '' : 's'} kept on this device
          </T>
        </View>
        <IconButton icon="magnify" bg="#fff" border onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pad}>
        <View style={styles.search}>
          <Icon name="magnify" size={18} color={C.mutedLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search saved campaigns"
            placeholderTextColor={C.mutedLight}
            style={styles.input}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle" size={18} color={C.mutedLight} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {SORTS.map((s) => (
            <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />
          ))}
        </ScrollView>

        <View style={styles.summary}>
          <View style={styles.sumIcon}>
            <Icon name="bookmark-check" size={18} color={C.purpleDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <T w={700} s={13.5} color={C.ink}>
              {list.length} of {ids.length} shown
            </T>
            <T w={400} s={12} color={C.muted} style={{ marginTop: 2 }}>
              Combined goal {money(total)} · progress updates live as campaigns are funded
            </T>
          </View>
        </View>

        {list.length ? (
          list.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              variant="compact"
              saved
              onSave={() => app.toggleSave(c.id)}
              onPress={() => navigation.navigate('Detail', { id: c.id })}
              style={{ marginBottom: 14 }}
            />
          ))
        ) : (
          <Empty
            icon="bookmark-outline"
            title={ids.length ? 'No saved campaign matches' : 'Nothing saved yet'}
            body={
              ids.length
                ? 'Try a different word, or clear the search to see every saved campaign.'
                : 'Tap the bookmark on any campaign and it will wait for you here — even after you close the app.'
            }
            action={ids.length ? 'Clear search' : 'Explore campaigns'}
            onAction={ids.length ? () => setQuery('') : () => navigation.navigate('Tabs', { screen: 'Explore' })}
          />
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <SoftButton label="My support history" icon="history" style={{ flex: 1 }} onPress={() => navigation.navigate('Tabs', { screen: 'Profile', params: { tab: 'supported' } })} />
          <SoftButton label="Find more" icon="compass-outline" style={{ flex: 1 }} onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })} />
        </View>

        <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 18, textAlign: 'center', lineHeight: 17 }}>
          Saving works while you are signed out. Any bookmarks made as a guest move onto your account when you sign in.
        </T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: C.bg,
  },
  pad: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 40 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 13,
    marginVertical: 10,
  },
  input: { flex: 1, fontFamily: 'Poppins', fontSize: 14, color: C.ink, paddingVertical: 12, marginLeft: 8 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.purpleTint,
    borderRadius: 16,
    padding: 13,
    marginTop: 12,
    marginBottom: 16,
  },
  sumIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
});
