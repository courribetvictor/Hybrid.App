import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (err?.code === 'PGRST116') {
      await (supabase as any).rpc('ensure_profile')
      const { data: recovered } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(recovered)
    } else if (err) {
      setError(err.message)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
      if (!userId) return
      // Use simple update without select — then refetch for reliable state sync
      const { error: err } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
      if (err) throw new Error(err.message)
      // Optimistic update then refetch for consistency
      setProfile(prev => prev ? { ...prev, ...updates } : prev)
      // Async refetch (don't await — keeps the UI fast)
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data }) => { if (data) setProfile(data) })
    },
    [userId],
  )

  return { profile, loading, error, refetch: fetch, updateProfile }
}

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return { userId, ready }
}
