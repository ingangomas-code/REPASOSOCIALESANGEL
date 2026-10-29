import type {Beat,Lesson} from './types';
export interface StudyState {chapter:number;positions:Record<string,number>;answers:Record<string,boolean>;checkpoints:Record<string,boolean>;mistakes:string[];final:Record<string,boolean>}
export const STORAGE_KEY:string;
export function freshState():StudyState;
export function restoreState(raw:string|null):StudyState;
export function mastered(state:StudyState,lessons:Lesson[]):number;
export function recordAnswer(state:StudyState,key:string,correct:boolean):StudyState;
export function activeBeat(lesson:Lesson,time:number):number;
export function checkpointCrossed(previous:number,current:number,at:number,answered:boolean):boolean;
export function formatTime(seconds:number):string;
export function currentCaption(beat:Beat,time:number):string;
