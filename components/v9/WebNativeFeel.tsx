import { useEffect } from 'react'
import { Platform } from 'react-native'

export function WebNativeFeel(){
  useEffect(()=>{
    if(Platform.OS!=='web'||typeof document==='undefined')return
    const id='hybrid-native-feel-v9';if(document.getElementById(id))return
    const style=document.createElement('style');style.id=id;style.textContent=`
      html,body,#root{height:100%;overscroll-behavior:none;-webkit-overflow-scrolling:touch}
      body{margin:0;overflow:hidden;touch-action:pan-y;background:#F5F7FB}
      #root{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
      img{-webkit-user-drag:none;user-drag:none}
      button,a,[role="button"]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      input,textarea{-webkit-user-select:text;user-select:text}
    `;document.head.appendChild(style);return()=>{style.remove()}
  },[])
  return null
}
