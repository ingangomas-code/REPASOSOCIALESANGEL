import {scienceIcon,frogStages,butterflyStages} from './science-art';
const WORK='atlas-science-work-v1';
function saved():Record<string,string>{try{return JSON.parse(localStorage.getItem(WORK)??'{}');}catch{return {};}}
function remember(key:string,value:string){try{localStorage.setItem(WORK,JSON.stringify({...saved(),[key]:value}));}catch{}}
function element<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls=''){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function box(parent:HTMLElement,title:string){const div=element('div','','lab-box science-lab');div.append(element('h3',title));parent.append(div);return div;}
function status(parent:HTMLElement){const s=element('p','','lab-status');s.setAttribute('role','status');parent.append(s);return s;}
function choices(parent:HTMLElement,pairs:string[][],options:string[],title:string){
  const area=box(parent,title);area.classList.add('matching');const selects:HTMLSelectElement[]=[];
  for(const [name] of pairs){const label=element('label',name);const select=element('select');select.setAttribute('aria-label',`Match ${name}`);select.add(new Option('Choose a word…',''));options.forEach(o=>select.add(new Option(o,o)));label.append(select);selects.push(select);area.append(label);}
  const check=element('button','Check my connections →','button accent');const feedback=status(area);area.append(check);check.onclick=()=>{let correct=0;selects.forEach((s,i)=>{const good=s.value===pairs[i][1];s.style.borderColor=good?'#d9ff70':'#e5ae8e';if(good)correct++;});feedback.textContent=correct===pairs.length?'✓ All connections fit. Explain one of them in your own words.':`${correct} of ${pairs.length} fit. Recheck the orange borders and read the whole statement.`;};
}
function trueFalse(parent:HTMLElement,items:[string,boolean,string][],title:string){
  const area=box(parent,title);const inputs:{select:HTMLSelectElement;feedback:HTMLElement;correct:boolean;why:string}[]=[];
  items.forEach(([statement,correct,why])=>{const row=element('div','','truth-row');const label=element('label',statement);const select=element('select');select.setAttribute('aria-label',statement);select.add(new Option('Choose…',''));select.add(new Option('True','true'));select.add(new Option('False','false'));label.append(select);const feedback=element('p','','feedback');feedback.hidden=true;row.append(label,feedback);area.append(row);inputs.push({select,feedback,correct,why});});
  const button=element('button','Check and explain →','button accent');area.append(button);button.onclick=()=>inputs.forEach(item=>{item.feedback.hidden=false;const good=item.select.value===String(item.correct);item.feedback.textContent=good?`✓ ${item.why}`:'Look for a counterexample or a word such as some, all or never. Try again.';item.select.style.borderColor=good?'#d9ff70':'#e5ae8e';});
}
function order(parent:HTMLElement,stages:string[][],title:string){
  const area=box(parent,title),tray=element('div','','stage-tray'),answer=element('p','','stage-answer');let selected:number[]=[];const buttons:HTMLButtonElement[]=[];
  [3,0,2,1].forEach(i=>{const button=element('button','','stage-choice');button.innerHTML=scienceIcon(stages[i][0]);button.append(element('span',stages[i][1]));button.setAttribute('aria-label',`Add ${stages[i][1]}`);button.onclick=()=>{selected.push(i);button.disabled=true;update();};tray.append(button);buttons[i]=button;});
  const controls=element('div','','question-tools'),check=element('button','Check order','button accent'),reset=element('button','Start again ↻','text-button');controls.append(check,reset);const feedback=status(area);
  function update(){answer.textContent=selected.length?selected.map((n,i)=>`${i+1}. ${stages[n][1]}`).join(' → '):'Choose the first stage, then the next.';feedback.textContent='';}
  check.onclick=()=>feedback.textContent=selected.length!==4?'Choose all four stages before checking.':selected.every((n,i)=>n===i)?'✓ Your life cycle is in order. Which change helped you decide?':'Start with eggs, then follow how the young animal develops. You can try again.';
  reset.onclick=()=>{selected=[];buttons.forEach(b=>b.disabled=false);update();};area.append(tray,answer,controls);update();
}
function drawing(parent:HTMLElement,key:string,title:string,caption:string){
  const area=box(parent,title);area.append(element('p',caption,'lab-intro'));
  const label=element('label','My labels or explanation');const field=element('textarea');field.rows=3;field.placeholder='Name your stages or explain how the parent helps its young.';field.value=saved()[`${key}-words`]??'';field.oninput=()=>remember(`${key}-words`,field.value);label.append(field);area.append(label);
  const canvas=element('canvas');canvas.width=840;canvas.height=330;canvas.className='drawing-pad';canvas.setAttribute('aria-label','Drawing area. You may use the written explanation instead.');const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#f2efdd';ctx.fillRect(0,0,840,330);ctx.strokeStyle='#203844';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
  const previous=saved()[key];if(previous){const image=new Image();image.onload=()=>ctx.drawImage(image,0,0);image.src=previous;}
  let down=false;const point=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width*840,(e.clientY-r.top)/r.height*330];};
  canvas.onpointerdown=e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);down=true;ctx.beginPath();const [x,y]=point(e);ctx.moveTo(x,y);};
  canvas.onpointermove=e=>{if(!down)return;e.preventDefault();const [x,y]=point(e);ctx.lineTo(x,y);ctx.stroke();};
  const finish=()=>{if(down){down=false;remember(key,canvas.toDataURL('image/png'));}};canvas.onpointerup=finish;canvas.onpointercancel=finish;
  const clear=element('button','Clear drawing','text-button'),download=element('button','Save drawing as PNG ↗','text-button'),controls=element('div','','question-tools');
  clear.onclick=()=>{ctx.fillStyle='#f2efdd';ctx.fillRect(0,0,840,330);remember(key,'');};download.onclick=()=>{const a=element('a');a.href=canvas.toDataURL('image/png');a.download=`${key}.png`;a.click();};controls.append(clear,download);area.append(canvas,controls,element('p','Self-check: are the labels correct? Does your drawing show the scientific idea? Drawings are not automatically graded.','lab-intro'));
}
export function renderScienceLab(parent:HTMLElement,id:string){
  parent.replaceChildren();parent.append(element('div','Investigate with the evidence.','section-title'),element('p','Try the worksheet skills in a new way. Take your time and explain how you know.','lab-intro'));
  if(id==='science-living'){
    choices(parent,[['Butterfly','Living'],['Rock','Nonliving'],['Chair','Nonliving'],['Apple tree','Living']],['Living','Nonliving'],'Living or nonliving?');
    choices(parent,[['An apple tree begins as a…','seed'],['A baby animal grows into an…','adult']],['seed','adult','tadpole','egg'],'Complete the idea');
    trueFalse(parent,[['All living things have a life cycle.',true,'Living things grow and change through their life cycles.'],['All animals have exactly the same life cycle.',false,'Frogs and tigers have different stages.'],['A baby tiger is born from its mother.',true,'A tiger cub is born from its mother.'],['A caterpillar looks exactly like an adult butterfly.',false,'The caterpillar and adult butterfly have different body forms.'],['Plants grow and change during their life cycles.',true,'An apple tree changes as it grows from a seed.']],'True, false… and why?');
  }else if(id==='science-cycles'){
    order(parent,frogStages,'Rebuild the frog life cycle');order(parent,butterflyStages,'Rebuild the butterfly life cycle');
    drawing(parent,'science-two-stages','Draw TWO butterfly stages','Choose two different stages: egg, caterpillar, chrysalis or adult butterfly. Label both. Choosing two for your drawing does not remove the other stages from the full cycle.');
  }else if(id==='science-offspring'){
    choices(parent,[['Frog','Tadpole'],['Butterfly','Caterpillar'],['Duck','Duckling'],['Horse','Foal'],['Sheep','Lamb'],['Tiger','Cub'],['Bird','Chick']],['Foal','Cub','Lamb','Tadpole','Caterpillar','Chick','Duckling'],'Match adults and their young');
    choices(parent,[['Baby animals are usually… than adults.','smaller'],['Some offspring look… to their parents.','similar'],['A tadpole looks… from an adult frog.','different'],['All offspring come from…','parents']],['parents','different','similar','smaller'],'Use the word bank');
    const area=box(parent,'Compare a baby and its parent');
    for(const [key,prompt] of [['similar','Write ONE way a baby animal is similar to its parent.'],['different','Write ONE way a baby animal is different from its parent.']]){const label=element('label',prompt),input=element('textarea');input.rows=3;input.value=saved()[`science-${key}`]??'';input.oninput=()=>remember(`science-${key}`,input.value);label.append(input);area.append(label);}
    const reveal=element('button','Compare with an example','text-button'),example=element('p','Example: a foal and an adult horse both have four legs. The foal is smaller. Other answers can be correct when they match the animals you chose.','feedback');example.hidden=true;reveal.onclick=()=>example.hidden=!example.hidden;area.append(reveal,example);
  }else if(id==='science-care'){
    choices(parent,[['Animal parents… their babies from harm.','protect'],['Birds bring… to their hungry chicks.','food'],['A safe home for an animal is called…','shelter'],['Some sounds warn offspring about…','danger']],['shelter','danger','food','protect'],'Food, shelter, protect or danger?');
    choices(parent,[['Why do parents care for young?','To help them survive'],['What do hungry chicks need?','Food'],['What do some animals teach their offspring?','How to hunt'],['Why do some animals live in groups?','To protect offspring']],['How to hunt','Food','To help them survive','To protect offspring'],'Connect an action to its purpose');
  }else{
    choices(parent,[['Bird','Builds a nest for its young'],['Lion','Protects cubs from danger'],['Rabbit','Digs holes to provide shelter'],['Dolphin','Uses sounds to communicate with its baby']],['Uses sounds to communicate with its baby','Digs holes to provide shelter','Protects cubs from danger','Builds a nest for its young'],'Match the worksheet behaviors');
    trueFalse(parent,[['Some animal parents bring food to their babies.',true,'Many parent birds bring food to chicks.'],['Animals never protect their offspring from danger.',false,'A lion parent protecting cubs is a counterexample.'],['Some animals use sounds to communicate with their babies.',true,'The dolphin is the example in your worksheet.'],['Birds build nests to provide shelter for their offspring.',true,'Many birds use nests as shelter for eggs or young.'],['All animal parents care for offspring in exactly the same way.',false,'Parents can use different behaviors to help their young survive.']],'Check the care statements');
    drawing(parent,'science-parent-care','Show a parent helping its baby','Choose a bird, rabbit, lion or dolphin. Show a parent and its young, then explain the behavior: food, shelter, protection or communication.');
  }
}
