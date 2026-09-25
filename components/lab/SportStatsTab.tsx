import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { formatPace, formatDistance } from '@/lib/units'
import type { Activity, SportType, GymMetrics, EnduranceMetrics, BadmintonMetrics } from '@/types/database'
import type { PreferredUnit } from '@/types/database'

const SCREEN_W = Dimensions.get('window').width
const CHART_W = SCREEN_W - Spacing.md * 2 - 2

const SPORT_FILTERS: { key: SportType; label: string; emoji: string }[] = [
  { key: 'gym',       label: 'Muscu',      emoji: '🏋️' },
  { key: 'running',   label: 'Course',     emoji: '🏃' },
  { key: 'cycling',   label: 'Vélo',       emoji: '🚴' },
  { key: 'swimming',  label: 'Natation',   emoji: '🏊' },
  { key: 'badminton', label: 'Badminton',  emoji: '🏸' },
  { key: 'athletics', label: 'Athlétisme', emoji: '⚡' },
]

interface SportStatsTabProps {
  activities: Activity[]
  unit: PreferredUnit
}

export function SportStatsTab({ activities, unit }: SportStatsTabProps) {
  const [activeSport, setActiveSport] = useState<SportType>('gym')

  const filtered = useMemo(
    () => activities.filter(a => a.sport_type === activeSport).slice().reverse(),
    [activities, activeSport],
  )

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Sport filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {SPORT_FILTERS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.filterChip, activeSport === s.key && { backgroundColor: SportColors[s.key] }]}
            onPress={() => setActiveSport(s.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.filterEmoji}>{s.emoji}</Text>
            <Text style={[styles.filterLabel, activeSport === s.key && styles.filterLabelActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState sport={activeSport} />
      ) : (
        <>
          {activeSport === 'gym' && <GymStats activities={filtered} unit={unit} />}
          {(activeSport === 'running' || activeSport === 'cycling' || activeSport === 'swimming') && (
            <EnduranceStats activities={filtered} unit={unit} sport={activeSport} />
          )}
          {activeSport === 'badminton' && <BadmintonStats activities={filtered} />}
          {activeSport === 'athletics' && <AthleticsStats activities={filtered} />}
        </>
      )}
    </ScrollView>
  )
}

// ── Gym stats : historique 1RM par exercice ───────────────────

function GymStats({ activities, unit }: { activities: Activity[]; unit: PreferredUnit }) {
  // Collect all unique exercise names
  const exerciseNames = useMemo(() => {
    const names = new Set<string>()
    for (const a of activities) {
      const m = a.metrics as GymMetrics
      m.exercises?.forEach(e => { if (e.name) names.add(e.name) })
    }
    return Array.from(names).slice(0, 6)
  }, [activities])

  const [selectedExercise, setSelectedExercise] = useState<string>(exerciseNames[0] ?? '')

  // 1RM history for selected exercise
  const oneRmHistory = useMemo(() => {
    return activities
      .map(a => {
        const m = a.metrics as GymMetrics
        const ex = m.exercises?.find(e => e.name === selectedExercise)
        if (!ex) return null
        const oneRm = ex.one_rm_kg ?? estimate1RM(ex)
        if (!oneRm) return null
        return {
          date: a.created_at.split('T')[0],
          value: unit === 'imperial' ? oneRm * 2.20462 : oneRm,
        }
      })
      .filter(Boolean) as { date: string; value: number }[]
  }, [activities, selectedExercise, unit])

  // Total volume per session
  const volumeHistory = useMemo(() => {
    return activities.slice(-8).map(a => {
      const m = a.metrics as GymMetrics
      const vol = m.total_volume_kg ?? 0
      return unit === 'imperial' ? Math.round(vol * 2.20462) : Math.round(vol)
    })
  }, [activities, unit])

  const weightLabel = unit === 'imperial' ? 'lbs' : 'kg'

  return (
    <>
      {/* 1RM card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historique 1RM</Text>

        {exerciseNames.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exRow}>
            {exerciseNames.map(name => (
              <TouchableOpacity
                key={name}
                style={[styles.exChip, selectedExercise === name && styles.exChipActive]}
                onPress={() => setSelectedExercise(name)}
              >
                <Text style={[styles.exChipText, selectedExercise === name && styles.exChipTextActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {oneRmHistory.length >= 2 ? (
          <>
            <View style={styles.statRow}>
              <StatMini label="Meilleur" value={`${Math.round(Math.max(...oneRmHistory.map(r => r.value)))} ${weightLabel}`} />
              <StatMini label="Dernier" value={`${Math.round(oneRmHistory[oneRmHistory.length - 1].value)} ${weightLabel}`} />
              <StatMini
                label="Progression"
                value={`${oneRmHistory[oneRmHistory.length - 1].value - oneRmHistory[0].value >= 0 ? '+' : ''}${Math.round(oneRmHistory[oneRmHistory.length - 1].value - oneRmHistory[0].value)} ${weightLabel}`}
                highlight
              />
            </View>

            <LineChart
              data={{
                labels: oneRmHistory.map(r => r.date.slice(5)),
                datasets: [{ data: oneRmHistory.map(r => r.value) }],
              }}
              width={CHART_W - Spacing.md * 2}
              height={130}
              chartConfig={makeChartConfig(SportColors.gym)}
              bezier
              withDots
              withInnerLines={false}
              withOuterLines={false}
              withShadow={false}
              style={styles.chart}
              yAxisSuffix={` ${weightLabel}`}
              segments={3}
            />
          </>
        ) : (
          <Text style={styles.notEnough}>Pas assez de données pour {selectedExercise}</Text>
        )}
      </View>

      {/* Volume card */}
      {volumeHistory.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volume par séance ({weightLabel})</Text>
          <BarChart
            data={{
              labels: activities.slice(-8).map(a => a.created_at.slice(5, 10)),
              datasets: [{ data: volumeHistory }],
            }}
            width={CHART_W - Spacing.md * 2}
            height={120}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={makeChartConfig(SportColors.gym)}
            withInnerLines={false}
            showBarTops={false}
            style={styles.chart}
            fromZero
          />
        </View>
      )}
    </>
  )
}

