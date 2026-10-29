import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState,restoreState,recordAnswer,mastered,activeBeat,checkpointCrossed,currentCaption} from '../src/state.mjs';
const lessons=JSON.parse(readFileSync(new URL('../content/timed-lessons.json',import.meta.url),'utf8'));
const geography=JSON.parse(readFileSync(new URL('../content/geography.json',import.meta.url),'utf8'));

test('the five lessons cover exercises 1–10 and all five photographs',()=>{
  assert.equal(lessons.length,5);assert.deepEqual([...new Set(lessons.flatMap(l=>l.sources))].sort(),[1,2,3,4,5]);
  const exercises=new Set(lessons.flatMap(l=>l.exercises).map(e=>Number.parseInt(e)));
  for(let i=1;i<=10;i++)assert.ok(exercises.has(i),`Missing exercise ${i}`);
  for(const l of lessons){assert.equal(l.beats.length,6);assert.equal(l.quiz.length,3);for(const q of [l.checkpoint,...l.quiz]){assert.ok(q.answer>=0&&q.answer<q.options.length);assert.ok(q.hint&&q.explanation);}}
});
test('actual measured narration creates contiguous frame-aligned timelines',()=>{
  for(const l of lessons){let t=0;for(const b of l.beats){assert.ok(Math.abs(b.start-t)<.00001);assert.ok(b.duration>10);assert.ok(Math.abs(b.duration*24-Math.round(b.duration*24))<.00001);t+=b.duration;}assert.ok(Math.abs(l.duration-t)<.00001);assert.equal(l.checkpointAt,l.beats[2].end);}
});
test('wrong answers cannot increase mastery and a later correct answer resolves review',()=>{
  const s=freshState();recordAnswer(s,'orientacion:0',false);assert.equal(mastered(s,lessons),0);assert.deepEqual(s.mistakes,['orientacion:0']);
  recordAnswer(s,'orientacion:0',false);assert.equal(s.mistakes.length,1);recordAnswer(s,'orientacion:0',true);assert.equal(mastered(s,lessons),1);assert.deepEqual(s.mistakes,[]);recordAnswer(s,'orientacion:0',true);assert.equal(mastered(s,lessons),1);
});
test('pause triggers on forward crossing but never backward or after acknowledgement',()=>{
  assert.equal(checkpointCrossed(9,11,10,false),true);assert.equal(checkpointCrossed(11,9,10,false),false);assert.equal(checkpointCrossed(9,11,10,true),false);assert.equal(checkpointCrossed(10,11,10,false),false);
});
test('invalid persistence cannot break the initial lesson',()=>{
  for(const value of ['oops','null','[]','{"chapter":20}','{"chapter":1.2}'])assert.deepEqual(restoreState(value),freshState());
  assert.equal(restoreState('{"chapter":2,"answers":null}').chapter,2);assert.deepEqual(restoreState('{"chapter":2,"answers":[]}').answers,{});
});
test('captions and navigation use the active scene after seeking',()=>{
  const l=lessons[0];assert.equal(activeBeat(l,l.beats[4].start+1),4);assert.equal(activeBeat(l,0),0);
  assert.equal(currentCaption(l.beats[0],0),'');assert.ok(currentCaption(l.beats[0],2).startsWith('Imagina'));
});
test('the geographic source includes all five requested province boundaries',()=>{
  const names=new Set(geography.find(g=>g.iso==='DOM').features.map(f=>f.properties.shapeName));
  for(const name of ['Monte Cristi','Puerto Plata','San Juan','La Altagracia','Barahona'])assert.ok(names.has(name));
});
