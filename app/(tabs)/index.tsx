import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { ScreenHeader, HeaderIconBtn } from '@/components/ui/ScreenHeader'
import { Avatar } from '@/components/ui/Avatar'
import { ActivityCard } from '@/components/feed/ActivityCard'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePostModal } from '@/components/feed/CreatePostModal'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import { useFriendFeed, useActivities } from '@/hooks/useActivities'
import { useFriendships } from '@/hooks/useFriendships'
import { useFollows } from '@/hooks/useFollows'
import { useProfile, useSession } from '@/hooks/useProfile'
import { useWeeklyGoal } from '@/hooks/useGoal'
import { usePostFeed } from '@/hooks/usePosts'
import type { GoalConfig } from '@/hooks/useGoal'
import type { Activity, ActivityWithProfile, PostWithProfile, SportType } from '@/types/database'

type FeedItem =
  | { kind: 'post';     data: PostWithProfile;     id: string }
  | { kind: 'activity'; data: ActivityWithProfile; id: string }

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<FeedItem>)

// ── Streak helper ─────────────────────────────────────────────

function computeStreak(activities: Activity[]): number {
  if (!activities.length) return 0
  const days = new Set(activities.map(a => a.created_at.split('T')[0]))
  const today = new Date()

  for (let offset = 0; offset <= 1; offset++) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) {
      let streak = 0
      const cur = new Date(d)
      while (days.has(cur.toISOString().split('T')[0])) {
        streak++
        cur.setDate(cur.getDate() - 1)
      }
      return streak
    }
  }
  return 0
}

// ── Screen ────────────────────────────────────────────────────

export default function FeedScreen() {
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const { friendIds } = useFriendships(userId ?? undefined)
  const { following } = useFollows(userId ?? undefined)
  const followingIds = useMemo(() => following.map(f => f.userId), [following])
  const { feed: activityFeed, loading: actLoading, refetch: refetchActs } = useFriendFeed(friendIds)
  const { activities: ownActivities, refetch: refetchOwn } = useActivities(userId ?? undefined, 7)
  const { goal } = useWeeklyGoal()
  const { posts, loading: postLoading, createPost, toggleLike, deletePost, refetch: refetchPosts } =
    usePostFeed(userId ?? undefined, followingIds)

  const [postModalVisible, setPostModalVisible] = useState(false)
  const scrollY = useSharedValue(0)
  const fabScale = useSharedValue(1)

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y
  })

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [0, 60], [1, 0.88], Extrapolation.CLAMP) },
      { scale: fabScale.value },
    ],
  }))

  // Merge posts + activities into ranked feed
  const mergedFeed = useMemo((): FeedItem[] => {
    const followSet = new Set(followingIds)
    const now = Date.now()

    const postItems: FeedItem[] = posts.map(p => {
      const ageH = (now - new Date(p.created_at).getTime()) / 3_600_000
      const score = (followSet.has(p.user_id) ? 200 : 0) + p.likes_count * 3 + Math.max(0, 1 - ageH / 168) * 80
      return { kind: 'post', data: p, id: `post_${p.id}`, score } as any
    })

    const actItems: FeedItem[] = (activityFeed as ActivityWithProfile[]).map(a => {
      const ageH = (now - new Date(a.created_at).getTime()) / 3_600_000
      const score = (followSet.has(a.user_id) ? 200 : 0) + Math.max(0, 1 - ageH / 168) * 60
      return { kind: 'activity', data: a, id: `act_${a.id}`, score } as any
    })

    const merged = [...postItems, ...actItems]
    merged.sort((a: any, b: any) => b.score - a.score)
    return merged
  }, [posts, activityFeed, followingIds])

  const handleFab = useCallback(() => {
    fabScale.value = withSpring(0.88, { damping: 8, stiffness: 500 }, () => {
      fabScale.value = withSpring(1, { damping: 10, stiffness: 300 })
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/modals/add-activity')
  }, [fabScale])

  const handlePostBtn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setPostModalVisible(true)
  }, [])

  const handleRefresh = useCallback(() => {
    refetchActs()
    refetchOwn()
    refetchPosts()
  }, [refetchActs, refetchOwn, refetchPosts])

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.kind === 'post') {
        return (
          <PostCard
            post={item.data as PostWithProfile}
            currentUserId={userId ?? undefined}
            onLike={toggleLike}
            onDelete={deletePost}
          />
        )
      }
      return <ActivityCard activity={item.data as ActivityWithProfile} />
    },
    [userId, toggleLike, deletePost],
  )

  const loading = actLoading || postLoading

  const header = (
    <>
      <WeekSummaryBanner activities={ownActivities} goal={goal} />
      {/* Post bar — compact, minimal */}
      <TouchableOpacity style={feedStyles.postBar} onPress={handlePostBtn} activeOpacity={0.85}>
        <Avatar uri={profile?.avatar_url} username={profile?.username ?? '?'} size={28} />
        <Text style={feedStyles.postBarHint}>Quoi de neuf ?</Text>
        <Text style={feedStyles.postBarIcon}>✏️</Text>
      </TouchableOpacity>
    </>
  )

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Feed"
        right={
          <>
            <HeaderIconBtn icon="🔍" onPress={() => {}} />
            <HeaderIconBtn icon="🔔" badge />
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
              style={{ marginLeft: 2 }}
            >
              <Avatar
                uri={profile?.avatar_url}
                username={profile?.username ?? '?'}
                isPro={profile?.is_pro}
                size={34}
              />
            </TouchableOpacity>
          </>
        }
      />

      <AnimatedFlatList
        data={mergedFeed}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? null : <EmptyFeed />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={Colors.electric} />
        }
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[styles.fab, fabStyle]}>
        <TouchableOpacity style={styles.fabInner} onPress={handleFab} activeOpacity={0.9}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      <CreatePostModal
        visible={postModalVisible}
        onClose={() => setPostModalVisible(false)}
        onSubmit={createPost}
      />
    </View>
  )
}

