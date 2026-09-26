import React, { useMemo, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { formatPace, formatDistance } from '@/lib/units'
import type { Activity, SportType, GymMetrics, EnduranceMetrics, BadmintonMetrics, FootballMetrics, TennisMetrics, YogaMetrics, BoxingMetrics } from '@/types/database'
import type { PreferredUnit } from '@/types/database'

const SCREEN_W = Dimensions.get('window').width
const CHART_W = SCREEN_W - Spacing.md * 2 - 2

const SPORT_FILTERS: { key: SportType; label: string; emoji: string }[] = [
  { key: 'gym',       label: 'Muscu',      emoji: '🏋️' },
  { key: 'running',   label: 'Course',     emoji: '🏃' },
  { key: 'cycling',   label: 'Vélo',       emoji: '🚴' },
  { key: 'swimming',  label: 'Natation',   emoji: '🏊' },
  { key: 'hiking',    label: 'Randonnée',  emoji: '🥾' },
  { key: 'football',  label: 'Football',   emoji: '⚽' },
  { key: 'tennis',    label: 'Tennis',     emoji: '🎾' },
  { key: 'badminton', label: 'Badminton',  emoji: '🏸' },
  { key: 'boxing',    label: 'Boxe',       emoji: '🥊' },
  { key: 'athletics', label: 'Athlétisme', emoji: '⚡' },
  { key: 'yoga',      label: 'Yoga',       emoji: '🧘' },
]

interface SportStatsTabProps {
  activities: Activity[]
  unit: PreferredUnit
}

export function SportStatsTab({ activities, unit }: SportStatsTabProps) {
  const [activeSport, setActiveSport] = useState<SportType>('gym')
  const filterScrollRef = useRef<ScrollView>(null)

  const switchSport = (sport: SportType) => {
    setActiveSport(sport)
    const idx = SPORT_FILTERS.findIndex(f => f.key === sport)
    filterScrollRef.current?.scrollTo({ x: Math.max(0, idx * 100 - 50), animated: true })
  }

  const swipe = Gesture.Pan()
    .minDistance(30)
    .onEnd(e => {
      'worklet'
      const idx = SPORT_FILTERS.findIndex(f => f.key === activeSport)
      if (e.velocityX < -200 && idx < SPORT_FILTERS.length - 1) {
        runOnJS(switchSport)(SPORT_FILTERS[idx + 1].key)
      } else if (e.velocityX > 200 && idx > 0) {
        runOnJS(switchSport)(SPORT_FILTERS[idx - 1].key)
      }
    })

  const filtered = useMemo(
    () => activities.filter(a => a.sport_type === activeSport).slice().reverse(),
    [activities, activeSport],
  )

  const sportCounts = useMemo(() => {
    const counts: Partial<Record<SportType, number>> = {}
    for (const a of activities) {
      counts[a.sport_type] = (counts[a.sport_type] ?? 0) + 1
    }
    return counts
  }, [activities])

  return (
    <GestureDetector gesture={swipe}>
    <View style={styles.content}>
      {/* Sport filter pills */}
      <View style={styles.filterSection}>
        <Text style={styles.filterHint}>← Glisse pour changer de sport →</Text>
        <ScrollView ref={filterScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {SPORT_FILTERS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.filterChip,
              activeSport === s.key && { backgroundColor: SportColors[s.key], borderColor: SportColors[s.key] },
            ]}
            onPress={() => switchSport(s.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.filterEmoji}>{s.emoji}</Text>
            <Text style={[styles.filterLabel, activeSport === s.key && styles.filterLabelActive]}>
              {s.label}
            </Text>
            {sportCounts[s.key] ? (
              <View style={[styles.filterCount, activeSport === s.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeSport === s.key && styles.filterCountTextActive]}>
                  {sportCounts[s.key]}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <EmptyState sport={activeSport} sportCounts={sportCounts} onSelect={switchSport} />
      ) : null}

      {/* Always render stats (show empty state inside each component) */}
      {activeSport === 'gym' && <GymStats activities={filtered} unit={unit} />}
      {(activeSport === 'running' || activeSport === 'cycling' || activeSport === 'swimming') && (
        <EnduranceStats activities={filtered} unit={unit} sport={activeSport} />
      )}
      {activeSport === 'hiking' && <HikingStats activities={filtered} unit={unit} />}
      {activeSport === 'badminton' && <BadmintonStats activities={filtered} />}
      {activeSport === 'tennis' && <TennisStats activities={filtered} />}
      {activeSport === 'football' && <FootballStats activities={filtered} />}
      {activeSport === 'boxing' && <BoxingStats activities={filtered} />}
      {activeSport === 'yoga' && <YogaStats activities={filtered} />}
      {activeSport === 'athletics' && <AthleticsStats activities={filtered} />}
    </View>
    </GestureDetector>
  )
}

// ── Empty chart placeholder ───────────────────────────────────

const EMPTY_LABELS = ['—', '—', '—', '—', '—', '—']
const EMPTY_VALS = [0, 0, 0, 0, 0, 0]

function EmptyChartCard({ title, hint, bar = true }: { title: string; hint: string; bar?: boolean }) {
  const cfg = makeChartConfig('#94A3B8')
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardSub, { fontStyle: 'italic' }]}>{hint}</Text>
      <View style={{ opacity: 0.22 }}>
        {bar ? (
          <BarChart
            data={{ labels: EMPTY_LABELS, datasets: [{ data: EMPTY_VALS }] }}
            width={CHART_W - Spacing.md * 2} height={100}
            yAxisLabel="" yAxisSuffix=""
            chartConfig={cfg}
            withInnerLines={false} showBarTops={false}
            style={styles.chart} fromZero
          />
        ) : (
          <LineChart
            data={{ labels: EMPTY_LABELS, datasets: [{ data: [60, 60, 60, 60, 60, 60] }] }}
            width={CHART_W - Spacing.md * 2} height={100}
            chartConfig={cfg}
            bezier withDots={false} withInnerLines={false} withOuterLines={false} withShadow={false}
            style={styles.chart} yAxisSuffix="" segments={2}
          />
        )}
      </View>
    </View>
  )
}

