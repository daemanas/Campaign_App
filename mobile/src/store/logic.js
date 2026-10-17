// Pure state transformations and selectors. No React, no AsyncStorage — every
// function takes a state object and returns a new one, so the rules below can
// be unit tested and reused by any screen.
import { buildSeed, GUEST_ID } from './seed';

let counter = 0;
export function uid(prefix = 'id') {
  counter += 1;
  return prefix + '_' + Date.now().toString(36) + '_' + counter.toString(36);
}

export const MIN_CONTRIBUTION = 50;
export const MAX_DESCRIPTION = 500;

export function initialState(now = Date.now()) {
  return buildSeed(now);
}

/* ------------------------------------------------------------------ helpers */

const clone = (o) => (Array.isArray(o) ? [...o] : { ...o });

function mapBy(list, keyFn) {
  return list.reduce((m, x) => {
    const k = keyFn(x);
    m[k] = (m[k] || []).concat([x]);
    return m;
  }, {});
}

export function actorIdOf(state) {
  return state.sessionUserId || GUEST_ID;
}

export function currentUser(state) {
  return state.sessionUserId ? state.users[state.sessionUserId] || null : null;
}

export function displayName(state, id) {
  if (id === GUEST_ID) return 'Guest supporter';
  const u = state.users[id];
  if (u) return u.name;
  const o = state.organizers[id];
  if (o) return o.name;
  return 'A supporter';
}

export function organizerOf(state, campaign) {
  if (!campaign) return null;
  const owner = campaign.ownerId ? state.users[campaign.ownerId] : null;
  if (owner) {
    return {
      id: owner.id,
      name: owner.name,
      tagline: 'Campaign organizer',
      verified: !!owner.verified,
      avatar: owner.avatar,
      followers: owner.followers || 0,
    };
  }
  const o = state.organizers[campaign.organizerId];
  if (o) {
    return {
      id: o.id,
      name: o.name,
      tagline: o.tagline,
      verified: !!o.verified,
      avatar: o.avatar || null,
      followers: o.followers || 0,
    };
  }
  return { id: null, name: 'Amplify Community', tagline: 'Community campaign', verified: false, avatar: null, followers: 0 };
}

/* ------------------------------------------------------------- derived data */

export function contributionsForCampaign(state, campaignId) {
  return Object.values(state.contributions).filter((c) => c.campaignId === campaignId);
}

export function raisedOf(state, campaign) {
  if (!campaign) return 0;
  const extra = contributionsForCampaign(state, campaign.id).reduce((s, c) => s + Number(c.amount || 0), 0);
  return Math.max(0, Number(campaign.baseRaised || 0) + extra);
}

export function supportersOf(state, campaign) {
  if (!campaign) return 0;
  const donors = new Set(contributionsForCampaign(state, campaign.id).map((c) => c.userId));
  return Number(campaign.baseSupporters || 0) + donors.size;
}

export function percentOf(state, campaign) {
  if (!campaign || !campaign.goalAmount) return 0;
  return Math.round((raisedOf(state, campaign) / campaign.goalAmount) * 100);
}

export function daysLeftOf(campaign, now = Date.now()) {
  if (!campaign || !campaign.endDate) return 0;
  return Math.max(0, Math.ceil((campaign.endDate - now) / 86400000));
}

// The single view model every card and header reads from, so a contribution or
// a new campaign updates everywhere at once.
export function campaignView(state, campaign, now = Date.now()) {
  if (!campaign) return null;
  const raised = raisedOf(state, campaign);
  return {
    ...campaign,
    raisedAmount: raised,
    supporters: supportersOf(state, campaign),
    percent: percentOf(state, campaign),
    daysLeft: daysLeftOf(campaign, now),
    remaining: Math.max(0, Number(campaign.goalAmount || 0) - raised),
    organizer: organizerOf(state, campaign),
  };
}

export function getCampaign(state, id) {
  return state.campaigns[id] || null;
}

export function getCampaignView(state, id, now) {
  return campaignView(state, getCampaign(state, id), now);
}