// ── Week summary banner ───────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const SPORT_EMOJI: Partial<Record<SportType, string>> = {
  running: '🏃', cycling: '🚴', swimming: '🏊', gym: '🏋️',
  badminton: '🏸', athletics: '⚡', football: '⚽', tennis: '🎾',
  hiking: '🥾', yoga: '🧘', boxing: '🥊',
}

const GOAL_TYPE_LABEL: Record<string, string> = {
  sessions: 'séances', minutes: 'min', km: 'km',
}
const GOAL_TYPE_EMOJI: Record<string, string> = {
  sessions: '🏅', minutes: '⏱', km: '📍',
}

function computeGoalProgress(goal: GoalConfig, activities: Activity[]): { current: number; progress: number } {
  const filtered = goal.sport && goal.sport !== 'all'
    ? activities.filter(a => a.sport_type === goal.sport)
    : activities
  switch (goal.type) {
    case 'sessions': {
      const current = filtered.length
      return { current, progress: Math.min(current / goal.value, 1) }
    }
    case 'minutes': {
      const current = Math.round(filtered.reduce((s, a) => s + a.duration_seconds, 0) / 60)
      return { current, progress: Math.min(current / goal.value, 1) }
    }
    case 'km': {
      const current = parseFloat(filtered.reduce((s, a) => {
        const m = (a as any).metrics
        return s + (m?.distance_m ? m.distance_m / 1000 : 0)
      }, 0).toFixed(1))
      return { current, progress: Math.min(current / goal.value, 1) }
    }
  }
}

