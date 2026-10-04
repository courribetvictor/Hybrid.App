import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { BrainCircuit, ChevronRight, CalendarRange, ShieldCheck } from 'lucide-react-native'
import { PHASE_META } from '@/constants/v12'
import type { AdaptiveSnapshot } from '@/lib/v12/adaptive'
import { Colors, FontWeight, Radius, Shadow } from '@/constants/theme'
import { SensoryPressable } from '@/components/v6/SensoryPressable'

export function AdaptiveCard({ snapshot }:{ snapshot:AdaptiveSnapshot }){
  const meta=PHASE_META[snapshot.phase]
  return <LinearGradient colors={['#101A3A','#1D2D69','#315CFF']} style={s.card}>
    <View style={s.top}><View style={s.icon}><BrainCircuit size={20} color="#fff"/></View><View style={{flex:1}}><Text style={s.eyebrow}>HYBRID ADAPTIVE OS</Text><Text style={s.title}>{snapshot.headline}</Text></View><View style={[s.phase,{borderColor:meta.color}]}><Text style={[s.phaseText,{color:meta.color}]}>{meta.label}</Text></View></View>
    <Text style={s.sub}>{meta.subtitle}</Text>
    <View style={s.row}><Metric value={`${snapshot.planConfidence}%`} label="confiance"/><Metric value={`${snapshot.adherenceEstimate}%`} label="adhérence"/><Metric value={`${snapshot.plan.length}`} label="séances"/></View>
    <View style={s.next}><CalendarRange size={17} color="#A5B4FC"/><View style={{flex:1}}><Text style={s.nextLabel}>PROCHAINE ACTION</Text><Text style={s.nextText}>{snapshot.nextBestAction}</Text></View></View>
    <SensoryPressable onPress={()=>router.push('/modals/adaptive-plan' as any)} event="selection" style={s.cta}><ShieldCheck size={16} color="#fff"/><Text style={s.ctaText}>Ouvrir mon plan adaptatif</Text><ChevronRight size={16} color="#fff"/></SensoryPressable>
  </LinearGradient>
}
function Metric({value,label}:{value:string;label:string}){return <View style={s.metric}><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>}
const s=StyleSheet.create({card:{borderRadius:26,padding:16,gap:12,...Shadow.lg},top:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:40,height:40,borderRadius:14,backgroundColor:'rgba(255,255,255,.11)',alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:8.5,fontWeight:FontWeight.extrabold,color:'#A5B4FC',letterSpacing:1.2},title:{fontSize:17,fontWeight:FontWeight.extrabold,color:'#fff',marginTop:2},phase:{paddingHorizontal:8,paddingVertical:5,borderRadius:99,borderWidth:1,backgroundColor:'rgba(255,255,255,.07)'},phaseText:{fontSize:8,fontWeight:FontWeight.extrabold,letterSpacing:.7},sub:{fontSize:10.5,color:'#D7DEFF',lineHeight:15},row:{flexDirection:'row',gap:7},metric:{flex:1,backgroundColor:'rgba(255,255,255,.08)',borderRadius:14,paddingVertical:9,alignItems:'center'},metricValue:{fontSize:15,color:'#fff',fontWeight:FontWeight.extrabold},metricLabel:{fontSize:8.5,color:'#AAB7E8',marginTop:2},next:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'rgba(0,0,0,.14)',borderRadius:14,padding:10},nextLabel:{fontSize:7.5,color:'#A5B4FC',fontWeight:FontWeight.extrabold,letterSpacing:.8},nextText:{fontSize:10.5,color:'#fff',fontWeight:FontWeight.bold,marginTop:2},cta:{height:42,borderRadius:14,backgroundColor:'rgba(255,255,255,.13)',borderWidth:1,borderColor:'rgba(255,255,255,.16)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},ctaText:{color:'#fff',fontSize:11,fontWeight:FontWeight.extrabold}})
