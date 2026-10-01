import React from 'react'
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontWeight, Radius, Shadow } from '@/constants/theme'
import { SensoryPressable } from '@/components/v6/SensoryPressable'
export function Button({label,onPress,variant='primary',size='md',loading=false,disabled=false,style}:{label:string;onPress?:()=>void;variant?:'primary'|'ghost'|'danger';size?:'sm'|'md'|'lg';loading?:boolean;disabled?:boolean;style?:ViewStyle|ViewStyle[]}){
 const fg=variant==='ghost'?Colors.textPrimary:'#fff';const pv=size==='lg'?15:size==='sm'?9:12
 if(variant==='primary')return <SensoryPressable disabled={disabled||loading} onPress={onPress} style={[s.btn,{paddingVertical:pv},style]}><LinearGradient colors={['#315CFF','#6D5CFF']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>{loading?<ActivityIndicator color="#fff"/>:<Text style={[s.txt,{color:'#fff'}]}>{label}</Text>}</SensoryPressable>
 return <SensoryPressable disabled={disabled||loading} onPress={onPress} style={[s.btn,{paddingVertical:pv,backgroundColor:variant==='danger'?Colors.error:'transparent',borderWidth:variant==='ghost'?1:0,borderColor:Colors.border},style]}>{loading?<ActivityIndicator color={fg}/>:<Text style={[s.txt,{color:fg}]}>{label}</Text>}</SensoryPressable>
}
const s=StyleSheet.create({btn:{borderRadius:Radius.md,alignItems:'center',justifyContent:'center',paddingHorizontal:18,overflow:'hidden',...Shadow.sm},txt:{fontWeight:FontWeight.extrabold,fontSize:14,letterSpacing:.1}})
