import React from 'react'
import Animated,{FadeInDown}from'react-native-reanimated'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Crown, Medal } from 'lucide-react-native'
import { Avatar } from '@/components/ui/Avatar'
import { GradeBadge } from '@/components/ui/GradeBadge'
import { Colors, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import {useSensoryPreferences}from'@/hooks/useSensoryPreferences'

const podium = [
  { bg:['#FFF5C2','#F6C453'], color:'#A76C00' },
  { bg:['#F3F6FA','#CBD5E1'], color:'#64748B' },
  { bg:['#F8E2D5','#D98955'], color:'#9A4E24' },
] as const

export function LeaderboardRow({entry,rank,isCurrentUser,weeklySeconds,weeklySessions}:{entry:any;rank:number;isCurrentUser?:boolean;weeklySeconds?:number;weeklySessions?:number}){
  const{prefs}=useSensoryPreferences()
  const p=entry.profile||entry
  const score=Number(entry.score??entry.hybrid_score??p.hybrid_score??0)
  const top=rank<=3?podium[rank-1]:null
  return <Animated.View entering={prefs.reducedMotion?undefined:FadeInDown.delay(Math.min(rank,12)*28).duration(320)} style={[s.wrap,isCurrentUser&&s.meWrap]}>
    {isCurrentUser && <View style={s.youTag}><Text style={s.youText}>TOI</Text></View>}
    <View style={s.row}>
      {top ? <LinearGradient colors={[...top.bg]} style={s.rankTop}>{rank===1?<Crown size={17} color={top.color}/>:<Medal size={17} color={top.color}/>}<Text style={[s.rankTopText,{color:top.color}]}>{rank}</Text></LinearGradient> : <View style={s.rank}><Text style={s.rankText}>{rank}</Text></View>}
      <Avatar uri={p.avatar_url} username={p.username||p.name||'?'} size={42}/>
      <View style={s.info}><Text numberOfLines={1} style={s.name}>{p.username||p.name||'Athlète'}</Text><Text style={s.meta}>{weeklySessions!=null?`${weeklySessions} séances cette semaine`:'Athlète Hybrid'}</Text></View>
      <GradeBadge score={score} compact/>
      <View style={s.scoreWrap}><Text style={s.score}>{score}</Text><Text style={s.scoreLabel}>PTS</Text></View>
    </View>
  </Animated.View>
}
const s=StyleSheet.create({wrap:{backgroundColor:Colors.bgCard,borderRadius:Radius.lg,marginBottom:9,borderWidth:1,borderColor:Colors.borderLight,...Shadow.sm,position:'relative'},meWrap:{borderColor:Colors.electric,backgroundColor:'#F8FAFF'},youTag:{position:'absolute',right:10,top:-6,zIndex:2,backgroundColor:Colors.electric,borderRadius:99,paddingHorizontal:7,paddingVertical:2},youText:{fontSize:8,color:'#fff',fontWeight:FontWeight.extrabold,letterSpacing:1},row:{minHeight:66,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:11},rank:{width:32,height:32,borderRadius:10,backgroundColor:Colors.bgAlt,alignItems:'center',justifyContent:'center'},rankText:{color:Colors.textTertiary,fontWeight:FontWeight.extrabold,fontSize:12},rankTop:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},rankTopText:{position:'absolute',bottom:2,right:4,fontSize:8,fontWeight:FontWeight.extrabold},info:{flex:1},name:{color:Colors.textPrimary,fontWeight:FontWeight.bold,fontSize:14},meta:{fontSize:10,color:Colors.textTertiary,marginTop:2},scoreWrap:{alignItems:'flex-end',minWidth:40},score:{color:Colors.textPrimary,fontWeight:FontWeight.extrabold,fontSize:16},scoreLabel:{fontSize:7,color:Colors.textTertiary,fontWeight:FontWeight.bold,letterSpacing:1}})
