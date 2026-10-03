import { useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { useAudioPlayer } from 'expo-audio'
import { useSensoryPreferences } from './useSensoryPreferences'

export type SensoryEvent = 'tap' | 'selection' | 'success' | 'reward' | 'levelUp' | 'error'

export function useSensoryFeedback() {
  const { prefs } = useSensoryPreferences()
  const tapPlayer = useAudioPlayer(require('../assets/sounds/tap.wav'))
  const successPlayer = useAudioPlayer(require('../assets/sounds/success.wav'))
  const rewardPlayer = useAudioPlayer(require('../assets/sounds/reward.wav'))
  const levelPlayer = useAudioPlayer(require('../assets/sounds/level-up.wav'))

  const play = useCallback(async (event: SensoryEvent) => {
    if (prefs.haptics) {
      try {
        if (event === 'selection') await Haptics.selectionAsync()
        else if (event === 'tap') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        else if (event === 'success' || event === 'reward') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        else if (event === 'levelUp') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 90)
        } else if (event === 'error') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } catch {}
    }
    if (!prefs.sounds || event === 'selection' || event === 'error') return
    try {
      const player = event === 'tap' ? tapPlayer : event === 'success' ? successPlayer : event === 'levelUp' ? levelPlayer : rewardPlayer
      player.seekTo(0)
      player.play()
    } catch {}
  }, [prefs.haptics, prefs.sounds, tapPlayer, successPlayer, rewardPlayer, levelPlayer])

  return { play, prefs }
}
