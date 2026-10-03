import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Activity as ActivityIcon, CalendarDays, ChevronRight, Headphones, Radio, Sparkles, Trophy, Gauge, MapPinned, Dumbbell, BookOpen, HeartPulse } from 'lucide-react-native'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, Gradients } from '@/constants/theme'
import { getHybridRank, getNextRank } from '@/constants/ranks'
import { computeReadiness } from '@/lib/readiness'
import { useProgression } from '@/hooks/useProgression'
import { CLASS_BY_KEY } from '@/constants/v5'
import { GradeCelebrationGate } from '@/components/v5/GradeCelebrationGate'
import { SensoryPressable } from '@/components/v6/SensoryPressable'
import { SectionReveal } from '@/components/v6/SectionReveal'
import { ProgressRing } from '@/components/v6/ProgressRing'
import { CountUpText } from '@/components/v6/CountUpText'
import { useSkills } from '@/hooks/useSkills'
import { useWeeklyGoal } from '@/hooks/useGoal'
import type { Activity, Profile } from '@/types/database'

export function TodayDashboard({ activities, profile }: { activities: Activity[]; profile?: Profile | null }) {
  const skills = useSkills(activities)
  const score = Math.round(skills.overall * 10)
  const rank = getHybridRank(score)
  const next = getNextRank(score)
  const readiness = useMemo(() => computeReadiness(activities), [activities])
  const { goal } = useWeeklyGoal()
  const progression = useProgression()
  const athleteClass = progression.athleteClass ? CLASS_BY_KEY[progression.athleteClass] : null
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0,0,0,0)
  const week = activities.filter(a => new Date(a.performed_at ?? a.created_at) >= monday)
  const goalTarget = goal?.value ?? 4
  const weekCount = week.length
  const weekMinutes = Math.round(week.reduce((sum,a)=>sum+(a.duration_seconds||0)/60,0))
  const weekKm = week.reduce((sum,a)=>sum+Number(a.metrics?.distance_km??(Number(a.metrics?.distance_m??0)/1000)),0)
  const goalCurrent = goal?.type === 'minutes' ? weekMinutes : goal?.type === 'km' ? weekKm : weekCount
  const progress = Math.min(1, goalTarget ? goalCurrent / goalTarget : 0)
  const nextDelta = rank.key === 'legend' ? 0 : Math.max(0, next.min - score)

  return (
    <View style={s.wrap}>
      <GradeCelebrationGate score={score} />
      <SectionReveal delay={30}><LinearGradient colors={Gradients.hero} start={{x:0,y:0}} end={{x:1,y:1}} style={s.hero}>
        <View style={s.heroGlowA} /><View style={s.heroGlowB} />
        <View style={s.heroTop}>
          <View>
            <Text style={s.eyebrow}>HYBRID TODAY</Text>
            <Text style={s.hello}>Salut {profile?.username ?? 'athlète'}</Text>
            <Text style={s.heroSub}>Ton cockpit sportif du jour.</Text>
          </View>
          <View style={[s.rankBadge,{borderColor:rank.color2,backgroundColor:rank.glow}]}>
            <Text style={[s.rankLetter,{color:rank.color2}]}>{rank.short}</Text>
          </View>
        </View>

        <View style={s.scoreRow}>
          <View style={s.scoreBlock}>
            <Text style={s.scoreLabel}>HYBRID SCORE</Text>
            <CountUpText value={score} style={s.score} />
            <Text style={s.rankText}>{rank.name}{nextDelta ? ` · ${nextDelta} pts vers ${next.name}` : ''}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.readyBlock}>
            <ProgressRing value={readiness.score} size={76} stroke={6} color={readiness.color} label={readiness.label} />
          </View>
        </View>
        <Text style={s.readyMessage}>{readiness.message}</Text>

        <View style={s.heroActions}>
          <SensoryPressable style={s.primaryAction} onPress={() => router.push('/modals/live' as any)} event="selection">
            <Radio size={17} color="#071225" strokeWidth={2.6}/><Text style={s.primaryActionText}>Démarrer en Live</Text>
          </SensoryPressable>
          <SensoryPressable style={s.secondaryAction} onPress={() => router.push('/modals/add-activity' as any)} event="selection">
            <ActivityIcon size={17} color="#fff"/><Text style={s.secondaryActionText}>Ajouter</Text>
          </SensoryPressable>
        </View>
      </LinearGradient></SectionReveal>

      <SectionReveal delay={90}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow}>
        <Quick icon={<Sparkles size={19} color={athleteClass?.color ?? '#7C3AED'}/>} label={athleteClass?.name ?? 'Ma classe'} tint={(athleteClass?.color ?? '#7C3AED')+'14'} onPress={() => router.push('/modals/choose-class' as any)} />
        <Quick icon={<CalendarDays size={19} color="#315CFF"/>} label="Calendrier" tint="#EAF0FF" onPress={() => router.push('/modals/calendar' as any)} />
        <Quick icon={<BookOpen size={19} color="#8B5CF6"/>} label="Records" tint="#F2EAFE" onPress={() => router.push('/modals/records' as any)} />
        <Quick icon={<Dumbbell size={19} color="#EF4444"/>} label="Équipement" tint="#FEECEC" onPress={() => router.push('/modals/equipment' as any)} />
        <Quick icon={<MapPinned size={19} color="#06B6D4"/>} label="Live Map" tint="#E7FAFD" onPress={() => router.push('/modals/live' as any)} />
        <Quick icon={<HeartPulse size={19} color="#10B981"/>} label="Readiness" tint="#E9FBF2" onPress={() => router.push('/modals/readiness' as any)} />
      </ScrollView></SectionReveal>

      <SectionReveal delay={140}><SensoryPressable style={s.classCard} onPress={() => router.push('/modals/choose-class' as any)}>
        <View style={[s.classGlow,{backgroundColor:(athleteClass?.color ?? '#7C3AED')+'18'}]} />
        <View style={[s.classMark,{backgroundColor:(athleteClass?.color ?? '#7C3AED')+'18'}]}><Sparkles size={20} color={athleteClass?.color ?? '#7C3AED'}/></View>
        <View style={{flex:1}}><Text style={s.classKicker}>CLASSE ATHLÈTE</Text><Text style={s.className}>{athleteClass?.name ?? 'Choisis ta spécialisation'}</Text><Text style={s.classSub}>{athleteClass ? athleteClass.boostLabel : 'Personnalise tes missions, ton Coach et tes récompenses.'}</Text></View>
        <View style={s.levelPill}><Text style={s.levelPillText}>NIV. {progression.level}</Text></View>
      </SensoryPressable></SectionReveal>

      <SectionReveal delay={190}><View style={s.grid}>
        <View style={s.card}>
          <View style={s.cardHead}><View style={[s.iconCircle,{backgroundColor:'#FFF7E7'}]}><Trophy size={17} color="#F59E0B"/></View><Text style={s.cardTitle}>Objectif semaine</Text></View>
          <Text style={s.cardBig}>{goal?.type==='minutes'?weekMinutes:goal?.type==='km'?weekKm.toFixed(1):weekCount}<Text style={s.cardMuted}>/{goalTarget}{goal?.type==='minutes'?' min':goal?.type==='km'?' km':''}</Text></Text>
          <View style={s.progressTrack}><LinearGradient colors={['#F59E0B','#FB7185']} style={[s.progressFill,{width:`${Math.max(5, progress*100)}%`}]} /></View>
          <Text style={s.cardFoot}>{goalCurrent < goalTarget ? `${Math.max(0,Math.ceil(goalTarget-goalCurrent))} ${goal?.type==='minutes'?'min':goal?.type==='km'?'km':'séance'+(goalTarget-goalCurrent>1?'s':'')} restant${goal?.type==='sessions'&&goalTarget-goalCurrent>1?'es':''}` : 'Objectif atteint 🔥'}</Text>
        </View>

        <SensoryPressable style={s.card} onPress={() => router.push('/vous' as any)}>
          <View style={s.cardHead}><View style={[s.iconCircle,{backgroundColor:'#E9FBF2'}]}><Sparkles size={17} color="#10B981"/></View><Text style={s.cardTitle}>Coach Hybrid</Text></View>
          <Text style={s.cardBigSmall}>Séance suggérée</Text>
          <Text style={s.coachLine}>Adaptée à ta charge récente et à tes sports.</Text>
          <View style={s.linkRow}><Text style={s.link}>Voir la recommandation</Text><ChevronRight size={15} color={Colors.electric}/></View>
        </SensoryPressable>
      </View></SectionReveal>

      <SectionReveal delay={240}><SensoryPressable style={s.liveFriends} onPress={() => router.push('/modals/live' as any)}>
        <LinearGradient colors={['#101B38','#172554']} style={s.liveFriendsIcon}><Radio size={20} color="#FB7185"/></LinearGradient>
        <View style={{flex:1}}><Text style={s.liveTitle}>Hybrid Live</Text><Text style={s.liveSub}>Carte, musique, notes et réactions pendant l’effort.</Text></View>
        <View style={s.livePill}><Text style={s.livePillText}>LIVE</Text></View>
      </SensoryPressable></SectionReveal>
    </View>
  )
}

