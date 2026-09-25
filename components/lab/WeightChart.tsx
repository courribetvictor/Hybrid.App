import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { displayWeight } from '@/lib/units'
import type { BodyLog } from '@/types/database'
import type { PreferredUnit } from '@/types/database'

interface WeightChartProps {
  logs: BodyLog[]
  unit: PreferredUnit
}

const SCREEN_W = Dimensions.get('window').width
const CHART_W = SCREEN_W - Spacing.md * 2 - 2 // card padding

export function WeightChart({ logs, unit }: WeightChartProps) {
  const filtered = useMemo(
    () => logs.filter(l => l.weight_kg !== null).slice(-14), // last 14 data points
    [logs],
  )

  if (filtered.length < 2) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.emptyText}>Pas assez de données de poids</Text>
      </View>
    )
  }

  const labels = filtered.map(l => {
    const d = new Date(l.logged_date)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })

  const values = filtered.map(l => {
    const { value } = displayWeight(l.weight_kg!, unit)
    return value
  })

  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const delta = maxVal - minVal
  const deltaSign = delta >= 0 ? '+' : ''
  const weightLabel = unit === 'imperial' ? 'lbs' : 'kg'

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Poids</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: delta <= 0 ? Colors.success : Colors.error }]}>
            {deltaSign}{delta.toFixed(1)} {weightLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.currentValue}>
        {values[values.length - 1].toFixed(1)}
        <Text style={styles.unit}> {weightLabel}</Text>
      </Text>

      <LineChart
        data={{ labels, datasets: [{ data: values }] }}
        width={CHART_W}
        height={140}
        chartConfig={chartConfig}
        bezier
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        withShadow={false}
        style={styles.chart}
        fromZero={false}
        yAxisSuffix={` ${weightLabel}`}
        yAxisInterval={1}
        segments={3}
      />
    </View>
  )
}

const chartConfig = {
  backgroundGradientFrom: Colors.bgCard,
  backgroundGradientTo: Colors.bgCard,
  color: (opacity = 1) => `rgba(0, 85, 255, ${opacity})`,
  labelColor: () => Colors.textTertiary,
  strokeWidth: 2.5,
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
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  currentValue: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  unit: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  chart: {
    marginLeft: -Spacing.md,
    marginBottom: -Spacing.sm,
  },
})