function WeekSummaryBanner({
  activities,
  goal,
}: {
  activities: Activity[]
  goal: GoalConfig | null
}) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const todayIdx = (dayOfWeek + 6) % 7

  const monday = new Date(now)
  monday.setDate(now.getDate() - todayIdx)

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monday.toISOString().split('T')[0]],
  )

  const activeDays = useMemo(
    () => new Set(activities.map(a => a.created_at.split('T')[0])),
    [activities],
  )

  const sportsByDay = useMemo(() => {
    const map: Record<string, SportType> = {}
    for (const a of activities) {
      const day = a.created_at.split('T')[0]
      if (!map[day]) map[day] = a.sport_type
    }
    return map
  }, [activities])

  const sessions = activities.length
  const totalSecs = activities.reduce((s, a) => s + a.duration_seconds, 0)
  const totalCal = activities.reduce((s, a) => s + (a.calories_burned ?? 0), 0)
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const durationStr = hours > 0 ? `${hours}h${mins > 0 ? String(mins).padStart(2, '0') : ''}` : `${mins}min`

  const streak = useMemo(() => computeStreak(activities), [activities])

  const goalResult = goal ? computeGoalProgress(goal, activities) : null
  const goalProgress = goalResult?.progress ?? null

  return (
    <View style={bannerStyles.card}>
      {/* Top row: title + streak + stats chips */}
      <View style={bannerStyles.top}>
        <Text style={bannerStyles.label}>Cette semaine</Text>
        <View style={bannerStyles.topRight}>
          {sessions > 0 && (
            <Text style={bannerStyles.statInline}>
              {sessions} séance{sessions > 1 ? 's' : ''} · {durationStr}
            </Text>
          )}
          {streak > 0 && (
            <View style={bannerStyles.streakChip}>
              <Text style={bannerStyles.streakText}>🔥 {streak}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Days strip — compact */}
      <View style={bannerStyles.days}>
        {weekDates.map((date, i) => {
          const hasActivity = activeDays.has(date)
          const sport = sportsByDay[date]
          const accentColor = sport ? SportColors[sport] : Colors.electric
          const isToday = i === todayIdx
          const isFuture = i > todayIdx
          return (
            <View key={i} style={bannerStyles.dayWrap}>
              <Text style={[
                bannerStyles.dayLabel,
                isToday && { color: Colors.electric, fontWeight: FontWeight.bold },
                isFuture && { opacity: 0.3 },
              ]}>
                {DAY_LABELS[i]}
              </Text>
              <View style={[
                bannerStyles.daydot,
                hasActivity && { backgroundColor: accentColor },
                isToday && !hasActivity && { borderWidth: 1.5, borderColor: Colors.electric },
              ]} />
            </View>
          )
        })}
      </View>

      {/* Goal bar */}
      {goal !== null && goalResult !== null && (
        <View style={bannerStyles.goalRow}>
          <Text style={bannerStyles.goalLabel}>
            {GOAL_TYPE_EMOJI[goal.type]} {goalResult.current}/{goal.value} {GOAL_TYPE_LABEL[goal.type]}
            {goalProgress === 1 ? ' 🎉' : ''}
          </Text>
          <View style={bannerStyles.goalBarOuter}>
            <View style={[bannerStyles.goalBarFill, { width: `${(goalProgress ?? 0) * 100}%` as any }]} />
          </View>
        </View>
      )}
    </View>
  )
}

// ── Empty feed ────────────────────────────────────────────────

function EmptyFeed() {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.emoji}>⚡</Text>
      <Text style={emptyStyles.title}>Aucune activité dans le feed</Text>
      <Text style={emptyStyles.sub}>Ajoute des amis dans l'Arène pour voir leurs séances ici.</Text>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────

const feedStyles = StyleSheet.create({
  postBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  postBarHint: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  postBarIcon: { fontSize: 15, opacity: 0.5 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  list: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  fab: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  fabIcon: { fontSize: 30, color: '#fff', lineHeight: 34, fontWeight: '300' },
})

const bannerStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.xs,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statInline: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  streakChip: {
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#C2410C' },
  days: { flexDirection: 'row', gap: 4 },
  dayWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
  },
  daydot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgAlt,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    minWidth: 90,
  },
  goalBarOuter: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.bgAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBarFill: { height: '100%', backgroundColor: Colors.electric, borderRadius: 3 },
})

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 72, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emoji: { fontSize: 44 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
})
