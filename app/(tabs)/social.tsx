import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { useFollows, type FollowUser } from '@/hooks/useFollows'
import { useActivities } from '@/hooks/useActivities'
import { useProfile, useSession } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { formatDurationLong } from '@/lib/units'
import type { Profile } from '@/types/database'

const SPORT_EMOJI: Record<string, string> = {
  running: '🏃‍♂️', cycling: '🚵', swimming: '🏊‍♀️',
  gym: '💪', badminton: '🏸', athletics: '🎽',
  football: '⚽', tennis: '🎾', hiking: '🏔️', yoga: '🕉️', boxing: '🥊',
}
const SPORT_LABEL: Record<string, string> = {
  running: 'Course', cycling: 'Vélo', swimming: 'Natation', gym: 'Muscu',
  badminton: 'Badminton', athletics: 'Athlétisme', football: 'Football',
  tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}

type SocialTab = 'feed' | 'following' | 'followers' | 'discover'
const TAB_KEYS: SocialTab[] = ['feed', 'following', 'followers', 'discover']

export default function SocialScreen() {
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const {
    following, followers, followingCount, followersCount,
    isFollowing, toggle, loading, refetch,
  } = useFollows(userId ?? undefined)
  const { activities } = useActivities(userId ?? undefined, 30)

  const [tab, setTab] = useState<SocialTab>('feed')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [followFeed, setFollowFeed] = useState<any[]>([])
  const [feedLoading, setFeedLoading] = useState(false)

  const tabIndexSV = useSharedValue(0)
  const indicatorX = useSharedValue(0)
  const tabBarWidth = useRef(0)

  const switchTab = useCallback((newTab: SocialTab) => {
    const idx = TAB_KEYS.indexOf(newTab)
    tabIndexSV.value = idx
    setTab(newTab)
    if (tabBarWidth.current > 0) {
      indicatorX.value = withSpring(idx * (tabBarWidth.current / 4), { damping: 18, stiffness: 200 })
    }
  }, [indicatorX, tabIndexSV])

  const swipe = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onEnd(e => {
      'worklet'
      const idx = tabIndexSV.value
      if (e.velocityX < -150 && idx < TAB_KEYS.length - 1) {
        runOnJS(switchTab)(TAB_KEYS[idx + 1])
      } else if (e.velocityX > 150 && idx > 0) {
        runOnJS(switchTab)(TAB_KEYS[idx - 1])
      }
    })

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  // Load feed of followed users' activities
  const loadFeed = useCallback(async () => {
    if (following.length === 0) { setFollowFeed([]); return }
    setFeedLoading(true)
    const ids = following.map(f => f.userId)
    const { data } = await supabase
      .from('activities')
      .select('*, profile:profiles!user_id(id, username, avatar_url, is_pro)')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(30)
    setFollowFeed(data ?? [])
    setFeedLoading(false)
  }, [following])

  // Load feed when tab becomes active or following changes
  React.useEffect(() => {
    if (tab === 'feed') loadFeed()
  }, [tab, following.length]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const TAB_LABELS: Record<SocialTab, string> = {
    feed:      '⚡ Feed',
    following: `Abonnements (${followingCount})`,
    followers: `Abonnés (${followersCount})`,
    discover:  '🔍 Découvrir',
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Social" />

      {/* Follow stats bar */}
      <View style={stats.row}>
        <TouchableOpacity style={stats.item} onPress={() => switchTab('following')} activeOpacity={0.75}>
          <Text style={stats.num}>{followingCount}</Text>
          <Text style={stats.lbl}>Abonnements</Text>
        </TouchableOpacity>
        <View style={stats.divider} />
        <TouchableOpacity style={stats.item} onPress={() => switchTab('followers')} activeOpacity={0.75}>
          <Text style={stats.num}>{followersCount}</Text>
          <Text style={stats.lbl}>Abonnés</Text>
        </TouchableOpacity>
        <View style={stats.divider} />
        <TouchableOpacity style={stats.item} onPress={() => switchTab('discover')} activeOpacity={0.75}>
          <Text style={[stats.num, { color: Colors.electric }]}>+</Text>
          <Text style={stats.lbl}>Suivre</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View
        style={tabBar.wrap}
        onLayout={e => {
          tabBarWidth.current = e.nativeEvent.layout.width - 6
          indicatorX.value = TAB_KEYS.indexOf(tab) * (tabBarWidth.current / 4)
        }}
      >
        <Animated.View style={[tabBar.indicator, indicatorStyle, { width: `${100 / 4}%` as any }]} />
        {TAB_KEYS.map(t => (
          <TouchableOpacity
            key={t}
            style={tabBar.tab}
            onPress={() => switchTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[tabBar.label, tab === t && tabBar.labelActive]} numberOfLines={1}>
              {TAB_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable content */}
      <GestureDetector gesture={swipe}>
        <ScrollView
          key={tab}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* ── FEED TAB ── */}
          {tab === 'feed' && (
            <>
              {feedLoading ? (
                <View style={styles.center}><ActivityIndicator color={Colors.electric} /></View>
              ) : following.length === 0 ? (
                <EmptyState
                  emoji="📡"
                  title="Ton feed est vide"
                  sub="Suis des athlètes pour voir leurs séances ici"
                  cta="Découvrir des athlètes →"
                  onCta={() => switchTab('discover')}
                />
              ) : followFeed.length === 0 ? (
                <EmptyState
                  emoji="🏃‍♂️"
                  title="Aucune activité récente"
                  sub="Les athlètes que tu suis n'ont pas encore enregistré de séance ce mois-ci"
                  cta="Découvrir plus d'athlètes →"
                  onCta={() => switchTab('discover')}
                />
              ) : (
                <>
                  {followFeed.map((a, i) => (
                    <FeedCard key={a.id} activity={a} index={i} />
                  ))}
                </>
              )}
            </>
          )}

          {/* ── FOLLOWING TAB ── */}
          {tab === 'following' && (
            <>
              {loading ? (
                <View style={styles.center}><ActivityIndicator color={Colors.electric} /></View>
              ) : following.length === 0 ? (
                <EmptyState
                  emoji="👤"
                  title="Tu ne suis personne"
                  sub="Recherche des athlètes et abonne-toi à eux"
                  cta="Découvrir →"
                  onCta={() => switchTab('discover')}
                />
              ) : (
                <View style={card.box}>
                  <Text style={card.title}>Tu suis ({followingCount})</Text>
                  {following.map(f => (
                    <UserRow
                      key={f.userId}
                      user={f.profile}
                      isFollowing={isFollowing(f.userId)}
                      onToggle={() => toggle(f.userId)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── FOLLOWERS TAB ── */}
          {tab === 'followers' && (
            <>
              {loading ? (
                <View style={styles.center}><ActivityIndicator color={Colors.electric} /></View>
              ) : followers.length === 0 ? (
                <EmptyState
                  emoji="🌱"
                  title="Aucun abonné"
                  sub="Partage ton profil pour que des athlètes te suivent"
                  cta="Découvrir des athlètes →"
                  onCta={() => switchTab('discover')}
                />
              ) : (
                <View style={card.box}>
                  <Text style={card.title}>T'abonnent ({followersCount})</Text>
                  {followers.map(f => (
                    <UserRow
                      key={f.userId}
                      user={f.profile}
                      isFollowing={isFollowing(f.userId)}
                      onToggle={() => toggle(f.userId)}
                      showFollowBack
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── DISCOVER TAB ── */}
          {tab === 'discover' && (
            <>
              {/* Search */}
              <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={handleSearch}
                  placeholder="Chercher un pseudo..."
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchLoading && <ActivityIndicator size="small" color={Colors.electric} style={{ marginRight: 8 }} />}
              </View>

              {search.length >= 2 ? (
                <View style={card.box}>
                  <Text style={card.title}>Résultats</Text>
                  {searchResults.length === 0 && !searchLoading ? (
                    <Text style={card.hint}>Aucun résultat pour « {search} »</Text>
                  ) : searchResults.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isFollowing={isFollowing(user.id)}
                      onToggle={() => toggle(user.id)}
                    />
                  ))}
                </View>
              ) : (
                <>
                  {/* Already following section */}
                  {following.length > 0 && (
                    <View style={card.box}>
                      <Text style={card.title}>Déjà suivi</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ margin: -4 }}
                        contentContainerStyle={{ gap: Spacing.sm, padding: 4 }}>
                        {following.map(f => (
                          <AvatarChip key={f.userId} user={f.profile} isFollowing onToggle={() => toggle(f.userId)} />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={card.box}>
                    <Text style={card.title}>Trouver des athlètes</Text>
                    <Text style={card.hint}>
                      Tape un pseudo ci-dessus pour chercher des athlètes à suivre.
                    </Text>
                    <View style={discover.sports}>
                      {(['🏃‍♂️', '🚵', '💪', '🏊‍♀️', '🥊', '🏔️'] as string[]).map((e, i) => (
                        <View key={i} style={discover.chip}>
                          <Text style={discover.emoji}>{e}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      </GestureDetector>
    </View>
  )
}

// ── Sub-components ────────────────────────────────────────────

function FeedCard({ activity, index }: { activity: any; index: number }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)
  React.useEffect(() => {
    opacity.value   = withDelay(index * 50, withTiming(1,  { duration: 240 }))
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 18, stiffness: 200 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }))

  const sport = activity.sport_type
  const accent = (SportColors as any)[sport] ?? Colors.electric

  return (
    <Animated.View style={[feedCard.wrap, anim]}>
      {/* Banner */}
      <View style={[feedCard.banner, { backgroundColor: accent }]}>
        <Text style={feedCard.bannerEmoji}>{SPORT_EMOJI[sport] ?? '🏃'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={feedCard.bannerSport}>{SPORT_LABEL[sport] ?? sport}</Text>
          <Text style={feedCard.bannerDuration}>{formatDurationLong(activity.duration_seconds)}</Text>
        </View>
        {activity.calories_burned ? (
          <View style={feedCard.calBadge}>
            <Text style={feedCard.calText}>🔥 {activity.calories_burned}</Text>
          </View>
        ) : null}
      </View>

      {/* User row */}
      <View style={feedCard.user}>
        <Avatar
          uri={activity.profile?.avatar_url}
          username={activity.profile?.username ?? '?'}
          isPro={activity.profile?.is_pro}
          size={32}
        />
        <View style={{ flex: 1 }}>
          <Text style={feedCard.username}>{activity.profile?.username}</Text>
          <Text style={feedCard.date}>{timeAgo(activity.created_at)}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

function UserRow({ user, isFollowing, onToggle, showFollowBack }: {
  user: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro' | 'hybrid_score'>
  isFollowing: boolean
  onToggle: () => void
  showFollowBack?: boolean
}) {
  return (
    <View style={userRow.wrap}>
      <Avatar uri={user.avatar_url} username={user.username} isPro={user.is_pro} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={userRow.name}>{user.username}</Text>
        {user.hybrid_score != null && user.hybrid_score > 0 ? (
          <Text style={userRow.score}>⚡ {Math.round(user.hybrid_score)} pts</Text>
        ) : (
          <Text style={userRow.score}>Athlète Hybrid</Text>
        )}
      </View>
      <FollowButton isFollowing={isFollowing} onToggle={onToggle} />
    </View>
  )
}

function AvatarChip({ user, isFollowing, onToggle }: {
  user: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro'>
  isFollowing: boolean
  onToggle: () => void
}) {
  return (
    <TouchableOpacity style={chip.wrap} onPress={onToggle} activeOpacity={0.8}>
      <Avatar uri={user.avatar_url} username={user.username} isPro={user.is_pro} size={48} />
      <Text style={chip.name} numberOfLines={1}>{user.username}</Text>
      <View style={[chip.badge, isFollowing && chip.badgeActive]}>
        <Text style={[chip.badgeText, isFollowing && chip.badgeTextActive]}>
          {isFollowing ? '✓' : '+'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function FollowButton({ isFollowing, onToggle }: { isFollowing: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={[followBtn.wrap, isFollowing && followBtn.wrapFollowing]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text style={[followBtn.text, isFollowing && followBtn.textFollowing]}>
        {isFollowing ? 'Suivi ✓' : '+ Suivre'}
      </Text>
    </TouchableOpacity>
  )
}

function EmptyState({ emoji, title, sub, cta, onCta }: {
  emoji: string; title: string; sub: string; cta: string; onCta: () => void
}) {
  return (
    <View style={empty.wrap}>
      <Text style={empty.emoji}>{emoji}</Text>
      <Text style={empty.title}>{title}</Text>
      <Text style={empty.sub}>{sub}</Text>
      <TouchableOpacity style={empty.btn} onPress={onCta} activeOpacity={0.8}>
        <Text style={empty.btnText}>{cta}</Text>
      </TouchableOpacity>
    </View>
  )
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Hier'
  return `Il y a ${Math.floor(s / 86400)} j`
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  center: { alignItems: 'center', paddingVertical: 40 },
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
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
})

const stats = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  num: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  lbl: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  divider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 8 },
})

const tabBar = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 3, bottom: 3, left: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 10, fontWeight: FontWeight.medium, color: Colors.textTertiary },
  labelActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
})

const card = StyleSheet.create({
  box: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  hint: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic', lineHeight: 18 },
})

const feedCard = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  banner: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  bannerEmoji: { fontSize: 30 },
  bannerSport: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerDuration: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  calBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  calText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  username: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary },
})

const userRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  name: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  score: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
})

const followBtn = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.electric,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  wrapFollowing: {
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  textFollowing: { color: Colors.textSecondary },
})

const chip = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, width: 72 },
  name: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    right: 8,
  },
  badgeActive: { backgroundColor: Colors.success },
  badgeText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#fff' },
  badgeTextActive: {},
})

const empty = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.electricDim,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  btnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.electric },
})

const discover = StyleSheet.create({
  sports: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  chip: {
    width: 52, height: 52, borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  emoji: { fontSize: 24 },
})
