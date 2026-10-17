// Campaign detail. The hero, organizer, progress and tabs all read the derived
// campaign view, so a contribution or save recorded anywhere updates this page.
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp, logic } from "../store/AppStore";
import { C, CATEGORY_COLORS, compact, money, timeAgo } from "../theme/theme";
import { Icon } from "../components/Icon";
import { Avatar, SmartImage } from "../components/SmartImage";
import {
  Card,
  Empty,
  GradButton,
  IconButton,
  Pill,
  Progress,
  Screen,
  SoftButton,
  T,
} from "../components/ui";

const W = Dimensions.get("window").width;

const TABS = ["About", "Updates", "Supporters"];

export default function DetailScreen({ navigation, route }) {
  const app = useApp();
  const id = route.params?.id;
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState("About");
  const [page, setPage] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      StatusBar.setBarStyle("light-content", true);
      return () => StatusBar.setBarStyle("dark-content", true);
    }, []),
  );

  const c = app.selectors.campaignView(id, now);

  if (!c) {
    return (
      <Screen bg={C.bg}>
        <Empty
          icon="file-remove-outline"
          title="This campaign is gone"
          body="It may have been deleted from this device."
          action="Back to Explore"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const cat = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Community;
  const slides =
    c.gallery && c.gallery.length ? c.gallery : [c.cover].filter(Boolean);
  const mine = c.ownerId && c.ownerId === app.actor;
  const saved = app.selectors.isSaved(c.id);
  const following = app.selectors.isFollowing(c.organizer.id);
  const liked = app.selectors.isLiked(c.id);
  const records = logic
    .contributionsForCampaign(app.state, c.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const share = async () => {
    try {
      await Share.share({
        message:
          c.title +
          " — " +
          c.summary +
          "\n" +
          money(c.raisedAmount) +
          " raised of " +
          money(c.goalAmount),
        title: c.title,
      });
    } catch (e) {
      // The user dismissed the share sheet.
    }
  };

  return (
    <Screen bg={C.bg} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 35 }}
      >
        {/* ------------------------------------------------------------- hero */}
        <View style={styles.hero}>
          {slides.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              key={c.id}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPage(Math.round(e.nativeEvent.contentOffset.x / W))
              }
            >
              {slides.map((src, i) => (
                <SmartImage
                  key={i}
                  source={src}
                  category={c.category}
                  style={{ width: W, height: 280 }}
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={{ width: W, height: 280, backgroundColor: "#E9E5F7" }}
            />
          )}
          <View style={styles.heroTop}>
            <IconButton
              icon="arrow-left"
              bg="rgba(20,18,40,0.42)"
              color="#fff"
              size={36}
              iconSize={18}
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1 }} />
            <IconButton
              icon={liked ? "heart" : "heart-outline"}
              bg="rgba(20,18,40,0.42)"
              color="#fff"
              size={36}
              iconSize={18}
              onPress={() => app.toggleLike(c.id)}
            />
            <IconButton
              icon={saved ? "bookmark-check" : "bookmark-outline"}
              bg="rgba(20,18,40,0.42)"
              color="#fff"
              size={36}
              iconSize={18}
              style={{ marginLeft: 6 }}
              onPress={() => app.toggleSave(c.id)}
            />
            <IconButton
              icon="share-variant"
              bg="rgba(20,18,40,0.42)"
              color="#fff"
              size={36}
              iconSize={18}
              style={{ marginLeft: 6 }}
              onPress={share}
            />
          </View>

          <View style={styles.heroBottom}>
            <Pill
              label={c.category}
              icon={cat.icon}
              fg="#fff"
              bg={hexToTranslucent(cat.fg)}
              size={10.5}
            />
            <View style={styles.statusRow}>
              {c.status === "completed" ? (
                <Pill
                  label="Campaign closed"
                  icon="check-decagram"
                  fg={C.green}
                  bg="#DCF5E7"
                  style={{ marginLeft: 6 }}
                  size={10.5}
                />
              ) : (
                <Pill
                  label={c.daysLeft + " days left"}
                  icon="clock-outline"
                  fg="#fff"
                  bg="rgba(20,18,40,0.45)"
                  style={{ marginLeft: 6 }}
                  size={10.5}
                />
              )}
            </View>
          </View>

          {slides.length > 1 ? (
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === Math.min(page, slides.length - 1) && styles.dotOn,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* ------------------------------------------------------------- body */}
        <View style={styles.body}>
          <T w={800} s={21} color={C.ink} style={styles.title}>
            {c.title}
          </T>

          <T
            w={400}
            s={13}
            color={C.muted}
            style={{ marginTop: 5, lineHeight: 19 }}
          >
            {c.summary}
          </T>

          {c.tags && c.tags.length ? (
            <View style={styles.tags}>
              {c.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <T w={600} s={11} color={C.purple}>
                    #{t}
                  </T>
                </View>
              ))}
            </View>
          ) : null}

          {/* -------------------------------------------------- Instagram-style Organizer Card */}
          <Card style={styles.organizerCard}>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() =>
                navigation.navigate("Organizer", {
                  id: c.organizer.id,
                  campaignId: c.id,
                })
              }
            >
              <Avatar
                source={c.organizer.avatar}
                name={c.organizer.name}
                size={44}
                ring
              />

              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <T w={700} s={14} color={C.ink} numberOfLines={1}>
                    {c.organizer.name}
                  </T>
                  {c.organizer.verified ? (
                    <View style={styles.verified}>
                      <Icon name="check-bold" size={10} color={C.purple} />
                    </View>
                  ) : null}
                </View>
                {c.organizer.tagline ? (
                  <T
                    w={400}
                    s={11.5}
                    color={C.muted}
                    numberOfLines={1}
                    style={{ marginTop: 1 }}
                  >
                    {c.organizer.tagline}
                  </T>
                ) : null}
              </View>

              <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                <T w={800} s={13} color={C.ink}>
                  {compact(c.organizer.followers)}
                </T>
                <T w={500} s={10.5} color={C.muted} style={{ marginTop: 1 }}>
                  Followers
                </T>
              </View>
            </Pressable>

            <View style={{ marginTop: 10 }}>
              <SoftButton
                label={following ? "Following" : "Follow"}
                icon={following ? "check" : "plus"}
                color={following ? C.green : C.purple}
                bg={following ? "#DCF5E7" : C.purpleSoft}
                style={styles.followBtn}
                textStyle={{ fontSize: 12.5 }}
                onPress={() => app.toggleFollow(c.organizer.id)}
              />
            </View>
          </Card>

          {/* ----------------------------------------------------------- Progress Card */}
          <Card style={styles.progressCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <T w={500} s={12.5} color={C.muted}>
                <T w={800} s={22} color={C.purple}>
                  {money(c.raisedAmount)}
                </T>
                {" raised"}
              </T>
              <T w={500} s={12} color={C.muted}>
                of {money(c.goalAmount)}
              </T>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Progress percent={c.percent} height={7} style={{ flex: 1 }} />
              <T w={800} s={12} color={C.ink} style={{ marginLeft: 8 }}>
                {c.percent}%
              </T>
            </View>

            <View style={styles.metrics}>
              <Metric
                icon="account-group-outline"
                value={compact(c.supporters)}
                label="supporters"
              />
              <View style={styles.metricDiv} />
              <Metric
                icon="clock-outline"
                value={c.status === "completed" ? "Closed" : c.daysLeft}
                label="days left"
              />
              <View style={styles.metricDiv} />
              <Metric
                icon="eye-outline"
                value={compact(c.views || 0)}
                label="views"
              />
            </View>

            {c.remaining > 0 ? (
              <T
                w={500}
                s={11.5}
                color={C.mutedLight}
                style={{ marginTop: 10, textAlign: "center" }}
              >
                {money(c.remaining)} still needed to reach the goal
              </T>
            ) : (
              <T
                w={600}
                s={11.5}
                color={C.green}
                style={{ marginTop: 10, textAlign: "center" }}
              >
                Goal reached — thank you to every supporter
              </T>
            )}
          </Card>

          {mine ? (
            <View style={{ marginTop: 12 }}>
              <Card style={{ padding: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon
                    name="account-circle-outline"
                    size={16}
                    color={C.purple}
                  />
                  <T
                    w={700}
                    s={12.5}
                    color={C.ink}
                    style={{ marginLeft: 6, flex: 1 }}
                  >
                    You created this campaign
                  </T>
                </View>
                <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
                  <SoftButton
                    label="Manage"
                    icon="cog-outline"
                    style={{ flex: 1, paddingVertical: 8 }}
                    textStyle={{ fontSize: 12 }}
                    onPress={() => navigation.navigate("MyCampaigns")}
                  />
                  <SoftButton
                    label="Add update"
                    icon="plus"
                    style={{ flex: 1, paddingVertical: 8 }}
                    textStyle={{ fontSize: 12 }}
                    onPress={() =>
                      navigation.navigate("MyCampaigns", { openUpdate: c.id })
                    }
                  />
                </View>
              </Card>
            </View>
          ) : (
            <GradButton
              label="Support Now"
              // icon="heart"
              arrow
              style={{ marginTop: 14, paddingVertical: 0 }}
              textStyle={{ fontSize: 13.5 }}
              onPress={() => navigation.navigate("Contribution", { id: c.id })}
            />
          )}

          {app.state.prefs.showDemoTips !== false ? <DemoNote /> : null}

          {/* ----------------------------------------------------------- Tabs */}
          <View style={styles.tabBar}>
            {TABS.map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
                <T w={700} s={13} color={tab === t ? C.ink : C.mutedLight}>
                  {t}
                </T>
                <View
                  style={[
                    styles.tabLine,
                    tab === t && { backgroundColor: C.purple },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 14 }}>
            {tab === "About" ? (
              <About
                c={c}
                cat={cat}
                records={records}
                onSupporters={() => setTab("Supporters")}
              />
            ) : null}
            {tab === "Updates" ? <Updates c={c} now={now} /> : null}
            {tab === "Supporters" ? (
              <Supporters c={c} records={records} now={now} />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* --------------------------------------------------------------- tab bodies */

// function About({ c, records, onSupporters }) {
//   return (
//     <View>
//       <T w={800} s={15.5} color={C.ink}>
//         About This Campaign
//       </T>
//       <T
//         w={400}
//         s={13}
//         color={C.inkSoft}
//         style={{ marginTop: 8, lineHeight: 20 }}
//       >
//         {c.description || c.summary}
//       </T>

//       {c.location ? (
//         <View style={styles.row}>
//           <Icon name="map-marker-outline" size={15} color={C.purple} />
//           <T w={500} s={12.5} color={C.ink} style={{ marginLeft: 6 }}>
//             {c.location}
//           </T>
//         </View>
//       ) : null}
//       <View style={styles.row}>
//         <Icon name="calendar-outline" size={15} color={C.purple} />
//         <T w={500} s={12.5} color={C.ink} style={{ marginLeft: 6 }}>
//           Runs until{" "}
//           {new Date(c.endDate).toLocaleDateString("en-GB", {
//             day: "numeric",
//             month: "short",
//             year: "numeric",
//           })}
//         </T>
//       </View>

//       {c.gallery && c.gallery.length > 1 ? (
//         <View style={styles.gallery}>
//           {c.gallery.slice(0, 4).map((src, i) => (
//             <View
//               key={i}
//               style={[styles.galleryCell, i === 3 && { marginRight: 0 }]}
//             >
//               <SmartImage
//                 source={src}
//                 category={c.category}
//                 style={StyleSheet.absoluteFill}
//               />
//               {i === 3 && c.gallery.length > 4 ? (
//                 <View style={styles.galleryMore}>
//                   <T w={700} s={12} color="#fff">
//                     +{c.gallery.length - 4}
//                   </T>
//                 </View>
//               ) : null}
//             </View>
//           ))}
//         </View>
//       ) : null}

//       <Pressable onPress={onSupporters} style={styles.supporterStrip}>
//         <View style={styles.faces}>
//           {records.slice(0, 4).map((r, i) => (
//             <Avatar
//               key={r.id}
//               source={r.donorAvatar}
//               name={r.donorName || "A"}
//               size={24}
//               style={{ marginLeft: i === 0 ? 0 : -8 }}
//             />
//           ))}
//           {records.length === 0 ? (
//             <T w={400} s={12} color={C.muted}>
//               Be the first to support this campaign
//             </T>
//           ) : null}
//         </View>
//         <T
//           w={500}
//           s={12}
//           color={C.muted}
//           style={{ flex: 1, marginLeft: records.length ? 8 : 0 }}
//         >
//           Supported by{" "}
//           <T w={800} s={12} color={C.ink}>
//             {compact(c.supporters)}
//           </T>{" "}
//           people
//         </T>
//         <Icon name="chevron-right" size={15} color={C.mutedLight} />
//       </Pressable>
//     </View>
//   );
// }

function About({ c, records, onSupporters }) {
  return (
    <View>
      <T w={800} s={16} color={C.ink}>
        About This Campaign
      </T>
      <T w={400} s={13} color={C.inkSoft} style={{ marginTop: 8, lineHeight: 21 }}>
        {c.description || c.summary}
      </T>

      {/* Meta Pills (Location & Dates) in clean badge style */}
      <View style={styles.metaBadgeRow}>
        {c.location ? (
          <View style={styles.metaBadge}>
            <Icon name="map-marker-outline" size={13} color={C.purpleDeep} />
            <T w={600} s={11.5} color={C.inkSoft} style={{ marginLeft: 5 }}>
              {c.location}
            </T>
          </View>
        ) : null}

        <View style={styles.metaBadge}>
          <Icon name="calendar-blank-outline" size={13} color={C.purpleDeep} />
          <T w={600} s={11.5} color={C.inkSoft} style={{ marginLeft: 5 }}>
            Runs until {new Date(c.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </T>
        </View>
      </View>

      {c.gallery && c.gallery.length > 1 ? (
        <View style={styles.gallery}>
          {c.gallery.slice(0, 4).map((src, i) => (
            <View key={i} style={[styles.galleryCell, i === 3 && { marginRight: 0 }]}>
              <SmartImage source={src} category={c.category} style={StyleSheet.absoluteFill} />
              {i === 3 && c.gallery.length > 4 ? (
                <View style={styles.galleryMore}>
                  <T w={700} s={12} color="#fff">
                    +{c.gallery.length - 4}
                  </T>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Professional Supporter Bar */}
      <Pressable onPress={onSupporters} style={styles.supporterStrip}>
        <View style={styles.faces}>
          {records.slice(0, 3).map((r, i) => (
            <Avatar
              key={r.id || i}
              source={r.donorAvatar}
              name={r.donorName || 'A'}
              size={26}
              style={{ marginLeft: i === 0 ? 0 : -8, borderWidth: 1.5, borderColor: '#fff' }}
            />
          ))}
        </View>

        <View style={{ flex: 1, marginLeft: records.length ? 10 : 0 }}>
          {records.length > 0 ? (
            <T w={500} s={12.5} color={C.muted} numberOfLines={1}>
              Supported by <T w={800} s={13} color={C.ink}>{compact(c.supporters)}</T> people
            </T>
          ) : (
            <T w={500} s={12.5} color={C.muted}>
              Be the first to support this campaign
            </T>
          )}
        </View>

        <Icon name="chevron-right" size={16} color={C.mutedLight} />
      </Pressable>
    </View>
  );
}

function Updates({ c, now }) {
  const items = c.updates || [];
  if (!items.length) {
    return (
      <Empty
        icon="bullhorn-outline"
        title="No updates yet"
        body="The organizer has not posted an update on this campaign so far."
      />
    );
  }
  return (
    <View>
      <T w={800} s={15.5} color={C.ink} style={{ marginBottom: 4 }}>
        Latest Updates
      </T>
      {items.map((u, i) => (
        <View key={u.id} style={styles.update}>
          <View style={styles.updateDotCol}>
            <View style={styles.updateDot} />
            {i < items.length - 1 ? <View style={styles.updateLine} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <T w={700} s={13} color={C.ink}>
              Update {items.length - i}
            </T>
            <T w={500} s={11} color={C.mutedLight} style={{ marginTop: 2 }}>
              {timeAgo(u.createdAt)} ·{" "}
              {new Date(u.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </T>
            <T
              w={400}
              s={12.5}
              color={C.inkSoft}
              style={{ marginTop: 6, lineHeight: 19 }}
            >
              {u.text}
            </T>
          </View>
        </View>
      ))}
      <T w={400} s={11} color={C.mutedLight} style={{ marginTop: 2 }}>
        Last checked {timeAgo(now)}
      </T>
    </View>
  );
}

function Supporters({ c, records }) {
  const total = c.supporters;
  if (!records.length) {
    return (
      <Empty
        icon="hand-heart"
        title="No itemised support yet"
        body={
          "This campaign shows " +
          compact(total) +
          " supporters. Contributions made in this demo build are listed here one by one."
        }
      />
    );
  }
  return (
    <View>
      <T w={800} s={15.5} color={C.ink}>
        Recent Supporters
      </T>
      {records.map((r) => (
        <View key={r.id} style={styles.supporter}>
          <Avatar source={r.donorAvatar} name={r.donorName || "A"} size={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <T w={700} s={13} color={C.ink} numberOfLines={1}>
              {r.donorName || "A supporter"}
            </T>
            <T w={400} s={11.5} color={C.muted} style={{ marginTop: 1 }}>
              {money(r.amount)} · {timeAgo(r.createdAt)}
            </T>
          </View>
          <View style={styles.supportBadge}>
            <Icon name="currency-inr" size={12} color={C.green} />
          </View>
        </View>
      ))}
      <T w={400} s={11} color={C.mutedLight} style={{ marginTop: 8 }}>
        {records.length} contribution{records.length === 1 ? "" : "s"} recorded
        on this device · total{" "}
        {money(records.reduce((s, r) => s + r.amount, 0))}
      </T>
    </View>
  );
}

/* -------------------------------------------------------------------- bits */

function Metric({ icon, value, label }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icon
          name={icon}
          size={13}
          color={C.mutedLight}
          style={{ marginRight: 4 }}
        />
        <T w={800} s={15} color={C.ink}>
          {value}
        </T>
      </View>
      <T w={500} s={11} color={C.muted} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}

function DemoNote() {
  return (
    <View style={styles.demoNote}>
      <Icon name="information-outline" size={14} color={C.amber} />
      <T w={500} s={11} color="#8A6A1E" style={{ flex: 1, marginLeft: 6 }}>
        Demo campaign — supporting it records a simulated contribution on this
        device.
      </T>
    </View>
  );
}

function hexToTranslucent(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + "," + g + "," + b + ",0.9)";
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 280,
    backgroundColor: "#E9E5F7",
    position: "relative",
  },
  heroTop: {
    position: "absolute",
    top: 40,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  heroBottom: {
    position: "absolute",
    left: 14,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  dots: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.45)",
    marginHorizontal: 2.5,
  },
  dotOn: { backgroundColor: "#fff", width: 16 },
  body: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 18,
    minHeight: 300,
  },
  title: { letterSpacing: -0.4, lineHeight: 27 },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  tag: {
    backgroundColor: C.purpleSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  verified: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: C.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  organizerCard: { marginTop: 14, padding: 12 },
  followBtn: { width: "100%", paddingVertical: 8, borderRadius: 10 },
  progressCard: { marginTop: 12, padding: 14 },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  metricDiv: { width: 1, height: 24, backgroundColor: C.borderSoft },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  gallery: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, gap: 8 },
  galleryCell: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#EFEDF7",
  },
  galleryMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,18,40,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  supporterStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 10,
    borderRadius: 14,
    backgroundColor: C.bg,
  },
  faces: { flexDirection: "row", alignItems: "center" },
  demoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF6E5",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  tab: { flex: 1, alignItems: "center", paddingBottom: 8 },
  tabLine: {
    height: 2.5,
    borderRadius: 2,
    width: 0,
    marginTop: 6,
    backgroundColor: "transparent",
  },
  update: { flexDirection: "row", marginTop: 12 },
  updateDotCol: { width: 16, alignItems: "center", paddingTop: 4 },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.purple,
  },
  updateLine: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 3 },
  supporter: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  supportBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#DCF5E7",
    alignItems: "center",
    justifyContent: "center",
  },
  metaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  supporterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8F7FC',
    borderWidth: 1,
    borderColor: '#EFEFF6',
  },
});
