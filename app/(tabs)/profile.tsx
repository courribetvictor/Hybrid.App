import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { PaywallModal } from '@/components/arena/PaywallModal'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useActivities } from '@/hooks/useActivities'
import { useBodyLogs } from '@/hooks/useBodyLogs'
import { useWeeklyGoal } from '@/hooks/useGoal'
import type { GoalConfig, GoalType } from '@/hooks/useGoal'
import { SPORT_GOAL_OPTIONS, GLOBAL_GOAL_OPTIONS } from '@/constants/exercises'
import { useFollows } from '@/hooks/useFollows'
import { supabase } from '@/lib/supabase'
import { formatDurationLong, displayWeight, computeBMI, bmiCategory } from '@/lib/units'
import type { PreferredUnit, PreferredLanguage, Profile, SportType, Activity } from '@/types/database'

// ── Constants ─────────────────────────────────────────────────

const SPORT_EMOJI: Record<SportType, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊', gym: '🏋️',
  badminton: '🏸', athletics: '⚡', football: '⚽', tennis: '🎾',
  hiking: '🥾', yoga: '🧘', boxing: '🥊',
}
const SPORT_LABEL: Record<SportType, string> = {
  running: 'Course', cycling: 'Vélo', swimming: 'Natation', gym: 'Muscu',
  badminton: 'Badminton', athletics: 'Athlétisme', football: 'Football',
  tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}

interface Achievement {
  id: string; emoji: string; label: string; desc: string
  check: (p: { count: number; sports: number; streak: number; totalHours: number }) => boolean
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step',   emoji: '🌱', label: 'Premiers pas',    desc: '1ère séance',         check: ({ count }) => count >= 1 },
  { id: 'ten',          emoji: '🔟', label: 'En route',        desc: '10 séances',          check: ({ count }) => count >= 10 },
  { id: 'fifty',        emoji: '⭐', label: 'Régulier',        desc: '50 séances',          check: ({ count }) => count >= 50 },
  { id: 'hundred',      emoji: '💯', label: 'Centurion',       desc: '100 séances',         check: ({ count }) => count >= 100 },
  { id: 'three_sports', emoji: '🎯', label: 'Hybride',         desc: '3 sports différents', check: ({ sports }) => sports >= 3 },
  { id: 'five_sports',  emoji: '🌟', label: 'Polyvalent',      desc: '5 sports différents', check: ({ sports }) => sports >= 5 },
  { id: 'seven_sports', emoji: '👑', label: 'Athlète complet', desc: '7 sports différents', check: ({ sports }) => sports >= 7 },
  { id: 'ten_hours',    emoji: '⏱', label: 'Endurant',        desc: "10h d'entraînement",  check: ({ totalHours }) => totalHours >= 10 },
  { id: 'fifty_hours',  emoji: '🏆', label: 'Passionné',       desc: "50h d'entraînement",  check: ({ totalHours }) => totalHours >= 50 },
  { id: 'streak_7',     emoji: '🔥', label: 'Semaine de feu',  desc: '7j consécutifs',      check: ({ streak }) => streak >= 7 },
  { id: 'streak_30',    emoji: '🚀', label: 'Mois de fer',     desc: '30j consécutifs',     check: ({ streak }) => streak >= 30 },
]

function computeStreak(activities: Activity[]): number {
  if (!activities.length) return 0
  const days = new Set(activities.map(a => a.created_at.split('T')[0]))
  const today = new Date()
  for (let offset = 0; offset <= 1; offset++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) {
      let streak = 0
      const cur = new Date(d)
      while (days.has(cur.toISOString().split('T')[0])) {
        streak++
        cur.setDate(cur.getDate() - 1)
      }
      return streak
    }
  }
  return 0
}

const GOAL_TYPE_OPTIONS: { type: GoalType; label: string; emoji: string; unit: string }[] = [
  { type: 'sessions', label: 'Séances', emoji: '🏅', unit: 'séances' },
  { type: 'minutes',  label: 'Minutes', emoji: '⏱',  unit: 'min' },
  { type: 'km',       label: 'Distance', emoji: '📍', unit: 'km' },
]

const GOAL_VALUES: Record<GoalType, number[]> = {
  sessions: [1, 2, 3, 4, 5, 6, 7, 10, 14],
  minutes:  [60, 90, 120, 150, 180, 210, 240, 300, 360],
  km:       [10, 20, 30, 40, 50, 75, 100, 150, 200],
}

const FITNESS_LEVELS = [
  { key: 'beginner',     label: 'Débutant',      emoji: '🌱' },
  { key: 'intermediate', label: 'Intermédiaire', emoji: '💪' },
  { key: 'advanced',     label: 'Avancé',        emoji: '🔥' },
  { key: 'elite',        label: 'Élite',         emoji: '👑' },
]