// ── Gym stats : historique 1RM par exercice ───────────────────

function GymStats({ activities, unit }: { activities: Activity[]; unit: PreferredUnit }) {
  if (activities.length === 0) {
    return (
      <>
        <EmptyChartCard title="🏋️ Historique 1RM" hint="Tes records de force apparaîtront ici" bar={false} />
        <EmptyChartCard title="💪 Volume par séance" hint="Le volume total soulevé par séance" bar />
      </>
    )
  }

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
  if (activities.length === 0) {
    const distLabel = unit === 'imperial' ? 'mi' : 'km'
    return (
      <>
        <EmptyChartCard title="📍 Historique des allures" hint="Tes allures moyennes par séance" bar={false} />
        <EmptyChartCard title={`📏 Distance par séance (${distLabel})`} hint="La distance couverte à chaque sortie" bar />
      </>
    )
  }

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
  if (activities.length === 0) {
    return (
      <>
        <EmptyChartCard title="🏸 Bilan matchs" hint="Victoires, défaites et win rate" bar />
        <EmptyChartCard title="🏸 Résultats récents" hint="Tes derniers matchs joués" bar />
      </>
    )
  }
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
  if (activities.length === 0) {
    return (
      <EmptyChartCard title="⚡ Performances par épreuve" hint="100m, saut en longueur, lancé… tes meilleures perfs" bar />
    )
  }
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

// ── Hiking stats : distance + dénivelé ───────────────────────

function HikingStats({ activities, unit }: { activities: Activity[]; unit: PreferredUnit }) {
  if (activities.length === 0) {
    return (
      <>
        <EmptyChartCard title="🥾 Résumé randonnées" hint="Distance et dénivelé cumulés" bar />
        <EmptyChartCard title="🥾 Dénivelé par sortie (m)" hint="L'élévation de chaque randonnée" bar />
      </>
    )
  }
  const distLabel = unit === 'imperial' ? 'mi' : 'km'

  const data = useMemo(() =>
    activities.map(a => {
      const m = a.metrics as EnduranceMetrics
      const dist = m.distance_m
        ? unit === 'imperial'
          ? parseFloat(((m.distance_m / 1000) * 0.621371).toFixed(2))
          : parseFloat((m.distance_m / 1000).toFixed(2))
        : 0
      return { date: a.created_at.slice(5, 10), dist, elevation: m.elevation_m ?? 0 }
    }),
    [activities, unit],
  )

  const totalDist = data.reduce((s, d) => s + d.dist, 0)
  const totalElev = activities.reduce((s, a) => s + ((a.metrics as EnduranceMetrics).elevation_m ?? 0), 0)
  const bestElev = Math.max(...data.map(d => d.elevation))

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Résumé</Text>
        <View style={styles.statRow}>
          <StatMini label={`Distance totale`} value={`${totalDist.toFixed(1)} ${distLabel}`} />
          <StatMini label="Dénivelé total" value={`${totalElev} m`} />
          <StatMini label="Meilleur D+" value={`${bestElev} m`} highlight />
        </View>
      </View>

      {data.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dénivelé par sortie (m)</Text>
          <BarChart
            data={{
              labels: data.map(d => d.date),
              datasets: [{ data: data.map(d => d.elevation) }],
            }}
            width={CHART_W - Spacing.md * 2}
            height={120}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={makeChartConfig(SportColors.hiking)}
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

// ── Football stats ────────────────────────────────────────────

function FootballStats({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <>
        <EmptyChartCard title="⚽ Bilan matchs" hint="Résultats, buts et passes décisives" bar />
        <EmptyChartCard title="⚽ Buts par match" hint="Tes réalisations match par match" bar />
      </>
    )
  }
  const stats = useMemo(() => {
    let wins = 0, losses = 0, totalGoals = 0, totalAssists = 0
    for (const a of activities) {
      const m = a.metrics as FootballMetrics
      if (m.match_won) wins++; else losses++
      totalGoals += m.goals_scored ?? 0
      totalAssists += m.assists ?? 0
    }
    const total = wins + losses
    return {
      wins, losses, total,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      totalGoals, totalAssists,
      avgGoals: total > 0 ? parseFloat((totalGoals / total).toFixed(1)) : 0,
    }
  }, [activities])

  const matchResults = activities.map(a => (a.metrics as FootballMetrics).match_won ? 1 : 0)
  const goalsData = activities.map(a => (a.metrics as FootballMetrics).goals_scored ?? 0)

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bilan matchs</Text>
        <View style={styles.statRow}>
          <StatMini label="Victoires" value={String(stats.wins)} color={Colors.success} />
          <StatMini label="Défaites" value={String(stats.losses)} color={Colors.error} />
          <StatMini label="Win rate" value={`${stats.winRate}%`} highlight />
        </View>
        <View style={styles.winRateBar}>
          <View style={[styles.winFill, { flex: stats.winRate }]} />
          <View style={[styles.lossFill, { flex: 100 - stats.winRate }]} />
        </View>
        <View style={styles.statRow}>
          <StatMini label="Buts totaux" value={String(stats.totalGoals)} />
          <StatMini label="Passes déc." value={String(stats.totalAssists)} />
          <StatMini label="Buts / match" value={String(stats.avgGoals)} />
        </View>
      </View>

      {matchResults.length >= 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Résultats récents</Text>
          <View style={styles.resultDots}>
            {matchResults.slice(-20).map((r, i) => (
              <View key={i} style={[styles.resultDot, { backgroundColor: r === 1 ? Colors.success : Colors.error }]} />
            ))}
          </View>
        </View>
      )}

      {goalsData.length >= 2 && goalsData.some(g => g > 0) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buts par match</Text>
          <BarChart
            data={{
              labels: activities.map(a => a.created_at.slice(5, 10)),
              datasets: [{ data: goalsData }],
            }}
            width={CHART_W - Spacing.md * 2}
            height={120}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={makeChartConfig(SportColors.football)}
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

// ── Tennis stats ──────────────────────────────────────────────

function TennisStats({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <>
        <EmptyChartCard title="🎾 Bilan matchs" hint="Victoires, défaites et aces" bar />
        <EmptyChartCard title="🎾 Résultats récents" hint="L'historique de tes matchs" bar />
      </>
    )
  }
  const stats = useMemo(() => {
    let wins = 0, losses = 0, totalAces = 0
    for (const a of activities) {
      const m = a.metrics as TennisMetrics
      if (m.match_won) wins++; else losses++
      totalAces += m.aces ?? 0
    }
    const total = wins + losses
    return {
      wins, losses, total,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      totalAces,
      avgAces: total > 0 ? parseFloat((totalAces / total).toFixed(1)) : 0,
    }
  }, [activities])

  const matchResults = activities.map(a => (a.metrics as TennisMetrics).match_won ? 1 : 0)

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bilan matchs</Text>
        <View style={styles.statRow}>
          <StatMini label="Victoires" value={String(stats.wins)} color={Colors.success} />
          <StatMini label="Défaites" value={String(stats.losses)} color={Colors.error} />
          <StatMini label="Win rate" value={`${stats.winRate}%`} highlight />
        </View>
        <View style={styles.winRateBar}>
          <View style={[styles.winFill, { flex: stats.winRate }]} />
          <View style={[styles.lossFill, { flex: 100 - stats.winRate }]} />
        </View>
        <View style={styles.statRow}>
          <StatMini label="Aces totaux" value={String(stats.totalAces)} />
          <StatMini label="Aces / match" value={String(stats.avgAces)} />
          <StatMini label="Matchs joués" value={String(stats.total)} />
        </View>
      </View>

      {matchResults.length >= 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Résultats récents</Text>
          <View style={styles.resultDots}>
            {matchResults.slice(-20).map((r, i) => (
              <View key={i} style={[styles.resultDot, { backgroundColor: r === 1 ? Colors.success : Colors.error }]} />
            ))}
          </View>
        </View>
      )}
    </>
  )
}

