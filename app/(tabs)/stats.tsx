import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
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

const PERIODS: { v: Period; l: string }[] = [
  { v: 7, l: '7J' }, { v: 30, l: '30J' }, { v: 90, l: '90J' }, { v: 365, l: '1A' },
]

export default function StatsScreen() {
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState<Period>(30)

  const unit = profile?.preferred_unit ?? 'metric'
  const { logs: bodyLogs } = useBodyLogs(userId ?? undefined, period)
  const { activities, heatmapData, sportBreakdown, totalCalories, totalDurationSeconds } =
    useActivities(userId ?? undefined, period)

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Statistiques" />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {([['overview', 'Aperçu'], ['body', 'Corps'], ['sport', 'Sport']] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
        <KpiCard icon="🏅" label="Séances" value={String(total)} />
        <KpiCard icon="⏱" label="Durée totale" value={formatDurationLong(totalDurationSeconds)} />
        <KpiCard icon="🔥" label="kcal brûlées" value={totalCalories > 0 ? `${Math.round(totalCalories / 1000 * 10) / 10}k` : '—'} />
      </View>

      {/* Heatmap */}
      <HeatmapView data={heatmapData} weeks={14} />

      {/* Sport breakdown */}
      {Object.keys(sportBreakdown).length > 0 && (
        <View style={card.box}>
          <Text style={card.title}>Répartition des sports</Text>
          {(Object.entries(sportBreakdown) as [SportType, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([sport, count]) => {
              const pct = Math.round((count / total) * 100)
              return (
                <View key={sport} style={breakdown.row}>
                  <Text style={breakdown.name}>{SPORT_LABEL[sport]}</Text>
                  <View style={breakdown.barBg}>
                    <View style={[breakdown.barFill, { width: `${pct}%`, backgroundColor: SportColors[sport] }]} />
                  </View>
                  <Text style={breakdown.pct}>{pct}%</Text>
                </View>
              )
            })}
        </View>
      )}

      {/* Weekly volume chart */}
      {total > 0 && <WeeklyVolumeChart activities={activities} />}
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
  const keys = Object.keys(byWeek).slice(-6)
  const vals = keys.map(k => byWeek[k])
  if (keys.length < 2) return null

  return (
    <View style={card.box}>
      <Text style={card.title}>Séances par semaine</Text>
      <BarChart
        data={{ labels: keys, datasets: [{ data: vals }] }}
        width={CHART_W}
        height={120}
        yAxisLabel="" yAxisSuffix=""
        chartConfig={chartCfg()}
        withInnerLines={false} showBarTops={false}
        style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm }}
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

  return (
    <>
      {/* Weight card */}
      <View style={card.box}>
        <View style={card.headerRow}>
          <Text style={card.title}>Poids</Text>
          {deltaWeight !== null && (
            <Text style={[card.badge, { color: deltaWeight <= 0 ? Colors.success : Colors.error }]}>
              {deltaWeight > 0 ? '+' : ''}{deltaWeight.toFixed(1)} {wLabel}
            </Text>
          )}
        </View>
        {weightValues.length >= 2 ? (
          <>
            <Text style={card.bigNum}>
              {weightValues[weightValues.length - 1].toFixed(1)}
              <Text style={card.bigNumUnit}> {wLabel}</Text>
            </Text>
            <LineChart
              data={{ labels: weightLabels, datasets: [{ data: weightValues }] }}
              width={CHART_W}
              height={130}
              chartConfig={chartCfg()}
              bezier withDots={false} withInnerLines={false} withOuterLines={false} withShadow={false}
              style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm }}
              yAxisSuffix={` ${wLabel}`}
              segments={3}
              fromZero={false}
            />
          </>
        ) : (
          <Text style={card.empty}>Pas assez de données de poids</Text>
        )}
      </View>

      {/* Calories balance */}
      {calDays.length >= 2 && (
        <View style={card.box}>
          <Text style={card.title}>Balance calorique</Text>
          <View style={calStyles.pills}>
            <CalPill label="Brûlées" value={calBurned.reduce((s: number, v: number) => s + v, 0)} color={Colors.electric} />
            <CalPill label="Consommées" value={calConsumed.reduce((s: number, v: number) => s + v, 0)} color={Colors.textSecondary} />
            <CalPill
              label="Balance"
              value={calConsumed.reduce((s: number, v: number) => s + v, 0) - calBurned.reduce((s: number, v: number) => s + v, 0)}
              color={Colors.success}
              sign
            />
          </View>
          <BarChart
            data={{ labels: calLabels, datasets: [{ data: calBurned }] }}
            width={CHART_W}
            height={110}
            yAxisLabel="" yAxisSuffix=" kcal"
            chartConfig={chartCfg()}
            withInnerLines={false} showBarTops={false}
            style={{ marginLeft: -Spacing.md, marginBottom: -Spacing.sm }}
            fromZero
          />
        </View>
      )}
    </>
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

function KpiCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={kpi.card}>
      <Text style={kpi.icon}>{icon}</Text>
      <Text style={kpi.value}>{value}</Text>
      <Text style={kpi.label}>{label}</Text>
    </View>
  )
}

const SPORT_LABEL: Record<SportType, string> = {
  running: 'Course', cycling: 'Vélo', swimming: 'Natation',
  gym: 'Muscu', badminton: 'Badminton', athletics: 'Athlétisme',
  football: 'Football', tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}

function chartCfg() {
  return {
    backgroundGradientFrom: Colors.bgCard,
    backgroundGradientTo: Colors.bgCard,
    color: (o = 1) => `rgba(0,85,255,${o})`,
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
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.bgCard, ...Shadow.sm },
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
  },
  icon: { fontSize: 20 },
  value: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
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