const HYBRID_SCORE_MAX = 1000

function computeHybridScore(activities: any[]): number {
  const base = Math.min(activities.length * 20, 400)
  const totalSecs = activities.reduce((s: number, a: any) => s + (a.duration_seconds ?? 0), 0)
  const durationScore = Math.min(Math.floor(totalSecs / 600), 300)
  const sportSet = new Set(activities.map((a: any) => a.sport_type)).size
  const diversity = Math.min(sportSet * 50, 300)
  return Math.min(base + durationScore + diversity, HYBRID_SCORE_MAX)
}

// ── Extra profile AsyncStorage hooks ──────────────────────────

const EXTRA_KEY = 'hybrid_profile_extra'
interface ProfileExtra { bio: string; fitnessLevel: string }
const EXTRA_DEFAULT: ProfileExtra = { bio: '', fitnessLevel: '' }

function useProfileExtra() {
  const [extra, setExtraState] = useState<ProfileExtra>(EXTRA_DEFAULT)

  useEffect(() => {
    AsyncStorage.getItem(EXTRA_KEY).then(v => {
      if (v) { try { setExtraState(JSON.parse(v)) } catch {} }
    })
  }, [])

  const setExtra = useCallback(async (update: Partial<ProfileExtra>) => {
    const next = { ...extra, ...update }
    setExtraState(next)
    await AsyncStorage.setItem(EXTRA_KEY, JSON.stringify(next))
  }, [extra])

  return { extra, setExtra }
}

const NOTIF_KEY = 'hybrid_notif_settings'
const NOTIF_DEFAULTS: Record<string, boolean> = {
  new_challenges: true, friend_activity: true, reminders: false, weekly_summary: true,
}

function useNotifSettings() {
  const [settings, setSettingsState] = useState<Record<string, boolean>>(NOTIF_DEFAULTS)

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then(v => {
      if (v) { try { setSettingsState(JSON.parse(v)) } catch {} }
    })
  }, [])

  const toggle = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = { ...settings, [id]: !settings[id] }
    setSettingsState(next)
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next))
  }, [settings])

  return { settings, toggle }
}

const PRIVACY_KEY = 'hybrid_privacy_settings'
const PRIVACY_DEFAULTS: Record<string, boolean> = {
  public_profile: true, show_activities: true, show_leaderboard: true, show_body_metrics: false,
}

function usePrivacySettings() {
  const [settings, setSettingsState] = useState<Record<string, boolean>>(PRIVACY_DEFAULTS)

  useEffect(() => {
    AsyncStorage.getItem(PRIVACY_KEY).then(v => {
      if (v) { try { setSettingsState(JSON.parse(v)) } catch {} }
    })
  }, [])

  const toggle = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = { ...settings, [id]: !settings[id] }
    setSettingsState(next)
    await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(next))
  }, [settings])

  return { settings, toggle }
}

