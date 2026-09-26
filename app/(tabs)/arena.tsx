import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { LeaderboardRow } from '@/components/arena/LeaderboardRow'
import { ChallengeCard } from '@/components/arena/ChallengeCard'
import { PaywallModal } from '@/components/arena/PaywallModal'
import { FriendSearch } from '@/components/arena/FriendSearch'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { useGlobalLeaderboard, useClubLeaderboard, useWeeklyLeaderboard } from '@/hooks/useLeaderboard'
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges'
import { useFriendships } from '@/hooks/useFriendships'
import { useFollows } from '@/hooks/useFollows'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatDurationLong } from '@/lib/units'
import type { Profile } from '@/types/database'

type ArenaTab = 'leaderboard' | 'challenges' | 'social' | 'friends'

const TABS: { key: ArenaTab; label: string }[] = [
  { key: 'leaderboard', label: 'Classement' },
  { key: 'challenges',  label: 'Défis' },
  { key: 'social',      label: 'Social' },
  { key: 'friends',     label: 'Amis' },
]

const SPORT_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊', gym: '🏋️',
  badminton: '🏸', athletics: '⚡', football: '⚽', tennis: '🎾',
  hiking: '🥾', yoga: '🧘', boxing: '🥊',
}
const SPORT_LABEL: Record<string, string> = {
  running: 'Course', cycling: 'Vélo', swimming: 'Natation', gym: 'Muscu',
  badminton: 'Badminton', athletics: 'Athlétisme', football: 'Football',
  tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}

function socialTimeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Hier'
  return `Il y a ${Math.floor(s / 86400)} j`
}

type LeaderboardSub = 'weekly' | 'global' | 'friends' | 'clubs'

