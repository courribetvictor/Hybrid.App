import React from 'react'
import{TouchableOpacity,type TouchableOpacityProps}from'react-native'
import*as Haptics from'expo-haptics'
export function SensoryButton({onPress,...props}:TouchableOpacityProps){return <TouchableOpacity {...props} onPress={e=>{Haptics.selectionAsync().catch(()=>{});onPress?.(e)}}/>}