function Quick({icon,label,tint,onPress}:{icon:React.ReactNode;label:string;tint:string;onPress:()=>void}){
  return <SensoryPressable style={s.quick} onPress={onPress} event="selection"><View style={[s.quickIcon,{backgroundColor:tint}]}>{icon}</View><Text style={s.quickText}>{label}</Text></SensoryPressable>
}

const s=StyleSheet.create({
  wrap:{gap:Spacing.md,marginBottom:Spacing.md},
  hero:{marginHorizontal:Spacing.md,borderRadius:28,padding:20,overflow:'hidden',...Shadow.lg},
  heroGlowA:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'rgba(34,211,238,.16)',right:-70,top:-80},
  heroGlowB:{position:'absolute',width:120,height:120,borderRadius:60,backgroundColor:'rgba(167,139,250,.18)',left:-50,bottom:-60},
  heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},eyebrow:{fontSize:10,color:'#93C5FD',fontWeight:FontWeight.extrabold,letterSpacing:1.6},hello:{fontSize:25,color:'#fff',fontWeight:FontWeight.extrabold,marginTop:5},heroSub:{color:'#C7D2FE',fontSize:12,marginTop:3},
  rankBadge:{width:48,height:48,borderRadius:15,borderWidth:1.4,alignItems:'center',justifyContent:'center'},rankLetter:{fontSize:22,fontWeight:FontWeight.extrabold},
  scoreRow:{flexDirection:'row',alignItems:'center',marginTop:22},scoreBlock:{flex:1},scoreLabel:{fontSize:10,color:'#A5B4FC',fontWeight:FontWeight.bold,letterSpacing:1.1},score:{fontSize:43,lineHeight:48,color:'#fff',fontWeight:FontWeight.extrabold},rankText:{fontSize:11,color:'#C7D2FE'},divider:{width:1,height:58,backgroundColor:'rgba(255,255,255,.16)',marginHorizontal:18},readyBlock:{width:92,alignItems:'center'},readyDot:{width:8,height:8,borderRadius:4,position:'absolute',top:4,right:6},readyScore:{fontSize:29,color:'#fff',fontWeight:FontWeight.extrabold},readyLabel:{fontSize:11,color:'#D1FAE5',fontWeight:FontWeight.bold},readyMessage:{fontSize:12,color:'#DBEAFE',marginTop:10},
  heroActions:{flexDirection:'row',gap:9,marginTop:18},primaryAction:{flex:1,backgroundColor:'#fff',borderRadius:14,paddingVertical:11,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},primaryActionText:{color:'#071225',fontWeight:FontWeight.extrabold,fontSize:13},secondaryAction:{paddingHorizontal:18,borderRadius:14,borderWidth:1,borderColor:'rgba(255,255,255,.3)',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},secondaryActionText:{color:'#fff',fontWeight:FontWeight.bold,fontSize:13},
  quickRow:{paddingHorizontal:Spacing.md,gap:10},quick:{width:84,alignItems:'center',gap:6},quickIcon:{width:50,height:50,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(15,23,42,.04)'},quickText:{fontSize:11,color:Colors.textSecondary,fontWeight:FontWeight.semibold},
  grid:{flexDirection:'row',gap:10,paddingHorizontal:Spacing.md},card:{flex:1,backgroundColor:Colors.bgCard,borderRadius:20,padding:14,minHeight:148,...Shadow.sm},cardHead:{flexDirection:'row',alignItems:'center',gap:7},iconCircle:{width:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:11,color:Colors.textSecondary,fontWeight:FontWeight.bold,flex:1},cardBig:{fontSize:30,fontWeight:FontWeight.extrabold,color:Colors.textPrimary,marginTop:13},cardMuted:{fontSize:16,color:Colors.textTertiary},progressTrack:{height:7,backgroundColor:Colors.bgAlt,borderRadius:99,overflow:'hidden',marginTop:9},progressFill:{height:'100%',borderRadius:99},cardFoot:{fontSize:10,color:Colors.textTertiary,marginTop:7},cardBigSmall:{fontSize:16,fontWeight:FontWeight.extrabold,color:Colors.textPrimary,marginTop:14},coachLine:{fontSize:10.5,lineHeight:15,color:Colors.textSecondary,marginTop:5},linkRow:{flexDirection:'row',alignItems:'center',marginTop:9},link:{fontSize:10.5,color:Colors.electric,fontWeight:FontWeight.bold},
  classCard:{marginHorizontal:Spacing.md,backgroundColor:'#fff',borderRadius:20,padding:13,flexDirection:'row',alignItems:'center',gap:11,overflow:'hidden',...Shadow.sm},
  classGlow:{position:'absolute',width:120,height:120,borderRadius:60,right:-45,top:-55},
  classMark:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},
  classKicker:{fontSize:8,color:Colors.textTertiary,fontWeight:FontWeight.extrabold,letterSpacing:1},className:{fontSize:13.5,color:Colors.textPrimary,fontWeight:FontWeight.extrabold,marginTop:1},classSub:{fontSize:9.5,color:Colors.textSecondary,marginTop:2},
  levelPill:{backgroundColor:'#111827',paddingHorizontal:8,paddingVertical:6,borderRadius:99},levelPillText:{fontSize:8.5,color:'#fff',fontWeight:FontWeight.extrabold},
  liveFriends:{marginHorizontal:Spacing.md,backgroundColor:'#fff',borderRadius:20,padding:13,flexDirection:'row',alignItems:'center',gap:12,...Shadow.sm},liveFriendsIcon:{width:46,height:46,borderRadius:15,alignItems:'center',justifyContent:'center'},liveTitle:{fontWeight:FontWeight.extrabold,color:Colors.textPrimary,fontSize:14},liveSub:{fontSize:11,color:Colors.textSecondary,marginTop:2,lineHeight:15},livePill:{backgroundColor:'#FFF1F2',paddingHorizontal:8,paddingVertical:5,borderRadius:99},livePillText:{fontSize:9,color:'#E11D48',fontWeight:FontWeight.extrabold,letterSpacing:.8}
})