export function publishedCampaigns(state) {
  return Object.values(state.campaigns)
    .filter((c) => c.status !== 'draft')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function draftsFor(state, actorId) {
  return Object.values(state.drafts)
    .filter((d) => d.ownerId === actorId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function myCampaigns(state, userId) {
  return Object.values(state.campaigns)
    .filter((c) => c.ownerId === userId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function isSaved(state, actorId, campaignId) {
  return (state.saved[actorId] || []).includes(campaignId);
}

export function savedCampaigns(state, actorId, now) {
  const ids = state.saved[actorId] || [];
  return ids
    .map((id) => getCampaign(state, id))
    .filter(Boolean)
    .map((c) => campaignView(state, c, now));
}

export function supportedCampaigns(state, actorId, now) {
  const ids = new Set(
    Object.values(state.contributions)
      .filter((c) => c.userId === actorId)
      .map((c) => c.campaignId)
  );
  return [...ids]
    .map((id) => getCampaign(state, id))
    .filter(Boolean)
    .map((c) => campaignView(state, c, now))
    .sort((a, b) => (b.supportedAt || 0) - (a.supportedAt || 0));
}

export function contributionsOf(state, actorId, now) {
  return Object.values(state.contributions)
    .filter((c) => c.userId === actorId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map((c) => {
      const camp = getCampaign(state, c.campaignId);
      return {
        ...c,
        campaignTitle: camp ? camp.title : 'Removed campaign',
        campaignCategory: camp ? camp.category : 'Community',
        cover: camp ? camp.cover : null,
        campaign: camp ? campaignView(state, camp, now) : null,
      };
    });
}

// Every profile number is computed from records — nothing is stored as a stat.
export function statsFor(state, userId) {
  const actor = userId || GUEST_ID;
  const mine = Object.values(state.contributions).filter((c) => c.userId === actor);
  const uniqueSupported = new Set(mine.map((c) => c.campaignId));
  const created = Object.values(state.campaigns).filter((c) => c.ownerId === actor && c.status !== 'draft');
  const drafts = Object.values(state.drafts).filter((d) => d.ownerId === actor);
  const totalRaised = created.reduce((s, c) => s + raisedOf(state, c), 0);
  const user = state.users[actor];
  return {
    created: created.length,
    drafts: drafts.length,
    saved: (state.saved[actor] || []).length,
    supportedCampaigns: uniqueSupported.size,
    contributions: mine.length,
    totalContributed: mine.reduce((s, c) => s + Number(c.amount || 0), 0),
    raisedForYou: totalRaised,
    supporters: created.reduce((s, c) => s + supportersOf(state, c), 0),
    followers: user ? Number(user.followers || 0) : 0,
    following: (state.following[actor] || []).length,
  };
}

export function activityFeed(state, actorId, filter = 'all', now = Date.now()) {
  const items = Object.values(state.activity)
    .filter((a) => a.userId === actorId)
    .filter((a) => {
      if (filter === 'all') return true;
      if (filter === 'support') return a.kind === 'support' || a.kind === 'support_given';
      if (filter === 'updates') return ['update', 'views', 'created', 'saved', 'profile'].includes(a.kind);
      if (filter === 'mentions') return a.kind === 'mention' || a.kind === 'comment';
      if (filter === 'community') return a.kind === 'follow' || a.kind === 'like';
      return true;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map((a) => {
      const camp = a.campaignId ? getCampaign(state, a.campaignId) : null;
      return {
        ...a,
        campaignTitle: camp ? camp.title : null,
        cover: camp ? camp.cover : null,
        category: camp ? camp.category : 'Community',
        age: timeLabel(a.createdAt, now),
        bucket: bucketLabel(a.createdAt, now),
      };
    });
  return items;
}

export function unreadCount(state, actorId) {
  return Object.values(state.activity).filter((a) => a.userId === actorId && a.unread).length;
}

export function timeLabel(ts, now = Date.now()) {
  const diff = Math.max(0, now - Number(ts || 0));
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + ' minute' + (m === 1 ? '' : 's') + ' ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' hour' + (h === 1 ? '' : 's') + ' ago';
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return d + ' days ago';
  return new Date(Number(ts)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function bucketLabel(ts, now = Date.now()) {
  const t = new Date(Number(ts || 0));
  const n = new Date(now);
  const startOfToday = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  if (t.getTime() >= startOfToday) return 'Today';
  if (t.getTime() >= startOfToday - 86400000) return 'Yesterday';
  if (t.getTime() >= startOfToday - 6 * 86400000) return 'This week';
  return 'Earlier';
}

export function groupByBucket(items) {
  const order = [];
  const groups = mapBy(items, (i) => i.bucket);
  Object.keys(groups).forEach((k) => {
    if (!order.includes(k)) order.push(k);
  });
  const rank = { Today: 0, Yesterday: 1, 'This week': 2, Earlier: 3 };
  return order
    .sort((a, b) => (rank[a] ?? 9) - (rank[b] ?? 9))
    .map((bucket) => ({ bucket, items: groups[bucket] }));
}

/* --------------------------------------------------------------- filtering */

export const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'ending', label: 'Ending soon' },
  { id: 'progress', label: 'Closest to goal' },
  { id: 'amount', label: 'Amount raised' },
];

export function filterCampaigns(state, opts = {}) {
  const { category = 'All', query = '', sort = 'popular', now = Date.now() } = opts;
  const q = String(query || '').trim().toLowerCase();
  let list = publishedCampaigns(state).map((c) => campaignView(state, c, now));
  if (category && category !== 'All') list = list.filter((c) => c.category === category);
  if (q) {
    list = list.filter((c) =>
      [c.title, c.summary, c.description, c.category, c.location, ...(c.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }
  const by = {
    popular: (a, b) => b.supporters - a.supporters || b.raisedAmount - a.raisedAmount,
    newest: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    ending: (a, b) => a.daysLeft - b.daysLeft,
    progress: (a, b) => b.percent - a.percent,
    amount: (a, b) => b.raisedAmount - a.raisedAmount,
  };
  return list.sort(by[sort] || by.popular);
}

/* --------------------------------------------------------------- validation */

export function validateSignup({ name, email, username, password, confirm, accepted }) {
  if (!name || name.trim().length < 3) return 'Enter your full name (at least 3 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())) return 'Enter a valid email address.';
  if (!/^[a-zA-Z0-9._]{3,20}$/.test(String(username || '').trim()))
    return 'Username must be 3–20 letters, numbers, dot or underscore.';
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  if (password !== confirm) return 'Passwords do not match.';
  if (!accepted) return 'Please accept the Terms of Service to continue.';
  return null;
}

export function validateLogin({ identifier, password }) {
  if (!String(identifier || '').trim()) return 'Enter your email or username.';
  if (!password) return 'Enter your password.';
  return null;
}

export function validateProfile({ name, bio, location }) {
  if (!name || String(name).trim().length < 2) return 'Display name must be at least 2 characters.';
  if (String(name).trim().length > 40) return 'Display name must be 40 characters or fewer.';
  if (String(bio || '').length > 220) return 'Bio must be 220 characters or fewer.';
  if (String(location || '').length > 60) return 'Location must be 60 characters or fewer.';
  return null;
}

export function validateStep1(draft) {
  if (!draft.title || draft.title.trim().length < 6) return 'Give your campaign a title of at least 6 characters.';
  if (draft.title.trim().length > 70) return 'Keep the title under 70 characters.';
  if (!draft.category) return 'Choose a category.';
  const goal = Number(draft.goalAmount);
  if (!goal || goal < 1000) return 'Target amount must be at least ₹1,000.';
  if (goal > 100000000) return 'Target amount looks too large.';
  if (!draft.days) return 'Choose a campaign duration.';
  return null;
}

export function validateStep2(draft) {
  const desc = String(draft.description || '').trim();
  if (desc.length < 40) return 'Tell supporters a little more — at least 40 characters.';
  if (desc.length > MAX_DESCRIPTION) return 'Description must be ' + MAX_DESCRIPTION + ' characters or fewer.';
  if (!draft.agreed) return 'Please agree to the campaign guidelines.';
  if (!draft.summary || draft.summary.trim().length < 15)
    return 'Write a one-line summary of at least 15 characters.';
  if (draft.summary.trim().length > 140) return 'Keep the summary under 140 characters.';
  if (!draft.location || draft.location.trim().length < 3) return 'Add the city or area this campaign serves.';
  return null;
}

export function validateContribution(amount, campaign) {
  const n = Number(amount);
  if (!amount && amount !== 0) return 'Choose or enter an amount.';
  if (!Number.isFinite(n) || n <= 0) return 'Enter a valid amount.';
  if (n < MIN_CONTRIBUTION) return 'Minimum contribution is ₹' + MIN_CONTRIBUTION + '.';
  if (n > 500000) return 'For this demo the maximum is ₹5,00,000.';
  if (campaign && campaign.status === 'completed') return 'This campaign has already closed.';
  return null;
}

export function validateDraft(draft) {
  return validateStep1(draft) || validateStep2(draft);
}

/* -------------------------------------------------------------------- auth */

export function register(state, input) {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const username = String(input.username || '').trim().toLowerCase();
  const error = validateSignup({ ...input, name, email, username });
  if (error) return { state, error };
  if (Object.values(state.users).some((u) => u.email === email))
    return { state, error: 'An account with this email already exists.' };
  if (Object.values(state.users).some((u) => u.username === username))
    return { state, error: 'That username is taken — try another.' };

  const id = uid('u');
  const next = mergeGuestInto(state, id);
  const users = clone(next.users);
  users[id] = {
    id,
    name,
    email,
    username,
    password: input.password,
    bio: '',
    location: '',
    avatar: null,
    banner: null,
    verified: false,
    followers: 0,
    joinedAt: Date.now(),
    source: 'user',
  };
  return {
    state: { ...next, users, sessionUserId: id },
    user: users[id],
    error: null,
  };
}

export function login(state, input) {
  const key = String(input.identifier || '').trim().toLowerCase();
  const error = validateLogin({ ...input, identifier: key });
  if (error) return { state, error };
  const user = Object.values(state.users).find(
    (u) => u.email === key || u.username === key || u.name.toLowerCase() === key
  );
  if (!user) return { state, error: 'No account found for those details.' };
  if (String(input.password) !== user.password) return { state, error: 'Incorrect password. Please try again.' };
  const next = mergeGuestInto(state, user.id);
  return { state: { ...next, sessionUserId: user.id }, user, error: null };
}

export function logout(state) {
  return { ...state, sessionUserId: null };
}

// Anything the visitor saved, supported or generated before signing in follows
// them into the new session instead of being dropped.
export function mergeGuestInto(state, userId) {
  if (!userId || userId === GUEST_ID) return state;
  const guestSaved = state.saved[GUEST_ID] || [];
  if (!guestSaved.length && !hasGuestRecords(state)) return state;

  const saved = clone(state.saved);
  const merged = [...(saved[userId] || [])];
  guestSaved.forEach((id) => {
    if (!merged.includes(id)) merged.push(id);
  });
  saved[userId] = merged;
  delete saved[GUEST_ID];

  const contributions = clone(state.contributions);
  Object.values(contributions).forEach((c) => {
    if (c.userId === GUEST_ID) contributions[c.id] = { ...c, userId, donorName: state.users[userId]?.name || 'You' };
  });

  const activity = clone(state.activity);
  Object.values(activity).forEach((a) => {
    if (a.userId === GUEST_ID) activity[a.id] = { ...a, userId };
  });

  const drafts = clone(state.drafts);
  Object.values(drafts).forEach((d) => {
    if (d.ownerId === GUEST_ID) drafts[d.id] = { ...d, ownerId: userId };
  });

  const following = clone(state.following);
  const f = [...(following[userId] || [])];
  (following[GUEST_ID] || []).forEach((id) => !f.includes(id) && f.push(id));
  following[userId] = f;
  delete following[GUEST_ID];

  return { ...state, saved, contributions, activity, drafts, following };
}

function hasGuestRecords(state) {
  return (
    Object.values(state.contributions).some((c) => c.userId === GUEST_ID) ||
    Object.values(state.activity).some((a) => a.userId === GUEST_ID) ||
    Object.values(state.drafts).some((d) => d.ownerId === GUEST_ID) ||
    (state.following[GUEST_ID] || []).length > 0
  );
}

/* --------------------------------------------------------------- campaigns */

function splitTags(text) {
  return String(text || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function emptyDraft(actorId, now = Date.now()) {
  return {
    id: uid('dr'),
    ownerId: actorId,
    title: '',
    category: null,
    goalAmount: '',
    days: null,
    description: '',
    summary: '',
    location: '',
    cover: null,
    gallery: [],
    tagsText: '',
    updatesText: '',
    agreed: false,
    step: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertDraft(state, draft, now = Date.now()) {
  const drafts = clone(state.drafts);
  drafts[draft.id] = { ...drafts[draft.id], ...draft, updatedAt: now };
  return { ...state, drafts };
}

export function discardDraft(state, draftId) {
  const drafts = clone(state.drafts);
  delete drafts[draftId];
  return { ...state, drafts };
}

export function publishDraft(state, draftId, now = Date.now()) {
  const draft = state.drafts[draftId];
  if (!draft) return { state, error: 'That draft is no longer available.' };
  const error = validateDraft(draft);
  if (error) return { state, error };

  const id = uid('cmp');
  const campaigns = clone(state.campaigns);
  campaigns[id] = {
    id,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    description: draft.description.trim(),
    category: draft.category,
    organizerId: null,
    ownerId: draft.ownerId,
    source: 'user',
    status: 'active',
    goalAmount: Number(draft.goalAmount),
    baseRaised: 0,
    baseSupporters: 0,
    views: 0,
    location: draft.location.trim(),
    cover: draft.cover,
    gallery: draft.gallery && draft.gallery.length ? draft.gallery : draft.cover ? [draft.cover] : [],
    tags: splitTags(draft.tagsText),
    endDate: now + Number(draft.days) * 86400000,
    createdAt: now,
    updates: draft.updatesText
      ? [{ id: uid('up'), text: String(draft.updatesText).trim(), createdAt: now }]
      : [],
  };

  const drafts = clone(state.drafts);
  delete drafts[draftId];

  let next = { ...state, campaigns, drafts };
  next = pushActivity(next, {
    userId: draft.ownerId,
    kind: 'created',
    title: 'Your campaign is live',
    body: campaigns[id].title,
    campaignId: id,
    unread: true,
    createdAt: now,
  });
  return { state: next, campaign: campaigns[id], error: null };
}

export function saveDraftAsCampaign(state, draftId, now = Date.now()) {
  const draft = state.drafts[draftId];
  if (!draft) return { state, error: 'Nothing to save.' };
  const campaigns = clone(state.campaigns);
  const drafts = clone(state.drafts);
  const existing = Object.values(campaigns).find((c) => c.draftRef === draftId);
  const id = existing ? existing.id : uid('cmp');
  campaigns[id] = {
    ...(existing || {}),
    id,
    draftRef: draftId,
    title: draft.title || 'Untitled campaign',
    summary: draft.summary || '',
    description: draft.description || '',
    category: draft.category || 'Community',
    organizerId: null,
    ownerId: draft.ownerId,
    source: 'user',
    status: 'draft',
    goalAmount: Number(draft.goalAmount) || 0,
    baseRaised: 0,
    baseSupporters: 0,
    views: 0,
    location: draft.location || '',
    cover: draft.cover || null,
    gallery: draft.gallery || [],
    tags: splitTags(draft.tagsText),
    endDate: now + (Number(draft.days) || 30) * 86400000,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    updates: [],
  };
  delete drafts[draftId];
  return { state: { ...state, campaigns, drafts }, campaign: campaigns[id] };
}

export function addCampaignUpdate(state, campaignId, text, now = Date.now()) {
  const camp = state.campaigns[campaignId];
  if (!camp) return { state, error: 'Campaign not found.' };
  const value = String(text || '').trim();
  if (value.length < 5) return { state, error: 'Write at least 5 characters.' };
  const campaigns = clone(state.campaigns);
  campaigns[campaignId] = {
    ...camp,
    updates: [{ id: uid('up'), text: value, createdAt: now }, ...(camp.updates || [])],
  };
  let next = { ...state, campaigns };
  if (camp.ownerId) {
    next = pushActivity(next, {
      userId: camp.ownerId,
      kind: 'update',
      title: 'New update on ' + camp.title,
      body: '“' + value.slice(0, 60) + (value.length > 60 ? '…' : '') + '”',
      campaignId,
      unread: true,
      createdAt: now,
    });
  }
  return { state: next, error: null };
}

export function closeCampaign(state, campaignId, now = Date.now()) {
  const camp = state.campaigns[campaignId];
  if (!camp) return state;
  const campaigns = clone(state.campaigns);
  campaigns[campaignId] = { ...camp, status: 'completed', endDate: now };
  return { ...state, campaigns };
}

export function deleteCampaign(state, campaignId) {
  const campaigns = clone(state.campaigns);
  delete campaigns[campaignId];
  const saved = clone(state.saved);
  Object.keys(saved).forEach((k) => {
    saved[k] = saved[k].filter((id) => id !== campaignId);
  });
  return { ...state, campaigns, saved };
}

/* -------------------------------------------------------------------- save */

export function toggleSave(state, actor, campaignId, now = Date.now()) {
  const camp = state.campaigns[campaignId];
  if (!camp) return { state, error: 'Campaign not found.' };
  const saved = clone(state.saved);
  const list = [...(saved[actor] || [])];
  const idx = list.indexOf(campaignId);
  let isNowSaved;
  if (idx >= 0) {
    list.splice(idx, 1);
    isNowSaved = false;
  } else {
    list.unshift(campaignId); // guard against duplicate records
    isNowSaved = true;
  }
  saved[actor] = [...new Set(list)];
  let next = { ...state, saved };
  if (isNowSaved) {
    next = pushActivity(next, {
      userId: actor,
      kind: 'saved',
      title: 'Campaign saved for later',
      body: camp.title,
      campaignId,
      unread: true,
      createdAt: now,
    });
  }
  return { state: next, saved: isNowSaved, error: null };
}

/* ------------------------------------------------------------ contributions */

export function contribute(state, { actor, campaignId, amount, name, now = Date.now() }) {
  const camp = state.campaigns[campaignId];
  if (!camp) return { state, error: 'Campaign not found.' };
  const error = validateContribution(amount, camp);
  if (error) return { state, error };

  const value = Math.round(Number(amount));
  const id = uid('cn');
  const contributions = clone(state.contributions);
  contributions[id] = {
    id,
    userId: actor,
    campaignId,
    amount: value,
    createdAt: now,
    donorName: name || displayName(state, actor),
    donorAvatar: state.users[actor] ? state.users[actor].avatar || null : null,
    demo: true,
  };

  let next = { ...state, contributions };
  if (camp.ownerId && camp.ownerId !== actor) {
    next = pushActivity(next, {
      userId: camp.ownerId,
      kind: 'support',
      title: (name || 'A supporter') + ' supported your campaign',
      body: '₹' + value.toLocaleString('en-IN'),
      amount: value,
      campaignId,
      unread: true,
      createdAt: now,
    });
  }
  next = pushActivity(next, {
    userId: actor,
    kind: 'support_given',
    title: 'You supported ' + camp.title,
    body: '₹' + value.toLocaleString('en-IN') + ' · demo contribution',
    amount: value,
    campaignId,
    unread: true,
    createdAt: now,
  });
  return { state: next, contribution: contributions[id], error: null };
}

export function toggleLike(state, actor, campaignId, now = Date.now()) {
  const key = actor + ':' + campaignId;
  const likes = clone(state.likes);
  if (likes[key]) {
    delete likes[key];
    return { state: { ...state, likes }, liked: false };
  }
  likes[key] = { actor, campaignId, createdAt: now };
  return { state: { ...state, likes }, liked: true };
}

export function isLiked(state, actor, campaignId) {
  return !!state.likes[actor + ':' + campaignId];
}

export function toggleFollow(state, actor, organizerId) {
  if (!organizerId) return { state, following: false };
  const following = clone(state.following);
  const list = [...(following[actor] || [])];
  const idx = list.indexOf(organizerId);
  if (idx >= 0) {
    list.splice(idx, 1);
    following[actor] = list;
    return { state: { ...state, following }, following: false };
  }
  following[actor] = [organizerId, ...list];
  return { state: { ...state, following }, following: true };
}

export function isFollowing(state, actor, organizerId) {
  return (state.following[actor] || []).includes(organizerId);
}

/* ------------------------------------------------------------------ profile */

export function updateProfile(state, userId, patch, now = Date.now()) {
  const base = userId === GUEST_ID ? null : state.users[userId];
  if (!base) return { state, error: 'Please sign in to edit your profile.' };
  const merged = { ...base, ...patch };
  const error = validateProfile(merged);
  if (error) return { state, error };
  const users = clone(state.users);
  users[userId] = {
    ...merged,
    name: merged.name.trim(),
    bio: String(merged.bio || '').trim(),
    location: String(merged.location || '').trim(),
  };
  let next = { ...state, users };
  next = pushActivity(next, {
    userId,
    kind: 'profile',
    title: 'Profile updated',
    body: 'Your profile details were saved.',
    unread: true,
    createdAt: now,
  });
  return { state: next, user: users[userId], error: null };
}

export function updatePrefs(state, patch) {
  return { ...state, prefs: { ...state.prefs, ...patch } };
}

export function changePassword(state, userId, current, nextPassword) {
  const user = state.users[userId];
  if (!user) return { state, error: 'Please sign in first.' };
  if (user.password && user.password !== current) return { state, error: 'Your current password is incorrect.' };
  if (!nextPassword || nextPassword.length < 8) return { state, error: 'New password must be at least 8 characters.' };
  const users = clone(state.users);
  users[userId] = { ...user, password: nextPassword };
  return { state: { ...state, users }, error: null };
}

/* ----------------------------------------------------------------- activity */

export function pushActivity(state, item) {
  const activity = clone(state.activity);
  const id = item.id || uid('ac');
  const muted = !!(state.prefs && state.prefs.notifications === false);
  activity[id] = {
    id,
    createdAt: Date.now(),
    ...item,
    // Events are always recorded; the preference only decides whether one is
    // raised as unread.
    unread: !!item.unread && !muted,
  };
  return { ...state, activity };
}

export function markActivityRead(state, id) {
  const item = state.activity[id];
  if (!item) return state;
  const activity = clone(state.activity);
  activity[id] = { ...item, unread: false };
  return { ...state, activity };
}

export function markAllActivityRead(state, userId) {
  const activity = clone(state.activity);
  Object.values(activity).forEach((a) => {
    if (a.userId === userId) activity[a.id] = { ...a, unread: false };
  });
  return { ...state, activity };
}

export function clearActivity(state, userId) {
  const activity = {};
  Object.values(state.activity).forEach((a) => {
    if (a.userId !== userId) activity[a.id] = a;
  });
  return { ...state, activity };
}

/* --------------------------------------------------------------- reset/demo */

export function resetDemoData(state, now = Date.now()) {
  const fresh = initialState(now);
  return { ...fresh, prefs: state.prefs, sessionUserId: null };
}

export function hasDemoAccount(state) {
  return !!Object.values(state.users).find((u) => u.username === 'daemanas12');
}
