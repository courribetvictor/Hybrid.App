import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { daysRemaining } from '@/hooks/useWeeklyChallenges'
import type { WeeklyChallenge } from '@/types/database'

const SPORT_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊',
  gym: '🏋️', badminton: '🏸', athletics: '⚡',
}

interface ChallengeCardProps {
  challenge: WeeklyChallenge
  isPro: boolean
  onProLock: () => void
}

export function ChallengeCard({ challenge, isPro, onProLock }: ChallengeCardProps) {
  const locked = challenge.is_pro_only && !isPro
  const days = daysRemaining(challenge.end_date)
  const accentColor = SportColors[challenge.sport_type]
  const urgentColor = days <= 2 ? Colors.error : Colors.textTertiary

  return (
    <TouchableOpacity
      activeOpacity={locked ? 0.6 : 0.85}
      onPress={locked ? onProLock : undefined}
      style={[styles.card, locked && styles.cardLocked]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.sportBadge, { backgroundColor: accentColor + '1A' }]}>
          <Text style={styles.sportEmoji}>{SPORT_EMOJI[challenge.sport_type]}</Text>
          <Text style={[styles.sportLabel, { color: accentColor }]}>
            {challenge.sport_type.charAt(0).toUpperCase() + challenge.sport_type.slice(1)}
          </Text>
        </View>

        {challenge.is_pro_only && (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>⚡ PRO</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, locked && styles.titleLocked]} numberOfLines={2}>
        {locked ? '🔒  ' : ''}{challenge.title}
      </Text>

      {/* Target */}
      {challenge.target_value !== null && (
        <Text style={styles.target}>
          Objectif : {challenge.target_value} {challenge.target_unit}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.days, { color: urgentColor }]}>
          {days === 0 ? 'Dernier jour !' : `J-${days}`}
        </Text>
        {locked && (
          <Text style={styles.unlockHint}>Débloquer PRO →</Text>
        )}
      </View>

      {/* Left accent strip */}
      <View style={[styles.strip, { backgroundColor: accentColor }]} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 4,
    gap: Spacing.xs,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardLocked: {
    opacity: 0.7,
  },
  strip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sportEmoji: { fontSize: 13 },
  sportLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  proBadge: {
    backgroundColor: Colors.electric,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  titleLocked: {
    color: Colors.textSecondary,
  },
  target: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  days: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  unlockHint: {
    fontSize: FontSize.sm,
    color: Colors.electric,
    fontWeight: FontWeight.medium,
  },
})
