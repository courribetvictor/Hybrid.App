import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PostWithProfile, SportType } from '@/types/database'

export function usePostFeed(userId: string | undefined, followingIds: string[]) {
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const since = new Date()
      since.setDate(since.getDate() - 14)

      const { data: rawPosts } = await (supabase as any)
        .from('posts')
        .select('*, profiles(username, avatar_url, is_pro)')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(60)

      if (!rawPosts) return

      const { data: myLikes } = await (supabase as any)
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)

      const likedSet = new Set(myLikes?.map((l: any) => l.post_id) ?? [])
      const followSet = new Set(followingIds)

      const now = Date.now()
      const scored = rawPosts.map((p: any) => {
        const ageHours = (now - new Date(p.created_at).getTime()) / 3_600_000
        const recency = Math.max(0, 1 - ageHours / 168) // decays over 7 days
        const friendBonus = followSet.has(p.user_id) ? 200 : 0
        const score = friendBonus + p.likes_count * 3 + recency * 80
        return { ...p, liked_by_me: likedSet.has(p.id), score } as PostWithProfile & { score: number }
      })
      scored.sort((a: any, b: any) => b.score - a.score)

      setPosts(scored)
    } finally {
      setLoading(false)
    }
  }, [userId, followingIds.join(',')])

  const createPost = useCallback(
    async (content: string, sportType?: SportType | null) => {
      if (!userId) return
      const { data, error } = await (supabase as any)
        .from('posts')
        .insert({ user_id: userId, content, sport_type: sportType ?? null })
        .select('*, profiles(username, avatar_url, is_pro)')
        .single()
      if (!error && data) {
        const newPost: PostWithProfile = { ...(data as any), liked_by_me: false }
        setPosts(prev => [newPost, ...prev])
      }
    },
    [userId],
  )

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!userId) return
      // Optimistic update
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.likes_count + (p.liked_by_me ? -1 : 1) }
            : p,
        ),
      )
      await (supabase as any).rpc('toggle_post_like', { p_post_id: postId, p_user_id: userId })
    },
    [userId],
  )

  const deletePost = useCallback(
    async (postId: string) => {
      if (!userId) return
      setPosts(prev => prev.filter(p => p.id !== postId))
      await (supabase as any).from('posts').delete().eq('id', postId).eq('user_id', userId)
    },
    [userId],
  )

  useEffect(() => { fetch() }, [fetch])

  return { posts, loading, createPost, toggleLike, deletePost, refetch: fetch }
}
