import './style.css';
import producedLessons from '../content/timed-lessons.json';
import producedGeography from '../content/geography.json';
import {activeBeat,checkpointCrossed,currentCaption,formatTime,freshState,mastered,recordAnswer,restoreState,STORAGE_KEY} from './state.mjs';
import {geometryPath,mapSvg,provinceColors} from './maps';
import type {Geography,Lesson,Question} from './types';

const lessons=producedLessons as Lesson[];
const geography=producedGeography as Geography[];
const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const video=$<HTMLVideoElement>('#video');
const seek=$<HTMLInputElement>('#seek');
const checkpoint=$<HTMLDialogElement>('#checkpoint-dialog');
let initialStorage:string|null=null;try{initialStorage=localStorage.getItem(STORAGE_KEY);}catch{}
const state=restoreState(initialStorage);
let selected=state.chapter,previousTime=0,cc=true,changing=false,saveAt=0;
let currentTab='summary';
let toastTimer:ReturnType<typeof setTimeout>;
const lesson=()=>lessons[selected];
const persist=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}};
function toast(message:string){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function updateProgress(){
  const count=mastered(state,lessons);$('#total-progress').textContent=`${count} / 15`;$('#total-bar').style.width=`${count/15*100}%`;
  document.querySelectorAll<HTMLElement>('[data-chapter-state]').forEach(el=>{const l=lessons[Number(el.dataset.chapterState)];const done=l.quiz.every((_,i)=>state.answers[`${l.id}:${i}`]===true);el.textContent=done?'✓':Number(el.dataset.chapterState)===selected?'↗':'·';});
}
function drawSidebar(){
  $('#chapter-list').replaceChildren(...lessons.map((l,i)=>{
    const button=document.createElement('button');button.className=`chapter-button${i===selected?' selected':''}`;
    button.setAttribute('aria-label',`Capítulo ${i+1}: ${l.title}`);button.setAttribute('aria-current',i===selected?'step':'false');
    button.innerHTML=`<span class="chapter-num">${l.number}</span><span class="chapter-name">${l.title}<small>${l.subtitle}</small></span><span class="chapter-state" data-chapter-state="${i}"></span>`;
    button.onclick=()=>loadChapter(i);return button;
  }));updateProgress();
}
function setTab(tab:string,focus=false){
  currentTab=tab;
  for(const key of ['summary','quiz','lab']){
    $(`#${key}-panel`).hidden=key!==tab;$(`#${key}-tab`).setAttribute('aria-selected',String(key===tab));$(`#${key}-tab`).tabIndex=key===tab?0:-1;
  }
  if(tab!=='summary')video.pause();
  if(focus)$(`#${tab}-panel`).scrollIntoView({behavior:'smooth',block:'start'});
}
function loadChapter(index:number,remember=true){
  video.pause();if(remember&&video.currentTime>0)state.positions[lesson().id]=video.currentTime;
  selected=index;state.chapter=index;previousTime=0;changing=true;
  const l=lesson();document.documentElement.style.setProperty('--chapter',l.color);
  $('#lesson-kicker').textContent=`CAPÍTULO ${l.number} · ${l.id==='orientacion'?'ORIENTACIÓN':l.id.toUpperCase()}`;
  $('#lesson-title').textContent=l.title;$('#lesson-subtitle').textContent=l.subtitle;
  $('#lesson-duration').textContent=`${formatTime(l.duration)} de descubrimientos`;
  $('#source-credit').textContent=`Basado en las hojas ${l.sources.join(', ')} · Ejercicios ${l.exercises.join(', ')}`;
  $('#next-chapter').textContent=index===4?'Ir a la misión final →':'Siguiente capítulo →';
  video.poster=`./media/${l.id}.jpg`;video.src=`./media/${l.id}.mp4`;video.load();
  $('#video-error').hidden=true;$('#big-play').hidden=false;$('#captions').hidden=true;
  $('#summary-cards').innerHTML=l.summary.map((s,i)=>`<article class="summary-card"><span class="summary-index">0${i+1}</span><p>${s}</p></article>`).join('');
  $('#beat-nav').replaceChildren(...l.beats.map((beat,i)=>{
    const b=document.createElement('button');b.innerHTML=`<span>${formatTime(beat.start)}</span>${beat.title}`;b.setAttribute('aria-label',`Ir a ${beat.title}`);
    b.onclick=()=>{video.currentTime=beat.start;previousTime=beat.start;video.pause();};return b;
  }));
  $('#cue-dots').innerHTML=l.beats.slice(1).map(b=>`<i style="left:${b.start/l.duration*100}%"></i>`).join('');
  drawSidebar();drawQuiz();drawLab();setTab('summary');persist();updateTime();
}
function questionCard(question:Question,key:string,answered:boolean,onCorrect:()=>void,number?:number){
  const root=document.createElement('article');root.className='question';
  const kicker=document.createElement('p');kicker.className='question-kicker';kicker.textContent=number?`RETO ${String(number).padStart(2,'0')}`:'CONECTA LAS PISTAS';root.append(kicker);
  const heading=document.createElement('h3');heading.textContent=question.prompt;root.append(heading);
  const options=document.createElement('div');options.className='options';root.append(options);
  const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');feedback.hidden=!answered;
  if(answered)feedback.textContent=`✓ ${question.explanation}`;
  let solved=answered;
  question.options.forEach((option,i)=>{
    const button=document.createElement('button');button.className=`option${answered&&i===question.answer?' correct':''}`;button.disabled=answered;
    const letter=document.createElement('span');letter.className='option-letter';letter.textContent=String.fromCharCode(65+i);button.append(letter,document.createTextNode(option));
    button.onclick=()=>{
      if(solved)return;
      if(i===question.answer){
        solved=true;button.classList.add('correct');feedback.className='feedback';feedback.textContent=`✓ ${question.explanation}`;
        options.querySelectorAll('button').forEach(b=>b.disabled=true);onCorrect();
      }else{
        button.classList.add('incorrect');button.setAttribute('aria-label',`${option}. Revisa esta respuesta`);
        feedback.className='feedback wrong';feedback.textContent=`Todavía falta una pista. ${question.hint}`;
        if(key.includes(':')){recordAnswer(state,key,false);persist();}
      }
      feedback.hidden=false;
    };options.append(button);
  });
  const tools=document.createElement('div');tools.className='question-tools';
  const hint=document.createElement('button');hint.className='hint-button';hint.textContent='↗ Dame una pista';hint.setAttribute('aria-expanded','false');
  const hintText=document.createElement('p');hintText.className='hint';hintText.textContent=question.hint;hintText.hidden=true;
  hint.onclick=()=>{hintText.hidden=!hintText.hidden;hint.setAttribute('aria-expanded',String(!hintText.hidden));};tools.append(hint);root.append(tools,hintText,feedback);return root;
}
function drawQuiz(){
  const l=lesson();$('#quiz-content').replaceChildren(...l.quiz.map((q,i)=>questionCard(q,`${l.id}:${i}`,state.answers[`${l.id}:${i}`]===true,()=>{
    recordAnswer(state,`${l.id}:${i}`,true);persist();updateProgress();showQuizResult();
  },i+1)));showQuizResult();
}
function showQuizResult(){
  $('#quiz-result')?.remove();const l=lesson();
  if(l.quiz.every((_,i)=>state.answers[`${l.id}:${i}`]===true)){
    const result=document.createElement('div');result.id='quiz-result';result.className='quiz-result';
    result.innerHTML='<h3>Tres ideas conectadas.</h3><p>Ahora elige una respuesta y explica en voz alta cómo llegaste a ella.</p>';
    const next=document.createElement('button');next.className='button accent';next.textContent=selected===4?'Misión final →':'Siguiente capítulo →';next.onclick=()=>selected===4?openFinal():loadChapter(selected+1);result.append(next);$('#quiz-content').append(result);
  }
}
function showCheckpoint(){
  if(checkpoint.open)return;video.pause();const id=lesson().id;
  $('#checkpoint-content').replaceChildren(questionCard(lesson().checkpoint,`checkpoint-${id}`,Boolean(state.checkpoints[id]),()=>{state.checkpoints[id]=true;persist();}));checkpoint.showModal();
}
function updateTime(){
  const l=lesson(),time=video.currentTime||0;
  $('#time').textContent=`${formatTime(time)} / ${formatTime(l.duration)}`;seek.value=String(Math.round(time/l.duration*1000));
  const beatIndex=activeBeat(l,time);document.querySelectorAll('#beat-nav button').forEach((b,i)=>b.classList.toggle('active',i===beatIndex));
  const caption=currentCaption(l.beats[beatIndex],time);$('#captions').textContent=caption;$('#captions').hidden=!cc||!caption;
  if(!changing&&checkpointCrossed(previousTime,time,l.checkpointAt,Boolean(state.checkpoints[l.id])))showCheckpoint();
  previousTime=time;
  if(time-saveAt>3||time<saveAt){state.positions[l.id]=time;persist();saveAt=time;}
}
async function togglePlay(){
  if(checkpoint.open)return;
  if(video.paused){try{await video.play();}catch{toast('Pulsa reproducir para comenzar.');}}else video.pause();
}
video.addEventListener('loadedmetadata',()=>{
  const remembered=Number(state.positions[lesson().id]);
  if(Number.isFinite(remembered)&&remembered>0&&remembered<lesson().duration-2){video.currentTime=remembered;previousTime=remembered;}
  changing=false;updateTime();
});
video.addEventListener('timeupdate',updateTime);
video.addEventListener('play',()=>{$('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Pausar');$('#big-play').hidden=true;});
video.addEventListener('pause',()=>{$('#play').textContent='▶';$('#play').setAttribute('aria-label','Reproducir');});
video.addEventListener('ended',()=>{setTab('quiz',true);});
video.addEventListener('error',()=>{$('#video-error').hidden=false;$('#big-play').hidden=true;});
$('#play').onclick=togglePlay;$('#big-play').onclick=togglePlay;video.onclick=togglePlay;
$('#back-ten').onclick=()=>{video.currentTime=Math.max(0,video.currentTime-10);previousTime=video.currentTime;};
$('#repeat').onclick=()=>{video.currentTime=lesson().beats[activeBeat(lesson(),video.currentTime)].start;previousTime=video.currentTime;void video.play();};
seek.oninput=()=>{video.currentTime=Number(seek.value)/1000*lesson().duration;};
$('#cc').onclick=()=>{cc=!cc;$('#cc').setAttribute('aria-pressed',String(cc));$('#cc').setAttribute('aria-label',cc?'Ocultar subtítulos':'Mostrar subtítulos');updateTime();};
$('#sound').onclick=()=>{video.muted=!video.muted;$('#sound').textContent=video.muted?'♩':'♫';$('#sound').setAttribute('aria-label',video.muted?'Activar sonido':'Silenciar');};
$('#volume').oninput=()=>{video.volume=Number($<HTMLInputElement>('#volume').value);};
$('#speed').onchange=()=>{video.playbackRate=Number($<HTMLSelectElement>('#speed').value);};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#player-shell').requestFullscreen();}catch{toast('Usa la opción de pantalla completa de tu navegador.');}};
$('#reload-video').onclick=()=>{video.load();$('#video-error').hidden=true;$('#big-play').hidden=false;};
$('#continue').onclick=()=>{state.checkpoints[lesson().id]=true;persist();checkpoint.close();void video.play();};
checkpoint.addEventListener('cancel',()=>{state.checkpoints[lesson().id]=true;persist();});
for(const key of ['summary','quiz','lab']){
  $(`#${key}-tab`).onclick=()=>setTab(key);
  $(`#${key}-tab`).onkeydown=event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();const keys=['summary','quiz','lab'];const next=keys[(keys.indexOf(currentTab)+(event.key==='ArrowRight'?1:2))%3];setTab(next);$(`#${next}-tab`).focus();
    }
  };
}
$('#start-quiz').onclick=()=>setTab('quiz',true);
$('#reset-quiz').onclick=()=>{lesson().quiz.forEach((_,i)=>delete state.answers[`${lesson().id}:${i}`]);persist();drawQuiz();updateProgress();};
$('#next-chapter').onclick=()=>selected===4?openFinal():loadChapter(selected+1);
$('#review-errors').onclick=()=>{
  const first=state.mistakes.find(key=>lessons.some(l=>key.startsWith(`${l.id}:`)));
  if(first){loadChapter(lessons.findIndex(l=>first.startsWith(`${l.id}:`)));setTab('quiz',true);}else toast('No hay respuestas pendientes de revisar. Puedes volver a intentar cualquier capítulo.');
};
$('#explore-nav').onclick=()=>{$('#lesson-title').scrollIntoView({behavior:'smooth'});};
$('#sources-nav').onclick=()=>{video.pause();$<HTMLDialogElement>('#sources-dialog').showModal();};
$('#reset-progress').onclick=()=>{video.pause();Object.assign(state,freshState());persist();$<HTMLDialogElement>('#sources-dialog').close();loadChapter(0,false);toast('Repaso reiniciado. Tu expedición comienza de nuevo.');};
$('#source-gallery').innerHTML=lessons.map((_,i)=>`<a href="./sources/hoja-${i+1}.jpg" target="_blank" rel="noopener"><img src="./sources/hoja-${i+1}-thumb.jpg" alt="Hoja original ${i+1} del repaso de Sociales" loading="lazy">Ver hoja ${i+1} ↗</a>`).join('');
document.querySelectorAll<HTMLButtonElement>('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog')!.close());

