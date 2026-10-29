import {defineConfig, type Plugin} from 'vite';
import {spawn, type ChildProcessWithoutNullStreams} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {once} from 'node:events';

// Rendering endpoint is available only in the development server on loopback.
// Final lesson uses ordinary MP4s, with no rendering server or dependencies.
function localExporter(): Plugin {
  let encoder: ChildProcessWithoutNullStreams | undefined;
  let encoderDone: Promise<number | null> | undefined;
  let current = '';
  let currentScience=false;
  let failure = '';
  return {
    name: 'sociales-local-export',
    configureServer(server) {
      server.middlewares.use('/__render', async (req, res) => {
        try {
          if (req.method !== 'POST') {res.statusCode=405; res.end(); return;}
          const url = new URL(req.url ?? '/', 'http://localhost');
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const body=Buffer.concat(chunks);
          const dir=resolve('.render');
          if(url.pathname==='/start') {
            // A page reload abandons the old frame stream. A new local render
            // takes ownership and closes that encoder before starting again.
            if(encoder){encoder.stdin.destroy();encoder.kill();await encoderDone;encoder=undefined;}
            const {id, fps} = JSON.parse(body.toString());
            if(typeof id!=='string'||!/^[a-z0-9-]+$/.test(id)||fps!==24)throw new Error('Invalid export');
            currentScience=id.startsWith('science-');
            const catalog=JSON.parse(await readFile(currentScience?'public/science/lessons.json':'public/lessons.json','utf8'));
            if(!catalog.some((lesson:{id:string})=>lesson.id===id))throw new Error('Unknown lesson');
            current=id; failure=''; await mkdir(dir,{recursive:true});
            encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-r','24','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',resolve(dir,`${id}-silent.mp4`)]);
            encoder.stderr.on('data',x=>{failure+=x.toString();});
            encoder.on('error',x=>{failure+=x.message;});
            encoderDone=new Promise(resolveDone=>encoder!.on('close',resolveDone));
          } else if(url.pathname==='/frame') {
            if(!encoder || encoder.exitCode!==null || encoder.stdin.destroyed) throw new Error(failure || 'No active encoder');
            if(url.searchParams.get('poster')==='1') await writeFile(resolve(currentScience?'public/science/media':'public/media',`${current}.jpg`),body);
            if(!encoder.stdin.write(body)) await once(encoder.stdin,'drain');
          } else if(url.pathname==='/finish') {
            if(!encoder || !encoderDone) throw new Error('No active export');
            encoder.stdin.end();
            const code=await encoderDone; encoder=undefined;
            if(code!==0) throw new Error(failure || `FFmpeg exited ${code}`);
            const media=currentScience?'public/science/media':'public/media';
            const lesson=JSON.parse(await readFile(currentScience?'public/science/lessons.json':'public/lessons.json','utf8')).find((l:{id:string})=>l.id===current);
            const mux=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',resolve(dir,`${current}-silent.mp4`),'-i',resolve(media,`${current}.mp3`),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-t',String(lesson.duration),'-movflags','+faststart',resolve(media,`${current}.mp4`)]);
            let muxError=''; mux.stderr.on('data',x=>muxError+=x.toString());
            const [muxCode]=await once(mux,'close');
            if(muxCode!==0) throw new Error(muxError);
            console.log(`Exported ${current}.mp4 (${lesson.duration.toFixed(1)} s)`);
          } else {res.statusCode=404; res.end(); return;}
          res.setHeader('Content-Type','application/json'); res.end('{"ok":true}');
        } catch(error) {console.error(error); res.statusCode=500; res.end(String(error));}
      });
    },
  };
}

export default defineConfig({
  base:'./', plugins:[localExporter()],
  optimizeDeps:{include:['@motion-canvas/core','@motion-canvas/2d'],noDiscovery:true},
  build:{target:'es2022', rollupOptions:{input:{library:resolve('index.html'),sociales:resolve('sociales.html'),science:resolve('science.html')}}},
  server:{host:'127.0.0.1',port:9010,strictPort:true,hmr:false},
});
