import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Club } from '@/types/database'

export type LeaderboardEntry = Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_pro' | 'hybrid_score'>

export interface WeeklyEntry extends LeaderboardEntry {
  weekly_sessions: number
  weekly_seconds: number
}

export function useGlobalLeaderboard(limit = 50) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_pro, hybrid_score')
      .order('hybrid_score', { ascending: false })
      .limit(limit)
    setEntries(data ?? [])
    setLoading(false)
  }, [limit])

  useEffect(() => { fetch() }, [fetch])

  return { entries, loading, refetch: fetch }
}

export function useWeeklyLeaderboard(limit = 50) {
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await (supabase as any).rpc('get_weekly_leaderboard', { limit_n: limit })
    setEntries(data ?? [])
    setLoading(false)
  }, [limit])

  useEffect(() => { fetch() }, [fetch])

  return { entries, loading, refetch: fetch }
}

export type ClubEntry = Pick<Club, 'id' | 'name' | 'total_points'> & {
  member_count: number
}

export function useClubLeaderboard(limit = 30) {
  const [clubs, setClubs] = useState<ClubEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clubs')
      .select('id, name, total_points, club_members(count)')
      .order('total_points', { ascending: false })
      .limit(limit)
    setClubs(
      (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        total_points: c.total_points,
        member_count: c.club_members?.[0]?.count ?? 0,
      })),
    )
    setLoading(false)
  }, [limit])

  useEffect(() => { fetch() }, [fetch])

  return { clubs, loading, refetch: fetch }
}