// ── Screen ────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { userId } = useSession()
  const { profile, updateProfile } = useProfile(userId ?? undefined)
  const { activities } = useActivities(userId ?? undefined, 365)
  const { logs: bodyLogs } = useBodyLogs(userId ?? undefined, 90)
  const { goal, setGoal, clearGoal } = useWeeklyGoal()
  const { extra, setExtra } = useProfileExtra()
  const { followingCount, followersCount } = useFollows(userId ?? undefined)

  const [paywallVisible, setPaywallVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [notifVisible, setNotifVisible] = useState(false)
  const [privacyVisible, setPrivacyVisible] = useState(false)
  const [goalVisible, setGoalVisible] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const pickAndUploadAvatar = useCallback(async () => {
    if (!userId) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorise l'accès à la galerie dans les réglages.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.75,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]

    // Use mimeType for extension — asset.uri on web is a blob URL with no extension
    const mime = asset.mimeType ?? 'image/jpeg'
    const ext = (mime.split('/')[1] ?? 'jpeg').replace('jpeg', 'jpg')
    const path = `${userId}/avatar.jpg` // always jpg — simpler, consistent

    setAvatarUploading(true)
    try {
      const response = await fetch(asset.uri)
      if (!response.ok) throw new Error('Impossible de lire la photo')
      const blob = await response.blob()

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw new Error(upErr.message)

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const finalUrl = publicUrl + `?t=${Date.now()}`
      setAvatarUri(finalUrl)
      await AsyncStorage.setItem('pref_avatar', finalUrl)
      await updateProfile({ avatar_url: finalUrl })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e: any) {
      console.error('Avatar upload failed:', e)
      Alert.alert('Erreur upload', e?.message ?? 'Impossible de télécharger la photo.')
    } finally {
      setAvatarUploading(false)
    }
  }, [userId, updateProfile])

  const handleAvatarPress = useCallback(() => {
    if (!userId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Close modal first — calling ImagePicker from inside a Modal causes black screen on iOS
    if (editVisible) {
      setEditVisible(false)
      setTimeout(pickAndUploadAvatar, 350)
    } else {
      pickAndUploadAvatar()
    }
  }, [userId, editVisible, pickAndUploadAvatar])

  const [unit, setUnit] = useState<PreferredUnit>('metric')
  const [lang, setLang] = useState<PreferredLanguage>('fr')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  // Load preferences from AsyncStorage first (instant), then from DB
  useEffect(() => {
    AsyncStorage.multiGet(['pref_unit', 'pref_lang', 'pref_avatar']).then(pairs => {
      const stored = Object.fromEntries(pairs.map(([k, v]) => [k, v]))
      if (stored.pref_unit)   setUnit(stored.pref_unit as PreferredUnit)
      if (stored.pref_lang)   setLang(stored.pref_lang as PreferredLanguage)
      if (stored.pref_avatar) setAvatarUri(stored.pref_avatar)
    })
  }, [])

  // Once profile loads from DB, use DB values only if no local pref stored yet
  useEffect(() => {
    if (!profile) return
    AsyncStorage.getItem('pref_unit').then(v => {
      if (!v && profile.preferred_unit) setUnit(profile.preferred_unit)
    })
    AsyncStorage.getItem('pref_lang').then(v => {
      if (!v && profile.preferred_language) setLang(profile.preferred_language)
    })
    AsyncStorage.getItem('pref_avatar').then(v => {
      if (!v && profile.avatar_url) setAvatarUri(profile.avatar_url)
    })
  }, [profile?.id]) // only on first profile load (id change)

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

  const handleToggleUnit = useCallback(async () => {
    const next: PreferredUnit = unit === 'imperial' ? 'metric' : 'imperial'
    setUnit(next)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // AsyncStorage = source de vérité locale, toujours fiable
    await AsyncStorage.setItem('pref_unit', next)
    // Synchro Supabase best-effort (silencieuse si colonne manquante)
    updateProfile({ preferred_unit: next }).catch(() => {})
  }, [unit, updateProfile])

  const handleToggleLang = useCallback(async () => {
    const next: PreferredLanguage = lang === 'en' ? 'fr' : 'en'
    setLang(next)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await AsyncStorage.setItem('pref_lang', next)
    updateProfile({ preferred_language: next }).catch(() => {})
  }, [lang, updateProfile])

  const handleSignOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await supabase.auth.signOut()
  }, [])

  const wLabel = unit === 'imperial' ? 'lbs' : 'kg'
  const weightDisplay = latestWeight ? displayWeight(latestWeight, unit) : null

  const allSports = useMemo(
    () => [...new Set(activities.map((a: Activity) => a.sport_type))] as SportType[],
    [activities],
  )
  const streak = useMemo(() => computeStreak(activities as Activity[]), [activities])
  const totalHours = Math.floor(activities.reduce((s: number, a: any) => s + a.duration_seconds, 0) / 3600)

  const achievementParams = { count: activities.length, sports: allSports.length, streak, totalHours }
  const unlockedCount = ACHIEVEMENTS.filter(a => a.check(achievementParams)).length

  const thisWeekData = useMemo(() => {
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const allWeek = (activities as Activity[]).filter(a => new Date(a.created_at) >= monday)
    const weekActs = goal?.sport && goal.sport !== 'all'
      ? allWeek.filter(a => a.sport_type === goal.sport)
      : allWeek
    const sessions = weekActs.length
    const minutes = Math.round(weekActs.reduce((s, a) => s + a.duration_seconds, 0) / 60)
    const km = parseFloat(weekActs.reduce((s, a) => {
      const m = (a as any).metrics
      return s + (m?.distance_m ? m.distance_m / 1000 : 0)
    }, 0).toFixed(1))
    return { sessions, minutes, km }
  }, [activities, goal?.sport])

  const goalCurrentValue = goal
    ? goal.type === 'sessions' ? thisWeekData.sessions
    : goal.type === 'minutes' ? thisWeekData.minutes
    : thisWeekData.km
    : 0

  const goalProgress = goal ? Math.min(goalCurrentValue / goal.value, 1) : null

  const fitnessLevel = FITNESS_LEVELS.find(f => f.key === extra.fitnessLevel)

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Profil" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} style={styles.avatarWrap}>
            <Avatar
              uri={avatarUri}
              username={profile?.username ?? '?'}
              isPro={profile?.is_pro}
              size={80}
            />
            <View style={styles.avatarEdit}>
              {avatarUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.avatarEditIcon}>📷</Text>
              }
            </View>
          </TouchableOpacity>
          <View style={styles.heroTop}>
            <Text style={styles.name}>{profile?.username ?? '—'}</Text>
            {fitnessLevel && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{fitnessLevel.emoji} {fitnessLevel.label}</Text>
              </View>
            )}
          </View>
          {extra.bio ? (
            <Text style={styles.bio}>{extra.bio}</Text>
          ) : null}

          {/* Follow counts */}
          <View style={styles.followRow}>
            <View style={styles.followItem}>
              <Text style={styles.followNum}>{followingCount}</Text>
              <Text style={styles.followLbl}>Abonnements</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followNum}>{followersCount}</Text>
              <Text style={styles.followLbl}>Abonnés</Text>
            </View>
          </View>

          <View style={styles.heroBadges}>
            {profile?.is_pro && (
              <View style={styles.proBadge}>
                <Text style={styles.proText}>⚡ PRO</Text>
              </View>
            )}
            {streak >= 2 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak} j</Text>
              </View>
            )}
          </View>
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
          <QuickStat value={String(allSports.length)} label="Sports" icon="🎯" />
          <QuickStat value={`${totalHours}h`} label="Total" icon="⚡" />
        </View>

        {/* Sport badges */}
        {allSports.length > 0 && (
          <View style={sportBadgeStyles.card}>
            <Text style={sportBadgeStyles.title}>Tes disciplines</Text>
            <View style={sportBadgeStyles.row}>
              {allSports.map(sport => (
                <View
                  key={sport}
                  style={[sportBadgeStyles.chip, { backgroundColor: SportColors[sport] + '18', borderColor: SportColors[sport] + '40' }]}
                >
                  <Text style={sportBadgeStyles.emoji}>{SPORT_EMOJI[sport]}</Text>
                  <Text style={[sportBadgeStyles.label, { color: SportColors[sport] }]}>
                    {SPORT_LABEL[sport]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Objectif hebdomadaire */}
        <TouchableOpacity
          style={goalStyles.card}
          activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoalVisible(true) }}
        >
          {goal ? (
            <>
              <View style={goalStyles.top}>
                <View style={goalStyles.typeTag}>
                  <Text style={goalStyles.typeEmoji}>
                    {(() => {
                      const s = goal.sport && goal.sport !== 'all' ? SPORT_GOAL_OPTIONS[goal.sport as SportType] : null
                      const opts = s ?? GLOBAL_GOAL_OPTIONS
                      return opts.find(o => o.type === goal.type)?.emoji ?? '🎯'
                    })()}
                  </Text>
                  <Text style={goalStyles.typeLabel}>
                    {GOAL_SPORT_LIST.find(s => s.key === (goal.sport ?? 'all'))?.emoji ?? ''}{' '}
                    {(() => {
                      const s = goal.sport && goal.sport !== 'all' ? SPORT_GOAL_OPTIONS[goal.sport as SportType] : null
                      const opts = s ?? GLOBAL_GOAL_OPTIONS
                      return opts.find(o => o.type === goal.type)?.label ?? ''
                    })()}
                  </Text>
                </View>
                <View style={goalStyles.valueWrap}>
                  <Text style={goalStyles.goalNum}>{goal.value}</Text>
                  <Text style={goalStyles.goalUnit}>
                    {(() => {
                      const s = goal.sport && goal.sport !== 'all' ? SPORT_GOAL_OPTIONS[goal.sport as SportType] : null
                      const opts = s ?? GLOBAL_GOAL_OPTIONS
                      return opts.find(o => o.type === goal.type)?.unit ?? ''
                    })()}/sem.
                  </Text>
                </View>
              </View>
              <View style={goalStyles.progressRow}>
                <View style={goalStyles.bar}>
                  <View style={[goalStyles.barFill, { width: `${(goalProgress ?? 0) * 100}%` as any }]} />
                </View>
                <Text style={goalStyles.progressLabel}>
                  {goalCurrentValue} / {goal.value}
                  {goalProgress === 1 ? ' 🎉' : ''}
                </Text>
              </View>
            </>
          ) : (
            <View style={goalStyles.emptyRow}>
              <View style={goalStyles.emptyLeft}>
                <Text style={goalStyles.emptyTitle}>🎯 Objectif hebdomadaire</Text>
                <Text style={goalStyles.emptySub}>
                  Séances, minutes ou kilomètres par semaine
                </Text>
              </View>
              <Text style={goalStyles.setLabel}>Définir →</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Achievements */}
        <View style={achieveStyles.card}>
          <View style={achieveStyles.header}>
            <Text style={achieveStyles.title}>Accomplissements</Text>
            <Text style={achieveStyles.count}>{unlockedCount} / {ACHIEVEMENTS.length}</Text>
          </View>
          <View style={achieveStyles.grid}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = a.check(achievementParams)
              return (
                <View key={a.id} style={[achieveStyles.badge, !unlocked && achieveStyles.badgeLocked]}>
                  <Text style={[achieveStyles.badgeEmoji, !unlocked && achieveStyles.badgeEmojiLocked]}>
                    {unlocked ? a.emoji : '🔒'}
                  </Text>
                  <Text style={[achieveStyles.badgeLabel, !unlocked && achieveStyles.badgeLabelLocked]}>
                    {a.label}
                  </Text>
                  <Text style={achieveStyles.badgeDesc}>{a.desc}</Text>
                </View>
              )
            })}
          </View>
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
          <ToggleRow
            label="Unités impériales"
            sub="Miles, livres, pieds"
            value={unit === 'imperial'}
            onToggle={handleToggleUnit}
          />
          <View style={prefStyles.divider} />
          <ToggleRow
            label="Langue anglaise"
            sub="Interface en English"
            value={lang === 'en'}
            onToggle={handleToggleLang}
          />
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
            sub={extra.bio ? 'Bio, niveau fitness...' : 'Pseudo, mensuration, bio...'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setEditVisible(true)
            }}
          />
          <ActionRow
            icon="📊"
            label="Objectif hebdomadaire"
            badge={goal ? `${goal.value} ${(goal.sport && goal.sport !== 'all' ? SPORT_GOAL_OPTIONS[goal.sport as SportType] : GLOBAL_GOAL_OPTIONS).find(o => o.type === goal.type)?.unit ?? ''}` : undefined}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setGoalVisible(true)
            }}
          />
          <ActionRow
            icon="🔔"
            label="Notifications"
            sub="Défis, amis, rappels..."
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setNotifVisible(true)
            }}
          />
          <ActionRow
            icon="🔒"
            label="Confidentialité"
            sub="Profil, activités, classement..."
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
        avatarUri={avatarUri}
        unit={unit}
        extra={extra}
        onSave={updateProfile}
        onSaveExtra={setExtra}
        onAvatarPress={handleAvatarPress}
        avatarUploading={avatarUploading}
      />
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      <GoalModal
        visible={goalVisible}
        current={goal}
        onSave={config => { setGoal(config); setGoalVisible(false) }}
        onClear={() => { clearGoal(); setGoalVisible(false) }}
        onClose={() => setGoalVisible(false)}
      />
    </View>
  )
}

