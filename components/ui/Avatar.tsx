import React from 'react'
import { Image, Text, View, StyleSheet } from 'react-native'
import { Colors, FontWeight } from '@/constants/theme'
export function Avatar({uri,username='?',size=40,isPro=false}:{uri?:string|null;username?:string;size?:number;isPro?:boolean}){
 const initial=(username||'?').trim().slice(0,1).toUpperCase()
 return <View style={[s.wrap,{width:size,height:size,borderRadius:size/2},isPro&&s.pro]}>{uri?<Image source={{uri}} style={{width:'100%',height:'100%',borderRadius:size/2}}/>:<Text style={[s.text,{fontSize:size*.38}]}>{initial}</Text>}</View>
}
const s=StyleSheet.create({wrap:{backgroundColor:Colors.electricDim,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:Colors.border,overflow:'hidden'},pro:{borderColor:'#7B61FF',borderWidth:2},text:{color:Colors.electric,fontWeight:FontWeight.bold}})
