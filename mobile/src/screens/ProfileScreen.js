// Profile: identity, record-derived statistics, and the campaigns the current
// actor has created, supported or saved. Every number here is computed from
// stored records — none of it is hardcoded.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Share, ScrollView, StatusBar, StyleSheet, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../store/AppStore';
import { useGate } from '../navigation/gate';
import { C, compact, money } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Avatar, SmartImage } from '../components/SmartImage';
import { CampaignCard } from '../components/CampaignCard';
import { Card, Divider, Empty, GradButton, IconButton, Screen, SoftButton, StatBlock, T } from '../components/ui';

const TABS = [
  { id: 'campaigns', label: 'My Campaigns' },
  { id: 'supported', label: 'Supported' },
  { id: 'saved', label: 'Saved' },
];

export default function ProfileScreen({ navigation, route }) {
  const app = useApp();
  const gate = useGate();
  const [tab, setTab] = useState(route.params?.tab || 'campaigns');
  useEffect(() => {
    if (route.params?.tab) setTab(route.params.tab);
  }, [route.params?.tab]);
  const [now, setNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [])
  );

  const user = app.user;
  const stats = app.selectors.stats();
  const drafts = app.selectors.drafts();
  const saved = app.selectors.saved(now);
  const supported = app.selectors.supported(now);
  const mine = useMemo(
    () => app.selectors.mine().map((c) => app.selectors.view(c, now)),
    [app, now]
  );
  const followingIds = Object.keys(app.state.following[app.actor] || {}).length
    ? app.state.following[app.actor]
    : [];

  const achievements = useMemo(() => buildAchievements(stats), [stats]);

  const openCreate = () => gate.openCreate();
  const editProfile = () => {
    if (!app.isAuthed && !gate.requireAuth({ kind: 'editProfile' })) return;
    navigation.navigate('EditProfile');
  };
  const share = () => {
    const name = user ? user.name : 'Your profile';
    const handle = user && user.username ? 'https://amplifyreach.org/@' + user.username : '';
    return Share.share({
      title: name,
      message: `${name} on Amplify — Campaign Reach. ${handle}`.trim(),
    }).catch(() => {});
  };

  return (
    <Screen bg={C.bg} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ------------------------------------------------------------- banner */}
        <View style={styles.banner}>
          <SmartImage source={user ? user.banner : null} category="Community" style={StyleSheet.absoluteFill} />
          <View style={styles.bannerFade} />
          <View style={styles.bannerRow}>
            <View style={{ flex: 1 }} />
            <IconButton icon="pencil-outline" bg="rgba(20,18,40,0.35)" color="#fff" onPress={editProfile} />
            <IconButton icon="share-variant" bg="rgba(20,18,40,0.35)" color="#fff" onPress={share} />
            <IconButton icon="cog-outline" bg="rgba(20,18,40,0.35)" color="#fff" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarRow}>
            <Avatar source={user ? user.avatar : null} name={user ? user.name : 'Guest'} size={92} ring />
            <View style={{ flex: 1 }} />
            {user ? (
              <View style={{ alignItems: 'flex-end' }}>
                <SoftButton label="Edit profile" icon="pencil-outline" onPress={editProfile} />
              </View>
            ) : (
              <View style={{ alignItems: 'flex-end' }}>
                <SoftButton label="Sign in" icon="login" onPress={() => gate.requireAuth({ kind: 'editProfile' })} />
              </View>
            )}
          </View>

          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T w={800} s={23} color={C.ink}>
                {user ? user.name : 'Browsing as guest'}
              </T>
              {user && user.verified ? (
                <View style={styles.verified}>
                  <Icon name="check-bold" size={13} color="#fff" />
                </View>
              ) : null}
            </View>
            <T w={500} s={13} color={C.mutedLight} style={{ marginTop: 3 }}>
              @{(user && user.username) || 'guest'}
            </T>
            <T w={400} s={13.5} color={C.muted} style={{ marginTop: 10, textAlign: 'center', lineHeight: 20 }}>
              {user ? user.bio || 'No bio yet — add one so supporters know who you are.' : 'Save campaigns and support causes without an account. Sign in to publish your own.'}
            </T>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Icon name="map-marker-outline" size={13} color={C.purpleDeep} />
              <T w={500} s={12} color={C.inkSoft} style={{ marginLeft: 5 }}>
                {user ? user.location || 'Location not set' : 'Anywhere'}
              </T>
            </View>
            <View style={styles.metaChip}>
              <Icon name="calendar-blank-outline" size={13} color={C.purpleDeep} />
              <T w={500} s={12} color={C.inkSoft} style={{ marginLeft: 5 }}>
                Joined {user ? joinedLabel(user.joinedAt) : 'today'}
              </T>
            </View>
          </View>

          {/* ----------------------------------------------------------- stats */}
          <Card style={{ marginTop: 18, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <StatBlock value={stats.created} label="Created" />
              <View style={styles.vDiv} />
              <StatBlock value={stats.saved} label="Saved" />
              <View style={styles.vDiv} />
              <StatBlock value={stats.supportedCampaigns} label="Supported" />
              <View style={styles.vDiv} />
              <StatBlock value={compact(stats.followers)} label="Followers" />
            </View>
            <Divider style={{ marginVertical: 14 }} />
            <View style={{ flexDirection: 'row' }}>
              <StatBlock value={stats.contributions} label="Contributions" />
              <View style={styles.vDiv} />
              <StatBlock value={money(stats.totalContributed)} label="Given" />
              <View style={styles.vDiv} />
              <StatBlock value={money(stats.raisedForYou)} label="Raised for you" />
            </View>
            <T w={400} s={11} color={C.mutedLight} style={{ marginTop: 12, textAlign: 'center', lineHeight: 16 }}>
              Counts come from the records on this device, so they stay accurate as you act.
            </T>
          </Card>

          {drafts.length ? (
            <Card style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.draftIcon}>
                  <Icon name="file-document-edit-outline" size={18} color={C.amber} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <T w={700} s={14} color={C.ink}>
                    {drafts.length} draft {drafts.length === 1 ? 'campaign' : 'campaigns'}
                  </T>
                  <T w={400} s={12} color={C.muted} style={{ marginTop: 2 }}>
                    Saved on this device — finish one whenever you are ready.
                  </T>
                </View>
              </View>
              {drafts.slice(0, 3).map((d) => (
                <Pressable key={d.id} onPress={openCreate} style={({ pressed }) => [styles.draftRow, pressed && { opacity: 0.85 }]}>
                  <T w={600} s={13} color={C.ink} numberOfLines={1} style={{ flex: 1 }}>
                    {d.title || 'Untitled campaign'}
                  </T>
                  <Icon name="chevron-right" size={17} color={C.mutedLight} />
                </Pressable>
              ))}
            </Card>
          ) : null}

          {/* ------------------------------------------------------------ tabs */}
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const on = t.id === tab;
              const count = t.id === 'campaigns' ? mine.length : t.id === 'supported' ? supported.length : saved.length;
              return (
                <Pressable key={t.id} onPress={() => setTab(t.id)} style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && { opacity: 0.9 }]}>
                  <T w={700} s={13} color={on ? C.purpleDeep : C.muted}>
                    {t.label}
                  </T>
                  <T w={700} s={10.5} color={on ? '#fff' : C.mutedLight} style={styles.tabCount}>
                    {count}
                  </T>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 16 }}>
            {tab === 'campaigns' ? (
              mine.length ? (
                mine.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    variant="compact"
                    saved={app.selectors.isSaved(c.id)}
                    onSave={() => app.toggleSave(c.id)}
                    onPress={() => navigation.navigate('MyCampaigns', { highlight: c.id })}
                    onMenu={() => navigation.navigate('MyCampaigns', { highlight: c.id })}
                    style={{ marginBottom: 14 }}
                  />
                ))
              ) : (
                <Empty
                  icon="rocket-launch-outline"
                  title={user ? 'No campaigns yet' : 'Create your first campaign'}
                  body={user ? 'Your published campaigns appear here with live progress and updates.' : 'Browse freely, then sign in when you are ready to publish — any draft you started is kept.'}
                  action="Start a campaign"
                  onAction={openCreate}
                />
              )
            ) : null}

            {tab === 'supported' ? (
              supported.length ? (
                supported.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    variant="compact"
                    saved={app.selectors.isSaved(c.id)}
                    onSave={() => app.toggleSave(c.id)}
                    onPress={() => navigation.navigate('Detail', { id: c.id })}
                    style={{ marginBottom: 14 }}
                  />
                ))
              ) : (
                <Empty icon="hand-heart-outline" title="Nothing supported yet" body="Support a campaign and it shows up here with your contribution record." action="Find campaigns" onAction={() => navigation.navigate('Tabs', { screen: 'Explore' })} />
              )
            ) : null}

            {tab === 'saved' ? (
              saved.length ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <T w={700} s={13} color={C.muted}>
                      {saved.length} saved
                    </T>
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => navigation.navigate('Saved')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <T w={700} s={12.5} color={C.purpleDeep}>
                        Open list
                      </T>
                      <Icon name="chevron-right" size={15} color={C.purpleDeep} />
                    </Pressable>
                  </View>
                  {saved.map((c) => (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      variant="compact"
                      saved
                      onSave={() => app.toggleSave(c.id)}
                      onPress={() => navigation.navigate('Detail', { id: c.id })}
                      style={{ marginBottom: 14 }}
                    />
                  ))}
                </>
              ) : (
                <Empty icon="bookmark-outline" title="No saved campaigns" body="Tap the bookmark on any campaign to keep it here." action="Explore campaigns" onAction={() => navigation.navigate('Tabs', { screen: 'Explore' })} />
              )
            ) : null}
          </View>

          {/* --------------------------------------------------- achievements */}
          <View style={{ marginTop: 22 }}>
            <T w={800} s={16} color={C.ink} style={{ marginBottom: 10 }}>
              Achievements
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
              {achievements.map((a) => (
                <View key={a.label} style={[styles.badge, a.earned && styles.badgeEarned]}>
                  <View style={[styles.badgeIcon, a.earned ? styles.badgeIconOn : null]}>
                    <Icon name={a.icon} size={18} color={a.earned ? C.purpleDeep : '#B9B6C9'} />
                  </View>
                  <T w={700} s={12.5} color={a.earned ? C.ink : C.mutedLight} style={{ marginTop: 8 }}>
                    {a.label}
                  </T>
                  <T w={400} s={11} color={C.muted} style={{ marginTop: 3, textAlign: 'center', lineHeight: 15 }}>
                    {a.hint}
                  </T>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ----------------------------------------------------- community */}
          <Card style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.linkIcon}>
                <Icon name="account-group-outline" size={19} color={C.purpleDeep} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <T w={700} s={14.5} color={C.ink}>
                  My Community
                </T>
                <T w={400} s={12} color={C.muted} style={{ marginTop: 2 }}>
                  {compact(stats.followers)} followers · you follow {followingIds.length} organizer
                  {followingIds.length === 1 ? '' : 's'}
                </T>
              </View>
            </View>
            {followingIds.map((id) => (
              <Pressable
                key={id}
                onPress={() => navigation.navigate('Organizer', { id })}
                style={({ pressed }) => [styles.followRow, pressed && { opacity: 0.85 }]}
              >
                <Avatar source={avatarOf(app.state, id)} name={app.selectors.name(id)} size={34} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <T w={600} s={13.5} color={C.ink}>
                    {app.selectors.name(id)}
                  </T>
                </View>
                <Icon name="chevron-right" size={17} color={C.mutedLight} />
              </Pressable>
            ))}
            {!followingIds.length ? (
              <T w={400} s={12} color={C.mutedLight} style={{ marginTop: 10, lineHeight: 17 }}>
                Follow an organizer from any campaign page and they will be listed here.
              </T>
            ) : null}
          </Card>

          {!user ? (
            <View style={{ marginTop: 20 }}>
              <GradButton label="Sign in or create an account" icon="login" arrow onPress={() => gate.requireAuth({ kind: 'create' })} />
              <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 10, textAlign: 'center', lineHeight: 17 }}>
                Anything you saved or supported as a guest moves onto your account automatically.
              </T>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
              <SoftButton label="Settings" icon="cog-outline" style={{ flex: 1 }} onPress={() => navigation.navigate('Settings')} />
              <SoftButton label="Activity" icon="bell-outline" style={{ flex: 1 }} onPress={() => navigation.navigate('Tabs', { screen: 'Activity' })} />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );

}

