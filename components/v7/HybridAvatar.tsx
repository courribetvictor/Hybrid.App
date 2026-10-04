import React from'react'
import{View,StyleSheet}from'react-native'
import Svg,{Circle,Ellipse,Path,Rect,G,Defs,LinearGradient,Stop}from'react-native-svg'
import{V7_ITEM_BY_ID,type CosmeticSlot}from'@/constants/v7'

type Equip=Record<CosmeticSlot,string|undefined>
export function HybridAvatar({equipped,size=220}:{equipped:Equip;size?:number}){
 const get=(slot:CosmeticSlot)=>equipped[slot]?V7_ITEM_BY_ID[equipped[slot] as string]:undefined
 const skin=get('skin')?.color??'#DFAF87',hair=get('hair'),face=get('face'),head=get('head'),neck=get('neck'),top=get('top'),wrists=get('wrists'),bottom=get('bottom'),shoes=get('shoes'),back=get('back'),aura=get('aura')
 return <View style={[s.wrap,{width:size,height:size}]}>
  <Svg width={size} height={size} viewBox="0 0 220 220">
   <Defs><LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={aura?.color??'#E8EEFF'} stopOpacity={aura?.styleKey==='neon'?0.65:0.25}/><Stop offset="1" stopColor={aura?.color2??'#fff'} stopOpacity="0.12"/></LinearGradient></Defs>
   <Circle cx="110" cy="110" r="103" fill="url(#bg)"/>
   {aura&&<><Circle cx="110" cy="110" r="94" fill="none" stroke={aura.color} strokeWidth={aura.rarity==='legendary'?6:3} strokeOpacity=".35"/><Circle cx="110" cy="110" r="84" fill="none" stroke={aura.color2??aura.color} strokeWidth="2" strokeOpacity=".22"/></>}
   {/* back accessories */}{back?.styleKey==='cape'&&<Path d="M72 94 Q110 72 148 94 L158 174 Q110 202 62 174Z" fill={back.color} opacity=".82"/>}{back?.styleKey==='wings'&&<><Path d="M75 102 Q37 70 31 116 Q48 132 78 126Z" fill={back.color} opacity=".72"/><Path d="M145 102 Q183 70 189 116 Q172 132 142 126Z" fill={back.color2??back.color} opacity=".72"/></>}{back?.styleKey==='pack'&&<Rect x="79" y="96" width="62" height="70" rx="18" fill={back.color} opacity=".8"/>}{back?.styleKey==='banner'&&<><Rect x="148" y="57" width="5" height="105" rx="2" fill="#64748B"/><Path d="M153 60 L190 70 L153 91Z" fill={back.color}/></>}
   {/* legs */}<Rect x="78" y="154" width="25" height="38" rx="10" fill={bottom?.color??'#1E293B'}/><Rect x="117" y="154" width="25" height="38" rx="10" fill={bottom?.color2??bottom?.color??'#1E293B'}/>
   {/* shoes */}<Ellipse cx="90" cy="194" rx="20" ry="8" fill={shoes?.color??'#334155'}/><Ellipse cx="130" cy="194" rx="20" ry="8" fill={shoes?.color2??shoes?.color??'#334155'}/>
   {/* arms */}<Rect x="52" y="100" width="25" height="58" rx="13" fill={skin} transform="rotate(8 64 129)"/><Rect x="143" y="100" width="25" height="58" rx="13" fill={skin} transform="rotate(-8 156 129)"/>
   {/* top */}<Path d="M73 98 Q110 80 147 98 L143 158 Q110 170 77 158Z" fill={top?.color??'#315CFF'}/><Path d="M96 92 L110 110 L124 92" fill="none" stroke={top?.color2??'#fff'} strokeWidth="5" strokeLinecap="round"/>
   {neck&&<Path d="M92 96 Q110 111 128 96" fill="none" stroke={neck.color} strokeWidth={neck.styleKey==='chain'?4:7} strokeLinecap="round"/>}
   {top?.styleKey==='hoodie'&&<Path d="M90 95 Q110 72 130 95" fill="none" stroke={top.color2??'#fff'} strokeWidth="8" strokeOpacity=".4"/>}
   {/* wrists */}{wrists&&<><Rect x="53" y="137" width="25" height="12" rx="5" fill={wrists.color}/><Rect x="142" y="137" width="25" height="12" rx="5" fill={wrists.color2??wrists.color}/></>}
   {/* head */}<Circle cx="110" cy="70" r="35" fill={skin}/><Circle cx="97" cy="71" r="3" fill="#111827"/><Circle cx="123" cy="71" r="3" fill="#111827"/><Path d="M99 85 Q110 92 121 85" fill="none" stroke="#7C3F2A" strokeWidth="3" strokeLinecap="round"/>
   {/* face accessories */}{face?.styleKey==='sportglasses'&&<><Rect x="82" y="63" width="23" height="13" rx="6" fill={face.color} opacity=".78"/><Rect x="115" y="63" width="23" height="13" rx="6" fill={face.color2??face.color} opacity=".78"/><Rect x="103" y="67" width="14" height="3" rx="1" fill={face.color}/></>}{face?.styleKey==='visor'&&<Rect x="80" y="61" width="60" height="18" rx="9" fill={face.color} opacity=".58"/>}{face?.styleKey==='mask'&&<Path d="M88 76 Q110 94 132 76 L128 94 Q110 107 92 94Z" fill={face.color} opacity=".8"/>}{face?.styleKey==='paint'&&<><Path d="M82 78 L99 73" stroke={face.color} strokeWidth="4" strokeLinecap="round"/><Path d="M121 73 L138 78" stroke={face.color2??face.color} strokeWidth="4" strokeLinecap="round"/></>}
   {/* hair */}{hair&&<Path d={hair.styleKey==='spike'?'M78 58 L88 28 L99 43 L110 21 L120 43 L136 29 L142 61 Q110 41 78 58Z':hair.styleKey==='curly'?'M78 58 Q82 30 102 38 Q113 22 126 39 Q142 39 142 61 Q110 43 78 58Z':hair.styleKey==='flow'?'M77 62 Q76 24 112 31 Q148 35 143 76 L134 55 Q105 44 77 62Z':'M80 56 Q89 32 112 34 Q135 36 140 58 Q108 45 80 56Z'} fill={hair.color}/>} 
   {/* head accessories */}{head?.styleKey==='cap'&&<G><Path d="M79 55 Q109 26 141 54 L136 66 Q107 53 79 60Z" fill={head.color}/><Rect x="134" y="56" width="25" height="7" rx="3" fill={head.color2??head.color}/></G>}{head?.styleKey==='headband'&&<Rect x="77" y="50" width="66" height="10" rx="5" fill={head.color}/>} {head?.styleKey==='beanie'&&<Path d="M80 55 Q83 20 110 20 Q137 20 141 55Z" fill={head.color}/>} {head?.styleKey==='crown'&&<Path d="M82 51 L88 24 L104 41 L114 19 L126 42 L141 25 L138 55Z" fill={head.color} stroke={head.color2??'#FDE68A'} strokeWidth="3"/>}
  </Svg>
 </View>
}
const s=StyleSheet.create({wrap:{alignItems:'center',justifyContent:'center'}})
