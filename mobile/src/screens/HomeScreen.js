// Home — updated landing feed matching the reference design layout precisely.
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../store/AppStore";
import { useGate } from "../navigation/gate";
import { C, CATEGORY_COLORS, compact, money } from "../theme/theme";
import { CATEGORIES } from "../store/seed";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/SmartImage";
import { SmartImage } from "../components/SmartImage";
import { Logo } from "../components/BrandLogo";
import {
  GradButton,
  IconButton,
  Pill,
  Progress,
  Screen,
  SoftButton,
  T,
} from "../components/ui";

export default function HomeScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNow(Date.now());
    setTimeout(() => setRefreshing(false), 420);
  }, []);

  const all = useMemo(() => app.selectors.filter({ now }), [app, now]);
  const list = useMemo(
    () => app.selectors.filter({ category, query, sort, now }),
    [app, category, query, sort, now],
  );
  // const unread = app.selectors.unread();
  const drafts = app.selectors.drafts();
  const unread = app.selectors.unread();

  const open = useCallback(
    (id) => navigation.navigate("Detail", { id }),
    [navigation],
  );
  const save = useCallback((id) => app.toggleSave(id), [app]);

  return (
    <Screen bg="#F7F7FD">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.purple}
            colors={[C.purple]}
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <Logo />
          <View style={styles.headerRight}>
            <IconButton
              icon="bell-outline"
              badge={unread}
              bg="#fff"
              border
              onPress={() => navigation.navigate("Activity")}
            />
            <Pressable
              style={styles.avatarBtn}
              onPress={() => navigation.navigate("Profile")}
            >
              <Avatar
                source={app.user ? app.user.avatar : null}
                name={app.user ? app.user.name : "Guest"}
                size={42}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCard}>
          <SmartImage
            source={
              list[0]?.cover ||
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
            }
            category="Environment"
            resizeMode="cover"
            style={styles.heroImage}
          />

          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <T w={700} s={8.5} color="#fff" style={{ letterSpacing: 0.8 }}>
                FEATURED CAMPAIGN
              </T>
            </View>

            <T
              w={800}
              s={18}
              color="#fff"
              style={{ marginTop: 6, lineHeight: 24 }}
            >
              Discover What{"\n"}Can{" "}
              <T w={800} s={18} color="#C4A8FF">
                Change
              </T>
            </T>

            <T
              w={400}
              s={10.5}
              color="rgba(255,255,255,0.9)"
              style={{ marginTop: 4, width: "80%", lineHeight: 15 }}
            >
              Support meaningful campaigns and help them reach more people.
            </T>

            <Pressable
              style={styles.heroBtn}
              onPress={() => navigation.navigate("Explore")}
            >
              <T w={700} s={10.5} color="#fff">
                Explore campaigns
              </T>
              <View style={styles.heroBtnIcon}>
                <Icon name="arrow-right" size={11} color={C.purple} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Explore by Cause Section */}
        <SectionHeader
          title="Explore by Cause"
          onPress={() => navigation.navigate("Explore")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 18 }}
        >
          {CATEGORIES.map((cat) => {
            const catMeta =
              CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.Community;
            const active = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(active ? "All" : cat.id)}
                style={[styles.causeCard, active && styles.causeCardActive]}
              >
                <View
                  style={[styles.causeIconBg, { backgroundColor: catMeta.bg }]}
                >
                  <Icon name={cat.icon} size={18} color={catMeta.fg} />
                </View>
                <T w={700} s={10} color={C.ink} style={{ marginTop: 6 }}>
                  {cat.label}
                </T>
                {/* <T w={400} s={10} color={C.muted} style={{ marginTop: 1 }}>
                  {cat.subtitle || "Better futures"}
                </T> */}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Impact Pulse Dashboard Widget */}
        <View style={styles.pulseCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View style={styles.pulseIconBg}>
                <Icon name="chart-timeline-variant" size={15} color="#fff" />
              </View>
              <View style={{ marginLeft: 8, flex: 1 }}>
                <T w={800} s={14} color={C.ink} numberOfLines={1}>
                  Impact Pulse
                </T>
                <T w={400} s={10.5} color={C.muted} numberOfLines={1}>
                  Together, we're making a difference.
                </T>
              </View>
            </View>
            {/* <View style={styles.timeDropdown}>
              <T w={600} s={10.5} color={C.inkSoft}>
                This week
              </T>
              <Icon
                name="chevron-down"
                size={12}
                color={C.muted}
                style={{ marginLeft: 3 }}
              />
            </View> */}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <View style={styles.pulseStatBox}>
              <View style={styles.statMiniIcon}>
                <Icon name="account-group" size={13} color={C.purple} />
              </View>
              <T w={500} s={10} color={C.muted} style={{ marginTop: 3 }}>
                People reached
              </T>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 1,
                }}
              >
                <T w={800} s={14} color={C.ink}>
                  48,560
                </T>
                <View style={styles.growthBadge}>
                  <T w={700} s={9} color={C.green}>
                    +32%
                  </T>
                </View>
              </View>
            </View>

            <View style={[styles.pulseStatBox, { marginLeft: 8 }]}>
              <View style={styles.statMiniIcon}>
                <Icon name="rocket-launch" size={13} color={C.purple} />
              </View>
              <T w={500} s={10} color={C.muted} style={{ marginTop: 3 }}>
                Campaigns momentum
              </T>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 1,
                }}
              >
                <T w={800} s={14} color={C.ink}>
                  18
                </T>
                <View style={styles.growthBadge}>
                  <T w={700} s={9} color={C.green}>
                    +50%
                  </T>
                </View>
              </View>
            </View>

            {/* Mini Bar Chart graphic */}
            {/* <View style={styles.barChartContainer}>
              <View style={[styles.bar, { height: 10 }]} />
              <View style={[styles.bar, { height: 18 }]} />
              <View style={[styles.bar, { height: 14 }]} />
              <View style={[styles.bar, { height: 24 }]} />
              <View
                style={[styles.bar, { height: 32, backgroundColor: C.purple }]}
              />
            </View> */}
          </View>
        </View>

        {/* Near You Section */}
        <View style={styles.nearCard}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon name="map-marker" size={16} color={C.purple} />
              <T w={800} s={14} color={C.ink} style={{ marginLeft: 5 }}>
                Near You
              </T>
            </View>
            <T w={400} s={11} color={C.muted} style={{ marginTop: 2 }}>
              Local initiatives. Real impact.
            </T>
            <SoftButton
              label="View map"
              icon="arrow-right"
              style={styles.mapBtn}
              textStyle={{ fontSize: 11 }}
              onPress={() => navigation.navigate("Explore")}
            />
          </View>

          <View style={styles.localHighlight}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon name="map-marker-radius" size={13} color={C.purple} />
              <T
                w={700}
                s={11}
                color={C.ink}
                style={{ marginLeft: 3 }}
                numberOfLines={1}
              >
                Rural Education
              </T>
            </View>
            <T w={400} s={10} color={C.muted} style={{ marginTop: 1 }}>
              West Bengal
            </T>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 5,
              }}
            >
              <View style={styles.avatarStack}>
                <View
                  style={[styles.miniFace, { backgroundColor: "#C4B5FD" }]}
                />
                <View
                  style={[
                    styles.miniFace,
                    { backgroundColor: "#A7F3D0", marginLeft: -5 },
                  ]}
                />
                <View
                  style={[
                    styles.miniFace,
                    { backgroundColor: "#FDE68A", marginLeft: -5 },
                  ]}
                />
              </View>
              <T w={600} s={9.5} color={C.muted} style={{ marginLeft: 5 }}>
                +12
              </T>
            </View>
          </View>
        </View>

        {/* Campaigns Worth a Closer Look Grid */}
        <SectionHeader
          title="Campaigns worth a closer look"
          onPress={() => navigation.navigate("Explore")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 18 }}
        >
          {list.map((c) => {
            const cat =
              CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Community;
            const isSaved = app.selectors.isSaved(c.id);
            return (
              <Pressable
                key={c.id}
                style={styles.closerCard}
                onPress={() => open(c.id)}
              >
                <View style={styles.closerImageWrap}>
                  <SmartImage
                    source={c.cover}
                    category={c.category}
                    resizeMode="cover"
                    style={styles.fullImage}
                  />
                  <View style={styles.closerCatPill}>
                    <Pill
                      label={c.category}
                      icon={cat.icon}
                      fg={cat.fg}
                      bg="#fff"
                      size={9.5}
                    />
                  </View>
                  <Pressable
                    style={styles.closerBookmark}
                    onPress={() => save(c.id)}
                  >
                    <Icon
                      name={isSaved ? "bookmark" : "bookmark-outline"}
                      size={13}
                      color="#fff"
                    />
                  </Pressable>
                </View>

                <View style={{ padding: 10 }}>
                  <T w={800} s={13} color={C.ink} numberOfLines={1}>
                    {c.title}
                  </T>

                  <T
                    w={400}
                    s={10.5}
                    color={C.muted}
                    numberOfLines={1}
                    style={{ marginTop: 2 }}
                  >
                    {c.summary}
                  </T>

                  <Progress
                    percent={c.percent}
                    height={3.5}
                    style={{ marginTop: 8 }}
                  />

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Icon
                        name="account-group-outline"
                        size={11}
                        color={C.mutedLight}
                      />
                      <T
                        w={600}
                        s={10}
                        color={C.inkSoft}
                        style={{ marginLeft: 3 }}
                      >
                        {compact(c.supporters)} supporters
                      </T>
                    </View>
                    <T w={700} s={10.5} color={C.purple}>
                      {c.percent}%
                    </T>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Proof of Impact Trust Banner */}
        <View style={styles.proofCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon name="shield-check-outline" size={16} color={C.purple} />
            <T w={800} s={13.5} color={C.ink} style={{ marginLeft: 5 }}>
              Proof of Impact
            </T>
          </View>
          <T w={400} s={10.5} color={C.muted} style={{ marginTop: 1 }}>
            Real actions. Measurable change.
          </T>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <ProofItem title="1.2M+" desc="Total Reach" />
            <ProofItem title="420+" desc="Campaigns" />
            <ProofItem title="Verified" desc="Trusted & Safe" />
            <ProofItem title="100+" desc="Communities" />
          </View>
        </View>

        {/* Share & Campaign Action Card */}

        {/* Share & Campaign Action Card */}
        <View style={styles.actionCard}>
          <T w={800} s={13} color="#FFFFFF">
            Help a campaign travel further
          </T>

          <T
            w={400}
            s={10}
            color="rgba(255,255,255,0.72)"
            style={{ marginTop: 3, lineHeight: 15 }}
          >
            Share, support, and amplify the change.
          </T>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              gap: 8,
              flexDirection: "space-between",
            }}
          >
            <SoftButton
              label="Share reach"
              icon="share-variant"
              style={{
                flex: 0,
                backgroundColor: "#FFFFFF",
                paddingVertical: 7,
                borderRadius: 9,
                minHeight: 32,
                width: "45%",
              }}
              textStyle={{
                color: "#6548E8",
                fontSize: 10,
                fontWeight: "700",
              }}
            />

            <GradButton
              label="Start campaign"
              icon="plus"
              style={{
                // flex: 1,
                // paddingVertical: 10,

                // paddingHorizontal: 1,
                borderRadius: 9,
                // minHeight: 3,
                // minWidth: "50%",
                // minHeight: 32,
                overflow: "hidden",
              }}
              textStyle={{
                fontSize: 6,
                fontWeight: "700",
              }}
              onPress={gate.openCreate}
            />
          </View>
          
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ---------------------------------------------------------------- helpers */

function SectionHeader({ title, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <T w={800} s={15} color={C.ink}>
        {title}
      </T>
      <Pressable
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <T w={700} s={11.5} color={C.purple}>
          See all
        </T>
        <Icon
          name="arrow-right"
          size={12}
          color={C.purple}
          style={{ marginLeft: 2 }}
        />
      </Pressable>
    </View>
  );
}

function ProofItem({ title, desc }) {
  return (
    <View style={{ alignItems: "center" }}>
      <T w={800} s={12.5} color={C.ink}>
        {title}
      </T>
      <T w={500} s={9.5} color={C.muted} style={{ marginTop: 1 }}>
        {desc}
      </T>
    </View>
  );
}

/* ---------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 35 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    width: "100%",
    height: 185,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
    backgroundColor: "#E9E5F7",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,18,40,0.55)",
    padding: 14,
    justifyContent: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  heroBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  causeCard: {
    width: 98,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  causeCardActive: { borderColor: C.purple, backgroundColor: C.purpleSoft },
  causeIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  pulseIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  timeDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F0FC",
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  pulseStatBox: {
    flex: 1,
    backgroundColor: "#F8F7FC",
    padding: 8,
    borderRadius: 10,
  },
  statMiniIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  growthBadge: {
    backgroundColor: "#DCF5E7",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 5,
  },
  barChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 35,
    gap: 3.5,
    marginLeft: 8,
  },
  bar: { width: 5, backgroundColor: "#DED5FF", borderRadius: 2.5 },
  nearCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  mapBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  localHighlight: {
    backgroundColor: "#F3F0FC",
    padding: 9,
    borderRadius: 10,
    width: 122,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  miniFace: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#fff",
  },
  closerCard: {
    width: 195,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  closerImageWrap: {
    width: "100%",
    height: 160,
    position: "relative",
    backgroundColor: "#E9E5F7",
  },
  closerCatPill: { position: "absolute", top: 6, left: 6 },
  closerBookmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  proofCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  actionCard: {
    backgroundColor: "#141228",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  closerCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  closerImageWrap: {
    width: "100%",
    height: 115,
    position: "relative",
    backgroundColor: "#E9E5F7",
    overflow: "hidden",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },

  heroCard: {
    width: "100%",
    height: 180, // পারফেক্ট কার্ড হাইট
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
    backgroundColor: "#1E1035",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 8, 28, 0.55)", // ডার্ক ট্রান্সপারেন্ট লেয়ার - জাতে টেক্সট একদম স্পষ্ট ফুট ওঠে
    padding: 14,
    justifyContent: "center",
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: C.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  heroBtnIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  heroCard: {
    width: "100%",
    height: 175,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
    backgroundColor: "#1E1035", // ফলব্যাক কালার
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 8, 28, 0.5)", // ব্যাকগ্রাউন্ড ডার্ক শেড
    padding: 14,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarBtn: {
    borderRadius: 21,
    overflow: "hidden",
  },

  actionCard: {
    backgroundColor: "#151D38",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
});
