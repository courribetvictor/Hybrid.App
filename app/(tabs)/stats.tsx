import React, { useState, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
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
  // Shared value so the worklet reads the live index without stale closure
  const tabIndexSV = useSharedValue(0)
  const tabBarWidth = useRef(W - Spacing.md * 2 - 6)

  const unit = profile?.preferred_unit ?? 'metric'
  const { logs: bodyLogs } = useBodyLogs(userId ?? undefined, period)
  const { activities, heatmapData, sportBreakdown, totalCalories, totalDurationSeconds } =
    useActivities(userId ?? undefined, period)

  const switchTab = useCallback((newTab: Tab) => {
    const idx = TAB_KEYS.indexOf(newTab)
    tabIndexSV.value = idx
    setTab(newTab)
    const chipW = tabBarWidth.current / 3
    indicatorX.value = withSpring(idx * chipW, { damping: 18, stiffness: 200 })
  }, [indicatorX, tabIndexSV])

  const swipe = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onEnd(e => {
      'worklet'
      const idx = tabIndexSV.value
      if (e.velocityX < -150 && idx < TAB_KEYS.length - 1) {
        runOnJS(switchTab)(TAB_KEYS[idx + 1])
      } else if (e.velocityX > 150 && idx > 0) {
        runOnJS(switchTab)(TAB_KEYS[idx - 1])
      }
    })
  // Simultaneous allows native vertical scroll AND horizontal swipe detection
  const nativeScroll = Gesture.Native()
  const swipeAndScroll = Gesture.Simultaneous(swipe, nativeScroll)

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

      {/* Swipeable content — Simultaneous allows vertical scroll to work */}
      <GestureDetector gesture={swipeAndScroll}>
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
            <>
              <TouchableOpacity
                style={exerciseBtn.row}
                onPress={() => router.push('/modals/exercises' as any)}
                activeOpacity={0.8}
              >
                <Text style={exerciseBtn.emoji}>📚</Text>
                <Text style={exerciseBtn.label}>Base d'exercices</Text>
                <Text style={exerciseBtn.arrow}>→</Text>
              </TouchableOpacity>
              <SportStatsTab activities={activities} unit={unit} />
            </>
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

      {/* Sport breakdown — pie chart */}
      <SportPieChart sportBreakdown={sportBreakdown} total={total} />

      {/* Weekly sessions bar chart */}
      <WeeklyVolumeChart activities={activities} />

      {/* Weekly duration bar chart */}
      <WeeklyDurationChart activities={activities} />

      {/* Personal records */}
      <PersonalRecords activities={activities} />

      {/* Cumulative distance line chart */}
      <CumulativeDistanceChart activities={activities} />

      {/* Weekly calories bar chart */}
      <WeeklyCaloriesChart activities={activities} />

      {/* Sport time pie — time breakdown by sport */}
      <SportTimePieChart activities={activities} />

      {/* Session length distribution */}
      <SessionLengthChart activities={activities} />
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

function CumulativeDistanceChart({ activities }: any) {
  const sorted = [...activities].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
  let cum = 0
  const points: { label: string; value: number }[] = []
  for (const a of sorted) {
    const dist = (a.metrics?.distance_m ?? 0) / 1000
    if (dist > 0) {
      cum += dist
      points.push({ label: a.created_at.slice(5, 10), value: parseFloat(cum.toFixed(1)) })
    }
  }
  const sampled = points.length > 8 ? points.filter((_, i) => i % Math.ceil(points.length / 8) === 0 || i === points.length - 1) : points
  const hasData = sampled.length >= 2

  return (
    <View style={card.box}>
      <Text style={card.title}>📈 Distance cumulée (km)</Text>
      {!hasData && <Text style={card.emptyHint}>Données de course/vélo/natation requises</Text>}
      <LineChart
        data={{
          labels: hasData ? sampled.map(p => p.label) : ['—', '—', '—', '—', '—', '—'],
          datasets: [{ data: hasData ? sampled.map(p => p.value) : [0, 0, 0, 0, 0, 0] }],
        }}
        width={CHART_W} height={120}
        chartConfig={chartCfg(Colors.electric, !hasData)}
        bezier withDots={false} withInnerLines={false} withOuterLines={false} withShadow={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        yAxisSuffix=" km" segments={3} fromZero
      />
    </View>
  )
}

function WeeklyCaloriesChart({ activities }: any) {
  const byWeek: Record<string, number> = {}
  for (const a of activities) {
    const d = new Date(a.created_at)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = `${monday.getDate()}/${monday.getMonth() + 1}`
    byWeek[key] = (byWeek[key] ?? 0) + (a.calories_burned ?? 0)
  }
  const now = new Date()
  const weeks: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7 - ((now.getDay() + 6) % 7))
    weeks.push(`${d.getDate()}/${d.getMonth() + 1}`)
  }
  const vals = weeks.map(k => Math.round(byWeek[k] ?? 0))
  const hasData = vals.some(v => v > 0)

  return (
    <View style={card.box}>
      <Text style={card.title}>🔥 Calories brûlées / semaine</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de données…</Text>}
      <BarChart
        data={{ labels: weeks, datasets: [{ data: hasData ? vals : [0, 0, 0, 0, 0, 0] }] }}
        width={CHART_W} height={120}
        yAxisLabel="" yAxisSuffix=" kcal"
        chartConfig={chartCfg('#EF4444', !hasData)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        fromZero
      />
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

      {/* BMI trend */}
      <BmiTrendCard bodyLogs={bodyLogs} unit={unit} />

      {/* Calories burned by sport — pie */}
      <CaloriesBySportPie activities={activities} />

      {/* Session frequency heatmap by day-of-week */}
      <DayFrequencyCard activities={activities} />

      {/* Calories burned from training per week */}
      <TrainingCaloriesCard activities={activities} />
    </>
  )
}

