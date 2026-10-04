import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontWeight } from '@/constants/theme'
import { router } from 'expo-router'
import { BookOpen, FlaskConical } from 'lucide-react-native'
import { SensoryPressable } from '@/components/v6/SensoryPressable'
import { useSession, useProfile } from '@/hooks/useProfile'
import { useActivities } from '@/hooks/useActivities'
import { useSkills } from '@/hooks/useSkills'
import { useWeeklyGoal } from '@/hooks/useGoal'
import { CoachTab } from '@/components/ui/CoachTab'

export default function CoachScreen(){const insets=useSafeAreaInsets();const{userId}=useSession();const{profile}=useProfile(userId??undefined);const{activities}=useActivities(userId??undefined,3650);const skills=useSkills(activities);const{goal}=useWeeklyGoal();return <View style={s.root}><View style={[s.header,{paddingTop:insets.top+10}]}><Text style={s.eyebrow}>COACH</Text><Text style={s.title}>Head Coach Hybrid</Text><Text style={s.sub}>Un seul coach coordonne endurance, force, technique et récupération.</Text><View style={s.quick}><SensoryPressable onPress={()=>router.push('/modals/journal' as any)} style={s.quickBtn}><BookOpen size={14} color={Colors.electric}/><Text style={s.quickText}>Journal</Text></SensoryPressable><SensoryPressable onPress={()=>router.push('/modals/scenario-lab' as any)} style={s.quickBtn}><FlaskConical size={14} color={Colors.violet}/><Text style={s.quickText}>Et si… ?</Text></SensoryPressable></View></View><View style={{flex:1}}><CoachTab activities={activities} skills={skills} goal={goal} sports={profile?.favorite_sports??[]}/></View></View>}
const s=StyleSheet.create({root:{flex:1,backgroundColor:Colors.bg},header:{paddingHorizontal:16,paddingBottom:8},eyebrow:{fontSize:9,color:Colors.violet,fontWeight:FontWeight.extrabold,letterSpacing:1.4},title:{fontSize:24,fontWeight:FontWeight.extrabold,color:Colors.textPrimary,marginTop:2},sub:{fontSize:10.5,color:Colors.textSecondary,marginTop:3},quick:{flexDirection:'row',gap:7,marginTop:8},quickBtn:{backgroundColor:'#fff',borderWidth:1,borderColor:Colors.border,borderRadius:99,paddingHorizontal:10,paddingVertical:6,flexDirection:'row',gap:5,alignItems:'center'},quickText:{fontSize:9.5,color:Colors.textPrimary,fontWeight:FontWeight.bold}})
