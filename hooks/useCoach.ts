import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/database'
import type { Skills } from '@/hooks/useSkills'
import type { GoalConfig } from '@/hooks/useGoal'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function buildContext(activities: Activity[], skills: Skills, goal: GoalConfig | null) {
  const recentActs = activities.slice(0, 10)
  const actText = recentActs.length
    ? recentActs.map(a => {
        const dur = Math.round(a.duration_seconds / 60)
        const date = new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        return `• ${a.sport_type} – ${dur} min (${date})`
      }).join('\n')
    : 'Aucune activité enregistrée'

  const skillsText = Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(', ')

  const goalText = goal
    ? `${goal.value} ${goal.type}${goal.sport && goal.sport !== 'all' ? ` de ${goal.sport}` : ''} par semaine`
    : 'Pas d\'objectif défini'

  return { activities: actText, skills: skillsText, goal: goalText }
}

export function useCoach(activities: Activity[], skills: Skills, goal: GoalConfig | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const context = buildContext(activities, skills, goal)
      const { data, error: fnError } = await (supabase as any).functions.invoke('coach', {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        },
      })

      if (fnError || data?.error) {
        setError('Le coach est temporairement indisponible.')
        return
      }

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.content ?? '…',
      }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, activities, skills, goal])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, clearChat }
}
