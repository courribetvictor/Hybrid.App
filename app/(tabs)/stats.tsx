import React, { useState, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { HeatmapView } from '@/components/lab/HeatmapView'
import { SportStatsTab } from '@/components/lab/SportStatsTab'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { useBodyLogs } from '@/hooks/useBodyLogs'
import { useActivities } from '@/hooks/useActivities'
import { useProfile, useSession } from '@/hooks/useProfile'
import { formatDurationLong, formatWeight, displayWeight } from '@/lib/units'
import type { SportType } from '@/types/database'

const W = Dimensions.get('window').width
const CHART_W = W - Spacing.md * 2 - Spacing.md * 2

type Tab = 'overview' | 'body' | 'sport'
type Period = 7 | 30 | 90 | 365

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'overview', label: 'Aperçu',  emoji: '📊' },
  { key: 'body',     label: 'Corps',   emoji: '⚖️' },
  { key: 'sport',    label: 'Sport',   emoji: '🎯' },
]

const PERIODS: { v: Period; l: string }[] = [
  { v: 7, l: '7J' }, { v: 30, l: '30J' }, { v: 90, l: '90J' }, { v: 365, l: '1A' },
]

const TAB_KEYS: Tab[] = ['overview', 'body', 'sport']

export default function StatsScreen() {
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState<Period>(30)

  const tabIndex = TAB_KEYS.indexOf(tab)
  const indicatorX = useSharedValue(0)
  const tabBarWidth = useRef(W - Spacing.md * 2 - 6)

  const unit = profile?.preferred_unit ?? 'metric'
  const { logs: bodyLogs } = useBodyLogs(userId ?? undefined, period)
  const { activities, heatmapData, sportBreakdown, totalCalories, totalDurationSeconds } =
    useActivities(userId ?? undefined, period)

  const switchTab = useCallback((newTab: Tab) => {
    setTab(newTab)
    const idx = TAB_KEYS.indexOf(newTab)
    const chipW = tabBarWidth.current / 3
    indicatorX.value = withSpring(idx * chipW, { damping: 18, stiffness: 200 })
  }, [indicatorX])

  const swipe = Gesture.Pan()
    .minDistance(20)
    .onEnd(e => {
      'worklet'
      const idx = TAB_KEYS.indexOf(tab)
      if (e.velocityX < -200 && idx < 2) {
        runOnJS(switchTab)(TAB_KEYS[idx + 1])
      } else if (e.velocityX > 200 && idx > 0) {
        runOnJS(switchTab)(TAB_KEYS[idx - 1])
      }
    })

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  // initialise indicator position when first render
  React.useEffect(() => {
    const chipW = tabBarWidth.current / 3
    indicatorX.value = tabIndex * chipW
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.safe}>
      <ScreenHeader title="🔬 Labo" />

      {/* Tab bar with sliding indicator */}
      <View
        style={styles.tabBar}
        onLayout={e => {
          tabBarWidth.current = e.nativeEvent.layout.width - 6
        }}
      >
        <Animated.View style={[styles.tabIndicator, indicatorStyle, { width: `${100 / 3}%` as any }]} />
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            onPress={() => switchTab(t.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period filter */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.v}
            style={[styles.periodChip, period === p.v && styles.periodChipActive]}
            onPress={() => setPeriod(p.v)}
          >
            <Text style={[styles.periodText, period === p.v && styles.periodTextActive]}>{p.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable content */}
      <GestureDetector gesture={swipe}>
        <ScrollView
          key={tab}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {tab === 'overview' && (
            <OverviewTab
              activities={activities}
              heatmapData={heatmapData}
              sportBreakdown={sportBreakdown}
              totalCalories={totalCalories}
              totalDurationSeconds={totalDurationSeconds}
            />
          )}
          {tab === 'body' && (
            <BodyTab bodyLogs={bodyLogs} activities={activities} unit={unit} />
          )}
          {tab === 'sport' && (
            <SportStatsTab activities={activities} unit={unit} />
          )}
        </ScrollView>
      </GestureDetector>
    </View>
  )
}

// ── Overview tab ──────────────────────────────────────────────

function OverviewTab({ activities, heatmapData, sportBreakdown, totalCalories, totalDurationSeconds }: any) {
  const total = activities.length

  return (
    <>
      {/* KPI row */}
      <View style={kpi.row}>
        <KpiCard icon="🏅" label="Séances"      value={String(total)} accent={Colors.electric} />
        <KpiCard icon="⏱"  label="Durée totale" value={formatDurationLong(totalDurationSeconds)} accent="#8B5CF6" />
        <KpiCard icon="🔥" label="kcal"          value={totalCalories > 0 ? `${(totalCalories / 1000).toFixed(1)}k` : '—'} accent="#F97316" />
      </View>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>← Glisse pour changer d'onglet →</Text>
      </View>

      {/* Heatmap */}
      <HeatmapView data={heatmapData} weeks={14} />

      {/* Sport breakdown */}
      <View style={card.box}>
        <Text style={card.title}>Répartition des sports</Text>
        {Object.keys(sportBreakdown).length > 0 ? (
          (Object.entries(sportBreakdown) as [SportType, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([sport, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <View key={sport} style={breakdown.row}>
                  <Text style={breakdown.name}>{SPORT_LABEL[sport]}</Text>
                  <View style={breakdown.barBg}>
                    <View style={[breakdown.barFill, { width: `${pct}%`, backgroundColor: SportColors[sport] }]} />
                  </View>
                  <Text style={breakdown.pct}>{pct}%</Text>
                </View>
              )
            })
        ) : (
          <EmptyBarChart label="Aucune séance encore enregistrée" />
        )}
      </View>

      {/* Weekly sessions chart - always shown */}
      <WeeklyVolumeChart activities={activities} />

      {/* Weekly duration chart - always shown */}
      <WeeklyDurationChart activities={activities} />

      {/* Personal records */}
      <PersonalRecords activities={activities} />
    </>
  )
}

function WeeklyVolumeChart({ activities }: any) {
  const byWeek: Record<string, number> = {}
  for (const a of activities) {
    const d = new Date(a.created_at)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = `${monday.getDate()}/${monday.getMonth() + 1}`
    byWeek[key] = (byWeek[key] ?? 0) + 1
  }

  const now = new Date()
  const weeks: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7 - ((now.getDay() + 6) % 7))
    weeks.push(`${d.getDate()}/${d.getMonth() + 1}`)
  }
  const vals = weeks.map(k => byWeek[k] ?? 0)
  const hasData = vals.some(v => v > 0)

  return (
    <View style={card.box}>
      <Text style={card.title}>Séances par semaine</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de données…</Text>}
      <BarChart
        data={{ labels: weeks, datasets: [{ data: hasData ? vals : [0, 0, 0, 0, 0, 0] }] }}
        width={CHART_W}
        height={120}
        yAxisLabel="" yAxisSuffix=""
        chartConfig={chartCfg(Colors.electric, !hasData)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        fromZero
      />
    </View>
  )
}

