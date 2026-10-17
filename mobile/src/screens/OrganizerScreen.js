// Public organizer profile. Reachable from any campaign detail while logged out,
// so organizer info and their campaigns are browsable without an account.
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp, logic } from '../store/AppStore';
import { C, compact, money } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/SmartImage';
import { CampaignCard } from '../components/CampaignCard';
import { Card, Empty, GradButton, IconButton, Screen, StatBlock, T } from '../components/ui';

export default function OrganizerScreen({ navigation, route }) {
  const app = useApp();
  const id = route.params?.id;
  const [now, setNow] = useState(Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const profile = useMemo(() => resolve(app.state, id), [app.state, id]);
  const campaigns = useMemo(() => listFor(app.state, id, now), [app.state, id, now]);

  if (!profile) {
    return (
      <Screen bg={C.bg}>
        <IconButton icon="arrow-left" bg="#fff" border style={{ margin: 16 }} onPress={() => navigation.goBack()} />
        <Empty icon="account-question" title="Organizer not found" body="This profile is not part of the demo data on this device." />
      </Screen>
    );
  }

  const following = app.selectors.isFollowing(id);
  const raised = campaigns.reduce((s, c) => s + c.raisedAmount, 0);
  const supporters = campaigns.reduce((s, c) => s + c.supporters, 0);

  return (
    <Screen bg={C.bg}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.banner}>
          <View style={styles.bannerInner}>
            <IconButton icon="arrow-left" bg="rgba(20,18,40,0.35)" color="#fff" onPress={() => navigation.goBack()} />
            <View style={{ flex: 1 }} />
            <IconButton icon="share-variant" bg="rgba(20,18,40,0.35)" color="#fff" onPress={() => Share.share({ message: profile.name + ' on Amplify — ' + campaigns.length + ' live campaigns, ' + money(raised) + ' raised.', title: profile.name }).catch(() => {})} />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarRow}>
            <Avatar source={profile.avatar} name={profile.name} size={82} ring />
          </View>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T w={800} s={21} color={C.ink}>
                {profile.name}
              </T>
              {profile.verified ? (
                <View style={styles.verified}>
                  <Icon name="check-decagram" size={13} color="#fff" />
                </View>
              ) : null}
            </View>
            {profile.handle ? (
              <T w={500} s={12.5} color={C.mutedLight} style={{ marginTop: 3 }}>
                {profile.handle}
              </T>
            ) : null}
            <T w={500} s={13} color={C.muted} style={{ marginTop: 8, textAlign: 'center', lineHeight: 19 }}>
              {profile.tagline}
            </T>
            {profile.bio ? (
              <T w={400} s={13.5} color={C.inkSoft} style={{ marginTop: 10, textAlign: 'center', lineHeight: 20 }}>
                {profile.bio}
              </T>
            ) : null}
            {profile.location ? (
              <View style={styles.loc}>
                <Icon name="map-marker-outline" size={14} color={C.purple} />
                <T w={500} s={12.5} color={C.inkSoft} style={{ marginLeft: 5 }}>
                  {profile.location}
                </T>
              </View>
            ) : null}
          </View>

          <Card style={{ marginTop: 20, paddingVertical: 16, flexDirection: 'row' }}>
            <StatBlock value={String(campaigns.length)} label="campaigns" />
            <View style={styles.statDiv} />
            <StatBlock value={money(raised)} label="total raised" />
            <View style={styles.statDiv} />
            <StatBlock value={compact(supporters)} label="supporters" />
          </Card>

          <GradButton
            label={following ? 'Following' : 'Follow organizer'}
            icon={following ? 'check' : 'plus'}
            style={{ marginTop: 16 }}
            colors={following ? ['#159B67', '#0F7C52'] : undefined}
            onPress={() => app.toggleFollow(id)}
          />

          <T w={800} s={17} color={C.ink} style={{ marginTop: 26, marginBottom: 12 }}>
            Campaigns by {profile.name.split(' ')[0]}
          </T>

          {campaigns.length ? (
            campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                c={c}
                variant="row"
                saved={app.selectors.isSaved(c.id)}
                onSave={() => app.toggleSave(c.id)}
                onPress={() => navigation.push('Detail', { id: c.id })}
              />
            ))
          ) : (
            <Empty icon="sprout-outline" title="No live campaigns" body="This organizer has no campaigns open for support right now." />
          )}

          <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 18, textAlign: 'center' }}>
            Public demo profile · figures come from campaigns stored on this device
          </T>
        </View>
      </ScrollView>
    </Screen>
  );
}

function resolve(state, id) {
  const org = state.organizers[id];
  if (org) return { ...org, bio: '', location: '' };
  const user = state.users[id];
  if (user) {
    return {
      id: user.id,
      name: user.name,
      handle: '@' + user.username,
      tagline: 'Campaign organizer',
      verified: !!user.verified,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      followers: user.followers || 0,
    };
  }
  return null;
}

function listFor(state, id, now) {
  return Object.values(state.campaigns)
    .filter((c) => c.status !== 'draft' && (c.organizerId === id || c.ownerId === id))
    .map((c) => logic.campaignView(state, c, now));
}

const styles = StyleSheet.create({
  banner: { height: 130, backgroundColor: C.inkSoft },
  bannerInner: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 44 },
  body: { paddingHorizontal: 18, paddingTop: 0, marginTop: -46 },
  avatarRow: { alignItems: 'center' },
  verified: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },
  loc: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statDiv: { width: 1, backgroundColor: C.borderSoft },
});
