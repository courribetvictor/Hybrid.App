import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { User, BarChart3, Dumbbell, Zap, PersonStanding, Flame } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { SPORTS_CONFIG } from '@/constants/sports'
import { useActivities } from '@/hooks/useActivities'
import { useProfile, useSession } from '@/hooks/useProfile'
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
  const { activities, loading } = useActivities(userId ?? undefined, 3650)
  const [sportFilter, setSportFilter] = useState<SportType | 'all'>('all')
  const [period, setPeriod] = useState<30 | 90 | 365 | 3650>(90)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const since = Date.now() - period * 86400000
    return activities.filter(a => {
      const date = new Date(a.performed_at ?? a.created_at).getTime()
      const q = search.trim().toLowerCase()
      const text = `${a.title ?? ''} ${a.notes ?? ''} ${SPORTS_CONFIG[a.sport_type]?.labelLong ?? a.sport_type}`.toLowerCase()
      return date >= since && (sportFilter === 'all' || a.sport_type === sportFilter) && (!q || text.includes(q))
    })
  }, [activities, sportFilter, period, search])

  if (loading) return <View style={act.center}><ActivityIndicator color={Colors.electric} /></View>

  const filters: { key: SportType | 'all'; label: string }[] = [
    { key: 'all', label: 'Tous' },
    ...Array.from(new Set<SportType>(activities.map(a => a.sport_type))).map((key: SportType) => ({ key, label: SPORTS_CONFIG[key]?.label ?? key })),
  ]

  return (
    <FlatList
      data={filtered as any[]}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ActivityRow activity={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={act.list}
      ListHeaderComponent={
        <View style={act.filtersWrap}>
          <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher une séance, un sport, une note..." placeholderTextColor={Colors.textTertiary} style={act.searchInput} />
          <View style={act.periodRow}>
            {([30, 90, 365, 3650] as const).map(p => (
              <TouchableOpacity key={p} style={[act.periodChip, period === p && act.filterActive]} onPress={() => setPeriod(p)}>
                <Text style={[act.filterText, period === p && act.filterTextActive]}>{p === 30 ? '30 j' : p === 90 ? '90 j' : p === 365 ? '1 an' : 'Tout'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            horizontal data={filters} keyExtractor={x => x.key} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 7 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[act.sportChip, sportFilter === item.key && act.filterActive]} onPress={() => setSportFilter(item.key)}>
                <Text style={[act.filterText, sportFilter === item.key && act.filterTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          {!filtered.length && <View style={act.emptyInline}><Text style={act.emptyTitle}>Aucune activité pour ces filtres</Text></View>}
        </View>
      }
    />
  )
}

function ActivityRow({ activity }: { activity: Activity }) {
  const sportConfig = SPORTS_CONFIG[activity.sport_type as SportType] ?? SPORTS_CONFIG.running
  const { color, Icon: SportIcon } = sportConfig
  return (
    <TouchableOpacity style={act.row} activeOpacity={0.8} onPress={() => router.push({ pathname: '/modals/activity/[id]' as any, params: { id: activity.id } })}>
      <View style={[act.iconWrap, { backgroundColor: color + '20' }]}><SportIcon size={22} color={color} strokeWidth={1.8} /></View>
      <View style={act.info}>
        <Text style={act.sport}>{activity.title || sportConfig.labelLong}{activity.is_verified ? '  ✓' : ''}</Text>
        <Text style={act.date}>{timeAgo(activity.performed_at ?? activity.created_at)} · {activity.source === 'manual' ? 'manuel' : activity.source}</Text>
      </View>
      <View style={act.right}>
        <Text style={act.duration}>{formatDurationLong(activity.duration_seconds)}</Text>
        {!!activity.rpe && <Text style={act.rpe}>RPE {activity.rpe}/10</Text>}
      </View>
    </TouchableOpacity>
  )
}

// ── Main screen ────────────────────────────────────────────────

export default function VousScreen() {
  const insets = useSafeAreaInsets()
  const [subTab, setSubTab] = useState<SubTab>('profil')
  const { userId } = useSession()
  const { activities } = useActivities(userId ?? undefined, 365)
  const { profile } = useProfile(userId ?? undefined)
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
          <CoachTab activities={activities as Activity[]} skills={skills} goal={goal} sports={profile?.favorite_sports ?? []} />
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
  filtersWrap: { gap: 10, marginBottom: Spacing.md },
  searchInput: { height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard, paddingHorizontal: 12, color: Colors.textPrimary, fontSize: FontSize.sm },
  periodRow: { flexDirection: 'row', gap: 7 },
  periodChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.borderLight },
  sportChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.borderLight },
  filterActive: { backgroundColor: Colors.electricDim, borderColor: Colors.electric },
  filterText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  filterTextActive: { color: Colors.electric },
  emptyInline: { paddingVertical: 36, alignItems: 'center' },
  rpe: { fontSize: FontSize.xs, color: Colors.textTertiary },
})
