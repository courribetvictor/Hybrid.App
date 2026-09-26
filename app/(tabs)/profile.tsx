import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { PaywallModal } from '@/components/arena/PaywallModal'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useActivities } from '@/hooks/useActivities'
import { useBodyLogs } from '@/hooks/useBodyLogs'
import { supabase } from '@/lib/supabase'
import { formatDurationLong, displayWeight, computeBMI, bmiCategory } from '@/lib/units'
import type { PreferredUnit, Profile } from '@/types/database'

const HYBRID_SCORE_MAX = 1000

function computeHybridScore(activities: any[]): number {
  const base = Math.min(activities.length * 20, 400)
  const totalSecs = activities.reduce((s: number, a: any) => s + (a.duration_seconds ?? 0), 0)
  const durationScore = Math.min(Math.floor(totalSecs / 600), 300)
  const sportSet = new Set(activities.map((a: any) => a.sport_type)).size
  const diversity = Math.min(sportSet * 50, 300)
  return Math.min(base + durationScore + diversity, HYBRID_SCORE_MAX)
}

export default function ProfileScreen() {
  const { userId } = useSession()
  const { profile, updateProfile } = useProfile(userId ?? undefined)
  const { activities } = useActivities(userId ?? undefined, 365)
  const { logs: bodyLogs } = useBodyLogs(userId ?? undefined, 90)

  const [paywallVisible, setPaywallVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [notifVisible, setNotifVisible] = useState(false)
  const [privacyVisible, setPrivacyVisible] = useState(false)

  const unit = profile?.preferred_unit ?? 'metric'
  const lang = profile?.preferred_language ?? 'fr'

  const hybridScore = computeHybridScore(activities)
  const scoreProgress = hybridScore / HYBRID_SCORE_MAX

  const latestWeight = bodyLogs.find((l: any) => l.weight_kg !== null)?.weight_kg ?? profile?.current_weight_kg
  const heightCm = profile?.height_cm
  const bmi = latestWeight && heightCm ? computeBMI(latestWeight, heightCm) : null
  const bmiKey = bmi ? bmiCategory(bmi) : null
  const BMI_LABELS: Record<string, { label: string; color: string }> = {
    underweight: { label: 'Insuffisance pondérale', color: Colors.info },
    normal: { label: 'Poids normal', color: Colors.success },
    overweight: { label: 'Surpoids', color: Colors.warning },
    obese: { label: 'Obésité', color: Colors.error },
  }
  const bmiLabel = bmiKey ? BMI_LABELS[bmiKey] : null

  const handleToggleUnit = useCallback(async (v: boolean) => {
    const next: PreferredUnit = v ? 'imperial' : 'metric'
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await updateProfile({ preferred_unit: next })
  }, [updateProfile])

  const handleToggleLang = useCallback(async (v: boolean) => {
    const next = v ? 'en' : 'fr'
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await updateProfile({ preferred_language: next })
  }, [updateProfile])

  const handleSignOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await supabase.auth.signOut()
  }, [])

  const wLabel = unit === 'imperial' ? 'lbs' : 'kg'
  const weightDisplay = latestWeight ? displayWeight(latestWeight, unit) : null
  const recentSports = [...new Set(activities.slice(0, 10).map((a: any) => a.sport_type))]

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Profil" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.hero}>
          <Avatar
            uri={profile?.avatar_url}
            username={profile?.username ?? '?'}
            isPro={profile?.is_pro}
            size={72}
          />
          <Text style={styles.name}>{profile?.username ?? '—'}</Text>
          {profile?.is_pro && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>⚡ PRO</Text>
            </View>
          )}
          <Text style={styles.joined}>
            Membre depuis {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              : '—'}
          </Text>
        </View>

        {/* Hybrid Score */}
        <View style={scoreStyles.card}>
          <View style={scoreStyles.header}>
            <Text style={scoreStyles.label}>Hybrid Score</Text>
            <Text style={scoreStyles.value}>
              {hybridScore}
              <Text style={scoreStyles.max}> / {HYBRID_SCORE_MAX}</Text>
            </Text>
          </View>
          <View style={scoreStyles.barBg}>
            <View style={[scoreStyles.barFill, { width: `${scoreProgress * 100}%` as any }]} />
          </View>
          <Text style={scoreStyles.hint}>Basé sur tes séances, durée et diversité sportive sur 12 mois</Text>
        </View>

        {/* Stats rapides */}
        <View style={quickStats.row}>
          <QuickStat value={String(activities.length)} label="Séances" icon="🏅" />
          <QuickStat
            value={formatDurationLong(activities.reduce((s: number, a: any) => s + a.duration_seconds, 0))}
            label="Volume total"
            icon="⏱"
          />
          <QuickStat value={String(recentSports.length)} label="Sports" icon="🎯" />
        </View>

        {/* Body metrics */}
        {(weightDisplay || heightCm || bmi) && (
          <View style={bodyStyles.card}>
            <Text style={bodyStyles.title}>Métriques corporelles</Text>
            <View style={bodyStyles.grid}>
              {weightDisplay && (
                <BodyMetric label="Poids" value={`${weightDisplay.value.toFixed(1)} ${wLabel}`} />
              )}
              {heightCm && (
                <BodyMetric
                  label="Taille"
                  value={unit === 'imperial'
                    ? `${Math.floor(heightCm / 30.48)}'${Math.round((heightCm % 30.48) / 2.54)}"`
                    : `${heightCm} cm`}
                />
              )}
              {bmi && (
                <BodyMetric
                  label="IMC"
                  value={bmi.toFixed(1)}
                  sub={bmiLabel?.label ?? ''}
                  subColor={bmiLabel?.color}
                />
              )}
            </View>
          </View>
        )}

        {/* Préférences */}
        <View style={prefStyles.card}>
          <Text style={prefStyles.title}>Préférences</Text>
          <View style={prefStyles.row}>
            <View style={prefStyles.label}>
              <Text style={prefStyles.labelMain}>Unités impériales</Text>
              <Text style={prefStyles.labelSub}>Miles, livres, pieds</Text>
            </View>
            <Switch
              value={unit === 'imperial'}
              onValueChange={handleToggleUnit}
              trackColor={{ false: Colors.border, true: Colors.electricDim }}
              thumbColor={unit === 'imperial' ? Colors.electric : '#fff'}
            />
          </View>
          <View style={[prefStyles.row, prefStyles.rowLast]}>
            <View style={prefStyles.label}>
              <Text style={prefStyles.labelMain}>Langue anglaise</Text>
              <Text style={prefStyles.labelSub}>Interface en English</Text>
            </View>
            <Switch
              value={lang === 'en'}
              onValueChange={handleToggleLang}
              trackColor={{ false: Colors.border, true: Colors.electricDim }}
              thumbColor={lang === 'en' ? Colors.electric : '#fff'}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!profile?.is_pro && (
            <TouchableOpacity
              style={proStyles.banner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                setPaywallVisible(true)
              }}
              activeOpacity={0.85}
            >
              <Text style={proStyles.emoji}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={proStyles.title}>Passe en PRO</Text>
                <Text style={proStyles.sub}>Défis avancés, analyses illimitées, badge exclusif</Text>
              </View>
              <View style={proStyles.btn}>
                <Text style={proStyles.btnText}>Voir →</Text>
              </View>
            </TouchableOpacity>
          )}

          <ActionRow
            icon="✏️"
            label="Modifier le profil"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setEditVisible(true)
            }}
          />
          <ActionRow
            icon="🔔"
            label="Notifications"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setNotifVisible(true)
            }}
          />
          <ActionRow
            icon="🔒"
            label="Confidentialité"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setPrivacyVisible(true)
            }}
          />

          <View style={styles.signOutWrap}>
            <Button
              label="Se déconnecter"
              variant="danger"
              size="md"
              onPress={handleSignOut}
            />
          </View>
        </View>

        <Text style={styles.version}>Hybrid.App · v0.1.0</Text>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        profile={profile}
        unit={unit}
        onSave={updateProfile}
      />
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  )
}