function BmiTrendCard({ bodyLogs, unit }: any) {
  const bmiLogs = bodyLogs
    .filter((l: any) => l.weight_kg && l.height_cm)
    .slice(-10)
    .map((l: any) => {
      const hm = l.height_cm / 100
      const bmi = parseFloat((l.weight_kg / (hm * hm)).toFixed(1))
      const d = new Date(l.logged_date)
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: bmi }
    })
  const hasData = bmiLogs.length >= 2
  const latest = hasData ? bmiLogs[bmiLogs.length - 1].value : null
  const bmiLabel = latest
    ? latest < 18.5 ? 'Insuffisance pondérale' : latest < 25 ? 'Normal' : latest < 30 ? 'Surpoids' : 'Obésité'
    : null

  return (
    <View style={card.box}>
      <View style={card.headerRow}>
        <Text style={card.title}>📐 IMC (BMI)</Text>
        {latest && <Text style={[card.badge, { color: latest >= 18.5 && latest < 25 ? Colors.success : Colors.warning }]}>
          {latest} · {bmiLabel}
        </Text>}
      </View>
      {!hasData && <Text style={card.emptyHint}>Renseigne taille + poids dans les logs corporels</Text>}
      <LineChart
        data={{
          labels: hasData ? bmiLogs.map((p: any) => p.label) : ['—', '—', '—', '—', '—', '—'],
          datasets: [{ data: hasData ? bmiLogs.map((p: any) => p.value) : [20, 20, 20, 20, 20, 20] }],
        }}
        width={CHART_W} height={110}
        chartConfig={chartCfg('#06B6D4', !hasData)}
        bezier withDots={false} withInnerLines={false} withOuterLines={false} withShadow={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        yAxisSuffix="" segments={3} fromZero={false}
      />
    </View>
  )
}

function CaloriesBySportPie({ activities }: any) {
  const calBySport: Record<string, number> = {}
  for (const a of activities) {
    if ((a.calories_burned ?? 0) > 0) {
      const s = a.sport_type as SportType
      calBySport[s] = (calBySport[s] ?? 0) + (a.calories_burned ?? 0)
    }
  }
  const entries = (Object.entries(calBySport) as [SportType, number][]).sort((a, b) => b[1] - a[1])
  const hasData = entries.length > 0

  const pieData = hasData
    ? entries.map(([sport, cal]) => ({
        name: SPORT_LABEL[sport],
        count: Math.round(cal),
        color: SportColors[sport] ?? '#888',
        legendFontColor: Colors.textSecondary,
        legendFontSize: 11,
      }))
    : [{ name: 'Aucun', count: 1, color: Colors.border, legendFontColor: Colors.textTertiary, legendFontSize: 11 }]

  return (
    <View style={card.box}>
      <Text style={card.title}>🥧 Calories par sport</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de données calories…</Text>}
      <PieChart
        data={pieData}
        width={CHART_W}
        height={150}
        chartConfig={chartCfg('#F97316')}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="10"
        style={{ opacity: hasData ? 1 : 0.3, marginLeft: -Spacing.sm }}
      />
    </View>
  )
}

function DayFrequencyCard({ activities }: any) {
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const a of activities) {
    const d = new Date(a.created_at)
    const dow = (d.getDay() + 6) % 7 // 0=Mon
    counts[dow]++
  }
  const hasData = counts.some(c => c > 0)

  return (
    <View style={card.box}>
      <Text style={card.title}>📅 Fréquence par jour</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de données…</Text>}
      <BarChart
        data={{ labels: DAY_LABELS, datasets: [{ data: hasData ? counts : [0, 0, 0, 0, 0, 0, 0] }] }}
        width={CHART_W} height={120}
        yAxisLabel="" yAxisSuffix=""
        chartConfig={chartCfg('#8B5CF6', !hasData)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        fromZero
      />
    </View>
  )
}

