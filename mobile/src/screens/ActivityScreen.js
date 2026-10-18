// Activity feed. Every row is a record the store wrote when something actually
// happened — campaign created, saved, contribution completed, profile updated —
// grouped into Today / Yesterday / This week / Earlier buckets. The Support and
// My activity tabs list campaigns instead of events, both read from the same
// derived campaign view.
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Pressable,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp, logic } from "../store/AppStore";
import { C, CATEGORY_COLORS, compact, money } from "../theme/theme";
import { Icon } from "../components/Icon";
import { Avatar, SmartImage } from "../components/SmartImage";
import { Logo } from "../components/BrandLogo";
import { useGate } from "../navigation/gate";
import {
  Card,
  Chip,
  Empty,
  IconButton,
  Pill,
  Progress,
  Screen,
  T,
} from "../components/ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "support", label: "Support" },
  { id: "updates", label: "My activity" },
  { id: "mentions", label: "Mentions" },
  { id: "community", label: "Community" },
];

const KIND_STYLE = {
  support: { icon: "hand-heart", color: C.green, bg: "#E4F7EE" },
  support_given: { icon: "currency-inr", color: C.green, bg: "#E4F7EE" },
  created: { icon: "rocket-launch", color: C.purpleDeep, bg: C.purpleSoft },
  update: { icon: "bullhorn", color: C.blue, bg: "#E6EFFC" },
  saved: { icon: "bookmark", color: C.purpleDeep, bg: C.purpleSoft },
  profile: { icon: "account-edit", color: C.amber, bg: "#FFF3D9" },
  follow: { icon: "account-plus", color: C.purpleDeep, bg: C.purpleSoft },
  like: { icon: "heart", color: C.red, bg: "#FFE5EA" },
  comment: { icon: "comment-text", color: C.blue, bg: "#E6EFFC" },
  mention: { icon: "at", color: C.purpleDeep, bg: C.purpleSoft },
  views: { icon: "eye", color: C.muted, bg: "#F0EFF6" },
};

const styleFor = (kind) => KIND_STYLE[kind] || KIND_STYLE.views;

// Driven by campaign.status only — a campaign is never labelled something the
// record does not say.
const STATUS = {
  active: {
    label: "Active",
    fg: C.green,
    bg: "#E4F7EE",
    icon: "rocket-launch",
  },
  completed: {
    label: "Completed",
    fg: C.purpleDeep,
    bg: C.purpleSoft,
    icon: "check-circle",
  },
  pending: {
    label: "Pending",
    fg: C.amber,
    bg: "#FFF3D9",
    icon: "progress-clock",
  },
};

const statusFor = (c) =>
  STATUS[c.status] || {
    label: String(c.status || "pending").replace(/^./, (s) => s.toUpperCase()),
    fg: C.muted,
    bg: "#F0EFF6",
    icon: "progress-clock",
  };

const catFor = (category) =>
  CATEGORY_COLORS[category] || {
    fg: C.purple,
    bg: C.purpleSoft,
    icon: "shape-outline",
  };

/**
 * One supported or created campaign as a list card: cover, title, organizer,
 * goal, amount raised, live percentage with a progress bar, and a footer that
 * states what the viewer's own relation to the campaign is.
 */
