// Store invariants the demo has to hold: record-derived statistics, no
// duplicate saves, contribution totals that only move on success, guest data
// following a visitor into their new account, and artwork refs that stay
// stable across rebuilds.
import * as L from '../logic';
import { GUEST_ID } from '../seed';

const NOW = Date.parse('2026-10-17T12:00:00Z');
const DAY = 86400000;

const fresh = () => L.initialState(NOW);

const signup = (state = fresh(), over = {}) => {
  const res = L.register(state, {
    name: 'Asha Rahman',
    email: 'asha@example.com',
    username: 'asha',
    password: 'amplify123',
    confirm: 'amplify123',
    accepted: true,
    ...over,
  });
  expect(res.error).toBeNull();
  return res;
};

const completedDraft = (state, ownerId, over = {}) => {
  const draft = {
    ...L.emptyDraft(ownerId, NOW),
    title: 'Solar lamps for 40 homes',
    category: 'Environment',
    goalAmount: 60000,
    days: 30,
    summary: 'Off-grid lighting so children can study after sunset.',
    description: 'We will install 40 solar lamp units across two hamlets, train local volunteers to maintain them, and run a six-month check-in visit for each household.',
    location: 'Rajshahi, Bangladesh',
    agreed: true,
    cover: 'asset://solarVillage',
    tagsText: 'solar, off-grid, education',
    ...over,
  };
  return L.upsertDraft(state, draft);
};

describe('seed data', () => {
  test('is marked demo and starts signed out', () => {
    const s = fresh();
    expect(s.sessionUserId).toBeNull();
    const list = Object.values(s.campaigns);
    expect(list.length).toBeGreaterThan(5);
    expect(list.every((c) => c.source === 'demo')).toBe(true);
  });

  test('never persists a numeric require() id as artwork', () => {
    const s = fresh();
    const refs = []
      .concat(Object.values(s.campaigns).map((c) => c.cover))
      .concat(...Object.values(s.campaigns).map((c) => c.gallery || []))
      .concat(Object.values(s.users).map((u) => u.avatar))
      .concat(Object.values(s.users).map((u) => u.banner))
      .concat(Object.values(s.contributions).map((c) => c.donorAvatar))
      .concat(Object.values(s.activity).map((a) => a.avatar));
    expect(refs.every((r) => r === null || r === undefined || typeof r === 'string')).toBe(true);
    expect(refs.filter(Boolean).every((r) => r.startsWith('asset://') || r.startsWith('img://') || r.startsWith('data:'))).toBe(true);
  });

  test('only the seeded demo account owns campaigns, never a guest', () => {
    const s = fresh();
    const owners = new Set(Object.values(s.campaigns).map((c) => c.ownerId).filter(Boolean));
    expect([...owners].every((id) => id === 'u_daem')).toBe(true);
    expect(Object.values(s.drafts)).toHaveLength(0);
  });
});

describe('campaign creation', () => {
  test('publishing a draft creates a real record and clears the draft', () => {
    const { user } = signup();
    const state = completedDraft(fresh(), user.id);
    expect(Object.keys(state.drafts)).toHaveLength(1);
    const draftId = Object.values(state.drafts)[0].id;
    const res = L.publishDraft(state, draftId, NOW);
    expect(res.error).toBeNull();

    const after = res.state;
    expect(after.drafts[draftId]).toBeUndefined();
    expect(after.campaigns[res.campaign.id]).toBeTruthy();
    expect(res.campaign.ownerId).toBe(user.id);
    expect(res.campaign.source).toBe('user');
    expect(res.campaign.tags).toEqual(['solar', 'off-grid', 'education']);
    expect(res.campaign.gallery).toEqual(['asset://solarVillage']);
    expect(L.filterCampaigns(after, { now: NOW }).some((c) => c.id === res.campaign.id)).toBe(true);
    expect(L.statsFor(after, user.id).created).toBe(1);
    expect(L.activityFeed(after, user.id, 'all', NOW).some((a) => a.kind === 'created')).toBe(true);
  });

  test('an incomplete draft cannot be published and leaves no campaign', () => {
    const { user } = signup();
    const state = L.upsertDraft(fresh(), L.emptyDraft(user.id, NOW));
    const draftId = Object.values(state.drafts)[0].id;
    const res = L.publishDraft(state, draftId, NOW);
    expect(res.error).toBeTruthy();
    expect(res.state.campaigns).toBe(state.campaigns);
    expect(Object.keys(res.state.campaigns).length).toBe(Object.keys(state.campaigns).length);
  });

  test('step validators only gate their own fields', () => {
    const draft = { ...L.emptyDraft('u1', NOW), title: 'Books for village kids', category: 'Education', goalAmount: 25000, days: 30 };
    expect(L.validateStep1(draft)).toBeNull();
    expect(L.validateStep2(draft)).toBeTruthy();
    expect(L.validateDraft(draft)).toBe(L.validateStep2(draft));
  });

  test('drafts survive a second edit and keep other drafts intact', () => {
    const { user } = signup();
    let state = L.upsertDraft(fresh(), L.emptyDraft(user.id, NOW), NOW);
    const first = Object.values(state.drafts)[0];
    state = L.upsertDraft(state, { ...first, title: 'Clean water point' }, NOW + 5);
    const second = L.emptyDraft(user.id, NOW);
    state = L.upsertDraft(state, second, NOW + 9);
    expect(Object.keys(state.drafts).length).toBe(2);
    expect(state.drafts[first.id].title).toBe('Clean water point');
    expect(L.draftsFor(state, user.id)[0].id).toBe(second.id);
    state = L.discardDraft(state, second.id);
    expect(state.drafts[second.id]).toBeUndefined();
    expect(state.drafts[first.id]).toBeTruthy();
  });
});

