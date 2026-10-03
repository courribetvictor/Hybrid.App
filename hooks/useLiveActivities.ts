import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LiveActivity, LiveVisibility, SportType } from '@/types/database'

export function useLiveActivities(userId?: string) {
  const [live, setLive] = useState<LiveActivity[]>([])
  const [mine, setMine] = useState<LiveActivity | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) { setLive([]); setMine(null); setLoading(false); return }
    setLoading(true)
    const [{ data: visible }, { data: own }] = await Promise.all([
      supabase
        .from('live_activities')
        .select('*, profile:profiles!user_id(id,username,avatar_url,is_pro,hybrid_score,show_profile,show_activities,show_ranking)')
        .in('status', ['live','paused'])
        .order('started_at', { ascending: false })
        .limit(40),
      supabase
        .from('live_activities')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['live','paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    setLive((visible ?? []) as any)
    setMine((own ?? null) as any)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
    if (!userId) return
    const channel = supabase
      .channel(`hybrid-live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_activities' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_notes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_reactions' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, load])

  const startLive = useCallback(async (input: {
    sport_type: SportType
    visibility: LiveVisibility
    share_location: boolean
    hide_start_end: boolean
    delayed_minutes: number
  }) => {
    if (!userId) throw new Error('Connexion requise')
    const { data, error } = await supabase.from('live_activities').insert({ user_id: userId, ...input, status: 'live' }).select('*').single()
    if (error) throw error
    setMine(data as any)
    return data as LiveActivity
  }, [userId])

  const updateLive = useCallback(async (id: string, patch: Partial<LiveActivity>) => {
    const { data, error } = await supabase.from('live_activities').update({ ...patch, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    setMine(data as any)
    return data as LiveActivity
  }, [])

  const finishLive = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('live_activities').update({ status: 'finished', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    setMine(null)
    await load()
    return data as LiveActivity
  }, [load])

  const addNote = useCallback(async (liveId: string, text: string, atSeconds: number, distanceKm?: number) => {
    if (!userId) throw new Error('Connexion requise')
    const { error } = await supabase.from('live_notes').insert({ live_activity_id: liveId, user_id: userId, text, at_seconds: atSeconds, distance_km: distanceKm ?? null })
    if (error) throw error
  }, [userId])

  const react = useCallback(async (liveId: string, emoji: string) => {
    if (!userId) throw new Error('Connexion requise')
    const { error } = await supabase.from('live_reactions').insert({ live_activity_id: liveId, user_id: userId, emoji })
    if (error) throw error
  }, [userId])

  return { live, mine, loading, refetch: load, startLive, updateLive, finishLive, addNote, react }
}
