import React, { useState, useCallback } from 'react'
import { router } from 'expo-router'
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
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import {
  Trophy, Calendar, Globe, Users, Building2, Search,
  Zap, PersonStanding, UserPlus, Compass, User, Radio, Shield, ChevronRight, BrainCircuit, Sparkles,
} from 'lucide-react-native'
import { LeaderboardRow } from '@/components/arena/LeaderboardRow'
import { ChallengeCard } from '@/components/arena/ChallengeCard'
import { PaywallModal } from '@/components/arena/PaywallModal'
import { FriendSearch } from '@/components/arena/FriendSearch'
import { Avatar } from '@/components/ui/Avatar'
import { GradeBadge } from '@/components/ui/GradeBadge'
import { SensoryPressable } from '@/components/v6/SensoryPressable'
import { SectionReveal } from '@/components/v6/SectionReveal'
import { SPORTS_CONFIG, type LucideIcon } from '@/constants/sports'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useGlobalLeaderboard, useClubLeaderboard, useWeeklyLeaderboard } from '@/hooks/useLeaderboard'
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges'
import { useFriendships } from '@/hooks/useFriendships'
import { useFollows } from '@/hooks/useFollows'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useCurrentSeason } from '@/hooks/useSeason'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatDurationLong } from '@/lib/units'
import type { Profile, SportType } from '@/types/database'

type ArenaTab = 'leaderboard' | 'challenges' | 'social' | 'friends'

