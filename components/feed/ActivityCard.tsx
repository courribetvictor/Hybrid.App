import React, { useCallback, useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, withTiming, withDelay,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  MapPin, Timer, Heart, Mountain, Dumbbell, Target,
  Trophy, Flame, CheckCircle2, XCircle, Zap, Star,
} from 'lucide-react-native'
import { Avatar } from '@/components/ui/Avatar'
import { SPORTS_CONFIG, type LucideIcon } from '@/constants/sports'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { formatDurationLong, formatDistance, formatPace } from '@/lib/units'
import type { ActivityWithProfile, EnduranceMetrics, GymMetrics, BadmintonMetrics } from '@/types/database'

type MetricItem = { value: string; label: string; Icon: LucideIcon }

export function ActivityCard({ activity, unit = 'metric', index = 0 }: {
  activity: ActivityWithProfile
  unit?: 'metric' | 'imperial'
  index?: number
}) {
  const [kudosed, setKudosed] = useState(false)
  const [kudosCount, setKudosCount] = useState(0)
  const scale = useSharedValue(1)
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
  const flameAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

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

  const sport = SPORTS_CONFIG[activity.sport_type]
  const accent = sport.color
  const { Icon: SportIcon } = sport
  const metrics = getMetrics(activity, unit)

  return (
    <Animated.View style={[styles.card, entranceStyle]}>
      {/* ── Banner ── */}
      <LinearGradient
        colors={[accent, accent + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.iconCircle}>
          <SportIcon size={26} color="#fff" strokeWidth={1.8} />
        </View>

        <View style={styles.bannerText}>
          <Text style={styles.bannerSport} numberOfLines={1}>
            {sport.labelLong.toUpperCase()}
          </Text>
          <Text style={styles.bannerDuration}>
            {formatDurationLong(activity.duration_seconds)}
          </Text>
        </View>

        {!!activity.calories_burned && (
          <View style={styles.calBadge}>
            <Flame size={11} color="rgba(255,255,255,0.95)" strokeWidth={2.2} />
            <Text style={styles.calText}>{activity.calories_burned} kcal</Text>
          </View>
        )}
      </LinearGradient>

      {/* ── User row ── */}
      <View style={styles.userRow}>
        <Avatar
          uri={activity.profile.avatar_url}
          username={activity.profile.username}
          isPro={activity.profile.is_pro}
          size={34}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{activity.profile.username}</Text>
          <Text style={styles.meta}>{timeAgo(activity.created_at)}</Text>
        </View>
      </View>

      {/* ── Metrics ── */}
      {metrics.length > 0 && (
        <View style={styles.metricRow}>
          {metrics.map((m, i) => (
            <View
              key={i}
              style={[
                styles.metricCell,
                i > 0 && { borderLeftWidth: 1, borderLeftColor: Colors.borderLight },
              ]}
            >
              <m.Icon size={12} color={accent} strokeWidth={2} />
              <Text style={styles.metricVal}>{m.value}</Text>
              <Text style={styles.metricLbl}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleKudos} activeOpacity={0.75} style={styles.kudosBtn}>
          <Animated.View style={flameAnim}>
            <Flame
              size={16}
              color={kudosed ? '#FF6B35' : Colors.textTertiary}
              fill={kudosed ? '#FF6B35' : 'none'}
              strokeWidth={2}
            />
          </Animated.View>
          <Text style={[styles.kudosText, kudosed && styles.kudosActive]}>
            {kudosCount > 0 ? `${kudosCount} Kudos` : 'Kudos'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.sportPill, { backgroundColor: accent + '18' }]}>
          <SportIcon size={11} color={accent} strokeWidth={2} />
          <Text style={[styles.sportPillLabel, { color: accent }]}>{sport.label}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ── Metrics builder ───────────────────────────────────────────

function getMetrics(a: ActivityWithProfile, unit: 'metric' | 'imperial'): MetricItem[] {
  const m = a.metrics as any
  const out: MetricItem[] = []

  switch (a.sport_type) {
    case 'running':
    case 'cycling':
    case 'swimming': {
      const em = m as EnduranceMetrics
      if (em.distance_m)       out.push({ value: formatDistance(em.distance_m, unit),         label: 'Distance', Icon: MapPin })
      if (em.avg_pace_s_per_km) out.push({ value: formatPace(em.avg_pace_s_per_km, unit),      label: 'Allure',   Icon: Timer })
      if (em.avg_heart_rate)    out.push({ value: `${em.avg_heart_rate} bpm`,                  label: 'FC moy.',  Icon: Heart })
      if (em.elevation_m)       out.push({ value: `${Math.round(em.elevation_m)} m`,           label: 'D+',       Icon: Mountain })
      break
    }
    case 'gym': {
      const gm = m as GymMetrics
      const wLabel = unit === 'imperial' ? 'lbs' : 'kg'
      const vol = gm.total_volume_kg
        ? (unit === 'imperial' ? Math.round(gm.total_volume_kg * 2.20462) : Math.round(gm.total_volume_kg))
        : null
      if (vol)                out.push({ value: `${vol} ${wLabel}`, label: 'Volume',    Icon: Dumbbell })
      if (gm.exercises?.length) out.push({ value: String(gm.exercises.length), label: 'Exercices', Icon: Target })
      const sets = gm.exercises?.reduce((s, e) => s + e.sets.length, 0) ?? 0
      if (sets)               out.push({ value: String(sets), label: 'Séries', Icon: Zap })
      break
    }
    case 'badminton': {
      const bm = m as BadmintonMetrics
      const score = bm.sets?.map((s: any) => `${s.player_score}-${s.opponent_score}`).join(' / ')
      if (score) out.push({ value: score, label: 'Score', Icon: Trophy })
      out.push({
        value: bm.match_won ? 'Victoire' : 'Défaite',
        label: 'Résultat',
        Icon: bm.match_won ? CheckCircle2 : XCircle,
      })
      break
    }
    case 'tennis': {
      if (m.sets?.length) {
        const score = m.sets.map((s: any) => `${s.player_games}-${s.opponent_games}`).join(' / ')
        out.push({ value: score, label: 'Score', Icon: Trophy })
      }
      out.push({ value: m.match_won ? 'Victoire' : 'Défaite', label: 'Résultat', Icon: m.match_won ? CheckCircle2 : XCircle })
      if (m.aces) out.push({ value: String(m.aces), label: 'Aces', Icon: Zap })
      break
    }
    case 'football': {
      out.push({ value: m.match_won ? 'Victoire' : 'Défaite', label: 'Résultat', Icon: m.match_won ? CheckCircle2 : XCircle })
      if (m.goals_scored !== undefined) out.push({ value: String(m.goals_scored), label: 'Buts',       Icon: Target })
      if (m.assists !== undefined)      out.push({ value: String(m.assists),       label: 'Passes déc.', Icon: Star })
      break
    }
    case 'hiking': {
      if (m.distance_m)   out.push({ value: formatDistance(m.distance_m, unit), label: 'Distance', Icon: MapPin })
      if (m.elevation_m)  out.push({ value: `${Math.round(m.elevation_m)} m`,   label: 'D+',       Icon: Mountain })
      if (m.avg_heart_rate) out.push({ value: `${m.avg_heart_rate} bpm`,         label: 'FC moy.',  Icon: Heart })
      break
    }
    case 'athletics': {
      if (m.event)        out.push({ value: m.event,                                         label: 'Épreuve',  Icon: Target })
      if (m.result_value) out.push({ value: `${m.result_value} ${m.result_unit ?? ''}`.trim(), label: 'Résultat', Icon: Trophy })
      break
    }
    case 'yoga': {
      const STYLE_MAP: Record<string, string> = {
        hatha: 'Hatha', vinyasa: 'Vinyasa', yin: 'Yin', ashtanga: 'Ashtanga', power: 'Power', other: 'Autre',
      }
      if (m.style)          out.push({ value: STYLE_MAP[m.style] ?? m.style, label: 'Style',   Icon: Star })
      if (m.avg_heart_rate) out.push({ value: `${m.avg_heart_rate} bpm`,      label: 'FC moy.', Icon: Heart })
      break
    }
    case 'boxing': {
      const TYPE_MAP: Record<string, string> = {
        bag: 'Sac', pad_work: 'Pattes', sparring: 'Sparring', competition: 'Compétition',
      }
      if (m.bout_type)      out.push({ value: TYPE_MAP[m.bout_type] ?? m.bout_type, label: 'Type',    Icon: Target })
      if (m.rounds)         out.push({ value: String(m.rounds),                      label: 'Rounds',  Icon: Timer })
      if (m.avg_heart_rate) out.push({ value: `${m.avg_heart_rate} bpm`,             label: 'FC moy.', Icon: Heart })
      break
    }
  }

  return out.slice(0, 3)
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600)   return `Il y a ${Math.floor(s / 60)} min`
  if (s < 86400)  return `Il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Hier'
  return `Il y a ${Math.floor(s / 86400)} j`
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },

  // Banner
  banner: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    flexShrink: 0,
  },
  bannerText: { flex: 1, gap: 3 },
  bannerSport: {
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 1.4,
  },
  bannerDuration: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  calBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  calText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#fff' },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  userInfo: { flex: 1 },
  username: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },

  // Metrics
  metricRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 2,
  },
  metricVal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  metricLbl: { fontSize: 10, color: Colors.textTertiary, letterSpacing: 0.2 },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  kudosBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kudosText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
  kudosActive: { color: '#FF6B35' },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sportPillLabel: { fontSize: 11, fontWeight: FontWeight.bold },
})
