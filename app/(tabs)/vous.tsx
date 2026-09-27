import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { User, BarChart3, Dumbbell, Zap, PersonStanding, Flame } from 'lucide-react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { SPORTS_CONFIG } from '@/constants/sports'
import { useActivities } from '@/hooks/useActivities'
import { useSession } from '@/hooks/useProfile'
import { useSkills } from '@/hooks/useSkills'
import { useWeeklyGoal } from '@/hooks/useGoal'
import { CoachTab } from '@/components/ui/CoachTab'
import { formatDurationLong } from '@/lib/units'
import type { Activity, SportType } from '@/types/database'

// Lazy imports of existing screens (used as embedded components)
import ProfileScreen from './profile'
import StatsScreen from './stats'

type SubTab = 'profil' | 'stats' | 'activites' | 'coach'

const SUB_TABS: { key: SubTab; label: string; Icon: any }[] = [
  { key: 'profil',     label: 'Profil',    Icon: User },
  { key: 'stats',      label: 'Stats',     Icon: BarChart3 },
  { key: 'activites',  label: 'Activités', Icon: Dumbbell },
  { key: 'coach',      label: 'Coach',     Icon: Zap },
]


function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Hier'
  const days = Math.floor(s / 86400)
  if (days < 30) return `Il y a ${days} j`
  const months = Math.floor(days / 30)
  return `Il y a ${months} mois`
}

// ── Sub-tab pill (animated) ───────────────────────────────────

function TabPill({
  label, Icon, active, onPress,
}: { label: string; Icon: any; active: boolean; onPress: () => void }) {
  const bg = useSharedValue(active ? 1 : 0)
  React.useEffect(() => { bg.value = withTiming(active ? 1 : 0, { duration: 160 }) }, [active, bg])
  const anim = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,85,255,${bg.value * 0.10})`,
    borderColor: `rgba(0,85,255,${bg.value * 0.40})`,
  }))

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={pill.wrap}>
      <Animated.View style={[pill.inner, anim]}>
        <Icon size={14} color={active ? Colors.electric : Colors.textTertiary} strokeWidth={active ? 2.5 : 1.8} />
        <Text style={[pill.label, active && pill.labelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Activities tab ─────────────────────────────────────────────

function ActivitiesTab() {
  const { userId } = useSession()
  const { activities, loading } = useActivities(userId ?? undefined, 365)

  if (loading) {
    return (
      <View style={act.center}>
        <ActivityIndicator color={Colors.electric} />
      </View>
    )
  }

  if (!activities.length) {
    return (
      <View style={act.empty}>
        <View style={act.emptyIcon}>
          <PersonStanding size={30} color={Colors.textTertiary} strokeWidth={1.5} />
        </View>
        <Text style={act.emptyTitle}>Aucune activité</Text>
        <Text style={act.emptySub}>Lance ta première séance pour la voir ici</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={activities as any[]}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ActivityRow activity={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={act.list}
    />
  )
}

function ActivityRow({ activity }: { activity: any }) {
  const sportConfig = SPORTS_CONFIG[activity.sport_type as SportType] ?? SPORTS_CONFIG.running
  const { color, Icon: SportIcon } = sportConfig

  return (
    <View style={act.row}>
      <View style={[act.iconWrap, { backgroundColor: color + '20' }]}>
        <SportIcon size={22} color={color} strokeWidth={1.8} />
      </View>
      <View style={act.info}>
        <Text style={act.sport}>{sportConfig.labelLong}</Text>
        <Text style={act.date}>{timeAgo(activity.created_at)}</Text>
      </View>
      <View style={act.right}>
        <Text style={act.duration}>{formatDurationLong(activity.duration_seconds)}</Text>
        {!!activity.calories_burned && (
          <View style={act.calsRow}>
            <Flame size={10} color="#FF6B35" strokeWidth={2} />
            <Text style={act.cals}>{activity.calories_burned} kcal</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ── Main screen ────────────────────────────────────────────────

export default function VousScreen() {
  const insets = useSafeAreaInsets()
  const [subTab, setSubTab] = useState<SubTab>('profil')
  const { userId } = useSession()
  const { activities } = useActivities(userId ?? undefined, 365)
  const skills = useSkills(activities as Activity[])
  const { goal } = useWeeklyGoal()

  return (
    <View style={styles.root}>
      {/* Fixed sub-tab bar (handles safe area top) */}
      <View style={[styles.tabBar, { paddingTop: insets.top + 4 }]}>
        {SUB_TABS.map(t => (
          <TabPill
            key={t.key}
            label={t.label}
            Icon={t.Icon}
            active={subTab === t.key}
            onPress={() => setSubTab(t.key)}
          />
        ))}
      </View>

      {/* Content panels — each fills remaining space */}
      <View style={styles.content}>
        {subTab === 'profil'    && <ProfileScreen embedded />}
        {subTab === 'stats'     && <StatsScreen embedded />}
        {subTab === 'activites' && <ActivitiesTab />}
        {subTab === 'coach'     && (
          <CoachTab activities={activities as Activity[]} skills={skills} goal={goal} />
        )}
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
    backgroundColor: Colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  content: { flex: 1 },
})

const pill = StyleSheet.create({
  wrap: { flex: 1 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
  },
  labelActive: { color: Colors.electric },
})

const act = StyleSheet.create({
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  sport: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary },
  right: { alignItems: 'flex-end', gap: 2 },
  duration: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  calsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  cals: { fontSize: FontSize.xs, color: Colors.textTertiary },
})