function WeeklyDurationChart({ activities }: any) {
  const byWeek: Record<string, number> = {}
  for (const a of activities) {
    const d = new Date(a.created_at)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = `${monday.getDate()}/${monday.getMonth() + 1}`
    byWeek[key] = (byWeek[key] ?? 0) + Math.round(a.duration_seconds / 60)
  }

  const now = new Date()
  const weeks: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7 - ((now.getDay() + 6) % 7))
    weeks.push(`${d.getDate()}/${d.getMonth() + 1}`)
  }
  const vals = weeks.map(k => byWeek[k] ?? 0)
  const hasData = vals.some(v => v > 0)

  return (
    <View style={card.box}>
      <Text style={card.title}>Durée par semaine (min)</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de données…</Text>}
      <BarChart
        data={{ labels: weeks, datasets: [{ data: hasData ? vals : [0, 0, 0, 0, 0, 0] }] }}
        width={CHART_W}
        height={120}
        yAxisLabel="" yAxisSuffix=" min"
        chartConfig={chartCfg('#8B5CF6', !hasData)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        fromZero
      />
    </View>
  )
}

function PersonalRecords({ activities }: any) {
  const records: { label: string; value: string; emoji: string; color: string }[] = []

  const longestSession = activities.reduce((best: any, a: any) =>
    a.duration_seconds > (best?.duration_seconds ?? 0) ? a : best, null)
  records.push({
    emoji: '⏱', label: 'Séance la + longue', color: '#8B5CF6',
    value: longestSession ? formatDurationLong(longestSession.duration_seconds) : '—',
  })

  const bestDistAct = activities
    .map((a: any) => ({ a, dist: (a.metrics?.distance_m ?? 0) }))
    .sort((x: any, y: any) => y.dist - x.dist)[0]
  records.push({
    emoji: '📍', label: 'Meilleure distance', color: Colors.electric,
    value: bestDistAct?.dist > 0 ? `${(bestDistAct.dist / 1000).toFixed(1)} km` : '—',
  })

  const sportSet = new Set(activities.map((a: any) => a.sport_type))
  records.push({ emoji: '🎯', label: 'Sports pratiqués', color: '#F97316', value: String(sportSet.size) || '0' })

  const totalCal = activities.reduce((s: number, a: any) => s + (a.calories_burned ?? 0), 0)
  records.push({
    emoji: '🔥', label: 'Total calories', color: '#EF4444',
    value: totalCal > 0 ? `${Math.round(totalCal).toLocaleString('fr-FR')} kcal` : '—',
  })

  return (
    <View style={card.box}>
      <Text style={card.title}>Records & totaux</Text>
      <View style={prStyles.grid}>
        {records.map((r, i) => (
          <View key={i} style={[prStyles.item, { borderLeftColor: r.color + '60', borderLeftWidth: 3 }]}>
            <Text style={prStyles.emoji}>{r.emoji}</Text>
            <Text style={[prStyles.value, { color: r.value === '—' ? Colors.textTertiary : r.color }]}>
              {r.value}
            </Text>
            <Text style={prStyles.label}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ── Body tab ──────────────────────────────────────────────────

function BodyTab({ bodyLogs, activities, unit }: any) {
  const weightLogs = bodyLogs.filter((l: any) => l.weight_kg !== null).slice(-12)
  const weightValues = weightLogs.map((l: any) => displayWeight(l.weight_kg, unit).value)
  const weightLabels = weightLogs.map((l: any) => {
    const d = new Date(l.logged_date)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })

  const totalBurnedByDay: Record<string, number> = {}
  for (const a of activities) {
    const day = a.created_at.split('T')[0]
    totalBurnedByDay[day] = (totalBurnedByDay[day] ?? 0) + (a.calories_burned ?? 0)
  }
  const calDays = bodyLogs.filter((l: any) => l.calories_consumed).slice(-8)
  const calLabels = calDays.map((l: any) => {
    const d = new Date(l.logged_date)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })
  const calBurned = calDays.map((l: any) => totalBurnedByDay[l.logged_date] ?? 0)
  const calConsumed = calDays.map((l: any) => l.calories_consumed ?? 0)

  const wLabel = unit === 'imperial' ? 'lbs' : 'kg'
  const deltaWeight = weightValues.length >= 2 ? weightValues[weightValues.length - 1] - weightValues[0] : null
  const hasWeightData = weightValues.length >= 2
  const hasCalData = calDays.length >= 2

  const emptyLabels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
  const emptyVals = [0, 0, 0, 0, 0, 0]

  return (
    <>
      {/* Weight card */}
      <View style={card.box}>
        <View style={card.headerRow}>
          <Text style={card.title}>⚖️ Poids ({wLabel})</Text>
          {deltaWeight !== null && (
            <Text style={[card.badge, { color: deltaWeight <= 0 ? Colors.success : Colors.error }]}>
              {deltaWeight > 0 ? '+' : ''}{deltaWeight.toFixed(1)} {wLabel}
            </Text>
          )}
        </View>
        {hasWeightData ? (
          <>
            <Text style={card.bigNum}>
              {weightValues[weightValues.length - 1].toFixed(1)}
              <Text style={card.bigNumUnit}> {wLabel}</Text>
            </Text>
            <LineChart
              data={{ labels: weightLabels, datasets: [{ data: weightValues }] }}
              width={CHART_W}
              height={130}
              chartConfig={chartCfg('#06B6D4')}
              bezier withDots={false} withInnerLines={false} withOuterLines={false} withShadow={false}
              style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm }}
              yAxisSuffix={` ${wLabel}`}
              segments={3}
              fromZero={false}
            />
          </>
        ) : (
          <>
            <Text style={card.emptyHint}>Ajoute des logs corporels pour voir ton évolution</Text>
            <LineChart
              data={{ labels: emptyLabels, datasets: [{ data: [70, 70, 70, 70, 70, 70] }] }}
              width={CHART_W} height={100}
              chartConfig={chartCfg('#06B6D4', true)}
              bezier withDots={false} withInnerLines={false} withOuterLines={false} withShadow={false}
              style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: 0.2 }}
              yAxisSuffix={` ${wLabel}`}
              segments={2} fromZero={false}
            />
          </>
        )}
      </View>

      {/* Calories balance */}
      <View style={card.box}>
        <Text style={card.title}>🔥 Balance calorique</Text>
        {hasCalData ? (
          <>
            <View style={calStyles.pills}>
              <CalPill label="Brûlées"    value={calBurned.reduce((s: number, v: number) => s + v, 0)} color={Colors.electric} />
              <CalPill label="Consommées" value={calConsumed.reduce((s: number, v: number) => s + v, 0)} color={Colors.textSecondary} />
              <CalPill label="Balance" sign
                value={calConsumed.reduce((s: number, v: number) => s + v, 0) - calBurned.reduce((s: number, v: number) => s + v, 0)}
                color={Colors.success}
              />
            </View>
            <BarChart
              data={{ labels: calLabels, datasets: [{ data: calBurned }] }}
              width={CHART_W} height={110}
              yAxisLabel="" yAxisSuffix=" kcal"
              chartConfig={chartCfg('#F97316')}
              withInnerLines={false} showBarTops={false}
              style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm }}
              fromZero
            />
          </>
        ) : (
          <>
            <Text style={card.emptyHint}>Enregistre ton alimentation pour voir la balance</Text>
            <BarChart
              data={{ labels: emptyLabels, datasets: [{ data: emptyVals }] }}
              width={CHART_W} height={100}
              yAxisLabel="" yAxisSuffix=" kcal"
              chartConfig={chartCfg('#F97316', true)}
              withInnerLines={false} showBarTops={false}
              style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: 0.2 }}
              fromZero
            />
          </>
        )}
      </View>
    </>
  )
}

