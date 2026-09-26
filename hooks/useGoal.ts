import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'hybrid_weekly_goal_v2'
const KEY_LEGACY = 'hybrid_weekly_goal_sessions'

export type GoalType = 'sessions' | 'minutes' | 'km'
export interface GoalConfig { type: GoalType; value: number }

export function useWeeklyGoal() {
  const [goal, setGoalState] = useState<GoalConfig | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v !== null) {
        try { setGoalState(JSON.parse(v)) } catch {}
        return
      }
      AsyncStorage.getItem(KEY_LEGACY).then(old => {
        if (old !== null) {
          const migrated: GoalConfig = { type: 'sessions', value: parseInt(old) }
          setGoalState(migrated)
          AsyncStorage.setItem(KEY, JSON.stringify(migrated))
          AsyncStorage.removeItem(KEY_LEGACY)
        }
      })
    })
  }, [])

  const setGoal = useCallback(async (config: GoalConfig) => {
    setGoalState(config)
    await AsyncStorage.setItem(KEY, JSON.stringify(config))
  }, [])

  const clearGoal = useCallback(async () => {
    setGoalState(null)
    await AsyncStorage.removeItem(KEY)
    await AsyncStorage.removeItem(KEY_LEGACY)
  }, [])

  const weeklyGoal = goal?.type === 'sessions' ? goal.value : null

  return { goal, weeklyGoal, setGoal, clearGoal }
}
