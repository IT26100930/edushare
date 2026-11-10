import {discussionId} from './discussion';
export type SavedCollection={id:string;name:string;resourceIds:string[];createdAt:string};
export type WatchProgress={resourceId:string;status:'IN_PROGRESS'|'COMPLETED';seconds:number;updatedAt:string};
export function resourceKey(id:number):string{return id<0?`backend-link-${-id}`:`backend-resource-${id}`;}
export function personalResourceId(id:string):string{const value=discussionId(id);if(!value)throw new Error('This resource cannot be saved.');return value;}
export async function libraryRequest(path:string,method='GET',body?:unknown){
 const response=await fetch(path,{method,credentials:'include',cache:'no-store',...(body!==undefined?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=response.status===204?null:await response.json().catch(()=>null);
 if(!response.ok)throw new Error(data?.error||'Could not save your changes. Please try again.');return data;
}
