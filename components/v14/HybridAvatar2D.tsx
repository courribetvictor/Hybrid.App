import React from'react'
import{View,StyleSheet}from'react-native'
import Svg,{Circle,Ellipse,Path,Rect,G,Defs,LinearGradient,Stop,Pattern,Line,Polygon}from'react-native-svg'
import{V7_ITEM_BY_ID,type CosmeticSlot}from'@/constants/v7'
import{V14_BACKGROUNDS,type AvatarExpression,type AvatarPose,type AvatarBackground,type AvatarSilhouette,type AvatarFaceShape}from'@/constants/v14'

type Equip=Record<CosmeticSlot,string|undefined>
type Props={equipped:Equip;size?:number;expression?:AvatarExpression;pose?:AvatarPose;background?:AvatarBackground;silhouette?:AvatarSilhouette;faceShape?:AvatarFaceShape;grain?:number;outline?:number;compact?:boolean}

const hairPath=(style?:string)=>{
 const map:Record<string,string>={
  crop:'M75 61 Q82 34 108 34 Q137 32 147 61 Q112 46 75 61Z',
  flow:'M71 67 Q67 27 103 28 Q142 26 152 58 Q151 80 136 93 L137 61 Q105 45 71 67Z',
  spike:'M72 65 L80 31 L91 43 L102 24 L113 41 L128 25 L142 38 L150 68 Q111 46 72 65Z',
  curly:'M73 64 Q72 42 87 43 Q92 25 108 37 Q121 24 132 39 Q149 34 150 57 Q155 68 142 72 Q111 47 73 64Z',
  fade:'M78 61 Q83 37 109 35 Q136 35 144 58 L140 66 Q111 49 78 61Z',
  waves:'M73 63 Q83 33 109 34 Q137 32 148 61 Q132 52 119 55 Q106 47 93 54 Q82 51 73 63Z',
  afro:'M71 65 Q62 45 77 36 Q80 21 96 23 Q109 10 123 24 Q143 18 148 38 Q160 48 149 67 Q113 44 71 65Z',
  braids:'M76 62 Q83 33 110 34 Q137 34 145 62 L140 70 Q114 49 79 65Z',
  bun:'M77 62 Q83 37 109 35 Q136 34 144 61 Q111 47 77 62Z',
 }
 return map[style??'crop']??map.crop
}
const mouth=(e:AvatarExpression)=>e==='smile'||e==='excited'||e==='proud'?'M96 84 Q110 96 124 84':e==='tired'?'M99 90 Q110 85 121 90':e==='confident'||e==='chill'?'M100 86 Q113 91 123 84':e==='fierce'?'M100 90 Q110 85 121 89':'M101 87 Q110 89 119 87'
const eyeY=(e:AvatarExpression)=>e==='tired'?73:70
export function HybridAvatar2D({equipped,size=320,expression='neutral',pose='casual',background='paper',silhouette='athletic',faceShape='oval',grain=.28,outline=1,compact=false}:Props){
 const get=(slot:CosmeticSlot)=>equipped[slot]?V7_ITEM_BY_ID[equipped[slot] as string]:undefined
 const skin=get('skin')?.color??'#DFAF87',hair=get('hair'),brows=get('brows'),facialhair=get('facialhair'),face=get('face'),ears=get('ears'),head=get('head'),neck=get('neck'),top=get('top'),patch=get('patch'),tattoo=get('tattoo'),wrists=get('wrists'),waist=get('waist'),bottom=get('bottom'),socks=get('socks'),shoes=get('shoes'),back=get('back'),aura=get('aura')
 const bg=V14_BACKGROUNDS.find(x=>x.id===background)??V14_BACKGROUNDS[0]
 const poseArmL=pose==='runner'?-20:pose==='victory'?-62:pose==='power'?-24:pose==='ready'?-10:pose==='boxing'?-32:pose==='racket'?-48:pose==='flex'?-58:pose==='stretch'?-34:7
 const poseArmR=pose==='runner'?24:pose==='victory'?62:pose==='power'?24:pose==='ready'?10:pose==='boxing'?34:pose==='racket'?34:pose==='flex'?58:pose==='stretch'?34:-7
 const bodyTilt=pose==='runner'?-4:pose==='casual'?2:pose==='racket'?-2:0
 const leftLeg=pose==='runner'?-9:pose==='ready'?-3:pose==='stretch'?-7:0,rightLeg=pose==='runner'?10:pose==='ready'?3:pose==='stretch'?7:0
 const line='#17181B',sw=Math.max(.8,outline*1.25),bodyScale=silhouette==='slim'?.90:silhouette==='power'?1.11:1
 const headPath=faceShape==='angular'?'M80 57 Q88 36 108 33 Q134 31 145 53 L143 82 Q132 100 110 103 Q88 100 77 82Z':faceShape==='soft'?'M78 58 Q84 35 108 33 Q134 31 146 54 Q151 76 139 92 Q127 103 109 103 Q91 102 79 91 Q70 75 78 58Z':'M79 59 Q84 37 107 33 Q133 30 146 51 Q153 72 143 89 Q132 102 111 102 Q90 102 79 88 Q71 75 79 59Z'
 const browColor=brows?.color??hair?.color??'#2B211D'
 return <View style={[s.wrap,{width:size,height:size}]}><Svg width={size} height={size} viewBox="0 0 220 220">
  <Defs>
   <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={bg.colors[0]}/><Stop offset=".7" stopColor={bg.colors[1]}/><Stop offset="1" stopColor={bg.colors[2]} stopOpacity={background==='paper'||background==='minimal'||background==='studio'?'.15':'.72'}/></LinearGradient>
   <Pattern id="grain" width="16" height="16" patternUnits="userSpaceOnUse"><Circle cx="3" cy="5" r=".7" fill="#0F172A" opacity={grain*.12}/><Circle cx="12" cy="10" r=".5" fill="#0F172A" opacity={grain*.08}/><Line x1="1" y1="15" x2="15" y2="1" stroke="#0F172A" strokeWidth=".35" opacity={grain*.055}/></Pattern>
   <LinearGradient id="shirtShade" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={top?.color??'#151A22'}/><Stop offset="1" stopColor={top?.color2??top?.color??'#283348'}/></LinearGradient>
  </Defs>
  <Rect x="4" y="4" width="212" height="212" rx="24" fill="url(#bg)"/><Rect x="4" y="4" width="212" height="212" rx="24" fill="url(#grain)"/>
  {(background==='paper'||background==='studio')&&<G opacity=".13"><Path d="M16 42 L75 18 M144 24 L204 56 M16 179 L76 201" stroke="#111827" strokeWidth="4"/><Path d="M30 32 Q50 48 66 36 M160 177 Q181 160 202 176" stroke="#315CFF" strokeWidth="2"/></G>}
  {background==='track'&&<G opacity=".28"><Path d="M10 177 Q109 135 210 177" fill="none" stroke="#fff" strokeWidth="3"/><Path d="M8 195 Q109 149 212 195" fill="none" stroke="#fff" strokeWidth="2"/></G>}
  {background==='court'&&<G opacity=".22"><Rect x="25" y="145" width="170" height="55" fill="none" stroke="#fff" strokeWidth="2"/><Line x1="110" y1="145" x2="110" y2="200" stroke="#fff" strokeWidth="2"/></G>}
  {background==='pool'&&<G opacity=".32"><Path d="M12 170 Q40 162 68 170 T124 170 T180 170 T228 170" fill="none" stroke="#fff" strokeWidth="3"/><Path d="M12 188 Q40 180 68 188 T124 188 T180 188 T228 188" fill="none" stroke="#fff" strokeWidth="2"/></G>}
  {background==='stadium'&&<G opacity=".18"><Path d="M15 160 Q110 120 205 160 L205 195 L15 195Z" fill="#fff"/><Line x1="30" y1="155" x2="30" y2="196" stroke="#fff" strokeWidth="2"/><Line x1="190" y1="155" x2="190" y2="196" stroke="#fff" strokeWidth="2"/></G>}
  {background==='forest'&&<G opacity=".22"><Path d="M30 160 L50 105 L69 160Z M58 166 L82 98 L104 166Z M142 164 L165 100 L189 164Z" fill="#173A2B"/></G>}
  {background==='ring'&&<G opacity=".34"><Line x1="12" y1="150" x2="208" y2="150" stroke="#fff" strokeWidth="3"/><Line x1="12" y1="166" x2="208" y2="166" stroke="#fff" strokeWidth="3"/></G>}
  {aura&&<G opacity={aura.rarity==='legendary'?.55:.34}><Ellipse cx="110" cy="113" rx="75" ry="91" fill="none" stroke={aura.color} strokeWidth={aura.rarity==='legendary'?7:4}/><Path d="M48 137 Q37 108 52 82 M171 137 Q184 106 166 78" fill="none" stroke={aura.color2??aura.color} strokeWidth="3" strokeLinecap="round"/></G>}
  <G transform={`translate(${110*(1-bodyScale)} 0) scale(${bodyScale} 1) rotate(${bodyTilt} 110 125)`}>
   {back?.styleKey==='cape'&&<Path d="M75 99 Q110 80 146 98 L157 177 Q113 201 63 177Z" fill={back.color} stroke={line} strokeWidth={sw} opacity=".88"/>}
   {back?.styleKey==='pack'&&<G><Rect x="73" y="99" width="72" height="74" rx="16" fill={back.color} stroke={line} strokeWidth={sw}/><Path d="M79 105 Q61 119 70 160 M139 105 Q158 119 149 160" fill="none" stroke={back.color2??'#64748B'} strokeWidth="5"/></G>}
   {back?.styleKey==='wings'&&<><Path d="M77 106 Q38 77 27 121 Q49 139 79 130Z" fill={back.color} stroke={line} strokeWidth={sw}/><Path d="M143 106 Q183 77 194 121 Q172 139 141 130Z" fill={back.color2??back.color} stroke={line} strokeWidth={sw}/></>}
   <G transform={`rotate(${leftLeg} 92 160)`}><Path d="M75 151 Q87 145 103 151 L101 192 Q88 199 78 190Z" fill={bottom?.color??'#20242A'} stroke={line} strokeWidth={sw}/>{socks&&<Rect x="77" y="180" width="24" height="15" rx="4" fill={socks.color}/>}<Path d="M74 188 Q87 184 103 190 L106 198 Q91 205 69 199Z" fill={shoes?.color??'#ECEFF3'} stroke={line} strokeWidth={sw}/><Path d="M76 193 L100 191" stroke={shoes?.color2??'#315CFF'} strokeWidth="2"/></G>
   <G transform={`rotate(${rightLeg} 128 160)`}><Path d="M117 151 Q133 145 145 151 L142 191 Q130 199 119 191Z" fill={bottom?.color2??bottom?.color??'#20242A'} stroke={line} strokeWidth={sw}/>{socks&&<Rect x="119" y="180" width="24" height="15" rx="4" fill={socks.color2??socks.color}/>}<Path d="M116 190 Q132 184 145 190 L151 198 Q130 205 113 199Z" fill={shoes?.color2??shoes?.color??'#ECEFF3'} stroke={line} strokeWidth={sw}/><Path d="M120 193 L143 191" stroke={shoes?.color2??'#315CFF'} strokeWidth="2"/></G>
   <G transform={`rotate(${poseArmL} 71 110)`}><Path d="M64 104 Q54 118 57 148 Q63 158 72 149 L81 114Z" fill="url(#shirtShade)" stroke={line} strokeWidth={sw}/>{tattoo&&(tattoo.styleKey==='forearm'||tattoo.styleKey==='sleeve')&&<Path d="M59 124 Q66 129 61 144 M62 129 L70 137" fill="none" stroke={tattoo.color} strokeWidth="2" opacity=".8"/>}<Circle cx="61" cy="151" r="8" fill={skin} stroke={line} strokeWidth={sw}/>{wrists&&<Rect x="53" y="139" width="16" height="9" rx="4" fill={wrists.color}/>}</G>
   <G transform={`rotate(${poseArmR} 149 110)`}><Path d="M156 104 Q166 118 163 148 Q157 158 148 149 L139 114Z" fill="url(#shirtShade)" stroke={line} strokeWidth={sw}/><Circle cx="159" cy="151" r="8" fill={skin} stroke={line} strokeWidth={sw}/>{wrists&&<Rect x="151" y="139" width="16" height="9" rx="4" fill={wrists.color2??wrists.color}/>}</G>
   <Path d="M74 104 Q110 83 147 103 L142 159 Q109 170 78 158Z" fill="url(#shirtShade)" stroke={line} strokeWidth={sw}/>
   <Path d="M81 111 Q111 96 141 110" fill="none" stroke={top?.color2??'#315CFF'} strokeWidth="3.2" strokeLinecap="round" opacity=".9"/>
   <Path d="M84 131 Q110 140 138 131 M85 145 Q110 152 136 145" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".13"/>
   {top?.styleKey==='hoodie'&&<Path d="M88 105 Q109 81 132 104" fill="none" stroke={top.color2??'#315CFF'} strokeWidth="8" opacity=".5"/>}
   {top?.styleKey==='windbreaker'&&<Path d="M110 101 L110 157" stroke={top.color2??'#E2E8F0'} strokeWidth="2.5" opacity=".8"/>}
   {top?.styleKey==='varsity'&&<><Path d="M77 111 L91 158" stroke={top.color2??'#fff'} strokeWidth="3"/><Path d="M143 111 L129 158" stroke={top.color2??'#fff'} strokeWidth="3"/></>}
   {patch&&<G><Rect x="119" y="113" width="14" height="11" rx="3" fill={patch.color} stroke={line} strokeWidth=".8"/><Path d="M122 118 L130 118" stroke={patch.color2??'#fff'} strokeWidth="1.5"/></G>}
   {waist&&<G><Rect x="78" y="150" width="64" height={waist.styleKey==='waistpack'?12:6} rx="3" fill={waist.color} stroke={line} strokeWidth={sw*.65}/>{waist.styleKey==='waistpack'&&<Rect x="101" y="146" width="31" height="17" rx="6" fill={waist.color2??waist.color} stroke={line} strokeWidth={sw*.65}/>}</G>}
   {neck&&<Path d="M91 103 Q110 113 129 103" fill="none" stroke={neck.color} strokeWidth={neck.styleKey==='chain'?3:7} strokeLinecap="round"/>}
   <Path d="M100 101 L104 90 L116 90 L121 101" fill={skin} stroke={line} strokeWidth={sw}/><Path d={headPath} fill={skin} stroke={line} strokeWidth={sw}/>
   <Path d="M83 57 Q92 53 101 56" fill="none" stroke={browColor} strokeWidth={brows?.styleKey==='bold'?3.6:2.5} strokeLinecap="round"/><Path d="M119 56 Q128 52 137 57" fill="none" stroke={browColor} strokeWidth={brows?.styleKey==='bold'?3.6:2.5} strokeLinecap="round"/>
   {brows?.styleKey==='split'&&<Path d="M126 52 L124 59" stroke={skin} strokeWidth="2.5"/>}
   <Ellipse cx="96" cy={eyeY(expression)} rx="4.2" ry={expression==='tired'||expression==='chill'?1.5:3.2} fill="#16181D"/>{expression!=='wink'&&<Ellipse cx="124" cy={eyeY(expression)} rx="4.2" ry={expression==='tired'||expression==='chill'?1.5:3.2} fill="#16181D"/>}{expression==='wink'&&<Path d="M119 70 Q124 75 130 70" fill="none" stroke="#16181D" strokeWidth="2.5"/>}
   {(expression==='focused'||expression==='fierce')&&<><Path d="M88 63 L101 66" stroke="#28231F" strokeWidth="2.2"/><Path d="M119 66 L132 63" stroke="#28231F" strokeWidth="2.2"/></>}
   {ears&&<G>{ears.styleKey==='hoops'?<><Circle cx="78" cy="76" r="5" fill="none" stroke={ears.color} strokeWidth="2.4"/><Circle cx="142" cy="76" r="5" fill="none" stroke={ears.color2??ears.color} strokeWidth="2.4"/></>:<><Circle cx="78" cy="75" r={ears.styleKey==='earbuds'?4:2.6} fill={ears.color}/><Circle cx="142" cy="75" r={ears.styleKey==='earbuds'?4:2.6} fill={ears.color2??ears.color}/></>}</G>}
   <Path d={mouth(expression)} fill="none" stroke="#7C3F2A" strokeWidth={expression==='excited'?4:2.4} strokeLinecap="round"/>{expression==='excited'&&<Path d="M101 85 Q110 101 120 85Z" fill="#3B2320"/>}
   {facialhair?.styleKey==='stubble'&&<Path d="M91 86 Q110 104 129 86" fill="none" stroke={facialhair.color} strokeWidth="5" opacity=".26"/>}
   {facialhair?.styleKey==='mustache'&&<Path d="M99 83 Q104 79 110 84 Q116 79 122 83" fill="none" stroke={facialhair.color} strokeWidth="3.2"/>}
   {facialhair?.styleKey==='goatee'&&<Path d="M104 91 Q110 99 116 91 L114 100 Q110 104 106 100Z" fill={facialhair.color} opacity=".75"/>}
   {facialhair?.styleKey==='full'&&<Path d="M87 83 Q92 104 110 108 Q129 104 134 83 Q128 100 110 102 Q93 100 87 83Z" fill={facialhair.color} opacity=".7"/>}
   {face?.styleKey==='sportglasses'&&<><Path d="M83 64 Q94 59 105 64 L101 76 Q90 78 84 71Z" fill={face.color} opacity=".8"/><Path d="M115 64 Q126 59 137 64 L136 71 Q130 78 119 76Z" fill={face.color2??face.color} opacity=".8"/><Line x1="104" y1="67" x2="116" y2="67" stroke={face.color} strokeWidth="3"/></>}
   {face?.styleKey==='visor'&&<Path d="M80 61 Q110 54 140 61 L137 77 Q110 82 83 77Z" fill={face.color} opacity=".56"/>}
   {face?.styleKey==='mask'&&<Path d="M88 78 Q110 94 132 78 L128 94 Q110 106 92 94Z" fill={face.color} opacity=".88"/>}
   <Path d={hairPath(hair?.styleKey)} fill={hair?.color??'#241B18'} stroke={line} strokeWidth={sw}/>
   {hair?.styleKey==='braids'&&<G><Path d="M82 54 Q72 92 80 118" fill="none" stroke={hair.color} strokeWidth="6"/><Path d="M138 54 Q149 92 140 118" fill="none" stroke={hair.color2??hair.color} strokeWidth="6"/></G>}
   {hair?.styleKey==='bun'&&<Circle cx="110" cy="28" r="12" fill={hair.color} stroke={line} strokeWidth={sw}/>} 
   <Path d="M79 55 Q92 45 101 50 M112 42 Q125 44 140 56" fill="none" stroke={hair?.color2??'#3B2A22'} strokeWidth="1.7" opacity=".55"/>
   {head?.styleKey==='cap'&&<G><Path d="M78 54 Q109 27 143 53 L139 64 Q108 52 78 60Z" fill={head.color} stroke={line} strokeWidth={sw}/><Path d="M135 55 L159 59 L137 64Z" fill={head.color2??head.color} stroke={line} strokeWidth={sw}/></G>}
   {head?.styleKey==='headband'&&<Rect x="76" y="49" width="68" height="10" rx="4" fill={head.color} stroke={line} strokeWidth={sw}/>} {head?.styleKey==='beanie'&&<Path d="M80 57 Q82 20 110 20 Q140 21 143 58Z" fill={head.color} stroke={line} strokeWidth={sw}/>} {head?.styleKey==='crown'&&<Path d="M83 50 L88 25 L103 40 L114 18 L127 41 L142 25 L138 54Z" fill={head.color} stroke={head.color2??'#FDE68A'} strokeWidth="3"/>}
  </G>
  {!compact&&<G opacity=".42"><Path d="M18 201 L72 201" stroke={background==='paper'||background==='minimal'||background==='studio'?'#111827':'#fff'} strokeWidth="1"/><Path d="M149 201 L202 201" stroke={background==='paper'||background==='minimal'||background==='studio'?'#111827':'#fff'} strokeWidth="1"/></G>}
 </Svg></View>
}
const s=StyleSheet.create({wrap:{alignItems:'center',justifyContent:'center'}})
