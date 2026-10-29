import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const dir=resolve('dist');
for(const id of ['orientacion','hemisferios','isla','provincias','comunidad']){
  const result=await stat(resolve(dir,`media/${id}.mp4`));if(result.size<10000)throw new Error(`Missing actual video: ${id}`);
}
const science=JSON.parse(await readFile('content/science/timed-lessons.json','utf8'));
for(const lesson of science){const info=await stat(resolve(dir,`science/media/${lesson.id}.mp4`));if(info.size<10000)throw new Error(`Missing Science clip: ${lesson.id}`);}
// Separate IIFE bundles avoid shared ES-module imports blocked by file:// browsers.
for(const [page,entry] of [['index.html','src/library.ts'],['sociales.html','src/app.ts'],['science.html','src/science.ts']]){
  const bundle=await build({entryPoints:[entry],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,write:false,outdir:'inline',legalComments:'none'});
  const js=bundle.outputFiles.find(f=>f.path.endsWith('.js')).text;
  const css=bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n');
  let html=await readFile(page,'utf8');
  html=html.replace(/<script type="module" src="[^"]+"><\/script>/,`<script>${js.replace(/<\/script/gi,'<\\/script')}</script>`);
  html=html.replace('</head>',`<style>${css}</style></head>`);
  await writeFile(resolve(dir,page),html);
  console.log(`Portable HTML: dist/${page}`);
}
