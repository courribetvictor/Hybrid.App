import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

export function LiveRouteMap({ progress = .56 }: { progress?: number }) {
  return (
    <View style={s.wrap}>
      <Svg width="100%" height="100%" viewBox="0 0 360 250">
        <Defs><LinearGradient id="route" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#22D3EE"/><Stop offset="1" stopColor="#4B7BFF"/></LinearGradient></Defs>
        <Path d="M0 48 C62 24 90 76 145 56 S225 6 360 38" stroke="#E6EDF7" strokeWidth="18" fill="none" opacity=".9" />
        <Path d="M-10 212 C72 178 105 225 170 195 S265 132 375 165" stroke="#E8EEF6" strokeWidth="15" fill="none" opacity=".9" />
        <Path d="M82 -5 C93 54 57 96 91 143 S172 188 150 258" stroke="#EDF2F7" strokeWidth="12" fill="none" opacity=".95" />
        <Path d="M302 -10 C278 55 309 100 268 139 S213 211 236 260" stroke="#E5ECF4" strokeWidth="10" fill="none" opacity=".9" />
        <Path d="M45 214 C72 170 52 124 105 112 S184 129 206 92 S269 58 319 84" stroke="#C9D5E6" strokeWidth="7" fill="none" strokeLinecap="round" />
        <Path d="M45 214 C72 170 52 124 105 112 S184 129 206 92 S269 58 319 84" stroke="url(#route)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(70, progress*500)} 500`} />
        <Circle cx="45" cy="214" r="8" fill="#10B981" stroke="#fff" strokeWidth="3" />
        <Circle cx="206" cy="92" r="11" fill="#4B7BFF" stroke="#fff" strokeWidth="4" />
        <Circle cx="319" cy="84" r="7" fill="#fff" stroke="#4B7BFF" strokeWidth="3" />
      </Svg>
    </View>
  )
}
const s=StyleSheet.create({wrap:{flex:1,backgroundColor:'#F4F7FB'}})
