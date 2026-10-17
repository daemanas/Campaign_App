import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { C, CATEGORY_COLORS, compact, money } from '../theme/theme';
import { Icon } from './Icon';
import { T, Progress, Pill } from './ui';
import { SmartImage, Avatar } from './SmartImage';

function catStyle(category) {
  return CATEGORY_COLORS[category] || { fg: C.purple, bg: C.purpleSoft, icon: 'shape-outline' };
}

function SupporterFaces({ count = 4 }) {
  const faces = [1, 2, 3, 4].slice(0, count);
  return (
    <View style={{ flexDirection: 'row' }}>
      {faces.map((i, idx) => (
        <Avatar
          key={i}
          name={['Priya Sharma', 'Rahul Das', 'Sneha Khan', 'Aman Verma'][idx]}
          source={[require('../assets/images/avatar_priya.jpg'), require('../assets/images/avatar_rahul.jpg'), require('../assets/images/avatar_sneha.jpg'), require('../assets/images/avatar_aman.jpg')][idx]}
          size={26}
          ring
          style={{ marginLeft: idx === 0 ? 0 : -8 }}
        />
      ))}
    </View>
  );
}

function SaveHeart({ saved, onPress, dark }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? 'rgba(23,21,45,0.55)' : '#F3F2F9',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Icon name={saved ? 'heart' : 'heart-outline'} size={17} color={saved ? C.red : dark ? '#fff' : C.purple} />
    </Pressable>
  );
}

function SaveBookmark({ saved, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Icon name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? C.purple : '#9A98AE'} />
    </Pressable>
  );
}

const shell = {
  backgroundColor: '#fff',
  borderRadius: 22,
  borderWidth: 1,
  borderColor: '#EFEDF5',
  overflow: 'hidden',
};

/**
 * variant:
 *  - featured : Home hero card, image with overlay text
 *  - overlay  : Explore lead card, image then overlapping title block
 *  - row      : Saved / profile card with 3-up stat strip
 *  - compact  : horizontal list card
 */