// ── Sub-components ────────────────────────────────────────────

function ActionRow({ icon, label, sub, badge, onPress }: {
  icon: string; label: string; sub?: string; badge?: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={actionStyles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={actionStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={actionStyles.label}>{label}</Text>
        {sub && <Text style={actionStyles.sub}>{sub}</Text>}
      </View>
      {badge && (
        <View style={actionStyles.badge}>
          <Text style={actionStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={actionStyles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

function ToggleRow({ label, sub, value, onToggle }: {
  label: string; sub?: string; value: boolean; onToggle: () => void
}) {
  return (
    <TouchableOpacity style={toggleRowStyles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={toggleRowStyles.label}>{label}</Text>
        {sub && <Text style={toggleRowStyles.sub}>{sub}</Text>}
      </View>
      <View style={[toggleStyles.track, value && toggleStyles.trackOn]}>
        <View style={[toggleStyles.thumb, value && toggleStyles.thumbOn]} />
      </View>
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

// ── Goal Modal ────────────────────────────────────────────────

const GOAL_SPORT_LIST: { key: SportType | 'all'; label: string; emoji: string }[] = [
  { key: 'all',      label: 'Tous',       emoji: '🌐' },
  { key: 'running',  label: 'Course',     emoji: '🏃' },
  { key: 'cycling',  label: 'Vélo',       emoji: '🚴' },
  { key: 'swimming', label: 'Natation',   emoji: '🏊' },
  { key: 'gym',      label: 'Muscu',      emoji: '🏋️' },
  { key: 'hiking',   label: 'Rando',      emoji: '🥾' },
  { key: 'football', label: 'Football',   emoji: '⚽' },
  { key: 'tennis',   label: 'Tennis',     emoji: '🎾' },
  { key: 'badminton',label: 'Badminton',  emoji: '🏸' },
  { key: 'boxing',   label: 'Boxe',       emoji: '🥊' },
  { key: 'athletics',label: 'Athlé.',     emoji: '⚡' },
  { key: 'yoga',     label: 'Yoga',       emoji: '🧘' },
]

function GoalModal({
  visible, current, onSave, onClear, onClose,
}: {
  visible: boolean
  current: GoalConfig | null
  onSave: (config: GoalConfig) => void
  onClear: () => void
  onClose: () => void
}) {
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>(current?.sport ?? 'all')
  const [selectedType, setSelectedType] = useState<GoalType>(current?.type ?? 'sessions')
  const [customVal, setCustomVal] = useState('')

  useEffect(() => {
    if (visible) {
      setSelectedSport(current?.sport ?? 'all')
      setSelectedType(current?.type ?? 'sessions')
      setCustomVal('')
    }
  }, [visible, current])

  const sportOptions = selectedSport === 'all'
    ? GLOBAL_GOAL_OPTIONS
    : (SPORT_GOAL_OPTIONS[selectedSport as SportType] ?? GLOBAL_GOAL_OPTIONS)

  // Reset type if current type not available for new sport
  useEffect(() => {
    if (!sportOptions.find(o => o.type === selectedType)) {
      setSelectedType(sportOptions[0]?.type as GoalType ?? 'sessions')
    }
  }, [selectedSport, sportOptions, selectedType])

  const typeInfo = sportOptions.find(o => o.type === selectedType) ?? sportOptions[0]

  const handleSave = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSave({ type: selectedType as GoalType, value, sport: selectedSport })
  }

  const handleCustomSave = () => {
    const v = parseInt(customVal)
    if (!isNaN(v) && v > 0) handleSave(v)
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={sheetStyles.overlay}>
          <TouchableOpacity style={sheetStyles.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={[sheetStyles.sheet, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={sheetStyles.handle} />
              <Text style={sheetStyles.sheetTitle}>🎯 Objectif hebdomadaire</Text>

              {/* Sport selector */}
              <Text style={goalModalStyles.sectionLabel}>Pour quel sport ?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={goalModalStyles.sportRow}>
                {GOAL_SPORT_LIST.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[goalModalStyles.sportChip, selectedSport === s.key && goalModalStyles.sportChipActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedSport(s.key) }}
                    activeOpacity={0.75}
                  >
                    <Text style={goalModalStyles.typeEmoji}>{s.emoji}</Text>
                    <Text style={[goalModalStyles.typeLabel, selectedSport === s.key && goalModalStyles.typeLabelActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Metric type selector */}
              <Text style={goalModalStyles.sectionLabel}>Mesure</Text>
              <View style={goalModalStyles.typeRow}>
                {sportOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[goalModalStyles.typeChip, selectedType === opt.type && goalModalStyles.typeChipActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedType(opt.type as GoalType) }}
                    activeOpacity={0.75}
                  >
                    <Text style={goalModalStyles.typeEmoji}>{opt.emoji}</Text>
                    <Text style={[goalModalStyles.typeLabel, selectedType === opt.type && goalModalStyles.typeLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[sheetStyles.note, { textAlign: 'left', marginBottom: 0 }]}>
                {typeInfo?.unit ?? ''} par semaine
              </Text>

              {/* Value grid */}
              <View style={goalModalStyles.grid}>
                {(typeInfo?.values ?? []).map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      goalModalStyles.option,
                      current?.type === selectedType && current?.value === n && current?.sport === selectedSport && goalModalStyles.optionActive,
                    ]}
                    onPress={() => handleSave(n)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      goalModalStyles.optionNum,
                      current?.type === selectedType && current?.value === n && current?.sport === selectedSport && goalModalStyles.optionNumActive,
                    ]}>
                      {n}
                    </Text>
                    <Text style={[
                      goalModalStyles.optionLabel,
                      current?.type === selectedType && current?.value === n && current?.sport === selectedSport && goalModalStyles.optionLabelActive,
                    ]}>
                      {typeInfo?.unit ?? ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom value */}
              <View style={goalModalStyles.customRow}>
                <TextInput
                  style={goalModalStyles.customInput}
                  value={customVal}
                  onChangeText={setCustomVal}
                  placeholder={`Valeur personnalisée (${typeInfo?.unit ?? ''})`}
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={goalModalStyles.customBtn} onPress={handleCustomSave} activeOpacity={0.8}>
                  <Text style={goalModalStyles.customBtnText}>OK</Text>
                </TouchableOpacity>
              </View>

              {current !== null && (
                <TouchableOpacity onPress={onClear} style={sheetStyles.cancelWrap} activeOpacity={0.7}>
                  <Text style={[sheetStyles.cancelText, { color: Colors.error }]}>Supprimer l'objectif</Text>
                </TouchableOpacity>
              )}
              <Button label="Fermer" variant="ghost" onPress={onClose} style={{ marginTop: Spacing.xs }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Edit Profile Modal ────────────────────────────────────────

function EditProfileModal({
  visible, onClose, profile, avatarUri, unit, extra, onSave, onSaveExtra, onAvatarPress, avatarUploading,
}: {
  visible: boolean
  onClose: () => void
  profile: Profile | null
  avatarUri: string | null
  unit: PreferredUnit
  extra: { bio: string; fitnessLevel: string }
  onSave: (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => Promise<void>
  onSaveExtra: (update: { bio?: string; fitnessLevel?: string }) => Promise<void>
  onAvatarPress: () => void
  avatarUploading: boolean
}) {
  const [username, setUsername] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [bio, setBio] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (visible && profile) {
      setUsername(profile.username ?? '')
      setHeightInput(profile.height_cm ? String(profile.height_cm) : '')
      setWeightInput(profile.current_weight_kg ? String(profile.current_weight_kg) : '')
      setBio(extra.bio)
      setFitnessLevel(extra.fitnessLevel)
      setErrorMsg(null)
    }
  }, [visible, profile, extra])

  const handleSave = async () => {
    setErrorMsg(null)
    if (!username.trim()) { setErrorMsg("Le nom d'utilisateur est requis."); return }
    if (username.trim().length < 3) { setErrorMsg('Min. 3 caractères pour le pseudo.'); return }
    setSaving(true)
    try {
      await Promise.all([
        onSave({
          username: username.trim(),
          height_cm: heightInput ? parseFloat(heightInput) || undefined : undefined,
          current_weight_kg: weightInput ? parseFloat(weightInput) || undefined : undefined,
        }),
        onSaveExtra({ bio: bio.trim(), fitnessLevel }),
      ])
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
        <ScrollView style={sheetStyles.sheetScroll} contentContainerStyle={sheetStyles.sheetScrollContent}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>Modifier le profil</Text>

          {/* Avatar picker */}
          <View style={editStyles.avatarSection}>
            <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8} style={editStyles.avatarBtn}>
              <Avatar
                uri={avatarUri ?? profile?.avatar_url}
                username={profile?.username ?? '?'}
                isPro={false}
                size={72}
              />
              <View style={editStyles.avatarOverlay}>
                {avatarUploading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={editStyles.avatarOverlayIcon}>📷</Text>
                }
              </View>
            </TouchableOpacity>
            <Text style={editStyles.avatarHint}>
              {avatarUploading ? 'Téléchargement...' : 'Changer la photo'}
            </Text>
          </View>

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

          {/* Bio */}
          <View style={sheetStyles.fieldWrap}>
            <Text style={sheetStyles.fieldLabel}>Bio</Text>
            <TextInput
              style={[sheetStyles.fieldInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              value={bio}
              onChangeText={t => setBio(t.slice(0, 150))}
              placeholder="Une phrase sur toi... (150 chars max)"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />
            <Text style={sheetStyles.charCount}>{bio.length}/150</Text>
          </View>

          {/* Fitness level */}
          <View style={sheetStyles.fieldWrap}>
            <Text style={sheetStyles.fieldLabel}>Niveau fitness</Text>
            <View style={editStyles.levelRow}>
              {FITNESS_LEVELS.map(fl => (
                <TouchableOpacity
                  key={fl.key}
                  style={[editStyles.levelChip, fitnessLevel === fl.key && editStyles.levelChipActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFitnessLevel(fl.key) }}
                  activeOpacity={0.75}
                >
                  <Text style={editStyles.levelEmoji}>{fl.emoji}</Text>
                  <Text style={[editStyles.levelLabel, fitnessLevel === fl.key && editStyles.levelLabelActive]}>
                    {fl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Notifications Modal ───────────────────────────────────────

const NOTIF_SETTINGS_DEF = [
  { id: 'new_challenges', title: 'Nouveaux défis', subtitle: 'Quand un défi hebdomadaire est disponible' },
  { id: 'friend_activity', title: 'Activités des amis', subtitle: 'Quand un ami ajoute une séance' },
  { id: 'reminders', title: "Rappels d'entraînement", subtitle: "Un rappel si tu n'as pas bougé depuis 3 jours" },
  { id: 'weekly_summary', title: 'Résumé hebdomadaire', subtitle: 'Ton bilan sportif chaque lundi matin' },
]

function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, toggle } = useNotifSettings()

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <TouchableOpacity style={sheetStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>🔔  Notifications</Text>

          {NOTIF_SETTINGS_DEF.map((s, i) => (
            <React.Fragment key={s.id}>
              <ToggleRow
                label={s.title}
                sub={s.subtitle}
                value={settings[s.id] ?? NOTIF_DEFAULTS[s.id]}
                onToggle={() => toggle(s.id)}
              />
              {i < NOTIF_SETTINGS_DEF.length - 1 && <View style={sheetStyles.divider} />}
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

const PRIVACY_SETTINGS_DEF = [
  { id: 'public_profile', title: 'Profil public', subtitle: 'Visible par tous les utilisateurs' },
  { id: 'show_activities', title: 'Activités publiques', subtitle: 'Tes séances dans le feed de tes amis' },
  { id: 'show_leaderboard', title: 'Classement', subtitle: "Ton score visible dans l'Arène" },
  { id: 'show_body_metrics', title: 'Métriques corporelles', subtitle: 'Partager poids et IMC' },
]

function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, toggle } = usePrivacySettings()

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <TouchableOpacity style={sheetStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>🔒  Confidentialité</Text>

          {PRIVACY_SETTINGS_DEF.map((s, i) => (
            <React.Fragment key={s.id}>
              <ToggleRow
                label={s.title}
                sub={s.subtitle}
                value={settings[s.id] ?? PRIVACY_DEFAULTS[s.id]}
                onToggle={() => toggle(s.id)}
              />
              {i < PRIVACY_SETTINGS_DEF.length - 1 && <View style={sheetStyles.divider} />}
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
  avatarWrap: { position: 'relative' },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgCard,
  },
  avatarEditIcon: { fontSize: 11 },
  heroTop: { alignItems: 'center', gap: 4 },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.3 },
  bio: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg, lineHeight: 18 },
  levelBadge: {
    backgroundColor: Colors.bgAlt,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  proBadge: {
    backgroundColor: Colors.electricDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  proText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.electric },
  joined: { fontSize: FontSize.sm, color: Colors.textTertiary },
  heroBadges: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'center', flexWrap: 'wrap' },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  followItem: { alignItems: 'center', gap: 1 },
  followNum: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  followLbl: { fontSize: FontSize.xs, color: Colors.textTertiary },
  followDivider: { width: 1, height: 28, backgroundColor: Colors.borderLight },
  streakBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#C2410C' },
  actions: { gap: Spacing.sm },
  signOutWrap: { paddingTop: Spacing.sm },
  version: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', paddingTop: Spacing.sm },
})

const toggleStyles = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: { backgroundColor: Colors.electric },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: { alignSelf: 'flex-end' },
})

const toggleRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 8,
  },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  sub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
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
    paddingVertical: Spacing.sm,
    gap: 0,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 6, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.borderLight },
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
  label: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  sub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  badge: {
    backgroundColor: Colors.electricDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.electric },
  chevron: { fontSize: 20, color: Colors.textTertiary, lineHeight: 22 },
})

const sportBadgeStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  emoji: { fontSize: 13 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
})

const goalStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.electricDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  typeEmoji: { fontSize: 13 },
  typeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.electric },
  valueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  goalNum: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.electric },
  goalUnit: { fontSize: FontSize.sm, color: Colors.textTertiary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bar: { flex: 1, height: 8, backgroundColor: Colors.bgAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.electric, borderRadius: 4 },
  progressLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.electric, minWidth: 50 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  emptyLeft: { flex: 1, gap: 3 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.xs, color: Colors.textTertiary },
  setLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.electric },
})

const achieveStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  count: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.electric },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badge: {
    width: 72,
    alignItems: 'center',
    gap: 3,
    padding: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
  },
  badgeLocked: { opacity: 0.45 },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: {},
  badgeLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  badgeLabelLocked: { color: Colors.textTertiary },
  badgeDesc: { fontSize: 8, color: Colors.textTertiary, textAlign: 'center' },
})

const editStyles = StyleSheet.create({
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.xs },
  avatarBtn: { position: 'relative' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgCard,
  },
  avatarOverlayIcon: { fontSize: 12 },
  avatarHint: { fontSize: FontSize.xs, color: Colors.textTertiary },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  levelChipActive: { borderColor: Colors.electric, backgroundColor: Colors.electricDim },
  levelEmoji: { fontSize: 14 },
  levelLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  levelLabelActive: { color: Colors.electric, fontWeight: FontWeight.bold },
})

const goalModalStyles = StyleSheet.create({
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipActive: { borderColor: Colors.electric, backgroundColor: Colors.electricDim },
  typeEmoji: { fontSize: 15 },
  typeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  typeLabelActive: { color: Colors.electric },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  option: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
    gap: 2,
  },
  optionActive: { backgroundColor: Colors.electric },
  optionNum: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  optionNumActive: { color: Colors.textInverse },
  optionLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  optionLabelActive: { color: Colors.textInverse },
  customRow: { flexDirection: 'row', gap: Spacing.sm },
  customInput: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  customBtn: {
    backgroundColor: Colors.electric,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  sportRow: { gap: Spacing.sm, paddingBottom: 8 },
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
  sportChipActive: { borderColor: Colors.electric, backgroundColor: Colors.electricDim },
})

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  sheetScroll: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  sheetScrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
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
  charCount: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right' },
})