export default function ArenaScreen() {
  const t = useT()
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const [activeTab, setActiveTab] = useState<ArenaTab>('leaderboard')
  const [leaderboardSub, setLeaderboardSub] = useState<LeaderboardSub>('weekly')
  const [paywallVisible, setPaywallVisible] = useState(false)

  const { entries, loading: lbLoading, refetch: refetchLb } = useGlobalLeaderboard()
  const { entries: weeklyEntries, loading: weeklyLoading, refetch: refetchWeekly } = useWeeklyLeaderboard()
  const { clubs, loading: clubLoading, refetch: refetchClubs } = useClubLeaderboard()
  const { challenges, loading: challengesLoading, refetch: refetchChallenges } = useWeeklyChallenges()
  const { friends, friendIds, refetch: refetchFriends } = useFriendships(userId ?? undefined)
  const {
    following, followers, followingCount, followersCount,
    isFollowing, toggle: toggleFollow, loading: followLoading, refetch: refetchFollows,
  } = useFollows(userId ?? undefined)

  const refreshing = lbLoading || weeklyLoading || clubLoading || challengesLoading

  const handleRefresh = useCallback(() => {
    refetchLb(); refetchWeekly(); refetchClubs(); refetchChallenges(); refetchFriends(); refetchFollows()
  }, [refetchLb, refetchWeekly, refetchClubs, refetchChallenges, refetchFriends, refetchFollows])

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
          weeklyEntries={weeklyEntries}
          clubs={clubs}
          following={following}
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

      {activeTab === 'social' && (
        <SocialTab
          userId={userId ?? ''}
          following={following}
          followers={followers}
          followingCount={followingCount}
          followersCount={followersCount}
          isFollowing={isFollowing}
          onToggleFollow={toggleFollow}
          loading={followLoading}
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

const LB_SUBS: { key: LeaderboardSub; label: string }[] = [
  { key: 'weekly',  label: '📅 Hebdo' },
  { key: 'global',  label: '🌍 Mondial' },
  { key: 'friends', label: '👥 Amis' },
  { key: 'clubs',   label: '🏛 Clubs' },
]

function LeaderboardTab({
  sub, onSubChange, entries, weeklyEntries, clubs, following, currentUserId, refreshing, onRefresh,
}: any) {
  const followingSet = new Set<string>((following ?? []).map((f: any) => f.userId))
  const friendEntries = entries.filter((e: any) => followingSet.has(e.id) || e.id === currentUserId)

  const rowData: any[] =
    sub === 'weekly'  ? weeklyEntries :
    sub === 'global'  ? entries :
    sub === 'friends' ? friendEntries :
    []

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-toggle: 4 options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={lbStyles.toggleScroll}
      >
        {LB_SUBS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[lbStyles.toggleBtn, sub === s.key && lbStyles.toggleActive]}
            onPress={() => onSubChange(s.key)}
          >
            <Text style={[lbStyles.toggleText, sub === s.key && lbStyles.toggleTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {sub === 'clubs' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={lbStyles.clubList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
        >
          {clubs.length === 0 ? (
            <LbEmpty emoji="🏛" text="Aucun club pour l'instant" />
          ) : (
            clubs.map((club: any, i: number) => <ClubRow key={club.id} club={club} rank={i + 1} />)
          )}
        </ScrollView>
      ) : (
        <SectionList
          sections={[{ title: '', data: rowData }]}
          keyExtractor={(item: any) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
          renderItem={({ item, index }: any) => (
            <LeaderboardRow
              entry={item}
              rank={index + 1}
              isCurrentUser={item.id === currentUserId}
              weeklySeconds={sub === 'weekly' ? item.weekly_seconds : undefined}
              weeklySessions={sub === 'weekly' ? item.weekly_sessions : undefined}
            />
          )}
          ListEmptyComponent={
            <LbEmpty
              emoji={sub === 'friends' ? '👥' : '🏃'}
              text={sub === 'friends' ? 'Suis des athlètes pour les voir ici' : 'Aucune activité cette semaine'}
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={() => null}
        />
      )}
    </View>
  )
}

function LbEmpty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.emoji}>{emoji}</Text>
      <Text style={emptyStyles.text}>{text}</Text>
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

// ── Social Tab ────────────────────────────────────────────────

type SocialSubTab = 'feed' | 'abonnements' | 'decouvrir'

function SocialTab({
  userId, following, followers, followingCount, followersCount, isFollowing, onToggleFollow, loading,
}: any) {
  const [subTab, setSubTab] = useState<SocialSubTab>('feed')
  const [followFeed, setFollowFeed] = useState<any[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const loadFeed = useCallback(async () => {
    if (!following.length) { setFollowFeed([]); return }
    setFeedLoading(true)
    const ids = following.map((f: any) => f.userId)
    const { data } = await supabase
      .from('activities')
      .select('*, profile:profiles!user_id(id, username, avatar_url, is_pro)')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(30)
    setFollowFeed(data ?? [])
    setFeedLoading(false)
  }, [following])

  React.useEffect(() => {
    if (subTab === 'feed') loadFeed()
  }, [subTab, following.length]) // eslint-disable-line

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_pro, hybrid_score')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', userId ?? '')
      .limit(12)
    setSearchResults((data as Profile[]) ?? [])
    setSearchLoading(false)
  }, [userId])

  const SUB_LABELS: Record<SocialSubTab, string> = {
    feed: `⚡ Feed (${followingCount})`,
    abonnements: `Abonnements`,
    decouvrir: '🔍 Découvrir',
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tab bar */}
      <View style={socialStyles.subBar}>
        {(['feed', 'abonnements', 'decouvrir'] as SocialSubTab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[socialStyles.subTab, subTab === t && socialStyles.subTabActive]}
            onPress={() => setSubTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[socialStyles.subLabel, subTab === t && socialStyles.subLabelActive]}>
              {SUB_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

        {/* FEED */}
        {subTab === 'feed' && (
          feedLoading ? (
            <View style={emptyStyles.container}><ActivityIndicator color={Colors.electric} /></View>
          ) : following.length === 0 ? (
            <SocialEmpty emoji="📡" title="Ton feed est vide" sub="Suis des athlètes pour voir leurs séances" />
          ) : followFeed.length === 0 ? (
            <SocialEmpty emoji="🏃" title="Aucune activité récente" sub="Les athlètes que tu suis n'ont pas encore bougé" />
          ) : (
            followFeed.map((a: any, i: number) => (
              <SocialFeedCard key={a.id} activity={a} index={i} />
            ))
          )
        )}

        {/* ABONNEMENTS */}
        {subTab === 'abonnements' && (
          loading ? (
            <View style={emptyStyles.container}><ActivityIndicator color={Colors.electric} /></View>
          ) : following.length === 0 ? (
            <SocialEmpty emoji="👤" title="Tu ne suis personne" sub="Va dans Découvrir pour trouver des athlètes" />
          ) : (
            <View style={socialStyles.userList}>
              <Text style={socialStyles.sectionTitle}>{followingCount} abonnement{followingCount > 1 ? 's' : ''}</Text>
              {following.map((f: any) => (
                <SocialUserRow
                  key={f.userId}
                  user={f.profile}
                  isFollowing={isFollowing(f.userId)}
                  onToggle={() => onToggleFollow(f.userId)}
                />
              ))}
            </View>
          )
        )}

        {/* DÉCOUVRIR */}
        {subTab === 'decouvrir' && (
          <>
            <View style={socialStyles.searchWrap}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <TextInput
                style={socialStyles.searchInput}
                value={search}
                onChangeText={handleSearch}
                placeholder="Chercher un pseudo..."
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchLoading && <ActivityIndicator size="small" color={Colors.electric} />}
            </View>
            {search.length >= 2 ? (
              searchResults.length === 0 && !searchLoading ? (
                <SocialEmpty emoji="🔍" title={`Aucun résultat pour « ${search} »`} sub="" />
              ) : (
                <View style={socialStyles.userList}>
                  {searchResults.map(user => (
                    <SocialUserRow
                      key={user.id}
                      user={user}
                      isFollowing={isFollowing(user.id)}
                      onToggle={() => onToggleFollow(user.id)}
                    />
                  ))}
                </View>
              )
            ) : (
              <SocialEmpty emoji="🌐" title="Découvre des athlètes" sub="Tape un pseudo pour rechercher" />
            )}
          </>
        )}

      </ScrollView>
    </View>
  )
}

function SocialFeedCard({ activity, index }: { activity: any; index: number }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)
  React.useEffect(() => {
    opacity.value   = withDelay(index * 50, withTiming(1,  { duration: 220 }))
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 18, stiffness: 200 }))
  }, []) // eslint-disable-line
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value, transform: [{ translateY: translateY.value }],
  }))
  const sport = activity.sport_type
  const accent = (SportColors as any)[sport] ?? Colors.electric
  return (
    <Animated.View style={[socialStyles.feedCard, anim]}>
      <View style={[socialStyles.feedBanner, { backgroundColor: accent }]}>
        <Text style={socialStyles.feedEmoji}>{SPORT_EMOJI[sport] ?? '🏃'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={socialStyles.feedSport}>{SPORT_LABEL[sport] ?? sport}</Text>
          <Text style={socialStyles.feedDuration}>{formatDurationLong(activity.duration_seconds)}</Text>
        </View>
        {!!activity.calories_burned && (
          <View style={socialStyles.calBadge}>
            <Text style={socialStyles.calText}>🔥 {activity.calories_burned}</Text>
          </View>
        )}
      </View>
      <View style={socialStyles.feedUser}>
        <Avatar uri={activity.profile?.avatar_url} username={activity.profile?.username ?? '?'} isPro={activity.profile?.is_pro} size={30} />
        <View style={{ flex: 1 }}>
          <Text style={socialStyles.feedUsername}>{activity.profile?.username}</Text>
          <Text style={socialStyles.feedDate}>{socialTimeAgo(activity.created_at)}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

function SocialUserRow({ user, isFollowing, onToggle }: { user: any; isFollowing: boolean; onToggle: () => void }) {
  return (
    <View style={socialStyles.userRow}>
      <Avatar uri={user?.avatar_url} username={user?.username ?? '?'} isPro={user?.is_pro} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={socialStyles.userName}>{user?.username}</Text>
        {(user?.hybrid_score ?? 0) > 0 && (
          <Text style={socialStyles.userScore}>⚡ {Math.round(user.hybrid_score)} pts</Text>
        )}
      </View>
      <TouchableOpacity
        style={[socialStyles.followBtn, isFollowing && socialStyles.followBtnActive]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={[socialStyles.followBtnText, isFollowing && socialStyles.followBtnTextActive]}>
          {isFollowing ? 'Suivi ✓' : '+ Suivre'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function SocialEmpty({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.emoji}>{emoji}</Text>
      <Text style={emptyStyles.text}>{title}</Text>
      {!!sub && <Text style={emptyStyles.sub}>{sub}</Text>}
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
  toggleScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleActive: { backgroundColor: Colors.electricDim, borderColor: Colors.electric },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
  },
  toggleTextActive: { color: Colors.electric, fontWeight: FontWeight.semibold },
  clubList: { paddingHorizontal: Spacing.md, paddingBottom: 32 },
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

const socialStyles = StyleSheet.create({
  subBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: 3,
    gap: 3,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  subTabActive: { backgroundColor: Colors.bgCard },
  subLabel: { fontSize: 10, fontWeight: FontWeight.medium, color: Colors.textTertiary },
  subLabelActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  userList: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  userName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  userScore: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  followBtn: {
    backgroundColor: Colors.electric,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  followBtnTextActive: { color: Colors.textSecondary },
  feedCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  feedBanner: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  feedEmoji: { fontSize: 28 },
  feedSport: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedDuration: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  calBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  calText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  feedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  feedUsername: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  feedDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
})
