import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { PieChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import type { SportType } from '@/types/database'

interface SportsPieChartProps {
  breakdown: Partial<Record<SportType, number>>
  labelFn?: (sport: SportType) => string
}

const SCREEN_W = Dimensions.get('window').width
const CHART_SIZE = SCREEN_W - Spacing.md * 2 - 2

const SPORT_LABELS: Record<SportType, string> = {
  running: 'Course',
  cycling: 'Vélo',
  swimming: 'Natation',
  gym: 'Muscu',
  badminton: 'Badminton',
  athletics: 'Athlétisme',
}

export function SportsPieChart({ breakdown, labelFn }: SportsPieChartProps) {
  const chartData = useMemo(() => {
    return (Object.entries(breakdown) as [SportType, number][])
      .filter(([, count]) => count > 0)
      .map(([sport, count]) => ({
        name: labelFn ? labelFn(sport) : SPORT_LABELS[sport],
        count,
        color: SportColors[sport],
        legendFontColor: Colors.textSecondary,
        legendFontSize: FontSize.sm,
      }))
  }, [breakdown, labelFn])

  const total = chartData.reduce((s, d) => s + d.count, 0)

  if (chartData.length === 0) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.emptyText}>Aucune activité enregistrée</Text>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Répartition des sports</Text>
        <Text style={styles.total}>{total} séances</Text>
      </View>

      <PieChart
        data={chartData}
        width={CHART_SIZE}
        height={180}
        chartConfig={{
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="8"
        absolute={false}
      />

      {/* Custom legend with percentages */}
      <View style={styles.legend}>
        {chartData.map(d => (
          <View key={d.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={styles.legendName}>{d.name}</Text>
            <Text style={styles.legendPct}>
              {Math.round((d.count / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
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
  total: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  legend: {
    marginTop: Spacing.sm,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  legendPct: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
})
