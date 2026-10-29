import {bootstrap, MetaFile, ObjectMetaField, Renderer, RendererResult, Vector2, type Exporter, type Project, type RendererSettings} from '@motion-canvas/core';
import {chapterScene} from './scenes';
import {scienceScene} from './science-scenes';
import type {Geography,Lesson} from './types';

const status=document.querySelector<HTMLElement>('#status')!;
const progress=document.querySelector<HTMLProgressElement>('#progress')!;
const log=document.querySelector<HTMLElement>('#log')!;
async function post(path:string,body:BodyInit){
  const response=await fetch(`/__render/${path}`,{method:'POST',body});
  if(!response.ok)throw new Error(await response.text());
}
class LocalVideoExporter implements Exporter {
  static id='sociales/local-mp4';static displayName='Local MP4';
  static async create(project:Project,settings:RendererSettings){return new LocalVideoExporter(project,settings);}
  static meta(){return new ObjectMetaField('options',{});}
  constructor(private project:Project,private settings:RendererSettings){}
  async start(){await post('start',JSON.stringify({id:this.project.name,fps:this.settings.fps}));}
  async handleFrame(canvas:HTMLCanvasElement,frame:number){
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Empty canvas')),'image/jpeg',.94));
    await post(`frame${frame===48?'?poster=1':''}`,blob);
    if(frame%24===0){progress.value=frame/(this.settings.range[1]*24);status.textContent=`${this.project.name}: ${(frame/24).toFixed(0)} / ${this.settings.range[1].toFixed(0)} segundos`}
  }
  async stop(result:RendererResult){if(result!==RendererResult.Success)throw new Error('Render failed');await post('finish','{}');}
}
async function main(){
  const science=new URLSearchParams(location.search).get('notebook')==='science';
  const mediaBase=science?'/science':'';
  const lessons:Lesson[]=await (await fetch(`${mediaBase}/lessons.json`)).json();
  const geography:Geography[]=await (await fetch('/maps.json')).json();
  const wanted=new URLSearchParams(location.search).get('chapter');
  for(const lesson of lessons.filter(l=>!wanted||l.id===wanted)){
    const existing=await fetch(`${mediaBase}/media/${lesson.id}.mp4`,{method:'HEAD'});
    if(existing.ok&&existing.headers.get('content-type')?.includes('video')){log.textContent+=`✓ ${lesson.id}.mp4 ya exportado; conservado\n`;continue;}
    const plugin={name:'sociales-render',exporters:()=>[LocalVideoExporter]};
    const project=bootstrap(lesson.id,{core:'3.17.2',two:'3.17.2',ui:null,vitePlugin:null},[plugin],{scenes:[science?scienceScene(lesson):chapterScene(lesson,geography)]},new MetaFile(lesson.id,false),new MetaFile('settings',false));
    project.logger.onLogged.subscribe(entry=>{if(entry.level==='error'){log.textContent+=`ERROR: ${entry.message}\n`;console.error(entry);}});
    const renderer=new Renderer(project);
    let result:RendererResult|undefined;renderer.onFinished.subscribe(value=>result=value);
    const stage=document.querySelector('#stage')!;stage.replaceChildren(renderer.stage.finalBuffer);renderer.stage.finalBuffer.style.width='min(900px,90vw)';
    await document.fonts.ready;
    await renderer.render({name:lesson.id,range:[0,lesson.duration-1/24],fps:24,size:new Vector2(1280,720),resolutionScale:1,colorSpace:'srgb',background:'#11232e',exporter:{name:LocalVideoExporter.id,options:{}}});
    if(result!==RendererResult.Success)throw new Error(`Export failed: ${lesson.id}`);
    log.textContent+=`✓ ${lesson.id}.mp4 exportado con Motion Canvas\n`;
  }
  status.textContent='Producción terminada. Los clips están en public/media.';progress.value=1;
}
main().catch(error=>{status.textContent='Error de producción';log.textContent+=String(error);console.error(error);});
