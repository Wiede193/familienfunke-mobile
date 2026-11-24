// The longest edge is bounded; never enlarge a known small source.
// Expo ImagePicker supplies dimensions in pixels. Unknown dimensions are
// resolved from a rendered image by the caller before calculating resize.
export function photoResize(width,height,maxEdge){
  if(!Number.isFinite(maxEdge)||maxEdge<1)throw new Error('Invalid image limit');
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return null;
  if(Math.max(width,height)<=maxEdge)return null;
  return width>=height?{width:Math.floor(maxEdge),height:null}:{width:null,height:Math.floor(maxEdge)};
}
