import {Circle,Line,Node,Rect,SVG,Txt,makeScene2D} from '@motion-canvas/2d';
import {all,createSignal,linear,ValueDispatcher,type FullSceneDescription} from '@motion-canvas/core';
import type {Lesson,Beat} from './types';
import {scienceIcon,frogStages,butterflyStages} from './science-art';
const ink='#f0f4eb',muted='#9cb4bd';
function label(s:string,x:number,y:number,size=23,color=ink,width?:number){return new Txt({text:s,x,y,fontSize:size,fontFamily:'Arial',fontWeight:500,fill:color,...(width?{width,textWrap:true,textAlign:'center'}:{}),lineHeight:size*1.3});}
function icon(parent:Node,name:string,x:number,y:number,size=175){const node=new SVG({svg:scienceIcon(name),width:size,height:size*.8,x,y});parent.add(node);return node;}
function tile(parent:Node,name:string,title:string,x:number,y:number,w=170){parent.add(new Rect({x,y,width:w,height:195,radius:18,fill:'#203b46',stroke:'#37535e',lineWidth:1}));icon(parent,name,x,y-14,w-24);parent.add(label(title,x,y+73,21,ink,w-10));}
function sequence(parent:Node,stages:string[][],motion:()=>number,focus:string){
  stages.forEach(([name,title],i)=>{const x=(i-1.5)*185;tile(parent,name,title,x,0,169);if(i<3)parent.add(new Line({points:[[x+87,0],[x+99,0]],stroke:'#91edb7',lineWidth:3,endArrow:true,end:()=>Math.min(1,motion()*4)}));if(focus===name)parent.add(new Rect({x,y:0,width:171,height:198,radius:18,stroke:'#d9ff70',lineWidth:3}));});
  parent.add(label('Different stages • one life cycle',0,160,20,muted));
}
function comparison(parent:Node,animal:string,motion:()=>number){
  icon(parent,animal,-155,-5,265);icon(parent,animal,170,45,145);
  parent.add(label('Parent / Adult',-155,170,23));parent.add(label('Offspring / Young',170,170,23));
  parent.add(new Line({points:[[-285,118],[290,118]],stroke:'#55717a',lineWidth:2}));
  parent.add(label('Similar features • different size',0,-165,24,'#d2e6c3'));
}
function draw(parent:Node,beat:Beat,motion:()=>number){
  switch(beat.visual){
    case 'living':[['butterfly','Living'],['rock','Nonliving'],['chair','Nonliving']].forEach(([n,t],i)=>tile(parent,n,t,(i-1)*245,0,215));break;
    case 'growing':comparison(parent,beat.focus==='monkey'?'monkey':'horse',motion);break;
    case 'plant-cycle':sequence(parent,[['seed','Seed'],['sprout','Young plant'],['tree','Mature tree'],['seed','New seed']],motion,'');break;
    case 'cycle-compare':tile(parent,'cub','Tiger cub',-240,-15,200);tile(parent,'cub','Adult tiger',0,-15,200);tile(parent,'tadpole','Frog stage',240,-15,200);parent.add(label('Not every animal has a tadpole stage',0,170,23,'#cde5c1'));break;
    case 'frog-cycle':sequence(parent,frogStages,motion,beat.focus);break;
    case 'butterfly-cycle':sequence(parent,butterflyStages,motion,beat.focus);break;
    case 'stage-compare':{
      const isFrog=beat.focus==='frog';tile(parent,isFrog?'tadpole':'caterpillar',isFrog?'Tadpole':'Caterpillar',-190,-10,270);tile(parent,isFrog?'frog':'butterfly',isFrog?'Adult frog':'Adult butterfly',190,-10,270);
      parent.add(new Line({points:[[-45,-10],[45,-10]],stroke:'#b9e9c2',lineWidth:4,endArrow:true,end:()=>Math.min(1,motion()*4)}));parent.add(label('A life cycle connects them',0,170,24,'#cde5c1'));break;
    }
    case 'baby-names':{
      const farm=beat.focus==='farm';const names=farm?[['horse','Horse → Foal'],['sheep','Sheep → Lamb'],['duck','Duck → Duckling']]:[['cub','Tiger → Cub'],['tadpole','Frog → Tadpole'],['caterpillar','Butterfly → Caterpillar']];
      names.forEach(([n,t],i)=>tile(parent,n,t,(i-1)*245,0,220));break;
    }
    case 'needs':[['food','Food'],['nest','Shelter'],['shield','Protection']].forEach(([n,t],i)=>tile(parent,n,t,(i-1)*245,0,215));break;
    case 'feeding':icon(parent,'bird',-210,-40,240);icon(parent,'nest',190,65,255);icon(parent,'bird',135,0,94);icon(parent,'bird',225,10,90);icon(parent,'food',0,-20,60);parent.add(label('Food for hungry chicks',0,185,25,'#d0e8c7'));parent.add(new Line({points:[[-70,-25],[55,30]],stroke:'#d9ff70',lineWidth:4,endArrow:true,end:()=>Math.min(1,motion()*4)}));break;
    case 'shelter':tile(parent,'nest','Bird: a nest',-190,0,280);tile(parent,'burrow','Rabbit: a burrow',190,0,280);parent.add(label('Different shelters • a safe place',0,175,24,'#d0e8c7'));break;
    case 'protection':icon(parent,'lion',-190,0,250);icon(parent,'shield',70,-50,160);icon(parent,'cub',230,50,150);if(beat.focus==='group')icon(parent,'lion',10,70,150);parent.add(label('Protecting offspring from danger',0,185,24,'#d0e8c7'));break;
    case 'sounds':icon(parent,'dolphin',-190,-25,270);icon(parent,'dolphin',220,60,150);icon(parent,'sound',65,-30,120);parent.add(label('A sound can carry a message',0,185,24,'#d0e8c7'));break;
    case 'behaviors':[['bird','Nest'],['rabbit','Burrow'],['lion','Protection'],['dolphin','Sounds']].forEach(([n,t],i)=>tile(parent,n,t,(i-1.5)*185,0,168));break;
  }
}
export function scienceScene(lesson:Lesson):FullSceneDescription{
  const description=makeScene2D(function*(view){
    view.fill('#102731');
    for(const [index,beat] of lesson.beats.entries()){
      const motion=createSignal(0),page=new Node({opacity:0});view.add(page);
      for(let x=-640;x<640;x+=48)page.add(new Line({points:[[x,-360],[x,360]],stroke:'#183640',lineWidth:1}));
      for(let y=-360;y<360;y+=48)page.add(new Line({points:[[-640,y],[640,y]],stroke:'#183640',lineWidth:1}));
      page.add(new Txt({text:`SCIENCE ${lesson.number}  /  ${beat.label}`,x:-578,y:-306,offsetX:-1,fontSize:16,fontFamily:'Arial',letterSpacing:2,fontWeight:700,fill:lesson.color}));
      page.add(new Txt({text:beat.title,x:-578,y:-250,offsetX:-1,fontSize:39,fontFamily:'Arial',fontWeight:700,fill:ink}));
      page.add(new Rect({x:-190,y:30,width:790,height:445,radius:26,fill:'#16323e',stroke:'#36535e',lineWidth:1}));
      const illustration=new Node({x:-190,y:20});page.add(illustration);draw(illustration,beat,motion);
      page.add(label('THE EVIDENCE',425,-150,17,lesson.color));
      beat.facts.forEach((s,i)=>{const row=new Node({opacity:()=>Math.min(1,Math.max(0,(motion()*beat.duration-i*1.5)*2))});row.add(new Circle({x:277,y:-92+i*108,size:7,fill:lesson.color}));row.add(label(s,435,-83+i*108,22,ink,273));page.add(row);});
      page.add(label('OBSERVE  →  CONNECT  →  EXPLAIN',-330,300,16,muted));page.add(label(`${index+1} / ${lesson.beats.length}`,550,300,17,muted));
      page.add(new Rect({x:()=>-640+640*(index+motion())/lesson.beats.length,y:356,height:8,width:()=>1280*(index+motion())/lesson.beats.length,fill:lesson.color}));
      yield* all(page.opacity(1,.4),motion(1,beat.duration,linear));page.remove();
    }
  });
  const scene={...description,name:lesson.id} as FullSceneDescription;scene.onReplaced=new ValueDispatcher(scene);return scene;
}
