import React,{useMemo}from'react'
import{View,Text,StyleSheet}from'react-native'
import{router}from'expo-router'
import{HeartPulse,Moon,Droplets,Brain,ChevronRight}from'lucide-react-native'
import{SensoryPressable}from'@/components/v6/SensoryPressable'
import{useSession}from'@/hooks/useProfile'
import{useLifeCheckin}from'@/hooks/useLifeCheckin'
import{buildLifeSnapshot}from'@/lib/v11/life'
import type{Activity}from'@/types/database'
import{Colors,Shadow,Spacing}from'@/constants/theme'
export function LifeCard({activities}:{activities:Activity[]}){const{userId}=useSession();const{checkin}=useLifeCheckin(userId??undefined);const life=useMemo(()=>buildLifeSnapshot(activities,checkin),[activities,checkin]);return <SensoryPressable event="selection" onPress={()=>router.push('/modals/life-hub' as any)} style={s.card}><View style={s.top}><View style={[s.score,{borderColor:life.trainingColor}]}><Text style={[s.scoreText,{color:life.trainingColor}]}>{life.score}</Text></View><View style={{flex:1}}><Text style={s.kicker}>HYBRID LIFE</Text><Text style={s.title}>{life.headline}</Text><Text style={s.sub}>{life.actions[0]}</Text></View><ChevronRight size={18} color="#64748B"/></View><View style={s.row}><P icon={<HeartPulse size={13} color="#7C3AED"/>} label="Récup" v={life.recovery}/><P icon={<Moon size={13} color="#4F46E5"/>} label="Sommeil" v={life.sleep}/><P icon={<Droplets size={13} color="#06B6D4"/>} label="Hydra" v={life.hydration}/><P icon={<Brain size={13} color="#EC4899"/>} label="Mental" v={life.mind}/></View></SensoryPressable>}
function P({icon,label,v}:{icon:React.ReactNode;label:string;v:number}){return <View style={s.p}>{icon}<Text style={s.pv}>{v}</Text><Text style={s.pl}>{label}</Text></View>}
const s=StyleSheet.create({card:{backgroundColor:'#FFFFFF',borderRadius:24,padding:Spacing.md,marginBottom:Spacing.md,...Shadow.sm,borderWidth:1,borderColor:'#E8EEF7'},top:{flexDirection:'row',alignItems:'center',gap:11},score:{width:52,height:52,borderRadius:18,borderWidth:3,alignItems:'center',justifyContent:'center',backgroundColor:'#F8FAFC'},scoreText:{fontSize:20,fontWeight:'900'},kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:'#64748B'},title:{fontSize:17,fontWeight:'900',color:Colors.textPrimary,marginTop:1},sub:{fontSize:10.5,color:Colors.textSecondary,lineHeight:14,marginTop:3},row:{flexDirection:'row',gap:7,marginTop:13},p:{flex:1,backgroundColor:'#F8FAFC',borderRadius:13,paddingVertical:8,alignItems:'center'},pv:{fontSize:13,fontWeight:'900',color:Colors.textPrimary,marginTop:3},pl:{fontSize:8,color:Colors.textTertiary,marginTop:1}})
