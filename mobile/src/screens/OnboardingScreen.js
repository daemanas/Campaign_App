import React, { useRef, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { C } from '../theme/theme';
import { Icon } from '../components/Icon';
import { T } from '../components/ui';
import { LogoMark } from '../components/BrandLogo';
import { Images } from '../assets/images';

const W = Dimensions.get('window').width;

const PAGES = [
  {
    line1: 'Ideas deserve',
    line2: 'to travel.',
    body: 'Discover social campaigns, contribute and create real change together.',
    pills: [
      { label: 'Environment', icon: 'leaf', fg: '#8CE6B8', bg: 'rgba(23,120,80,0.62)', top: 296, left: 20 },
      { label: 'Education', icon: 'school', fg: '#E4DBFF', bg: 'rgba(90,62,240,0.66)', top: 284, left: 150 },
      { label: 'Health', icon: 'heart', fg: '#FFD3DD', bg: 'rgba(190,45,80,0.60)', top: 296, right: 20 },
      { label: 'Animals', icon: 'paw', fg: '#FFE7B8', bg: 'rgba(170,110,20,0.58)', top: 366, left: 44 },
      { label: 'Community', icon: 'account-group', fg: '#D6E7FF', bg: 'rgba(40,80,180,0.58)', top: 360, right: 24 },
    ],
  },
  {
    line1: 'Find a cause',
    line2: 'worth backing.',
    body: 'Browse organisers, follow their progress and see exactly where the funds go.',
    pills: [
      { label: 'Live updates', icon: 'bell-outline', fg: '#E4DBFF', bg: 'rgba(90,62,240,0.66)', top: 306, left: 30 },
      { label: 'Transparent goals', icon: 'shield-check-outline', fg: '#8CE6B8', bg: 'rgba(23,120,80,0.62)', top: 372, right: 26 },
    ],
  },
  {
    line1: 'Start something',
    line2: 'of your own.',
    body: 'Publish a campaign in three short steps — cover photo, goal, and the story behind it.',
    pills: [
      { label: 'Three steps', icon: 'format-list-numbered', fg: '#FFE7B8', bg: 'rgba(170,110,20,0.58)', top: 310, left: 36 },
      { label: 'Save drafts', icon: 'content-save-outline', fg: '#D6E7FF', bg: 'rgba(40,80,180,0.58)', top: 376, right: 32 },
    ],
  },
  {
    line1: 'Every rupee',
    line2: 'amplifies.',
    body: 'Support, save and share campaigns you believe in. Browsing is open — no account needed.',
    pills: [{ label: 'Browse freely', icon: 'magnify', fg: '#E4DBFF', bg: 'rgba(90,62,240,0.66)', top: 314, left: 44 }],
  },
];

export default function OnboardingScreen({ navigation, onFinish }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const last = index === PAGES.length - 1;

  const done = () => {
    if (onFinish) return onFinish();
    navigation.navigate('Tabs');
  };

  const goTo = (i) => {
    const next = Math.max(0, Math.min(PAGES.length - 1, i));
    setIndex(next);
    if (ref.current) ref.current.scrollTo({ x: next * W, animated: true });
  };

  return (
    <View style={styles.root}>
      <Image source={Images.onboardingHero} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1.15, backgroundColor: 'rgba(18,20,72,0.86)' }} />
        <View style={{ flex: 0.55, backgroundColor: 'rgba(30,26,96,0.44)' }} />
        <View style={{ flex: 0.9, backgroundColor: 'rgba(12,10,40,0.30)' }} />
      </View>

      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={done} hitSlop={12} style={styles.skip}>
          <T w={600} s={13} color="rgba(255,255,255,0.9)">
            Skip
          </T>
        </Pressable>
      </View>

      <View style={styles.brand}>
        <LogoMark size={74} radius={24} />
        <T w={800} s={27} color="#fff" style={{ letterSpacing: 6, marginTop: 18 }}>
          AMPLIFY
        </T>
        <T w={500} s={10.5} color="rgba(255,255,255,0.72)" style={{ letterSpacing: 4.5, marginTop: 4 }}>
          CAMPAIGN REACH
        </T>
      </View>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={{ width: W, paddingHorizontal: 30, minHeight: 470 }}>
            <T w={800} s={33} color="#fff" style={{ textAlign: 'center', letterSpacing: -0.8, marginTop: 24 }}>
              {p.line1}
            </T>
            <T w={800} s={33} color="#B9A4FF" style={{ textAlign: 'center', letterSpacing: -0.8, marginTop: 2 }}>
              {p.line2}
            </T>
            <T w={400} s={15} color="rgba(255,255,255,0.84)" style={{ textAlign: 'center', marginTop: 15, lineHeight: 23 }}>
              {p.body}
            </T>
            {p.pills.map((pill, k) => (
              <View
                key={k}
                style={[
                  styles.pill,
                  { backgroundColor: pill.bg },
                  { top: pill.top },
                  pill.left != null ? { left: pill.left } : null,
                  pill.right != null ? { right: pill.right } : null,
                ]}
              >
                <Icon name={pill.icon} size={15} color={pill.fg} style={{ marginRight: 7 }} />
                <T w={600} s={13} color={pill.fg}>
                  {pill.label}
                </T>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {PAGES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={9} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => (last ? done() : goTo(index + 1))}
          style={({ pressed }) => [styles.next, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Icon name={last ? 'check' : 'arrow-right'} size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12144A' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 14, paddingHorizontal: 20 },
  skip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20 },
  brand: { alignItems: 'center', marginTop: 30, marginBottom: 12 },
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26, paddingBottom: 40, paddingTop: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)', marginRight: 7 },
  dotOn: { width: 26, backgroundColor: '#8B6BFF' },
  next: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4EFF',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
