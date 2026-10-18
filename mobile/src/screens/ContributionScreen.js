// Support flow: choose an amount, review it, then confirm. Nothing is written
// to the store until the confirm step, so progress never inflates early and a
// cancelled flow leaves no record behind.
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useApp, logic } from "../store/AppStore";
import { C, money } from "../theme/theme";
import { Icon } from "../components/Icon";
import { SmartImage } from "../components/SmartImage";
import {
  Card,
  Divider,
  GradButton,
  IconButton,
  Progress,
  Screen,
  SoftButton,
  T,
} from "../components/ui";

const PRESETS = [100, 250, 500, 1000, 2500, 5000];

export default function ContributionScreen({ navigation, route }) {
  const app = useApp();
  const id = route.params?.id;
  const c = app.selectors.campaignView(id);

  const [step, setStep] = useState("amount");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState(app.user ? app.user.name : "");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const numeric = Number(amount || 0);
  const after = useMemo(() => {
    if (!c) return null;
    return {
      raised: c.raisedAmount + numeric,
      percent: c.goalAmount
        ? Math.round(((c.raisedAmount + numeric) / c.goalAmount) * 100)
        : 0,
    };
  }, [c, numeric]);

  if (!c) {
    return (
      <Screen bg={C.bg}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <T w={700} s={16} color={C.ink}>
            This campaign is no longer available.
          </T>
          <SoftButton
            label="Go back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </Screen>
    );
  }

  const pick = (v) => {
    setError(null);
    setAmount(String(v));
  };

  const toReview = () => {
    const err = logic.validateContribution(numeric, c);
    if (err) return setError(err);
    setError(null);
    setStep("review");
  };

  const confirm = () => {
    const err = logic.validateContribution(numeric, c);
    if (err) {
      setError(err);
      return setStep("amount");
    }
    const res = app.contribute({
      campaignId: c.id,
      amount: numeric,
      name: name.trim() || undefined,
    });
    if (res.error) {
      setError(res.error);
      return setStep("amount");
    }
    setError(null);
    setDone(res.contribution);
    setStep("done");
  };

  return (
    <Screen bg={C.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.head}>
          <IconButton
            icon="arrow-left"
            bg="#fff"
            border
            onPress={() =>
              step === "review" ? setStep("amount") : navigation.goBack()
            }
          />
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <T w={800} s={17} color={C.ink}>
              {step === "amount"
                ? "Support this campaign"
                : step === "review"
                  ? "Review your support"
                  : "Support complete"}
            </T>
            <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
              {step === "amount"
                ? "Step 1 of 2 · choose an amount"
                : step === "review"
                  ? "Step 2 of 2 · confirm the demo payment"
                  : "Recorded on this device"}
            </T>
          </View>
          <View style={styles.stepPips}>
            <View style={[styles.pip, step !== "done" && styles.pipOn]} />
            <View
              style={[
                styles.pip,
                (step === "review" || step === "done") && styles.pipOn,
              ]}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pad}
          keyboardShouldPersistTaps="handled"
        >
          <MiniCampaign c={c} />

          {step === "amount" ? (
            <AmountStep
              amount={amount}
              onAmount={(v) => {
                setError(null);
                setAmount(v.replace(/[^0-9]/g, ""));
              }}
              onPick={pick}
              after={after}
              error={error}
            />
          ) : null}

          {step === "review" ? (
            <ReviewStep
              c={c}
              amount={numeric}
              name={name}
              setName={setName}
              error={error}
            />
          ) : null}

          {step === "done" && done ? (
            <DoneStep c={c} done={done} navigation={navigation} />
          ) : null}

          {step !== "done" ? (
            <View style={{ marginTop: 22 }}>
              {error ? (
                <View style={styles.error}>
                  <Icon name="alert-circle-outline" size={16} color={C.red} />
                  <T
                    w={600}
                    s={12.5}
                    color={C.red}
                    style={{ flex: 1, marginLeft: 8 }}
                  >
                    {error}
                  </T>
                </View>
              ) : null}

              {step === "amount" ? (
                <GradButton
                  label="Continue to review"
                  arrow
                  disabled={!numeric}
                  onPress={toReview}
                />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <SoftButton
                    label="Cancel"
                    style={{ flex: 1, marginRight: 10 }}
                    onPress={() => setStep("amount")}
                  />
                  <GradButton
                    label="Confirm and support"
                    icon="shield-check-outline"
                    style={{ flex: 2 }}
                    onPress={confirm}
                  />
                </View>
              )}

              <DemoNotice />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* --------- steps */

function MiniCampaign({ c }) {
  return (
    <Card style={{ flexDirection: "row", padding: 12, marginBottom: 18 }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: "#EFEDF7",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SmartImage
          source={c.cover}
          category={c.category}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
        <T w={700} s={14.5} color={C.ink} numberOfLines={2}>
          {c.title}
        </T>
        <T w={500} s={12} color={C.muted} style={{ marginTop: 4 }}>
          {money(c.raisedAmount)} of {money(c.goalAmount)} · {c.percent}%
        </T>
      </View>
    </Card>
  );
}

function AmountStep({ amount, onAmount, onPick, after, error }) {
  return (
    <View>
      <T w={700} s={13.5} color={C.ink} style={{ marginBottom: 10 }}>
        Select or enter amount (₹)
      </T>
      <View style={styles.grid}>
        {PRESETS.map((v) => (
          <Pressable
            key={v}
            onPress={() => onPick(v)}
            style={({ pressed }) => [
              styles.preset,
              amount === String(v) && styles.presetOn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <T w={700} s={15} color={amount === String(v) ? "#fff" : C.ink}>
              ₹{v.toLocaleString("en-IN")}
            </T>
          </Pressable>
        ))}
      </View>

      <View style={[styles.inputRow, error && { borderColor: C.red }]}>
        <T w={700} s={17} color={C.muted}>
          ₹
        </T>
        <TextInput
          value={amount}
          onChangeText={onAmount}
          placeholder="Enter a custom amount"
          placeholderTextColor="#A6A4B8"
          keyboardType="numeric"
          maxLength={7}
          style={styles.input}
        />
        {amount ? (
          <Pressable onPress={() => onAmount("")} hitSlop={10}>
            <Icon name="close-circle" size={18} color={C.mutedLight} />
          </Pressable>
        ) : null}
      </View>
      <T w={500} s={11.5} color={C.mutedLight} style={{ marginTop: 8 }}>
        Minimum {money(logic.MIN_CONTRIBUTION)} · this is a simulated payment,
        no money moves.
      </T>

      {amount && !error ? (
        <View style={styles.preview}>
          <View style={{ flex: 1 }}>
            <T w={500} s={12} color={C.muted}>
              Campaign progress after your support
            </T>
            <T w={800} s={15} color={C.purple} style={{ marginTop: 5 }}>
              {money(after.raised)}
            </T>
          </View>
          <T w={800} s={15} color={C.ink}>
            {after.percent}%
          </T>
        </View>
      ) : null}
      {amount && !error ? (
        <Progress
          percent={Math.min(100, after.percent)}
          style={{ marginTop: 10 }}
        />
      ) : null}
    </View>
  );
}

function ReviewStep({ c, amount, name, setName, error }) {
  const percentAfter = c.goalAmount
    ? Math.round(((c.raisedAmount + amount) / c.goalAmount) * 100)
    : 0;
  return (
    <Card style={{ padding: 18 }}>
      <T w={800} s={16} color={C.ink}>
        You are supporting
      </T>
      <T
        w={400}
        s={13}
        color={C.muted}
        style={{ marginTop: 4, lineHeight: 19 }}
        numberOfLines={2}
      >
        {c.title}
      </T>
      <Divider />
      <Row label="Amount" value={money(amount)} strong />
      <Row label="Campaign goal" value={money(c.goalAmount)} />
      <Row label="Progress after" value={Math.min(100, percentAfter) + "%"} />
      <Row label="Platform fee" value="None — demo" />
      <Row label="Payment method" value="Simulated (no card)" />
      <Divider />

      <T w={700} s={13.5} color={C.ink} style={{ marginBottom: 8 }}>
        Show my support as
      </T>
      <View style={[styles.inputRow, error && { borderColor: C.red }]}>
        <Icon
          name="account-outline"
          size={17}
          color={C.mutedLight}
          style={{ marginRight: 8 }}
        />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#A6A4B8"
          maxLength={40}
          style={styles.input}
        />
      </View>
      <T w={500} s={11.5} color={C.mutedLight} style={{ marginTop: 6 }}>
        Left blank, this record is saved as “Guest supporter”.
      </T>
      {error ? (
        <T w={600} s={12} color={C.red} style={{ marginTop: 10 }}>
          {error}
        </T>
      ) : null}
    </Card>
  );
}

function DoneStep({ c, done, navigation }) {
  return (
    <View>
      <Card style={{ padding: 24, alignItems: "center" }}>
        <View style={styles.check}>
          <Icon name="check" size={30} color="#fff" />
        </View>
        <T w={800} s={20} color={C.ink} style={{ marginTop: 16 }}>
          {money(done.amount)} support recorded
        </T>
        <T
          w={400}
          s={13}
          color={C.muted}
          style={{ marginTop: 7, textAlign: "center", lineHeight: 20 }}
        >
          Saved to your contribution history on this device. This is a simulated
          payment — no real money moved.
        </T>
        <Divider style={{ marginVertical: 18, width: "100%" }} />
        <View style={{ width: "100%" }}>
          <Row label="Campaign" value={c.title} />
          <Row
            label="New progress"
            value={money(c.raisedAmount) + " · " + c.percent + "%"}
            strong
          />
          <Row label="Supporters" value={String(c.supporters)} />
          <Row label="Reference" value={done.id} mono />
        </View>
        <Progress
          percent={Math.min(100, c.percent)}
          style={{ marginTop: 14, width: "100%" }}
        />
      </Card>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 22 }}>
        <SoftButton
          label="My activity"
          icon="bell-outline"
          style={{ flex: 1, marginRight: 10 }}
          onPress={() => navigation.navigate("Tabs", { screen: "Activity" })}
        />
        <GradButton
          label="Back campaign"
          style={{ flex: 2, height: 55 }}
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
}

function Row({ label, value, strong, mono }) {
  return (
    <View style={styles.row}>
      <T w={500} s={13} color={C.muted}>
        {label}
      </T>
      <T
        w={strong ? 800 : 600}
        s={strong ? 14 : 13}
        color={strong ? C.purple : C.ink}
        style={
          mono
            ? { fontFamily: "monospace", fontSize: 11.5 }
            : { flexShrink: 1, marginLeft: 12, textAlign: "right" }
        }
        numberOfLines={1}
      >
        {value}
      </T>
    </View>
  );
}

function DemoNotice() {
  return (
    <View style={styles.notice}>
      <Icon name="information-outline" size={16} color={C.purple} />
      <T
        w={500}
        s={11.5}
        color={C.inkSoft}
        style={{ flex: 1, marginLeft: 9, lineHeight: 17 }}
      >
        Amplify demo build: contributions are stored locally to show how
        progress, history and profile statistics update. No card, UPI or wallet
        details are collected.
      </T>
    </View>
  );
}

/* ------------------------------------------------------------------- style */

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepPips: { flexDirection: "row" },
  pip: {
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2DFEF",
    marginLeft: 5,
  },
  pipOn: { backgroundColor: C.purple },
  pad: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 44 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  preset: {
    width: "31%",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: "3.5%",
    marginBottom: 10,
  },
  presetOn: { backgroundColor: C.purple, borderColor: C.purple },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: C.ink,
    paddingVertical: 15,
    marginLeft: 8,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: C.purpleSoft,
    borderRadius: 16,
    padding: 14,
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE9EC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderSoft,
    padding: 13,
    marginTop: 14,
  },
  check: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
});
