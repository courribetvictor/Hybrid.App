import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'
import type { LeaderboardEntry } from '@/hooks/useLeaderboard'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardRow({ entry, rank, isCurrentUser = false }: LeaderboardRowProps) {
  const medal = MEDAL[rank]

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      {/* Rank */}
      <View style={styles.rankBox}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rankNum, isCurrentUser && styles.rankNumActive]}>
            {rank}
          </Text>
        )}
      </View>

      <Avatar
        uri={entry.avatar_url}
        username={entry.username}
        isPro={entry.is_pro}
        size={38}
      />

      <Text style={[styles.username, isCurrentUser && styles.usernameActive]} numberOfLines={1}>
        {entry.username}
        {isCurrentUser ? ' (vous)' : ''}
      </Text>

      <Text style={[styles.score, isCurrentUser && styles.scoreActive]}>
        {Math.round(entry.hybrid_score).toLocaleString()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  rowHighlight: {
    backgroundColor: Colors.electricDim,
    borderRadius: Radius.md,
  },
  rankBox: {
    width: 28,
    alignItems: 'center',
  },
  medal: {
    fontSize: 20,
  },
  rankNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  rankNumActive: {
    color: Colors.electric,
  },
  username: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  usernameActive: {
    fontWeight: FontWeight.bold,
    color: Colors.electric,
  },
  score: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  scoreActive: {
    color: Colors.electric,
  },
})
