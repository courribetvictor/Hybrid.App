import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import type { BodyLog, Activity } from '@/types/database'

interface CaloriesChartProps {
  bodyLogs: BodyLog[]
  activities: Activity[]
}

const SCREEN_W = Dimensions.get('window').width
const CHART_W = SCREEN_W - Spacing.md * 2 - 2

interface DayData {
  date: string
  burned: number
  consumed: number
  balance: number
}

export function CaloriesChart({ bodyLogs, activities }: CaloriesChartProps) {
  const days: DayData[] = useMemo(() => {
    // Build a map: date → burned calories from activities
    const burnedMap: Record<string, number> = {}
    for (const a of activities) {
      const day = a.created_at.split('T')[0]
      burnedMap[day] = (burnedMap[day] ?? 0) + (a.calories_burned ?? 0)
    }

    // Merge with body_logs (consumed)
    const allDates = new Set([
      ...Object.keys(burnedMap),
      ...bodyLogs.map(l => l.logged_date),
    ])

    return Array.from(allDates)
      .sort()
      .slice(-10)
      .map(date => {
        const consumed = bodyLogs.find(l => l.logged_date === date)?.calories_consumed ?? 0
        const burned = burnedMap[date] ?? 0
        return { date, consumed, burned, balance: consumed - burned }
      })
  }, [bodyLogs, activities])

  if (days.length === 0) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.emptyText}>Aucune donnée de calories</Text>
      </View>
    )
  }

  const labels = days.map(d => {
    const dt = new Date(d.date)
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  })

  const avgBalance = days.reduce((s, d) => s + d.balance, 0) / days.length
  const totalBurned = days.reduce((s, d) => s + d.burned, 0)
  const totalConsumed = days.reduce((s, d) => s + d.consumed, 0)

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Calories</Text>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <StatPill label="Brûlées" value={totalBurned} color={Colors.electric} />
        <StatPill label="Consommées" value={totalConsumed} color={Colors.textSecondary} />
        <StatPill
          label="Balance moy."
          value={Math.round(avgBalance)}
          color={avgBalance <= 0 ? Colors.success : Colors.error}
          showSign
        />
      </View>

      {/* Burned bar chart */}
      <Text style={styles.subLabel}>Calories brûlées / jour</Text>
      <BarChart
        data={{
          labels,
          datasets: [{ data: days.map(d => d.burned) }],
        }}
        width={CHART_W}
        height={120}
        yAxisLabel=""
        yAxisSuffix=" kcal"
        chartConfig={chartConfigBurned}
        withInnerLines={false}
        showBarTops={false}
        style={styles.chart}
        fromZero
      />
    </View>
  )
}

function StatPill({
  label,
  value,
  color,
  showSign,
}: {
  label: string
  value: number
  color: string
  showSign?: boolean
}) {
  const display = showSign && value > 0 ? `+${value}` : `${value}`
  return (
    <View style={pillStyles.container}>
      <Text style={[pillStyles.value, { color }]}>{display}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  )
}

const chartConfigBurned = {
  backgroundGradientFrom: Colors.bgCard,
  backgroundGradientTo: Colors.bgCard,
  color: (opacity = 1) => `rgba(0, 85, 255, ${opacity})`,
  labelColor: () => Colors.textTertiary,
  strokeWidth: 2,
  barPercentage: 0.6,
  propsForLabels: { fontSize: FontSize.xs },
  propsForBackgroundLines: { stroke: 'transparent' },
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  subLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  chart: {
    marginLeft: -Spacing.md,
    marginBottom: -Spacing.sm,
  },
})

const pillStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
})
