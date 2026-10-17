// The one data layer every screen reads from. Wraps the pure functions in
// logic.js with React state and writes each change back to AsyncStorage.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as L from './logic';
import { GUEST_ID } from './seed';
import {
  clearAllData,
  flushState,
  loadImageCache,
  loadState,
  persistState,
  putImage,
  removeImage,
  resolveImage,
} from './persistence';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(null);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(null);
  stateRef.current = state;

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadImageCache();
      const { state: loaded } = await loadState();
      if (!alive) return;
      setState(loaded);
      setReady(true);
    })();
    return () => {
      alive = false;
      flushState();
    };
  }, []);

  useEffect(() => {
    if (state) persistState(state);
  }, [state]);

  useEffect(() => {
    const onHide = () => flushState();
    if (typeof global !== 'undefined') global.__amplifyFlush = onHide;
    return () => {
      if (typeof global !== 'undefined') delete global.__amplifyFlush;
    };
  }, []);

  // Runs a pure logic function, keeps the newest state, and returns its result.
  // Logic functions either return the next state or { state, error }; both work.
  const run = useCallback((fn) => {
    const current = stateRef.current;
    if (!current) return { error: 'Data is still loading.' };
    const out = fn(current);
    const wrapped = !!out && typeof out === 'object' && 'state' in out;
    const next = wrapped ? out.state : out;
    if (next && next !== current) {
      stateRef.current = next;
      setState(next);
    }
    return wrapped ? out : { state: next };
  }, []);

  // Wipes this app's stored records and re-seeds the demo dataset.
  const resetDemoData = useCallback(async () => {
    await clearAllData();
    const fresh = L.initialState(Date.now());
    stateRef.current = fresh;
    setState(fresh);
    return fresh;
  }, []);

  const value = useMemo(() => {
    if (!ready || !state) return { ready: false };
    const actor = state.sessionUserId || GUEST_ID;
    const user = state.sessionUserId ? state.users[state.sessionUserId] || null : null;

    return {
      ready: true,
      state,
      user,
      actor,
      isAuthed: !!state.sessionUserId,

      /* auth */
      login: (input) => run((s) => L.login(s, input)),
      register: (input) => run((s) => L.register(s, input)),
      logout: () => run((s) => L.logout(s)),
      changePassword: (current, next) => run((s) => L.changePassword(s, s.sessionUserId, current, next)),

      /* campaigns */
      newDraft: () => L.emptyDraft(actor),
      saveDraftProgress: (draft) => run((s) => L.upsertDraft(s, draft)),
      discardDraft: (id) => run((s) => L.discardDraft(s, id)),
      publishDraft: (id) => run((s) => L.publishDraft(s, id)),
      keepAsDraftCampaign: (id) => run((s) => L.saveDraftAsCampaign(s, id)),
      addUpdate: (campaignId, text) => run((s) => L.addCampaignUpdate(s, campaignId, text)),
      closeCampaign: (id) => run((s) => L.closeCampaign(s, id)),
      deleteCampaign: (id) => run((s) => L.deleteCampaign(s, id)),

      /* engagement */
      toggleSave: (campaignId) => run((s) => L.toggleSave(s, s.sessionUserId || GUEST_ID, campaignId)),
      contribute: ({ campaignId, amount, name }) =>
        run((s) => L.contribute(s, { actor: s.sessionUserId || GUEST_ID, campaignId, amount, name })),
      toggleLike: (campaignId) => run((s) => L.toggleLike(s, s.sessionUserId || GUEST_ID, campaignId)),
      toggleFollow: (organizerId) => run((s) => L.toggleFollow(s, s.sessionUserId || GUEST_ID, organizerId)),

      /* profile + settings */
      updateProfile: (patch) => run((s) => L.updateProfile(s, s.sessionUserId || GUEST_ID, patch)),
      updatePrefs: (patch) => run((s) => L.updatePrefs(s, patch)),
      resetDemoData,
      markRead: (id) => run((s) => L.markActivityRead(s, id)),
      markAllRead: () => run((s) => L.markAllActivityRead(s, s.sessionUserId || GUEST_ID)),
      clearActivity: () => run((s) => L.clearActivity(s, s.sessionUserId || GUEST_ID)),

      /* images */
      putImage,
      resolveImage,
      removeImage,

      /* selectors */
      selectors: {
        campaignView: (id, now) => L.getCampaignView(state, id, now),
        view: (c, now) => L.campaignView(state, c, now),
        filter: (opts) => L.filterCampaigns(state, opts),
        saved: (now) => L.savedCampaigns(state, actor, now),
        supported: (now) => L.supportedCampaigns(state, actor, now),
        contributions: (now) => L.contributionsOf(state, actor, now),
        mine: (userId) => L.myCampaigns(state, userId || actor),
        drafts: () => L.draftsFor(state, actor),
        stats: (userId) => L.statsFor(state, userId || actor),
        activity: (filter, now) => L.activityFeed(state, actor, filter, now),
        unread: () => L.unreadCount(state, actor),
        isSaved: (id) => L.isSaved(state, actor, id),
        isFollowing: (organizerId) => L.isFollowing(state, actor, organizerId),
        isLiked: (id) => L.isLiked(state, actor, id),
        organizer: (c) => L.organizerOf(state, c),
        name: (id) => L.displayName(state, id),
      },
    };
  }, [state, ready, run]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export const logic = L;
export { GUEST_ID };
