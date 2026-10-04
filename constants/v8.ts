export type CardThemeId='midnight'|'aurora'|'ember'|'ocean'|'forest'|'solar'|'mono'|'cyber'
export type CardFrameId='clean'|'electric'|'champion'|'hologram'|'legend'
export type CompanionSpecies='wolf'|'falcon'|'fox'|'robot'|'panther'|'dragon'
export type CompanionMood='calm'|'hype'|'focus'|'proud'
export type RoomTheme='studio'|'loft'|'mountain'|'cyber'|'arena'
export type StoryTemplate='clean'|'race'|'neon'|'summit'|'music'|'minimal'

export const V8_CARD_THEMES={
 midnight:{id:'midnight',name:'Midnight',colors:['#060B1C','#172554','#312E81'],accent:'#67E8F9'},
 aurora:{id:'aurora',name:'Aurora',colors:['#052E2B','#0F766E','#312E81'],accent:'#5EEAD4'},
 ember:{id:'ember',name:'Ember',colors:['#2B0B0B','#991B1B','#F97316'],accent:'#FBBF24'},
 ocean:{id:'ocean',name:'Ocean',colors:['#082F49','#0369A1','#06B6D4'],accent:'#BAE6FD'},
 forest:{id:'forest',name:'Forest',colors:['#052E16','#166534','#65A30D'],accent:'#BEF264'},
 solar:{id:'solar',name:'Solar',colors:['#3B2400','#B45309','#F59E0B'],accent:'#FEF3C7'},
 mono:{id:'mono',name:'Monochrome',colors:['#09090B','#27272A','#52525B'],accent:'#F4F4F5'},
 cyber:{id:'cyber',name:'Cyber',colors:['#09001F','#4C1D95','#DB2777'],accent:'#22D3EE'},
} as const
export const V8_CARD_THEME_LIST=Object.values(V8_CARD_THEMES)

export const V8_CARD_FRAMES={
 clean:{id:'clean',name:'Clean',price:0,level:1,color:'#FFFFFF'},
 electric:{id:'electric',name:'Electric',price:600,level:5,color:'#38BDF8'},
 champion:{id:'champion',name:'Champion',price:1300,level:10,color:'#FBBF24'},
 hologram:{id:'hologram',name:'Hologram',price:2100,level:15,color:'#C084FC'},
 legend:{id:'legend',name:'Legend',price:4200,level:22,color:'#F43F5E'},
} as const
export const V8_CARD_FRAME_LIST=Object.values(V8_CARD_FRAMES)

export type CompanionDef={id:string;species:CompanionSpecies;name:string;rarity:'common'|'rare'|'epic'|'legendary';price:number;level:number;color:string;color2:string;trait:string}
export const V8_COMPANIONS:CompanionDef[]=[
 {id:'wolf_nova',species:'wolf',name:'Nova',rarity:'common',price:0,level:1,color:'#64748B',color2:'#CBD5E1',trait:'Régularité'},
 {id:'fox_spark',species:'fox',name:'Spark',rarity:'rare',price:850,level:5,color:'#F97316',color2:'#FDE68A',trait:'Agilité'},
 {id:'falcon_vega',species:'falcon',name:'Vega',rarity:'rare',price:900,level:6,color:'#0EA5E9',color2:'#E0F2FE',trait:'Vitesse'},
 {id:'robot_pulse',species:'robot',name:'Pulse',rarity:'epic',price:1800,level:10,color:'#6366F1',color2:'#22D3EE',trait:'Précision'},
 {id:'panther_noir',species:'panther',name:'Noir',rarity:'epic',price:2200,level:12,color:'#18181B',color2:'#A78BFA',trait:'Puissance'},
 {id:'dragon_kaizen',species:'dragon',name:'Kaizen',rarity:'legendary',price:5200,level:20,color:'#7C3AED',color2:'#F43F5E',trait:'Progression'},
]

export const V8_COMPANION_GEAR=[
 {id:'collar_blue',name:'Collier électrique',price:280,color:'#38BDF8'},
 {id:'collar_gold',name:'Collier champion',price:620,color:'#F59E0B'},
 {id:'scarf_red',name:'Bandana rouge',price:420,color:'#EF4444'},
 {id:'visor_cyan',name:'Visière cyber',price:900,color:'#22D3EE'},
 {id:'halo_violet',name:'Halo violet',price:1500,color:'#A855F7'},
]

