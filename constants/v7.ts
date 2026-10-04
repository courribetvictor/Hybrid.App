export type V7Rarity = 'common'|'rare'|'epic'|'legendary'
export type CosmeticSlot = 'skin'|'hair'|'brows'|'facialhair'|'face'|'ears'|'head'|'neck'|'top'|'patch'|'tattoo'|'wrists'|'waist'|'bottom'|'socks'|'shoes'|'back'|'aura'
export type CosmeticItem = {
  id:string; name:string; slot:CosmeticSlot; rarity:V7Rarity; price:number; level:number;
  color:string; color2?:string; styleKey:string; icon:string; pro?:boolean; starter?:boolean
}

export const V7_RARITY = {
  common:{label:'Commun',color:'#94A3B8',multiplier:1},
  rare:{label:'Rare',color:'#38BDF8',multiplier:1.35},
  epic:{label:'Épique',color:'#A855F7',multiplier:1.8},
  legendary:{label:'Légendaire',color:'#F59E0B',multiplier:2.5},
} as const

const palettes = [
  ['#0F172A','#334155'],['#315CFF','#06B6D4'],['#EF4444','#FB7185'],['#16A34A','#84CC16'],
  ['#7C3AED','#EC4899'],['#F97316','#FACC15'],['#14B8A6','#22D3EE'],['#E11D48','#F43F5E'],
  ['#8B5CF6','#A78BFA'],['#0284C7','#38BDF8'],['#111827','#F8FAFC'],['#B45309','#F59E0B'],
]
const rarities:V7Rarity[]=['common','common','rare','rare','epic','legendary']
const priceFor=(r:V7Rarity,i:number)=>({common:180,rare:480,epic:1100,legendary:2600}[r]+i*35)
const levelFor=(r:V7Rarity,i:number)=>({common:1,rare:4,epic:9,legendary:16}[r]+Math.floor(i/6))

const build=(slot:CosmeticSlot, styles:{key:string;name:string;icon:string}[], countPerStyle=4):CosmeticItem[]=>{
  const out:CosmeticItem[]=[]
  styles.forEach((s,si)=>Array.from({length:countPerStyle}).forEach((_,vi)=>{
    const i=si*countPerStyle+vi
    const rarity=rarities[(i+si)%rarities.length]
    const [color,color2]=palettes[(i+si*2)%palettes.length]
    out.push({id:`${slot}_${s.key}_${vi+1}`,name:`${s.name} ${vi+1}`,slot,rarity,price:priceFor(rarity,i),level:levelFor(rarity,i),color,color2,styleKey:s.key,icon:s.icon})
  }))
  return out
}