export function CampaignCard({
  c,
  variant = 'compact',
  onPress,
  saved,
  onSave,
  onMenu,
  showSupporters = true,
  style,
}) {

  if (!c) return null;
  const cat = catStyle(c.category);
  const pct = Math.max(0, Math.min(100, Number(c.percent) || 0));

  if (variant === 'featured' || variant === 'overlay') {
    const featured = variant === 'featured';
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ ...shell, marginBottom: 16, opacity: pressed ? 0.96 : 1 }, style]}>
        <View style={{ height: featured ? 250 : 200, backgroundColor: '#E9E5F7' }}>
          <SmartImage source={c.cover} category={c.category} style={StyleSheet.absoluteFill} />
          {featured ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, backgroundColor: 'rgba(12,10,30,0.42)' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96, backgroundColor: 'rgba(12,10,30,0.5)' }} />
            </View>
          ) : null}
          <View style={{ position: 'absolute', left: 14, bottom: featured ? 92 : 14 }}>
            <Pill label={c.category} icon={cat.icon} fg={featured ? '#fff' : cat.fg} bg={featured ? 'rgba(21,120,80,0.85)' : cat.bg} size={11} />
          </View>
          <View style={{ position: 'absolute', right: 12, top: 12 }}>
            <SaveHeart saved={saved} onPress={onSave} dark />
          </View>
          {featured ? (
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
              <T w={800} s={23} color="#fff" numberOfLines={2} style={{ letterSpacing: -0.4 }}>
                {c.title}
              </T>
              <T w={400} s={13} color="rgba(255,255,255,0.88)" numberOfLines={2} style={{ marginTop: 6, lineHeight: 19 }}>
                {c.summary}
              </T>
            </View>
          ) : null}
        </View>

        {featured ? (
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Progress percent={pct} style={{ flex: 1 }} />
              <T w={800} s={12} color={C.ink}>{pct}%</T>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
              <T w={500} s={13} color={C.muted}>
                <T w={800} s={16} color={C.purple}>{money(c.raisedAmount)}</T> raised
              </T>
              <T w={500} s={12.5} color={C.muted}>of {money(c.goalAmount)}</T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
              <SupporterFaces />
              <T w={500} s={13} color={C.muted} style={{ marginLeft: 10, flex: 1 }}>
                {compact(c.supporters)} supporters
              </T>
              <SaveBookmark saved={saved} onPress={onSave} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: -26, marginHorizontal: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 }}>
            <T w={800} s={18} color={C.ink} numberOfLines={2} style={{ letterSpacing: -0.3 }}>
              {c.title}
            </T>
            <T w={400} s={13} color={C.muted} numberOfLines={2} style={{ marginTop: 5, lineHeight: 19 }}>
              {c.summary}
            </T>
            <Progress percent={pct} style={{ marginTop: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 9 }}>
              <T w={500} s={13} color={C.muted}>
                <T w={800} s={15} color={C.purple}>{money(c.raisedAmount)}</T> raised
              </T>
              <T w={500} s={12.5} color={C.muted}>of {money(c.goalAmount)}</T>
            </View>
            {showSupporters ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <SupporterFaces />
                <T w={500} s={13} color={C.muted} style={{ marginLeft: 10, flex: 1 }}>
                  {compact(c.supporters)} supporters
                </T>
                <SaveBookmark saved={saved} onPress={onSave} />
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
    );
  }

  if (variant === 'row') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ ...shell, marginBottom: 14, opacity: pressed ? 0.96 : 1 }, style]}>
        <View style={{ flexDirection: 'row', padding: 12 }}>
          <View style={{ width: 104, height: 104, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E9E5F7' }}>
            <SmartImage source={c.cover} category={c.category} style={StyleSheet.absoluteFill} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Pill label={c.category} icon={cat.icon} fg={cat.fg} bg={cat.bg} />
              <View style={{ flex: 1 }} />
              <SaveBookmark saved={saved} onPress={onSave} />
            </View>
            <T w={800} s={15.5} color={C.ink} numberOfLines={2} style={{ marginTop: 7, letterSpacing: -0.2 }}>
              {c.title}
            </T>
            <T w={400} s={12.5} color={C.muted} numberOfLines={2} style={{ marginTop: 4, lineHeight: 18 }}>
              {c.summary}
            </T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6 }}>
          <Progress percent={pct} style={{ flex: 1 }} />
          <T w={800} s={12} color={C.ink} style={{ marginLeft: 10 }}>{pct}%</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6 }}>
          <View style={{ flex: 1.1 }}>
            <T w={500} s={12} color={C.muted}>
              <T w={800} s={14} color={C.purple}>{money(c.raisedAmount)}</T> raised
            </T>
          </View>
          <View style={{ flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.borderSoft, paddingHorizontal: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="account-group-outline" size={13} color={C.mutedLight} style={{ marginRight: 5 }} />
              <T w={500} s={12} color={C.muted}>{compact(c.supporters)} supporters</T>
            </View>
          </View>
          <View style={{ flex: 1, paddingLeft: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="clock-outline" size={13} color={C.mutedLight} style={{ marginRight: 5 }} />
            <T w={500} s={12} color={C.muted}>{c.daysLeft} days left</T>
          </View>
        </View>
      </Pressable>
    );
  }

  // compact horizontal card
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ ...shell, marginBottom: 14, opacity: pressed ? 0.96 : 1 }, style]}>
      <View style={{ flexDirection: 'row', padding: 12 }}>
        <View style={{ width: 108, height: 118, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E9E5F7' }}>
          <SmartImage source={c.cover} category={c.category} style={StyleSheet.absoluteFill} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Pill label={c.category} icon={cat.icon} fg={cat.fg} bg={cat.bg} />
            <View style={{ flex: 1 }} />
            <SaveHeart saved={saved} onPress={onSave} />
          </View>
          <T w={800} s={15.5} color={C.ink} numberOfLines={2} style={{ marginTop: 7, letterSpacing: -0.2 }}>
            {c.title}
          </T>
          <T w={400} s={12.5} color={C.muted} numberOfLines={2} style={{ marginTop: 4, lineHeight: 18 }}>
            {c.summary}
          </T>
          <Progress percent={pct} style={{ marginTop: 9 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 7 }}>
            <T w={500} s={12.5} color={C.muted}>
              <T w={800} s={14} color={C.purple}>{money(c.raisedAmount)}</T> raised
            </T>
            <T w={500} s={12} color={C.muted}>of {money(c.goalAmount)}</T>
          </View>
          {showSupporters ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 9 }}>
              <SupporterFaces count={3} />
              <T w={500} s={12} color={C.muted} style={{ marginLeft: 8, flex: 1 }}>
                {compact(c.supporters)} supporters
              </T>
              {onMenu ? (
                <Pressable onPress={onMenu} hitSlop={8}>
                  <Icon name="dots-vertical" size={18} color="#9A98AE" />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
