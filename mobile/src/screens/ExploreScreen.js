// Explore — full-text search, category filter and sort, all working without an
// account. Results are read straight from the store on every render.
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../store/AppStore";
import { useGate } from "../navigation/gate";
import { C, CATEGORY_COLORS, compact, timeAgo } from "../theme/theme";
import { CATEGORIES } from "../store/seed";
import { SORTS } from "../store/logic";
import { Icon } from "../components/Icon";
import { SmartImage } from "../components/SmartImage";
import { Logo } from "../components/BrandLogo";
import { Chip, Empty, IconButton, Pill, Screen, T } from "../components/ui";

export default function ExploreScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("popular");

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const list = useMemo(
    () => app.selectors.filter({ category, query, sort, now }),
    [app, category, query, sort, now],
  );
  const unread = app.selectors.unread();

  const open = (id) => navigation.navigate("Detail", { id });

  return (
    <Screen bg={C.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setNow(Date.now());
              setTimeout(() => setRefreshing(false), 400);
            }}
            tintColor={C.purple}
            colors={[C.purple]}
          />
        }
      >
        <View style={styles.header}>
          <Logo />
          <IconButton
            icon="bell-outline"
            badge={unread}
            bg="#fff"
            border
            onPress={() => navigation.navigate("Activity")}
          />
        </View>

        <T w={800} s={20} color={C.ink} style={{ letterSpacing: -0.6 }}>
          Discover campaigns and causes
        </T>
        <T
          w={400}
          s={10}
          color={C.muted}
          style={{ marginTop: 3, marginBottom: 14 }}
        >
          Search campaigns, causes and organizers open to everyone.
        </T>

        <View style={styles.searchRow}>
          <Icon name="magnify" size={18} color={C.mutedLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search campaigns and causes…"
            placeholderTextColor="#9C9AB0"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Icon name="close-circle" size={16} color={C.mutedLight} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
        >
          <Chip
            label="All"
            icon="apps"
            active={category === "All"}
            onPress={() => setCategory("All")}
            style={styles.chipGap}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              icon={c.icon}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
              style={styles.chipGap}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sorts}
        >
          {SORTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSort(s.id)}
              style={({ pressed }) => [
                styles.sortPill,
                sort === s.id && styles.sortOn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Icon
                name={SORT_ICONS[s.id]}
                size={13}
                color={sort === s.id ? "#fff" : C.muted}
                style={{ marginRight: 5 }}
              />
              <T w={700} s={12} color={sort === s.id ? "#fff" : C.muted}>
                {s.label}
              </T>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.countRow}>
          <T w={700} s={13} color={C.ink}>
            {list.length} {list.length === 1 ? "campaign" : "campaigns"} found
          </T>
          {(category !== "All" || query || sort !== "popular") && (
            <Pressable
              onPress={() => {
                setCategory("All");
                setQuery("");
                setSort("popular");
              }}
              hitSlop={8}
              style={styles.clear}
            >
              <Icon name="filter-remove" size={13} color={C.purple} />
              <T w={700} s={12} color={C.purple} style={{ marginLeft: 3 }}>
                Clear
              </T>
            </Pressable>
          )}
        </View>

        {list.length === 0 ? (
          <Empty
            icon="magnify"
            title="No campaigns found"
            body={
              query
                ? "Nothing matches “" +
                  query.trim() +
                  "”. Try a different word or clear the filters."
                : "No live campaigns in this category yet."
            }
            action="Start a campaign"
            onAction={gate.openCreate}
          />
        ) : (
          list.map((item) => {
            const cat =
              CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Community;
            const saved = app.selectors.isSaved(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => open(item.id)}
                style={({ pressed }) => [
                  styles.newsCard,
                  pressed && { opacity: 0.95 },
                ]}
              >
                {/* Top Image Container with proper contain/fit mode */}
                <View style={styles.imageWrapper}>
                  <SmartImage
                    source={item.cover}
                    category={item.category}
                    resizeMode="cover"
                    style={styles.cardImage}
                  />

                  <Pressable
                    onPress={() => app.toggleSave(item.id)}
                    hitSlop={10}
                    style={styles.bookmarkBadge}
                  >
                    <Icon
                      name={saved ? "bookmark" : "bookmark-outline"}
                      size={15}
                      color="#fff"
                    />
                  </Pressable>
                </View>

                {/* Overlapped White Container */}
                <View style={styles.cardContent}>
                  {/* Category Pill overlapping on top-left */}
                  <View style={styles.categoryPillWrapper}>
                    <Pill
                      label={item.category}
                      icon={cat.icon}
                      fg={cat.fg || C.purple}
                      bg={cat.bg || C.purpleSoft}
                      size={11}
                    />
                  </View>

                  {/* Title & Summary */}
                  <T
                    w={800}
                    s={15.5}
                    color={C.ink}
                    numberOfLines={1}
                    style={styles.cardTitle}
                  >
                    {item.title}
                  </T>

                  <T
                    w={400}
                    s={12}
                    color={C.muted}
                    numberOfLines={2}
                    style={styles.cardSummary}
                  >
                    {item.summary || item.description}
                  </T>

                  {/* Footer: Organizer & Stats (Likes / Comments) */}
                  <View style={styles.cardFooter}>
                    <View style={styles.organizerInfo}>
                      <View style={styles.orgAvatarBg}>
                        <Icon name="star-four-points" size={11} color="#fff" />
                      </View>
                      <T
                        w={600}
                        s={11.5}
                        color={C.inkSoft}
                        numberOfLines={1}
                        style={{ marginLeft: 5 }}
                      >
                        {item.organizer?.name || "Amplify Newsroom"}
                      </T>
                      <T
                        w={400}
                        s={11}
                        color={C.mutedLight}
                        style={{ marginLeft: 3 }}
                      >
                        · {timeAgo(item.createdAt || Date.now())}
                      </T>
                    </View>

                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Icon name="heart" size={13} color="#EF4444" />
                        <T
                          w500
                          s={11}
                          color={C.inkSoft}
                          style={{ marginLeft: 3 }}
                        >
                          {compact(item.likes || item.supporters || 1100)}
                        </T>
                      </View>
                      <View style={[styles.statItem, { marginLeft: 10 }]}>
                        <Icon
                          name="comment-outline"
                          size={13}
                          color={C.mutedLight}
                        />
                        <T
                          w={500}
                          s={11}
                          color={C.inkSoft}
                          style={{ marginLeft: 3 }}
                        >
                          {compact(item.comments || 86)}
                        </T>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const SORT_ICONS = {
  popular: "fire",
  newest: "creation",
  ending: "timer",
  progress: "chart-line",
  amount: "currency-inr",
};

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: C.ink,
    marginLeft: 8,
    paddingVertical: 0,
  },
  chips: { marginBottom: 10 },
  chipGap: { marginRight: 6 },
  sorts: { marginBottom: 14 },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 6,
  },
  sortOn: { backgroundColor: C.purple, borderColor: C.purple },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  clear: { flexDirection: "row", alignItems: "center" },

  // News Card Exact Design Styles with full image visibility
  newsCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFF6",
  },
  imageWrapper: {
    width: "100%",
    height: 200, // Adjusted height to showcase full image dimensions clearly
    backgroundColor: "#E9E5F7",
    position: "relative",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  bookmarkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(20, 18, 40, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  cardContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -16,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    position: "relative",
  },
  categoryPillWrapper: {
    position: "absolute",
    top: -12,
    left: 14,
    zIndex: 3,
  },
  cardTitle: {
    letterSpacing: -0.3,
  },
  cardSummary: {
    marginTop: 3,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  orgAvatarBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
