// Manage campaigns: the record-keeping side of the app. Progress is read from
// the same store the feed uses, and updates, closing and deleting all write
// real records back to it.
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Pressable, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp, logic } from '../store/AppStore';
import { isImgRef } from '../store/persistence';
import { C, CATEGORY_COLORS, compact, money } from '../theme/theme';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { Card, Empty, GradButton, IconButton, Pill, Progress, Screen, SoftButton, T } from '../components/ui';

const cat = (category) => CATEGORY_COLORS[category] || { icon: 'tag-outline', fg: C.purple, bg: C.purpleSoft };

export default function MyCampaignsScreen({ navigation, route }) {
  const app = useApp();
  const [now, setNow] = useState(Date.now());
  const [openId, setOpenId] = useState(route.params?.openUpdate || route.params?.highlight || null);
  const [text, setText] = useState('');
  const [note, setNote] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      if (route.params?.openUpdate) setOpenId(route.params.openUpdate);
    }, [route.params?.openUpdate])
  );

  const mine = useMemo(() => app.selectors.mine().map((c) => app.selectors.view(c, now)), [app, now]);
  const drafts = app.selectors.drafts();

  const addUpdate = () => {
    const res = app.addUpdate(openId, text);
    if (res.error) return setNote({ kind: 'error', text: res.error });
    setText('');
    setNote({ kind: 'ok', text: 'Update published — it is now on the campaign page.' });
  };

  const closeCampaign = (c) => {
    Alert.alert('Close campaign?', `"${c.title}" will stop accepting support. Its progress and records stay on this device.`, [
      { text: 'Keep open', style: 'cancel' },
      {
        text: 'Close campaign',
        style: 'destructive',
        onPress: () => {
          app.closeCampaign(c.id);
          setNote({ kind: 'ok', text: `"${c.title}" is closed.` });
        },
      },
    ]);
  };

  const removeCampaign = (c) => {
    Alert.alert('Delete campaign?', `"${c.title}" and its contribution records will be removed from this device. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          app.deleteCampaign(c.id);
          if (openId === c.id) setOpenId(null);
          setNote({ kind: 'ok', text: 'Campaign deleted.' });
        },
      },
    ]);
  };

  const dropDraft = (d) => {
    Alert.alert('Delete draft?', 'This removes the unfinished draft stored on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete draft',
        style: 'destructive',
        onPress: () => {
          if (isImgRef(d.cover)) app.removeImage(d.cover);
          app.discardDraft(d.id);
        },
      },
    ]);
  };

  return (
    <Screen bg={C.bg}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" bg="#fff" border size={36} iconSize={18} onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <T w={800} s={18} color={C.ink}>
            Manage campaigns
          </T>
          <T w={400} s={11.5} color={C.muted} style={{ marginTop: 1 }}>
            {mine.length} record{mine.length === 1 ? '' : 's'} · {drafts.length} draft{drafts.length === 1 ? '' : 's'}
          </T>
        </View>
        <IconButton icon="plus" bg="#fff" border size={36} iconSize={18} onPress={() => navigation.navigate('CreateFlow')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pad}>
        {note ? (
          <View style={[styles.note, note.kind === 'ok' ? styles.noteOk : styles.noteBad]}>
            <Icon name={note.kind === 'ok' ? 'check-circle-outline' : 'alert-circle-outline'} size={15} color={note.kind === 'ok' ? C.green : C.red} />
            <T w={600} s={12} color={note.kind === 'ok' ? C.green : C.red} style={{ flex: 1, marginLeft: 8 }}>
              {note.text}
            </T>
            <Pressable onPress={() => setNote(null)} hitSlop={8}>
              <Icon name="close" size={14} color={note.kind === 'ok' ? C.green : C.red} />
            </Pressable>
          </View>
        ) : null}

        {mine.length ? (
          mine.map((c) => {
            const expanded = openId === c.id;
            const color = cat(c.category);
            return (
              <Card key={c.id} style={styles.campaignCard}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.thumb}>
                    <SmartImage source={c.cover} category={c.category} style={StyleSheet.absoluteFill} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <Pill label={c.category} icon={color.icon} fg={color.fg} bg={color.bg} size={10} />
                      {c.status === 'completed' ? (
                        <Pill label="Closed" icon="check-circle-outline" fg={C.muted} bg="#F0EFF6" size={10} />
                      ) : (
                        <Pill label={c.daysLeft + ' days left'} icon="clock-outline" fg={C.amber} bg="#FFF3D9" size={10} />
                      )}
                    </View>
                    <T w={800} s={14} color={C.ink} numberOfLines={2} style={{ marginTop: 5, letterSpacing: -0.2 }}>
                      {c.title}
                    </T>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Progress percent={c.percent} style={{ flex: 1 }} />
                  <T w={800} s={11.5} color={C.ink} style={{ marginLeft: 8 }}>
                    {c.percent}%
                  </T>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={{ flex: 1.2 }}>
                    <T w={500} s={11.5} color={C.muted}>
                      <T w={800} s={12.5} color={C.purple}>{money(c.raisedAmount)}</T> raised
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T w={500} s={11.5} color={C.muted}>{compact(c.supporters)} supporters</T>
                  </View>
                  <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                    <T w={500} s={11.5} color={C.muted}>{compact(c.views)} views</T>
                  </View>
                </View>

                <View style={styles.actions}>
                  <SoftButton
                    label="View page"
                    icon="open-in-new"
                    style={styles.btnSmall}
                    textStyle={{ fontSize: 12 }}
                    onPress={() => navigation.navigate('Detail', { id: c.id })}
                  />
                  <SoftButton
                    label={expanded ? 'Hide editor' : 'Add update'}
                    icon={expanded ? 'chevron-up' : 'bullhorn-outline'}
                    style={styles.btnSmall}
                    textStyle={{ fontSize: 12 }}
                    onPress={() => {
                      setOpenId(expanded ? null : c.id);
                      setNote(null);
                    }}
                  />
                </View>

                {expanded ? (
                  <View style={styles.editor}>
                    <T w={700} s={12.5} color={C.ink}>
                      Share an update
                    </T>
                    <T w={400} s={11} color={C.muted} style={{ marginTop: 2, lineHeight: 16 }}>
                      Supporters see this on the campaign page under Updates.
                    </T>
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      multiline
                      placeholder="What has happened since you started?"
                      placeholderTextColor={C.mutedLight}
                      style={styles.editorInput}
                      maxLength={300}
                    />
                    <T w={500} s={10.5} color={C.mutedLight} style={{ marginTop: 4 }}>
                      {text.length}/300 · minimum 5 characters
                    </T>
                    <View style={{ marginTop: 10 }}>
                      <GradButton
                        label="Publish update"
                        icon="send"
                        disabled={text.trim().length < 5}
                        style={{ paddingVertical: 9 }}
                        textStyle={{ fontSize: 12.5 }}
                        onPress={addUpdate}
                      />
                    </View>

                    {(c.updates || []).length ? (
                      <View style={{ marginTop: 14 }}>
                        <T w={700} s={11} color={C.mutedLight} style={{ marginBottom: 6, letterSpacing: 0.4 }}>
                          POSTED UPDATES
                        </T>
                        {c.updates.map((u) => (
                          <View key={u.id} style={styles.updateRow}>
                            <Icon name="bullhorn-outline" size={13} color={C.purpleDeep} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <T w={500} s={12} color={C.ink} style={{ lineHeight: 17 }}>
                                {u.text}
                              </T>
                              <T w={500} s={10.5} color={C.mutedLight} style={{ marginTop: 2 }}>
                                {logic.timeLabel(u.createdAt, now)}
                              </T>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.dangerRow}>
                      {c.status === 'completed' ? null : (
                        <SoftButton
                          label="Close campaign"
                          icon="check-circle-outline"
                          color={C.muted}
                          bg="#F0EFF6"
                          style={styles.btnSmall}
                          textStyle={{ fontSize: 11.5 }}
                          onPress={() => closeCampaign(c)}
                        />
                      )}
                      <SoftButton
                        label="Delete"
                        icon="trash-can-outline"
                        color={C.red}
                        bg="#FFE5EA"
                        style={styles.btnSmall}
                        textStyle={{ fontSize: 11.5 }}
                        onPress={() => removeCampaign(c)}
                      />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })
        ) : (
          <Empty
            icon="folder-open-outline"
            title="No campaigns to manage"
            body="Campaigns you publish appear here with their progress, updates and supporters."
            action="Create a campaign"
            onAction={() => navigation.navigate('CreateFlow')}
          />
        )}

        {drafts.length ? (
          <Card style={{ marginTop: 8, padding: 14 }}>
            <T w={800} s={14.5} color={C.ink}>
              Drafts
            </T>
            <T w={400} s={11.5} color={C.muted} style={{ marginTop: 2, lineHeight: 16 }}>
              Unfinished campaigns are saved on this device as you type.
            </T>
            {drafts.map((d) => (
              <View key={d.id} style={styles.draftRow}>
                <View style={{ flex: 1 }}>
                  <T w={600} s={13} color={C.ink} numberOfLines={1}>
                    {d.title || 'Untitled campaign'}
                  </T>
                  <T w={400} s={11} color={C.muted} style={{ marginTop: 1 }}>
                    Step {d.step || 1} of 3 · edited {logic.timeLabel(d.updatedAt, now).toLowerCase()}
                  </T>
                </View>
                <Pressable onPress={() => navigation.navigate('CreateFlow', { draftId: d.id })} hitSlop={8} style={styles.draftBtn}>
                  <Icon name="pencil-outline" size={14} color={C.purpleDeep} />
                </Pressable>
                <Pressable onPress={() => dropDraft(d)} hitSlop={8} style={[styles.draftBtn, { marginLeft: 6 }]}>
                  <Icon name="trash-can-outline" size={14} color={C.red} />
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 },
  pad: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30 },
  campaignCard: { marginBottom: 12, padding: 14 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E9E5F7' },
  note: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, marginBottom: 12 },
  noteOk: { backgroundColor: '#E4F7EE' },
  noteBad: { backgroundColor: '#FFE9EC' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btnSmall: { flexGrow: 1, paddingVertical: 8 },
  editor: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderSoft },
  editorInput: {
    marginTop: 8,
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    padding: 10,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: C.ink,
    textAlignVertical: 'top',
  },
  updateRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  dangerRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  draftBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});