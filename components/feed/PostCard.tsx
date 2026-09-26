import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Avatar } from '@/components/ui/Avatar'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SportColors } from '@/constants/theme'
import type { PostWithProfile, SportType } from '@/types/database'

const SPORT_EMOJI: Record<SportType, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊', gym: '🏋️',
  badminton: '🏸', athletics: '⚡', football: '⚽', tennis: '🎾',
  hiking: '🥾', yoga: '🧘', boxing: '🥊',
}
const SPORT_LABEL: Record<SportType, string> = {
  running: 'Course', cycling: 'Vélo', swimming: 'Natation', gym: 'Muscu',
  badminton: 'Badminton', athletics: 'Athlétisme', football: 'Football',
  tennis: 'Tennis', hiking: 'Randonnée', yoga: 'Yoga', boxing: 'Boxe',
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'maintenant'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

interface PostCardProps {
  post: PostWithProfile
  currentUserId?: string
  onLike: (id: string) => void
  onDelete?: (id: string) => void
}

export function PostCard({ post, currentUserId, onLike, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_me)
  const [count, setCount] = useState(post.likes_count)

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !liked
    setLiked(next)
    setCount(c => c + (next ? 1 : -1))
    onLike(post.id)
  }

  const handleLongPress = () => {
    if (post.user_id !== currentUserId || !onDelete) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Alert.alert('Supprimer ce post ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(post.id) },
    ])
  }

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onLongPress={handleLongPress}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={post.profiles?.avatar_url}
          username={post.profiles?.username ?? '?'}
          isPro={post.profiles?.is_pro}
          size={38}
        />
        <View style={styles.meta}>
          <Text style={styles.username}>{post.profiles?.username ?? '…'}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
        {post.sport_type && (
          <View style={[styles.sportBadge, { backgroundColor: SportColors[post.sport_type as SportType] + '20' }]}>
            <Text style={styles.sportEmoji}>{SPORT_EMOJI[post.sport_type as SportType]}</Text>
            <Text style={[styles.sportLabel, { color: SportColors[post.sport_type as SportType] }]}>
              {SPORT_LABEL[post.sport_type as SportType]}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.75}>
          <Text style={[styles.likeIcon, liked && styles.likeIconActive]}>
            {liked ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
            {count > 0 ? count : ''}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {post.user_id === currentUserId ? '· Appui long pour supprimer' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.electric + '40',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  meta: { flex: 1 },
  username: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  time: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sportEmoji: { fontSize: 13 },
  sportLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  content: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
  },
  likeIcon: { fontSize: 16 },
  likeIconActive: {},
  likeCount: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  likeCountActive: { color: Colors.error },
  hint: { fontSize: FontSize.xs, color: Colors.textTertiary, flex: 1 },
})