// ── Endurance stats : allures + distance ─────────────────────

function EnduranceStats({
  activities, unit, sport,
}: {
  activities: Activity[]
  unit: PreferredUnit
  sport: SportType
}) {
  const accentColor = SportColors[sport]

  const paceHistory = useMemo(() =>
    activities
      .map(a => {
        const m = a.metrics as EnduranceMetrics
        return m.avg_pace_s_per_km ? { date: a.created_at.slice(5, 10), pace: m.avg_pace_s_per_km } : null
      })
      .filter(Boolean) as { date: string; pace: number }[],
    [activities],
  )

  const distanceHistory = useMemo(() =>
    activities
      .map(a => {
        const m = a.metrics as EnduranceMetrics
        if (!m.distance_m) return null
        const { value } = unit === 'imperial'
          ? { value: parseFloat(((m.distance_m / 1000) * 0.621371).toFixed(2)) }
          : { value: parseFloat((m.distance_m / 1000).toFixed(2)) }
        return { date: a.created_at.slice(5, 10), value }
      })
      .filter(Boolean) as { date: string; value: number }[],
    [activities, unit],
  )

  const totalDistance = distanceHistory.reduce((s, d) => s + d.value, 0)
  const distLabel = unit === 'imperial' ? 'mi' : 'km'
  const bestPace = paceHistory.length ? Math.min(...paceHistory.map(p => p.pace)) : null

  return (
    <>
      {/* Summary stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Résumé</Text>
        <View style={styles.statRow}>
          <StatMini label={`Distance totale`} value={`${totalDistance.toFixed(1)} ${distLabel}`} />
          <StatMini label="Séances" value={String(activities.length)} />
          {bestPace && (
            <StatMini label="Meilleure allure" value={formatPace(bestPace, unit)} highlight />
          )}
        </View>
      </View>

      {/* Pace history */}
      {paceHistory.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historique des allures</Text>
          <Text style={styles.cardSub}>
            Plus bas = plus rapide
          </Text>
          <LineChart
            data={{
              labels: paceHistory.map(p => p.date),
              datasets: [{ data: paceHistory.map(p => p.pace / 60) }],
            }}
            width={CHART_W - Spacing.md * 2}
            height={130}
            chartConfig={makeChartConfig(accentColor)}
            bezier
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withShadow={false}
            style={styles.chart}
            yAxisSuffix=" min"
            segments={3}
            fromZero={false}
          />
        </View>
      )}

      {/* Distance history */}
      {distanceHistory.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Distance par séance ({distLabel})</Text>
          <BarChart
            data={{
              labels: distanceHistory.map(d => d.date),
              datasets: [{ data: distanceHistory.map(d => d.value) }],
            }}
            width={CHART_W - Spacing.md * 2}
            height={120}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={makeChartConfig(accentColor)}
            withInnerLines={false}
            showBarTops={false}
            style={styles.chart}
            fromZero
          />
        </View>
      )}
    </>
  )
}

// ── Badminton stats : ratio V/D ───────────────────────────────

