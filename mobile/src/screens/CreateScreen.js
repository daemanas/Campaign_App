// Create campaign wizard: three steps, a real image picker, a draft written to
// storage as you type, and a submit that creates an actual campaign record.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { pickPhoto } from '../utils/imagePicker';
import { useApp, logic } from '../store/AppStore';
import { isImgRef } from '../store/persistence';
import { artRef } from '../assets/images';
import { C, CATEGORY_COLORS, money } from '../theme/theme';
import { CATEGORIES, DURATIONS } from '../store/seed';
import { Icon } from '../components/Icon';
import { Avatar, SmartImage } from '../components/SmartImage';
import { CampaignCard } from '../components/CampaignCard';
import { Card, Divider, Field, GradButton, IconButton, Progress, Screen, SoftButton, T,Pill } from '../components/ui';

const GOAL_PRESETS = [10000, 25000, 50000, 100000];
const STEPS = ['Basics', 'Story', 'Preview'];

// Bundled artwork, so a device with no photos can still finish a campaign.
// Stored as `asset://<name>` refs, which stay valid across rebuilds.
const COVER_PRESETS = [
  { label: 'Environment', ref: artRef('cleanRivers') },
  { label: 'Education', ref: artRef('ruralClassroom') },
  { label: 'Health', ref: artRef('healthCamp') },
  { label: 'Animals', ref: artRef('strayDog') },
  { label: 'Community', ref: artRef('foodDrive') },
];

export default function CreateScreen({ navigation, route }) {
  const app = useApp();
  const saveDraftProgress = app.saveDraftProgress;
  const drafts = app.selectors.drafts();
  const wanted = route.params?.draftId ? drafts.find((d) => d.id === route.params.draftId) : null;
  const starting = wanted || drafts[0] || app.newDraft();

  const draftRef = useRef(starting);
  const closedRef = useRef(false);
  const timer = useRef(null);
  const [draft, setDraft] = useState(starting);
  const [step, setStep] = useState(starting.step || 1);
  const [error, setError] = useState(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [liveId, setLiveId] = useState(null);

  const persist = useCallback(
    (next) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => saveDraftProgress(next), 400);
    },
    [saveDraftProgress]
  );

  const patch = useCallback(
    (changes) => {
      const next = { ...draftRef.current, ...changes, updatedAt: Date.now() };
      draftRef.current = next;
      setDraft(next);
      setError(null);
      persist(next);
    },
    [persist]
  );

  // Leaving the wizard (back button, tab switch) still keeps what was typed.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (!closedRef.current && hasContent(draftRef.current)) saveDraftProgress(draftRef.current);
    },
    [saveDraftProgress]
  );

  const goStep = (n) => {
    patch({ step: n });
    setStep(n);
  };

  const next = () => {
    const err = step === 1 ? logic.validateStep1(draft) : logic.validateStep2(draft);
    if (err) return setError(err);
    goStep(step + 1);
  };

  const submit = () => {
    setBusy(true);
    saveDraftProgress(draft);
    const res = app.publishDraft(draft.id);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      if (logic.validateStep1(draft)) goStep(1);
      else goStep(2);
      return;
    }
    closedRef.current = true;
    setLiveId(res.campaign.id);
  };

  const keepDraft = () => {
    saveDraftProgress(draft);
    closedRef.current = true;
    navigation.goBack();
  };

  const discard = () => {
    if (draft.cover) app.removeImage(draft.cover);
    closedRef.current = true;
    app.discardDraft(draft.id);
    navigation.goBack();
  };

  const storePhoto = async (base64) => {
    try {
      const ref = await app.putImage(base64);
      if (draft.cover) app.removeImage(draft.cover);
      patch({ cover: ref });
    } catch (e) {
      setError(e.message || 'Could not store the photo on this device.');
    }
  };

  const pickImage = () => {
    setError(null);
    setPicking(true);
    pickPhoto({
      onPhoto: (asset) => {
        setPicking(false);
        storePhoto(asset.base64);
      },
      onCancel: () => setPicking(false),
      onError: (message) => {
        setPicking(false);
        setError(message);
      },
    });
  };

  if (liveId) return <Published id={liveId} navigation={navigation} app={app} />;

  const goal = Number(draft.goalAmount) || 0;

  return (
    <Screen bg={C.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.head}>
          <IconButton icon="arrow-left" bg="#fff" border onPress={() => (step === 1 ? navigation.goBack() : goStep(step - 1))} />
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <T w={800} s={17} color={C.ink}>
              Create Campaign
            </T>
            <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
              Step {step} of 3 · {STEPS[step - 1]}
            </T>
          </View>
          <Pressable onPress={keepDraft} hitSlop={10}>
            <T w={700} s={12.5} color={C.purple}>
              Save draft
            </T>
          </Pressable>
        </View>

        <View style={styles.rail}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            return (
              <View key={label} style={styles.railItem}>
                {n < 3 ? <View style={[styles.railLine, n < step && styles.railLineOn]} /> : null}
                <Pressable onPress={() => n < step && goStep(n)} disabled={n >= step} style={styles.railDotWrap}>
                  <View style={[styles.railDot, n <= step && styles.railDotOn]}>
                    <Icon
                      name={n < step ? 'check' : 'circle-small'}
                      size={n < step ? 16 : 13}
                      color={n <= step ? '#fff' : '#B9B6C9'}
                    />
                  </View>
                </Pressable>
                <T w={700} s={11} color={n === step ? C.ink : C.mutedLight} style={{ marginTop: 6 }}>
                  {label}
                </T>
              </View>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pad}>
          {step === 1 ? (
            <StepBasics draft={draft} goal={goal} patch={patch} pickImage={pickImage} picking={picking} onPreset={(s) => patch({ cover: s })} removeImage={app.removeImage} />
          ) : null}
          {step === 2 ? <StepStory draft={draft} patch={patch} error={error} /> : null}
          {step === 3 ? <StepPreview draft={draft} goal={goal} app={app} /> : null}

          {error ? (
            <View style={styles.error}>
              <Icon name="alert-circle-outline" size={16} color={C.red} />
              <T w={600} s={12.5} color={C.red} style={{ flex: 1, marginLeft: 8 }}>
                {error}
              </T>
            </View>
          ) : null}

          <View style={{ marginTop: 22 }}>
            {step < 3 ? (
              <GradButton label={step === 1 ? 'Continue to story' : 'Preview campaign'} arrow onPress={next} />
            ) : (
              <GradButton label="Submit campaign" icon="rocket-launch-outline" loading={busy} onPress={submit} />
            )}
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              {step > 1 ? (
                <SoftButton label="Back" icon="chevron-left" style={{ flex: 1, marginRight: 8 }} onPress={() => goStep(step - 1)} />
              ) : null}
              <SoftButton label="Keep as draft" icon="content-save-outline" color={C.muted} bg="#F2F1F7" style={{ flex: 1 }} onPress={keepDraft} />
            </View>
            {hasContent(draft) ? (
              <Pressable onPress={discard} hitSlop={8} style={{ marginTop: 16, alignSelf: 'center' }}>
                <T w={600} s={12.5} color={C.red}>
                  Delete this draft
                </T>
              </Pressable>
            ) : null}
          </View>

          <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 20, textAlign: 'center', lineHeight: 17 }}>
            Drafts and submitted campaigns are stored on this device only.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/* ------------------------------------------------------------------- steps */

