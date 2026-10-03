import React,{useMemo,useState}from'react'
import{View,Text,TextInput,TouchableOpacity,StyleSheet}from'react-native'
import{Search}from'lucide-react-native'
import{Colors,FontSize,FontWeight,Radius,Spacing}from'@/constants/theme'
import{SPORT_BY_KEY,SPORT_FAMILIES,SPORTS_BY_FAMILY,searchSports}from'@/constants/sportCatalog'
import type{SportType}from'@/types/database'
export function SportActivityPicker({value,onChange,favorites=[]}:{value:SportType|null;onChange:(v:SportType)=>void;favorites?:SportType[]}){const[q,setQ]=useState('');const results=useMemo(()=>searchSports(q),[q]);const fav=favorites.map(k=>SPORT_BY_KEY[k]).filter(Boolean);return <View style={s.wrap}>
<View style={s.search}><Search size={15} color={Colors.textTertiary}/><TextInput value={q} onChangeText={setQ} placeholder="Rechercher parmi tous les sports…" placeholderTextColor={Colors.textTertiary} style={s.input}/></View>
{q?<View style={s.grid}>{results.map(sp=><Chip key={sp.key} sp={sp} active={value===sp.key} onPress={()=>onChange(sp.key)}/>)}</View>:<>
{!!fav.length&&<View><Text style={s.title}>Tes sports</Text><View style={s.grid}>{fav.map(sp=><Chip key={sp.key} sp={sp} active={value===sp.key} onPress={()=>onChange(sp.key)}/>)}</View></View>}
{SPORT_FAMILIES.map(f=><View key={f.key}><Text style={s.title}>{f.emoji} {f.label}</Text><View style={s.grid}>{SPORTS_BY_FAMILY[f.key].map(sp=><Chip key={sp.key} sp={sp} active={value===sp.key} onPress={()=>onChange(sp.key)}/>)}</View></View>)}</>}
</View>}
function Chip({sp,active,onPress}:{sp:any;active:boolean;onPress:()=>void}){return <TouchableOpacity onPress={onPress} style={[s.chip,active&&{borderColor:sp.color,backgroundColor:sp.color+'15'}]}><Text>{sp.emoji}</Text><Text style={[s.chipText,active&&{color:sp.color,fontWeight:FontWeight.bold}]}>{sp.shortLabel??sp.label}</Text></TouchableOpacity>}
const s=StyleSheet.create({wrap:{gap:16},search:{flexDirection:'row',alignItems:'center',gap:7,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,backgroundColor:Colors.bgCard,paddingHorizontal:11},input:{flex:1,paddingVertical:10,color:Colors.textPrimary},title:{fontSize:FontSize.sm,fontWeight:FontWeight.bold,color:Colors.textSecondary,marginBottom:7,marginTop:4},grid:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{flexDirection:'row',alignItems:'center',gap:5,borderWidth:1,borderColor:Colors.border,backgroundColor:Colors.bgCard,borderRadius:Radius.full,paddingHorizontal:10,paddingVertical:8},chipText:{fontSize:FontSize.sm,color:Colors.textPrimary}})
