import React, { useCallback } from 'react'
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
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useFriendFeed } from '@/hooks/useActivities'
import { useFriendships } from '@/hooks/useFriendships'
import { useProfile, useSession } from '@/hooks/useProfile'
import type { ActivityWithProfile } from '@/types/database'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ActivityWithProfile>)

export default function FeedScreen() {
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const { friendIds } = useFriendships(userId ?? undefined)
  const { feed, loading, refetch } = useFriendFeed(friendIds)

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

  const handleFab = useCallback(() => {
    fabScale.value = withSpring(0.88, { damping: 8, stiffness: 500 }, () => {
      fabScale.value = withSpring(1, { damping: 10, stiffness: 300 })
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/modals/add-activity')
  }, [fabScale])

  const renderItem = useCallback(
    ({ item }: { item: ActivityWithProfile }) => <ActivityCard activity={item} />,
    [],
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
        data={feed as ActivityWithProfile[]}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListHeaderComponent={<WeekSummaryBanner />}
        ListEmptyComponent={loading ? null : <EmptyFeed />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.electric} />
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
    </View>
  )
}

function WeekSummaryBanner() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const today = (dayOfWeek + 6) % 7

  return (
    <View style={bannerStyles.card}>
      <View style={bannerStyles.top}>
        <Text style={bannerStyles.label}>Cette semaine</Text>
        <Text style={bannerStyles.date}>
          {monday.getDate()}/{monday.getMonth() + 1} – {now.getDate()}/{now.getMonth() + 1}
        </Text>
      </View>
      <View style={bannerStyles.days}>
        {days.map((d, i) => (
          <View key={i} style={[bannerStyles.day, i === today && bannerStyles.dayToday, i < today && bannerStyles.dayPast]}>
            <Text style={[bannerStyles.dayLabel, i === today && bannerStyles.dayLabelActive]}>{d}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function EmptyFeed() {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.emoji}>⚡</Text>
      <Text style={emptyStyles.title}>Aucune activité dans le feed</Text>
      <Text style={emptyStyles.sub}>Ajoute des amis dans l'Arène pour voir leurs séances ici.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  list: { padding: Spacing.md, paddingBottom: 100 },
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
  fabIcon: {
    fontSize: 30,
    color: '#fff',
    lineHeight: 34,
    fontWeight: '300',
  },
})

const bannerStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary },
  days: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPast: { backgroundColor: Colors.electricDim },
  dayToday: { backgroundColor: Colors.electric },
  dayLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
  dayLabelActive: { color: '#fff' },
})

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 72, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emoji: { fontSize: 44 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
})
