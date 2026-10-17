// Edit profile: photo, banner, name, username, bio and location. Everything is
// validated before it reaches the store, and the store is what every other
// screen reads — so the new details show up app-wide and survive a restart.
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { useApp, logic } from '../store/AppStore';
import { useGate } from '../navigation/gate';
import { isImgRef } from '../store/persistence';
import { pickPhoto } from '../utils/imagePicker';
import { C } from '../theme/theme';
import { Icon } from '../components/Icon';
import { Avatar, SmartImage } from '../components/SmartImage';
import { Card, Field, GradButton, IconButton, Screen, SoftButton, T } from '../components/ui';

const MAX_BIO = 220;
const MAX_LOCATION = 60;

export default function EditProfileScreen({ navigation }) {
  const app = useApp();
  const gate = useGate();
  const user = app.user;

  const [form, setForm] = useState(() => ({
    name: user ? user.name : '',
    username: user ? user.username || '' : '',
    bio: user ? user.bio || '' : '',
    location: user ? user.location || '' : '',
    avatar: user ? user.avatar || null : null,
    banner: user ? user.banner || null : null,
  }));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const dirty = useMemo(
    () =>
      !!user &&
      (form.name !== user.name ||
        form.username !== (user.username || '') ||
        form.bio !== (user.bio || '') ||
        form.location !== (user.location || '') ||
        form.avatar !== (user.avatar || null) ||
        form.banner !== (user.banner || null)),
    [form, user]
  );

  if (!user) {
    return (
      <Screen bg={C.bg}>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" bg="#fff" border onPress={() => navigation.goBack()} />
          <T w={800} s={19} color={C.ink} style={{ marginLeft: 12 }}>
            Edit profile
          </T>
        </View>
        <Card style={{ margin: 16 }}>
          <T w={700} s={15} color={C.ink}>
            Sign in to edit your profile
          </T>
          <T w={400} s={13} color={C.muted} style={{ marginTop: 6, lineHeight: 19 }}>
            Your saved and supported campaigns are already kept on this device. They join your account the moment you sign in.
          </T>
          <View style={{ marginTop: 16 }}>
            <GradButton label="Sign in or create an account" icon="login" arrow onPress={() => gate.requireAuth({ kind: 'editProfile' })} />
          </View>
        </Card>
      </Screen>
    );
  }

  const patch = (changes) => {
    setForm((f) => ({ ...f, ...changes }));
    setSaved(false);
  };

  const replacePhoto = (key, nextRef) => {
    const previous = form[key];
    if (isImgRef(previous)) app.removeImage(previous);
    patch({ [key]: nextRef });
  };

  const choosePhoto = (key) => {
    setErrors({});
    pickPhoto({
      onPhoto: async (asset) => {
        setBusy(true);
        try {
          const ref = await app.putImage(asset.base64);
          replacePhoto(key, ref);
        } catch (e) {
          setErrors({ photo: e.message || 'Could not store the photo on this device. Try a smaller image.' });
        } finally {
          setBusy(false);
        }
      },
      onError: (message) => setErrors({ photo: message }),
    });
  };

  const clearPhoto = (key) => {
    replacePhoto(key, null);
  };

  const submit = () => {
    const next = {
      name: form.name.trim(),
      username: form.username.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
    };
    const found = {};
    const profileError = logic.validateProfile(next);
    if (profileError) {
      if (/name/i.test(profileError)) found.name = profileError;
      else found.bio = found.location = profileError;
    }
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(next.username)) {
      found.username = 'Username must be 3–20 letters, numbers, dot or underscore.';
    } else {
      const taken = Object.values(app.state.users).some(
        (u) => u.id !== user.id && String(u.username || '').toLowerCase() === next.username.toLowerCase()
      );
      if (taken) found.username = 'That username is already used by another account on this device.';
    }
    if (Object.keys(found).length) {
      setErrors(found);
      setSaved(false);
      return;
    }
    const res = app.updateProfile({ ...next, avatar: form.avatar, banner: form.banner });
    if (res.error) {
      setErrors({ form: res.error });
      return;
    }
    setErrors({});
    setSaved(true);
  };

  return (
    <Screen bg={C.bg}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" bg="#fff" border onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <T w={800} s={19} color={C.ink}>
            Edit profile
          </T>
          <T w={400} s={12} color={C.muted} style={{ marginTop: 2 }}>
            Changes are stored on this device and used everywhere
          </T>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pad}>
        <Pressable onPress={() => choosePhoto('banner')} style={({ pressed }) => [styles.banner, pressed && { opacity: 0.95 }]}>
          <SmartImage source={form.banner} category="Community" style={StyleSheet.absoluteFill} />
          <View style={styles.bannerScrim}>
            <View style={styles.bannerBtn}>
              <Icon name={busy ? 'progress-circle' : 'image-outline'} size={15} color="#fff" />
              <T w={600} s={12} color="#fff" style={{ marginLeft: 6 }}>
                {busy ? 'Working…' : 'Cover photo'}
              </T>
            </View>
            {form.banner ? (
              <Pressable onPress={() => clearPhoto('banner')} hitSlop={10} style={styles.bannerClear}>
                <Icon name="close" size={15} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.avatarRow}>
          <Avatar source={form.avatar} name={form.name || 'You'} size={84} ring />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <T w={700} s={14} color={C.ink}>
              Profile photo
            </T>
            <T w={400} s={12} color={C.muted} style={{ marginTop: 3, lineHeight: 17 }}>
              Picked photos are stored on this device, so they survive a restart.
            </T>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <SoftButton label="Choose" icon="image-plus" style={{ flexGrow: 1 }} onPress={() => choosePhoto('avatar')} />
              {form.avatar ? (
                <SoftButton label="Remove" icon="trash-can-outline" color={C.red} bg="#FFE5EA" style={{ flexGrow: 1 }} onPress={() => clearPhoto('avatar')} />
              ) : null}
            </View>
          </View>
        </View>

        {errors.photo ? (
          <View style={styles.inlineError}>
            <Icon name="alert-circle-outline" size={15} color={C.red} />
            <T w={600} s={12} color={C.red} style={{ flex: 1, marginLeft: 7 }}>
              {errors.photo}
            </T>
          </View>
        ) : null}

        <View style={{ height: 18 }} />

        <Field
          label="Display name"
          icon="account-outline"
          value={form.name}
          onChangeText={(v) => patch({ name: v })}
          placeholder="How supporters see you"
          maxLength={40}
          error={errors.name}
          counter={form.name.length + '/40'}
        />
        <Field
          label="Username"
          icon="at"
          value={form.username}
          onChangeText={(v) => patch({ username: v.replace(/\s+/g, '') })}
          placeholder="yourname"
          maxLength={20}
          autoCapitalize="none"
          keyboardType="default"
          error={errors.username}
          hint="Letters, numbers, dot or underscore"
        />
        <Field
          label="Bio"
          icon="text-short"
          value={form.bio}
          onChangeText={(v) => patch({ bio: v })}
          placeholder="Tell people what you care about"
          multi
          maxLength={MAX_BIO}
          error={errors.bio}
          counter={form.bio.length + '/' + MAX_BIO}
        />
        <Field
          label="Location"
          icon="map-marker-outline"
          value={form.location}
          onChangeText={(v) => patch({ location: v })}
          placeholder="City, Country"
          maxLength={MAX_LOCATION}
          error={errors.location}
          counter={form.location.length + '/' + MAX_LOCATION}
        />
        <Field label="Email" icon="email-outline" value={user.email} editable={false} hint="Your sign-in email cannot be changed in the demo" />

        {errors.form ? (
          <View style={styles.inlineError}>
            <Icon name="alert-circle-outline" size={15} color={C.red} />
            <T w={600} s={12} color={C.red} style={{ flex: 1, marginLeft: 7 }}>
              {errors.form}
            </T>
          </View>
        ) : null}

        {saved ? (
          <View style={styles.okBox}>
            <Icon name="check-circle-outline" size={16} color={C.green} />
            <T w={600} s={12.5} color={C.green} style={{ flex: 1, marginLeft: 8 }}>
              Profile saved. Your name, photo and bio are updated across the app.
            </T>
          </View>
        ) : null}

        <View style={{ marginTop: 18 }}>
          <GradButton label="Save changes" icon="content-save-outline" disabled={!dirty} onPress={submit} />
          <T w={400} s={11.5} color={C.mutedLight} style={{ marginTop: 10, textAlign: 'center', lineHeight: 17 }}>
            {dirty ? 'Unsaved changes — saving writes them to this device.' : 'Nothing to save yet.'}
          </T>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  pad: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  banner: { height: 148, borderRadius: 20, overflow: 'hidden', backgroundColor: '#2D1B69', position: 'relative' },
  bannerScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 52,
    backgroundColor: 'rgba(23,21,45,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,18,40,0.55)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerClear: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(20,18,40,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9EC',
    borderRadius: 13,
    padding: 12,
    marginTop: 10,
  },
  okBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4F7EE',
    borderRadius: 13,
    padding: 12,
    marginTop: 14,
  },
});
