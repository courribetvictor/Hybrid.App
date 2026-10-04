import React from'react'
import{View,Text,StyleSheet}from'react-native'
import{LinearGradient}from'expo-linear-gradient'
import{Sparkles,MapPin,Music2}from'lucide-react-native'
import{HybridAvatar2D}from'@/components/v14/HybridAvatar2D'
import{HybridCompanion}from'@/components/v8/HybridCompanion'
import{V8_CARD_FRAMES}from'@/constants/v8'
import{V14_CARD_THEMES}from'@/constants/v14'
import{useV7Economy}from'@/hooks/v7/useV7Economy'
import{useV8World}from'@/hooks/v8/useV8World'
import{useV14Identity}from'@/hooks/v14/useV14Identity'
import{FontWeight,Shadow}from'@/constants/theme'
export function IdentityCard({username='athlete',compact=false}:{username?:string;compact?:boolean}){
 const{state:v7,level}=useV7Economy();const{state:v8}=useV8World();const v14=useV14Identity().state;const theme=V14_CARD_THEMES.find(x=>x.id===v14.cardTheme)??V14_CARD_THEMES[0],frame=V8_CARD_FRAMES[v8.cardFrame];const light=v14.cardTheme==='editorial';const primary=light?'#111827':'#fff',secondary=light?'#52627C':'#CBD5E1'
 return <LinearGradient colors={theme.colors as any} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.card,{borderColor:frame.color},compact&&s.compact]}>
  <View style={s.top}><View><Text style={[s.kicker,{color:theme.accent}]}>HYBRID IDENTITY · LVL {level}</Text><Text style={[s.name,{color:primary}]}>@{username}</Text><Text style={[s.title,{color:secondary}]}>{v8.cardTitle}</Text></View><View style={[s.frameChip,{borderColor:frame.color}]}><Sparkles size={11} color={frame.color}/><Text style={[s.frameText,{color:frame.color}]}>{frame.name}</Text></View></View>
  <View style={s.middle}><HybridAvatar2D equipped={v7.equipped} size={compact?140:178} expression={v14.expression} pose={v14.pose} background={v14.background} silhouette={v14.silhouette} faceShape={v14.faceShape} grain={v14.grain} compact/><View style={s.companion}><HybridCompanion id={v8.companionId} gear={v8.companionGear} mood={v8.companionMood} size={compact?70:92}/></View></View>
  <Text numberOfLines={2} style={[s.quote,{color:primary}]}>“{v8.cardQuote}”</Text><View style={s.footer}><View style={s.meta}><MapPin size={12} color={secondary}/><Text style={[s.metaText,{color:secondary}]}>World / 01</Text></View>{v8.musicVisible&&<View style={s.meta}><Music2 size={12} color={theme.accent}/><Text style={[s.metaText,{color:secondary}]}>Training soundtrack</Text></View>}</View>
 </LinearGradient>
}
const s=StyleSheet.create({card:{marginHorizontal:16,borderRadius:28,padding:18,borderWidth:2,overflow:'hidden',...Shadow.md},compact:{marginHorizontal:0,minHeight:250},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},kicker:{fontSize:8,fontWeight:FontWeight.extrabold,letterSpacing:1.3},name:{fontSize:22,fontWeight:FontWeight.extrabold,marginTop:5},title:{fontSize:11,fontWeight:FontWeight.bold,marginTop:2},frameChip:{flexDirection:'row',alignItems:'center',gap:4,borderWidth:1,borderRadius:99,paddingHorizontal:8,paddingVertical:5,backgroundColor:'rgba(255,255,255,.10)'},frameText:{fontSize:8,fontWeight:FontWeight.extrabold,textTransform:'uppercase'},middle:{height:164,alignItems:'center',justifyContent:'center'},companion:{position:'absolute',right:6,bottom:0},quote:{fontSize:12,lineHeight:17,fontWeight:FontWeight.semibold,textAlign:'center',paddingHorizontal:14},footer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},meta:{flexDirection:'row',alignItems:'center',gap:5},metaText:{fontSize:9,fontWeight:FontWeight.bold}})
