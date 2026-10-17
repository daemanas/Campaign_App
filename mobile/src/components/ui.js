import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, ff, money } from '../theme/theme';
import { Icon } from './Icon';

/* --------------------------------------------------------------------- text */

export function T({ children, w = 400, s = 14, color = C.ink, style, ...rest }) {
  return (
    <Text allowFontScaling={false} style={[{ fontFamily: ff(w), fontSize: s, color }, style]} {...rest}>
      {children}
    </Text>
  );
}

export const H1 = ({ children, style, color = C.ink, size = 34 }) => (
  <T w={800} s={size} color={color} style={[{ letterSpacing: -0.8 }, style]}>
    {children}
  </T>
);

export const Muted = ({ children, style, s = 14, color = C.muted, w = 400 }) => (
  <T w={w} s={s} color={color} style={style}>
    {children}
  </T>
);

/* ----------------------------------------------------------------- gradient */

const STEPS = 18;

function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
}

// Pure-JS linear gradient built from colour slices, so no native dependency.
export function Grad({ colors = [C.purple, C.purpleDeep], style, children, horizontal = true }) {
  const [from, to] = colors;
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { flexDirection: horizontal ? 'row' : 'column', overflow: 'hidden' },
        style,
      ]}
    >
      {Array.from({ length: STEPS }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: mix(from, to, i / (STEPS - 1)),
            ...(horizontal ? { height: '100%' } : { width: '100%' }),
          }}
        />
      ))}
      {children}
    </View>
  );
}

export function GradButton({ label, onPress, colors, style, icon, iconColor, disabled, loading, arrow, children }) {
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      style={({ pressed }) => [
        {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 18,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <Grad colors={colors} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          paddingHorizontal: 18,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon ? <Icon name={icon} size={19} color={iconColor || '#fff'} style={{ marginRight: 8 }} /> : null}
            {label ? (
              <T w={700} s={16} color="#fff">
                {label}
              </T>
            ) : null}
            {children}
            {arrow ? (
              <View
                style={{
                  marginLeft: 10,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="arrow-right" size={16} color="#fff" />
              </View>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

export function SoftButton({ label, onPress, icon, style, color = C.purple, bg = C.purpleSoft, loading, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 15,
          paddingHorizontal: 18,
          borderRadius: 16,
          backgroundColor: bg,
          opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={color} style={{ marginRight: 8 }} /> : null}
          <T w={700} s={15} color={color}>
            {label}
          </T>
        </>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------- shell */

export function Screen({ children, style, edges = ['top'], bg = C.bg }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function KeyboardSafe({ children, style }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style, onPress }) {
  const body = (
    <View
      style={[
        { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: C.borderSoft },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Divider({ style }) {
  return <View style={{ height: 1, backgroundColor: C.borderSoft, marginVertical: 12, ...style }} />;
}

export function Progress({ percent, height = 7, color = C.purple, track = '#EEEAF8', style }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <View
      style={[
        { height, borderRadius: height, backgroundColor: track, overflow: 'hidden', width: '100%' },
        style,
      ]}
    >
      <View style={{ width: p + '%', height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function Chip({ label, icon, active, onPress, style, count }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: active ? C.purple : '#EFEFF6',
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={active ? '#fff' : C.inkSoft} style={{ marginRight: 6 }} /> : null}
      <T w={700} s={13} color={active ? '#fff' : C.inkSoft}>
        {label}
      </T>
      {count ? (
        <T w={700} s={11} color={active ? 'rgba(255,255,255,0.8)' : C.mutedLight} style={{ marginLeft: 5 }}>
          {count}
        </T>
      ) : null}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, size = 20, color = C.ink, bg = '#fff', badge, style, border, dark }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: border ? 1 : 0,
          borderColor: C.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={color} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -3,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: C.red,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: bg,
          }}
        >
          <T w={700} s={9} color="#fff">
            {badge > 99 ? '99+' : badge}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Pill({ label, icon, fg = C.purple, bg = C.purpleSoft, style, size = 11 }) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 9,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size} color={fg} style={{ marginRight: 5 }} /> : null}
      <T w={800} s={size} color={fg}>
        {label}
      </T>
    </View>
  );
}

/* -------------------------------------------------------------------- input */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  right,
  multi,
  secure,
  visible,
  onToggleSecure,
  keyboardType,
  maxLength,
  error,
  hint,
  counter,
  autoCapitalize = 'sentences',
  style,
  editable = true,
}) {
  return (
    <View style={{ marginBottom: error ? 6 : 14, ...style }}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {icon ? <Icon name={icon} size={15} color={C.purple} style={{ marginRight: 6 }} /> : null}
          <T w={700} s={13.5} color={C.ink}>
            {label}
          </T>
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multi ? 'flex-start' : 'center',
          borderRadius: 15,
          borderWidth: 1,
          borderColor: error ? C.red : C.border,
          backgroundColor: editable ? '#fff' : '#F6F6FA',
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A6A4B8"
          multiline={multi}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          textAlignVertical={multi ? 'top' : 'center'}
          style={{
            flex: 1,
            color: C.ink,
            fontFamily: ff(500),
            fontSize: 15,
            paddingVertical: multi ? 14 : 15,
            minHeight: multi ? 112 : 50,
          }}
        />
        {secure && onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={10} style={{ paddingLeft: 8, paddingVertical: multi ? 12 : 0 }}>
            <Icon name={visible ? 'eye' : 'eye-off'} size={19} color={C.muted} />
          </Pressable>
        ) : null}
        {right}
      </View>
      {(error || hint || counter) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 }}>
          <T w={600} s={11.5} color={error ? C.red : C.muted} style={{ flex: 1 }} numberOfLines={2}>
            {error || hint || ' '}
          </T>
          {counter ? (
            <T w={600} s={11.5} color={C.mutedLight}>
              {counter}
            </T>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function SelectField({ label, value, placeholder, onPress, icon, error, style }) {
  return (
    <View style={{ marginBottom: 14, ...style }}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {icon ? <Icon name={icon} size={15} color={C.purple} style={{ marginRight: 6 }} /> : null}
          <T w={700} s={13.5} color={C.ink}>
            {label}
          </T>
        </View>
      ) : null}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 15,
          borderWidth: 1,
          borderColor: error ? C.red : C.border,
          backgroundColor: pressed ? '#FAFAFE' : '#fff',
          paddingHorizontal: 14,
          minHeight: 50,
        })}
      >
        <T w={500} s={15} color={value ? C.ink : '#A6A4B8'} style={{ flex: 1 }} numberOfLines={1}>
          {value || placeholder}
        </T>
        <Icon name="chevron-down" size={18} color={C.inkSoft} />
      </Pressable>
      {error ? (
        <T w={600} s={11.5} color={C.red} style={{ marginTop: 6, marginLeft: 2 }}>
          {error}
        </T>
      ) : null}
    </View>
  );
}

export function ToggleRow({ label, sub, icon, value, onValueChange, right, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13 }, style]}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: C.purpleSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Icon name={icon} size={19} color={C.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <T w={700} s={14.5} color={C.ink}>
          {label}
        </T>
        {sub ? (
          <T w={400} s={12} color={C.muted} style={{ marginTop: 2 }}>
            {sub}
          </T>
        ) : null}
      </View>
      {right || (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#DDD9EC', true: C.purple }}
          thumbColor="#fff"
        />
      )}
    </View>
  );
}

/* -------------------------------------------------------------------- sheet */

export function Sheet({ visible, onClose, children, title, maxHeight = '86%' }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(16,14,38,0.45)' }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight,
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 26,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: '#E4E1F0' }} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 6,
          }}
        >
          <View style={{ flex: 1 }}>
            <T w={800} s={19} color={C.ink}>
              {title}
            </T>
          </View>
          <IconButton icon="close" size={18} bg="#F4F3F9" onPress={onClose} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* --------------------------------------------------------------------- misc */

