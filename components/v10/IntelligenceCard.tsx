import React,{useMemo}from'react'
import{View,Text,StyleSheet}from'react-native'
import{router}from'expo-router'
import{BrainCircuit,ChevronRight,Activity,ShieldCheck}from'lucide-react-native'
import{SensoryPressable}from'@/components/v6/SensoryPressable'
import{buildHybridIntelligence}from'@/lib/v10/intelligence'
import{INTELLIGENCE_STATES}from'@/constants/v10'
import type{Activity as HybridActivity}from'@/types/database'
import{Colors,Radius,Shadow,Spacing}from'@/constants/theme'

export function IntelligenceCard({activities}:{activities:HybridActivity[]}){
 const intel=useMemo(()=>buildHybridIntelligence(activities),[activities])
 const state=INTELLIGENCE_STATES[intel.state]
 return <SensoryPressable event="selection" onPress={()=>router.push('/modals/intelligence' as any)} style={s.card}>
  <View style={s.top}><View style={[s.icon,{backgroundColor:state.color+'18'}]}><BrainCircuit size={20} color={state.color}/></View><View style={{flex:1}}><Text style={s.kicker}>HYBRID INTELLIGENCE</Text><Text style={s.title}>{state.label}</Text></View><ChevronRight size={19} color={Colors.textTertiary}/></View>
  <Text style={s.sub}>{state.description}</Text>
  <View style={s.metrics}><Metric label="Forme" value={intel.form}/><Metric label="Fatigue" value={intel.fatigue}/><Metric label="Progression" value={intel.progression}/><Metric label="Régularité" value={intel.consistency}/></View>
  <View style={s.footer}><Activity size={13} color={Colors.electric}/><Text style={s.footerText}>Charge {intel.loadRatio.toFixed(2)}×</Text><View style={s.dot}/><ShieldCheck size={13} color="#10B981"/><Text style={s.footerText}>{intel.warnings.length?`${intel.warnings.length} point(s) à surveiller`:'Charge cohérente'}</Text></View>
 </SensoryPressable>
}
function Metric({label,value}:{label:string;value:number}){return <View style={s.metric}><Text style={s.value}>{value}</Text><Text style={s.label}>{label}</Text><View style={s.track}><View style={[s.fill,{width:`${Math.max(4,value)}%`} as any]}/></View></View>}
const s=StyleSheet.create({card:{backgroundColor:'#0B1220',borderRadius:24,padding:Spacing.md,marginBottom:Spacing.md,...Shadow.md},top:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:'#94A3B8'},title:{fontSize:20,fontWeight:'900',color:'#fff',marginTop:1},sub:{fontSize:11.5,color:'#CBD5E1',marginTop:9,lineHeight:17},metrics:{flexDirection:'row',gap:7,marginTop:14},metric:{flex:1,backgroundColor:'#111C2F',borderRadius:14,padding:9},value:{fontSize:17,fontWeight:'900',color:'#fff'},label:{fontSize:8.5,color:'#94A3B8',marginTop:2},track:{height:3,backgroundColor:'#24324A',borderRadius:3,marginTop:7,overflow:'hidden'},fill:{height:3,backgroundColor:'#60A5FA',borderRadius:3},footer:{flexDirection:'row',alignItems:'center',gap:5,marginTop:12},footerText:{fontSize:9.5,color:'#A8B5C8'},dot:{width:3,height:3,borderRadius:2,backgroundColor:'#475569',marginHorizontal:3}})