// ── Sub-components ────────────────────────────────────────────

function ActionRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={actionStyles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={actionStyles.icon}>{icon}</Text>
      <Text style={actionStyles.label}>{label}</Text>
      <Text style={actionStyles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

function QuickStat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <View style={quickStats.card}>
      <Text style={quickStats.icon}>{icon}</Text>
      <Text style={quickStats.value}>{value}</Text>
      <Text style={quickStats.label}>{label}</Text>
    </View>
  )
}

function BodyMetric({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <View style={bodyStyles.metric}>
      <Text style={bodyStyles.metricLabel}>{label}</Text>
      <Text style={bodyStyles.metricValue}>{value}</Text>
      {sub && <Text style={[bodyStyles.metricSub, subColor ? { color: subColor } : undefined]}>{sub}</Text>}
    </View>
  )
}

// ── Edit Profile Modal ────────────────────────────────────────

function EditProfileModal({
  visible, onClose, profile, unit, onSave,
}: {
  visible: boolean
  onClose: () => void
  profile: Profile | null
  unit: PreferredUnit
  onSave: (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => Promise<void>
}) {
  const [username, setUsername] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (visible && profile) {
      setUsername(profile.username ?? '')
      setHeightInput(profile.height_cm ? String(profile.height_cm) : '')
      setWeightInput(profile.current_weight_kg ? String(profile.current_weight_kg) : '')
      setErrorMsg(null)
    }
  }, [visible, profile])

  const handleSave = async () => {
    setErrorMsg(null)
    if (!username.trim()) { setErrorMsg("Le nom d'utilisateur est requis."); return }
    if (username.trim().length < 3) { setErrorMsg('Min. 3 caractères pour le pseudo.'); return }
    setSaving(true)
    try {
      await onSave({
        username: username.trim(),
        height_cm: heightInput ? parseFloat(heightInput) || undefined : undefined,
        current_weight_kg: weightInput ? parseFloat(weightInput) || undefined : undefined,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } catch (e: any) {
      setErrorMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={sheetStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={sheetStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>Modifier le profil</Text>

          {errorMsg && (
            <View style={sheetStyles.error}>
              <Text style={sheetStyles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <SheetField
            label="Nom d'utilisateur"
            value={username}
            onChangeText={setUsername}
            placeholder="ton_pseudo"
            autoCapitalize="none"
          />
          <SheetField
            label={`Taille (${unit === 'metric' ? 'cm' : 'in'})`}
            value={heightInput}
            onChangeText={setHeightInput}
            placeholder={unit === 'metric' ? '175' : '68'}
            keyboardType="decimal-pad"
          />
          <SheetField
            label={`Poids (${unit === 'metric' ? 'kg' : 'lbs'})`}
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder={unit === 'metric' ? '70' : '154'}
            keyboardType="decimal-pad"
          />

          <Button
            label="Enregistrer"
            variant="primary"
            size="lg"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.sm }}
          />
          <TouchableOpacity onPress={onClose} style={sheetStyles.cancelWrap} activeOpacity={0.7}>
            <Text style={sheetStyles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Notifications Modal ───────────────────────────────────────

const NOTIF_SETTINGS = [
  { id: 'new_challenges', title: 'Nouveaux défis', subtitle: 'Quand un défi hebdomadaire est disponible', default: true },
  { id: 'friend_activity', title: 'Activités des amis', subtitle: 'Quand un ami ajoute une séance', default: true },
  { id: 'reminders', title: "Rappels d'entraînement", subtitle: "Un rappel si tu n'as pas bougé depuis 3 jours", default: false },
  { id: 'weekly_summary', title: 'Résumé hebdomadaire', subtitle: 'Ton bilan sportif chaque lundi matin', default: true },
]

function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_SETTINGS.map(s => [s.id, s.default])),
  )

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <TouchableOpacity style={sheetStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>🔔  Notifications</Text>

          {NOTIF_SETTINGS.map((s, i) => (
            <React.Fragment key={s.id}>
              <View style={sheetStyles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={sheetStyles.settingTitle}>{s.title}</Text>
                  <Text style={sheetStyles.settingSub}>{s.subtitle}</Text>
                </View>
                <Switch
                  value={settings[s.id]}
                  onValueChange={() => toggle(s.id)}
                  trackColor={{ false: Colors.border, true: Colors.electricDim }}
                  thumbColor={settings[s.id] ? Colors.electric : '#fff'}
                />
              </View>
              {i < NOTIF_SETTINGS.length - 1 && <View style={sheetStyles.divider} />}
            </React.Fragment>
          ))}

          <Text style={sheetStyles.note}>
            Les notifications push arrivent dans la prochaine mise à jour.
          </Text>
          <Button label="Fermer" variant="ghost" onPress={onClose} style={{ marginTop: Spacing.xs }} />
        </View>
      </View>
    </Modal>
  )
}

// ── Privacy Modal ─────────────────────────────────────────────

const PRIVACY_SETTINGS = [
  { id: 'public_profile', title: 'Profil public', subtitle: 'Visible par tous les utilisateurs', default: true },
  { id: 'show_activities', title: 'Activités publiques', subtitle: 'Tes séances dans le feed de tes amis', default: true },
  { id: 'show_leaderboard', title: 'Classement', subtitle: "Ton score visible dans l'Arène", default: true },
  { id: 'show_body_metrics', title: 'Métriques corporelles', subtitle: 'Partager poids et IMC', default: false },
]

function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(PRIVACY_SETTINGS.map(s => [s.id, s.default])),
  )

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <TouchableOpacity style={sheetStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>🔒  Confidentialité</Text>

          {PRIVACY_SETTINGS.map((s, i) => (
            <React.Fragment key={s.id}>
              <View style={sheetStyles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={sheetStyles.settingTitle}>{s.title}</Text>
                  <Text style={sheetStyles.settingSub}>{s.subtitle}</Text>
                </View>
                <Switch
                  value={settings[s.id]}
                  onValueChange={() => toggle(s.id)}
                  trackColor={{ false: Colors.border, true: Colors.electricDim }}
                  thumbColor={settings[s.id] ? Colors.electric : '#fff'}
                />
              </View>
              {i < PRIVACY_SETTINGS.length - 1 && <View style={sheetStyles.divider} />}
            </React.Fragment>
          ))}

          <Text style={sheetStyles.note}>
            La gestion fine des permissions sera synchronisée dans une prochaine mise à jour.
          </Text>
          <Button label="Fermer" variant="ghost" onPress={onClose} style={{ marginTop: Spacing.xs }} />
        </View>
      </View>
    </Modal>
  )
}

// ── Shared Sheet Field ────────────────────────────────────────

function SheetField({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: any
  autoCapitalize?: any
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={sheetStyles.fieldWrap}>
      <Text style={sheetStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={[sheetStyles.fieldInput, focused && sheetStyles.fieldInputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 48 },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    gap: 6,
    ...Shadow.sm,
  },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.3 },
  proBadge: {
    backgroundColor: Colors.electricDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  proText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.electric },
  joined: { fontSize: FontSize.sm, color: Colors.textTertiary },
  actions: { gap: Spacing.sm },
  signOutWrap: { paddingTop: Spacing.sm },
  version: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', paddingTop: Spacing.sm },
})

const scoreStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  value: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.electric },
  max: { fontSize: FontSize.sm, fontWeight: FontWeight.regular, color: Colors.textTertiary },
  barBg: { height: 10, backgroundColor: Colors.bgAlt, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.electric, borderRadius: 5 },
  hint: { fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 16 },
})

const quickStats = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    ...Shadow.sm,
  },
  icon: { fontSize: 18 },
  value: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  label: { fontSize: 9, color: Colors.textTertiary, textAlign: 'center' },
})

const bodyStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  grid: { flexDirection: 'row', gap: Spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  metricValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  metricSub: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
})

const prefStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { flex: 1 },
  labelMain: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  labelSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
})

const proStyles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.electricDim,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.electric + '30',
  },
  emoji: { fontSize: 22 },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.electric },
  sub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  btn: {
    backgroundColor: Colors.electric,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  btnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
})

const actionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  icon: { fontSize: 18, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textTertiary, lineHeight: 22 },
})

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  sheetTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  error: {
    backgroundColor: Colors.error + '18',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: FontWeight.medium },
  cancelWrap: { alignSelf: 'center', paddingVertical: Spacing.sm },
  cancelText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  settingTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  settingSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.xs,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  fieldInput: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  fieldInputFocused: { borderColor: Colors.electric },
})
