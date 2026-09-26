import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { MUSCLE_GROUP_COLORS } from '@/constants/exercises'
import type { ExerciseTemplate } from '@/constants/exercises'

const DIFFICULTY_LABEL = ['', 'Débutant', 'Intermédiaire', 'Avancé']
const DIFFICULTY_COLOR = ['', Colors.success, '#F59E0B', Colors.error]
const EQUIPMENT_LABEL: Record<string, string> = {
  barre: '🏋️ Barre', haltères: '🏋️ Haltères', machine: '⚙️ Machine',
  câble: '🔵 Câble', corps: '💪 Poids du corps', poulie: '🔵 Poulie',
}

interface ExerciseCardProps {
  exercise: ExerciseTemplate
  onPress?: (exercise: ExerciseTemplate) => void
  compact?: boolean
}

export function ExerciseCard({ exercise, onPress, compact }: ExerciseCardProps) {
  const accentColor = MUSCLE_GROUP_COLORS[exercise.category] ?? Colors.electric
  const diffLabel = exercise.difficulty ? DIFFICULTY_LABEL[exercise.difficulty] : null
  const diffColor = exercise.difficulty ? DIFFICULTY_COLOR[exercise.difficulty] : Colors.textTertiary

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor }]}
      onPress={() => onPress?.(exercise)}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Color strip */}
      <View style={[styles.strip, { backgroundColor: accentColor + '22' }]}>
        <Text style={styles.emoji}>{exercise.emoji}</Text>
      </View>

      <View style={styles.body}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>

        {/* Muscle group badge */}
        <View style={styles.badges}>
          <View style={[styles.muscleBadge, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.muscleLabel, { color: accentColor }]}>{exercise.category}</Text>
          </View>
          {exercise.difficulty && (
            <View style={[styles.diffBadge, { backgroundColor: diffColor + '15' }]}>
              <Text style={[styles.diffLabel, { color: diffColor }]}>{diffLabel}</Text>
            </View>
          )}
        </View>

        {/* Secondary muscles */}
        {!compact && exercise.muscles && exercise.muscles.length > 0 && (
          <Text style={styles.secondary} numberOfLines={1}>
            + {exercise.muscles.join(', ')}
          </Text>
        )}

        {/* Equipment */}
        {!compact && exercise.equipment && (
          <Text style={styles.equipment}>{EQUIPMENT_LABEL[exercise.equipment] ?? exercise.equipment}</Text>
        )}

        {/* Description */}
        {!compact && exercise.description && (
          <Text style={styles.desc} numberOfLines={2}>{exercise.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ── Muscle group section header ───────────────────────────────

export function MuscleGroupHeader({ name, count }: { name: string; count: number }) {
  const color = MUSCLE_GROUP_COLORS[name] ?? Colors.electric
  return (
    <View style={[headerStyles.row, { borderLeftColor: color }]}>
      <Text style={[headerStyles.title, { color }]}>{name}</Text>
      <View style={[headerStyles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[headerStyles.badgeText, { color }]}>{count} exercices</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  strip: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  emoji: { fontSize: 22 },
  body: {
    flex: 1,
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
    gap: 4,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  muscleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  muscleLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  diffLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  secondary: { fontSize: FontSize.xs, color: Colors.textTertiary },
  equipment: { fontSize: FontSize.xs, color: Colors.textSecondary },
  desc: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic' },
})

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
})
