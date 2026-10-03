import React from 'react'
import { LiveRouteMap } from './LiveRouteMap'
export type MapPoint={latitude:number;longitude:number}
export function LiveMap({points=[]}:{points?:MapPoint[]}){return <LiveRouteMap progress={points.length?Math.min(1,.2+points.length/80):.58}/>}
