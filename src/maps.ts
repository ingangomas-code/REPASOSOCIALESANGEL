import type {Feature, Geography} from './types';

export const provinceColors:Record<string,string>={'Monte Cristi':'#d9ff70','Puerto Plata':'#ed5966','San Juan':'#508df1','La Altagracia':'#58bc89','Barahona':'#ffda5a'};
export const provinceCoordinates:Record<string,[number,number]>={'Monte Cristi':[-71.43,19.73],'Puerto Plata':[-70.78,19.73],'San Juan':[-71.21,18.87],'La Altagracia':[-68.63,18.61],'Barahona':[-71.22,18.13]};
const modernNames:Record<string,string>={'Montecristi':'Monte Cristi','La Estrelleta':'Elías Piña','El Seybo':'El Seibo','Hermanas':'Hermanas Mirabal'};
export const normalName=(name:string)=>modernNames[name]??name;
export function projectPoint(lon:number,lat:number,full=false):[number,number] {
  const bounds=full?[-74.6,-68.2,17.45,20.15]:[-72.05,-68.2,17.45,20.0];
  const width=full?890:850;
  return [(lon-(bounds[0]+bounds[1])/2)*width/(bounds[1]-bounds[0]), ((bounds[2]+bounds[3])/2-lat)*width/(bounds[1]-bounds[0])/Math.cos(19*Math.PI/180)];
}
export function geometryPath(feature:Feature,full=false):string {
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  return polygons.map((poly:any[])=>poly.map((ring:number[][])=>ring.map(([lon,lat],i)=>{
    const [x,y]=projectPoint(lon,lat,full);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ')+'Z').join(' ')).join(' ');
}
export function mapSvg(geography:Geography[],interactive=false):string {
  const dom=geography.find(g=>g.iso==='DOM')!;
  return `<svg viewBox="-480 -340 960 680" role="group" aria-label="Mapa de provincias de República Dominicana">
    <text x="0" y="-265" text-anchor="middle" class="sea-label">OCÉANO ATLÁNTICO · NORTE</text>
    ${dom.features.map(f=>{const n=normalName(f.properties.shapeName);return `<path d="${geometryPath(f)}" class="province" data-province="${n}" ${interactive&&provinceColors[n]?`role="button" tabindex="0" aria-label="${n}"`:''}><title>${n}</title></path>`;}).join('')}
    ${Object.entries(provinceCoordinates).map(([n,[lon,lat]])=>{const [x,y]=projectPoint(lon,lat);return `<text x="${x}" y="${y}" text-anchor="middle" class="province-name">${n}</text>`}).join('')}
    <text x="0" y="300" text-anchor="middle" class="sea-label">MAR CARIBE · SUR</text>
  </svg>`;
}