function StepBasics({ draft, goal, patch, pickImage, picking, onPreset, removeImage }) {
  return (
    <View>
      <T w={700} s={13.5} color={C.ink} style={{ marginBottom: 8 }}>
        Cover image
      </T>
      <Pressable onPress={picking ? undefined : pickImage} style={({ pressed }) => [styles.cover, pressed && { opacity: 0.96 }]}>
        {draft.cover ? (
          <>
            <SmartImage source={draft.cover} category={draft.category || 'Community'} resizeMode="cover" style={{width: '100%', height: '100%'}} />
            <View style={styles.coverBar}>
              <T w={700} s={12.5} color="#fff">
                Tap to replace
              </T>
              <Pressable
                onPress={() => {
                  if (isImgRef(draft.cover)) removeImage(draft.cover);
                  patch({ cover: null });
                }}
                hitSlop={10}
                style={styles.coverRemove}
              >
                <Icon name="trash-can-outline" size={15} color="#fff" />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.coverEmpty}>
            <View style={styles.coverIcon}>
              <Icon name={picking ? 'progress-circle' : 'image-plus'} size={22} color={C.purple} />
            </View>
            <T w={700} s={14} color={C.ink} style={{ marginTop: 10 }}>
              {picking ? 'Opening your gallery…' : 'Add cover image'}
            </T>
            <T w={400} s={12} color={C.muted} style={{ marginTop: 4, textAlign: 'center', lineHeight: 17 }}>
              Choose a photo that best represents your campaign. Stored on this device.
            </T>
          </View>
        )}
      </Pressable>

      <View style={styles.presets}>
        {COVER_PRESETS.map((p) => (
          <Pressable
            key={p.ref}
            onPress={() => onPreset(p.ref)}
            style={({ pressed }) => [
              styles.preset,
              draft.cover === p.ref && styles.presetOn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <SmartImage 
              source={p.ref} 
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }} 
            />
          </Pressable>
        ))}
      </View>
      <T w={400} s={11} color={C.mutedLight} style={{ marginTop: 6, marginBottom: 16 }}>
        Demo artwork — tap one if this device has no photos yet.
      </T>

      <Field
        label="Campaign title"
        icon="text-short"
        value={draft.title}
        onChangeText={(v) => patch({ title: v })}
        placeholder="Give your campaign a clear title"
        maxLength={70}
        counter={draft.title.length + '/70'}
      />

      <T w={700} s={13.5} color={C.ink} style={{ marginBottom: 10 }}>
        Category
      </T>
      <View style={styles.cats}>
        {CATEGORIES.map((c) => {
          const on = draft.category === c.id;
          const col = CATEGORY_COLORS[c.id];
          return (
            <Pressable
              key={c.id}
              onPress={() => patch({ category: c.id })}
              style={({ pressed }) => [styles.cat, { backgroundColor: on ? col.bg : '#fff', borderColor: on ? col.fg : C.border }, pressed && { opacity: 0.92 }]}
            >
              <Icon name={c.icon} size={18} color={col.fg} />
              <T w={700} s={8} color={on ? col.fg : C.inkSoft} style={{ marginTop: 6, textAlign: 'center' }}>
                {c.label}
              </T>
            </Pressable>
          );
        })}
      </View>

      <T w={700} s={13.5} color={C.ink} style={{ marginVertical: 10 }}>
        Target amount (₹)
      </T>
      <View style={styles.goalRow}>
        {GOAL_PRESETS.map((v) => (
          <Pressable
            key={v}
            onPress={() => patch({ goalAmount: String(v) })}
            style={({ pressed }) => [styles.goalPreset, String(v) === draft.goalAmount && styles.goalPresetOn, pressed && { opacity: 0.9 }]}
          >
            <T w={700} s={12} color={String(v) === draft.goalAmount ? '#fff' : C.inkSoft}>
              {money(v)}
            </T>
          </Pressable>
        ))}
      </View>
      <View style={styles.goalInput}>
        <T w={700} s={16} color={C.muted}>
          ₹
        </T>
        <TextInput
          value={draft.goalAmount}
          onChangeText={(v) => patch({ goalAmount: v.replace(/[^0-9]/g, '') })}
          placeholder="e.g. 100000"
          placeholderTextColor="#A6A4B8"
          keyboardType="numeric"
          maxLength={9}
          style={styles.goalField}
        />
        {draft.goalAmount ? (
          <Pressable onPress={() => patch({ goalAmount: '' })} hitSlop={10}>
            <Icon name="close-circle" size={18} color={C.mutedLight} />
          </Pressable>
        ) : null}
      </View>
      {goal ? (
        <T w={500} s={11.5} color={C.muted} style={{ marginTop: 8 }}>
          {money(goal)} target{draft.days ? ' · about ' + money(Math.round(goal / draft.days)) + ' a day over ' + draft.days + ' days' : ''}
        </T>
      ) : null}

      <T w={700} s={13.5} color={C.ink} style={{ marginVertical: 10, marginTop: 16 }}>
        Campaign duration
      </T>
      <View style={styles.durations}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => patch({ days: d.id })}
            style={({ pressed }) => [styles.duration, draft.days === d.id && styles.durationOn, pressed && { opacity: 0.9 }]}
          >
            <T w={700} s={12.5} color={draft.days === d.id ? '#fff' : C.inkSoft}>
              {d.label}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function StepStory({ draft, patch, error }) {
  const len = draft.description.length;
  return (
    <View>
      <Field
        label="One-line summary"
        icon="format-title"
        value={draft.summary}
        onChangeText={(v) => patch({ summary: v })}
        placeholder="Shown on every card in the feed"
        maxLength={140}
        counter={draft.summary.length + '/140'}
      />
      <Field
        label="Full description"
        icon="text-long"
        value={draft.description}
        onChangeText={(v) => patch({ description: v })}
        placeholder="Tell people why this cause matters and how funds will be used…"
        multi
        maxLength={logic.MAX_DESCRIPTION}
        counter={len + '/' + logic.MAX_DESCRIPTION}
        hint={len < 40 ? 'At least 40 characters — ' + (40 - len) + ' to go.' : undefined}
      />
      <Field
        label="Location"
        icon="map-marker-outline"
        value={draft.location}
        onChangeText={(v) => patch({ location: v })}
        placeholder="City or area this campaign serves"
        maxLength={60}
      />
      <Field
        label="Tags (optional)"
        icon="tag-outline"
        value={draft.tagsText}
        onChangeText={(v) => patch({ tagsText: v })}
        placeholder="water, schools, volunteers"
        maxLength={80}
        hint="Separate with commas — up to 6 tags."
      />
      <Field
        label="First update (optional)"
        icon="bullhorn-outline"
        value={draft.updatesText}
        onChangeText={(v) => patch({ updatesText: v })}
        placeholder="Where the project stands today"
        multi
        maxLength={280}
        style={{ minHeight: 90 }}
      />
      <Guidelines agreed={draft.agreed} onToggle={() => patch({ agreed: !draft.agreed })} missing={!!error && !draft.agreed} />
    </View>
  );
}