export function Empty({ icon = 'telescope', title, body, action, onAction }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 34, paddingVertical: 46 }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 24,
          backgroundColor: C.purpleSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={30} color={C.purple} />
      </View>
      <T w={800} s={17} color={C.ink} style={{ marginTop: 16, textAlign: 'center' }}>
        {title}
      </T>
      {body ? (
        <T w={400} s={13.5} color={C.muted} style={{ marginTop: 7, textAlign: 'center', lineHeight: 20 }}>
          {body}
        </T>
      ) : null}
      {action ? (
        <SoftButton label={action} onPress={onAction} style={{ marginTop: 18, paddingHorizontal: 22 }} />
      ) : null}
    </View>
  );
}

export function Amount({ value, size = 17, color = C.purple, suffix }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <T w={800} s={size} color={color}>
        {money(value)}
      </T>
      {suffix ? (
        <T w={500} s={size - 4} color={C.muted} style={{ marginLeft: 5 }}>
          {suffix}
        </T>
      ) : null}
    </View>
  );
}

export function StatBlock({ value, label, style }) {
  return (
    <View style={[{ alignItems: 'center', flex: 1 }, style]}>
      <T w={800} s={18} color={C.ink}>
        {value}
      </T>
      <T w={500} s={12} color={C.muted} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}

export function Tabs({ items, active, onChange, style }) {
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: '#EFEFF6', borderRadius: 16, padding: 4 }, style]}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 11,
              borderRadius: 13,
              alignItems: 'center',
              backgroundColor: on ? C.purple : 'transparent',
              opacity: pressed && !on ? 0.7 : 1,
            })}
          >
            <T w={700} s={13.5} color={on ? '#fff' : C.muted}>
              {it.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
