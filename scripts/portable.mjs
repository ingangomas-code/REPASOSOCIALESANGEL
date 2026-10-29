import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const dir=resolve('dist');
let html=await readFile(resolve(dir,'index.html'),'utf8');
for(const match of [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)]){
  const js=await readFile(resolve(dir,match[1]),'utf8');
  html=html.replace(match[0],`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
}
for(const match of [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){
  const css=await readFile(resolve(dir,match[1]),'utf8');html=html.replace(match[0],`<style>${css}</style>`);
}
for(const id of ['orientacion','hemisferios','isla','provincias','comunidad']){
  const result=await stat(resolve(dir,`media/${id}.mp4`));if(result.size<10000)throw new Error(`Missing actual video: ${id}`);
}
await writeFile(resolve(dir,'index.html'),html);
console.log('Portable HTML built: dist/index.html (scripts and styles embedded; media kept alongside).');
