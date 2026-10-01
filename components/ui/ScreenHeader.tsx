import React from 'react'
import {View,Text,StyleSheet} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Colors,FontSize,FontWeight,Spacing,Shadow} from '@/constants/theme'
import {SensoryPressable} from '@/components/v6/SensoryPressable'
export function ScreenHeader({title,right}:{title:string;right?:React.ReactNode}){const i=useSafeAreaInsets();return <View style={[s.wrap,{paddingTop:i.top+8}]}><View><Text style={s.kicker}>HYBRID</Text><Text style={s.title}>{title}</Text></View><View style={s.right}>{right}</View></View>}
const s=StyleSheet.create({wrap:{minHeight:66,paddingHorizontal:Spacing.md,paddingBottom:10,flexDirection:'row',alignItems:'center',backgroundColor:Colors.bg},kicker:{fontSize:7.5,color:Colors.electric,fontWeight:FontWeight.extrabold,letterSpacing:1.8,marginBottom:1},title:{fontSize:FontSize.xl,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},right:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:8}})
export function HeaderIconBtn({icon,onPress,badge=false}:{icon:React.ReactNode;onPress:()=>void;badge?:boolean}){return <SensoryPressable onPress={onPress} style={h.btn}>{icon}{badge?<View style={h.badge}/>:null}</SensoryPressable>}
const h=StyleSheet.create({btn:{width:38,height:38,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:Colors.bgCard,borderWidth:1,borderColor:Colors.borderLight,position:'relative',...Shadow.sm},badge:{position:'absolute',top:7,right:7,width:7,height:7,borderRadius:4,backgroundColor:Colors.error,borderWidth:1.5,borderColor:'#fff'}})
