import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'hybrid_weekly_goal_sessions'

export function useWeeklyGoal() {
  const [weeklyGoal, setGoalState] = useState<number | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v !== null) setGoalState(parseInt(v))
    })
  }, [])

  const setGoal = useCallback(async (n: number) => {
    setGoalState(n)
    await AsyncStorage.setItem(KEY, String(n))
  }, [])

  const clearGoal = useCallback(async () => {
    setGoalState(null)
    await AsyncStorage.removeItem(KEY)
  }, [])

  return { weeklyGoal, setGoal, clearGoal }
}
