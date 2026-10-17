// Persistence is the part of the demo the user actually judges as "it saved".
// These tests drive the real store functions through a write/reload cycle with
// an in-memory AsyncStorage to prove nothing is lost or resurrected.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as L from '../logic';
import { GUEST_ID } from '../seed';
import {
  IMG_SCHEME,
  clearAllData,
  flushState,
  isImgRef,
  loadImageCache,
  loadState,
  markSeen,
  persistState,
  putImage,
  removeImage,
  resolveImage,
} from '../persistence';

const NOW = Date.parse('2026-10-17T12:00:00Z');

const draftOf = (ownerId) => ({
  ...L.emptyDraft(ownerId, NOW),
  title: 'Solar lamps for 40 homes',
  category: 'Environment',
  goalAmount: 60000,
  days: 30,
  summary: 'Off-grid lighting so children can study after sunset.',
  description: 'We will install 40 solar lamp units across two hamlets and train local volunteers to maintain them.',
  location: 'Rajshahi, Bangladesh',
  agreed: true,
});

const signedUp = () => {
  const res = L.register(L.initialState(NOW), {
    name: 'Asha Rahman', email: 'asha@example.com', username: 'asha',
    password: 'amplify123', confirm: 'amplify123', accepted: true,
  });
  expect(res.error).toBeNull();
  return res;
};

// Save like the app does, then read the document back like a cold launch.
async function relaunch(state) {
  persistState(state);
  await flushState();
  const { state: reloaded, fresh } = await loadState();
  expect(fresh).toBe(false);
  return reloaded;
}

// Everything the 14-step journey leaves behind, in one state object.
function journey() {
  const { user, state: signed } = signedUp();
  const drafted = L.upsertDraft(signed, draftOf(user.id), NOW);
  const published = L.publishDraft(drafted, Object.values(drafted.drafts)[0].id, NOW);
  let state = published.state;
  state = L.toggleSave(state, user.id, 'cmp_rivers', NOW).state;
  state = L.contribute(state, { actor: user.id, campaignId: 'cmp_rivers', amount: 1500, now: NOW }).state;
  state = L.updateProfile(state, user.id, { bio: 'Education volunteer' }, NOW).state;
  return { state: { ...state, sessionUserId: user.id }, user, campaign: published.campaign };
}

beforeEach(async () => {
  await clearAllData();
  await AsyncStorage.clear();
});

describe('restart round-trip', () => {
  test('starts from the demo seed on a clean device', async () => {
    const { state, fresh } = await loadState();
    expect(fresh).toBe(true);
    expect(state.sessionUserId).toBeNull();
    expect(Object.keys(state.campaigns).length).toBeGreaterThan(5);
  });

  test('keeps the campaign, save, contribution and profile edits', async () => {
    const { state, user, campaign } = journey();
    const reloaded = await relaunch(state);

    expect(reloaded.campaigns[campaign.id]).toBeTruthy();
    expect(reloaded.campaigns[campaign.id].source).toBe('user');
    expect(reloaded.drafts).toEqual({});
    expect(reloaded.saved[user.id]).toContain('cmp_rivers');
    expect(Object.values(reloaded.contributions).filter((c) => c.userId === user.id)).toHaveLength(1);
    expect(reloaded.users[user.id].bio).toBe('Education volunteer');
    expect(reloaded.sessionUserId).toBe(user.id);
    expect(L.statsFor(reloaded, user.id)).toMatchObject({ created: 1, saved: 1, contributions: 1, totalContributed: 1500 });
    expect(L.raisedOf(reloaded, reloaded.campaigns.cmp_rivers)).toBe(L.raisedOf(state, state.campaigns.cmp_rivers));
    expect(L.activityFeed(reloaded, user.id, 'all', NOW).map((a) => a.kind)).toEqual(
      expect.arrayContaining(['created', 'saved', 'support_given', 'profile']),
    );
  });

  test('reloading twice does not duplicate saves or contributions', async () => {
    const { state, user } = journey();
    const twice = await relaunch(await relaunch(state));
    expect(twice.saved[user.id].filter((id) => id === 'cmp_rivers')).toHaveLength(1);
    expect(Object.values(twice.contributions)).toHaveLength(Object.values(state.contributions).length);
    expect(L.statsFor(twice, user.id).totalContributed).toBe(1500);
  });

  test('a demo campaign the user deleted stays deleted', async () => {
    const { state } = journey();
    const before = Object.keys(state.campaigns).length;
    const reloaded = await relaunch(L.deleteCampaign(state, 'cmp_rivers'));
    expect(reloaded.campaigns.cmp_rivers).toBeUndefined();
    expect(Object.keys(reloaded.campaigns).length).toBe(before - 1);
  });

  test('guest work follows the new account into the reload', async () => {
    const state = L.toggleSave(L.initialState(NOW), GUEST_ID, 'cmp_strays', NOW).state;
    const res = L.register(L.upsertDraft(state, draftOf(GUEST_ID), NOW), {
      name: 'Nila Karim', email: 'nila@example.com', username: 'nila',
      password: 'amplify123', confirm: 'amplify123', accepted: true,
    });
    expect(res.error).toBeNull();
    const reloaded = await relaunch(res.state);
    expect(reloaded.saved[GUEST_ID]).toBeUndefined();
    expect(reloaded.saved[res.user.id]).toContain('cmp_strays');
    expect(Object.values(reloaded.drafts).every((d) => d.ownerId !== GUEST_ID)).toBe(true);
  });

  test('a corrupt document falls back to the seed instead of a blank screen', async () => {
    await AsyncStorage.setItem('amplify.state.v1', '{not json');
    const { state, fresh } = await loadState();
    expect(fresh).toBe(true);
    expect(Object.keys(state.campaigns).length).toBeGreaterThan(5);
  });

  test('resetting the demo wipes user records and restores the seed', async () => {
    const { state, user, campaign } = journey();
    await relaunch(state);
    await clearAllData();
    const { state: reloaded, fresh } = await loadState();
    expect(fresh).toBe(true);
    expect(reloaded.campaigns[campaign.id]).toBeUndefined();
    expect(reloaded.users[user.id]).toBeUndefined();
    expect(Object.keys(reloaded.campaigns).length).toBeGreaterThan(5);
  });
});