function TrainingCaloriesCard({ activities }: any) {
  const byWeek: Record<string, number> = {}
  for (const a of activities) {
    const d = new Date(a.created_at)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = `${monday.getDate()}/${monday.getMonth() + 1}`
    byWeek[key] = (byWeek[key] ?? 0) + (a.calories_burned ?? 0)
  }
  const now = new Date()
  const weeks: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7 - ((now.getDay() + 6) % 7))
    weeks.push(`${d.getDate()}/${d.getMonth() + 1}`)
  }
  const vals = weeks.map(k => Math.round(byWeek[k] ?? 0))
  const hasData = vals.some(v => v > 0)
  const total = vals.reduce((s, v) => s + v, 0)

  return (
    <View style={card.box}>
      <View style={card.headerRow}>
        <Text style={card.title}>🔥 Calories à l'entraînement</Text>
        {hasData && <Text style={[card.badge, { color: '#EF4444' }]}>{total.toLocaleString('fr-FR')} kcal</Text>}
      </View>
      {!hasData && <Text style={card.emptyHint}>Ajoute des séances pour voir les calories brûlées</Text>}
      <BarChart
        data={{ labels: weeks, datasets: [{ data: hasData ? vals : [0, 0, 0, 0, 0, 0] }] }}
        width={CHART_W} height={120}
        yAxisLabel="" yAxisSuffix=" kcal"
        chartConfig={chartCfg('#EF4444', !hasData)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        fromZero
      />
    </View>
  )
}

function SportPieChart({ sportBreakdown, total }: { sportBreakdown: Record<string, number>; total: number }) {
  const entries = (Object.entries(sportBreakdown) as [SportType, number][]).sort((a, b) => b[1] - a[1])
  const hasData = entries.length > 0

  const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F97316', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#84CC16']
  const pieData = hasData
    ? entries.map(([sport, count], i) => ({
        name: SPORT_LABEL[sport],
        count,
        color: SportColors[sport] ?? PIE_COLORS[i % PIE_COLORS.length],
        legendFontColor: Colors.textSecondary,
        legendFontSize: 11,
      }))
    : [{ name: 'Aucun', count: 1, color: Colors.border, legendFontColor: Colors.textTertiary, legendFontSize: 11 }]

  return (
    <View style={card.box}>
      <Text style={card.title}>🥧 Répartition des sports</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de séances enregistrées…</Text>}
      <PieChart
        data={pieData}
        width={CHART_W}
        height={150}
        chartConfig={chartCfg(Colors.electric)}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="10"
        style={{ opacity: hasData ? 1 : 0.3, marginLeft: -Spacing.sm }}
      />
    </View>
  )
}

function SportTimePieChart({ activities }: { activities: any[] }) {
  const timeByScvort: Record<string, number> = {}
  for (const a of activities) {
    const s = a.sport_type as SportType
    timeByScvort[s] = (timeByScvort[s] ?? 0) + a.duration_seconds
  }
  const entries = (Object.entries(timeByScvort) as [SportType, number][]).sort((a, b) => b[1] - a[1])
  const hasData = entries.length > 0

  const pieData = hasData
    ? entries.map(([sport, secs]) => ({
        name: SPORT_LABEL[sport],
        count: Math.round(secs / 60),
        color: SportColors[sport] ?? '#888',
        legendFontColor: Colors.textSecondary,
        legendFontSize: 11,
      }))
    : [{ name: 'Aucun', count: 1, color: Colors.border, legendFontColor: Colors.textTertiary, legendFontSize: 11 }]

  return (
    <View style={card.box}>
      <Text style={card.title}>⏱ Temps par sport (min)</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de séances enregistrées…</Text>}
      <PieChart
        data={pieData}
        width={CHART_W}
        height={150}
        chartConfig={chartCfg('#8B5CF6')}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="10"
        style={{ opacity: hasData ? 1 : 0.3, marginLeft: -Spacing.sm }}
      />
    </View>
  )
}

function SessionLengthChart({ activities }: { activities: any[] }) {
  // Buckets: < 20 min, 20-45 min, 45-75 min, > 75 min
  const buckets = [0, 0, 0, 0]
  const labels = ['<20m', '20-45m', '45-75m', '>75m']
  for (const a of activities) {
    const min = a.duration_seconds / 60
    if (min < 20) buckets[0]++
    else if (min < 45) buckets[1]++
    else if (min < 75) buckets[2]++
    else buckets[3]++
  }
  const hasData = buckets.some(b => b > 0)

  return (
    <View style={card.box}>
      <Text style={card.title}>📏 Durée des séances</Text>
      {!hasData && <Text style={card.emptyHint}>En attente de données…</Text>}
      <BarChart
        data={{ labels, datasets: [{ data: hasData ? buckets : [0, 0, 0, 0] }] }}
        width={CHART_W} height={130}
        yAxisLabel="" yAxisSuffix=" séances"
        chartConfig={chartCfg('#10B981', !hasData)}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm, opacity: hasData ? 1 : 0.3 }}
        fromZero
      />
    </View>
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

const exerciseBtn = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.electric,
    ...Shadow.sm,
  },
  emoji: { fontSize: 18 },
  label: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  arrow: { fontSize: FontSize.md, color: Colors.electric },
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
