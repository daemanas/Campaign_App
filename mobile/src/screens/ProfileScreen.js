// Profile: identity, record-derived statistics, and the campaigns the current
// actor has created, supported or saved. Every number here is computed from
// stored records — none of it is hardcoded.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Share,
  ScrollView,
  StatusBar,
  StyleSheet,
  Pressable,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../store/AppStore";
import { useGate } from "../navigation/gate";
import { C, compact } from "../theme/theme";
import { Icon } from "../components/Icon";
import { Avatar, SmartImage } from "../components/SmartImage";
import {
  Card,
  Empty,
  GradButton,
  IconButton,
  Screen,
  SoftButton,
  T,
} from "../components/ui";

const TABS = [
  { id: "campaigns", label: "My Campaigns" },
  { id: "supported", label: "Supported" },
  { id: "saved", label: "Saved" },
];

export default function ProfileScreen({ navigation, route }) {
  const app = useApp();
  const gate = useGate();
  const [tab, setTab] = useState(route.params?.tab || "campaigns");

  useEffect(() => {
    if (route.params?.tab) setTab(route.params.tab);
  }, [route.params?.tab]);
  const [now, setNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      StatusBar.setBarStyle("light-content");
      return () => StatusBar.setBarStyle("dark-content");
    }, []),
  );

  const user = app.user;
  const stats = app.selectors.stats();
  const saved = app.selectors.saved(now);
  const supported = app.selectors.supported(now);
  const mine = useMemo(
    () => app.selectors.mine().map((c) => app.selectors.view(c, now)),
    [app, now],
  );
  const followingIds = Object.keys(app.state.following[app.actor] || {}).length
    ? app.state.following[app.actor]
    : [];

  const achievements = useMemo(() => buildAchievements(stats), [stats]);

  const editProfile = () => {
    if (!app.isAuthed && !gate.requireAuth({ kind: "editProfile" })) return;
    navigation.navigate("EditProfile");
  };
  const share = () => {
    const name = user ? user.name : "Your profile";
    const handle =
      user && user.username ? "https://amplifyreach.org/@" + user.username : "";
    return Share.share({
      title: name,
      message: `${name} on Amplify — Campaign Reach. ${handle}`.trim(),
    }).catch(() => {});
  };

  // Helper function: Render campaigns as a professional image grid
  const renderCampaignGrid = (items, emptyTitle, emptyBody) => {
    if (!items || !items.length) {
      return (
        <Empty
          icon="rocket-launch-outline"
          title={emptyTitle}
          body={emptyBody}
          action="Explore"
          onAction={() => navigation.navigate("Tabs", { screen: "Explore" })}
        />
      );
    }

    return (
      <View style={styles.gridContainer}>
        {items.map((c) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [
              styles.gridCard,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => navigation.navigate("Detail", { id: c.id })}
          >
            <SmartImage
              source={c.cover}
              category={c.category}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <View style={styles.gridOverlay}>
              <Pressable style={styles.gridDotsBtn} hitSlop={8}>
                <Icon name="dots-horizontal" size={14} color="#fff" />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Screen bg={C.bg} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ------------------------------------------------------------- Banner */}
        <View style={styles.banner}>
          {user?.banner ? (
            <SmartImage
              source={user.banner}
              category="Community"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={styles.bannerFade} />
          <View style={styles.bannerRow}>
            <View style={{ flex: 1 }} />
            <IconButton
              icon="pencil-outline"
              bg="rgba(20,18,40,0.35)"
              color="#fff"
              onPress={editProfile}
            />
            <IconButton
              icon="share-variant"
              bg="rgba(20,18,40,0.35)"
              color="#fff"
              onPress={share}
            />
            <IconButton
              icon="cog-outline"
              bg="rgba(20,18,40,0.35)"
              color="#fff"
              onPress={() => navigation.navigate("Settings")}
            />
          </View>
        </View>

        <View style={styles.body}>
          {/* Avatar and Action button */}
          <View style={styles.avatarRow}>
            <Avatar
              source={user ? user.avatar : null}
              name={user ? user.name : "Guest"}
              size={88}
              ring
            />
            <View style={{ flex: 1 }} />
            {/* {user ? (
              <SoftButton
                label="Edit profile"
                icon="pencil-outline"
                onPress={editProfile}
              />
            ) : (
              <SoftButton
                label="Sign in"
                icon="login"
                onPress={() => gate.requireAuth({ kind: "editProfile" })}
              />
            )} */}
          </View>

          {/* User Info (Left-aligned as per reference image) */}
          <View style={styles.userInfoSection}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <T w={800} s={21} color={C.ink}>
                {user ? user.name : "Browsing as guest"}
              </T>
              {user && user.verified ? (
                <View style={styles.verified}>
                  <Icon name="check-bold" size={11} color="#fff" />
                </View>
              ) : null}
            </View>

            <T w={500} s={12.5} color={C.mutedLight} style={{ marginTop: 2 }}>
              @{(user && user.username) || "guest"}
            </T>

            {user?.bio ? (
              <View style={styles.bioContainer}>
                <View style={styles.bioBar} />
                <T w={400} s={12.5} color={C.muted} style={styles.bioText}>
                  {user.bio}
                </T>
              </View>
            ) : null}

            {/* Meta Row: Location and Joined Date */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Icon name="map-marker-outline" size={12} color={C.purpleDeep} />
                <T w={500} s={11.5} color={C.inkSoft} style={{ marginLeft: 4 }}>
                  {user ? user.location || "Location not set" : "Anywhere"}
                </T>
              </View>
              <View style={styles.metaChip}>
                <Icon
                  name="calendar-blank-outline"
                  size={12}
                  color={C.purpleDeep}
                />
                <T w={500} s={11.5} color={C.inkSoft} style={{ marginLeft: 4 }}>
                  Joined {user ? joinedLabel(user.joinedAt) : "today"}
                </T>
              </View>
            </View>
          </View>

          {/* ----------------------------------------------------------- Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              {/* Created */}
              <Pressable
                onPress={() => setTab("campaigns")}
                style={({ pressed }) => [
                  styles.statItem,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <T w={700} s={16} color={C.ink}>
                  {stats.created}
                </T>
                <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
                  Created
                </T>
              </Pressable>

              <View style={styles.vDiv} />

              {/* Supported */}
              <Pressable
                onPress={() => setTab("supported")}
                style={({ pressed }) => [
                  styles.statItem,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <T w={700} s={16} color={C.ink}>
                  {stats.supportedCampaigns}
                </T>
                <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
                  Supported
                </T>
              </Pressable>

              <View style={styles.vDiv} />

              {/* Followers */}
              <View style={styles.statItem}>
                <T w={700} s={16} color={C.ink}>
                  {compact(stats.followers)}
                </T>
                <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
                  Followers
                </T>
              </View>

              <View style={styles.vDiv} />

              {/* Following */}
              <View style={styles.statItem}>
                <T w={700} s={16} color={C.ink}>
                  {followingIds.length}
                </T>
                <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
                  Following
                </T>
              </View>
            </View>
          </Card>

          {/* ------------------------------------------------------------ Tabs */}
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const on = t.id === tab;
              const count =
                t.id === "campaigns"
                  ? mine.length
                  : t.id === "supported"
                    ? supported.length
                    : saved.length;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={({ pressed }) => [
                    styles.tab,
                    on && styles.tabOn,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <T w={700} s={12.5} color={on ? "#fff" : C.muted}>
                    {t.label}
                  </T>
                  {/* <T
                    w={700}
                    s={10}
                    color={on ? C.purpleDeep : C.mutedLight}
                    style={[styles.tabCount, on && { backgroundColor: "#fff" }]}
                  >
                    {count}
                  </T> */}
                </Pressable>
              );
            })}
          </View>

          {/* Section Header with "View all" */}
          <View style={styles.sectionHeader}>
            <T w={800} s={17} color={C.ink}>
              {tab === "campaigns"
                ? "My Campaigns"
                : tab === "supported"
                  ? "Supported"
                  : "Saved"}
            </T>
            <Pressable
              onPress={() =>
                navigation.navigate(
                  tab === "campaigns"
                    ? "MyCampaigns"
                    : tab === "saved"
                      ? "Saved"
                      : "Tabs",
                  { screen: "Explore" }
                )
              }
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <T w={700} s={12.5} color={C.purpleDeep} style={{ marginRight: 3 }}>
                View all
              </T>
              <Icon name="arrow-right" size={14} color={C.purpleDeep} />
            </Pressable>
          </View>

          {/* Grid Layout of Campaigns */}
          <View style={{ marginTop: 10 }}>
            {tab === "campaigns" &&
              renderCampaignGrid(
                mine,
                "No campaigns yet",
                "Your published campaigns appear here."
              )}

            {tab === "supported" &&
              renderCampaignGrid(
                supported,
                "Nothing supported yet",
                "Supported campaigns will show up here."
              )}

            {tab === "saved" &&
              renderCampaignGrid(
                saved,
                "No saved campaigns",
                "Saved campaigns will appear here."
              )}
          </View>

          {/* --------------------------------------------------- Achievements */}
          <View style={{ marginTop: 22 }}>
            <T w={800} s={16} color={C.ink} style={{ marginBottom: 10 }}>
              Achievements
            </T>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            >
              {achievements.map((a) => (
                <View
                  key={a.label}
                  style={[styles.badge, a.earned && styles.badgeEarned]}
                >
                  <View
                    style={[
                      styles.badgeIcon,
                      a.earned ? styles.badgeIconOn : null,
                    ]}
                  >
                    <Icon
                      name={a.icon}
                      size={18}
                      color={a.earned ? C.purpleDeep : "#B9B6C9"}
                    />
                  </View>
                  <T
                    w={700}
                    s={12}
                    color={a.earned ? C.ink : C.mutedLight}
                    style={{ marginTop: 6, textAlign: "center" }}
                    numberOfLines={1}
                  >
                    {a.label}
                  </T>
                  <T
                    w={400}
                    s={10.5}
                    color={C.muted}
                    style={{
                      marginTop: 2,
                      textAlign: "center",
                      lineHeight: 14,
                    }}
                    numberOfLines={2}
                  >
                    {a.hint}
                  </T>
                </View>
              ))}
            </ScrollView>
          </View>

          {!user ? (
            <View style={{ marginTop: 20 }}>
              <GradButton
                label="Sign in or create an account"
                icon="login"
                arrow
                onPress={() => gate.requireAuth({ kind: "create" })}
              />
            </View>
          ) : (
            // <View style={{ flexDirection: "row", marginTop: 20, gap: 10, height: 55 }}>
            //   <SoftButton
            //     label="Settings"
            //     icon="cog-outline"
            //     style={{ flex: 1 }}
            //     onPress={() => navigation.navigate("Settings")}
            //   />
            //   <SoftButton
            //     label="Activity"
            //     icon="bell-outline"
            //     style={{ flex: 1 }}
            //     onPress={() =>
            //       navigation.navigate("Tabs", { screen: "Activity" })
            //     }
            //   />
            // </View>
            null)
          }
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Helpers */

function joinedLabel(ts) {
  if (!ts) return "today";
  return new Date(Number(ts)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function buildAchievements(stats) {
  return [
    {
      icon: "rocket-launch-outline",
      label: "First campaign",
      hint: stats.created >= 1 ? "Published" : "Publish a campaign",
      earned: stats.created >= 1,
    },
    {
      icon: "hand-heart-outline",
      label: "First support",
      hint: stats.contributions >= 1 ? "Contributed" : "Support a campaign",
      earned: stats.contributions >= 1,
    },
    {
      icon: "bookmark-outline",
      label: "Curator",
      hint: stats.saved >= 3 ? `${stats.saved} saved` : "Save 3 campaigns",
      earned: stats.saved >= 3,
    },
    {
      icon: "certificate-outline",
      label: "Goal helper",
      hint:
        stats.totalContributed >= 5000
          ? `Given`
          : "Give ₹5,000",
      earned: stats.totalContributed >= 5000,
    },
    {
      icon: "account-group-outline",
      label: "Community",
      hint: stats.following >= 1 ? "Following" : "Follow an organizer",
      earned: stats.following >= 1,
    },
  ];
}

const styles = StyleSheet.create({
  banner: { height: 180, backgroundColor: "#2D1B69", position: "relative" },
  bannerFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(23,21,45,0.28)",
  },
  bannerRow: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  body: { paddingHorizontal: 16, marginTop: -42 },
  avatarRow: { flexDirection: "row", alignItems: "flex-end" },
  verified: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  userInfoSection: {
    marginTop: 10,
    alignItems: "flex-start",
  },
  bioContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 8,
  },
  bioBar: {
    width: 3,
    backgroundColor: C.purpleDeep,
    borderRadius: 2,
    marginRight: 8,
  },
  bioText: {
    lineHeight: 18,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.purpleTint,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statsCard: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vDiv: {
    width: 1,
    height: 32,
    backgroundColor: "#F1F0F5",
  },
  tabs: { flexDirection: "row", gap: 8, marginTop: 18 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F2F1F8",
    gap: 5,
  },
  tabOn: { backgroundColor: "#6C5CE7" },
  tabCount: {
    minWidth: 18,
    textAlign: "center",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(107,78,255,0.14)",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 6,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridCard: {
    width: "31.5%",
    aspectRatio: 0.85, // Responsive height based on width
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E9E5F7",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  gridDotsBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    width: 118,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  badgeEarned: { borderColor: "#DDD3FF", backgroundColor: "#FBFAFF" },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F0F7",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconOn: { backgroundColor: C.purpleSoft },
});