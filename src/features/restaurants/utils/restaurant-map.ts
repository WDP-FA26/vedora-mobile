import { z } from 'zod';

export type MapPoint = { longitude: number; latitude: number };
export type MapRestaurant = MapPoint & { pageUserId: string; name: string };
export type RestaurantMapProps = {
  restaurants?: MapRestaurant[];
  point?: MapPoint | null;
  editable?: boolean;
  onPick?: (point: MapPoint) => void;
  onSelect?: (id: string) => void;
};
export const mapMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pick'),
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  }),
  z.object({ type: z.literal('select'), id: z.string() }),
]);
export function mapHtml({
  restaurants = [],
  point,
  editable,
}: RestaurantMapProps) {
  const data = JSON.stringify({ restaurants, point, editable }).replace(
    /</g,
    '\\u003c'
  );
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}body{font:14px sans-serif}#error{position:absolute;z-index:1000;background:white;top:10px;left:50px;padding:8px;display:none}</style></head><body><div id="error">Chưa tải được bản đồ. Kiểm tra kết nối mạng.</div><div id="map" aria-label="Bản đồ nhà hàng"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const initial=${data};const send=v=>{const message=JSON.stringify(v);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(message);else window.parent.postMessage(message,'*')};
if(!window.L){document.getElementById('error').style.display='block'}else{
const map=L.map('map').setView(initial.point?[initial.point.latitude,initial.point.longitude]:[16,106],initial.point?14:5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>document.getElementById('error').style.display='block').addTo(map);
const markers=L.layerGroup().addTo(map);let pin=null,editable=false,previousRestaurants='';
const pick=p=>{if(pin)pin.setLatLng(p);else pin=L.marker(p,{draggable:true}).addTo(map).on('dragend',()=>pick(pin.getLatLng()));send({type:'pick',longitude:p.lng,latitude:p.lat})};
map.on('click',e=>{if(editable)pick(e.latlng)});
window.updateRestaurantMap=d=>{
editable=!!d.editable;const restaurantKey=JSON.stringify(d.restaurants||[]);const positions=[];
if(restaurantKey!==previousRestaurants){markers.clearLayers();(d.restaurants||[]).forEach(r=>{const p=[r.latitude,r.longitude];positions.push(p);const label=document.createElement('span');label.textContent=r.name;L.marker(p).addTo(markers).bindTooltip(label).on('click',()=>send({type:'select',id:r.pageUserId}))});previousRestaurants=restaurantKey;if(!d.point&&positions.length)map.fitBounds(positions,{padding:[30,30],maxZoom:15})}
if(d.point){const p=L.latLng(d.point.latitude,d.point.longitude);if(!pin){pin=L.marker(p,{draggable:editable}).addTo(map).on('dragend',()=>pick(pin.getLatLng()));map.setView(p,14)}else if(!pin.getLatLng().equals(p)){pin.setLatLng(p);map.panTo(p)}if(editable)pin.dragging.enable();else pin.dragging.disable()}else if(pin){map.removeLayer(pin);pin=null;if(markers.getLayers().length)map.fitBounds(L.featureGroup(markers.getLayers()).getBounds(),{padding:[30,30],maxZoom:15})}
};
window.addEventListener('message',e=>{if(e.source===window.parent){try{const value=JSON.parse(e.data);if(value.type==='update')window.updateRestaurantMap(value.data)}catch{}}});window.updateRestaurantMap(initial);
}</script></body></html>`;
}
