// Navigation shell. Browsing is public; only campaign creation and account
// edits push the visitor through the auth screen — and the draft they were
// writing is still there when they come back.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppProvider, useApp } from '../store/AppStore';
import { GateCtx } from './gate';
import { C } from '../theme/theme';
import { Icon } from '../components/Icon';
import { T } from '../components/ui';
import { LogoMark } from '../components/BrandLogo';
import { flushState, markSeen } from '../store/persistence';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import DetailScreen from '../screens/DetailScreen';
import CreateScreen from '../screens/CreateScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SavedScreen from '../screens/SavedScreen';
import MyCampaignsScreen from '../screens/MyCampaignsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ContributionScreen from '../screens/ContributionScreen';
import OrganizerScreen from '../screens/OrganizerScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.bg, primary: C.purple, card: '#fff', text: C.ink, border: C.border },
};

function Boot() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <LogoMark size={64} radius={20} />
      <ActivityIndicator color={C.purple} style={{ marginTop: 26 }} />
      <T w={600} s={12.5} color={C.muted} style={{ marginTop: 14 }}>
        Preparing your campaigns…
      </T>
    </View>
  );
}

const TAB_ICONS = {
  Home: ['home-variant', 'home-variant-outline'],
  Explore: ['magnify', 'magnify'],
  Activity: ['bell', 'bell-outline'],
  Profile: ['account', 'account-outline'],
};

function TabIcon({ route, focused, badge }) {
  const pair = TAB_ICONS[route] || ['circle', 'circle-outline'];
  const color = focused ? C.purple : '#8D8AA5';
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8, minWidth: 52 }}>
      <View>
        <Icon name={focused ? pair[0] : pair[1]} size={22} color={color} />
        {badge ? (
          <View style={styles.tabBadge}>
            <T w={700} s={9} color="#fff">
              {badge > 9 ? '9+' : badge}
            </T>
          </View>
        ) : null}
      </View>
      <T w={focused ? 700 : 500} s={10.5} color={color} style={{ marginTop: 2 }}>
        {route}
      </T>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          marginTop: 2,
          backgroundColor: focused ? C.purple : 'transparent',
        }}
      />
    </View>
  );
}

function CreatePlaceholder() {
  return <View style={{ flex: 1, backgroundColor: C.bg }} />;
}

function MainTabs({ openCreate }) {
  const app = useApp();
  const unread = app.selectors.unread();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => (
          <TabIcon route={route.name} focused={focused} badge={route.name === 'Activity' ? unread : 0} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen
        name="Create"
        component={CreatePlaceholder}
        listeners={() => ({
          // The centre button is an action, not a destination: it opens the
          // wizard (or sign-in first) and leaves the current tab focused.
          tabPress: (e) => {
            e.preventDefault();
            openCreate();
          },
        })}
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <Pressable {...props} style={styles.createHolder}>
              <View style={styles.createButton}>
                <Icon name="plus" size={26} color="#fff" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Shell() {
  const app = useApp();
  const navRef = useRef(null);
  const [intent, setIntent] = useState(null);

  const go = useCallback((...args) => {
    if (navRef.current) navRef.current.navigate(...args);
  }, []);

  useEffect(() => {
    let alive = true;
    markSeen().then((seen) => {
      if (!seen && alive) go('Onboarding');
    });
    return () => {
      alive = false;
    };
  }, [go]);

  // True when the caller may proceed; otherwise the intent is parked and the
  // visitor is sent to sign in.
  const requireAuth = useCallback(
    (nextIntent) => {
      if (app.isAuthed) return true;
      setIntent(nextIntent || { kind: 'auth' });
      go('Auth', { mode: 'login' });
      return false;
    },
    [app.isAuthed, go]
  );

  const openCreate = useCallback(() => {
    if (!app.isAuthed) {
      setIntent({ kind: 'create' });
      return go('Auth', { mode: 'login' });
    }
    go('CreateFlow');
  }, [app.isAuthed, go]);

  const resume = useCallback(() => {
    const pending = intent;
    setIntent(null);
    if (!pending) return;
    if (pending.kind === 'create') return go('CreateFlow');
    if (pending.kind === 'detail') return go('Detail', { id: pending.campaignId });
    if (pending.kind === 'editProfile') return go('EditProfile');
    if (pending.kind === 'saved') return go('Saved');
    if (pending.kind === 'settings') return go('Settings');
    if (pending.go) return pending.go();
  }, [intent, go]);

  const gate = useMemo(
    () => ({
      requireAuth,
      resume,
      openCreate,
      pending: intent,
      clearPending: () => setIntent(null),
      isAuthed: app.isAuthed,
    }),
    [requireAuth, resume, openCreate, intent, app.isAuthed]
  );

  return (
    <GateCtx.Provider value={gate}>
      <NavigationContainer ref={navRef} theme={navTheme} onStateChange={flushState}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="Tabs">{(p) => <MainTabs {...p} openCreate={openCreate} />}</Stack.Screen>
          <Stack.Screen name="CreateFlow" component={CreateScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Detail" component={DetailScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Contribution" component={ContributionScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Organizer" component={OrganizerScreen} />
          <Stack.Screen name="Saved" component={SavedScreen} />
          <Stack.Screen name="MyCampaigns" component={MyCampaignsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: '#fff' } }}
          />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GateCtx.Provider>
  );
}

function Root() {
  const app = useApp();
  if (!app.ready) return <Boot />;
  return <Shell />;
}

export default function AppNavigator() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingTop: 2,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 12,
    shadowColor: '#17152D',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  createHolder: { alignItems: 'center', justifyContent: 'center', marginTop: -22 },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4EFF',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 5,
    borderColor: C.bg,
  },
});