// ── Yoga stats ────────────────────────────────────────────────

function YogaStats({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <EmptyChartCard title="🧘 Répartition par style" hint="Hatha, Vinyasa, Yin… tes pratiques" bar />
    )
  }
  const stats = useMemo(() => {
    const styleCount: Record<string, number> = {}
    let totalMinutes = 0
    for (const a of activities) {
      const m = a.metrics as YogaMetrics
      const style = m.style ?? 'other'
      styleCount[style] = (styleCount[style] ?? 0) + 1
      totalMinutes += Math.round(a.duration_seconds / 60)
    }
    return { styleCount, totalMinutes, sessions: activities.length }
  }, [activities])

  const STYLE_LABELS: Record<string, string> = {
    hatha: 'Hatha', vinyasa: 'Vinyasa', yin: 'Yin',
    ashtanga: 'Ashtanga', power: 'Power', other: 'Autre',
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Résumé</Text>
        <View style={styles.statRow}>
          <StatMini label="Séances" value={String(stats.sessions)} />
          <StatMini label="Temps total" value={`${Math.round(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`} highlight />
          <StatMini label="Moy./séance" value={`${Math.round(stats.totalMinutes / (stats.sessions || 1))} min`} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Répartition par style</Text>
        {Object.entries(stats.styleCount).map(([key, count]) => (
          <View key={key} style={styles.athleticsRow}>
            <Text style={styles.athleticsEvent}>{STYLE_LABELS[key] ?? key}</Text>
            <View style={styles.athleticsRight}>
              <Text style={styles.athleticsBest}>{count} séance{count > 1 ? 's' : ''}</Text>
              <Text style={styles.athleticsCount}>
                {Math.round((count / stats.sessions) * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  )
}

// ── Boxing stats ──────────────────────────────────────────────

function BoxingStats({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <>
        <EmptyChartCard title="🥊 Résumé rounds" hint="Total de rounds et types de séances" bar />
        <EmptyChartCard title="🥊 Rounds par séance" hint="L'évolution de tes séances" bar />
      </>
    )
  }
  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {}
    let totalRounds = 0
    for (const a of activities) {
      const m = a.metrics as BoxingMetrics
      const type = m.bout_type ?? 'bag'
      typeCount[type] = (typeCount[type] ?? 0) + 1
      totalRounds += m.rounds ?? 0
    }
    return { typeCount, totalRounds, sessions: activities.length }
  }, [activities])

  const TYPE_LABELS: Record<string, string> = {
    bag: 'Sac', pad_work: 'Pattes', sparring: 'Sparring', competition: 'Compétition',
  }

  const roundsData = activities.map(a => (a.metrics as BoxingMetrics).rounds ?? 0)

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Résumé</Text>
        <View style={styles.statRow}>
          <StatMini label="Séances" value={String(stats.sessions)} />
          <StatMini label="Rounds totaux" value={String(stats.totalRounds)} highlight />
          <StatMini label="Rounds / séance" value={stats.sessions > 0 ? (stats.totalRounds / stats.sessions).toFixed(1) : '0'} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Répartition par type</Text>
        {Object.entries(stats.typeCount).map(([key, count]) => (
          <View key={key} style={styles.athleticsRow}>
            <Text style={styles.athleticsEvent}>{TYPE_LABELS[key] ?? key}</Text>
            <View style={styles.athleticsRight}>
              <Text style={styles.athleticsBest}>{count} séance{count > 1 ? 's' : ''}</Text>
            </View>
          </View>
        ))}
      </View>

      {roundsData.length >= 2 && roundsData.some(r => r > 0) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rounds par séance</Text>
          <BarChart
            data={{
              labels: activities.map(a => a.created_at.slice(5, 10)),
              datasets: [{ data: roundsData }],
            }}
            width={CHART_W - Spacing.md * 2}
            height={120}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={makeChartConfig(SportColors.boxing)}
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

function EmptyState({ sport, sportCounts, onSelect }: {
  sport: SportType
  sportCounts: Partial<Record<SportType, number>>
  onSelect: (s: SportType) => void
}) {
  const EMOJI: Record<SportType, string> = {
    running: '🏃', cycling: '🚴', swimming: '🏊',
    gym: '🏋️', badminton: '🏸', athletics: '⚡',
    football: '⚽', tennis: '🎾', hiking: '🥾', yoga: '🧘', boxing: '🥊',
  }
  const availableSports = Object.keys(sportCounts) as SportType[]

  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{EMOJI[sport]}</Text>
      <Text style={styles.emptyText}>Aucune séance enregistrée pour ce sport</Text>
      {availableSports.length > 0 && (
        <>
          <Text style={[styles.emptyText, { fontSize: FontSize.xs, marginTop: 4 }]}>
            Tes sports actifs :
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 }}>
            {availableSports.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, { backgroundColor: SportColors[s] + '20', borderColor: SportColors[s] + '60' }]}
                onPress={() => onSelect(s)}
              >
                <Text style={styles.filterEmoji}>{EMOJI[s]}</Text>
                <Text style={[styles.filterLabel, { color: SportColors[s] }]}>
                  {SPORT_FILTERS.find(f => f.key === s)?.label ?? s}
                </Text>
                <Text style={[styles.filterCountText, { color: SportColors[s] }]}>{sportCounts[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
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
  filterSection: { gap: 6 },
  filterHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 2 },
  filterRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  filterChip: {
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
  filterEmoji: { fontSize: 15 },
  filterLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  filterLabelActive: { color: Colors.textInverse },
  filterCount: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textTertiary },
  filterCountTextActive: { color: Colors.textInverse },
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
