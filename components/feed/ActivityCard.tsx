import { SensoryPressable } from '@/components/v6/SensoryPressable'
import React from 'react'
import { router } from 'expo-router'
import {View,Text,StyleSheet} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Activity, CheckCircle2, Clock3, Sparkles } from 'lucide-react-native'
import {Avatar} from '@/components/ui/Avatar'
import {SPORTS_CONFIG} from '@/constants/sports'
import {Colors,FontWeight,Radius,Spacing,Shadow} from '@/constants/theme'
import {formatDurationLong} from '@/lib/units'
import type{ActivityWithProfile,SportType}from '@/types/database'

export function ActivityCard({activity}:{activity:ActivityWithProfile}){
  const c=SPORTS_CONFIG[activity.sport_type as SportType]||SPORTS_CONFIG.running
  const color=c.color||Colors.electric
  return <SensoryPressable event="selection" onPress={()=>router.push(`/modals/activity/${activity.id}` as any)} style={s.card}>
    <View style={[s.accent,{backgroundColor:color}]}/>
    <View style={s.user}><Avatar uri={activity.profile?.avatar_url} username={activity.profile?.username||'?'} size={38}/><View style={{flex:1}}><Text style={s.name}>{activity.profile?.username||'Athlète'}</Text><Text style={s.date}>{new Date(activity.performed_at||activity.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</Text></View>{activity.is_verified&&<View style={s.verified}><CheckCircle2 size={12} color={Colors.success}/><Text style={s.verifiedText}>VÉRIFIÉE</Text></View>}</View>
    <View style={s.activityRow}><LinearGradient colors={[color+'33',color+'12']} style={[s.sportIcon,{borderColor:color+'44'}]}><Activity size={22} color={color} strokeWidth={2.3}/></LinearGradient><View style={{flex:1}}><Text style={[s.sport,{color}]}>{c.labelLong}</Text><Text style={s.metric}>{activity.title||'Séance enregistrée'}</Text></View><View style={s.duration}><Clock3 size={12} color={Colors.textTertiary}/><Text style={s.durationText}>{formatDurationLong(activity.duration_seconds)}</Text></View></View>
    {activity.notes?<Text style={s.notes}>{activity.notes}</Text>:null}
    <View style={s.footer}><Sparkles size={11} color={color}/><Text style={s.footerText}>+ progression Hybrid</Text></View>
  </SensoryPressable>
}
const s=StyleSheet.create({card:{backgroundColor:Colors.bgCard,padding:Spacing.md,borderRadius:Radius.xl,gap:12,borderWidth:1,borderColor:Colors.borderLight,...Shadow.sm,overflow:'hidden'},accent:{position:'absolute',left:0,top:0,bottom:0,width:4},user:{flexDirection:'row',gap:10,alignItems:'center'},name:{fontWeight:FontWeight.bold,color:Colors.textPrimary},date:{fontSize:10,color:Colors.textTertiary,marginTop:1},verified:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(16,185,129,.10)',paddingHorizontal:7,paddingVertical:4,borderRadius:99},verifiedText:{fontSize:7,color:Colors.success,fontWeight:FontWeight.extrabold,letterSpacing:.8},activityRow:{flexDirection:'row',alignItems:'center',gap:10},sportIcon:{width:46,height:46,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1},sport:{fontWeight:FontWeight.extrabold,fontSize:16},metric:{color:Colors.textSecondary,fontSize:11,marginTop:2},duration:{alignItems:'flex-end',gap:2},durationText:{fontSize:11,color:Colors.textSecondary,fontWeight:FontWeight.bold},notes:{color:Colors.textSecondary,lineHeight:19,fontSize:12,backgroundColor:Colors.bgAlt,borderRadius:10,padding:10},footer:{flexDirection:'row',alignItems:'center',gap:4,borderTopWidth:1,borderTopColor:Colors.borderLight,paddingTop:9},footerText:{fontSize:9,color:Colors.textTertiary,fontWeight:FontWeight.bold}})
