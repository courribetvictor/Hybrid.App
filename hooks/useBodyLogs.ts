import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { BodyLog } from '@/types/database'

type Period = 7 | 30 | 90 | 365

function periodToDate(days: Period): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function useBodyLogs(userId: string | undefined, period: Period = 30) {
  const [logs, setLogs] = useState<BodyLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('body_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_date', periodToDate(period))
      .order('logged_date', { ascending: true })

    if (err) setError(err.message)
    else setLogs(data ?? [])
    setLoading(false)
  }, [userId, period])

  useEffect(() => { fetch() }, [fetch])

  const addLog = useCallback(
    async (log: Omit<BodyLog, 'id' | 'user_id' | 'created_at'>) => {
      if (!userId) return
      const { error: err } = await supabase
        .from('body_logs')
        .upsert({ ...log, user_id: userId }, { onConflict: 'user_id,logged_date' })
      if (err) throw new Error(err.message)
      await fetch()
    },
    [userId, fetch],
  )

  // Derived: calorie balance per day (burned - consumed)
  const calorieBalances = logs
    .filter(l => l.calories_consumed !== null)
    .map(l => ({
      date: l.logged_date,
      consumed: l.calories_consumed ?? 0,
    }))

  return { logs, loading, error, refetch: fetch, addLog, calorieBalances }
}