function BadmintonStats({ activities }: { activities: Activity[] }) {
  const stats = useMemo(() => {
    let wins = 0, losses = 0
    const setScores: { player: number; opponent: number }[] = []

    for (const a of activities) {
      const m = a.metrics as BadmintonMetrics
      if (m.match_won) wins++; else losses++
      m.sets?.forEach(s => setScores.push({ player: s.player_score, opponent: s.opponent_score }))
    }

    const total = wins + losses
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
    const avgPlayerScore = setScores.length
      ? parseFloat((setScores.reduce((s, sc) => s + sc.player, 0) / setScores.length).toFixed(1))
      : 0
    const avgOpponentScore = setScores.length
      ? parseFloat((setScores.reduce((s, sc) => s + sc.opponent, 0) / setScores.length).toFixed(1))
      : 0

    return { wins, losses, total, winRate, avgPlayerScore, avgOpponentScore }
  }, [activities])

  // Win/loss per session (for spark line)
  const matchResults = activities.map(a => (a.metrics as BadmintonMetrics).match_won ? 1 : 0)

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bilan matchs</Text>
        <View style={styles.statRow}>
          <StatMini label="Victoires" value={String(stats.wins)} color={Colors.success} />
          <StatMini label="Défaites" value={String(stats.losses)} color={Colors.error} />
          <StatMini label="Win rate" value={`${stats.winRate}%`} highlight />
        </View>

        {/* Win rate visual bar */}
        <View style={styles.winRateBar}>
          <View style={[styles.winFill, { flex: stats.winRate }]} />
          <View style={[styles.lossFill, { flex: 100 - stats.winRate }]} />
        </View>

        <View style={styles.statRow}>
          <StatMini label="Score moy. (vous)" value={String(stats.avgPlayerScore)} />
          <StatMini label="Score moy. (adv.)" value={String(stats.avgOpponentScore)} />
        </View>
      </View>

      {matchResults.length >= 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Résultats récents</Text>
          <View style={styles.resultDots}>
            {matchResults.slice(-20).map((r, i) => (
              <View
                key={i}
                style={[styles.resultDot, { backgroundColor: r === 1 ? Colors.success : Colors.error }]}
              />
            ))}
          </View>
        </View>
      )}
    </>
  )
}

// ── Athletics stats ───────────────────────────────────────────

function AthleticsStats({ activities }: { activities: Activity[] }) {
  const events = useMemo(() => {
    const map: Record<string, number[]> = {}
    for (const a of activities) {
      const m = a.metrics as any
      if (m.event && m.result_value) {
        if (!map[m.event]) map[m.event] = []
        map[m.event].push(m.result_value)
      }
    }
    return map
  }, [activities])

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Performances par épreuve</Text>
      {Object.entries(events).map(([event, results]) => (
        <View key={event} style={styles.athleticsRow}>
          <Text style={styles.athleticsEvent}>{event}</Text>
          <View style={styles.athleticsRight}>
            <Text style={styles.athleticsBest}>
              Best : {Math.min(...results).toFixed(2)}
            </Text>
            <Text style={styles.athleticsCount}>{results.length} essai{results.length > 1 ? 's' : ''}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// ── Shared atoms ──────────────────────────────────────────────

function StatMini({ label, value, highlight, color }: {
  label: string; value: string; highlight?: boolean; color?: string
}) {
  return (
    <View style={statStyles.box}>
      <Text style={[statStyles.value, highlight && statStyles.valueHighlight, color ? { color } : null]}>
        {value}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

function EmptyState({ sport }: { sport: SportType }) {
  const EMOJI: Record<SportType, string> = {
    running: '🏃', cycling: '🚴', swimming: '🏊',
    gym: '🏋️', badminton: '🏸', athletics: '⚡',
  }
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{EMOJI[sport]}</Text>
      <Text style={styles.emptyText}>Aucune séance enregistrée</Text>
    </View>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function estimate1RM(exercise: { sets: { reps: number; weight_kg: number }[] }): number | null {
  const best = exercise.sets.reduce<{ reps: number; weight_kg: number } | null>((prev, s) => {
    if (!prev) return s
    const e1 = s.weight_kg * (1 + s.reps / 30)
    const e2 = prev.weight_kg * (1 + prev.reps / 30)
    return e1 > e2 ? s : prev
  }, null)
  if (!best) return null
  return parseFloat((best.weight_kg * (1 + best.reps / 30)).toFixed(1))
}

function makeChartConfig(accentColor: string) {
  return {
    backgroundGradientFrom: Colors.bgCard,
    backgroundGradientTo: Colors.bgCard,
    color: (opacity = 1) => {
      const hex = accentColor.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${opacity})`
    },
    labelColor: () => Colors.textTertiary,
    strokeWidth: 2.5,
    barPercentage: 0.55,
    propsForLabels: { fontSize: FontSize.xs },
    propsForBackgroundLines: { stroke: 'transparent' },
  }
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { gap: Spacing.md, paddingBottom: 40 },
  filterRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
  },
  filterEmoji: { fontSize: 15 },
  filterLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  filterLabelActive: { color: Colors.textInverse },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: -Spacing.xs },
  chart: { marginLeft: -Spacing.md, marginBottom: -Spacing.sm },
  statRow: { flexDirection: 'row', gap: Spacing.sm },
  exRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  exChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
  },
  exChipActive: { backgroundColor: Colors.electricDim },
  exChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  exChipTextActive: { color: Colors.electric },
  notEnough: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', padding: Spacing.md },
  winRateBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: Colors.bgAlt,
  },
  winFill: { backgroundColor: Colors.success },
  lossFill: { backgroundColor: Colors.error },
  resultDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resultDot: { width: 14, height: 14, borderRadius: 7 },
  athleticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  athleticsEvent: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  athleticsRight: { alignItems: 'flex-end' },
  athleticsBest: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.electric },
  athleticsCount: { fontSize: FontSize.xs, color: Colors.textTertiary },
  empty: { alignItems: 'center', paddingVertical: 48, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary },
})

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  valueHighlight: { color: Colors.electric },
  label: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },
})
