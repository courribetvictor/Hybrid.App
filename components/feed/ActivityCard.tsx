import React, { useCallback, useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { formatDurationLong, formatDistance, formatPace } from '@/lib/units'
import type { ActivityWithProfile, SportType, EnduranceMetrics, GymMetrics, BadmintonMetrics } from '@/types/database'

const SPORT_EMOJI: Record<SportType, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊',
  gym: '🏋️', badminton: '🏸', athletics: '⚡',
  football: '⚽', tennis: '🎾', hiking: '🥾', yoga: '🧘', boxing: '🥊',
}
const SPORT_LABEL: Record<SportType, string> = {
  running: 'Course à pied', cycling: 'Vélo', swimming: 'Natation',
  gym: 'Musculation', badminton: 'Badminton', athletics: 'Athlétisme',
  football: 'Football', tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}
const SPORT_BANNER_EMOJI: Record<SportType, string> = {
  running: '🏃‍♂️', cycling: '🚵', swimming: '🏊‍♀️',
  gym: '💪', badminton: '🏸', athletics: '🎽',
  football: '⚽', tennis: '🎾', hiking: '🏔️', yoga: '🕉️', boxing: '🥊',
}
const SPORT_BG_PATTERN: Record<SportType, string[]> = {
  running:   ['F', 'P', 'C', 'S'],
  cycling:   ['V', 'D', 'T', 'M'],
  swimming:  ['∼', '≈', '∼', '≈'],
  gym:       ['💪', '🔥', '⚡', '💥'],
  badminton: ['→', '←', '↗', '↙'],
  athletics: ['⚡', '🏅', '⚡', '🏅'],
  football:  ['⚽', '🥅', '⚽', '🥅'],
  tennis:    ['🎾', '⟳', '🎾', '⟳'],
  hiking:    ['△', '◇', '△', '◇'],
  yoga:      ['☯', '✿', '☯', '✿'],
  boxing:    ['🥊', '💫', '🥊', '💫'],
}

