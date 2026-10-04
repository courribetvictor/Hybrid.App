import { useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { useAudioPlayer } from 'expo-audio'
import { useSensoryPreferences } from './useSensoryPreferences'

export type SensoryEvent = 'tap' | 'selection' | 'success' | 'reward' | 'levelUp' | 'coin' | 'unlock' | 'chest' | 'boost' | 'world' | 'companion' | 'story' | 'error'

export function useSensoryFeedback() {
  const { prefs } = useSensoryPreferences()
  const tapPlayer = useAudioPlayer(require('../assets/sounds/tap.wav'))
  const successPlayer = useAudioPlayer(require('../assets/sounds/success.wav'))
  const rewardPlayer = useAudioPlayer(require('../assets/sounds/reward.wav'))
  const levelPlayer = useAudioPlayer(require('../assets/sounds/level-up.wav'))
  const coinPlayer = useAudioPlayer(require('../assets/sounds/coin.wav'))
  const unlockPlayer = useAudioPlayer(require('../assets/sounds/unlock.wav'))
  const chestPlayer = useAudioPlayer(require('../assets/sounds/chest.wav'))
  const boostPlayer = useAudioPlayer(require('../assets/sounds/boost.wav'))
  const worldPlayer = useAudioPlayer(require('../assets/sounds/world.wav'))
  const companionPlayer = useAudioPlayer(require('../assets/sounds/companion.wav'))
  const storyPlayer = useAudioPlayer(require('../assets/sounds/story.wav'))

  const play = useCallback(async (event: SensoryEvent) => {
    if (prefs.haptics) {
      try {
        if (event === 'selection') await Haptics.selectionAsync()
        else if (event === 'tap' || event === 'coin') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        else if (event === 'success' || event === 'reward' || event === 'unlock' || event === 'world' || event === 'companion' || event === 'story') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        else if (event === 'boost') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        else if (event === 'chest' || event === 'levelUp') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 90)
        } else if (event === 'error') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } catch {}
    }
    if (!prefs.sounds || event === 'selection' || event === 'error') return
    try {
      const player = event === 'tap' ? tapPlayer
        : event === 'success' ? successPlayer
        : event === 'levelUp' ? levelPlayer
        : event === 'coin' ? coinPlayer
        : event === 'unlock' ? unlockPlayer
        : event === 'chest' ? chestPlayer
        : event === 'boost' ? boostPlayer
        : event === 'world' ? worldPlayer
        : event === 'companion' ? companionPlayer
        : event === 'story' ? storyPlayer
        : rewardPlayer
      player.seekTo(0)
      player.play()
    } catch {}
  }, [prefs.haptics, prefs.sounds, tapPlayer, successPlayer, rewardPlayer, levelPlayer, coinPlayer, unlockPlayer, chestPlayer, boostPlayer, worldPlayer, companionPlayer, storyPlayer])

  return { play, prefs }
}
