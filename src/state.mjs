export const STORAGE_KEY='atlas-sociales-v1';
export function freshState(){return {chapter:0,positions:{},answers:{},checkpoints:{},mistakes:[],final:{}};}
export function restoreState(raw){
  try{
    const value=JSON.parse(raw);
    if(!value||!Number.isInteger(value.chapter)||value.chapter<0||value.chapter>4)return freshState();
    const next=freshState();next.chapter=value.chapter;
    for(const key of ['positions','answers','checkpoints','final'])if(value[key]&&typeof value[key]==='object'&&!Array.isArray(value[key]))next[key]=value[key];
    if(Array.isArray(value.mistakes))next.mistakes=value.mistakes.filter(v=>typeof v==='string').slice(0,100);
    return next;
  }catch{return freshState();}
}
export function mastered(state,lessons){return lessons.reduce((sum,l)=>sum+l.quiz.reduce((n,_,i)=>n+(state.answers[`${l.id}:${i}`]===true?1:0),0),0);}
export function recordAnswer(state,key,correct){
  if(correct){state.answers[key]=true;state.mistakes=state.mistakes.filter(k=>k!==key);}
  else if(!state.mistakes.includes(key))state.mistakes.push(key);
  return state;
}
export function activeBeat(lesson,time){let found=0;lesson.beats.forEach((b,i)=>{if(time>=b.start)found=i;});return found;}
export function checkpointCrossed(previous,current,at,answered){return !answered&&previous<at&&current>=at;}
export function formatTime(seconds){if(!Number.isFinite(seconds))return '0:00';const s=Math.max(0,Math.floor(seconds));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
export function currentCaption(beat,time){
  const sentences=beat.narration.split(/(?<=[.!?])\s+/);const total=sentences.reduce((n,s)=>n+s.length,0);
  const relative=time-beat.start-.65;if(relative<0||relative>beat.duration-1.5)return '';
  const target=relative/(beat.duration-1.5)*total;let count=0;
  return sentences.find(s=>(count+=s.length)>=target)??sentences.at(-1)??'';
}