function CampaignRow({ c, foot, pill, onPress }) {
  const goal = Number(c.goalAmount || 0);
  const pct = Math.max(0, Math.min(100, Number(c.percent) || 0));
  const organizer = c.organizer && c.organizer.name ? c.organizer : null;
  return (
    <Card style={styles.cCard} onPress={onPress}>
      <View style={styles.cTop}>
        <View style={styles.cThumb}>
          <SmartImage
            source={c.cover}
            category={c.category}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {pill}
            <View style={{ flex: 1 }} />
            <Icon
              name="chevron-right"
              size={18}
              color={C.mutedLight}
              style={{ marginTop: 2 }}
            />
          </View>
          <T
            w={800}
            s={15}
            color={C.ink}
            numberOfLines={2}
            style={{ marginTop: 7, lineHeight: 20, letterSpacing: -0.2 }}
          >
            {c.title}
          </T>
          {organizer ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <Avatar
                source={organizer.avatar}
                name={organizer.name}
                size={20}
              />
              <T
                w={400}
                s={12}
                color={C.muted}
                numberOfLines={1}
                style={{ marginLeft: 6, flex: 1 }}
              >
                by {organizer.name}
              </T>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
      >
        <Progress percent={pct} style={{ flex: 1 }} />
        <T
          w={800}
          s={12}
          color={C.ink}
          style={{ width: 46, textAlign: "right", marginLeft: 10 }}
        >
          {goal > 0 ? pct + "%" : "—"}
        </T>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 7,
        }}
      >
        <T w={500} s={12.5} color={C.muted}>
          <T w={800} s={14} color={C.purple}>
            {money(c.raisedAmount || 0)}
          </T>{" "}
          raised
        </T>
        <T w={500} s={12} color={C.muted}>
          {goal > 0 ? "of " + money(goal) : "No goal set"}
        </T>
      </View>

      {foot ? (
        <View style={styles.cFoot}>
          <Icon name={foot.icon} size={13} color={foot.color || C.purpleDeep} />
          <T
            w={600}
            s={12}
            color={C.inkSoft}
            style={{ marginLeft: 6, flex: 1 }}
            numberOfLines={2}
          >
            {foot.text}
          </T>
          {foot.right ? (
            <T w={700} s={12} color={C.muted} style={{ marginLeft: 8 }}>
              {foot.right}
            </T>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function ActivityScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const items = useMemo(
    () => app.selectors.activity(filter, now),
    [app, filter, now],
  );
  const groups = useMemo(() => logic.groupByBucket(items), [items]);
  const unread = app.selectors.unread();

  // Support and My activity show campaigns, so they read campaign records
  // through the same derived view the rest of the app uses.
  const gifts = useMemo(() => {
    const map = {};
    app.selectors.contributions(now).forEach((r) => {
      const e =
        map[r.campaignId] ||
        (map[r.campaignId] = { total: 0, count: 0, last: 0 });
      e.total += Number(r.amount || 0);
      e.count += 1;
      const at = Number(r.createdAt || 0);
      if (!e.last || at > e.last) e.last = at;
    });
    return map;
  }, [app, now]);

  const supportedList = useMemo(
    () =>
      app.selectors
        .supported(now)
        .sort(
          (a, b) =>
            ((gifts[b.id] || {}).last || 0) - ((gifts[a.id] || {}).last || 0),
        ),
    [app, now, gifts],
  );

  const createdList = useMemo(
    () =>
      app.selectors
        .mine()
        .map((c) => app.selectors.view(c, now))
        .filter(Boolean),
    [app, now],
  );

  const giftCounts = useMemo(() => {
    const map = {};
    Object.values(app.state.contributions).forEach((r) => {
      map[r.campaignId] = (map[r.campaignId] || 0) + 1;
    });
    return map;
  }, [app]);

  const isListTab = filter === "support" || filter === "updates";

  const open = (item) => {
    app.markRead(item.id);
    if (item.campaignId) navigation.navigate("Detail", { id: item.campaignId });
  };

  return (
    <Screen bg={C.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setNow(Date.now());
              setTimeout(() => setRefreshing(false), 350);
            }}
            tintColor={C.purple}
            colors={[C.purple]}
          />
        }
      >
        <View style={styles.topRow}>
          <Logo />
          <IconButton
            icon="tray-full"
            onPress={() => app.markAllRead()}
            badge={unread}
          />
        </View>

        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <T w={800} s={20} color={C.ink}>
              Activity
            </T>
            <T
              w={400}
              s={10}
              color={C.muted}
              style={{ marginTop: 4, lineHeight: 19 }}
            >
              Stay updated with your campaigns and community.
            </T>
          </View>
          {unread ? (
            <Pressable
              onPress={() => app.markAllRead()}
              hitSlop={6}
              style={styles.readBtn}
            >
              <Icon name="check-all" size={14} color={C.purpleDeep} />
              <T w={700} s={12} color={C.purpleDeep} style={{ marginLeft: 5 }}>
                Mark all
              </T>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </ScrollView>

        {isListTab ? (
          filter === "support" ? (
            <SupportList
              items={supportedList}
              gifts={gifts}
              now={now}
              onOpen={(id) => navigation.navigate("Detail", { id })}
              onBrowse={() =>
                navigation.navigate("Tabs", { screen: "Explore" })
              }
            />
          ) : (
            <MyActivityList
              items={createdList}
              counts={giftCounts}
              isAuthed={app.isAuthed}
              onOpen={(id) => navigation.navigate("Detail", { id })}
              onCreate={() => gate.openCreate()}
              onSignIn={() => navigation.navigate("Auth", { mode: "login" })}
            />
          )
        ) : groups.length ? (
          groups.map((g) => (
            <View key={g.bucket} style={{ marginTop: 20 }}>
              <T
                w={700}
                s={12.5}
                color={C.mutedLight}
                style={{ marginBottom: 8, letterSpacing: 0.4 }}
              >
                {g.bucket.toUpperCase()}
              </T>
              <Card style={{ paddingVertical: 4, paddingHorizontal: 10 }}>
                {g.items.map((item, i) => (
                  <View key={item.id}>
                    {i ? <View style={styles.rowDivider} /> : null}
                    <Pressable
                      onPress={() => open(item)}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && { opacity: 0.96 },
                      ]}
                    >
                      
                      {item.avatar ? (
                        <View>
                          <Avatar
                            source={item.avatar}
                            name={item.title.split(" ").slice(0, 2).join(" ")}
                            size={40}
                          />
                          {item.verified ? (
                            <View style={styles.verifyDot}>
                              <Icon name="check-bold" size={9} color="#fff" />
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.kindIcon,
                            { backgroundColor: styleFor(item.kind).bg },
                          ]}
                        >
                          <Icon
                            name={styleFor(item.kind).icon}
                            size={18}
                            color={styleFor(item.kind).color}
                          />
                        </View>
                      )
                      }



                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                          }}
                        >
                          <T
                            w={item.unread ? 700 : 600}
                            s={13.5}
                            color={C.ink}
                            style={{ flex: 1 }}
                          >
                            {item.title}
                          </T>
                          {item.unread ? (
                            <View style={styles.unreadDot} />
                          ) : null}
                        </View>
                        {item.body ? (
                          <T
                            w={400}
                            s={12.5}
                            color={C.muted}
                            numberOfLines={2}
                            style={{ marginTop: 3, lineHeight: 18 }}
                          >
                            {item.kind === "support" ||
                            item.kind === "support_given"
                              ? money(Number(item.amount || 0)) + " · "
                              : ""}
                            {item.body}
                          </T>
                        ) : null}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 6,
                          }}
                        >
                          <Icon
                            name="clock-outline"
                            size={12}
                            color={C.mutedLight}
                          />
                          <T
                            w={500}
                            s={11.5}
                            color={C.mutedLight}
                            style={{ marginLeft: 4 }}
                          >
                            {item.age}
                          </T>
                          {item.campaignTitle ? (
                            <T
                              w={500}
                              s={11.5}
                              color={C.purpleDeep}
                              numberOfLines={1}
                              style={{ marginLeft: 10, flex: 1 }}
                            >
                              {item.campaignTitle}
                            </T>
                          ) : null}
                        </View>
                      </View>

                      {item.campaignId ? (
                        <View style={styles.thumb}>
                          <SmartImage
                            source={item.cover}
                            category={item.category}
                            resizeMode="cover"
                            style={{ width: "100%", height: "100%" }}
                          />
                        </View>
                      ) : null}
                      {item.campaignId ? (
                        <Icon
                          name="chevron-right"
                          size={17}
                          color={C.mutedLight}
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </Pressable>
                  </View>
                ))}
              </Card>
            </View>
          ))
        ) : (
          <Empty
            icon="bell-off-outline"
            title="Nothing here yet"
            body={
              filter === "all"
                ? "Actions you take — saving, supporting, publishing — appear here as they happen."
                : "No activity in this category yet."
            }
            action="Browse campaigns"
            onAction={() => navigation.navigate("Tabs", { screen: "Explore" })}
          />
        )}

        {items.length > 2 && !isListTab ? (
          <Pressable
            onPress={() => app.clearActivity()}
            hitSlop={8}
            style={{ marginTop: 20, alignSelf: "center" }}
          >
            <T w={600} s={12.5} color={C.red}>
              Clear activity on this device
            </T>
          </Pressable>
        ) : null}

        <T
          w={400}
          s={11.5}
          color={C.mutedLight}
          style={{ marginTop: 18, textAlign: "center", lineHeight: 17 }}
        >
          Demo activity — stored locally so you can see the full flow without a
          server.
        </T>
      </ScrollView>
    </Screen>
  );
}

