import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'
import type { LeaderboardEntry } from '@/hooks/useLeaderboard'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
  weeklySeconds?: number
  weeklySessions?: number
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardRow({
  entry, rank, isCurrentUser = false, weeklySeconds, weeklySessions,
}: LeaderboardRowProps) {
  const medal = MEDAL[rank]
  const showWeekly = weeklySeconds !== undefined

  const weeklyLabel = showWeekly
    ? (() => {
        const h = Math.floor((weeklySeconds ?? 0) / 3600)
        const m = Math.floor(((weeklySeconds ?? 0) % 3600) / 60)
        const dur = h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
        return `${weeklySessions} séance${(weeklySessions ?? 0) > 1 ? 's' : ''} · ${dur}`
      })()
    : null

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <View style={styles.rankBox}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rankNum, isCurrentUser && styles.rankNumActive]}>{rank}</Text>
        )}
      </View>

      <Avatar uri={entry.avatar_url} username={entry.username} isPro={entry.is_pro} size={38} />

      <View style={styles.nameCol}>
        <Text style={[styles.username, isCurrentUser && styles.usernameActive]} numberOfLines={1}>
          {entry.username}{isCurrentUser ? ' (vous)' : ''}
        </Text>
        {weeklyLabel ? (
          <Text style={styles.weeklyLabel}>{weeklyLabel}</Text>
        ) : null}
      </View>

      <Text style={[styles.score, isCurrentUser && styles.scoreActive]}>
        {showWeekly
          ? `${Math.floor((weeklySeconds ?? 0) / 60)}min`
          : Math.round(entry.hybrid_score).toLocaleString()}
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
  nameCol: { flex: 1, gap: 2 },
  username: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  weeklyLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
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
