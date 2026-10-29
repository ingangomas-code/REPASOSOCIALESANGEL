import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDraft} from '../src/library-store.mjs';
const science=JSON.parse(readFileSync(new URL('../content/science/timed-lessons.json',import.meta.url),'utf8'));
const original=JSON.parse(readFileSync(new URL('../content/timed-lessons.json',import.meta.url),'utf8'));
test('Science covers all seven worksheets, with its own five chapter ids',()=>{
 assert.equal(science.length,5);assert.deepEqual([...new Set(science.flatMap(l=>l.sources))].sort(),[1,2,3,4,5,6,7]);
 assert.ok(science.every(l=>l.id.startsWith('science-')&&!original.some(o=>o.id===l.id)));
 assert.ok(science.every(l=>l.quiz.length===3&&l.beats.length===5));
});
test('every science answer key has evidence and useful feedback',()=>{
 for(const l of science)for(const q of [...l.quiz,l.checkpoint]){assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);assert.ok(q.hint.length>15);assert.ok(q.explanation.length>20);}
});
test('English narration is contiguous and leaves enough time for real speech',()=>{
 for(const l of science){let t=0;for(const b of l.beats){assert.ok(Math.abs(t-b.start)<.00001);assert.ok(b.voiceDuration+.45<b.duration);assert.ok(Math.abs(b.duration*24-Math.round(b.duration*24))<.00001);assert.ok(b.sentences.length>0);t+=b.duration;}assert.ok(Math.abs(t-l.duration)<.00001);assert.equal(l.checkpointAt,l.beats[1].end);}
});
test('the handwritten Tiger choice is not adopted as the scientific answer',()=>{
 const words=science.find(l=>l.id==='science-cycles').beats.map(b=>b.narration).join(' ');
 assert.match(words,/tadpole.*not a baby tiger/);assert.match(words,/egg, caterpillar, chrysalis, adult butterfly/);
});
test('draft validation supports empty-material drafts and rejects wrong or excessive files',()=>{
 assert.equal(validateDraft('Science',[]),'');assert.ok(validateDraft('',[]));
 assert.ok(validateDraft('Science',[{type:'text/html',size:500}]));
 assert.ok(validateDraft('Science',[{type:'image/jpeg',size:21*1024*1024}]));
 assert.ok(validateDraft('Science',Array.from({length:31},()=>({type:'image/jpeg',size:100}))));
 assert.equal(validateDraft('Science',[{type:'image/jpeg',size:100},{type:'application/pdf',size:200}]),'');
});
test('the library is the entry page and both courses keep distinct entry points',()=>{
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(page,/src\/library.ts/);assert.match(page,/\.\/sociales.html/);assert.match(page,/\.\/science.html/);assert.match(page,/Crear nuevo cuaderno/);
 const social=readFileSync(new URL('../sociales.html',import.meta.url),'utf8');assert.match(social,/src\/app.ts/);
 const en=readFileSync(new URL('../science.html',import.meta.url),'utf8');assert.match(en,/lang="en"/);assert.match(en,/src\/science.ts/);assert.doesNotMatch(en,/UNA IDEA CONNECT CON OTRA/);
});
