import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg,{Circle}from'react-native-svg'
import { FontWeight } from '@/constants/theme'
export function ProgressRing({value,size=72,stroke=7,color='#10B981',track='rgba(255,255,255,.15)',label}:{value:number;size?:number;stroke?:number;color?:string;track?:string;label?:string}){
 const r=(size-stroke)/2,c=2*Math.PI*r,p=Math.max(0,Math.min(100,value)),dash=c*(p/100)
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><Svg width={size} height={size} style={StyleSheet.absoluteFill}><Circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none"/><Circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} transform={`rotate(-90 ${size/2} ${size/2})`}/></Svg><Text style={s.value}>{Math.round(p)}</Text>{label?<Text style={s.label}>{label}</Text>:null}</View>
}
const s=StyleSheet.create({value:{fontSize:18,color:'#fff',fontWeight:FontWeight.extrabold,lineHeight:20},label:{fontSize:7.5,color:'#D1FAE5',fontWeight:FontWeight.extrabold,textTransform:'uppercase',letterSpacing:.7}})
