export type AvatarExpression='neutral'|'smile'|'focused'|'excited'|'tired'|'confident'|'proud'|'chill'|'fierce'|'wink'
export type AvatarPose='neutral'|'runner'|'power'|'victory'|'casual'|'ready'|'stretch'|'boxing'|'racket'|'flex'
export type AvatarBackground='paper'|'urban'|'gym'|'mountain'|'track'|'court'|'night'|'minimal'|'stadium'|'pool'|'dojo'|'ring'|'beach'|'forest'|'rooftop'|'snow'|'studio'
export type AvatarCardTheme='editorial'|'street'|'performance'|'nature'|'night'|'competition'|'retro'|'academy'|'cobalt'|'mono'
export type AvatarSilhouette='slim'|'athletic'|'power'
export type AvatarFaceShape='soft'|'oval'|'angular'

export const V14_EXPRESSIONS:{id:AvatarExpression;label:string}[]=[
 {id:'neutral',label:'Neutre'},{id:'smile',label:'Sourire'},{id:'focused',label:'Focus'},
 {id:'excited',label:'Excité'},{id:'tired',label:'Fatigué'},{id:'confident',label:'Confiant'},
 {id:'proud',label:'Fier'},{id:'chill',label:'Chill'},{id:'fierce',label:'Déterminé'},{id:'wink',label:'Clin d’œil'},
]
export const V14_POSES:{id:AvatarPose;label:string}[]=[
 {id:'neutral',label:'Neutre'},{id:'casual',label:'Casual'},{id:'runner',label:'Running'},
 {id:'power',label:'Power'},{id:'ready',label:'Prêt'},{id:'victory',label:'Victoire'},
 {id:'stretch',label:'Stretch'},{id:'boxing',label:'Boxe'},{id:'racket',label:'Raquette'},{id:'flex',label:'Flex'},
]
export const V14_BACKGROUNDS:{id:AvatarBackground;label:string;colors:[string,string,string]}[]=[
 {id:'paper',label:'Carnet',colors:['#F3EFE7','#D7D0C6','#111827']},
 {id:'urban',label:'Urbain',colors:['#111827','#334155','#315CFF']},
 {id:'gym',label:'Salle',colors:['#171717','#292524','#F59E0B']},
 {id:'mountain',label:'Montagne',colors:['#DCEAF3','#7692A9','#183B56']},
 {id:'track',label:'Piste',colors:['#E8EEF7','#D35454','#17316B']},
 {id:'court',label:'Terrain',colors:['#E8F2EA','#3B7A57','#F8FAFC']},
 {id:'night',label:'Night',colors:['#07101F','#182A50','#7C3AED']},
 {id:'minimal',label:'Minimal',colors:['#F7F7F5','#E5E7EB','#111827']},
 {id:'stadium',label:'Stade',colors:['#D8E7F2','#2E5A3B','#DCE5EB']},
 {id:'pool',label:'Piscine',colors:['#DDF6FF','#39A9DB','#E7F9FF']},
 {id:'dojo',label:'Dojo',colors:['#E8E0D5','#9B2C2C','#2D2926']},
 {id:'ring',label:'Ring',colors:['#171717','#8B1E2D','#E5E7EB']},
 {id:'beach',label:'Plage',colors:['#F3E8C8','#78C6D0','#D89A5B']},
 {id:'forest',label:'Forêt',colors:['#DCE7D7','#48664B','#8A7658']},
 {id:'rooftop',label:'Rooftop',colors:['#DCE4EE','#586577','#E77C4A']},
 {id:'snow',label:'Neige',colors:['#F5FAFF','#B9D7EA','#6C8798']},
 {id:'studio',label:'Studio',colors:['#ECE8E0','#C4BFB6','#1F2937']},
]
export const V14_CARD_THEMES:{id:AvatarCardTheme;label:string;accent:string;colors:[string,string,string]}[]=[
 {id:'editorial',label:'Editorial',accent:'#315CFF',colors:['#F6F2EA','#E5E7EB','#CBD5E1']},{id:'street',label:'Street',accent:'#F8FAFC',colors:['#111827','#1F2937','#334155']},
 {id:'performance',label:'Performance',accent:'#EF4444',colors:['#190C0C','#3B1010','#7F1D1D']},{id:'nature',label:'Nature',accent:'#16A34A',colors:['#10261B','#1F4A34','#587C69']},
 {id:'night',label:'Night',accent:'#A78BFA',colors:['#090D1D','#18112F','#312E81']},{id:'competition',label:'Compétition',accent:'#F59E0B',colors:['#17130A','#3A2B0B','#7C5B10']},
 {id:'retro',label:'Retro Sport',accent:'#D97706',colors:['#F0E2C0','#D8C6A0','#6B4B2A']},
 {id:'academy',label:'Academy',accent:'#1D4ED8',colors:['#F4F1E8','#273B69','#B91C1C']},
 {id:'cobalt',label:'Cobalt',accent:'#1D4ED8',colors:['#071A3D','#0D3A83','#DCE8FF']},
 {id:'mono',label:'Mono',accent:'#111827',colors:['#F4F4F2','#B7B7B3','#1B1B1B']},
]

export type V14IdentityState={
 expression:AvatarExpression;pose:AvatarPose;background:AvatarBackground;cardTheme:AvatarCardTheme;silhouette:AvatarSilhouette;faceShape:AvatarFaceShape;
 grain:number;outline:number;photoAssistEnabled:boolean;photoAssistLast?:string;photoAssistStatus?:'idle'|'ready'|'needs_backend'|'applied'
}
export const V14_DEFAULT_IDENTITY:V14IdentityState={expression:'neutral',pose:'casual',background:'paper',cardTheme:'editorial',silhouette:'athletic',faceShape:'oval',grain:.28,outline:1,photoAssistEnabled:true,photoAssistStatus:'idle'}