function SupportList({ items, gifts, now, onOpen, onBrowse }) {
  if (!items.length) {
    return (
      <Empty
        icon="hand-heart"
        title="No campaigns supported yet"
        body="Campaigns you back in the demo appear here with their goal, progress and the amount you gave."
        action="Find a campaign"
        onAction={onBrowse}
      />
    );
  }
  const total = items.reduce((s, c) => s + ((gifts[c.id] || {}).total || 0), 0);
  return (
    <View style={{ marginTop: 2 }}>
      <T w={700} s={12.5} color={C.mutedLight} style={styles.listLabel}>
        {"CAMPAIGNS I HAVE SUPPORTED · " + items.length}
      </T>
      <T
        w={400}
        s={12}
        color={C.muted}
        style={{ marginBottom: 12, lineHeight: 18 }}
      >
        {money(total)} contributed across these campaigns in this demo.
      </T>
      {items.map((c) => {
        const cat = catFor(c.category);
        const g = gifts[c.id] || {};
        const count = Number(g.count || 0);
        return (
          <CampaignRow
            key={c.id}
            c={c}
            onPress={() => onOpen(c.id)}
            pill={
              <Pill
                label={c.category}
                icon={cat.icon}
                fg={cat.fg}
                bg={cat.bg}
              />
            }
            foot={{
              icon: "currency-inr",
              color: C.green,
              text:
                "You gave " +
                money(g.total || 0) +
                " in " +
                count +
                " " +
                (count === 1 ? "demo contribution" : "demo contributions"),
              right: g.last ? logic.timeLabel(g.last, now) : null,
            }}
          />
        );
      })}
    </View>
  );
}