const finalQuestions:Question[]=[
  {prompt:'Sales de casa al este y regresas por el mismo camino. ¿Qué dirección debes tomar?',options:['Sur','Oeste','Norte'],answer:1,hint:'La vuelta invierte la dirección de la ida.',explanation:'Debes volver al oeste, la dirección opuesta al este.'},
  {prompt:'Un punto está al sur del ecuador. ¿Qué nos permite afirmar?',options:['Está en el hemisferio sur','Está en Haití','Está al oeste de República Dominicana'],answer:0,hint:'Usa solo la relación que demuestra la línea del ecuador.',explanation:'Pertenece al hemisferio sur. No conocemos su país ni su posición respecto a otro lugar.'},
  {prompt:'¿Qué explicación usa bien las tres pistas: Haití, oeste y Puerto Príncipe?',options:['Puerto Príncipe es la capital dominicana, al oeste','Haití está al este y su capital es Santiago','Haití ocupa el oeste de la isla y su capital es Puerto Príncipe'],answer:2,hint:'Repasa qué país ocupa cada parte y cuál es su capital.',explanation:'Haití ocupa la parte oeste de La Española; Puerto Príncipe es su capital.'},
  {prompt:'Eliges Puerto Plata para señalar una provincia del norte. ¿Qué otra pista encaja?',options:['Está junto al canal de la Mona','Tiene costa en el Atlántico','Es una provincia del interior sin costa'],answer:1,hint:'Conecta el norte de la isla con su océano.',explanation:'Puerto Plata tiene costa en el Atlántico, al norte de la isla.'},
  {prompt:'La pregunta dice escuela, pero el cartel dice estación de bomberos. ¿Qué haría un buen investigador?',options:['Repetiría escuela sin mirar','Inventaría otra dirección','Señalaría la diferencia y leería los datos del cartel'],answer:2,hint:'La evidencia visible es más útil que adivinar lo que querían preguntar.',explanation:'Conviene señalar la inconsistencia y utilizar los datos que realmente aparecen en la imagen.'},
];
function openFinal(){
  video.pause();const container=$('#final-content');
  container.replaceChildren(...finalQuestions.map((q,i)=>questionCard(q,`final-${i}`,state.final[i]===true,()=>{state.final[i]=true;persist();finalResult();},i+1)));
  finalResult();$<HTMLDialogElement>('#final-dialog').showModal();
}
function finalResult(){
  $('#final-result')?.remove();if(finalQuestions.every((_,i)=>state.final[i]===true)){
    const done=document.createElement('div');done.id='final-result';done.className='quiz-result';done.innerHTML='<h3>Misión conectada.</h3><p>Has relacionado orientación, hemisferios, países, provincias y comunidad. Tu último desafío: inventa una pregunta nueva y explica su respuesta a alguien.</p>';
    const reset=document.createElement('button');reset.className='button outline';reset.textContent='Repetir misión';reset.onclick=()=>{state.final={};persist();$<HTMLDialogElement>('#final-dialog').close();openFinal();};done.append(reset);$('#final-content').append(done);
  }
}
$('#final-nav').onclick=openFinal;

