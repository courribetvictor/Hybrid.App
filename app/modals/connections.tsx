import React,{useCallback,useEffect,useMemo,useState}from'react'
import{View,Text,StyleSheet,ScrollView,TouchableOpacity,Alert,ActivityIndicator}from'react-native'
import{router}from'expo-router'
import{ArrowLeft,Watch,HeartPulse,CloudDownload,Music2,ShieldCheck,RefreshCw,CheckCircle2}from'lucide-react-native'
import{Colors,FontWeight,Radius,Shadow,Spacing}from'@/constants/theme'
import{CONNECTED_PROVIDERS}from'@/constants/v9'
import{useSession}from'@/hooks/useProfile'
import{supabase}from'@/lib/supabase'

type Row={provider:string;status:string;last_sync_at?:string|null}
const MUSIC=[{id:'spotify',name:'Spotify',description:'Morceau en cours, soundtrack et Music Intelligence.'},{id:'apple_music',name:'Apple Music',description:'Soundtrack et historique musical des Activity Stories.'}]
export default function ConnectionsScreen(){
 const{userId}=useSession();const[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true)
 const load=useCallback(async()=>{if(!userId)return;setLoading(true);const{data}=await supabase.from('connected_sources').select('*').eq('user_id',userId);setRows((data??[])as Row[]);setLoading(false)},[userId]);useEffect(()=>{load()},[load])
 const status=(id:string)=>rows.find(r=>r.provider===id);const connected=useMemo(()=>rows.filter(r=>r.status==='connected').length,[rows])
 const press=(p:{id:string;name:string;description:string})=>{const r=status(p.id);if(r?.status==='connected')Alert.alert(p.name,`Connecté${r.last_sync_at?` · dernière synchro ${new Date(r.last_sync_at).toLocaleString('fr-FR')}`:''}.\n\nLa déconnexion devra aussi révoquer l’accès chez le fournisseur.`);else Alert.alert(`Connecter ${p.name}`,`${p.description}\n\nHybrid V9 a le modèle d’import, l’anti-doublon et le statut vérifié. L’activation réelle nécessite les identifiants développeur/OAuth du fournisseur.`)}
 return <View style={s.root}><View style={s.head}><TouchableOpacity onPress={()=>router.back()}style={s.back}><ArrowLeft size={20}/></TouchableOpacity><View style={{flex:1}}><Text style={s.kicker}>HYBRID CONNECT</Text><Text style={s.title}>Montres & données</Text><Text style={s.sub}>{connected} source{connected>1?'s':''} connectée{connected>1?'s':''}</Text></View></View>{loading?<ActivityIndicator style={{marginTop:50}}color={Colors.electric}/>:<ScrollView contentContainerStyle={s.content}showsVerticalScrollIndicator={false}>
  <View style={s.hero}><View style={s.heroIcon}><RefreshCw size={23}color="#fff"/></View><View style={{flex:1}}><Text style={s.heroTitle}>Auto Sync</Text><Text style={s.heroText}>Enregistre avec ta montre. Hybrid importe la séance, détecte les doublons et conserve sa source.</Text></View></View>
  <Section title="Montres & santé"icon={<Watch size={18}color="#315CFF"/>}>{CONNECTED_PROVIDERS.map(p=><Provider key={p.id}p={p as any}row={status(p.id)}onPress={()=>press(p as any)}/>)}</Section>
  <Section title="Musique"icon={<Music2 size={18}color="#8B5CF6"/>}>{MUSIC.map(p=><Provider key={p.id}p={p}row={status(p.id)}onPress={()=>press(p)}/>)}</Section>
  <View style={s.trust}><ShieldCheck size={21}color="#059669"/><View style={{flex:1}}><Text style={s.trustTitle}>Source de confiance</Text><Text style={s.trustText}>Hybrid GPS et les fournisseurs connectés peuvent marquer une performance comme vérifiée. Les entrées manuelles restent clairement identifiées et ne deviennent jamais automatiquement “officielles”.</Text></View></View>
  <View style={s.flow}><Text style={s.flowTitle}>Une seule activité, même si elle arrive plusieurs fois</Text><Text style={s.flowText}>Garmin → Strava → Hybrid ne doit pas créer trois séances. V9 conserve les identifiants externes et une empreinte temporelle/distance pour dédupliquer avant l’import.</Text></View>
 </ScrollView>}</View>
}
function Section({title,icon,children}:any){return <View><View style={s.sectionTitle}>{icon}<Text style={s.sectionTitleText}>{title}</Text></View><View style={s.stack}>{children}</View></View>}
function Provider({p,row,onPress}:any){
 const on=row?.status==='connected'
 const iconColor=on?'#059669':'#475569'
 const providerIcon=p.kind==='health'
  ? <HeartPulse size={21} color={iconColor}/>
  : ((p.id?.includes('music')||p.id==='spotify') ? <Music2 size={21} color={iconColor}/> : <Watch size={21} color={iconColor}/>)
 return <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={.9}>
   <View style={[s.providerIcon,{backgroundColor:on?'#ECFDF5':'#F1F5F9'}]}>{providerIcon}</View>
   <View style={{flex:1}}><Text style={s.name}>{p.name}</Text><Text style={s.note}>{p.description}</Text>{row?.last_sync_at&&<Text style={s.sync}>Sync · {new Date(row.last_sync_at).toLocaleDateString('fr-FR')}</Text>}</View>
   <View style={[s.badge,on&&s.badgeOn]}>{on?<CheckCircle2 size={13} color="#059669"/>:<CloudDownload size={13} color="#64748B"/>}<Text style={[s.badgeText,on&&{color:'#059669'}]}>{on?'Connecté':'Configurer'}</Text></View>
 </TouchableOpacity>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#F5F7FB'},head:{paddingTop:55,paddingHorizontal:16,paddingBottom:14,flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'#fff'},back:{width:38,height:38,borderRadius:13,backgroundColor:'#F1F5F9',alignItems:'center',justifyContent:'center'},kicker:{fontSize:9,color:Colors.electric,fontWeight:FontWeight.extrabold,letterSpacing:1.4},title:{fontSize:22,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},sub:{fontSize:10.5,color:Colors.textTertiary,marginTop:2},content:{padding:16,gap:20,paddingBottom:50},hero:{backgroundColor:'#101B38',borderRadius:23,padding:16,flexDirection:'row',gap:12,alignItems:'center',...Shadow.sm},heroIcon:{width:48,height:48,borderRadius:16,backgroundColor:'#315CFF',alignItems:'center',justifyContent:'center'},heroTitle:{color:'#fff',fontSize:16,fontWeight:FontWeight.extrabold},heroText:{color:'#C7D2FE',fontSize:10.5,lineHeight:16,marginTop:3},sectionTitle:{flexDirection:'row',gap:7,alignItems:'center',marginBottom:8},sectionTitleText:{fontSize:13,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},stack:{gap:8},card:{backgroundColor:'#fff',borderRadius:18,padding:12,flexDirection:'row',gap:11,alignItems:'center',...Shadow.sm},providerIcon:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},name:{fontSize:13,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},note:{fontSize:9.5,lineHeight:14,color:Colors.textSecondary,marginTop:2},sync:{fontSize:9,color:'#059669',marginTop:4,fontWeight:FontWeight.bold},badge:{borderRadius:99,paddingHorizontal:8,paddingVertical:6,backgroundColor:'#F1F5F9',flexDirection:'row',gap:4,alignItems:'center'},badgeOn:{backgroundColor:'#ECFDF5'},badgeText:{fontSize:8.5,fontWeight:FontWeight.extrabold,color:'#64748B'},trust:{backgroundColor:'#ECFDF5',borderRadius:20,padding:15,flexDirection:'row',gap:10},trustTitle:{fontSize:12,fontWeight:FontWeight.extrabold,color:'#065F46'},trustText:{fontSize:10,lineHeight:15,color:'#047857',marginTop:3},flow:{backgroundColor:'#EEF2FF',borderRadius:20,padding:15},flowTitle:{fontSize:12,fontWeight:FontWeight.extrabold,color:'#3730A3'},flowText:{fontSize:10,lineHeight:15,color:'#4F46E5',marginTop:4}})
