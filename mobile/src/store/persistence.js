// AsyncStorage access for the whole app. The state document is written back on
// a short debounce so rapid typing in the create flow does not thrash disk.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState } from './logic';

const STATE_KEY = 'amplify.state.v1';
const IMG_PREFIX = 'amplify.img.';
const SEEN_KEY = 'amplify.first_run.v1';

export const IMG_SCHEME = 'img://';

export function isImgRef(ref) {
  return typeof ref === 'string' && ref.startsWith(IMG_SCHEME);
}

export function imgKey(ref) {
  return String(ref).slice(IMG_SCHEME.length);
}

const imageCache = new Map();

// A picked photo is stored under its own key so the main state document stays
// small, and survives an app restart as a plain data URI.
export async function putImage(base64OrDataUri) {
  const key = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const value = String(base64OrDataUri).startsWith('data:')
    ? base64OrDataUri
    : 'data:image/jpeg;base64,' + base64OrDataUri;
  imageCache.set(key, value);
  try {
    await AsyncStorage.setItem(IMG_PREFIX + key, value);
  } catch (e) {
    imageCache.delete(key);
    throw new Error('Could not save the image locally. Try a smaller photo.');
  }
  return IMG_SCHEME + key;
}

export async function resolveImage(ref) {
  if (!isImgRef(ref)) return ref;
  const key = imgKey(ref);
  if (imageCache.has(key)) return imageCache.get(key);
  try {
    const value = await AsyncStorage.getItem(IMG_PREFIX + key);
    if (value) {
      imageCache.set(key, value);
      return value;
    }
  } catch (e) {
    /* fall through */
  }
  return null;
}

export async function removeImage(ref) {
  if (!isImgRef(ref)) return;
  const key = imgKey(ref);
  imageCache.delete(key);
  try {
    await AsyncStorage.removeItem(IMG_PREFIX + key);
  } catch (e) {
    /* best effort */
  }
}

export async function loadImageCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imgKeys = (keys || []).filter((k) => typeof k === 'string' && k.startsWith(IMG_PREFIX));
    if (!imgKeys.length) return;
    const pairs = await AsyncStorage.multiGet(imgKeys);
    (pairs || []).forEach(([k, v]) => {
      if (v) imageCache.set(k.slice(IMG_PREFIX.length), v);
    });
  } catch (e) {
    /* cache warm-up is optional */
  }
}

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return { state: initialState(), fresh: true };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || !parsed.campaigns) return { state: initialState(), fresh: true };
    const base = initialState(parsed.seededAt || Date.now());
    // Fill in any key a newer build adds, without touching stored user records.
    const merged = { ...base, ...parsed };
    ['users', 'organizers', 'drafts', 'contributions', 'activity', 'likes', 'following'].forEach((k) => {
      merged[k] = { ...base[k], ...(parsed[k] || {}) };
    });
    // The stored document owns the campaign list outright: seeding it back in
    // would bring campaigns the user deleted straight back on every launch.
    merged.campaigns = parsed.campaigns;
    merged.saved = { ...base.saved, ...(parsed.saved || {}) };
    merged.prefs = { ...base.prefs, ...(parsed.prefs || {}) };
    return { state: merged, fresh: false };
  } catch (e) {
    return { state: initialState(), fresh: true };
  }
}

let timer = null;
let queued = null;

export function persistState(state) {
  queued = state;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flushState, 220);
}

export async function flushState() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queued) return;
  const payload = queued;
  queued = null;
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(payload));
  } catch (e) {
    queued = payload;
  }
}

export async function clearAllData() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  queued = null;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = (keys || []).filter((k) => typeof k === 'string' && (k === STATE_KEY || k.startsWith(IMG_PREFIX)));
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch (e) {
    /* nothing else to try */
  }
  imageCache.clear();
}

export async function markSeen() {
  try {
    const seen = await AsyncStorage.getItem(SEEN_KEY);
    if (!seen) {
      await AsyncStorage.setItem(SEEN_KEY, '1');
      return false;
    }
  } catch (e) {
    return true;
  }
  return true;
}
