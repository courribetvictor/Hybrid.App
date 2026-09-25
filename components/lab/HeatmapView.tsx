import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

interface HeatmapViewProps {
  data: Record<string, number> // ISO date → activity count
  weeks?: number
}

const CELL = 13
const GAP = 3
const DAYS = 7

const INTENSITY_COLORS = [
  Colors.bgAlt,          // 0 — no activity
  Colors.electricDim,    // 1
  'rgba(0,85,255,0.35)', // 2
  'rgba(0,85,255,0.65)', // 3
  Colors.electric,       // 4+
]

function intensityIndex(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function HeatmapView({ data, weeks = 16 }: HeatmapViewProps) {
  const grid = useMemo(() => {
    // Build a weeks×7 grid ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from the Monday of (weeks) weeks ago
    const startDay = new Date(today)
    startDay.setDate(today.getDate() - weeks * 7 + 1)

    const columns: { date: string; count: number }[][] = []
    let col: { date: string; count: number }[] = []

    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(startDay)
      d.setDate(startDay.getDate() + i)
      const key = toISODate(d)
      col.push({ date: key, count: data[key] ?? 0 })

      if (col.length === DAYS) {
        columns.push(col)
        col = []
      }
    }
    if (col.length > 0) columns.push(col)
    return columns
  }, [data, weeks])

  const totalActivities = Object.values(data).reduce((s, v) => s + v, 0)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Carte d'effort</Text>
        <Text style={styles.total}>{totalActivities} séances</Text>
      </View>

      <View style={styles.grid}>
        {grid.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((cell, ri) => (
              <View
                key={ri}
                style={[
                  styles.cell,
                  { backgroundColor: INTENSITY_COLORS[intensityIndex(cell.count)] },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Moins</Text>
        {INTENSITY_COLORS.map((c, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendLabel}>Plus</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  grid: {
    flexDirection: 'row',
    gap: GAP,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  col: {
    flexDirection: 'column',
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    justifyContent: 'flex-end',
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
})
