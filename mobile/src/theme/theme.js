// Design tokens shared by every screen. Colours are sampled from the supplied
// UI/UX references so the app stays visually consistent.
export const C = {
  ink: '#17152D',
  inkSoft: '#2B2850',
  muted: '#73718A',
  mutedLight: '#9C9AB0',
  purple: '#6B4EFF',
  purpleDeep: '#5A3EF0',
  purpleSoft: '#F0EDFF',
  purpleTint: '#EFECFF',
  cyan: '#2DD4BF',
  bg: '#F7F7FB',
  surface: '#FFFFFF',
  border: '#ECEAF4',
  borderSoft: '#F0EFF6',
  green: '#159B67',
  red: '#E8465A',
  amber: '#F5A524',
  blue: '#3B82F6',
  white: '#FFFFFF',
  shadow: '#17152D',
};

export const GRADIENT = {
  from: '#7C5CFF',
  to: '#5A3EF0',
};

export const CATEGORY_COLORS = {
  Environment: { fg: '#12855A', bg: '#DCF5E7', icon: 'leaf' },
  Education: { fg: '#5A3EF0', bg: '#EDE8FF', icon: 'school' },
  Health: { fg: '#E03B57', bg: '#FFE5EA', icon: 'heart-pulse' },
  Animals: { fg: '#D9622B', bg: '#FFEBDD', icon: 'paw' },
  Community: { fg: '#2563C4', bg: '#E3EDFF', icon: 'account-group' },
};

export const R = { sm: 10, md: 14, lg: 18, xl: 22, xxl: 26, pill: 999 };

export const S = { xs: 6, sm: 10, md: 14, lg: 20, xl: 26, xxl: 34 };

// Android resolves an asset font by file name, so weights are separate families
// rather than a fontWeight value. See android/app/src/main/assets/fonts.
const FAMILY = {
  300: 'Poppins',
  400: 'Poppins',
  500: 'Poppins-Medium',
  600: 'Poppins-SemiBold',
  700: 'Poppins-Bold',
  800: 'Poppins-ExtraBold',
  900: 'Poppins-ExtraBold',
};

export function ff(weight = 400) {
  return FAMILY[Number(weight)] || FAMILY[Number(weight) >= 700 ? 800 : 400];
}

// Text shorthand: ff() must set the family and fontWeight must stay unset,
// otherwise Android looks for a `_bold` asset variant and falls back to Roboto.
export function txt(weight, size, color, extra) {
  return { fontFamily: ff(weight), fontSize: size, color, ...extra };
}

export const shadow = (elevation = 8, color = C.shadow, opacity = 0.1) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: elevation * 1.4,
  shadowOffset: { width: 0, height: Math.max(1, elevation / 2) },
  elevation,
});

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function money(n) {
  return '₹' + INR.format(Math.round(Number(n) || 0));
}

export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 10000000) return (v / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  if (v >= 100000) return (v / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(v));
}

export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || 0));
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + ' minute' + (m === 1 ? '' : 's') + ' ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' hour' + (h === 1 ? '' : 's') + ' ago';
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return d + ' days ago';
  const w = Math.floor(d / 7);
  if (w < 5) return w + ' week' + (w === 1 ? '' : 's') + ' ago';
  return new Date(Number(ts)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function dayBucket(ts) {
  const d = new Date(Number(ts || 0));
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  if (d.getTime() >= startOfToday) return 'Today';
  if (d.getTime() >= startOfYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
