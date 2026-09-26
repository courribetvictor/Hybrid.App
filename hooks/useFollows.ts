import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export interface FollowUser {
  userId: string
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro' | 'hybrid_score'>
}

export function useFollows(userId: string | undefined) {
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [followingRes, followersRes] = await Promise.all([
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId),
      supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId),
    ])

    const followingIds = (followingRes.data ?? []).map((r: any) => r.following_id as string)
    const followerIds  = (followersRes.data ?? []).map((r: any) => r.follower_id  as string)

    const [followingProfiles, followerProfiles] = await Promise.all([
      followingIds.length > 0
        ? supabase.from('profiles').select('id, username, avatar_url, is_pro, hybrid_score').in('id', followingIds)
        : Promise.resolve({ data: [] }),
      followerIds.length > 0
        ? supabase.from('profiles').select('id, username, avatar_url, is_pro, hybrid_score').in('id', followerIds)
        : Promise.resolve({ data: [] }),
    ])

    const followingList: FollowUser[] = (followingProfiles.data ?? []).map((p: any) => ({ userId: p.id, profile: p }))
    const followerList:  FollowUser[] = (followerProfiles.data ?? []).map((p: any) => ({ userId: p.id, profile: p }))

    setFollowing(followingList)
    setFollowers(followerList)
    setFollowingSet(new Set(followingIds))
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const follow = useCallback(async (targetId: string) => {
    if (!userId || userId === targetId) return
    setFollowingSet(prev => new Set(prev).add(targetId))
    await supabase.from('follows').insert({ follower_id: userId, following_id: targetId })
    fetch()
  }, [userId, fetch])

  const unfollow = useCallback(async (targetId: string) => {
    if (!userId) return
    setFollowingSet(prev => { const s = new Set(prev); s.delete(targetId); return s })
    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', targetId)
    fetch()
  }, [userId, fetch])

  const isFollowing = useCallback((targetId: string) => followingSet.has(targetId), [followingSet])

  const toggle = useCallback(async (targetId: string) => {
    if (followingSet.has(targetId)) {
      await unfollow(targetId)
    } else {
      await follow(targetId)
    }
  }, [followingSet, follow, unfollow])

  return {
    following,
    followers,
    followingCount: following.length,
    followersCount: followers.length,
    isFollowing,
    follow,
    unfollow,
    toggle,
    loading,
    refetch: fetch,
  }
}
