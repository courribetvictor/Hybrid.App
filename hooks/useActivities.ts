import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity, ActivityWithProfile, SportType } from '@/types/database'

type Period = 7 | 30 | 90 | 365 | 'all'

function periodStart(period: Period): string | null {
  if (period === 'all') return null
  const d = new Date()
  d.setDate(d.getDate() - period)
  return d.toISOString()
}

export function useActivities(
  userId: string | undefined,
  period: Period = 30,
  sport?: SportType,
) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const start = periodStart(period)
    if (start) query = query.gte('created_at', start)
    if (sport) query = query.eq('sport_type', sport)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setActivities(data ?? [])
    setLoading(false)
  }, [userId, period, sport])

  useEffect(() => { fetch() }, [fetch])

  const addActivity = useCallback(
    async (activity: Omit<Activity, 'id' | 'user_id' | 'created_at'>) => {
      if (!userId) return
      const { error: err } = await supabase
        .from('activities')
        .insert({ ...activity, user_id: userId })
      if (err) throw new Error(err.message)
      await fetch()
    },
    [userId, fetch],
  )

  // ── Derived stats ──────────────────────────────────────────

  const sportBreakdown = useMemo(() => {
    const counts: Partial<Record<SportType, number>> = {}
    for (const a of activities) {
      counts[a.sport_type] = (counts[a.sport_type] ?? 0) + 1
    }
    return counts
  }, [activities])

  const totalCalories = useMemo(
    () => activities.reduce((sum, a) => sum + (a.calories_burned ?? 0), 0),
    [activities],
  )

  const totalDurationSeconds = useMemo(
    () => activities.reduce((sum, a) => sum + a.duration_seconds, 0),
    [activities],
  )

  // Heatmap: count activities per day (ISO date string → count)
  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of activities) {
      const day = a.created_at.split('T')[0]
      map[day] = (map[day] ?? 0) + 1
    }
    return map
  }, [activities])

  return {
    activities,
    loading,
    error,
    refetch: fetch,
    addActivity,
    sportBreakdown,
    totalCalories,
    totalDurationSeconds,
    heatmapData,
  }
}

// Separate hook for friend feed (with profile join)
export function useFriendFeed(friendIds: string[]) {
  const [feed, setFeed] = useState<ActivityWithProfile[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (friendIds.length === 0) return
    setLoading(true)

    const { data } = await supabase
      .from('activities')
      .select('*, profile:profiles(id, username, avatar_url, is_pro)')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(50)

    setFeed((data as ActivityWithProfile[]) ?? [])
    setLoading(false)
  }, [friendIds])

  useEffect(() => { fetch() }, [fetch])

  return { feed, loading, refetch: fetch }
}
