import React from 'react'
import { Pressable, StyleProp, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSensoryFeedback, type SensoryEvent } from '@/hooks/useSensoryFeedback'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function SensoryPressable({ children, onPress, style, disabled=false, event='tap', scale=.965, hitSlop }:{
  children: React.ReactNode
  onPress?:()=>void
  style?:StyleProp<ViewStyle>
  disabled?:boolean
  event?:SensoryEvent | 'none'
  scale?:number
  hitSlop?:number | {top?:number;bottom?:number;left?:number;right?:number}
}) {
  const pressed = useSharedValue(1)
  const { play, prefs } = useSensoryFeedback()
  const anim = useAnimatedStyle(() => ({ transform:[{scale:pressed.value}] }))
  return <AnimatedPressable
    hitSlop={hitSlop as any}
    disabled={disabled}
    onPressIn={()=>{ if(!prefs.reducedMotion) pressed.value=withSpring(scale,{damping:18,stiffness:420,mass:.4}) }}
    onPressOut={()=>{ if(!prefs.reducedMotion) pressed.value=withSpring(1,{damping:15,stiffness:360,mass:.45}) }}
    onPress={()=>{ if(event!=='none') play(event); onPress?.() }}
    style={[style,anim,disabled&&{opacity:.5}]}
  >{children}</AnimatedPressable>
}