const skin:CosmeticItem[]=[
  {id:'skin_1',name:'Teint I',slot:'skin',rarity:'common',price:0,level:1,color:'#F1C7A5',styleKey:'skin',icon:'🙂',starter:true},
  {id:'skin_2',name:'Teint II',slot:'skin',rarity:'common',price:0,level:1,color:'#DFAF87',styleKey:'skin',icon:'🙂',starter:true},
  {id:'skin_3',name:'Teint III',slot:'skin',rarity:'common',price:0,level:1,color:'#B77B54',styleKey:'skin',icon:'🙂',starter:true},
  {id:'skin_4',name:'Teint IV',slot:'skin',rarity:'common',price:0,level:1,color:'#7A4A31',styleKey:'skin',icon:'🙂',starter:true},
  {id:'skin_5',name:'Teint V',slot:'skin',rarity:'common',price:0,level:1,color:'#4A2B20',styleKey:'skin',icon:'🙂',starter:true},
]
const hair=build('hair',[{key:'crop',name:'Crop',icon:'✂️'},{key:'flow',name:'Flow',icon:'〰️'},{key:'spike',name:'Spike',icon:'⚡'},{key:'curly',name:'Boucles',icon:'🌀'},{key:'fade',name:'Fade',icon:'◧'},{key:'waves',name:'Waves',icon:'≈'},{key:'afro',name:'Afro',icon:'◉'},{key:'braids',name:'Tresses',icon:'≋'},{key:'bun',name:'Bun',icon:'●'}],6)
const brows=build('brows',[{key:'soft',name:'Sourcils Soft',icon:'⌒'},{key:'straight',name:'Sourcils Droits',icon:'—'},{key:'bold',name:'Sourcils Bold',icon:'▬'},{key:'split',name:'Sourcil Fendu',icon:'⌁'}],4)
const facialhair=build('facialhair',[{key:'stubble',name:'Barbe Courte',icon:'⋯'},{key:'goatee',name:'Bouclier',icon:'▽'},{key:'mustache',name:'Moustache',icon:'⌁'},{key:'full',name:'Barbe Pleine',icon:'◒'}],4)
const face=build('face',[{key:'sportglasses',name:'Lunettes Sport',icon:'◉'},{key:'visor',name:'Visière',icon:'◇'},{key:'mask',name:'Masque',icon:'◩'},{key:'paint',name:'Face Paint',icon:'✦'}],5)
const ears=build('ears',[{key:'studs',name:'Clous',icon:'✦'},{key:'hoops',name:'Anneaux',icon:'○'},{key:'earbuds',name:'Écouteurs',icon:'◉'},{key:'clips',name:'Clips',icon:'◇'}],4)
const head=build('head',[{key:'cap',name:'Casquette',icon:'🧢'},{key:'headband',name:'Bandeau',icon:'🎽'},{key:'beanie',name:'Bonnet',icon:'⛄'},{key:'crown',name:'Couronne Hybrid',icon:'👑'}],5)
const neck=build('neck',[{key:'chain',name:'Chaîne',icon:'◇'},{key:'towel',name:'Serviette',icon:'▱'},{key:'scarf',name:'Tour de cou',icon:'≈'}],5)
const tops=build('top',[{key:'jersey',name:'Maillot',icon:'👕'},{key:'compression',name:'Compression',icon:'🦾'},{key:'tank',name:'Débardeur',icon:'🏋️'},{key:'hoodie',name:'Hoodie',icon:'🧥'},{key:'prokit',name:'Pro Kit',icon:'✨'},{key:'windbreaker',name:'Coupe-vent',icon:'◢'},{key:'oversized',name:'Oversized Tee',icon:'▰'},{key:'varsity',name:'Varsity',icon:'V'},{key:'tracksuit',name:'Track Jacket',icon:'▥'}],6)
const patches=build('patch',[{key:'chest',name:'Patch Poitrine',icon:'✦'},{key:'sleeve',name:'Patch Manche',icon:'◆'},{key:'number',name:'Numéro',icon:'#'},{key:'club',name:'Écusson Club',icon:'◈'}],4)
const tattoos=build('tattoo',[{key:'forearm',name:'Tatouage Avant-bras',icon:'⌁'},{key:'sleeve',name:'Sleeve Ink',icon:'◫'},{key:'neck',name:'Tatouage Cou',icon:'✧'},{key:'leg',name:'Tatouage Jambe',icon:'╱'}],4)
const wrists=build('wrists',[{key:'bands',name:'Poignets',icon:'🎾'},{key:'gloves',name:'Gants',icon:'🥊'},{key:'watch',name:'Montre',icon:'⌚'},{key:'wraps',name:'Bandages',icon:'🩹'}],4)
const waist=build('waist',[{key:'belt',name:'Ceinture',icon:'▬'},{key:'waistpack',name:'Banane',icon:'▰'},{key:'racebelt',name:'Ceinture Running',icon:'≈'},{key:'towelbelt',name:'Serviette taille',icon:'▱'}],4)
const bottoms=build('bottom',[{key:'shorts',name:'Short',icon:'🩳'},{key:'joggers',name:'Jogging',icon:'👖'},{key:'leggings',name:'Legging',icon:'🏃'},{key:'fightshorts',name:'Fight Shorts',icon:'🥋'},{key:'cargo',name:'Cargo Sport',icon:'▥'},{key:'splitshort',name:'Split Short',icon:'◫'}],6)
const socks=build('socks',[{key:'crew',name:'Chaussettes Crew',icon:'▯'},{key:'ankle',name:'Chaussettes Low',icon:'▱'},{key:'compression',name:'Compression',icon:'▥'},{key:'striped',name:'Rayées',icon:'≡'}],4)
const shoes=build('shoes',[{key:'trainers',name:'Trainers',icon:'👟'},{key:'racers',name:'Racing',icon:'💨'},{key:'court',name:'Court',icon:'🏸'},{key:'high',name:'High Top',icon:'🏀'},{key:'trail',name:'Trail',icon:'⛰️'}],5)
const backs=build('back',[{key:'cape',name:'Cape',icon:'◢'},{key:'pack',name:'Sac Training',icon:'▣'},{key:'wings',name:'Ailes Energy',icon:'✧'},{key:'banner',name:'Bannière',icon:'⚑'}],4)
const auras=build('aura',[{key:'pulse',name:'Pulse',icon:'⭕'},{key:'flame',name:'Flamme',icon:'🔥'},{key:'neon',name:'Néon',icon:'✨'},{key:'storm',name:'Storm',icon:'⚡'}],4)

