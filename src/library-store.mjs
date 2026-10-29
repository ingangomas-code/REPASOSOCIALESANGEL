export const DRAFT_DB='atlas-notebook-drafts-v1';
export function validateDraft(title,files){
  if(!String(title).trim())return 'Escribe un nombre para el cuaderno.';
  if(String(title).trim().length>100)return 'Usa un nombre de hasta 100 caracteres.';
  if(files.length>30)return 'Puedes guardar hasta 30 archivos por cuaderno.';
  if(files.some(f=>f.size>20*1024*1024))return 'Cada archivo debe pesar menos de 20 MB.';
  if(files.some(f=>!f.type.startsWith('image/')&&f.type!=='application/pdf'))return 'Selecciona imágenes o documentos PDF.';
  return '';
}
function open(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DRAFT_DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('notebooks',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function readDrafts(){const db=await open();return new Promise((resolve,reject)=>{const req=db.transaction('notebooks').objectStore('notebooks').getAll();req.onsuccess=()=>{resolve(req.result);db.close();};req.onerror=()=>{reject(req.error);db.close();};});}
export async function writeDraft(value){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('notebooks','readwrite');tx.objectStore('notebooks').put(value);tx.oncomplete=()=>{resolve();db.close();};tx.onerror=()=>{reject(tx.error);db.close();};});}
export async function removeDraft(id){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('notebooks','readwrite');tx.objectStore('notebooks').delete(id);tx.oncomplete=()=>{resolve();db.close();};tx.onerror=()=>{reject(tx.error);db.close();};});}