export const V8_ROOM_THEMES:{id:RoomTheme;name:string;colors:[string,string];price:number;level:number}[]=[
 {id:'studio',name:'Training Studio',colors:['#F8FAFC','#E2E8F0'],price:0,level:1},
 {id:'loft',name:'Athlete Loft',colors:['#1E293B','#475569'],price:800,level:6},
 {id:'mountain',name:'Altitude Base',colors:['#0F172A','#0E7490'],price:1600,level:11},
 {id:'cyber',name:'Cyber Lab',colors:['#1E0A3C','#4C1D95'],price:2400,level:15},
 {id:'arena',name:'Hall of Champions',colors:['#3B2600','#92400E'],price:4200,level:20},
]

export const V8_WORLD_STOPS=[
 {id:'paris',name:'Paris',subtitle:'Start Line',sessions:0,km:0,color:'#315CFF',icon:'✦',reward:'Carte Paris'},
 {id:'oslo',name:'Oslo',subtitle:'Endurance Lab',sessions:5,km:20,color:'#38BDF8',icon:'❄',reward:'Fond Aurora'},
 {id:'barcelona',name:'Barcelona',subtitle:'Motion District',sessions:12,km:60,color:'#F97316',icon:'☀',reward:'Tenue Coastline'},
 {id:'tokyo',name:'Tokyo',subtitle:'Precision Circuit',sessions:25,km:130,color:'#EC4899',icon:'✿',reward:'Compagnon Vega'},
 {id:'chamonix',name:'Chamonix',subtitle:'Altitude Quest',sessions:45,km:250,color:'#8B5CF6',icon:'▲',reward:'Trophée Summit'},
 {id:'rio',name:'Rio',subtitle:'Energy Coast',sessions:65,km:420,color:'#22C55E',icon:'◆',reward:'Aura Solar'},
 {id:'newyork',name:'New York',subtitle:'Night Run',sessions:90,km:650,color:'#06B6D4',icon:'▰',reward:'Cadre Hologram'},
 {id:'world',name:'World Finals',subtitle:'Hybrid Legend',sessions:130,km:1000,color:'#F59E0B',icon:'★',reward:'Hall of Champions'},
] as const

export const V8_STORY_TEMPLATES:{id:StoryTemplate;name:string;colors:[string,string,string];accent:string}[]=[
 {id:'clean',name:'Clean',colors:['#F8FAFC','#EEF2FF','#FFFFFF'],accent:'#315CFF'},
 {id:'race',name:'Race Day',colors:['#09090B','#18181B','#27272A'],accent:'#F43F5E'},
 {id:'neon',name:'Neon',colors:['#120029','#4C1D95','#BE185D'],accent:'#22D3EE'},
 {id:'summit',name:'Summit',colors:['#082F49','#0E7490','#A7F3D0'],accent:'#F8FAFC'},
 {id:'music',name:'Soundtrack',colors:['#0F172A','#1D4ED8','#7C3AED'],accent:'#FBBF24'},
 {id:'minimal',name:'Minimal',colors:['#FFFFFF','#F4F4F5','#E4E4E7'],accent:'#18181B'},
]

export const V8_SEASON={
 id:'season_08',name:'WORLD / 01',subtitle:'Build your world through sport',starts:'2026-10-01',ends:'2026-12-31',accent:'#7C3AED',
 tiers:[
  {tier:1,xp:0,reward:'World / 01 Badge'},
  {tier:2,xp:800,reward:'200 crédits'},
  {tier:3,xp:1800,reward:'Carte Aurora'},
  {tier:4,xp:3200,reward:'Capsule Argent'},
  {tier:5,xp:5200,reward:'Companion Gear'},
  {tier:6,xp:7800,reward:'Cadre Electric'},
  {tier:7,xp:11000,reward:'Tenue World Tour'},
  {tier:8,xp:15000,reward:'Trophée Season 08'},
 ],
} as const

export const V8_TITLES=[
 'Hybrid Athlete','Night Runner','Iron Legs','Racket Mind','Endurance Engine','Power Builder','Summit Hunter','Multi-Sport Nomad','Recovery Master','World Challenger'
]
