import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { C } from "../theme/theme";
import { useApp } from "../store/AppStore";
import { useGate } from "../navigation/gate";
import { Icon } from "../components/Icon";
import { LogoMark, Logo } from "../components/BrandLogo";
import { Field, GradButton, T } from "../components/ui";

function Blobs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.dotA} />
      <View style={styles.dotB} />
    </View>
  );
}

export default function AuthScreen({ navigation, route }) {
  const app = useApp();
  const gate = useGate();
  const [mode, setMode] = useState(
    route.params?.mode === "signup" ? "signup" : "login",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(true);

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirm: "",
  });

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const afterAuth = () => {
    const p = gate.pending;
    gate.clearPending();
    if (!p) return navigation.goBack();
    if (p.kind === "create") return navigation.replace("CreateFlow");
    if (p.kind === "detail")
      return navigation.replace("Detail", { id: p.campaignId });
    if (p.kind === "editProfile") return navigation.replace("EditProfile");
    if (p.kind === "saved") return navigation.replace("Saved");
    if (p.kind === "settings") return navigation.replace("Settings");
    if (p.go) {
      p.go();
      return navigation.goBack();
    }
    navigation.goBack();
  };

  const submit = () => {
    setBusy(true);
    setError(null);
    if (mode === "login") {
      const res = app.login(loginForm);
      setBusy(false);
      if (res.error) return setError(res.error);
      return afterAuth();
    }
    const res = app.register({ ...form, accepted });
    setBusy(false);
    if (res.error) return setError(res.error);
    return afterAuth();
  };

  const notInDemo = (what) =>
    Alert.alert(
      "Not available in this build",
      `${what} sign-in needs a live backend and provider keys. This APK stores accounts on the device, so please register with an email and password or use the demo account.`,
    );

  const forgot = () =>
    Alert.alert(
      "Reset password",
      "Accounts in this demo live only on this device, so there is no server-side reset link. Create a new account, or sign in with the demo account (tap “Use the demo account” below).",
    );

  const useDemo = () => {
    setMode("login");
    setError(null);
    setLoginForm({ identifier: "daemanas12", password: "amplify123" });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Blobs />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode === "signup" ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={styles.back}
            >
              <Icon name="chevron-left" size={24} color={C.ink} />
            </Pressable>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Logo size={38} />
            </View>
            <View style={{ width: 44 }} />
          </View>
        ) : (
          <View style={{ alignItems: "center", marginTop: 18 }}>
            <LogoMark size={86} radius={26} />
            <T
              w={800}
              s={27}
              color={C.ink}
              style={{ letterSpacing: 7, marginTop: 20 }}
            >
              AMPLIFY
            </T>
            <T
              w={500}
              s={10.5}
              color={C.muted}
              style={{ letterSpacing: 4.4, marginTop: 3 }}
            >
              CAMPAIGN REACH
            </T>
          </View>
        )}

        {mode === "login" ? (
          <>
            <T
              w={800}
              s={31}
              color={C.ink}
              style={{
                textAlign: "center",
                marginTop: 34,
                letterSpacing: -0.7,
              }}
            >
              Welcome back
            </T>
            <T
              w={400}
              s={14.5}
              color={C.muted}
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Sign in to continue to Amplify
            </T>
          </>
        ) : (
          <>
            <T
              w={800}
              s={30}
              color={C.ink}
              style={{
                textAlign: "center",
                marginTop: 26,
                letterSpacing: -0.7,
              }}
            >
              Create your{" "}
              <T w={800} s={30} color={C.purple}>
                account
              </T>
            </T>
            <T
              w={400}
              s={14.5}
              color={C.muted}
              style={{ textAlign: "center", marginTop: 8, lineHeight: 21 }}
            >
              Join a community that creates{"\n"}real change.
            </T>
          </>
        )}

        <View style={{ marginTop: 28 }}>
          {mode === "login" ? (
            <>
              <Field
                label="Email or username"
                icon="account-outline"
                placeholder="amit"
                value={loginForm.identifier}
                autoCapitalize="none"
                onChangeText={(v) => {
                  setLoginForm((f) => ({ ...f, identifier: v }));
                  setError(null);
                }}
              />
              <Field
                label="Password"
                icon="lock-outline"
                placeholder="Your password"
                value={loginForm.password}
                secure={!showPw}
                visible={showPw}
                onToggleSecure={() => setShowPw((s) => !s)}
                autoCapitalize="none"
                onChangeText={(v) => {
                  setLoginForm((f) => ({ ...f, password: v }));
                  setError(null);
                }}
              />
              <Pressable
                onPress={forgot}
                hitSlop={8}
                style={{
                  alignSelf: "flex-end",
                  marginBottom: 22,
                  marginTop: -8,
                }}
              >
                <T w={700} s={13} color={C.purple}>
                  Forgot password?
                </T>
              </Pressable>
            </>
          ) : (
            <>
              <StackField
                icon="account-outline"
                label="Full name"
                placeholder="Daem Anas"
                value={form.name}
                onChangeText={set("name")}
              />
              <StackField
                icon="email-outline"
                label="Email address"
                placeholder="you@example.com"
                value={form.email}
                onChangeText={set("email")}
                keyboardType="email-address"
              />
              <StackField
                icon="at"
                label="Username"
                placeholder="daemanas12"
                value={form.username}
                onChangeText={set("username")}
                autoCapitalize="none"
              />
              <StackField
                icon="lock-outline"
                label="Password"
                placeholder="At least 8 characters"
                value={form.password}
                onChangeText={set("password")}
                secure={!showPw}
                visible={showPw}
                onToggleSecure={() => setShowPw((s) => !s)}
              />
              <StackField
                icon="lock-outline"
                label="Confirm password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChangeText={set("confirm")}
                secure={!showConfirm}
                visible={showConfirm}
                onToggleSecure={() => setShowConfirm((s) => !s)}
              />
              <Pressable
                onPress={() => setAccepted((a) => !a)}
                style={styles.terms}
                hitSlop={8}
              >
                <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                  {accepted ? (
                    <Icon name="check" size={14} color="#fff" />
                  ) : null}
                </View>
                <T
                  w={500}
                  s={12.5}
                  color={C.muted}
                  style={{ flex: 1, marginLeft: 10, lineHeight: 18 }}
                >
                  I agree to the{" "}
                  <T w={700} s={12.5} color={C.purple}>
                    Terms of Service
                  </T>{" "}
                  and{" "}
                  <T w={700} s={12.5} color={C.purple}>
                    Privacy Policy
                  </T>
                </T>
              </Pressable>
            </>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Icon
                name="alert-circle-outline"
                size={16}
                color={C.red}
                style={{ marginRight: 8 }}
              />
              <T w={600} s={12.5} color={C.red} style={{ flex: 1 }}>
                {error}
              </T>
            </View>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              styles.solidButton,
              { opacity: pressed || busy ? 0.8 : 1, flex: 1, marginTop: 4 },
            ]}
          >
            <T w={700} s={14} color="#fff">
              {mode === "login" ? "Sign in" : "Create account"}
            </T>
            <Icon
              name="arrow-right"
              size={16}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <T
              w={500}
              s={12.5}
              color={C.mutedLight}
              style={{ marginHorizontal: 12 }}
            >
              or continue with
            </T>
            <View style={styles.dividerLine} />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <SocialButton
              icon="google"
              label="Google"
              onPress={() => notInDemo("Google")}
              tint="#EA4335"
            />
            <SocialButton
              icon="apple"
              label="Apple"
              onPress={() => notInDemo("Apple")}
              tint="#111"
            />
          </View>

          {mode === "login" ? (
            <Pressable onPress={useDemo} style={styles.demoBox}>
              <Icon
                name="account-key-outline"
                size={16}
                color={C.purple}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <T w={700} s={12.5} color={C.purple}>
                  Use the demo account
                </T>
                <T w={400} s={11} color={C.muted} style={{ marginTop: 2 }}>
                  demoaccount · amplify123 — pre-filled campaigns and history
                </T>
              </View>
            </Pressable>
          ) : null}

          <View style={{ height: 26 }} />

          <T
            w={500}
            s={13.5}
            color={C.muted}
            style={{ textAlign: "center", marginBottom: 30 }}
          >
            {mode === "login"
              ? "New to Amplify? "
              : "Already have an account? "}
            <T
              w={800}
              s={13.5}
              color={C.purple}
              onPress={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </T>
          </T>

          <T
            w={400}
            s={11}
            color={C.mutedLight}
            style={{ textAlign: "center", marginBottom: 24, lineHeight: 17 }}
          >
            Accounts and campaign data are stored on this device for the demo
            build.
          </T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StackField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  visible,
  onToggleSecure,
  keyboardType,
  autoCapitalize,
}) {
  return (
    <View style={styles.stackField}>
      <Icon
        name={icon}
        size={21}
        color={C.ink}
        style={{ marginRight: 13, marginTop: 4 }}
      />
      <View style={{ flex: 1 }}>
        <T w={500} s={11.5} color={C.muted}>
          {label}
        </T>
        <Field
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secure={secure}
          visible={visible}
          onToggleSecure={onToggleSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ marginBottom: 0, marginTop: 2 }}
        />
      </View>
    </View>
  );
}

function SocialButton({ icon, label, onPress, tint }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.social,
        pressed && { backgroundColor: "#FAFAFE", transform: [{ scale: 0.99 }] },
      ]}
    >
      <Icon name={icon} size={20} color={tint} />
      <T w={700} s={14} color={C.ink} style={{ marginLeft: 9 }}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 20,
    flexGrow: 1,
  },
  blobTopRight: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(140,110,255,0.13)",
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -110,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(140,110,255,0.10)",
  },
  dotA: {
    position: "absolute",
    top: 120,
    left: 26,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(140,110,255,0.35)",
  },
  dotB: {
    position: "absolute",
    bottom: 210,
    right: 40,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(140,110,255,0.30)",
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  stackField: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 13,
  },
  terms: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: { backgroundColor: C.purple, borderColor: C.purple },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFECEF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EAE8F2" },
  social: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#fff",
  },
  demoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: C.purpleSoft,
    borderWidth: 1,
    borderColor: "#E2DAFF",
  },
  solidButton: {
    backgroundColor: "#604fe8",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