function MyActivityList({
  items,
  counts,
  isAuthed,
  onOpen,
  onCreate,
  onSignIn,
}) {
  if (!items.length) {
    return isAuthed ? (
      <Empty
        icon="rocket-launch-outline"
        title="No campaigns created yet"
        body="Campaigns you publish appear here with their status, goal and live progress."
        action="Create a campaign"
        onAction={onCreate}
      />
    ) : (
      <Empty
        icon="account-plus-outline"
        title="Sign in to see your campaigns"
        body="You are browsing as a guest. Campaigns you publish belong to your account and appear here after you sign in."
        action="Sign in"
        onAction={onSignIn}
      />
    );
  }
  const raised = items.reduce((s, c) => s + Number(c.raisedAmount || 0), 0);
  return (
    <View style={{ marginTop: 2 }}>
      <T w={700} s={12.5} color={C.mutedLight} style={styles.listLabel}>
        {"CAMPAIGNS I HAVE CREATED · " + items.length}
      </T>
      <T
        w={400}
        s={12}
        color={C.muted}
        style={{ marginBottom: 12, lineHeight: 18 }}
      >
        {money(raised)} raised across these campaigns so far.
      </T>
      {items.map((c) => {
        const st = statusFor(c);
        const count = Number(counts[c.id] || 0);
        return (
          <CampaignRow
            key={c.id}
            c={c}
            onPress={() => onOpen(c.id)}
            pill={
              <Pill label={st.label} icon={st.icon} fg={st.fg} bg={st.bg} />
            }
            foot={{
              icon: "account-group-outline",
              color: st.fg,
              text:
                compact(c.supporters || 0) +
                " supporters" +
                (count
                  ? " · " +
                    count +
                    " " +
                    (count === 1 ? "contribution" : "contributions")
                  : ""),
              right: c.daysLeft
                ? c.daysLeft + " days left"
                : st.label === "Completed"
                  ? "Closed"
                  : null,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
  },
  readBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.purpleSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 13 },
  rowDivider: { height: 1, backgroundColor: C.borderSoft, marginLeft: 64 },
  kindIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.purple,
    marginTop: 5,
    marginLeft: 6,
  },
  thumb: {
    width: 52,             // Width ektu bariye din
    height: 52,            // Height ektu bariye din
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E9E5F7",
    marginLeft: 8,
    flexShrink: 0,         // Size squash/crop howa theke atkabe
  },
  listLabel: { marginBottom: 6, letterSpacing: 0.4 },
  cCard: { padding: 12, marginBottom: 12 },
  cTop: { flexDirection: "row" },
  cThumb: {
    width: 96,
    height: 104,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E9E5F7",
  },
  cFoot: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
});
