import React,{useEffect}from'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated,{useAnimatedStyle,useSharedValue,withRepeat,withSequence,withTiming}from'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Shield, Sparkles } from 'lucide-react-native'
import { getHybridRank, getRankDivision } from '@/constants/ranks'
import { FontWeight } from '@/constants/theme'
import {useSensoryPreferences}from'@/hooks/useSensoryPreferences'
export function GradeBadge({ score, compact=false }: { score:number; compact?:boolean }) {
  const rank=getHybridRank(score),division=getRankDivision(score),size=compact?38:62
  const glow=useSharedValue(.16);const{prefs}=useSensoryPreferences();useEffect(()=>{if(!prefs.reducedMotion)glow.value=withRepeat(withSequence(withTiming(.42,{duration:1200}),withTiming(.16,{duration:1200})),-1,true)},[prefs.reducedMotion]);const a=useAnimatedStyle(()=>({shadowOpacity:glow.value}))
  return <Animated.View style={[s.wrap,{shadowColor:rank.color},a]}><LinearGradient colors={[rank.color2,rank.color]} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.badge,{width:size,height:size,borderRadius:compact?12:19}]}><View style={[s.inner,{borderRadius:compact?10:16}]}><Shield size={compact?18:28} color="#fff" strokeWidth={2.2}/>{!compact&&<Sparkles size={11} color="#fff" style={s.spark}/>}<Text style={[s.letter,{fontSize:compact?8:10}]}>{rank.short}</Text></View></LinearGradient>{!compact&&<Text style={[s.name,{color:rank.color}]}>{division.label.toUpperCase()}</Text>}</Animated.View>
}
const s=StyleSheet.create({wrap:{alignItems:'center',shadowOffset:{width:0,height:6},shadowRadius:15,elevation:8},badge:{padding:3},inner:{flex:1,borderWidth:1,borderColor:'rgba(255,255,255,.5)',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(8,15,38,.10)'},spark:{position:'absolute',right:8,top:7},letter:{position:'absolute',bottom:5,color:'#fff',fontWeight:FontWeight.extrabold,letterSpacing:1},name:{fontSize:10,fontWeight:FontWeight.extrabold,letterSpacing:1.4,marginTop:5}})