export const V7_COSMETICS:CosmeticItem[]=[...skin,...hair,...brows,...facialhair,...face,...ears,...head,...neck,...tops,...patches,...tattoos,...wrists,...waist,...bottoms,...socks,...shoes,...backs,...auras]
export const V7_ITEM_BY_ID=Object.fromEntries(V7_COSMETICS.map(x=>[x.id,x])) as Record<string,CosmeticItem>
export const V7_SLOTS:CosmeticSlot[]=['skin','hair','brows','facialhair','face','ears','head','neck','top','patch','tattoo','wrists','waist','bottom','socks','shoes','back','aura']
export const V7_SLOT_LABEL:Record<CosmeticSlot,string>={skin:'Peau',hair:'Cheveux',brows:'Sourcils',facialhair:'Barbe',face:'Visage',ears:'Bijoux oreilles',head:'Tête',neck:'Cou',top:'Haut',patch:'Patchs',tattoo:'Tatouages',wrists:'Poignets',waist:'Taille',bottom:'Bas',socks:'Chaussettes',shoes:'Chaussures',back:'Dos',aura:'Aura'}

export const V7_STARTER_EQUIPMENT:Record<CosmeticSlot,string|undefined>={
  skin:'skin_2',hair:'hair_crop_1',brows:undefined,facialhair:undefined,face:undefined,ears:undefined,head:undefined,neck:undefined,top:'top_jersey_1',patch:undefined,tattoo:undefined,wrists:undefined,waist:undefined,bottom:'bottom_shorts_1',socks:undefined,shoes:'shoes_trainers_1',back:undefined,aura:undefined,
}
export const V7_STARTER_OWNED=['skin_1','skin_2','skin_3','skin_4','skin_5','hair_crop_1','top_jersey_1','bottom_shorts_1','shoes_trainers_1']

export const V7_DAILY_REWARDS=[60,80,100,130,170,220,400]
export const V7_BOOSTS=[
  {id:'xp_2h',name:'Double XP',description:'XP ×2 pendant 2 h',minutes:120,multiplier:2,cost:450,icon:'⚡'},
  {id:'coins_2h',name:'Double Crédits',description:'Crédits ×2 pendant 2 h',minutes:120,multiplier:2,cost:520,icon:'💠'},
  {id:'xp_day',name:'Journée Turbo',description:'XP ×1,5 pendant 24 h',minutes:1440,multiplier:1.5,cost:900,icon:'🚀'},
] as const

export const V7_CHEST_TIERS=[
  {id:'bronze',name:'Capsule Bronze',minCoins:80,maxCoins:180,itemChance:.18,color:'#C97845'},
  {id:'silver',name:'Capsule Argent',minCoins:160,maxCoins:320,itemChance:.32,color:'#A8B3C2'},
  {id:'gold',name:'Capsule Or',minCoins:280,maxCoins:600,itemChance:.48,color:'#F5B82E'},
] as const

export const V7_DESTINATIONS=[
 {id:'oslo',name:'Oslo · Endurance Lab',sessions:5,multiplier:1.25,hours:12,chest:'bronze',color:'#38BDF8',icon:'❄️',tagline:'Construis ton moteur.'},
 {id:'barcelona',name:'Barcelona · Motion District',sessions:12,multiplier:1.35,hours:12,chest:'bronze',color:'#F97316',icon:'☀️',tagline:'Bouge vite, bouge souvent.'},
 {id:'tokyo',name:'Tokyo · Precision Circuit',sessions:25,multiplier:1.5,hours:18,chest:'silver',color:'#EC4899',icon:'🌸',tagline:'Technique, rythme, précision.'},
 {id:'chamonix',name:'Chamonix · Altitude Quest',sessions:45,multiplier:1.6,hours:18,chest:'silver',color:'#8B5CF6',icon:'🏔️',tagline:'Résilience et polyvalence.'},
 {id:'world',name:'World Hybrid Finals',sessions:80,multiplier:2,hours:24,chest:'gold',color:'#F59E0B',icon:'🌍',tagline:'Une journée entière en double XP.'},
] as const
