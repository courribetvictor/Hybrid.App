import React, { useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Search, Check, Footprints, Bike, Waves, CircleDot, Trophy, Dumbbell, Swords, Mountain, Snowflake, Wind, HeartPulse, Gauge, Target, ShipWheel } from 'lucide-react-native'
import { Colors, FamilyColors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { SPORT_FAMILIES, SPORTS_BY_FAMILY, searchSports } from '@/constants/sportCatalog'
import type { SportType } from '@/types/database'

const FAMILY_ICONS:Record<string,any>={running_endurance:Footprints,cycling:Bike,aquatic:Waves,racket:CircleDot,team_ball:Trophy,strength_fitness:Dumbbell,combat:Swords,climbing_mountain:Mountain,winter:Snowflake,board_action:Wind,mind_body:HeartPulse,athletics_gymnastics:Gauge,precision:Target,paddle_boat:ShipWheel}

export function SportPicker({ value, onChange, compact=false }:{value:SportType[];onChange:(next:SportType[])=>void;compact?:boolean}) {
  const [query,setQuery]=useState('')
  const filtered=useMemo(()=>searchSports(query),[query])
  const toggle=(key:SportType)=>onChange(value.includes(key)?value.filter(x=>x!==key):[...value,key])
  return <View style={s.wrap}>
    <View style={s.search}><Search size={17} color={Colors.textTertiary}/><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un sport…" placeholderTextColor={Colors.textTertiary} style={s.searchInput}/></View>
    {query.trim()?<View style={s.grid}>{filtered.map(sp=><SportChip key={sp.key} sp={sp} active={value.includes(sp.key)} onPress={()=>toggle(sp.key)}/>)}</View>:
      SPORT_FAMILIES.map(f=>{const Icon=FAMILY_ICONS[f.key]??Trophy;const color=FamilyColors[f.key]??Colors.electric;return <View key={f.key} style={s.family}>
        <View style={s.familyHead}><View style={[s.familyIcon,{backgroundColor:color+'14',borderColor:color+'28'}]}><Icon size={21} color={color} strokeWidth={2.2}/></View><View style={{flex:1}}><Text style={s.familyTitle}>{f.label}</Text>{!compact?<Text style={s.familyDesc}>{f.description}</Text>:null}</View><Text style={[s.familyCount,{color}]}>{value.filter(v=>SPORTS_BY_FAMILY[f.key].some(sp=>sp.key===v)).length||''}</Text></View>
        <View style={s.grid}>{SPORTS_BY_FAMILY[f.key].map(sp=><SportChip key={sp.key} sp={sp} active={value.includes(sp.key)} onPress={()=>toggle(sp.key)}/>)}</View>
      </View>})}
    {!!value.length&&<View style={s.selectedPill}><Check size={13} color={Colors.electric}/><Text style={s.selected}>{value.length} sport{value.length>1?'s':''} sélectionné{value.length>1?'s':''}</Text></View>}
  </View>
}

function SportChip({sp,active,onPress}:{sp:any;active:boolean;onPress:()=>void}){return <TouchableOpacity style={[s.chip,active&&{borderColor:sp.color,backgroundColor:sp.color+'10'}]} onPress={onPress} activeOpacity={.75}>
  <View style={[s.sportDot,{backgroundColor:sp.color}]}/><Text style={[s.label,active&&{color:sp.color,fontWeight:FontWeight.bold}]}>{sp.shortLabel??sp.label}</Text>{active?<View style={[s.check,{backgroundColor:sp.color}]}><Check size={10} color="#fff" strokeWidth={3}/></View>:null}
</TouchableOpacity>}

const s=StyleSheet.create({wrap:{gap:Spacing.lg},search:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:Colors.bgCard,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.lg,paddingHorizontal:13,...Shadow.sm},searchInput:{flex:1,paddingVertical:12,color:Colors.textPrimary},family:{gap:11,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:14,borderWidth:1,borderColor:Colors.borderLight,...Shadow.sm},familyHead:{flexDirection:'row',gap:10,alignItems:'center'},familyIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:1},familyTitle:{fontSize:FontSize.md,fontWeight:FontWeight.extrabold,color:Colors.textPrimary},familyDesc:{fontSize:FontSize.xs,color:Colors.textSecondary,marginTop:2,lineHeight:16},familyCount:{fontSize:18,fontWeight:FontWeight.extrabold},grid:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:8,borderRadius:Radius.full,backgroundColor:Colors.bgElevated,borderWidth:1,borderColor:Colors.border},sportDot:{width:7,height:7,borderRadius:4},label:{fontSize:FontSize.sm,color:Colors.textPrimary},check:{width:17,height:17,borderRadius:9,alignItems:'center',justifyContent:'center'},selectedPill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:5,backgroundColor:Colors.electricDim,paddingHorizontal:10,paddingVertical:6,borderRadius:99},selected:{fontSize:FontSize.sm,color:Colors.electric,fontWeight:FontWeight.semibold}})
