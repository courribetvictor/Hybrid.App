import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Heart } from 'lucide-react-native'
import { Avatar } from '@/components/ui/Avatar'
import { SPORTS_CONFIG } from '@/constants/sports'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import type { PostWithProfile, SportType } from '@/types/database'

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
  const heartScale = useSharedValue(1)

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }))

  const handleLike = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 5, stiffness: 600 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !liked
    setLiked(next)
    setCount(c => c + (next ? 1 : -1))
    onLike(post.id)
  }, [liked, onLike, post.id, heartScale])

  const handleLongPress = () => {
    if (post.user_id !== currentUserId || !onDelete) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Alert.alert('Supprimer ce post ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(post.id) },
    ])
  }

  const sportConfig = post.sport_type ? SPORTS_CONFIG[post.sport_type as SportType] : null
  const SportIcon = sportConfig?.Icon

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
        {sportConfig && SportIcon && (
          <View style={[styles.sportBadge, { backgroundColor: sportConfig.color + '1A' }]}>
            <SportIcon size={12} color={sportConfig.color} strokeWidth={2} />
            <Text style={[styles.sportLabel, { color: sportConfig.color }]}>
              {SPORT_LABEL[post.sport_type as SportType]}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Media */}
      {post.media_url ? (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.75}>
          <Animated.View style={likeAnimStyle}>
            <Heart
              size={16}
              color={liked ? '#EF4444' : Colors.textTertiary}
              fill={liked ? '#EF4444' : 'none'}
              strokeWidth={2}
            />
          </Animated.View>
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
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
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
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgAlt,
  },
  likeCount: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  likeCountActive: { color: Colors.error },
  hint: { fontSize: FontSize.xs, color: Colors.textTertiary, flex: 1 },
  media: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAlt,
  },
})
