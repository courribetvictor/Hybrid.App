import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'
import { WeightChart } from '@/components/lab/WeightChart'
import { CaloriesChart } from '@/components/lab/CaloriesChart'
import { HeatmapView } from '@/components/lab/HeatmapView'
import { SportsPieChart } from '@/components/lab/SportsPieChart'
import { SportStatsTab } from '@/components/lab/SportStatsTab'
import { useBodyLogs } from '@/hooks/useBodyLogs'
import { useActivities } from '@/hooks/useActivities'
import { useT } from '@/lib/i18n'
import { formatDurationLong } from '@/lib/units'

// ── Sub-tab types ─────────────────────────────────────────────
type SubTab = 'morphology' | 'global' | 'sport'
type Period = 7 | 30 | 90 | 365

const SUBTABS: { key: SubTab; labelKey: 'morphology' | 'globalStats' | 'sportStats' }[] = [
  { key: 'morphology', labelKey: 'morphology' },
  { key: 'global', labelKey: 'globalStats' },
  { key: 'sport', labelKey: 'sportStats' },
]

const PERIODS: { value: Period; labelKey: 'last7Days' | 'last30Days' | 'last90Days' | 'allTime' }[] = [
  { value: 7, labelKey: 'last7Days' },
  { value: 30, labelKey: 'last30Days' },
  { value: 90, labelKey: 'last90Days' },
  { value: 365, labelKey: 'allTime' },
]

// Replace with auth context in production
const CURRENT_USER_ID = 'placeholder-user-id'
const CURRENT_UNIT = 'metric' as const

export default function LabScreen() {
  const t = useT()
  const [activeTab, setActiveTab] = useState<SubTab>('morphology')
  const [period, setPeriod] = useState<Period>(30)

  const { logs: bodyLogs, loading: logsLoading } = useBodyLogs(CURRENT_USER_ID, period)
  const { activities, heatmapData, sportBreakdown, totalCalories, totalDurationSeconds } =
    useActivities(CURRENT_USER_ID, period)

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.lab.title}</Text>
      </View>

      {/* Sub-tabs */}
      <SubTabBar active={activeTab} onChange={setActiveTab} t={t} />

      {/* Period filter */}
      <PeriodFilter active={period} onChange={setPeriod} t={t} />

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'morphology' && (
          <MorphologyTab
            bodyLogs={bodyLogs}
            activities={activities}
            unit={CURRENT_UNIT}
            loading={logsLoading}
          />
        )}

        {activeTab === 'global' && (
          <GlobalTab
            heatmapData={heatmapData}
            sportBreakdown={sportBreakdown}
            totalCalories={totalCalories}
            totalDurationSeconds={totalDurationSeconds}
            activitiesCount={activities.length}
          />
        )}

        {activeTab === 'sport' && (
          <SportStatsTab activities={activities} unit={CURRENT_UNIT} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Sub-tab bar ───────────────────────────────────────────────

function SubTabBar({
  active,
  onChange,
  t,
}: {
  active: SubTab
  onChange: (t: SubTab) => void
  t: ReturnType<typeof useT>
}) {
  return (
    <View style={tabStyles.bar}>
      {SUBTABS.map(tab => (
        <SubTabPill
          key={tab.key}
          label={t.lab[tab.labelKey]}
          active={active === tab.key}
          onPress={() => onChange(tab.key)}
        />
      ))}
    </View>
  )
}

function SubTabPill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const bg = useSharedValue(active ? 1 : 0)
  const style = useAnimatedStyle(() => ({
    backgroundColor: bg.value === 1 ? Colors.electric : Colors.bgAlt,
  }))

  React.useEffect(() => {
    bg.value = withTiming(active ? 1 : 0, { duration: 200 })
  }, [active, bg])

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={[tabStyles.pill, style]}>
        <Text style={[tabStyles.pillText, active && tabStyles.pillTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Period filter ─────────────────────────────────────────────

function PeriodFilter({
  active,
  onChange,
  t,
}: {
  active: Period
  onChange: (p: Period) => void
  t: ReturnType<typeof useT>
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={periodStyles.row}
    >
      {PERIODS.map(p => (
        <TouchableOpacity
          key={p.value}
          onPress={() => onChange(p.value)}
          style={[periodStyles.chip, active === p.value && periodStyles.chipActive]}
        >
          <Text style={[periodStyles.chipText, active === p.value && periodStyles.chipTextActive]}>
            {t.lab[p.labelKey]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

// ── Morphology tab ────────────────────────────────────────────

function MorphologyTab({
  bodyLogs,
  activities,
  unit,
  loading,
}: {
  bodyLogs: ReturnType<typeof useBodyLogs>['logs']
  activities: ReturnType<typeof useActivities>['activities']
  unit: typeof CURRENT_UNIT
  loading: boolean
}) {
  return (
    <>
      <WeightChart logs={bodyLogs} unit={unit} />
      <CaloriesChart bodyLogs={bodyLogs} activities={activities} />
    </>
  )
}

// ── Global tab ────────────────────────────────────────────────

function GlobalTab({
  heatmapData,
  sportBreakdown,
  totalCalories,
  totalDurationSeconds,
  activitiesCount,
}: {
  heatmapData: Record<string, number>
  sportBreakdown: ReturnType<typeof useActivities>['sportBreakdown']
  totalCalories: number
  totalDurationSeconds: number
  activitiesCount: number
}) {
  return (
    <>
      {/* KPI row */}
      <View style={kpiStyles.row}>
        <KpiCard label="Séances" value={String(activitiesCount)} />
        <KpiCard label="Temps total" value={formatDurationLong(totalDurationSeconds)} />
        <KpiCard label="Kcal brûlées" value={String(totalCalories)} />
      </View>

      <HeatmapView data={heatmapData} />
      <SportsPieChart breakdown={sportBreakdown} />
    </>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={kpiStyles.card}>
      <Text style={kpiStyles.value}>{value}</Text>
      <Text style={kpiStyles.label}>{label}</Text>
    </View>
  )
}


// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
})

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
})

const periodStyles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
  },
  chipActive: {
    backgroundColor: Colors.electricDim,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.electric,
  },
})

const kpiStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
})