function EmptyBarChart({ label }: { label: string }) {
  return (
    <View style={{ opacity: 0.3 }}>
      <Text style={{ fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 4 }}>{label}</Text>
      <BarChart
        data={{ labels: ['—', '—', '—', '—', '—', '—'], datasets: [{ data: [0, 0, 0, 0, 0, 0] }] }}
        width={CHART_W} height={80}
        yAxisLabel="" yAxisSuffix=""
        chartConfig={chartCfg(Colors.textTertiary, true)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm }}
        fromZero
      />
    </View>
  )
}

function CalPill({ label, value, color, sign }: { label: string; value: number; color: string; sign?: boolean }) {
  return (
    <View style={calStyles.pill}>
      <Text style={[calStyles.val, { color }]}>{sign && value > 0 ? '+' : ''}{Math.round(value)}</Text>
      <Text style={calStyles.lab}>{label}</Text>
    </View>
  )
}

// ── Shared atoms ──────────────────────────────────────────────

function KpiCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <View style={[kpi.card, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={kpi.icon}>{icon}</Text>
      <Text style={[kpi.value, { color: accent }]}>{value}</Text>
      <Text style={kpi.label}>{label}</Text>
    </View>
  )
}

const SPORT_LABEL: Record<SportType, string> = {
  running: 'Course', cycling: 'Vélo', swimming: 'Natation',
  gym: 'Muscu', badminton: 'Badminton', athletics: 'Athlétisme',
  football: 'Football', tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}

