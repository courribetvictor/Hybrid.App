import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import type { LeaderboardEntry } from '@/hooks/useLeaderboard'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
  weeklySeconds?: number
  weeklySessions?: number
}

const PODIUM: Record<number, { bg: string; text: string; border: string; rowBg: string; rowBorder: string }> = {
  1: { bg: '#F59E0B', text: '#fff',    border: '#D97706', rowBg: 'rgba(245,158,11,0.07)', rowBorder: 'rgba(245,158,11,0.28)' },
  2: { bg: '#94A3B8', text: '#fff',    border: '#64748B', rowBg: 'rgba(148,163,184,0.07)', rowBorder: 'rgba(148,163,184,0.28)' },
  3: { bg: '#CD7F32', text: '#fff',    border: '#A0522D', rowBg: 'rgba(205,127,50,0.07)',  rowBorder: 'rgba(205,127,50,0.28)' },
}

function formatWeekly(secs: number, sessions: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const dur = h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
  return `${sessions} séance${sessions > 1 ? 's' : ''} · ${dur}`
}

export function LeaderboardRow({
  entry, rank, isCurrentUser = false, weeklySeconds, weeklySessions,
}: LeaderboardRowProps) {
  const isPodium = rank <= 3
  const podium = isPodium ? PODIUM[rank] : null
  const showWeekly = weeklySeconds !== undefined

  const scoreColor = isPodium
    ? PODIUM[rank].bg
    : isCurrentUser
    ? Colors.electric
    : Colors.textSecondary

  const scoreText = showWeekly
    ? `${Math.floor((weeklySeconds ?? 0) / 60)}min`
    : Math.round(entry.hybrid_score).toLocaleString()

  return (
    <View style={[
      styles.row,
      isPodium  && { backgroundColor: podium!.rowBg, borderColor: podium!.rowBorder, borderWidth: 1 },
      isCurrentUser && !isPodium && styles.rowMe,
    ]}>
      {/* Rank badge */}
      {isPodium ? (
        <View style={[styles.rankBadge, { backgroundColor: podium!.bg, borderColor: podium!.border }]}>
          <Text style={[styles.rankBadgeText, { color: podium!.text }]}>{rank}</Text>
        </View>
      ) : (
        <View style={styles.rankNum}>
          <Text style={[styles.rankNumText, isCurrentUser && { color: Colors.electric }]}>{rank}</Text>
        </View>
      )}

      <Avatar uri={entry.avatar_url} username={entry.username} isPro={entry.is_pro} size={isPodium ? 40 : 36} />

      <View style={styles.nameCol}>
        <View style={styles.nameRow}>
          <Text style={[
            styles.username,
            isPodium     && styles.usernamePodium,
            isCurrentUser && styles.usernameMe,
          ]} numberOfLines={1}>
            {entry.username}
          </Text>
          {isCurrentUser && (
            <View style={styles.meBadge}>
              <Text style={styles.meText}>vous</Text>
            </View>
          )}
        </View>
        {showWeekly && weeklySeconds !== undefined && weeklySessions !== undefined && (
          <Text style={styles.detail}>{formatWeekly(weeklySeconds, weeklySessions)}</Text>
        )}
      </View>

      <Text style={[styles.score, { color: scoreColor }]}>{scoreText}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginVertical: 2,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  rowMe: {
    backgroundColor: Colors.electricDim,
    borderWidth: 1,
    borderColor: Colors.electric + '40',
  },

  // Podium badge (filled circle with rank number)
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexShrink: 0,
    ...Shadow.sm,
  },
  rankBadgeText: {
    fontSize: 13,
    fontWeight: FontWeight.extrabold,
  },

  // Plain rank number
  rankNum: {
    width: 30,
    alignItems: 'center',
    flexShrink: 0,
  },
  rankNumText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },

  // Name column
  nameCol: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  usernamePodium: { fontWeight: FontWeight.bold },
  usernameMe:     { fontWeight: FontWeight.bold, color: Colors.electric },

  // "vous" badge
  meBadge: {
    backgroundColor: Colors.electricDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  meText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.electric,
  },

  detail: { fontSize: FontSize.xs, color: Colors.textTertiary },

  score: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    minWidth: 52,
    textAlign: 'right',
  },
})