/* ------------------------------------------------------------------ helpers */

function avatarOf(state, id) {
  const rec = state.organizers[id] || state.users[id];
  return rec ? rec.avatar || null : null;
}

function joinedLabel(ts) {
  if (!ts) return 'today';
  return new Date(Number(ts)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// Milestones are derived from the actor's records, so a badge can only be
// unlocked by actually doing the thing.
function buildAchievements(stats) {
  return [
    { icon: 'rocket-launch-outline', label: 'First campaign', hint: stats.created >= 1 ? 'Published' : 'Publish a campaign', earned: stats.created >= 1 },
    { icon: 'hand-heart-outline', label: 'First support', hint: stats.contributions >= 1 ? 'Contributed' : 'Support a campaign', earned: stats.contributions >= 1 },
    { icon: 'bookmark-outline', label: 'Curator', hint: stats.saved >= 3 ? `${stats.saved} saved` : 'Save 3 campaigns', earned: stats.saved >= 3 },
    { icon: 'certificate-outline', label: 'Goal helper', hint: stats.totalContributed >= 5000 ? money(stats.totalContributed) : 'Give ₹5,000', earned: stats.totalContributed >= 5000 },
    { icon: 'account-group-outline', label: 'Community', hint: stats.following >= 1 ? 'Following' : 'Follow an organizer', earned: stats.following >= 1 },
  ];
}

const styles = StyleSheet.create({
  banner: { height: 190, backgroundColor: '#2D1B69', position: 'relative' },
  bannerFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23,21,45,0.28)',
  },
  bannerRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  body: { paddingHorizontal: 16, marginTop: -46 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end' },
  verified: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.purpleTint,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  vDiv: { width: 1, backgroundColor: C.borderSoft },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFF3D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 24 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#EFEFF6',
    gap: 6,
  },
  tabOn: { backgroundColor: C.purpleSoft },
  tabCount: {
    minWidth: 20,
    textAlign: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(107,78,255,0.14)',
    overflow: 'hidden',
  },
  badge: {
    width: 132,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  badgeEarned: { borderColor: '#DDD3FF', backgroundColor: '#FBFAFF' },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconOn: { backgroundColor: C.purpleSoft },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
});