const TABS: { key: ArenaTab; label: string }[] = [
  { key: 'leaderboard', label: 'Classement' },
  { key: 'challenges',  label: 'Défis' },
  { key: 'social',      label: 'Social' },
  { key: 'friends',     label: 'Amis' },
]

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
  const currentSeason = useCurrentSeason()
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
  const currentScore = Number((profile as any)?.hybrid_score ?? 0)
  const currentRank = Math.max(0, entries.findIndex((e:any) => (e.profile?.id ?? e.id) === userId)) + 1

  const handleRefresh = useCallback(() => {
    refetchLb(); refetchWeekly(); refetchClubs(); refetchChallenges(); refetchFriends(); refetchFollows()
  }, [refetchLb, refetchWeekly, refetchClubs, refetchChallenges, refetchFriends, refetchFollows])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* ── Arena hero ── */}
      <SectionReveal delay={20}><LinearGradient colors={['#111B3E','#25377F','#7C3AED']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{flex:1}}>
            <Text style={styles.arenaKicker}>SAISON HYBRID</Text>
            <Text style={styles.title}>{t.arena.title}</Text>
            <Text style={styles.headerSub}>{currentSeason ? `${currentSeason.name} · jusqu'au ${new Date(currentSeason.ends_at).toLocaleDateString('fr-FR')}` : 'Classements · Défis · Rivalités'}</Text>
          </View>
          <GradeBadge score={currentScore} compact />
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}><Text style={styles.heroStatLabel}>TON RANG</Text><Text style={styles.heroStatValue}>{currentRank ? `#${currentRank}` : '—'}</Text></View>
          <View style={styles.heroDivider}/><View style={styles.heroStat}><Text style={styles.heroStatLabel}>SCORE</Text><Text style={styles.heroStatValue}>{currentScore}</Text></View>
          <View style={styles.heroDivider}/><View style={styles.heroStat}><Text style={styles.heroStatLabel}>OBJECTIF</Text><Text style={styles.heroStatValue}>TOP 10</Text></View>
        </View>
      </LinearGradient></SectionReveal>

      <SectionReveal delay={90}><View style={styles.v4Strip}>
        <SensoryPressable style={styles.liveArenaCard} onPress={() => router.push('/modals/live' as any)} event="selection">
          <View style={styles.liveArenaIcon}><Radio size={19} color="#FB7185" /></View>
          <View style={{flex:1}}><Text style={styles.liveArenaTitle}>Hybrid Live</Text><Text style={styles.liveArenaSub}>Suivre les athlètes en activité · carte, notes, musique</Text></View>
          <View style={styles.liveNow}><View style={styles.liveNowDot}/><Text style={styles.liveNowText}>LIVE</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <SensoryPressable style={styles.performanceCard} onPress={() => router.push('/modals/sport-rankings' as any)} event="selection">
          <View style={styles.performanceIcon}><Trophy size={18} color="#F59E0B"/></View>
          <View style={{flex:1}}><Text style={styles.performanceTitle}>Records & niveaux officiels</Text><Text style={styles.performanceSub}>10 km · natation · vélo · force · niveaux fédéraux vérifiés</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <SensoryPressable style={styles.performanceCard} onPress={() => router.push('/modals/competition-mode' as any)} event="selection">
          <View style={[styles.performanceIcon,{backgroundColor:'#FEF3C7'}]}><Trophy size={18} color="#D97706"/></View>
          <View style={{flex:1}}><Text style={styles.performanceTitle}>Mode compétition</Text><Text style={styles.performanceSub}>Stratégie, readiness, checklist et lancement du tracking</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <SensoryPressable style={styles.performanceCard} onPress={() => router.push('/modals/intelligence' as any)} event="selection">
          <View style={[styles.performanceIcon,{backgroundColor:'#EDE9FE'}]}><BrainCircuit size={18} color="#7C3AED"/></View>
          <View style={{flex:1}}><Text style={styles.performanceTitle}>Hybrid Intelligence</Text><Text style={styles.performanceSub}>Forme, fatigue, charge, prédictions et recommandations</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <SensoryPressable style={styles.performanceCard} onPress={() => router.push('/modals/timeline' as any)} event="selection">
          <View style={[styles.performanceIcon,{backgroundColor:'#ECFDF5'}]}><Compass size={18} color="#059669"/></View>
          <View style={{flex:1}}><Text style={styles.performanceTitle}>Career Timeline</Text><Text style={styles.performanceSub}>Records et grands moments de ta vie sportive</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <SensoryPressable style={styles.performanceCard} onPress={() => router.push('/modals/recap' as any)} event="selection">
          <View style={[styles.performanceIcon,{backgroundColor:'#FCE7F3'}]}><Sparkles size={18} color="#DB2777"/></View>
          <View style={{flex:1}}><Text style={styles.performanceTitle}>Recap 30 jours</Text><Text style={styles.performanceSub}>Ton mois raconté comme une histoire sportive</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <SensoryPressable style={styles.performanceCard} onPress={() => router.push('/modals/season' as any)} event="selection">
          <View style={[styles.performanceIcon,{backgroundColor:'#F5F3FF'}]}><Zap size={18} color="#7C3AED"/></View>
          <View style={{flex:1}}><Text style={styles.performanceTitle}>Season 08 · WORLD / 01</Text><Text style={styles.performanceSub}>Parcours saisonnier, cosmétiques, événement mondial et progression collective</Text></View>
          <ChevronRight size={16} color={Colors.textTertiary}/>
        </SensoryPressable>
        <View style={styles.leagueCard}>
          <View style={styles.leagueTop}><Shield size={17} color="#7C3AED"/><Text style={styles.leagueTitle}>Ligue de la semaine</Text><Text style={styles.leagueRank}>{currentRank ? `#${currentRank}` : '—'}</Text></View>
          <Text style={styles.leagueSub}>Top 10 = promotion · saison et divisions prêtes pour la V4.</Text>
          <View style={styles.leagueTrack}><LinearGradient colors={['#315CFF','#7C3AED']} style={[styles.leagueFill,{width:`${Math.max(14, Math.min(100, currentScore/10))}%`}]} /></View>
        </View>
      </View></SectionReveal>

      {/* ── Top tabs ── */}
      <TopTabBar active={activeTab} onChange={setActiveTab} />

      {/* ── Content ── */}
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

function TopTabBar({ active, onChange }: { active: ArenaTab; onChange: (t: ArenaTab) => void }) {
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
    <SensoryPressable onPress={onPress} event="selection" style={topTabStyles.pillWrap}>
      <Animated.View style={[topTabStyles.pill, animStyle]}>
        <Text style={[topTabStyles.pillText, active && topTabStyles.pillTextActive]}>{label}</Text>
      </Animated.View>
    </SensoryPressable>
  )
}

// ── Leaderboard tab ───────────────────────────────────────────

