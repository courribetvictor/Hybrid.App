import React from 'react'
import { StyleSheet } from 'react-native'
import MapView,{Marker,Polyline} from 'react-native-maps'
export type MapPoint={latitude:number;longitude:number}
export function LiveMap({points=[]}:{points?:MapPoint[]}){
 const last=points[points.length-1]; const region=last?{...last,latitudeDelta:.025,longitudeDelta:.025}:{latitude:46.603354,longitude:1.888334,latitudeDelta:8,longitudeDelta:8}
 return <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation={!!last} showsMyLocationButton={false} toolbarEnabled={false}>{points.length>1&&<Polyline coordinates={points} strokeColor="#315CFF" strokeWidth={5}/>} {last&&<Marker coordinate={last}/>}</MapView>
}
