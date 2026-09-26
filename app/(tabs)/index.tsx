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
import { ScreenHeader } from '@/components/ui/ScreenHeader'
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
      {/* Quick post button */}
      <TouchableOpacity style={feedStyles.postBar} onPress={handlePostBtn} activeOpacity={0.8}>
        <Avatar uri={profile?.avatar_url} username={profile?.username ?? '?'} size={32} />
        <Text style={feedStyles.postBarHint}>Partager quelque chose…</Text>
        <View style={feedStyles.postBarBtn}>
          <Text style={feedStyles.postBarBtnTxt}>Publier</Text>
        </View>
      </TouchableOpacity>
    </>
  )

  return (
    <View style={styles.safe}>
      <ScreenHeader
        logo
        right={
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Avatar
              uri={profile?.avatar_url}
              username={profile?.username ?? '?'}
              isPro={profile?.is_pro}
              size={34}
            />
          </TouchableOpacity>
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
      {/* Header row */}
      <View style={bannerStyles.top}>
        <Text style={bannerStyles.label}>Cette semaine</Text>
        {streak > 0 && (
          <View style={bannerStyles.streakChip}>
            <Text style={bannerStyles.streakText}>🔥 {streak} j</Text>
          </View>
        )}
      </View>

      {/* Days row */}
      <View style={bannerStyles.days}>
        {weekDates.map((date, i) => {
          const hasActivity = activeDays.has(date)
          const sport = sportsByDay[date]
          const accentColor = sport ? SportColors[sport] : Colors.electric
          const isToday = i === todayIdx
          const isFuture = i > todayIdx

          return (
            <View
              key={i}
              style={[
                bannerStyles.day,
                isToday && { backgroundColor: Colors.electricDim },
                hasActivity && { backgroundColor: accentColor + '22' },
                isToday && hasActivity && { backgroundColor: accentColor + '33' },
              ]}
            >
              <Text style={[
                bannerStyles.dayLabel,
                isToday && { color: Colors.electric, fontWeight: FontWeight.bold },
                isFuture && { color: Colors.borderLight },
                hasActivity && { color: accentColor, fontWeight: FontWeight.bold },
              ]}>
                {DAY_LABELS[i]}
              </Text>
              {hasActivity && (
                <View style={[bannerStyles.dot, { backgroundColor: accentColor }]} />
              )}
              {!hasActivity && isToday && (
                <View style={[bannerStyles.dot, { backgroundColor: Colors.electric + '80' }]} />
              )}
            </View>
          )
        })}
      </View>

      {/* Stats row */}
      {sessions > 0 ? (
        <View style={bannerStyles.statsRow}>
          <Text style={bannerStyles.statChip}>🏅 {sessions} séance{sessions > 1 ? 's' : ''}</Text>
          <Text style={bannerStyles.statChip}>⏱ {durationStr}</Text>
          {totalCal > 0 && (
            <Text style={bannerStyles.statChip}>🔥 {totalCal.toLocaleString('fr-FR')} kcal</Text>
          )}
        </View>
      ) : (
        <Text style={bannerStyles.emptyHint}>Ajoute ta première séance de la semaine !</Text>
      )}

      {/* Goal progress */}
      {goal !== null && goalResult !== null && (
        <View style={bannerStyles.goalWrap}>
          <View style={bannerStyles.goalHeader}>
            <Text style={bannerStyles.goalLabel}>
              {GOAL_TYPE_EMOJI[goal.type]} Objectif {GOAL_TYPE_LABEL[goal.type]}/sem.{goal.sport && goal.sport !== 'all' ? ` · ${SPORT_EMOJI[goal.sport as keyof typeof SPORT_EMOJI] ?? ''}` : ''}
            </Text>
            <Text style={bannerStyles.goalCount}>
              {goalResult.current} / {goal.value} {GOAL_TYPE_LABEL[goal.type]}
              {goalProgress === 1 ? ' 🎉' : ''}
            </Text>
          </View>
          <View style={bannerStyles.goalBar}>
            <View style={[bannerStyles.goalFill, { width: `${(goalProgress ?? 0) * 100}%` as any }]} />
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
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  postBarHint: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  postBarBtn: {
    backgroundColor: Colors.electric,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  postBarBtnTxt: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
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
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  streakChip: {
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#C2410C' },
  days: { flexDirection: 'row', gap: 5 },
  day: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statChip: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    backgroundColor: Colors.bgAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  emptyHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  goalWrap: { gap: 5 },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  goalCount: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.electric },
  goalBar: { height: 6, backgroundColor: Colors.bgAlt, borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: Colors.electric, borderRadius: 3 },
})

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 72, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emoji: { fontSize: 44 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
})
