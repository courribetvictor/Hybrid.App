import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { useFriendships } from '@/hooks/useFriendships'
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

export default function SocialScreen() {
  const { userId } = useSession()
  const { profile } = useProfile(userId ?? undefined)
  const { friends, loading: friendsLoading, refetch } = useFriendships(userId ?? undefined)
  const { activities } = useActivities(userId ?? undefined, 30)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'activity' | 'friends' | 'discover'>('activity')

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_pro, hybrid_score')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', userId ?? '')
      .limit(10)
    setSearchResults((data as Profile[]) ?? [])
    setSearchLoading(false)
  }, [userId])

  const sendRequest = useCallback(async (targetId: string) => {
    if (!userId) return
    await supabase.from('friendships').upsert({
      user_id: userId,
      friend_id: targetId,
      status: 'pending',
    }, { onConflict: 'user_id,friend_id' })
    setSentRequests(prev => new Set(prev).add(targetId))
  }, [userId])

  const friendIds = new Set(friends.map(f => f.friendId))

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Social" />

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {(['activity', 'friends', 'discover'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabChip, activeTab === t && styles.tabChipActive]}
            onPress={() => setActiveTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabChipText, activeTab === t && styles.tabChipTextActive]}>
              {t === 'activity' ? '⚡ Activité' : t === 'friends' ? `👥 Amis (${friends.length})` : '🔍 Découvrir'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <>
            {/* My recent activity for context */}
            {activities.length > 0 ? (
              <View style={card.box}>
                <Text style={card.title}>Mes dernières séances</Text>
                {activities.slice(0, 5).map((a, i) => (
                  <ActivityRow key={a.id} activity={a} index={i} />
                ))}
              </View>
            ) : null}

            {/* Friend activity */}
            {friends.length === 0 ? (
              <EmptyState
                emoji="👥"
                title="Aucun ami pour l'instant"
                sub="Ajoute des amis pour voir leur activité ici"
                cta="Découvrir des athlètes →"
                onCta={() => setActiveTab('discover')}
              />
            ) : (
              <View style={card.box}>
                <Text style={card.title}>Activité de tes amis</Text>
                <Text style={card.hint}>Bientôt disponible — abonne-toi à tes amis d'abord</Text>
                {friends.slice(0, 4).map(f => (
                  <FriendActivityPlaceholder key={f.friendId} friend={f} />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── FRIENDS TAB ── */}
        {activeTab === 'friends' && (
          <>
            {friendsLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.electric} />
              </View>
            ) : friends.length === 0 ? (
              <EmptyState
                emoji="🤝"
                title="Aucun ami encore"
                sub="Recherche des athlètes par pseudo et envoie une demande d'amitié"
                cta="Trouver des amis →"
                onCta={() => setActiveTab('discover')}
              />
            ) : (
              <View style={card.box}>
                <Text style={card.title}>Mes amis</Text>
                {friends.map(f => (
                  <FriendRow key={f.friendId} friend={f} />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── DISCOVER TAB ── */}
        {activeTab === 'discover' && (
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

            {search.length >= 2 && (
              <View style={card.box}>
                <Text style={card.title}>Résultats</Text>
                {searchResults.length === 0 && !searchLoading ? (
                  <Text style={card.hint}>Aucun résultat pour « {search} »</Text>
                ) : searchResults.map(user => (
                  <SearchResultRow
                    key={user.id}
                    user={user}
                    isFriend={friendIds.has(user.id)}
                    sent={sentRequests.has(user.id)}
                    onAdd={() => sendRequest(user.id)}
                  />
                ))}
              </View>
            )}

            {/* Suggested / leaderboard preview */}
            {search.length < 2 && (
              <View style={card.box}>
                <Text style={card.title}>Suggestions</Text>
                <Text style={card.hint}>
                  Recherche un pseudo ci-dessus pour trouver des athlètes à suivre.{'\n'}
                  Le classement des meilleurs athlètes arrive bientôt.
                </Text>
                <View style={suggest.row}>
                  {['🏃‍♂️', '🚵', '💪', '🏊‍♀️'].map((emoji, i) => (
                    <View key={i} style={suggest.chip}>
                      <Text style={suggest.emoji}>{emoji}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Stats about the community */}
            <View style={card.box}>
              <Text style={card.title}>La communauté Hybrid</Text>
              <View style={community.row}>
                <CommunityCard emoji="🏅" value="∞" label="Athlètes" />
                <CommunityCard emoji="⚡" value="11" label="Sports" />
                <CommunityCard emoji="🌍" value="FR" label="Pays" />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ── Sub-components ────────────────────────────────────────────

function ActivityRow({ activity, index }: { activity: any; index: number }) {
  const opacity = useSharedValue(0)
  React.useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 200 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={[actRow.wrap, anim]}>
      <Text style={actRow.emoji}>{SPORT_EMOJI[activity.sport_type] ?? '🏃'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={actRow.sport}>{SPORT_LABEL[activity.sport_type] ?? activity.sport_type}</Text>
        <Text style={actRow.meta}>{formatDurationLong(activity.duration_seconds)}</Text>
      </View>
      <Text style={actRow.date}>{timeAgo(activity.created_at)}</Text>
    </Animated.View>
  )
}

function FriendRow({ friend }: { friend: any }) {
  return (
    <View style={friendRow.wrap}>
      <Avatar uri={friend.profile.avatar_url} username={friend.profile.username} isPro={friend.profile.is_pro} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={friendRow.name}>{friend.profile.username}</Text>
        {friend.profile.hybrid_score != null && (
          <Text style={friendRow.score}>⚡ {friend.profile.hybrid_score} pts</Text>
        )}
      </View>
    </View>
  )
}

function FriendActivityPlaceholder({ friend }: { friend: any }) {
  return (
    <View style={[friendRow.wrap, { opacity: 0.6 }]}>
      <Avatar uri={friend.profile.avatar_url} username={friend.profile.username} isPro={friend.profile.is_pro} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={friendRow.name}>{friend.profile.username}</Text>
        <Text style={friendRow.score}>Activités récentes bientôt ici</Text>
      </View>
    </View>
  )
}

function SearchResultRow({ user, isFriend, sent, onAdd }: {
  user: Profile; isFriend: boolean; sent: boolean; onAdd: () => void
}) {
  return (
    <View style={friendRow.wrap}>
      <Avatar uri={user.avatar_url} username={user.username} isPro={user.is_pro} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={friendRow.name}>{user.username}</Text>
        {user.hybrid_score != null && (
          <Text style={friendRow.score}>⚡ {user.hybrid_score} pts</Text>
        )}
      </View>
      {isFriend ? (
        <View style={addBtn.done}>
          <Text style={addBtn.doneText}>Ami ✓</Text>
        </View>
      ) : sent ? (
        <View style={addBtn.sent}>
          <Text style={addBtn.sentText}>Envoyé</Text>
        </View>
      ) : (
        <TouchableOpacity style={addBtn.btn} onPress={onAdd} activeOpacity={0.8}>
          <Text style={addBtn.text}>+ Ajouter</Text>
        </TouchableOpacity>
      )}
    </View>
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

function CommunityCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={community.card}>
      <Text style={community.emoji}>{emoji}</Text>
      <Text style={community.value}>{value}</Text>
      <Text style={community.label}>{label}</Text>
    </View>
  )
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Hier'
  return `${Math.floor(s / 86400)} j`
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.electric,
    borderColor: Colors.electric,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  tabChipTextActive: { color: '#fff' },
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
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
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

const actRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  emoji: { fontSize: 22, width: 32, textAlign: 'center' },
  sport: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textTertiary },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary },
})

const friendRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  name: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  score: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
})

const addBtn = StyleSheet.create({
  btn: {
    backgroundColor: Colors.electric,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  done: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.success },
  sent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sentText: { fontSize: FontSize.xs, color: Colors.textSecondary },
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

const suggest = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  chip: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: { fontSize: 24 },
})

const community = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  emoji: { fontSize: 20 },
  value: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textTertiary },
})
