import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { LeaderboardRow } from '@/components/arena/LeaderboardRow'
import { ChallengeCard } from '@/components/arena/ChallengeCard'
import { PaywallModal } from '@/components/arena/PaywallModal'
import { FriendSearch } from '@/components/arena/FriendSearch'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useGlobalLeaderboard, useClubLeaderboard } from '@/hooks/useLeaderboard'
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges'
import { useFriendships } from '@/hooks/useFriendships'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useT } from '@/lib/i18n'

type ArenaTab = 'leaderboard' | 'challenges' | 'friends'

const TABS: { key: ArenaTab; label: string }[] = [
  { key: 'leaderboard', label: 'Classement' },
  { key: 'challenges', label: 'Défis' },
  { key: 'friends', label: 'Amis' },
]

type LeaderboardSub = 'global' | 'clubs'

export default function ArenaScreen() {
  const t = useT()
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const [activeTab, setActiveTab] = useState<ArenaTab>('leaderboard')
  const [leaderboardSub, setLeaderboardSub] = useState<LeaderboardSub>('global')
  const [paywallVisible, setPaywallVisible] = useState(false)

  const { entries, loading: lbLoading, refetch: refetchLb } = useGlobalLeaderboard()
  const { clubs, loading: clubLoading, refetch: refetchClubs } = useClubLeaderboard()
  const { challenges, loading: challengesLoading, refetch: refetchChallenges } = useWeeklyChallenges()
  const { friends, friendIds, refetch: refetchFriends } = useFriendships(userId ?? undefined)

  const refreshing = lbLoading || clubLoading || challengesLoading

  const handleRefresh = useCallback(() => {
    refetchLb(); refetchClubs(); refetchChallenges(); refetchFriends()
  }, [refetchLb, refetchClubs, refetchChallenges, refetchFriends])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.arena.title}</Text>
      </View>

      {/* Top tabs */}
      <TopTabBar active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab
          sub={leaderboardSub}
          onSubChange={setLeaderboardSub}
          entries={entries}
          clubs={clubs}
          currentUserId={userId ?? ''}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'challenges' && (
        <ChallengesTab
          challenges={challenges}
          isPro={profile?.is_pro ?? false}
          onProLock={() => setPaywallVisible(true)}
          refreshing={challengesLoading}
          onRefresh={refetchChallenges}
        />
      )}

      {activeTab === 'friends' && (
        <FriendsTab
          friends={friends}
          friendIds={friendIds}
          currentUserId={userId ?? ''}
          onRequestSent={refetchFriends}
        />
      )}

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  )
}

// ── Top tab bar ───────────────────────────────────────────────

function TopTabBar({
  active,
  onChange,
}: {
  active: ArenaTab
  onChange: (t: ArenaTab) => void
}) {
  return (
    <View style={topTabStyles.bar}>
      {TABS.map(tab => (
        <TopTabPill key={tab.key} label={tab.label} active={active === tab.key} onPress={() => onChange(tab.key)} />
      ))}
    </View>
  )
}

function TopTabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const opacity = useSharedValue(active ? 1 : 0)
  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,85,255,${opacity.value * 0.12})`,
  }))
  React.useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: 180 })
  }, [active, opacity])

  return (
    <TouchableOpacity onPress={onPress} style={topTabStyles.pillWrap} activeOpacity={0.75}>
      <Animated.View style={[topTabStyles.pill, animStyle]}>
        <Text style={[topTabStyles.pillText, active && topTabStyles.pillTextActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Leaderboard tab ───────────────────────────────────────────

function LeaderboardTab({
  sub, onSubChange, entries, clubs, currentUserId, refreshing, onRefresh,
}: any) {
  return (
    <View style={{ flex: 1 }}>
      {/* Sub-toggle: Global / Clubs */}
      <View style={lbStyles.toggle}>
        {(['global', 'clubs'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[lbStyles.toggleBtn, sub === s && lbStyles.toggleActive]}
            onPress={() => onSubChange(s)}
          >
            <Text style={[lbStyles.toggleText, sub === s && lbStyles.toggleTextActive]}>
              {s === 'global' ? '🌍 Mondial' : '🏛 Clubs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={[{ title: '', data: sub === 'global' ? entries : [] }]}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
        renderItem={({ item, index }: any) =>
          sub === 'global' ? (
            <LeaderboardRow
              entry={item}
              rank={index + 1}
              isCurrentUser={item.id === currentUserId}
            />
          ) : null
        }
        ListHeaderComponent={
          sub === 'clubs' ? (
            <View style={lbStyles.clubList}>
              {clubs.map((club: any, i: number) => (
                <ClubRow key={club.id} club={club} rank={i + 1} />
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={() => null}
      />
    </View>
  )
}

function ClubRow({ club, rank }: { club: any; rank: number }) {
  const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <View style={lbStyles.clubRow}>
      <Text style={lbStyles.clubRank}>{MEDAL[rank] ?? rank}</Text>
      <View style={lbStyles.clubInfo}>
        <Text style={lbStyles.clubName}>{club.name}</Text>
        <Text style={lbStyles.clubMembers}>{club.member_count} membres</Text>
      </View>
      <Text style={lbStyles.clubPoints}>{club.total_points.toLocaleString()} pts</Text>
    </View>
  )
}

// ── Challenges tab ────────────────────────────────────────────

function ChallengesTab({ challenges, isPro, onProLock, refreshing, onRefresh }: any) {
  if (challenges.length === 0 && !refreshing) {
    return (
      <View style={emptyStyles.container}>
        <Text style={emptyStyles.emoji}>📅</Text>
        <Text style={emptyStyles.text}>Aucun défi cette semaine</Text>
      </View>
    )
  }

  return (
    <SectionList
      sections={[{ title: '', data: challenges }]}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: any) => (
        <ChallengeCard challenge={item} isPro={isPro} onProLock={onProLock} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
      showsVerticalScrollIndicator={false}
      renderSectionHeader={() => null}
    />
  )
}

// ── Friends tab ───────────────────────────────────────────────

function FriendsTab({ friends, friendIds, currentUserId, onRequestSent }: any) {
  return (
    <SectionList
      sections={[{ title: '', data: friends }]}
      keyExtractor={(item: any) => item.friendId}
      ListHeaderComponent={
        <View style={{ gap: Spacing.md, marginBottom: Spacing.sm }}>
          <FriendSearch
            currentUserId={currentUserId}
            friendIds={friendIds}
            onRequestSent={onRequestSent}
          />
          {friends.length > 0 && (
            <Text style={friendStyles.sectionTitle}>
              {friends.length} ami{friends.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }: any) => <FriendCard friend={item} />}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      ListEmptyComponent={
        <View style={emptyStyles.container}>
          <Text style={emptyStyles.emoji}>👥</Text>
          <Text style={emptyStyles.text}>Recherche des amis ci-dessus</Text>
          <Text style={emptyStyles.sub}>Tape un pseudo pour ajouter quelqu'un</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderSectionHeader={() => null}
    />
  )
}

function FriendCard({ friend }: { friend: any }) {
  const score = friend.profile?.hybrid_score ?? 0
  const scoreColor = score >= 700 ? '#F59E0B' : score >= 400 ? Colors.electric : Colors.textTertiary

  return (
    <View style={friendStyles.card}>
      <Avatar
        uri={friend.profile.avatar_url}
        username={friend.profile.username}
        isPro={friend.profile.is_pro}
        size={46}
      />
      <View style={friendStyles.cardInfo}>
        <View style={friendStyles.cardTop}>
          <Text style={friendStyles.cardName}>{friend.profile.username}</Text>
          {friend.profile.is_pro && (
            <View style={friendStyles.proBadge}>
              <Text style={friendStyles.proText}>⚡ PRO</Text>
            </View>
          )}
        </View>
        <View style={friendStyles.scoreRow}>
          <Text style={[friendStyles.scoreVal, { color: scoreColor }]}>{score}</Text>
          <Text style={friendStyles.scoreLabel}> pts</Text>
          <View style={friendStyles.scoreBarBg}>
            <View style={[friendStyles.scoreBarFill, { width: `${Math.min(score / 10, 100)}%` as any, backgroundColor: scoreColor }]} />
          </View>
        </View>
      </View>
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
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
})

const topTabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pillWrap: { flex: 1 },
  pill: {
    paddingVertical: 9,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  pillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
  },
  pillTextActive: { color: Colors.electric },
})

const lbStyles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: Colors.bgCard },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
  },
  toggleTextActive: { color: Colors.textPrimary },
  clubList: { paddingHorizontal: Spacing.md },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  clubRank: { width: 28, fontSize: 18, textAlign: 'center' },
  clubInfo: { flex: 1 },
  clubName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  clubMembers: { fontSize: FontSize.xs, color: Colors.textTertiary },
  clubPoints: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.electric },
})

const friendStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  cardInfo: { flex: 1, gap: 5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  proBadge: {
    backgroundColor: Colors.electricDim,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  proText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.electric },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreVal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  scoreLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginRight: Spacing.xs },
  scoreBarBg: { flex: 1, height: 4, backgroundColor: Colors.bgAlt, borderRadius: 2, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
})

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emoji: { fontSize: 40 },
  text: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
})
