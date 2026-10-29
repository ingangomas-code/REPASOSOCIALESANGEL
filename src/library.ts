import './library.css';
import {readDrafts,writeDraft,removeDraft,validateDraft,type Draft} from './library-store.mjs';
import {scienceIcon} from './science-art';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const dialog=$<HTMLDialogElement>('#create-dialog');
let drafts:Draft[]=[],editing:Draft|undefined,urls:string[]=[];
const progress=(key:string)=>{try{const s=JSON.parse(localStorage.getItem(key)??'{}');return Math.min(15,Object.values(s.answers??{}).filter(v=>v===true).length);}catch{return 0;}};
for(const [id,key] of [['sociales','atlas-sociales-v1'],['science','atlas-science-v1']]){
  const score=progress(key);$(`#${id}-progress`).textContent=`${score} / 15 retos`; $(`#${id}-bar`).style.width=`${score/15*100}%`;
}
$('#science-art').innerHTML=scienceIcon('butterfly');
function showFiles(files:File[]){
  urls.forEach(u=>URL.revokeObjectURL(u));urls=[];const list=$('#draft-files');list.replaceChildren();
  files.forEach(file=>{const item=document.createElement('a');item.className='file-card';const url=URL.createObjectURL(file);urls.push(url);item.href=url;item.target='_blank';item.rel='noopener';
    if(file.type.startsWith('image/')){const image=document.createElement('img');image.src=url;image.alt=file.name;item.append(image);}else{const badge=document.createElement('strong');badge.textContent='PDF';item.append(badge);}
    const name=document.createElement('span');name.textContent=file.name;item.append(name);list.append(item);
  });
}
function openDraft(draft?:Draft){
  editing=draft;$<HTMLFormElement>('#draft-form').reset();$('#draft-error').textContent='';
  $('#dialog-title').textContent=draft?'Tu cuaderno en preparación':'Crear nuevo cuaderno';
  $<HTMLInputElement>('#draft-title').value=draft?.title??'';$<HTMLInputElement>('#draft-subject').value=draft?.subject??'';
  $<HTMLSelectElement>('#draft-language').value=draft?.language??'es';$('#delete-draft').hidden=!draft;showFiles(draft?.files??[]);dialog.showModal();
}
async function drawDrafts(){
  const area=$('#draft-grid');area.replaceChildren();
  try{drafts=await readDrafts();}catch{drafts=[];$('#storage-note').textContent='Tu navegador no permite guardar cuadernos aquí. Abre Atlas desde un servidor local o desde la web.';}
  $('#draft-section').hidden=drafts.length===0;
  drafts.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).forEach(draft=>{const button=document.createElement('button');button.className='draft-card';
    const label=document.createElement('small');label.textContent='EN PREPARACIÓN';const title=document.createElement('h3');title.textContent=draft.title;
    const info=document.createElement('p');info.textContent=`${draft.subject||'Sin materia'} · ${draft.language==='en'?'Inglés':'Español'} · ${draft.files.length} archivos`;
    const action=document.createElement('span');action.textContent='Abrir cuaderno ↗';button.append(label,title,info,action);button.onclick=()=>openDraft(draft);area.append(button);
  });
}
$('#create-notebook').onclick=()=>openDraft();$('#create-empty').onclick=()=>openDraft();$('#close-create').onclick=()=>dialog.close();
$<HTMLInputElement>('#draft-upload').onchange=()=>showFiles([...(editing?.files??[]),...Array.from($<HTMLInputElement>('#draft-upload').files??[])]);
$<HTMLFormElement>('#draft-form').onsubmit=async event=>{
  event.preventDefault();const title=$<HTMLInputElement>('#draft-title').value.trim(),files=[...(editing?.files??[]),...Array.from($<HTMLInputElement>('#draft-upload').files??[])];
  const error=validateDraft(title,files);if(error){$('#draft-error').textContent=error;return;}
  const now=new Date().toISOString();const draft:Draft={id:editing?.id??crypto.randomUUID(),title,subject:$<HTMLInputElement>('#draft-subject').value.trim(),language:$<HTMLSelectElement>('#draft-language').value,files,createdAt:editing?.createdAt??now,updatedAt:now};
  try{await writeDraft(draft);dialog.close();await drawDrafts();$('#library-status').textContent='Cuaderno guardado en este navegador. Sus materiales están listos para preparar el repaso.';}catch{$('#draft-error').textContent='No se pudo guardar. Comprueba el espacio disponible en este navegador.';}
};
$('#delete-draft').onclick=async()=>{if(editing){await removeDraft(editing.id);dialog.close();await drawDrafts();$('#library-status').textContent='Borrador eliminado de este navegador.';}};
void drawDrafts();
