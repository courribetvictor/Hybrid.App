import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useT } from '@/lib/i18n'
import { formatHeight, formatWeight, computeBMI } from '@/lib/units'
import type { PreferredUnit, PreferredLanguage } from '@/types/database'

export default function ProfileScreen() {
  const t = useT()
  const { userId } = useSession()
  const { profile, loading, updateProfile } = useProfile(userId ?? undefined)

  const [editing, setEditing] = useState(false)
  const [heightInput, setHeightInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)

  const unit: PreferredUnit = profile?.preferred_unit ?? 'metric'
  const lang: PreferredLanguage = profile?.preferred_language ?? 'fr'

  const bmi =
    profile?.current_weight_kg && profile?.height_cm
      ? computeBMI(profile.current_weight_kg, profile.height_cm)
      : null

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await updateProfile({
        height_cm: heightInput ? parseFloat(heightInput) : profile.height_cm,
        current_weight_kg: weightInput ? parseFloat(weightInput) : profile.current_weight_kg,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setEditing(false)
    } catch (e: any) {
      Alert.alert('Erreur', e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleUnit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await updateProfile({ preferred_unit: unit === 'metric' ? 'imperial' : 'metric' })
  }

  const toggleLang = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await updateProfile({ preferred_language: lang === 'fr' ? 'en' : 'fr' })
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile.title}</Text>
        <TouchableOpacity
          onPress={() => {
            if (editing) { setEditing(false) } else { setEditing(true) }
          }}
        >
          <Text style={styles.editBtn}>{editing ? 'Annuler' : t.profile.editProfile}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + Identity */}
        <View style={styles.identity}>
          <Avatar
            uri={profile?.avatar_url}
            username={profile?.username ?? '?'}
            isPro={profile?.is_pro}
            size={80}
          />
          <View style={styles.identityText}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{profile?.username ?? '—'}</Text>
              {profile?.is_pro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>⚡ PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberSince}>
              Membre depuis {profile ? new Date(profile.created_at).getFullYear() : '—'}
            </Text>
          </View>
        </View>

        {/* Hybrid Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>{t.profile.hybridScore}</Text>
          <Text style={styles.scoreValue}>
            {Math.round(profile?.hybrid_score ?? 0).toLocaleString()}
          </Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                { width: `${Math.min(100, (profile?.hybrid_score ?? 0) / 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Body metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensurations</Text>

          {editing ? (
            <View style={styles.editRow}>
              <EditField
                label={`Taille (${unit === 'metric' ? 'cm' : 'in'})`}
                value={heightInput}
                onChange={setHeightInput}
                placeholder={profile?.height_cm ? String(profile.height_cm) : '175'}
              />
              <EditField
                label={`Poids (${unit === 'metric' ? 'kg' : 'lbs'})`}
                value={weightInput}
                onChange={setWeightInput}
                placeholder={profile?.current_weight_kg ? String(profile.current_weight_kg) : '70'}
              />
            </View>
          ) : (
            <View style={styles.metricsRow}>
              <MetricCard
                label="Taille"
                value={profile?.height_cm ? formatHeight(profile.height_cm, unit) : '—'}
              />
              <MetricCard
                label="Poids"
                value={profile?.current_weight_kg ? formatWeight(profile.current_weight_kg, unit) : '—'}
              />
              <MetricCard
                label="IMC"
                value={bmi ? String(bmi) : '—'}
                accent={bmi ? bmiAccent(bmi) : undefined}
              />
            </View>
          )}

          {editing && (
            <Button
              label="Enregistrer"
              variant="primary"
              onPress={handleSave}
              loading={saving}
            />
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>

          <View style={styles.prefCard}>
            <PrefRow
              label={t.profile.units}
              valueA={t.profile.metric}
              valueB={t.profile.imperial}
              isA={unit === 'metric'}
              onToggle={toggleUnit}
            />
            <View style={styles.divider} />
            <PrefRow
              label={t.profile.language}
              valueA="Français"
              valueB="English"
              isA={lang === 'fr'}
              onToggle={toggleLang}
            />
          </View>
        </View>

        {/* Logout */}
        <Button
          label="Se déconnecter"
          variant="ghost"
          onPress={async () => {
            await import('@/lib/supabase').then(({ supabase }) => supabase.auth.signOut())
            router.replace('/')
          }}
          style={styles.logoutBtn}
        />

      </ScrollView>
    </SafeAreaView>
  )
}

// ── Sub-components ────────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={metricStyles.card}>
      <Text style={[metricStyles.value, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={metricStyles.label}>{label}</Text>
    </View>
  )
}

function EditField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <View style={editStyles.wrapper}>
      <Text style={editStyles.label}>{label}</Text>
      <TextInput
        style={editStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  )
}

function PrefRow({ label, valueA, valueB, isA, onToggle }: {
  label: string
  valueA: string
  valueB: string
  isA: boolean
  onToggle: () => void
}) {
  return (
    <View style={prefStyles.row}>
      <Text style={prefStyles.label}>{label}</Text>
      <View style={prefStyles.toggle}>
        <Text style={[prefStyles.opt, isA && prefStyles.optActive]}>{valueA}</Text>
        <Switch
          value={!isA}
          onValueChange={onToggle}
          trackColor={{ false: Colors.electricDim, true: Colors.electricDim }}
          thumbColor={Colors.electric}
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
        <Text style={[prefStyles.opt, !isA && prefStyles.optActive]}>{valueB}</Text>
      </View>
    </View>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function bmiAccent(bmi: number): string {
  if (bmi < 18.5) return Colors.warning
  if (bmi < 25) return Colors.success
  if (bmi < 30) return Colors.warning
  return Colors.error
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  editBtn: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.electric },
  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 48 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  identityText: { flex: 1, gap: 4 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  username: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  proBadge: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textInverse },
  memberSince: { fontSize: FontSize.sm, color: Colors.textTertiary },
  scoreCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  scoreLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  scoreValue: { fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: Colors.electric },
  scoreBar: {
    height: 6,
    backgroundColor: Colors.bgAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.electric,
    borderRadius: 3,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm },
  editRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  prefCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  logoutBtn: { marginTop: Spacing.sm },
})

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.sm,
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  label: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
})

const editStyles = StyleSheet.create({
  wrapper: { flex: 1, gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
})

const prefStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  opt: { fontSize: FontSize.sm, color: Colors.textTertiary },
  optActive: { color: Colors.electric, fontWeight: FontWeight.semibold },
})