describe('saved campaigns', () => {
  test('toggles without creating duplicates', () => {
    const { user } = signup();
    const id = 'cmp_rivers';
    let state = fresh();
    [id, id, id].forEach(() => {
      state = L.toggleSave(state, user.id, id, NOW).state;
    });
    expect(state.saved[user.id]).toEqual([id]);
    expect(L.isSaved(state, user.id, id)).toBe(true);
    const off = L.toggleSave(state, user.id, id, NOW);
    expect(off.saved).toBe(false);
    expect(off.state.saved[user.id]).toEqual([]);
  });

  test('saving is consistent for the actor across selectors', () => {
    const { user } = signup();
    const state = L.toggleSave(L.toggleSave(fresh(), user.id, 'cmp_rivers', NOW).state, user.id, 'cmp_strays', NOW).state;
    const saved = L.savedCampaigns(state, user.id, NOW);
    expect(saved.map((c) => c.id).sort()).toEqual(['cmp_rivers', 'cmp_strays']);
    expect(L.statsFor(state, user.id).saved).toBe(2);
    expect(saved.every((c) => c.raisedAmount === L.raisedOf(state, c))).toBe(true);
  });

  test('deleting a campaign removes it from every saved list', () => {
    const { user } = signup();
    const { state } = L.toggleSave(fresh(), user.id, 'cmp_rivers', NOW);
    const next = L.deleteCampaign(state, 'cmp_rivers');
    expect(next.saved[user.id]).toEqual([]);
    expect(next.saved.u_daem.includes('cmp_rivers')).toBe(false);
  });
});