function Guidelines({ agreed, onToggle, missing }) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.guides, missing && { borderColor: C.red }, agreed && { borderColor: '#CDBFFF', backgroundColor: C.purpleSoft }]}
    >
      <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
        {agreed ? <Icon name="check" size={13} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <T w={700} s={13} color={C.ink}>
          I agree to the campaign guidelines
        </T>
        <T w={400} s={11.5} color={C.muted} style={{ marginTop: 3, lineHeight: 17 }}>
          Funds are used as described, honest updates are posted, and no real payment details are collected in this demo.
        </T>
      </View>
    </Pressable>
  );
}

// function StepPreview({ draft, goal, app }) {
//   const preview = {
//     id: 'preview',
//     title: draft.title || 'Untitled campaign',
//     summary: draft.summary || 'Your one-line summary appears here.',
//     description: draft.description,
//     category: draft.category || 'Community',
//     goalAmount: goal,
//     raisedAmount: 0,
//     supporters: 0,
//     percent: 0,
//     daysLeft: draft.days || 0,
//     remaining: goal,
//     cover: draft.cover,
//     gallery: draft.cover ? [draft.cover] : [],
//     tags: splitTags(draft.tagsText),
//     location: draft.location,
//     status: 'active',
//     organizer: {
//       id: app.actor,
//       name: app.user ? app.user.name : 'You',
//       tagline: 'Campaign organizer',
//       verified: !!(app.user && app.user.verified),
//       avatar: app.user ? app.user.avatar : null,
//       followers: 0,
//     },
//   };
//   const checks = [
//     [!!draft.cover, 'Cover image'],
//     [draft.title.trim().length >= 6, 'Title of 6+ characters'],
//     [!!draft.category, 'Category chosen'],
//     [goal >= 1000, 'Target of at least ₹1,000'],
//     [!!draft.days, 'Duration chosen'],
//     [draft.summary.trim().length >= 15, 'Summary of 15+ characters'],
//     [draft.description.trim().length >= 40, 'Description of 40+ characters'],
//     [draft.location.trim().length >= 3, 'Location'],
//     [!!draft.agreed, 'Guidelines accepted'],
//   ];