describe('picked photos', () => {
  const base64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA';

  test('state stores a ref and the bytes live on their own key', async () => {
    const ref = await putImage(base64);
    expect(isImgRef(ref)).toBe(true);
    const key = ref.slice(IMG_SCHEME.length);
    expect(await AsyncStorage.getItem('amplify.img.' + key)).toContain('data:image/jpeg;base64,');
    expect(await resolveImage(ref)).toContain('data:image/jpeg;base64,');

    const { user, state: signed } = signedUp();
    const reloaded = await relaunch(L.upsertDraft(signed, { ...draftOf(user.id), cover: ref }, NOW));
    expect(Object.values(reloaded.drafts)[0].cover).toBe(ref);
    expect(JSON.stringify(reloaded).includes(base64)).toBe(false);
  });

  test('a photo on disk resolves even when the cache never saw it', async () => {
    await AsyncStorage.setItem('amplify.img.orphan', 'data:image/jpeg;base64,ZZZZ');
    expect(await resolveImage('img://orphan')).toContain('ZZZZ');
    await AsyncStorage.setItem('amplify.img.warm', 'data:image/jpeg;base64,YYYY');
    await loadImageCache();
    expect(await resolveImage('img://warm')).toContain('YYYY');
  });

  test('removing a photo deletes its stored bytes', async () => {
    const ref = await putImage(base64);
    await removeImage(ref);
    expect(await AsyncStorage.getItem('amplify.img.' + ref.slice(IMG_SCHEME.length))).toBeNull();
    expect(await resolveImage(ref)).toBeNull();
  });

  test('bundled artwork refs survive a reload unchanged', async () => {
    let state = L.toggleSave(L.initialState(NOW), GUEST_ID, 'cmp_rivers', NOW).state;
    state = L.contribute(state, { actor: GUEST_ID, campaignId: 'cmp_rivers', amount: 500, now: NOW }).state;
    const reloaded = await relaunch(state);
    expect(reloaded.campaigns.cmp_rivers.cover).toMatch(/^asset:\/\//);
    expect(reloaded.campaigns.cmp_rivers.gallery.every((r) => typeof r === 'string')).toBe(true);
    expect(Object.values(reloaded.contributions).every((c) => typeof c.donorAvatar !== 'number')).toBe(true);
  });
});

describe('first run', () => {
  test('onboarding is offered once per device', async () => {
    expect(await markSeen()).toBe(false);
    expect(await markSeen()).toBe(true);
  });
});