describe('contributions', () => {
  const target = (state) => state.campaigns.cmp_rivers;

  test('rejected amounts never change totals or records', () => {
    const { user } = signup();
    const state = fresh();
    const before = L.raisedOf(state, target(state));
    [20, 0, -500, 'abc', null].forEach((amount) => {
      const res = L.contribute(state, { actor: user.id, campaignId: 'cmp_rivers', amount, now: NOW });
      expect(res.error).toBeTruthy();
      expect(res.state.contributions).toBe(state.contributions);
      expect(L.raisedOf(res.state, target(res.state))).toBe(before);
    });
  });

  test('a confirmed contribution raises progress, counts and history once', () => {
    const { user } = signup();
    const camp = target(fresh());
    const before = { raised: L.raisedOf(fresh(), camp), supporters: L.supportersOf(fresh(), camp) };
    const res = L.contribute(fresh(), { actor: user.id, campaignId: 'cmp_rivers', amount: 1500, now: NOW });
    expect(res.error).toBeNull();
    const state = res.state;
    expect(L.raisedOf(state, target(state))).toBe(before.raised + 1500);
    expect(L.supportersOf(state, target(state))).toBe(before.supporters + 1);
    expect(L.contributionsOf(state, user.id)).toHaveLength(1);
    expect(L.statsFor(state, user.id)).toMatchObject({ contributions: 1, supportedCampaigns: 1, totalContributed: 1500 });
    const view = L.getCampaignView(state, 'cmp_rivers', NOW);
    expect(view.raisedAmount).toBe(L.raisedOf(state, target(state)));
    expect(view.percent).toBe(Math.round((view.raisedAmount / view.goalAmount) * 100));
  });

  test('repeat gifts from one donor add amount but only one supporter', () => {
    const { user } = signup();
    let state = L.contribute(fresh(), { actor: user.id, campaignId: 'cmp_rivers', amount: 500, now: NOW }).state;
    state = L.contribute(state, { actor: user.id, campaignId: 'cmp_rivers', amount: 700, now: NOW + 1 }).state;
    expect(L.statsFor(state, user.id).contributions).toBe(2);
    expect(L.statsFor(state, user.id).supportedCampaigns).toBe(1);
    expect(L.statsFor(state, user.id).totalContributed).toBe(1200);
    expect(L.supportersOf(state, state.campaigns.cmp_rivers)).toBe(L.supportersOf(fresh(), fresh().campaigns.cmp_rivers) + 1);
  });

  test('a closed campaign cannot be funded', () => {
    const { user } = signup();
    const state = L.closeCampaign(fresh(), 'cmp_rivers', NOW);
    expect(state.campaigns.cmp_rivers.status).toBe('completed');
    const res = L.contribute(state, { actor: user.id, campaignId: 'cmp_rivers', amount: 500, now: NOW });
    expect(res.error).toMatch(/closed/);
  });

  test('both supporter views stay distinct: campaigns supported vs records', () => {
    const { user } = signup();
    let state = L.contribute(fresh(), { actor: user.id, campaignId: 'cmp_rivers', amount: 500, now: NOW }).state;
    state = L.contribute(state, { actor: user.id, campaignId: 'cmp_food', amount: 800, now: NOW + 1 }).state;
    const stats = L.statsFor(state, user.id);
    expect(stats.supportedCampaigns).toBe(2);
    expect(stats.contributions).toBe(2);
    expect(L.supportedCampaigns(state, user.id, NOW)).toHaveLength(2);
  });
});

describe('guest activity follows the visitor into their account', () => {
  test('saves, contributions and drafts merge without duplicates', () => {
    let state = L.toggleSave(fresh(), GUEST_ID, 'cmp_rivers', NOW).state;
    state = L.toggleSave(state, GUEST_ID, 'cmp_strays', NOW).state;
    state = L.contribute(state, { actor: GUEST_ID, campaignId: 'cmp_shelter', amount: 600, now: NOW }).state;
    const draft = L.emptyDraft(GUEST_ID, NOW);
    state = L.upsertDraft(state, draft);
    expect(state.saved[GUEST_ID].slice().sort()).toEqual(['cmp_rivers', 'cmp_strays']);

    const res = signup(state);
    state = res.state;
    const id = res.user.id;
    expect(state.saved[GUEST_ID]).toBeUndefined();
    expect(state.saved[id].sort()).toEqual(['cmp_rivers', 'cmp_strays']);
    expect(state.drafts[draft.id].ownerId).toBe(id);
    const mine = Object.values(state.contributions).filter((c) => c.userId === id);
    expect(mine).toHaveLength(1);
    expect(mine[0].amount).toBe(600);
    expect(L.statsFor(state, id)).toMatchObject({ saved: 2, contributions: 1, totalContributed: 600, drafts: 1 });
  });

  test('merging into an account that already saved the same campaign keeps one record', () => {
    let state = L.toggleSave(fresh(), 'u_daem', 'cmp_books', NOW).state;
    state = L.toggleSave(state, GUEST_ID, 'cmp_books', NOW).state;
    state = L.mergeGuestInto(state, 'u_daem');
    expect(state.saved.u_daem.filter((x) => x === 'cmp_books')).toEqual(['cmp_books']);
  });
});

