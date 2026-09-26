import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface FriendWithProfile {
  friendId: string
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro' | 'hybrid_score'>
}

export function useFriendships(userId: string | undefined) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data } = await supabase
      .from('friendships')
      .select('friend_id, profile:profiles!friend_id(id, username, avatar_url, is_pro, hybrid_score)')
      .eq('user_id', userId)
      .eq('status', 'accepted')

    setFriends(
      (data ?? []).map((row: any) => ({
        friendId: row.friend_id,
        profile: row.profile,
      })),
    )
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const friendIds = friends.map(f => f.friendId)

  return { friends, friendIds, loading, refetch: fetch }
}
