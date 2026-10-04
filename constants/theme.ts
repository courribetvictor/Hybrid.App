import type { SportType } from '@/types/database'

export const Colors = {
  bg: '#F4F7FB',
  bgAlt: '#EAF0F7',
  bgCard: '#FFFFFF',
  bgElevated: '#FBFCFE',
  border: '#DCE5F0',
  borderLight: '#EAF0F6',
  electric: '#315CFF',
  electricLight: '#6384FF',
  electricDark: '#1E3DBB',
  electricDim: 'rgba(49,92,255,.11)',
  violet: '#7C3AED',
  cyan: '#06B6D4',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#0EA5E9',
  gold: '#F5B82E',
  silver: '#A8B3C2',
  bronze: '#C97845',
}

export const SkillColors = {
  endurance: '#1587FF',
  strength: '#EF4444',
  speed: '#F59E0B',
  consistency: '#16A34A',
  versatility: '#8B5CF6',
  progression: '#EC4899',
} as const

export const FamilyColors: Record<string, string> = {
  running_endurance:'#FF6B35', cycling:'#0EA5E9', aquatic:'#06B6D4', racket:'#84CC16',
  team_ball:'#22C55E', strength_fitness:'#EF4444', combat:'#F97316', climbing_mountain:'#8B5CF6',
  winter:'#38BDF8', board_action:'#14B8A6', mind_body:'#EC4899', athletics_gymnastics:'#F59E0B',
  precision:'#A855F7', paddle_boat:'#0284C7',
}

export const FontSize = { xs:11, sm:13, md:15, lg:18, xl:24, '2xl':30, '3xl':38 }
export const FontWeight = { regular:'400' as const, medium:'500' as const, semibold:'600' as const, bold:'700' as const, extrabold:'800' as const }
export const Radius = { sm:8, md:12, lg:16, xl:24, '2xl':30, full:999 }
export const Spacing = { xs:4, sm:8, md:16, lg:24, xl:32, '2xl':40 }
export const Shadow = {
  sm:{shadowColor:'#0F172A',shadowOpacity:.05,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:2},
  md:{shadowColor:'#0F172A',shadowOpacity:.09,shadowRadius:16,shadowOffset:{width:0,height:7},elevation:5},
  lg:{shadowColor:'#0F172A',shadowOpacity:.14,shadowRadius:28,shadowOffset:{width:0,height:12},elevation:9},
  glow:{shadowColor:'#315CFF',shadowOpacity:.28,shadowRadius:18,shadowOffset:{width:0,height:7},elevation:8},
}
export const Gradients = {
  pro:['#315CFF','#7C3AED'] as [string,string],
  hero:['#172554','#243B80','#315CFF'] as [string,string,string],
  arena:['#121D42','#293B8F','#7C3AED'] as [string,string,string],
  score:['#315CFF','#06B6D4'] as [string,string],
  fire:['#F97316','#EF4444'] as [string,string],
}

export const SportColors:Record<string,string>=new Proxy({
  running:'#FF6B35',trail_running:'#D97706',cycling:'#0EA5E9',swimming:'#06B6D4',gym:'#EF4444',
  strength_training:'#DC2626',crossfit:'#F97316',badminton:'#22C55E',tennis:'#84CC16',padel:'#A3E635',
  table_tennis:'#14B8A6',athletics:'#F59E0B',football:'#16A34A',basketball:'#F97316',volleyball:'#8B5CF6',
  hiking:'#A16207',yoga:'#D946EF',boxing:'#E11D48',climbing:'#7C3AED',bouldering:'#9333EA',rowing:'#0284C7',
} as Record<string,string>,{get:(t,p:string)=>t[p]??'#315CFF'})
