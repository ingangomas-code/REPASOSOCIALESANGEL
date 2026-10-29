import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const windows=process.platform==='win32';
const executable=resolve(root,windows?'.venv/Scripts/graphify.exe':'.venv/bin/graphify');
const python=resolve(root,windows?'.venv/Scripts/python.exe':'.venv/bin/python');
if(!existsSync(executable)){
  console.error('Graphify local no está instalado. Sigue docs/GRAPHIFY.md.');
  process.exit(1);
}
const [command='update',...args]=process.argv.slice(2);
const env={...process.env,GRAPHIFY_NO_AUTO_REFRESH:'1'};
function run(file,argv){
  const result=spawnSync(file,argv,{cwd:root,env,stdio:'inherit'});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status??1);
}
run(executable,command==='update'?['update','.',...args]:[command,...args]);
if(command==='update')run(python,['scripts/finalize_graph.py']);
