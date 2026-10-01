import React,{useMemo}from'react'
import{View,Text,StyleSheet}from'react-native'
import{Colors,Radius,Spacing,FontWeight}from'@/constants/theme'
export function HeatmapView({data,weeks=14}:{data:Record<string,number>|number[];weeks?:number}){
 const vals=useMemo(()=>{if(Array.isArray(data))return data.slice(-weeks*7);const out:number[]=[];const today=new Date();for(let i=weeks*7-1;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);const key=d.toISOString().slice(0,10);out.push(data?.[key]??0)}return out},[data,weeks])
 const max=Math.max(1,...vals)
 return <View style={s.card}><Text style={s.title}>Régularité</Text><View style={s.grid}>{vals.map((v,i)=><View key={i} style={[s.cell,{opacity:v?Math.max(.25,v/max):.10}]}/>)}</View></View>
}
const s=StyleSheet.create({card:{backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md},title:{fontWeight:FontWeight.bold,color:Colors.textPrimary,marginBottom:10},grid:{flexDirection:'row',flexWrap:'wrap',gap:3},cell:{width:10,height:10,borderRadius:2,backgroundColor:Colors.electric}})
