import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Award, Crown, Flame, Footprints, Layers3, Star, Timer, Trophy, LockKeyhole, Zap } from 'lucide-react-native'
import { Colors, FontWeight } from '@/constants/theme'

const defs:Record<string,{colors:[string,string],Icon:any}>={
  first_step:{colors:['#38BDF8','#2563EB'],Icon:Footprints}, ten:{colors:['#34D399','#059669'],Icon:Zap}, fifty:{colors:['#A78BFA','#7C3AED'],Icon:Star}, hundred:{colors:['#F59E0B','#EA580C'],Icon:Trophy},
  three_sports:{colors:['#22D3EE','#315CFF'],Icon:Layers3}, five_sports:{colors:['#8B5CF6','#EC4899'],Icon:Award}, seven_sports:{colors:['#FBBF24','#F97316'],Icon:Crown},
  ten_hours:{colors:['#14B8A6','#0F766E'],Icon:Timer}, fifty_hours:{colors:['#315CFF','#7C3AED'],Icon:Trophy}, streak_7:{colors:['#FB923C','#EF4444'],Icon:Flame}, streak_30:{colors:['#F43F5E','#7C3AED'],Icon:Flame},
}
export function AchievementBadge({id,label,desc,unlocked}:{id:string;label:string;desc:string;unlocked:boolean}){
 const d=defs[id]??{colors:['#64748B','#334155'] as [string,string],Icon:Award}; const Icon=unlocked?d.Icon:LockKeyhole
 return <View style={[s.item,!unlocked&&s.locked]}><LinearGradient colors={unlocked?d.colors:['#D7DEE8','#AAB5C4']} style={s.medal}><View style={s.ring}><Icon size={22} color="#fff" strokeWidth={2.2}/></View></LinearGradient><Text numberOfLines={1} style={[s.label,!unlocked&&s.labelLocked]}>{label}</Text><Text numberOfLines={2} style={s.desc}>{desc}</Text></View>
}
const s=StyleSheet.create({item:{width:82,alignItems:'center',paddingVertical:5},locked:{opacity:.48},medal:{width:54,height:54,borderRadius:18,padding:3,shadowColor:'#334155',shadowOpacity:.18,shadowRadius:7,shadowOffset:{width:0,height:4},elevation:3},ring:{flex:1,borderRadius:15,borderWidth:1,borderColor:'rgba(255,255,255,.55)',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,.05)'},label:{fontSize:9,fontWeight:FontWeight.extrabold,color:Colors.textPrimary,textAlign:'center',marginTop:6},labelLocked:{color:Colors.textTertiary},desc:{fontSize:8,color:Colors.textTertiary,textAlign:'center',lineHeight:11,marginTop:1}})