function drawLab(){
  const panel=$('#lab-content');const id=lesson().id;
  if(id==='orientacion'){
    panel.innerHTML='<div class="section-title"><h2>Giras tú. El norte permanece.</h2></div><p class="lab-intro">Cambia hacia dónde miras. Descubre qué dirección queda a tu derecha, a tu izquierda y detrás.</p><div class="lab-box compass-lab"><div class="compass-drawing"><svg viewBox="0 0 300 250" role="img" aria-label="Brújula con norte arriba"><circle cx="150" cy="125" r="83" fill="none" stroke="#496772"/><path d="M150 48V202M73 125H227" stroke="#708e99"/><text x="150" y="23" text-anchor="middle" fill="#d9ff70">NORTE</text><text x="150" y="240" text-anchor="middle" fill="#b5ccd4">SUR</text><text x="12" y="130" fill="#b5ccd4">O</text><text x="277" y="130" fill="#b5ccd4">E</text><g id="facing-arrow" transform="rotate(0 150 125)"><path d="M150 58 168 150 150 135 132 150Z" fill="#d9ff70"/></g></svg></div><div><label class="lab-label" for="facing">Estoy mirando hacia el…</label><select id="facing"><option value="0">Norte</option><option value="1">Este</option><option value="2">Sur</option><option value="3">Oeste</option></select><p class="lab-answer" id="facing-result" role="status"></p></div></div>';
    const update=()=>{const v=Number($<HTMLSelectElement>('#facing').value),dirs=['norte','este','sur','oeste'];$('#facing-arrow').setAttribute('transform',`rotate(${v*90} 150 125)`);$('#facing-result').textContent=`A tu derecha: ${dirs[(v+1)%4]}. A tu izquierda: ${dirs[(v+3)%4]}. Detrás: ${dirs[(v+2)%4]}.`;};$('#facing').onchange=update;update();
  }else if(id==='hemisferios'){
    panel.innerHTML='<div class="section-title"><h2>Investiga las dos mitades.</h2></div><p class="lab-intro">Elige una referencia. Los colores siguen exactamente la actividad de tu hoja.</p><div class="lab-box"><div class="hemisphere-lab"><button data-half="norte">Hemisferio norte</button><button data-half="ecuador">Ecuador</button><button data-half="sur">Hemisferio sur</button></div><svg viewBox="0 0 500 350" style="width:100%;max-height:320px" role="img" aria-label="Tierra dividida por el ecuador"><path id="half-north" d="M100 175A150 150 0 0 1 400 175Z" fill="#457da8"/><path id="half-south" d="M100 175A150 150 0 0 0 400 175Z" fill="#3b8c70"/><path id="half-line" d="M80 175H420" stroke="#f26576" stroke-width="6"/><text x="250" y="100" text-anchor="middle" fill="white" font-size="20">NORTE</text><text x="250" y="260" text-anchor="middle" fill="white" font-size="20">SUR</text></svg><p id="half-result" class="lab-answer" role="status">Selecciona una de las tres referencias.</p></div>';
    const answers:Record<string,string>={norte:'Azul: hemisferio norte. Aquí está República Dominicana, al norte del ecuador.',ecuador:'Rojo: ecuador. Es una línea imaginaria que separa los hemisferios norte y sur.',sur:'Verde: hemisferio sur. Cruzar el ecuador hacia el sur te lleva a esta mitad.'};
    panel.querySelectorAll<HTMLButtonElement>('[data-half]').forEach(b=>b.onclick=()=>{panel.querySelectorAll('[data-half]').forEach(el=>el.classList.remove('selected'));b.classList.add('selected');$('#half-result').textContent=answers[b.dataset.half!];$('#half-north').setAttribute('opacity',b.dataset.half==='norte'?'1':'.4');$('#half-south').setAttribute('opacity',b.dataset.half==='sur'?'1':'.4');$('#half-line').setAttribute('stroke-width',b.dataset.half==='ecuador'?'12':'6');});
  }else if(id==='isla'){
    panel.innerHTML=`<div class="section-title"><h2>Rodea la isla con cuatro pistas.</h2></div><p class="lab-intro">Selecciona una dirección. Observa la diferencia entre el país y la isla completa.</p><div class="lab-box map-lab"><svg viewBox="-510 -300 1020 600" role="img" aria-label="Isla La Española con Haití al oeste y República Dominicana al este">${geography.map(g=>g.features.map(f=>`<path d="${geometryPath(f,true)}" fill="${g.iso==='DOM'?'#b5c4ff':'#7fa6a1'}" stroke="#16313e" stroke-width="1"/>`).join('')).join('')}<text x="-260" y="-15" text-anchor="middle" fill="#10232c" font-size="25">HAITÍ</text><text x="200" y="-25" text-anchor="middle" fill="#10232c" font-size="21">REPÚBLICA DOMINICANA</text><text x="0" y="-230" text-anchor="middle" class="sea-label">NORTE</text><text x="0" y="245" text-anchor="middle" class="sea-label">SUR</text></svg><div class="direction-row">${['Norte','Sur','Este','Oeste'].map(d=>`<button data-direction="${d}">${d} ↗</button>`).join('')}</div><p id="island-result" class="lab-answer" role="status">¿Qué hay alrededor de la isla?</p></div>`;
    const info:Record<string,string>={Norte:'Océano Atlántico. Está al norte de la isla completa y del país República Dominicana.',Sur:'Mar Caribe. Está al sur de la isla.',Este:'Canal de la Mona. Separa La Española de Puerto Rico.',Oeste:'Isla completa: canal del Viento, hacia Cuba. País República Dominicana: frontera terrestre con Haití.'};
    panel.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(b=>b.onclick=()=>{$('#island-result').textContent=info[b.dataset.direction!];panel.querySelectorAll('[data-direction]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});
  }else if(id==='provincias'){
    const tasks=[['Monte Cristi','estrella','una estrella'],['Puerto Plata','rojo','rojo'],['San Juan','azul','azul'],['La Altagracia','verde','verde'],['Barahona','amarillo','amarillo']];let task=0,tool='estrella';
    panel.innerHTML='<div class="section-title"><h2>Completa tu mapa.</h2></div><p class="lab-intro">Escoge una herramienta y después toca la provincia. También puedes usar Tab y Enter para recorrer el mapa.</p><div class="lab-box map-lab"><p id="map-instruction" class="map-instruction"></p><div class="hemisphere-lab">'+[['estrella','★ Estrella'],['rojo','Rojo'],['azul','Azul'],['verde','Verde'],['amarillo','Amarillo']].map(([v,label])=>`<button data-tool="${v}" class="${v===tool?'selected':''}">${label}</button>`).join('')+'</div>'+mapSvg(geography,true)+'<p class="lab-status" id="map-status" role="status"></p><button class="text-button" id="map-reset">Repetir mapa ↻</button></div>';
    const instruction=()=>{$('#map-instruction').textContent=task<tasks.length?`${task+1} de 5 · Marca ${tasks[task][0]} con ${tasks[task][2]}.`:'Cinco provincias localizadas. Monte Cristi y Puerto Plata son ejemplos de la región norte.';};instruction();
    panel.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool!;panel.querySelectorAll('[data-tool]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});
    const mark=(path:HTMLElement)=>{
      if(task>=tasks.length)return;const [name,wanted]=tasks[task];
      if(path.dataset.province!==name){$('#map-status').textContent=`Tocaste ${path.dataset.province}. Busca ${name}; compara su posición con las otras provincias.`;return;}
      if(tool!==wanted){$('#map-status').textContent=`La provincia es correcta. Revisa la herramienta: esta vez necesitas ${tasks[task][2]}.`;return;}
      path.style.fill=provinceColors[name];
      if(task===0){const star=document.createElementNS('http://www.w3.org/2000/svg','text');star.setAttribute('x','-286');star.setAttribute('y','-210');star.setAttribute('fill','#10232c');star.setAttribute('font-size','28');star.textContent='★';panel.querySelector('svg')!.append(star);}
      task++;$('#map-status').textContent=`✓ ${name}: ${tasks[task-1][2]}.`;instruction();
    };
    panel.querySelectorAll<HTMLElement>('[data-province][role=button]').forEach(path=>{path.onclick=()=>mark(path);path.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();mark(path);}};});
    $('#map-reset').onclick=()=>drawLab();
  }else{
    const pairs=[['Aeropuerto','Llegada y salida de aviones'],['Biblioteca','Leer e investigar'],['Iglesia','Lugar de culto'],['Restaurante','Preparar y servir comidas'],['Lucas','Ciudad, cerca de una escuela'],['Sofía','Campo, cerca de una granja'],['Mateo','Costa, cerca de la playa']];
    const options=[...pairs.map(p=>p[1])].reverse();
    panel.innerHTML='<div class="section-title"><h2>Une nombres con evidencias.</h2></div><p class="lab-intro">Cada lugar tiene una función. Cada personaje nos da pistas sobre su comunidad.</p><div class="lab-box matching">'+pairs.map(([name],i)=>`<label>${name}<select data-match="${i}" aria-label="Relacionar ${name}"><option value="">Elige la pista…</option>${options.map(v=>`<option>${v}</option>`).join('')}</select></label>`).join('')+'<button class="button accent" id="check-matches">Comprobar conexiones →</button><p class="lab-status" id="match-status" role="status"></p></div>';
    $('#check-matches').onclick=()=>{let correct=0;panel.querySelectorAll<HTMLSelectElement>('[data-match]').forEach(select=>{const good=select.value===pairs[Number(select.dataset.match)][1];select.style.borderColor=good?'#d9ff70':'#df9b83';if(good)correct++;});$('#match-status').textContent=correct===7?'✓ Las siete conexiones encajan. Explica qué pista usaste para reconocer a cada personaje.':`${correct} de 7 conexiones encajan. Revisa las marcadas en naranja; piensa en la función o en la descripción completa.`;};
  }
}
document.addEventListener('keydown',event=>{
  const target=event.target as HTMLElement;
  if(event.code==='Space'&&!target.matches('button,input,select,textarea,[role=button]')&&!document.querySelector('dialog[open]')){event.preventDefault();void togglePlay();}
});
window.addEventListener('pagehide',()=>{state.positions[lesson().id]=video.currentTime;persist();});
loadChapter(selected);
