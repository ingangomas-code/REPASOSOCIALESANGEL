import {Circle, Img, Line, Node, Path, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createSignal, easeInOutCubic, linear, ValueDispatcher, type FullSceneDescription} from '@motion-canvas/core';
import type {Beat, Geography, Lesson} from './types';
import {geometryPath, normalName, projectPoint, provinceColors, provinceCoordinates} from './maps';

const ink='#f4f5ed',muted='#9cafb7',accent='#d9ff70',line='#304853';
function text(value:string,x:number,y:number,size=24,color=ink,width?:number) {
  return new Txt({text:value,x,y,fontSize:size,fontFamily:'Arial',fontWeight:500,fill:color,
    ...(width?{width,textWrap:true,textAlign:'left'}:{}),lineHeight:size*1.3});
}
function card(parent:Node,label:string,x:number,y:number,w=280,h=72,color=ink) {
  parent.add(new Rect({x,y,width:w,height:h,radius:14,fill:'#1d3440',stroke:line,lineWidth:1}));
  parent.add(text(label,x,y,22,color,w-30));
}
function compass(parent:Node,focus:string,motion:()=>number) {
  parent.add(new Circle({size:305,stroke:line,lineWidth:2}));
  parent.add(new Circle({size:260,stroke:'#4f666f',lineWidth:1,lineDash:[3,8]}));
  parent.add(new Line({points:[[-160,0],[160,0]],stroke:focus==='pairs'?accent:'#506975',lineWidth:3,end:()=>Math.min(1,motion()*5)}));
  parent.add(new Line({points:[[0,-160],[0,160]],stroke:accent,lineWidth:3,end:()=>Math.min(1,motion()*5)}));
  const needle=new Node({rotation:()=>focus==='needle'?65*(1-Math.min(1,motion()*7)):0});
  needle.add(new Path({data:'M0 -133 L28 28 L0 8 L-28 28 Z',fill:'#f36e79'}));
  needle.add(new Path({data:'M0 133 L28 -28 L0 -8 L-28 -28 Z',fill:'#a8c4cc'}));
  needle.add(new Circle({size:28,fill:'#12232b',stroke:ink,lineWidth:3}));parent.add(needle);
  [['NORTE',0,-190],['SUR',0,190],['OESTE',-245,0],['ESTE',235,0]].forEach(([s,x,y])=>parent.add(text(String(s),Number(x),Number(y),22,s==='NORTE'?accent:ink)));
}
function globe(parent:Node,focus:string,motion:()=>number) {
  parent.add(new Circle({size:340,fill:'#376aa6',stroke:'#a9d6e9',lineWidth:3}));
  parent.add(new Path({data:'M-170 0 A170 170 0 0 0 170 0 Z',fill:'#36876d'}));
  parent.add(new Path({data:'M-106 -122 L-40 -120 L-12 -83 L-53 -37 L-25 -3 L-58 5 L-73 -36 L-127 -72 Z M-52 13 L-15 32 L-5 61 L-40 126 L-58 98 L-75 39 Z',fill:'#b9d4aa',opacity:.8}));
  parent.add(new Circle({width:135,height:340,stroke:'#d1e9e3',lineWidth:1,opacity:.3}));
  parent.add(new Line({points:[[-195,0],[195,0]],stroke:'#ff6675',lineWidth:7,end:()=>Math.min(1,motion()*5)}));
  parent.add(text('NORTE',0,-212,22,'#8ed4ff'));
  parent.add(text('SUR',0,210,22,'#81dfb6'));
  parent.add(text('ECUADOR',265,0,18,'#ff8b94'));
  if(focus==='dom'){
    parent.add(new Circle({x:-50,y:-48,size:13,fill:accent}));
    parent.add(new Line({points:[[-45,-48],[110,-100],[250,-100]],stroke:accent,lineWidth:2}));
    parent.add(text('República\nDominicana',225,-130,19,accent));
  }
  if(focus==='cross') {
    parent.add(new Line({points:[[65,-100],[65,105]],stroke:accent,lineWidth:4,endArrow:true,end:()=>Math.min(1,motion()*3)}));
    parent.add(new Circle({x:65,y:()=>-100+200*Math.min(1,motion()*2),size:17,fill:accent}));
  }
  parent.add(text('Esquema de ubicación · sin escala',0,255,15,muted));
}
function island(parent:Node,focus:string,geography:Geography[],motion:()=>number) {
  const map=new Node({scale:.72,y:10});parent.add(map);
  for(const geo of geography) for(const feature of geo.features) {
    map.add(new Path({data:geometryPath(feature,true),fill:geo.iso==='DOM'?'#b5c4ff':'#789d9c',stroke:geo.iso==='DOM'?'#b5c4ff':'#142c39',lineWidth:1.3}));
  }
  map.add(text('HAITÍ',-140,-70,31,'#102734'));
  map.add(text('REPÚBLICA\nDOMINICANA',225,-20,28,'#102734'));
  parent.add(text('OCÉANO ATLÁNTICO · NORTE',0,-190,19,'#8ed4ff'));
  parent.add(text('MAR CARIBE · SUR',0,205,19,'#8ed4ff'));
  if(focus==='channels'){
    parent.add(text('Canal del\nViento\nOESTE',-330,-30,19,accent));
    parent.add(text('Canal de\nla Mona\nESTE',330,30,19,accent));
  }
  if(focus==='capitals'){
    for(const [name,lon,lat,dx,dy] of [['Puerto Príncipe',-72.34,18.54,-50,40],['Santo Domingo',-69.93,18.48,55,30]] as const){
      const [x,y]=projectPoint(lon,lat,true);map.add(new Circle({x,y,size:12,fill:'#233742',stroke:ink,lineWidth:2}));
      map.add(text(name,x+dx,y+dy,23,'#f7f9ed'));
    }
  }
  if(focus==='cross')parent.add(new Line({points:[[180,-105],[-120,-105]],stroke:accent,lineWidth:5,endArrow:true,end:()=>Math.min(1,motion()*3)}));
}
function provinces(parent:Node,focus:string,geography:Geography[],motion:()=>number) {
  const map=new Node({scale:.73,y:0});parent.add(map);
  for(const f of geography.find(g=>g.iso==='DOM')!.features){
    const name=normalName(f.properties.shapeName);
    const selected=focus==='all'||focus==='north'&&['Monte Cristi','Puerto Plata'].includes(name)||focus===name;
    map.add(new Path({data:geometryPath(f),fill:selected?(provinceColors[name]??'#46606b'):'#3c535f',stroke:'#142733',lineWidth:2,opacity:()=>.5+.5*Math.min(1,motion()*5)}));
  }
  for(const [name,[lon,lat]] of Object.entries(provinceCoordinates)){
    const [x,y]=projectPoint(lon,lat);
    if(focus==='all'||focus==='north'&&['Monte Cristi','Puerto Plata'].includes(name)||focus===name){
      if(name==='Monte Cristi')map.add(text('★',x,y,27,'#122631'));
      else map.add(new Circle({x,y,size:10,fill:'#122631'}));
      map.add(text(name,x,y+26,20,'#10232c'));
    }
  }
  parent.add(text('OCÉANO ATLÁNTICO · NORTE',0,-205,18,'#8ed4ff'));
  parent.add(text('MAR CARIBE · SUR',0,218,18,'#8ed4ff'));
}
function community(parent:Node,focus:string){
  if(focus==='people'||focus==='reason') {
    [['LUCAS','Ciudad','Escuela','#71d4ff'],['SOFÍA','Campo','Granja','#d9ff70'],['MATEO','Costa','Playa','#ffcb82']].forEach(([name,place,clue,c],i)=>{
      const x=(i-1)*225;
      parent.add(new Circle({x,y:-95,size:75,fill:c}));
      parent.add(text(name.slice(0,1),x,-95,35,'#17313d'));
      parent.add(text(name,x,-25,20,c));
      card(parent,place,x,40,205,65);card(parent,clue,x,120,205,65);
    });
    return;
  }
  [['AEROPUERTO','Vuelos','plane'],['BIBLIOTECA','Libros','book'],['IGLESIA','Culto','church'],['RESTAURANTE','Comidas','food']].forEach(([name,use,icon],i)=>{
    const x=i%2===0?-175:175,y=i<2?-105:115;
    parent.add(new Rect({x,y,width:315,height:190,radius:22,fill:'#1d3440',stroke:line,lineWidth:1}));
    if(icon==='plane')parent.add(new Path({x,y:y-32,scale:1.1,data:'M-45 7 L-8 -7 L-5 -42 L5 -42 L9 -7 L45 7 L45 15 L8 10 L7 35 L20 45 L20 50 L0 43 L-20 50 L-20 45 L-7 35 L-8 10 L-45 15 Z',fill:'#71d4ff'}));
    if(icon==='book'){
      parent.add(new Rect({x:x-23,y:y-30,width:46,height:67,fill:'#d9ff70',radius:5,rotation:-7}));
      parent.add(new Rect({x:x+23,y:y-30,width:46,height:67,fill:'#b6d85c',radius:5,rotation:7}));
    }
    if(icon==='church'){
      parent.add(new Rect({x,y:y-18,width:65,height:55,fill:'#c5b4ff'}));
      parent.add(new Path({x,y:y-55,data:'M-45 15 L0 -25 L45 15 Z',fill:'#c5b4ff'}));
      parent.add(new Line({points:[[x,y-106],[x,y-78]],stroke:'#c5b4ff',lineWidth:5}));
      parent.add(new Line({points:[[x-10,y-96],[x+10,y-96]],stroke:'#c5b4ff',lineWidth:5}));
    }
    if(icon==='food'){
      parent.add(new Circle({x,y:y-32,size:70,stroke:'#ffcb82',lineWidth:4}));
      parent.add(new Circle({x,y:y-32,size:49,stroke:'#ffcb82',lineWidth:2}));
    }
    parent.add(text(name,x,y+38,20,ink));parent.add(text(use,x,y+68,18,muted));
  });
}
function address(parent:Node,focus:string){
  if(focus==='sign'){
    parent.add(new Img({src:'/sources/letrero.jpg',width:670,height:380,radius:18}));
    parent.add(new Rect({x:0,y:188,width:600,height:42,fill:'#122631',radius:8}));
    parent.add(text('Lee el letrero: es una estación de bomberos',0,188,20,accent));
  } else {
    card(parent,'CALLE',-220,-130,160,60,'#71d4ff');card(parent,'72',90,-130,380,60);
    card(parent,'NÚMERO',-220,-40,160,60,'#c5b4ff');card(parent,'38–150',90,-40,380,60);
    card(parent,'BARRIO',-220,50,160,60,'#d9ff70');card(parent,'El Recreo',90,50,380,60);
    card(parent,'CIUDAD',-220,140,160,60,'#ffcb82');card(parent,'Barranquilla',90,140,380,60);
    parent.add(text('País: Colombia',0,210,18,muted));
  }
}
function diagram(parent:Node,beat:Beat,geography:Geography[],motion:()=>number){
  if(beat.visual==='compass')compass(parent,beat.focus,motion);
  else if(beat.visual==='globe')globe(parent,beat.focus,motion);
  else if(beat.visual==='island')island(parent,beat.focus,geography,motion);
  else if(beat.visual==='provinces')provinces(parent,beat.focus,geography,motion);
  else if(beat.visual==='community')community(parent,beat.focus);
  else if(beat.visual==='address')address(parent,beat.focus);
  else if(beat.visual==='sun'){
    parent.add(new Line({points:[[-320,90],[320,90]],stroke:'#52717b',lineWidth:3}));
    parent.add(new Circle({x:230,y:()=>90-200*Math.min(1,motion()*3),size:100,fill:'#ffcf73'}));
    parent.add(new Line({points:[[-265,165],[265,165]],stroke:ink,lineWidth:2,startArrow:true,endArrow:true}));
    parent.add(text('OESTE',-250,205,22));parent.add(text('ESTE',250,205,22,accent));
    parent.add(text('El Sol sale aproximadamente por el este',0,-160,24,ink,620));
  } else if(beat.visual==='route'){
    card(parent,'BIBLIOTECA',0,-140,240,75);card(parent,'CASA',0,150,240,75);
    parent.add(new Line({points:[[-65,100],[-65,-85]],stroke:'#71d4ff',lineWidth:6,endArrow:true,end:()=>Math.min(1,motion()*4)}));
    parent.add(new Line({points:[[65,-85],[65,100]],stroke:accent,lineWidth:6,endArrow:true,end:()=>Math.max(0,Math.min(1,(motion()-.3)*4))}));
    parent.add(text('IDA\nNorte',-185,0,25,'#71d4ff'));parent.add(text('VUELTA\nSur',185,0,25,accent));
  }
}

