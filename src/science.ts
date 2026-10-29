import './style.css';
import './science.css';
import produced from '../content/science/timed-lessons.json';
import {activeBeat,formatTime,freshState,mastered,recordAnswer,restoreState} from './state.mjs';
import {renderScienceLab} from './science-labs';
import type {Lesson,Question,Beat} from './types';
type ScienceLesson=Lesson&{vocabulary:Record<string,string|undefined>};
const lessons=produced as ScienceLesson[],KEY='atlas-science-v1';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
let raw:string|null=null;try{raw=localStorage.getItem(KEY);}catch{}
const state=restoreState(raw),video=$<HTMLVideoElement>('#video'),checkpoint=$<HTMLDialogElement>('#checkpoint-dialog');
const total=lessons.reduce((n,l)=>n+l.quiz.length,0);
let index=state.chapter,previous=0,cc=true,loading=true,saveAt=0,currentTab='summary';
const current=()=>lessons[index];
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function toast(message:string){$('#toast').textContent=message;$('#toast').hidden=false;setTimeout(()=>$('#toast').hidden=true,4500);}
function progress(){const score=mastered(state,lessons);$('#total-progress').textContent=`${score} / ${total}`;$('#total-bar').style.width=`${score/total*100}%`;document.querySelectorAll<HTMLElement>('[data-science-state]').forEach(el=>{const n=Number(el.dataset.scienceState),l=lessons[n];el.textContent=l.quiz.every((_,i)=>state.answers[`${l.id}:${i}`])?'✓':n===index?'↗':'·';});}
function tab(name:string,scroll=false){currentTab=name;for(const t of ['summary','quiz','lab']){$(`#${t}-panel`).hidden=t!==name;$(`#${t}-tab`).setAttribute('aria-selected',String(t===name));$(`#${t}-tab`).tabIndex=t===name?0:-1;}if(name!=='summary')video.pause();if(scroll)$(`#${name}-panel`).scrollIntoView({behavior:'smooth',block:'start'});}
function question(q:Question,key:string,answered:boolean,correct:()=>void,number?:number){
  const root=document.createElement('article');root.className='question';const kicker=document.createElement('p');kicker.className='question-kicker';kicker.textContent=number?`CHALLENGE ${String(number).padStart(2,'0')}`:'CONNECT THE EVIDENCE';const heading=document.createElement('h3');heading.textContent=q.prompt;const options=document.createElement('div');options.className='options';const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');feedback.hidden=!answered;if(answered)feedback.textContent=`✓ ${q.explanation}`;let solved=answered;
  q.options.forEach((label,i)=>{const b=document.createElement('button');b.className=`option${answered&&i===q.answer?' correct':''}`;b.disabled=answered;const letter=document.createElement('span');letter.className='option-letter';letter.textContent=String.fromCharCode(65+i);b.append(letter,document.createTextNode(label));b.onclick=()=>{if(solved)return;if(i===q.answer){solved=true;b.classList.add('correct');options.querySelectorAll('button').forEach(x=>x.disabled=true);feedback.className='feedback';feedback.textContent=`✓ ${q.explanation}`;correct();}else{b.classList.add('incorrect');feedback.className='feedback wrong';feedback.textContent=`Look for one more clue. ${q.hint}`;if(key.includes(':')){recordAnswer(state,key,false);save();}}feedback.hidden=false;};options.append(b);});
  const hint=document.createElement('button');hint.className='hint-button';hint.textContent='↗ Give me a clue';hint.setAttribute('aria-expanded','false');const clue=document.createElement('p');clue.className='hint';clue.textContent=q.hint;clue.hidden=true;hint.onclick=()=>{clue.hidden=!clue.hidden;hint.setAttribute('aria-expanded',String(!clue.hidden));};const tools=document.createElement('div');tools.className='question-tools';tools.append(hint);root.append(kicker,heading,options,tools,clue,feedback);return root;
}
function result(){document.querySelector('#science-result')?.remove();const l=current();if(l.quiz.every((_,i)=>state.answers[`${l.id}:${i}`])){const box=document.createElement('div');box.id='science-result';box.className='quiz-result';box.innerHTML='<h3>Three ideas connected.</h3><p>Choose one answer and explain your evidence in your own words.</p>';const next=document.createElement('button');next.className='button accent';next.textContent=index===lessons.length-1?'Final mission →':'Next chapter →';next.onclick=()=>index===lessons.length-1?finalMission():load(index+1);box.append(next);$('#quiz-content').append(box);}}
function quiz(){const l=current();$('#quiz-content').replaceChildren(...l.quiz.map((q,i)=>question(q,`${l.id}:${i}`,Boolean(state.answers[`${l.id}:${i}`]),()=>{recordAnswer(state,`${l.id}:${i}`,true);save();progress();result();},i+1)));result();}
function load(n:number,remember=true){
  video.pause();if(remember&&video.currentTime>0)state.positions[current().id]=video.currentTime;
  index=n;state.chapter=n;loading=true;previous=0;saveAt=0;const l=current();document.documentElement.style.setProperty('--chapter',l.color);
  $('#lesson-kicker').textContent=`SCIENCE · CHAPTER ${l.number}`;$('#lesson-title').textContent=l.title;$('#lesson-subtitle').textContent=l.subtitle;$('#lesson-duration').textContent=`${formatTime(l.duration)} of discovery`;
  video.poster=`./science/media/${l.id}.jpg`;video.src=`./science/media/${l.id}.mp4`;video.load();$('#video-error').hidden=true;$('#big-play').hidden=false;
  $('#source-credit').textContent=`Worksheet photos ${l.sources.join(', ')} · Science review`;$('#next-chapter').textContent=n===lessons.length-1?'Final mission →':'Next chapter →';
  $('#chapter-list').replaceChildren(...lessons.map((item,j)=>{const b=document.createElement('button');b.className=`chapter-button${j===n?' selected':''}`;b.setAttribute('aria-label',`Chapter ${j+1}: ${item.title}`);b.setAttribute('aria-current',j===n?'step':'false');b.innerHTML=`<span class="chapter-num">${item.number}</span><span class="chapter-name">${item.title}<small>${item.subtitle}</small></span><span data-science-state="${j}" class="chapter-state"></span>`;b.onclick=()=>load(j);return b;}));
  $('#summary-cards').innerHTML=l.summary.map((s,i)=>`<article class="summary-card"><span class="summary-index">0${i+1}</span><p>${s}</p></article>`).join('');
  const vocab=document.createElement('details');vocab.className='word-help';const summary=document.createElement('summary');summary.textContent='Word help · English → Español';vocab.append(summary);for(const [word,meaning] of Object.entries(l.vocabulary)){const p=document.createElement('p');p.textContent=`${word} — ${meaning}`;vocab.append(p);}$('#summary-cards').append(vocab);
  $('#beat-nav').replaceChildren(...l.beats.map(b=>{const button=document.createElement('button');button.innerHTML=`<span>${formatTime(b.start)}</span>${b.title}`;button.setAttribute('aria-label',`Go to ${b.title}`);button.onclick=()=>{video.pause();video.currentTime=b.start;previous=b.start;};return button;}));
  $('#cue-dots').innerHTML=l.beats.slice(1).map(b=>`<i style="left:${b.start/l.duration*100}%"></i>`).join('');quiz();renderScienceLab($('#lab-content'),l.id);progress();tab('summary');save();tick();
}
function caption(beat:Beat,t:number){const relative=t-beat.start-.45;return beat.sentences?.find(s=>relative>=s.offset-.1&&relative<s.offset+s.duration+.25)?.text??'';}
function tick(){
  const l=current(),t=video.currentTime||0;$('#time').textContent=`${formatTime(t)} / ${formatTime(l.duration)}`;$<HTMLInputElement>('#seek').value=String(Math.min(1000,Math.round(t/l.duration*1000)));
  const which=activeBeat(l,t);document.querySelectorAll('#beat-nav button').forEach((el,i)=>el.classList.toggle('active',i===which));const text=caption(l.beats[which],t);$('#captions').textContent=text;$('#captions').hidden=!cc||!text;
  if(!loading&&!state.checkpoints[l.id]&&previous<l.checkpointAt&&t>=l.checkpointAt){video.pause();if(!checkpoint.open){$('#checkpoint-content').replaceChildren(question(l.checkpoint,`checkpoint-${l.id}`,false,()=>{state.checkpoints[l.id]=true;save();}));checkpoint.showModal();}}
  previous=t;if(!loading&&(Math.abs(t-saveAt)>3)){state.positions[l.id]=t;saveAt=t;save();}
}
async function play(){if(checkpoint.open)return;if(video.paused){try{await video.play();}catch{toast('Press Play to begin.');}}else video.pause();}
video.onloadedmetadata=()=>{const stored=Number(state.positions[current().id]);if(Number.isFinite(stored)&&stored>0&&stored<current().duration-2){video.currentTime=stored;previous=stored;}loading=false;tick();};
video.ontimeupdate=tick;video.onplay=()=>{$('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Pause');$('#big-play').hidden=true;};video.onpause=()=>{$('#play').textContent='▶';$('#play').setAttribute('aria-label','Play');};video.onended=()=>tab('quiz',true);video.onerror=()=>{$('#video-error').hidden=false;$('#big-play').hidden=true;};
$('#play').onclick=play;$('#big-play').onclick=play;video.onclick=play;
$('#back-ten').onclick=()=>{video.currentTime=Math.max(0,video.currentTime-10);previous=video.currentTime;};$('#repeat').onclick=()=>{video.currentTime=current().beats[activeBeat(current(),video.currentTime)].start;previous=video.currentTime;void video.play();};
$('#seek').oninput=()=>video.currentTime=Number($<HTMLInputElement>('#seek').value)/1000*current().duration;
$('#volume').oninput=()=>video.volume=Number($<HTMLInputElement>('#volume').value);$('#sound').onclick=()=>{video.muted=!video.muted;$('#sound').setAttribute('aria-label',video.muted?'Unmute':'Mute');$('#sound').textContent=video.muted?'♩':'♫';};$('#speed').onchange=()=>video.playbackRate=Number($<HTMLSelectElement>('#speed').value);
$('#cc').onclick=()=>{cc=!cc;$('#cc').setAttribute('aria-pressed',String(cc));$('#cc').setAttribute('aria-label',cc?'Hide captions':'Show captions');tick();};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#player-shell').requestFullscreen();}catch{toast('Use your browser’s full-screen option.');}};
$('#reload-video').onclick=()=>{video.load();$('#video-error').hidden=true;$('#big-play').hidden=false;};
$('#continue').onclick=()=>{state.checkpoints[current().id]=true;save();checkpoint.close();if(video.ended)tab('quiz',true);else void video.play();};checkpoint.oncancel=()=>{state.checkpoints[current().id]=true;save();};
for(const t of ['summary','quiz','lab']){$(`#${t}-tab`).onclick=()=>tab(t);$(`#${t}-tab`).onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const tabs=['summary','quiz','lab'];const next=tabs[(tabs.indexOf(currentTab)+(e.key==='ArrowRight'?1:2))%3];tab(next);$(`#${next}-tab`).focus();}};}
$('#start-quiz').onclick=()=>tab('quiz',true);$('#next-chapter').onclick=()=>index===lessons.length-1?finalMission():load(index+1);
$('#reset-quiz').onclick=()=>{current().quiz.forEach((_,i)=>delete state.answers[`${current().id}:${i}`]);save();quiz();progress();};
$('#review-errors').onclick=()=>{const mistake=state.mistakes.find(k=>lessons.some(l=>k.startsWith(`${l.id}:`)));if(mistake){load(lessons.findIndex(l=>mistake.startsWith(`${l.id}:`)));tab('quiz',true);}else toast('No questions are waiting for review. You can retry any chapter.');};
$('#explore-nav').onclick=()=>$('#lesson-title').scrollIntoView({behavior:'smooth'});$('#sources-nav').onclick=()=>{video.pause();$<HTMLDialogElement>('#sources-dialog').showModal();};
$('#source-gallery').innerHTML=Array.from({length:7},(_,i)=>`<a href="./science/sources/hoja-${i+1}.jpg" target="_blank" rel="noopener"><img loading="lazy" src="./science/sources/hoja-${i+1}-thumb.jpg" alt="Science worksheet ${i+1}">Worksheet ${i+1} ↗</a>`).join('');
document.querySelectorAll<HTMLButtonElement>('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog')!.close());
$('#reset-progress').onclick=()=>{video.pause();Object.assign(state,freshState());save();$<HTMLDialogElement>('#sources-dialog').close();load(0,false);toast('Science progress restarted.');};
const finals:Question[]=[
 {prompt:'Which pair shows living things that both have life cycles?',options:['Rock and chair','Apple tree and butterfly','Chair and apple tree'],answer:1,hint:'A plant and an animal can both grow and change.',explanation:'The apple tree and butterfly are living things. The rock and chair are nonliving.'},
 {prompt:'A tadpole has grown legs and still has a short tail. What stage comes before the adult frog?',options:['Froglet','Foal','Chrysalis'],answer:0,hint:'Look for the young frog stage.',explanation:'The froglet has legs and a remaining tail in your worksheet sequence.'},
 {prompt:'A foal resembles its parent but is smaller. What stays the same?',options:['Its age','Its size','The kind of animal: both are horses'],answer:2,hint:'Growth changes size and age, not a horse into another kind of animal.',explanation:'A foal and an adult horse are both horses.'},
 {prompt:'A nest and a burrow look different. How can they meet a similar need?',options:['Both are food','Both can provide shelter','Both are animal sounds'],answer:1,hint:'Think about a safe place for young animals.',explanation:'Different structures can both provide shelter.'},
 {prompt:'Which example links a behavior with a useful purpose?',options:['A dolphin uses sounds to communicate with its baby','A tiger grows into a butterfly','A parent stops its offspring from growing'],answer:0,hint:'Choose an action that can help a real young animal.',explanation:'Communication is one way animals interact with and help their young.'}
];
function finalMission(){video.pause();$('#final-content').replaceChildren(...finals.map((q,i)=>question(q,`final-${i}`,Boolean(state.final[i]),()=>{state.final[i]=true;save();finalResult();},i+1)));finalResult();$<HTMLDialogElement>('#final-dialog').showModal();}
function finalResult(){document.querySelector('#science-final-result')?.remove();if(finals.every((_,i)=>state.final[i])){const box=document.createElement('div');box.id='science-final-result';box.className='quiz-result';box.innerHTML='<h3>Investigation complete.</h3><p>You connected life cycles, offspring and care. Invent one new science question and explain its answer to someone.</p>';const repeat=document.createElement('button');repeat.className='button outline';repeat.textContent='Try the final mission again';repeat.onclick=()=>{state.final={};save();$<HTMLDialogElement>('#final-dialog').close();finalMission();};box.append(repeat);$('#final-content').append(box);}}
$('#final-nav').onclick=finalMission;
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!(e.target as HTMLElement).matches('button,input,select,textarea,[role=button]')&&!document.querySelector('dialog[open]')){e.preventDefault();void play();}});
window.addEventListener('pagehide',()=>{state.positions[current().id]=video.currentTime;save();});load(index);