//   return (
//     <View>
//       <T w={400} s={12.5} color={C.muted} style={{ marginBottom: 12, lineHeight: 18 }}>
//         This is how your campaign will appear in Home and Explore after you submit.
//       </T>
//       <CampaignCard c={preview} variant="featured" saved={false} />

//       <Card style={{ padding: 16 }}>
//         <T w={800} s={15} color={C.ink}>
//           Before you submit
//         </T>
//         <Divider />
//         {checks.map(([ok, label]) => (
//           <View key={label} style={styles.checkRow}>
//             <Icon name={ok ? 'check-circle' : 'checkbox-blank-circle-outline'} size={17} color={ok ? C.green : C.mutedLight} />
//             <T w={600} s={13} color={ok ? C.ink : C.muted} style={{ marginLeft: 10, flex: 1 }}>
//               {label}
//             </T>
//             <T w={700} s={11} color={ok ? C.green : C.amber}>
//               {ok ? 'Ready' : 'Needed'}
//             </T>
//           </View>
//         ))}
//         <Divider />
//         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//           <Avatar source={preview.organizer.avatar} name={preview.organizer.name} size={36} />
//           <View style={{ flex: 1, marginLeft: 11 }}>
//             <T w={700} s={13.5} color={C.ink}>
//               {preview.organizer.name}
//             </T>
//             <T w={400} s={11.5} color={C.muted}>
//               Shown as the campaign organizer
//             </T>
//           </View>
//         </View>
//         <View style={{ marginTop: 16 }}>
//           <Progress percent={0} />
//           <T w={500} s={11.5} color={C.muted} style={{ marginTop: 9 }}>
//             Launches at {money(0)} raised · goal {money(goal)} · {draft.days || 0} days
//           </T>
//         </View>
//       </Card>
//     </View>
//   );
// }

