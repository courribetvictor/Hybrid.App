export type HybridRank = {
  key: string
  name: string
  short: string
  min: number
  max: number
  color: string
  color2: string
  glow: string
}

export const HYBRID_RANKS: HybridRank[] = [
  { key:'rookie', name:'Rookie', short:'R', min:0, max:149, color:'#64748B', color2:'#94A3B8', glow:'rgba(100,116,139,.25)' },
  { key:'bronze', name:'Bronze', short:'B', min:150, max:299, color:'#A85D32', color2:'#E39A68', glow:'rgba(201,120,69,.28)' },
  { key:'silver', name:'Argent', short:'A', min:300, max:449, color:'#7C899C', color2:'#D5DCE6', glow:'rgba(168,179,194,.34)' },
  { key:'gold', name:'Or', short:'O', min:450, max:599, color:'#D89A12', color2:'#FFD76B', glow:'rgba(245,184,46,.33)' },
  { key:'platinum', name:'Platine', short:'P', min:600, max:729, color:'#0F9FAE', color2:'#76E4EF', glow:'rgba(6,182,212,.32)' },
  { key:'diamond', name:'Diamant', short:'D', min:730, max:849, color:'#315CFF', color2:'#A5B8FF', glow:'rgba(49,92,255,.36)' },
  { key:'elite', name:'Élite', short:'E', min:850, max:929, color:'#7C3AED', color2:'#D5B4FF', glow:'rgba(124,58,237,.38)' },
  { key:'legend', name:'Légende', short:'L', min:930, max:1000, color:'#E11D48', color2:'#FBBF24', glow:'rgba(225,29,72,.40)' },
]

export function getHybridRank(score: number) {
  return HYBRID_RANKS.find(r => score >= r.min && score <= r.max) ?? HYBRID_RANKS[0]
}

export function getNextRank(score: number) {
  const rank = getHybridRank(score)
  const idx = HYBRID_RANKS.findIndex(r => r.key === rank.key)
  return HYBRID_RANKS[Math.min(idx + 1, HYBRID_RANKS.length - 1)]
}

export function getRankDivision(score:number){
  const rank=getHybridRank(score)
  if(rank.key==='legend') return {division:'I', label:`${rank.name} I`}
  const span=Math.max(1,rank.max-rank.min+1)
  const pct=Math.max(0,Math.min(.999,(score-rank.min)/span))
  const division=pct<1/3?'III':pct<2/3?'II':'I'
  return {division,label:`${rank.name} ${division}`}
}
