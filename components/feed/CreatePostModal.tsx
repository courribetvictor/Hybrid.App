import React, { useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import type { SportType } from '@/types/database'

const SPORTS: { key: SportType; label: string; emoji: string }[] = [
  { key: 'gym',       label: 'Muscu',      emoji: '🏋️' },
  { key: 'running',   label: 'Course',     emoji: '🏃' },
  { key: 'cycling',   label: 'Vélo',       emoji: '🚴' },
  { key: 'swimming',  label: 'Natation',   emoji: '🏊' },
  { key: 'football',  label: 'Football',   emoji: '⚽' },
  { key: 'tennis',    label: 'Tennis',     emoji: '🎾' },
  { key: 'badminton', label: 'Badminton',  emoji: '🏸' },
  { key: 'hiking',    label: 'Rando',      emoji: '🥾' },
  { key: 'boxing',    label: 'Boxe',       emoji: '🥊' },
  { key: 'athletics', label: 'Athlé.',     emoji: '⚡' },
  { key: 'yoga',      label: 'Yoga',       emoji: '🧘' },
]

const MAX_CHARS = 500
const MEDIA_BUCKET = 'media'

interface CreatePostModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (content: string, sportType?: SportType | null, mediaUrl?: string | null) => Promise<void>
  userId?: string
}

async function uploadPhoto(localUri: string, userId: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    const byteChars = atob(base64)
    const byteNums = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i)
    }
    const path = `${userId}/${Date.now()}.jpg`
    const { error } = await (supabase.storage as any)
      .from(MEDIA_BUCKET)
      .upload(path, byteNums.buffer, { contentType: 'image/jpeg', upsert: false })
    if (error) return null
    const { data } = (supabase.storage as any).from(MEDIA_BUCKET).getPublicUrl(path)
    return data?.publicUrl ?? null
  } catch {
    return null
  }
}

export function CreatePostModal({ visible, onClose, onSubmit, userId }: CreatePostModalProps) {
  const [content, setContent] = useState('')
  const [sport, setSport] = useState<SportType | null>(null)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = content.trim().length > 0 && content.length <= MAX_CHARS

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    })
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setMediaUri(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSubmitting(true)
    try {
      let mediaUrl: string | null = null
      if (mediaUri && userId) {
        mediaUrl = await uploadPhoto(mediaUri, userId)
      }
      await onSubmit(content.trim(), sport, mediaUrl)
      setContent('')
      setSport(null)
      setMediaUri(null)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (content.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setContent('')
    setSport(null)
    setMediaUri(null)
    onClose()
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.topRow}>
              <Text style={styles.title}>Nouveau post</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={content}
              onChangeText={setContent}
              placeholder="Partage ton expérience, un conseil, une motivation…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={MAX_CHARS}
              autoFocus
            />

            <Text style={[styles.charCount, content.length > MAX_CHARS * 0.9 && { color: Colors.error }]}>
              {content.length}/{MAX_CHARS}
            </Text>

            {/* Photo preview */}
            {mediaUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: mediaUri }} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => setMediaUri(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoRemoveTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Action bar: photo + sport */}
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.75}>
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnLabel}>Photo</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportRow}>
                {SPORTS.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sportChip, sport === s.key && { backgroundColor: SportColors[s.key], borderColor: SportColors[s.key] }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSport(sport === s.key ? null : s.key) }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.sportEmoji}>{s.emoji}</Text>
                    <Text style={[styles.sportLabel, sport === s.key && { color: '#fff' }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitTxt}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.sm,
    ...Shadow.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { padding: 6 },
  closeTxt: { fontSize: FontSize.md, color: Colors.textTertiary },
  input: {
    minHeight: 100,
    maxHeight: 160,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: -4,
  },
  photoPreviewWrap: {
    position: 'relative',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveTxt: { color: '#fff', fontSize: 12, fontWeight: FontWeight.bold },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  photoBtnIcon: { fontSize: 14 },
  photoBtnLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  actionDivider: { width: 1, height: 20, backgroundColor: Colors.borderLight },
  sportRow: { gap: Spacing.sm, paddingBottom: 2 },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sportEmoji: { fontSize: 14 },
  sportLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  submitBtn: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitTxt: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
})
