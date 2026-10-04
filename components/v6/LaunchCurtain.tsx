import React,{useEffect}from'react'
import{View,Text,StyleSheet}from'react-native'
import Animated,{useAnimatedStyle,useSharedValue,withDelay,withSpring,withTiming}from'react-native-reanimated'
import{LinearGradient}from'expo-linear-gradient'
import{Zap}from'lucide-react-native'
import{FontWeight}from'@/constants/theme'
import{useSensoryPreferences}from'@/hooks/useSensoryPreferences'
export function LaunchCurtain({visible,onDone}:{visible:boolean;onDone:()=>void}){const o=useSharedValue(1),sc=useSharedValue(.8);const{prefs}=useSensoryPreferences();useEffect(()=>{if(!visible)return;sc.value=prefs.reducedMotion?1:withSpring(1,{damping:10,stiffness:170});o.value=withDelay(prefs.reducedMotion?100:650,withTiming(0,{duration:prefs.reducedMotion?120:280}));const t=setTimeout(onDone,prefs.reducedMotion?250:1000);return()=>clearTimeout(t)},[visible,prefs.reducedMotion]);const a=useAnimatedStyle(()=>({opacity:o.value,transform:[{scale:sc.value}]}));if(!visible)return null;return <Animated.View pointerEvents="none" style={[s.overlay,a]}><LinearGradient colors={['#071225','#172554','#315CFF']} style={StyleSheet.absoluteFill}/><View style={s.mark}><Zap size={33} color="#fff" fill="#fff"/></View><Text style={s.name}>HYBRID</Text><Text style={s.sub}>TRAIN · LIVE · EVOLVE</Text></Animated.View>}
const s=StyleSheet.create({overlay:{...StyleSheet.absoluteFillObject,zIndex:9999,alignItems:'center',justifyContent:'center'},mark:{width:78,height:78,borderRadius:24,backgroundColor:'rgba(255,255,255,.12)',borderWidth:1,borderColor:'rgba(255,255,255,.22)',alignItems:'center',justifyContent:'center'},name:{color:'#fff',fontWeight:FontWeight.extrabold,fontSize:29,letterSpacing:4,marginTop:16},sub:{color:'#A5B4FC',fontWeight:FontWeight.bold,fontSize:9,letterSpacing:2.2,marginTop:5}})