export function chapterScene(lesson:Lesson,geography:Geography[]):FullSceneDescription {
  const description=makeScene2D(function*(view){
    view.fill('#11232e');
    for(const [index,beat] of lesson.beats.entries()){
      const motion=createSignal(0);
      const page=new Node({opacity:0});view.add(page);
      for(let x=-640;x<640;x+=48)page.add(new Line({points:[[x,-360],[x,360]],stroke:'#19313d',lineWidth:1}));
      for(let y=-360;y<360;y+=48)page.add(new Line({points:[[-640,y],[640,y]],stroke:'#19313d',lineWidth:1}));
      page.add(new Txt({text:`CAPÍTULO ${lesson.number}  /  ${beat.label}`,x:-577,y:-306,offsetX:-1,fontFamily:'Arial',fontSize:16,fontWeight:700,letterSpacing:2,fill:lesson.color}));
      page.add(new Txt({text:beat.title,x:-577,y:-250,offsetX:-1,fontFamily:'Arial',fontSize:42,fontWeight:700,fill:ink}));
      page.add(new Rect({x:-190,y:28,width:790,height:445,radius:26,fill:'#152d39',stroke:line,lineWidth:1}));
      const visual=new Node({x:-190,y:20});page.add(visual);diagram(visual,beat,geography,motion);
      page.add(text('LAS PISTAS',420,-155,16,lesson.color));
      beat.facts.forEach((fact,i)=>{
        const note=new Node({opacity:()=>Math.min(1,Math.max(0,(motion()*beat.duration-i*2)*2))});page.add(note);
        note.add(new Circle({x:273,y:-96+i*112,size:7,fill:lesson.color}));
        note.add(text(fact,432,-85+i*112,22,ink,275));
      });
      page.add(text('OBSERVA  →  CONECTA  →  EXPLICA',-330,300,16,muted));
      page.add(text(`${index+1} / ${lesson.beats.length}`,550,300,17,muted));
      page.add(new Rect({x:()=>-640+640*((index+motion())/lesson.beats.length),y:356,height:8,width:()=>1280*((index+motion())/lesson.beats.length),fill:lesson.color}));
      yield* all(page.opacity(1,.5,easeInOutCubic),motion(1,beat.duration,linear));
      page.remove();
    }
  });
  const full={...description,name:lesson.id} as FullSceneDescription;
  full.onReplaced=new ValueDispatcher(full);
  return full;
}
