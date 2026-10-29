export interface Draft {id:string;title:string;subject:string;language:string;files:File[];createdAt:string;updatedAt:string}
export const DRAFT_DB:string;
export function validateDraft(title:string,files:File[]):string;
export function readDrafts():Promise<Draft[]>;
export function writeDraft(value:Draft):Promise<void>;
export function removeDraft(id:string):Promise<void>;
