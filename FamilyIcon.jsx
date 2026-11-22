import React from 'react';
import {Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';

// Dependency-free, consistently drawn line icons (24x24 coordinate system).
// Unlike Unicode glyphs, strokes do not vary with the phone's installed font.
// View-only primitives also work in Expo Go without extra native packages.
function Line({x1,y1,x2,y2,color,thick=1.9}){
  const length=Math.hypot(x2-x1,y2-y1);
  const angle=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
  return <View style={{position:'absolute',left:(x1+x2-length)/2,top:(y1+y2-thick)/2,
    width:length,height:thick,borderRadius:thick,backgroundColor:color,
    transform:[{rotate:angle+'deg'}]}}/>;
}
function Ring({x,y,w,h,color,thick=1.9,style}){
  return <View style={[{position:'absolute',left:x,top:y,width:w,height:h,
    borderWidth:thick,borderColor:color,borderRadius:Math.min(w,h)/2},style]}/>;
}
function Dot({x,y,r=1.8,color}){
  return <View style={{position:'absolute',left:x-r,top:y-r,width:2*r,height:2*r,
    borderRadius:r,backgroundColor:color}}/>;
}
function Symbol({name,color}){
  const L=p=><Line {...p} color={color}/>;
  const R=p=><Ring {...p} color={color}/>;
  const D=p=><Dot {...p} color={color}/>;
  switch(name){
    case 'home':return <>
      {L({x1:3,y1:11,x2:12,y2:3})}{L({x1:12,y1:3,x2:21,y2:11})}
      {L({x1:5,y1:10,x2:5,y2:21})}{L({x1:19,y1:10,x2:19,y2:21})}
      {L({x1:5,y1:21,x2:19,y2:21})}
      {L({x1:10,y1:21,x2:10,y2:15})}{L({x1:10,y1:15,x2:14,y2:15})}{L({x1:14,y1:15,x2:14,y2:21})}
    </>;
    case 'bag':return <>
      <View style={{position:'absolute',left:4,top:8,width:16,height:14,borderRadius:3,
        borderWidth:1.9,borderColor:color}}/>
      {L({x1:9,y1:9,x2:9,y2:6})}{L({x1:15,y1:9,x2:15,y2:6})}
      {R({x:8.5,y:3.5,w:7,h:7,style:{borderBottomColor:'transparent',borderLeftColor:color,borderRightColor:color}})}
    </>;
    case 'heart':return <>
      {R({x:3.3,y:5.4,w:10.6,h:10,style:{borderBottomColor:'transparent',transform:[{rotate:'-32deg'}]}})}
      {R({x:10.1,y:5.4,w:10.6,h:10,style:{borderBottomColor:'transparent',transform:[{rotate:'32deg'}]}})}
      {L({x1:3.9,y1:11,x2:12,y2:21})}{L({x1:20.1,y1:11,x2:12,y2:21})}
    </>;
    case 'map':return <>
      {L({x1:3,y1:6,x2:9,y2:3})}{L({x1:9,y1:3,x2:15,y2:6})}{L({x1:15,y1:6,x2:21,y2:3})}
      {L({x1:3,y1:6,x2:3,y2:21})}{L({x1:3,y1:21,x2:9,y2:18})}
      {L({x1:9,y1:18,x2:15,y2:21})}{L({x1:15,y1:21,x2:21,y2:18})}
      {L({x1:21,y1:18,x2:21,y2:3})}{L({x1:9,y1:3,x2:9,y2:18})}
      {L({x1:15,y1:6,x2:15,y2:21})}
    </>;
    case 'book':return <>
      <View style={{position:'absolute',left:2.5,top:4,width:10,height:15,borderWidth:1.9,
        borderColor:color,borderTopLeftRadius:3,borderBottomLeftRadius:3,borderBottomRightRadius:2}}/>
      <View style={{position:'absolute',left:11.5,top:4,width:10,height:15,borderWidth:1.9,
        borderColor:color,borderTopRightRadius:3,borderBottomRightRadius:3,borderBottomLeftRadius:2}}/>
      {L({x1:12,y1:6,x2:12,y2:21})}
    </>;
    case 'users':return <>
      {R({x:8,y:3,w:8,h:8})}{R({x:1.5,y:7,w:6,h:6})}{R({x:16.5,y:7,w:6,h:6})}
      {R({x:5,y:13,w:14,h:9,style:{borderTopLeftRadius:9,borderTopRightRadius:9,borderBottomWidth:0}})}
      {L({x1:1.5,y1:20,x2:1.5,y2:17})}{L({x1:22.5,y1:20,x2:22.5,y2:17})}
    </>;
    case 'search':return <>{R({x:3,y:2,w:15,h:15})}{L({x1:16,y1:16,x2:22,y2:22})}</>;
    case 'sun':return <>
      {R({x:7.5,y:7.5,w:9,h:9})}
      {[[12,1,12,4],[12,20,12,23],[1,12,4,12],[20,12,23,12],
        [4,4,6.3,6.3],[17.7,17.7,20,20],[4,20,6.3,17.7],[17.7,6.3,20,4]]
        .map(([x1,y1,x2,y2],i)=><Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} color={color}/>)}
    </>;
    case 'sparkles':return <>
      {L({x1:11,y1:2,x2:11,y2:18})}{L({x1:3,y1:10,x2:19,y2:10})}
      {L({x1:5.5,y1:4.5,x2:16.5,y2:15.5})}{L({x1:16.5,y1:4.5,x2:5.5,y2:15.5})}
      {L({x1:20,y1:16,x2:20,y2:23})}{L({x1:17,y1:19.5,x2:23,y2:19.5})}
    </>;
    case 'menu':return <>{[5,12,19].map(y=><Line key={y} x1={3} y1={y} x2={21} y2={y} color={color} thick={2.1}/>)}</>;
    case 'chevron-right':return <>{L({x1:9,y1:5,x2:16,y2:12})}{L({x1:16,y1:12,x2:9,y2:19})}</>;
    case 'chevron-down':return <>{L({x1:5,y1:9,x2:12,y2:16})}{L({x1:12,y1:16,x2:19,y2:9})}</>;
    case 'chevron-up':return <>{L({x1:5,y1:16,x2:12,y2:9})}{L({x1:12,y1:9,x2:19,y2:16})}</>;
    case 'plus':return <>{L({x1:12,y1:3,x2:12,y2:21})}{L({x1:3,y1:12,x2:21,y2:12})}</>;
    case 'close':return <>{L({x1:5,y1:5,x2:19,y2:19})}{L({x1:19,y1:5,x2:5,y2:19})}</>;
    case 'message':return <>
      <View style={{position:'absolute',left:3,top:3,width:18,height:15,borderWidth:1.9,
        borderColor:color,borderRadius:5}}/>
      {L({x1:7,y1:18,x2:6,y2:22})}{L({x1:6,y1:22,x2:13,y2:18})}
      {[8,12,16].map(x=><Dot key={x} x={x} y={10.5} r={1.1} color={color}/>)}
    </>;
    case 'bell':return <>
      {R({x:5.5,y:4.5,w:13,h:15,style:{borderBottomColor:'transparent'}})}
      {L({x1:5,y1:17,x2:19,y2:17})}{L({x1:4,y1:19,x2:20,y2:19})}
      {R({x:10,y:19,w:4,h:3})}{D({x:12,y:3,r:1.5})}
    </>;
    case 'calendar':return <>
      <View style={{position:'absolute',left:3,top:5,width:18,height:17,borderWidth:1.9,
        borderColor:color,borderRadius:3}}/>
      {L({x1:3,y1:10,x2:21,y2:10})}{L({x1:8,y1:2,x2:8,y2:7})}{L({x1:16,y1:2,x2:16,y2:7})}
      {D({x:8,y:15,r:1.5})}{D({x:14,y:15,r:1.5})}
    </>;
    case 'pin':return <>
      {R({x:5,y:2,w:14,h:15,style:{borderBottomColor:'transparent'}})}
      {L({x1:5.4,y1:12,x2:12,y2:22})}{L({x1:18.6,y1:12,x2:12,y2:22})}
      {R({x:9.5,y:6,w:5,h:5,thick:1.7})}
    </>;
    case 'shield':return <>
      {L({x1:12,y1:2,x2:21,y2:6})}{L({x1:21,y1:6,x2:20,y2:15})}
      {L({x1:20,y1:15,x2:12,y2:22})}{L({x1:12,y1:22,x2:4,y2:15})}
      {L({x1:4,y1:15,x2:3,y2:6})}{L({x1:3,y1:6,x2:12,y2:2})}
      {L({x1:8,y1:12,x2:11,y2:15})}{L({x1:11,y1:15,x2:16,y2:9})}
    </>;
    case 'check':return <>{L({x1:4,y1:12,x2:10,y2:18})}{L({x1:10,y1:18,x2:20,y2:6})}</>;
    case 'refresh':return <>
      {R({x:3,y:3,w:18,h:18,style:{borderTopColor:'transparent'}})}
      {L({x1:16,y1:3,x2:21,y2:5})}{L({x1:21,y1:5,x2:20,y2:10})}
    </>;
    case 'puzzle':return <>
      <View style={{position:'absolute',left:4,top:4,width:16,height:16,borderColor:color,
        borderWidth:1.9,borderRadius:3}}/>
      {L({x1:12,y1:4,x2:12,y2:9})}{L({x1:12,y1:15,x2:12,y2:20})}
      {L({x1:4,y1:12,x2:9,y2:12})}{L({x1:15,y1:12,x2:20,y2:12})}
      {R({x:9,y:9,w:6,h:6,thick:1.5})}
    </>;
    case 'filter':return <>
      {L({x1:3,y1:5,x2:21,y2:5})}{L({x1:6,y1:12,x2:18,y2:12})}{L({x1:10,y1:19,x2:14,y2:19})}
    </>;
    case 'camera':return <>
      <View style={{position:'absolute',left:2,top:7,width:20,height:14,borderWidth:1.9,
        borderColor:color,borderRadius:3}}/>
      {L({x1:7,y1:7,x2:9,y2:4})}{L({x1:9,y1:4,x2:15,y2:4})}
      {R({x:8,y:10,w:8,h:8})}
    </>;
    case 'compass':return <>
      {R({x:2,y:2,w:20,h:20})}
      {L({x1:10,y1:10,x2:17,y2:7})}{L({x1:17,y1:7,x2:14,y2:14})}
      {L({x1:14,y1:14,x2:7,y2:17})}{L({x1:7,y1:17,x2:10,y2:10})}
    </>;
    default:return <>{R({x:3,y:3,w:18,h:18})}<Text style={{position:'absolute',left:0,top:2,width:24,textAlign:'center',
      fontSize:14,fontWeight:'700',color}}>?</Text></>;
  }
}
export default function FamilyIcon({name,size=24,color=C.accentDark}){
  const scale=size/24;
  return <View accessible={false} importantForAccessibility="no-hide-descendants"
    style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <View style={{width:24,height:24,transform:[{scale}]}}>
      <Symbol name={name} color={color}/>
    </View>
  </View>;
}
export const FAMILY_ROUTE_ICONS=Object.freeze({
 home:'home',market:'bag',discover:'users',map:'map',guide:'book',
 box:'bag',sell:'plus',play:'puzzle',outing:'compass',calendar:'calendar',
 events:'calendar',partners:'users',contacts:'users',chat:'message',
 inbox:'bell',profile:'users',push:'bell',savedSearches:'search',
 info:'book',inclusion:'heart',help:'shield',aboutApp:'sun',
 welcome:'sun',refresh:'refresh',more:'menu',saved:'heart'
});
