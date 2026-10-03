import React from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSensoryPreferences } from '@/hooks/useSensoryPreferences'

export function SectionReveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const {prefs}=useSensoryPreferences()
  return <Animated.View entering={prefs.reducedMotion?undefined:FadeInDown.delay(delay).duration(420).springify().damping(18)}>{children}</Animated.View>
}
