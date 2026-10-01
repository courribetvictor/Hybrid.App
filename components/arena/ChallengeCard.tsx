import React from 'react'
import { View,Text,StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Lock, Zap, Trophy, Target } from 'lucide-react-native'
import { Colors,Radius,Spacing,FontWeight,Shadow } from '@/constants/theme'
import {SensoryPressable}from'@/components/v6/SensoryPressable'

const palettes=[['#315CFF','#6D5DFB'],['#F97316','#EF4444'],['#0EA5E9','#14B8A6'],['#7C3AED','#EC4899']] as const
export function ChallengeCard({challenge,isPro,onProLock}:{challenge:any;isPro?:boolean;onProLock?:()=>void}){
  const locked=challenge?.is_pro&&!isPro
  const idx=Math.abs(String(challenge?.id??challenge?.title??'x').split('').reduce((a,c)=>a+c.charCodeAt(0),0))%palettes.length
  const colors=palettes[idx]
  const progress=Math.max(0,Math.min(1,Number(challenge?.progress??0)))
  return <SensoryPressable disabled={!locked} onPress={locked?onProLock:undefined} event={locked?'selection':'none'} style={s.shell}>
    <LinearGradient colors={[colors[0]+'18', '#FFFFFF']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.card}>
      <View style={s.top}><LinearGradient colors={[...colors]} style={s.icon}><Target size={19} color="#fff" strokeWidth={2.3}/></LinearGradient><View style={s.info}><Text style={s.kicker}>{locked?'DÉFI PRO':'DÉFI HEBDO'}</Text><Text style={s.title}>{challenge?.title||challenge?.name||'Défi Hybrid'}</Text></View>{locked?<Lock size={17} color={colors[0]}/>:<Trophy size={18} color={colors[0]}/>}</View>
      <Text style={s.sub}>{challenge?.description||'Relève le défi et gagne des points pour ta saison.'}</Text>
      <View style={s.progressRow}><View style={s.track}><LinearGradient colors={[...colors]} style={[s.fill,{width:`${Math.max(8,progress*100)}%` as any}]}/></View><Text style={[s.percent,{color:colors[0]}]}>{Math.round(progress*100)}%</Text></View>
      <View style={s.bottom}><View style={[s.reward,{backgroundColor:colors[0]+'12'}]}><Zap size={12} color={colors[0]}/><Text style={[s.rewardText,{color:colors[0]}]}>+ XP Hybrid</Text></View>{locked&&<Text style={[s.lock,{color:colors[0]}]}>Débloquer avec PRO</Text>}</View>
    </LinearGradient>
  </SensoryPressable>
}
const s=StyleSheet.create({shell:{borderRadius:Radius.xl,marginBottom:12,...Shadow.sm},card:{padding:Spacing.md,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.borderLight},top:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center'},info:{flex:1},kicker:{fontSize:8,fontWeight:FontWeight.extrabold,color:Colors.textTertiary,letterSpacing:1.5},title:{color:Colors.textPrimary,fontWeight:FontWeight.extrabold,fontSize:16,marginTop:1},sub:{color:Colors.textSecondary,marginTop:10,fontSize:12,lineHeight:17},progressRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:13},track:{flex:1,height:7,borderRadius:99,backgroundColor:Colors.bgAlt,overflow:'hidden'},fill:{height:'100%',borderRadius:99},percent:{width:34,textAlign:'right',fontSize:10,fontWeight:FontWeight.extrabold},bottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10},reward:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:5,borderRadius:99},rewardText:{fontSize:9,fontWeight:FontWeight.bold},lock:{fontSize:10,fontWeight:FontWeight.bold}})