describe('profile editing', () => {
  test('validates then persists, and records an activity item', () => {
    const { user, state } = signup();
    const bad = L.updateProfile(state, user.id, { name: 'A' }, NOW);
    expect(bad.error).toBeTruthy();
    expect(bad.state.users[user.id].name).toBe('Asha Rahman');

    const good = L.updateProfile(state, user.id, { name: 'Asha R.', bio: 'Education volunteer', location: 'Khulna, Bangladesh' }, NOW);
    expect(good.error).toBeNull();
    expect(good.state.users[user.id]).toMatchObject({ name: 'Asha R.', bio: 'Education volunteer', location: 'Khulna, Bangladesh' });
    expect(L.activityFeed(good.state, user.id, 'all', NOW).some((a) => a.kind === 'profile')).toBe(true);
  });

  test('a guest cannot edit a profile', () => {
    const res = L.updateProfile(fresh(), GUEST_ID, { name: 'Nobody' }, NOW);
    expect(res.error).toMatch(/sign in/i);
  });
});

describe('activity and navigation state', () => {
  test('every actor action leaves exactly one record', () => {
    const { user, state } = signup();
    const saved = L.toggleSave(state, user.id, 'cmp_rivers', NOW).state;
    const funded = L.contribute(saved, { actor: user.id, campaignId: 'cmp_rivers', amount: 400, now: NOW }).state;
    const edited = L.updateProfile(funded, user.id, { name: 'Asha Rahman', bio: '', location: '' }, NOW).state;
    const kinds = L.activityFeed(edited, user.id, 'all', NOW).map((a) => a.kind);
    expect(kinds).toEqual(expect.arrayContaining(['saved', 'support_given', 'profile']));
    expect(kinds.filter((k) => k === 'saved')).toHaveLength(1);
  });

  test('unread badge clears with mark-all-read and honours the notification pref', () => {
    const { user, state } = signup();
    const withEvent = L.toggleSave(state, user.id, 'cmp_rivers', NOW).state;
    expect(L.unreadCount(withEvent, user.id)).toBeGreaterThan(0);
    const read = L.markAllActivityRead(withEvent, user.id);
    expect(L.unreadCount(read, user.id)).toBe(0);

    let muted = L.updatePrefs(read, { notifications: false });
    muted = L.toggleSave(muted, user.id, 'cmp_strays', NOW).state;
    expect(muted.saved[user.id]).toContain('cmp_strays');
    expect(L.unreadCount(muted, user.id)).toBe(0);
    expect(L.activityFeed(muted, user.id, 'all', NOW).some((a) => a.kind === 'saved' && a.campaignId === 'cmp_strays')).toBe(true);
  });

  test('bucketing orders Today before Earlier', () => {
    const { user, state } = signup();
    const older = L.pushActivity(state, { userId: user.id, kind: 'saved', title: 'Old', unread: true, createdAt: NOW - 30 * DAY });
    const latest = L.pushActivity(older, { userId: user.id, kind: 'saved', title: 'New', unread: true, createdAt: NOW });
    const feed = L.activityFeed(latest, user.id, 'all', NOW);
    const groups = L.groupByBucket(feed);
    expect(groups.map((g) => g.bucket)).toEqual(['Today', 'Earlier']);
  });
});

describe('discovery', () => {
  test('filters by category, query and sort', () => {
    const state = fresh();
    const env = L.filterCampaigns(state, { category: 'Environment', now: NOW });
    expect(env.length).toBeGreaterThan(0);
    expect(env.every((c) => c.category === 'Environment')).toBe(true);
    const q = L.filterCampaigns(state, { query: 'river', now: NOW });
    expect(q.length).toBeGreaterThan(0);
    expect(q.every((c) => JSON.stringify(c).toLowerCase().includes('river'))).toBe(true);
    const byProgress = L.filterCampaigns(state, { sort: 'progress', now: NOW });
    expect(byProgress[0].percent).toBeGreaterThanOrEqual(byProgress[byProgress.length - 1].percent);
    const byEnding = L.filterCampaigns(state, { sort: 'ending', now: NOW });
    expect(byEnding[0].daysLeft).toBeLessThanOrEqual(byEnding[byEnding.length - 1].daysLeft);
  });

  test('a newly published campaign appears in the same list the feed reads', () => {
    const { user, state } = signup();
    const withDraft = completedDraft(state, user.id, { title: 'School kits for 120 children' });
    const draftId = Object.values(withDraft.drafts)[0].id;
    const published = L.publishDraft(withDraft, draftId, NOW);
    expect(published.error).toBeNull();
    const list = L.filterCampaigns(published.state, { now: NOW });
    expect(list.some((c) => c.id === published.campaign.id)).toBe(true);
    expect(L.filterCampaigns(published.state, { query: 'school kits', now: NOW }).map((c) => c.id))
      .toContain(published.campaign.id);
  });
});
