export interface Question {prompt:string;options:string[];answer:number;hint:string;explanation:string}
export interface SentenceTiming {offset:number;duration:number;text:string}
export interface Beat {title:string;label:string;visual:string;focus:string;facts:string[];narration:string;start:number;duration:number;end:number;voiceDuration?:number;sentences?:SentenceTiming[]}
export interface Lesson {id:string;number:string;title:string;subtitle:string;color:string;sources:number[];exercises:string[];summary:string[];beats:Beat[];checkpoint:Question;quiz:Question[];duration:number;checkpointAt:number}
export interface Feature {properties:{shapeName:string};geometry:{type:string;coordinates:any[]}}
export interface Geography {iso:string;features:Feature[];meta:Record<string,unknown>}