function StepPreview({ draft, goal, app }) {
  const cat = CATEGORY_COLORS[draft.category] || CATEGORY_COLORS.Community;
  const numericGoal = Number(draft.goalAmount) || 0;
  
  // Estimation calculation based on the image provided
  const estimatedPeople = Math.round(numericGoal * 27);

  return (
    <View>
      <T w={400} s={12.5} color={C.muted} style={{ marginBottom: 12, lineHeight: 18 }}>
        This is how your campaign will appear in Home and Explore after you submit.
      </T>

      {/* Campaign Card Preview */}
      <View style={styles.previewCard}>
        <View style={styles.previewImageWrap}>
          <SmartImage
            source={draft.cover}
            category={draft.category || 'Community'}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
          <View style={styles.previewCatPill}>
            <Pill
              label={draft.category || 'Community'}
              icon={cat.icon}
              fg={cat.fg}
              bg="#f4f4f4"
              size={9.5}
            />
          </View>
          <View style={styles.previewBookmark}>
            <Icon name="bookmark-outline" size={14} color="#fff" />
          </View>
        </View>

        <View style={{ padding: 14 }}>
          <T w={800} s={15} color={C.ink} numberOfLines={1}>
            {draft.title || 'Untitled campaign'}
          </T>
          
          <T w={400} s={11.5} color={C.muted} numberOfLines={2} style={{ marginTop: 4, lineHeight: 17 }}>
            {draft.summary || 'Your one-line summary appears here.'}
          </T>

          <Progress percent={0} height={4} style={{ marginTop: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <View>
              <T w={800} s={14} color={C.purple}>
                ₹0 <T w={500} s={11} color={C.muted}>raised of {money(goal)}</T>
              </T>
            </View>
            <T w={700} s={11} color={C.purple}>
              0%
            </T>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Icon name="account-group-outline" size={13} color={C.mutedLight} />
            <T w={600} s={11} color={C.inkSoft} style={{ marginLeft: 4 }}>
              0 supporters
            </T>
          </View>
        </View>
      </View>

      {/* NEW ESTIMATED REACH SECTION */}
      <Card style={{ padding: 16, marginTop: 16, backgroundColor: '#F8F7FC' }}>
        <T w={700} s={11} color={C.purple} style={{ letterSpacing: 0.8 }}>
          ESTIMATED REACH AT GOAL
        </T>
        <T w={800} s={24} color={C.ink} style={{ marginTop: 4 }}>
          {estimatedPeople.toLocaleString()} people
        </T>
        <T w={400} s={12.5} color={C.muted} style={{ marginTop: 6, lineHeight: 18 }}>
          {money(numericGoal)} raised puts this message in front of about {estimatedPeople.toLocaleString()} people. $1 = about 27 people.
        </T>
        <T w={400} s={10.5} color={C.mutedLight} style={{ marginTop: 8, lineHeight: 15 }}>
          Estimate only — based on the current platform rate, after the 20% platform fee and payment processing. Actual delivery varies with your audience and the ad auction.
        </T>
      </Card>

      {/* Before you submit Checklist */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <T w={800} s={15} color={C.ink}>
          Before you submit
        </T>
        <Divider />
        {[
          [!!draft.cover, 'Cover image'],
          [draft.title.trim().length >= 6, 'Title of 6+ characters'],
          [!!draft.category, 'Category chosen'],
          [goal >= 1000, 'Target of at least ₹1,000'],
          [!!draft.days, 'Duration chosen'],
          [draft.summary.trim().length >= 15, 'Summary of 15+ characters'],
          [draft.description.trim().length >= 40, 'Description of 40+ characters'],
          [draft.location.trim().length >= 3, 'Location'],
          [!!draft.agreed, 'Guidelines accepted'],
        ].map(([ok, label]) => (
          <View key={label} style={styles.checkRow}>
            <Icon name={ok ? 'check-circle' : 'checkbox-blank-circle-outline'} size={17} color={ok ? C.green : C.mutedLight} />
            <T w={600} s={13} color={ok ? C.ink : C.muted} style={{ marginLeft: 10, flex: 1 }}>
              {label}
            </T>
            <T w={700} s={11} color={ok ? C.green : C.amber}>
              {ok ? 'Ready' : 'Needed'}
            </T>
          </View>
        ))}
      </Card>
    </View>
  );
}




function Published({ id, navigation, app }) {
  const c = app.selectors.campaignView(id);
  if (!c) {
    return (
      <Screen bg={C.bg}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <T w={700} s={15} color={C.ink}>
            Your campaign was saved.
          </T>
          <SoftButton label="Back to Home" style={{ marginTop: 16 }} onPress={() => navigation.navigate('Tabs')} />
        </View>
      </Screen>
    );
  }
  const stats = app.selectors.stats();
  return (
    <Screen bg={C.bg}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={styles.check}>
          <Icon name="check-bold" size={30} color="#fff" />
        </View>
        <T w={800} s={23} color={C.ink} style={{ marginTop: 18, textAlign: 'center' }}>
          Your campaign is live
        </T>
        <T w={400} s={13.5} color={C.muted} style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Saved on this device — it now appears in Home, Explore and your profile.
        </T>
        <Card style={{ marginTop: 22, padding: 14 }}>
          <T w={700} s={15} color={C.ink} numberOfLines={2}>
            {c.title}
          </T>
          <T w={500} s={12.5} color={C.muted} style={{ marginTop: 6 }}>
            {c.category} · goal {money(c.goalAmount)} · {c.daysLeft} days
          </T>
          <Divider />
          <View style={{ flexDirection: 'row' }}>
            <MiniStat value={String(stats.created)} label="campaigns created" />
            <MiniStat value={String(stats.drafts)} label="drafts" />
            <MiniStat value={money(c.raisedAmount)} label="raised so far" />
          </View>
        </Card>
        <GradButton label="View my campaign" arrow style={{ marginTop: 22 }} onPress={() => navigation.replace('Detail', { id })} />
        <SoftButton label="Back to Home" style={{ marginTop: 10 }} onPress={() => navigation.navigate('Tabs')} />
      </View>
    </Screen>
  );
}

function MiniStat({ value, label }) {
  return (
    <View style={{ flex: 1 }}>
      <T w={800} s={14} color={C.ink}>
        {value}
      </T>
      <T w={500} s={10.5} color={C.muted} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}

/* -------------------------------------------------------------------- bits */

function hasContent(d) {
  return !!(d.title || d.description || d.summary || d.category || d.goalAmount || d.cover);
}

function splitTags(text) {
  return String(text || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/* ------------------------------------------------------------------- style */

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  rail: { flexDirection: 'row', paddingHorizontal: 22, marginTop: 16 },
  railItem: { flex: 1, alignItems: 'center', position: 'relative' },
  railDotWrap: { hitSlop: 8 },
  railDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E7E5F0', alignItems: 'center', justifyContent: 'center' },
  railDotOn: { backgroundColor: C.purple },
  railLine: { position: 'absolute', left: '50%', right: '-50%', top: 12, height: 2, backgroundColor: '#E7E5F0' },
  railLineOn: { backgroundColor: C.purple },
  pad: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 50 },
  cover: {
    height: 170,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CFC9E6',
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
  },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  coverIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  coverBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    backgroundColor: 'rgba(18,16,38,0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  coverRemove: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presets: { flexDirection: 'row', gap: 8, marginTop: 10 },
  preset: {
    width: '14.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#EFEDF7',
  },
  presetOn: { borderColor: C.purple },
  cats: { flexDirection: 'row', gap: 7 },
  cat: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  goalRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  goalPreset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
  },
  goalPresetOn: { backgroundColor: C.purple, borderColor: C.purple },
  goalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  goalField: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: C.ink,
    paddingVertical: 15,
    marginLeft: 8,
  },
  durations: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  duration: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  durationOn: { backgroundColor: C.purple, borderColor: C.purple },
  guides: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CFC9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: C.purple, borderColor: C.purple },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9EC',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  check: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: C.green,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFF6',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  previewImageWrap: {
    width: '100%',
    height: 165, // পারফেক্ট ব্যালেন্সড ইমেজ হাইট
    position: 'relative',
    backgroundColor: '#F3F0FC',
    overflow: 'hidden',
  },
  previewCatPill: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  previewBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