export function ActivityCard({ activity, unit = 'metric', index = 0 }: {
  activity: ActivityWithProfile
  unit?: 'metric' | 'imperial'
  index?: number
}) {
  const [kudosed, setKudosed] = useState(false)
  const [kudosCount, setKudosCount] = useState(0)
  const scale = useSharedValue(1)

  // Entrance animation
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(24)

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 280 }))
    translateY.value = withDelay(index * 60, withSpring(0, { damping: 18, stiffness: 200 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handleKudos = useCallback(() => {
    if (kudosed) return
    scale.value = withSequence(
      withSpring(1.5, { damping: 5, stiffness: 500 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setKudosed(true)
    setKudosCount(c => c + 1)
  }, [kudosed, scale])

  const accent = SportColors[activity.sport_type]
  const metrics = getMetrics(activity, unit)
  const patterns = SPORT_BG_PATTERN[activity.sport_type]

  return (
    <Animated.View style={[styles.card, entranceStyle]}>
      {/* Sport banner */}
      <View style={[styles.banner, { backgroundColor: accent }]}>
        {/* Pattern bg */}
        <View style={styles.bannerPattern}>
          {patterns.map((p, i) => (
            <Text key={i} style={[styles.patternChar, { opacity: 0.15 + (i % 2) * 0.08 }]}>{p}</Text>
          ))}
        </View>
        {/* Content */}
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEmoji}>{SPORT_BANNER_EMOJI[activity.sport_type]}</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerSport}>{SPORT_LABEL[activity.sport_type]}</Text>
            <Text style={styles.bannerDuration}>{formatDurationLong(activity.duration_seconds)}</Text>
          </View>
        </View>
        {/* Calories badge */}
        {activity.calories_burned ? (
          <View style={styles.calBadge}>
            <Text style={styles.calBadgeText}>🔥 {activity.calories_burned} kcal</Text>
          </View>
        ) : null}
      </View>

      {/* User row */}
      <View style={styles.header}>
        <Avatar
          uri={activity.profile.avatar_url}
          username={activity.profile.username}
          isPro={activity.profile.is_pro}
          size={36}
        />
        <View style={styles.headerText}>
          <Text style={styles.username}>{activity.profile.username}</Text>
          <Text style={styles.meta}>{timeAgo(activity.created_at)}</Text>
        </View>
      </View>

      {/* Metric grid */}
      {metrics.length > 0 && (
        <View style={styles.metricGrid}>
          {metrics.map((m, i) => (
            <View key={i} style={[styles.metricCell, { borderLeftColor: accent + '50', borderLeftWidth: i === 0 ? 0 : 1 }]}>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleKudos} activeOpacity={0.75} style={styles.kudosWrap}>
          <Animated.Text style={[styles.kudosEmoji, animStyle]}>
            {kudosed ? '🔥' : '👊'}
          </Animated.Text>
          <Text style={[styles.kudosText, kudosed && styles.kudosActive]}>
            {kudosed ? `Kudos · ${kudosCount}` : 'Kudos'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.sportDot, { backgroundColor: accent }]} />
      </View>
    </Animated.View>
  )
}

function getMetrics(a: ActivityWithProfile, unit: 'metric' | 'imperial') {
  const m = a.metrics as any
  const out: { value: string; label: string }[] = []
  switch (a.sport_type) {
    case 'running':
    case 'cycling':
    case 'swimming': {
      const em = m as EnduranceMetrics
      if (em.distance_m) out.push({ value: formatDistance(em.distance_m, unit), label: 'Distance' })
      if (em.avg_pace_s_per_km) out.push({ value: formatPace(em.avg_pace_s_per_km, unit), label: 'Allure moy.' })
      if (em.avg_heart_rate) out.push({ value: `${em.avg_heart_rate} bpm`, label: 'FC moy.' })
      if (em.elevation_m) out.push({ value: `${Math.round(em.elevation_m)} m`, label: 'Dénivelé' })
      break
    }
    case 'gym': {
      const gm = m as GymMetrics
      const wLabel = unit === 'imperial' ? 'lbs' : 'kg'
      const vol = gm.total_volume_kg ? (unit === 'imperial' ? Math.round(gm.total_volume_kg * 2.20462) : Math.round(gm.total_volume_kg)) : null
      if (vol) out.push({ value: `${vol} ${wLabel}`, label: 'Volume total' })
      if (gm.exercises?.length) out.push({ value: String(gm.exercises.length), label: 'Exercices' })
      const totalSets = gm.exercises?.reduce((s, e) => s + e.sets.length, 0) ?? 0
      if (totalSets) out.push({ value: String(totalSets), label: 'Séries' })
      break
    }
    case 'badminton': {
      const bm = m as BadmintonMetrics
      const score = bm.sets.map(s => `${s.player_score}-${s.opponent_score}`).join(' / ')
      out.push({ value: score || '—', label: 'Score' })
      out.push({ value: bm.match_won ? '✅ Victoire' : '💪 Défaite', label: 'Résultat' })
      break
    }
    case 'athletics': {
      if (m.event) out.push({ value: m.event, label: 'Épreuve' })
      if (m.result_value) out.push({ value: `${m.result_value} ${m.result_unit ?? ''}`, label: 'Résultat' })
      break
    }
    case 'hiking': {
      if (m.distance_m) out.push({ value: formatDistance(m.distance_m, unit), label: 'Distance' })
      if (m.elevation_m) out.push({ value: `${Math.round(m.elevation_m)} m`, label: 'Dénivelé' })
      if (m.avg_heart_rate) out.push({ value: `${m.avg_heart_rate} bpm`, label: 'FC moy.' })
      break
    }
    case 'football': {
      out.push({ value: m.match_won ? '✅ Victoire' : '💪 Défaite', label: 'Résultat' })
      if (m.goals_scored !== undefined) out.push({ value: String(m.goals_scored), label: 'Buts' })
      if (m.assists !== undefined) out.push({ value: String(m.assists), label: 'Passes déc.' })
      break
    }
    case 'tennis': {
      if (m.sets?.length) {
        const score = m.sets.map((s: any) => `${s.player_games}-${s.opponent_games}`).join(' / ')
        out.push({ value: score, label: 'Score' })
      }
      out.push({ value: m.match_won ? '✅ Victoire' : '💪 Défaite', label: 'Résultat' })
      if (m.aces) out.push({ value: String(m.aces), label: 'Aces' })
      break
    }
    case 'yoga': {
      const STYLE_LABELS: Record<string, string> = {
        hatha: 'Hatha', vinyasa: 'Vinyasa', yin: 'Yin', ashtanga: 'Ashtanga', power: 'Power', other: 'Autre',
      }
      if (m.style) out.push({ value: STYLE_LABELS[m.style] ?? m.style, label: 'Style' })
      if (m.avg_heart_rate) out.push({ value: `${m.avg_heart_rate} bpm`, label: 'FC moy.' })
      break
    }
    case 'boxing': {
      const TYPE_LABELS: Record<string, string> = {
        bag: 'Sac', pad_work: 'Pattes', sparring: 'Sparring', competition: 'Compétition',
      }
      if (m.bout_type) out.push({ value: TYPE_LABELS[m.bout_type] ?? m.bout_type, label: 'Type' })
      if (m.rounds) out.push({ value: String(m.rounds), label: 'Rounds' })
      if (m.avg_heart_rate) out.push({ value: `${m.avg_heart_rate} bpm`, label: 'FC moy.' })
      break
    }
  }
  return out.slice(0, 4)
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Hier'
  return `Il y a ${Math.floor(s / 86400)} j`
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  banner: {
    height: 88,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bannerPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: 8,
  },
  patternChar: {
    fontSize: 28,
    color: '#fff',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  bannerEmoji: {
    fontSize: 36,
  },
  bannerText: { flex: 1, gap: 2 },
  bannerSport: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bannerDuration: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  calBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  calBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerText: { flex: 1 },
  username: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  metricGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  metricCell: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  metricValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  kudosWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kudosEmoji: { fontSize: 20 },
  kudosText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  kudosActive: { color: Colors.electric },
  sportDot: { width: 8, height: 8, borderRadius: 4 },
})
