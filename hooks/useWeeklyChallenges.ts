import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { WeeklyChallenge } from '@/types/database'

export function useWeeklyChallenges() {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('weekly_challenges')
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('is_pro_only', { ascending: true }) // free challenges first
    setChallenges(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { challenges, loading, refetch: fetch }
}

export function daysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}