const LB_SUBS: { key: LeaderboardSub; label: string; Icon: LucideIcon }[] = [
  { key: 'weekly',  label: 'Hebdo',   Icon: Calendar },
  { key: 'global',  label: 'Mondial', Icon: Globe },
  { key: 'friends', label: 'Amis',    Icon: Users },
  { key: 'clubs',   label: 'Clubs',   Icon: Building2 },
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
      {/* Sub-toggle */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={lbStyles.toggleScroll}
      >
        {LB_SUBS.map(s => {
          const isActive = sub === s.key
          return (
            <TouchableOpacity
              key={s.key}
              style={[lbStyles.toggleBtn, isActive && lbStyles.toggleActive]}
              onPress={() => onSubChange(s.key)}
            >
              <s.Icon size={13} color={isActive ? Colors.electric : Colors.textTertiary} strokeWidth={isActive ? 2.2 : 1.8} />
              <Text style={[lbStyles.toggleText, isActive && lbStyles.toggleTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {sub === 'clubs' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={lbStyles.clubList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
        >
          {clubs.length === 0 ? (
            <EmptyState Icon={Building2} text="Aucun club pour l'instant" />
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
            <EmptyState
              Icon={sub === 'friends' ? Users : PersonStanding}
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

function ClubRow({ club, rank }: { club: any; rank: number }) {
  const isPodium = rank <= 3
  const PODIUM_COLORS: Record<number, string> = { 1: '#F59E0B', 2: '#94A3B8', 3: '#CD7F32' }
  return (
    <View style={lbStyles.clubRow}>
      <View style={[lbStyles.clubRankBadge, isPodium && { backgroundColor: PODIUM_COLORS[rank] }]}>
        <Text style={[lbStyles.clubRankText, isPodium && { color: '#fff' }]}>{rank}</Text>
      </View>
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
    return <EmptyState Icon={Calendar} text="Aucun défi cette semaine" />
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
        <EmptyState Icon={UserPlus} text="Recherche des amis ci-dessus" sub="Tape un pseudo pour ajouter quelqu'un" />
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
              <Zap size={9} color={Colors.electric} strokeWidth={2.5} />
              <Text style={friendStyles.proText}>PRO</Text>
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
      .order('performed_at', { ascending: false })
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

  const SUB_ITEMS: { key: SocialSubTab; label: string }[] = [
    { key: 'feed',        label: `Feed (${followingCount})` },
    { key: 'abonnements', label: 'Abonnements' },
    { key: 'decouvrir',   label: 'Découvrir' },
  ]

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tab bar */}
      <View style={socialStyles.subBar}>
        {SUB_ITEMS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[socialStyles.subTab, subTab === t.key && socialStyles.subTabActive]}
            onPress={() => setSubTab(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[socialStyles.subLabel, subTab === t.key && socialStyles.subLabelActive]}>
              {t.label}
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
            <EmptyState Icon={Zap} title="Ton feed est vide" sub="Suis des athlètes pour voir leurs séances" />
          ) : followFeed.length === 0 ? (
            <EmptyState Icon={PersonStanding} title="Aucune activité récente" sub="Les athlètes que tu suis n'ont pas encore bougé" />
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
            <EmptyState Icon={User} title="Tu ne suis personne" sub="Va dans Découvrir pour trouver des athlètes" />
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
              <Search size={16} color={Colors.textTertiary} strokeWidth={1.8} />
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
                <EmptyState Icon={Search} title={`Aucun résultat pour « ${search} »`} />
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
              <EmptyState Icon={Compass} title="Découvre des athlètes" sub="Tape un pseudo pour rechercher" />
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

  const sport = SPORTS_CONFIG[activity.sport_type as SportType] ?? SPORTS_CONFIG.running
  const { Icon: SportIcon } = sport

  return (
    <Animated.View style={[socialStyles.feedCard, anim]}>
      <LinearGradient
        colors={[sport.color, sport.color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={socialStyles.feedBanner}
      >
        <View style={socialStyles.feedIconCircle}>
          <SportIcon size={20} color="#fff" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={socialStyles.feedSport}>{sport.labelLong.toUpperCase()}</Text>
          <Text style={socialStyles.feedDuration}>{formatDurationLong(activity.duration_seconds)}</Text>
        </View>
        {!!activity.calories_burned && (
          <View style={socialStyles.calBadge}>
            <Text style={socialStyles.calText}>{activity.calories_burned} kcal</Text>
          </View>
        )}
      </LinearGradient>
      <View style={socialStyles.feedUser}>
        <Avatar uri={activity.profile?.avatar_url} username={activity.profile?.username ?? '?'} isPro={activity.profile?.is_pro} size={30} />
        <View style={{ flex: 1 }}>
          <Text style={socialStyles.feedUsername}>{activity.profile?.username}</Text>
          <Text style={socialStyles.feedDate}>{socialTimeAgo(activity.performed_at ?? activity.created_at)}</Text>
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
          <View style={socialStyles.scoreRow}>
            <Zap size={10} color={Colors.textTertiary} strokeWidth={2} />
            <Text style={socialStyles.userScore}>{Math.round(user.hybrid_score)} pts</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[socialStyles.followBtn, isFollowing && socialStyles.followBtnActive]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={[socialStyles.followBtnText, isFollowing && socialStyles.followBtnTextActive]}>
          {isFollowing ? 'Suivi' : '+ Suivre'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Shared empty state ────────────────────────────────────────

function EmptyState({ Icon, title, text, sub }: {
  Icon: LucideIcon
  title?: string
  text?: string
  sub?: string
}) {
  const label = title ?? text ?? ''
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Icon size={30} color={Colors.textTertiary} strokeWidth={1.5} />
      </View>
      <Text style={emptyStyles.text}>{label}</Text>
      {!!sub && <Text style={emptyStyles.sub}>{sub}</Text>}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  v4Strip:{paddingHorizontal:Spacing.md,paddingTop:10,gap:8},
  liveArenaCard:{backgroundColor:'#fff',borderRadius:18,padding:12,flexDirection:'row',alignItems:'center',gap:10,...Shadow.sm},
  liveArenaIcon:{width:40,height:40,borderRadius:13,backgroundColor:'#FFF1F2',alignItems:'center',justifyContent:'center'},
  liveArenaTitle:{fontSize:12.5,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},
  liveArenaSub:{fontSize:9.5,color:Colors.textTertiary,marginTop:2},
  liveNow:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#FFF1F2',borderRadius:99,paddingHorizontal:7,paddingVertical:5},
  liveNowDot:{width:6,height:6,borderRadius:3,backgroundColor:'#FB7185'},
  liveNowText:{fontSize:8,color:'#E11D48',fontWeight:FontWeight.extrabold,letterSpacing:.7},
  performanceCard:{backgroundColor:'#fff',borderRadius:18,padding:12,flexDirection:'row',alignItems:'center',gap:10,...Shadow.sm},
  performanceIcon:{width:40,height:40,borderRadius:13,backgroundColor:'#FFF7E7',alignItems:'center',justifyContent:'center'},
  performanceTitle:{fontSize:11.5,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},
  performanceSub:{fontSize:9.5,color:Colors.textSecondary,marginTop:2,lineHeight:13},
  leagueCard:{backgroundColor:'#F7F5FF',borderWidth:1,borderColor:'#E9E3FF',borderRadius:18,padding:12},
  leagueTop:{flexDirection:'row',alignItems:'center',gap:7},leagueTitle:{fontSize:11.5,fontWeight:FontWeight.extrabold,color:'#4C1D95',flex:1},leagueRank:{fontSize:14,fontWeight:FontWeight.extrabold,color:'#7C3AED'},
  leagueSub:{fontSize:9.5,color:'#6D5A86',marginTop:5},leagueTrack:{height:6,backgroundColor:'#E9E3FF',borderRadius:99,overflow:'hidden',marginTop:9},leagueFill:{height:'100%',borderRadius:99},
  header: { marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: 12, padding: Spacing.md, borderRadius: Radius.xl, ...Shadow.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  arenaKicker: { fontSize: 9, color: 'rgba(255,255,255,.62)', fontWeight: FontWeight.extrabold, letterSpacing: 1.8 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.7, marginTop: 2 },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,.68)', fontWeight: FontWeight.medium, marginTop: 2 },
  trophyBadge: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  heroStats: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,.09)', borderRadius:14, paddingVertical:9, marginTop:14, borderWidth:1, borderColor:'rgba(255,255,255,.10)' },
  heroStat:{ flex:1, alignItems:'center' }, heroStatLabel:{ fontSize:7,color:'rgba(255,255,255,.55)',fontWeight:FontWeight.extrabold,letterSpacing:1.2 }, heroStatValue:{ fontSize:15,color:'#fff',fontWeight:FontWeight.extrabold,marginTop:2 }, heroDivider:{ width:1,height:26,backgroundColor:'rgba(255,255,255,.13)' },
  listContent: { padding: Spacing.md, paddingBottom: 40 },
})

const topTabStyles = StyleSheet.create({
  bar: { flexDirection: 'row', marginHorizontal: Spacing.md, gap: 4, marginBottom: Spacing.sm, backgroundColor:'#E8EEF7', padding:4, borderRadius:Radius.lg },
  pillWrap: { flex: 1 },
  pill: { paddingVertical: 9, borderRadius: Radius.md, alignItems: 'center' },
  pillText: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
  pillTextActive: { color: Colors.electric, fontWeight: FontWeight.extrabold },
})

const lbStyles = StyleSheet.create({
  toggleScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: Radius.full,
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
  clubRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgAlt,
  },
  clubRankText: { fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textTertiary },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
})

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
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
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  userScore: { fontSize: FontSize.xs, color: Colors.textTertiary },
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

  // Feed card
  feedCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  feedBanner: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  feedIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    flexShrink: 0,
  },
  feedSport: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  feedDuration: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.3 },
  calBadge: {
    backgroundColor: 'rgba(0,0,0,0.22)',
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