function chartCfg(accent: string = Colors.electric, empty = false) {
  return {
    backgroundGradientFrom: Colors.bgCard,
    backgroundGradientTo: Colors.bgCard,
    color: (o = 1) => {
      if (empty) return `rgba(160,160,180,${o * 0.5})`
      const hex = accent.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16) || 0
      const g = parseInt(hex.slice(2, 4), 16) || 0
      const b = parseInt(hex.slice(4, 6), 16) || 0
      return `rgba(${r},${g},${b},${o})`
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
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: 3,
    gap: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tabEmoji: { fontSize: 13 },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textTertiary },
  tabTextActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: { backgroundColor: Colors.electric, borderColor: Colors.electric },
  periodText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  periodTextActive: { color: '#fff' },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  swipeHint: { alignItems: 'center' },
  swipeHintText: { fontSize: 10, color: Colors.textTertiary, fontStyle: 'italic' },
})

const kpi = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  icon: { fontSize: 20 },
  value: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  label: { fontSize: 9, color: Colors.textTertiary, textAlign: 'center' },
})

const card = StyleSheet.create({
  box: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  bigNum: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  bigNumUnit: { fontSize: FontSize.lg, fontWeight: FontWeight.regular, color: Colors.textSecondary },
  empty: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.md },
  emptyHint: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic' },
})

const breakdown = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { width: 72, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  barBg: { flex: 1, height: 8, backgroundColor: Colors.bgAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  pct: { width: 32, fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
})

const calStyles = StyleSheet.create({
  pills: { flexDirection: 'row', gap: Spacing.sm },
  pill: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  val: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  lab: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
})

const prStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  item: {
    minWidth: '45%',
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  emoji: { fontSize: 20 },
  value: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, textAlign: 'center' },
  label: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
})
