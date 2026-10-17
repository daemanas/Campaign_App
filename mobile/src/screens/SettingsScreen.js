// Settings: account details, the switches that actually change behaviour,
// local data stats, and the demo-data reset. Nothing here talks to a server.
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "../store/AppStore";
import { useGate } from "../navigation/gate";
import { C } from "../theme/theme";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/SmartImage";
import {
  Card,
  Divider,
  Field,
  GradButton,
  IconButton,
  Screen,
  SoftButton,
  T,
  ToggleRow,
} from "../components/ui";

const APP_VERSION = "1.0.0";

export default function SettingsScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const prefs = app.state.prefs;
  const user = app.user;
  const stats = app.selectors.stats();

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwNote, setPwNote] = useState(null);

  const setPref = (key, value) => app.updatePrefs({ [key]: value });

  const signOut = () => {
    Alert.alert(
      "Sign out?",
      "Your saved campaigns, contributions and drafts stay on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            app.logout();
            navigation.navigate("Tabs", { screen: "Home" });
          },
        },
      ],
    );
  };

  const resetData = () => {
    Alert.alert(
      "Reset demo data?",
      "Everything this app stored on the device is removed: the signed-in session, campaigns you created, saved list, contributions, drafts and picked photos. The demo dataset is then rebuilt.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await app.resetDemoData();
            navigation.navigate("Tabs", { screen: "Home" });
          },
        },
      ],
    );
  };

  const changePassword = () => {
    if (!pw.next || pw.next.length < 8)
      return setPwNote({
        kind: "bad",
        text: "New password must be at least 8 characters.",
      });
    if (pw.next !== pw.confirm)
      return setPwNote({
        kind: "bad",
        text: "The two new passwords do not match.",
      });
    const res = app.changePassword(pw.current, pw.next);
    if (res.error) return setPwNote({ kind: "bad", text: res.error });
    setPw({ current: "", next: "", confirm: "" });
    return setPwNote({ kind: "ok", text: "Password updated on this device." });
  };

  return (
    <Screen bg={C.bg}>
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          bg="#fff"
          border
          size={36}
          iconSize={18}
          onPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <T w={800} s={18} color={C.ink}>
            Settings
          </T>
          <T w={400} s={11.5} color={C.muted} style={{ marginTop: 1 }}>
            Stored on this device only
          </T>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pad}
      >
        {/* ------------------------------------------------------------ account */}
        <Card style={styles.cardCompact}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar
              source={user ? user.avatar : null}
              name={user ? user.name : "Guest"}
              size={48}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <T w={800} s={15.5} color={C.ink}>
                {user ? user.name : "Browsing as guest"}
              </T>
              <T
                w={400}
                s={12}
                color={C.muted}
                style={{ marginTop: 2 }}
                numberOfLines={1}
              >
                {user
                  ? user.email
                  : "Sign in to publish a campaign or edit a profile"}
              </T>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {user ? (
              <SoftButton
                label="Edit profile"
                icon="pencil-outline"
                style={styles.btnSmall}
                textStyle={{ fontSize: 12.5 }}
                onPress={() => navigation.navigate("EditProfile")}
              />
            ) : (
              <SoftButton
                label="Sign in"
                icon="login"
                style={styles.btnSmall}
                textStyle={{ fontSize: 12.5 }}
                onPress={() => gate.requireAuth({ kind: "editProfile" })}
              />
            )}
            <SoftButton
              label="Saved"
              icon="bookmark-outline"
              style={styles.btnSmall}
              textStyle={{ fontSize: 12.5 }}
              onPress={() => navigation.navigate("Saved")}
            />
          </View>
        </Card>

        {/* --------------------------------------------------------- preferences */}
        <T w={700} s={11.5} color={C.mutedLight} style={styles.sectionLabel}>
          PREFERENCES
        </T>
        <Card style={{ paddingVertical: 2, paddingHorizontal: 14 }}>
          <ToggleRow
            label="Activity notifications"
            sub="Events still record, but they do not raise an unread badge while this is off."
            icon="bell-outline"
            value={prefs.notifications !== false}
            onValueChange={(v) => setPref("notifications", v)}
          />
          <Divider />
          <ToggleRow
            label="Demo notes"
            sub="Extra reminders on campaign pages. The notice that support is simulated always stays on the payment flow."
            icon="information-outline"
            value={prefs.showDemoTips !== false}
            onValueChange={(v) => setPref("showDemoTips", v)}
          />
        </Card>

        {/* -------------------------------------------------------------- data */}
        <T w={700} s={11.5} color={C.mutedLight} style={styles.sectionLabel}>
          YOUR DATA ON THIS DEVICE
        </T>
        <Card style={styles.cardCompact}>
          <View style={styles.dataGrid}>
            <DataCell
              icon="rocket-launch-outline"
              value={stats.created}
              label="Campaigns created"
            />
            <DataCell
              icon="bookmark-outline"
              value={stats.saved}
              label="Saved"
            />
            <DataCell
              icon="hand-heart-outline"
              value={stats.contributions}
              label="Contributions"
            />
            <DataCell
              icon="content-save-outline"
              value={stats.drafts}
              label="Drafts"
            />
          </View>
          <Divider style={{ marginVertical: 10 }} />
          <T w={400} s={11} color={C.mutedLight} style={{ lineHeight: 16 }}>
            Records are kept with AsyncStorage. Clearing the app's data in
            Android settings removes them, and the demo dataset is rebuilt the
            next time the app opens.
          </T>
          <View style={{ marginTop: 12 }}>
            <SoftButton
              label="Reset demo data and my records"
              icon="database-refresh"
              color={C.red}
              bg="#FFE5EA"
              style={{ paddingVertical: 10 }}
              textStyle={{ fontSize: 12.5 }}
              onPress={resetData}
            />
          </View>
        </Card>

        {/* ------ security */}
        {user ? (
          <>
            <T
              w={700}
              s={11.5}
              color={C.mutedLight}
              style={styles.sectionLabel}
            >
              SECURITY
            </T>
            <Card style={styles.cardCompact}>
              <Field
                label="Current password"
                icon="lock-outline"
                value={pw.current}
                onChangeText={(v) => setPw({ ...pw, current: v })}
                placeholder="Your current password"
                secure
                autoCapitalize="none"
              />
              <Field
                label="New password"
                icon="lock-check-outline"
                value={pw.next}
                onChangeText={(v) => setPw({ ...pw, next: v })}
                placeholder="At least 8 characters"
                secure
                autoCapitalize="none"
              />
              <Field
                label="Confirm new password"
                icon="lock-check-outline"
                value={pw.confirm}
                onChangeText={(v) => setPw({ ...pw, confirm: v })}
                placeholder="Repeat the new password"
                secure
                autoCapitalize="none"
              />
              {pwNote ? (
                <View
                  style={[
                    styles.note,
                    pwNote.kind === "ok" ? styles.noteOk : styles.noteBad,
                  ]}
                >
                  <Icon
                    name={
                      pwNote.kind === "ok"
                        ? "check-circle-outline"
                        : "alert-circle-outline"
                    }
                    size={14}
                    color={pwNote.kind === "ok" ? C.green : C.red}
                  />
                  <T
                    w={600}
                    s={11.5}
                    color={pwNote.kind === "ok" ? C.green : C.red}
                    style={{ flex: 1, marginLeft: 6 }}
                  >
                    {pwNote.text}
                  </T>
                </View>
              ) : null}
              <View style={{ marginTop: 10 }}>
                <GradButton
                  label="Update password"
                  icon="shield-key-outline"
                  style={{ paddingVertical: 1 }}
                  textStyle={{ fontSize: 13 }}
                  onPress={changePassword}
                />
              </View>
              <T
                w={400}
                s={10.5}
                color={C.mutedLight}
                style={{ marginTop: 8, lineHeight: 15 }}
              >
                Demo accounts keep their password in local storage. Use one here
                that you do not use anywhere else.
              </T>
            </Card>
          </>
        ) : null}

        {/* ------------------------------------------------------------- about */}
        <T w={700} s={11.5} color={C.mutedLight} style={styles.sectionLabel}>
          ABOUT
        </T>
        <Card style={{ paddingVertical: 2, paddingHorizontal: 14 }}>
          <Row
            icon="information-outline"
            label="App version"
            value={"Amplify " + APP_VERSION}
          />
          <Divider />
          <Row
            icon="credit-card-off-outline"
            label="Payments"
            value="Simulated — no money moves"
          />
          <Divider />
          <Row
            icon="server-off"
            label="Backend"
            value="Not required for this demo"
          />
          <Divider />
          <Row
            icon="account-group-outline"
            label="Built for"
            value="Campaign Reach demo"
          />
        </Card>

        <View style={{ marginTop: 16 }}>
          {user ? (
            <GradButton
              label="Sign out"
              icon="logout"
              colors={["#8B8AA0", "#5B5A6E"]}
              style={{ paddingVertical: 0 }}
              textStyle={{ fontSize: 10 }}
              onPress={signOut}
            />
          ) : (
            <GradButton
              label="Sign in or create an account"
              icon="login"
              arrow
              style={{ paddingVertical: 1 }}
              textStyle={{ fontSize: 13.5 }}
              onPress={() => gate.requireAuth({ kind: "editProfile" })}
            />
          )}
        </View>

        <T
          w={400}
          s={11}
          color={C.mutedLight}
          style={{ marginTop: 14, textAlign: "center", lineHeight: 16 }}
        >
          Amplify — Campaign Reach · demo build for review
        </T>
      </ScrollView>
    </Screen>
  );
}

function DataCell({ icon, value, label }) {
  return (
    <View style={styles.dataCell}>
      <Icon name={icon} size={15} color={C.purpleDeep} />
      <T w={800} s={15} color={C.ink} style={{ marginTop: 4 }}>
        {Number(value || 0)}
      </T>
      <T
        w={500}
        s={10.5}
        color={C.muted}
        style={{ marginTop: 2, textAlign: "center" }}
      >
        {label}
      </T>
    </View>
  );
}

function Row({ icon, label, value }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
      }}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={15} color={C.purpleDeep} />
      </View>
      <T w={600} s={13} color={C.ink} style={{ flex: 1, marginLeft: 10 }}>
        {label}
      </T>
      <T
        w={500}
        s={12}
        color={C.muted}
        style={{ textAlign: "right", marginLeft: 8 }}
      >
        {value}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  pad: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30 },
  sectionLabel: {
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,

  },
  cardCompact: { padding: 14 },
  btnSmall: { flexGrow: 1, paddingVertical: 8 },
  dataGrid: { flexDirection: "row" },
  dataCell: { flex: 1, alignItems: "center" },
  note: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  noteOk: { backgroundColor: "#E4F7EE" },
  noteBad: { backgroundColor: "#FFE9EC" },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
