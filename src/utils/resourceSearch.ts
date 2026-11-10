import type {Resource} from '../data/models';
const normalize=(text:string)=>text.normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g,' ');
/** The dropdown and result grid must use the same query matching. */
export function matchesResourceQuery(resource:Resource,query:string):boolean {
 const words=normalize(query).split(' ').filter(Boolean);if(!words.length)return true;
 const haystack=normalize([resource.title,resource.description,resource.moduleCode,resource.moduleName,resource.category,resource.type,resource.author?.university,...(resource.tags||[])].filter(Boolean).join(' '));
 return words.every(word=>haystack.includes(word));
}
export function resourceSearchKind(resource:Pick<Resource,'type'|'fileFormat'>):'PDF'|'Video'|'Article'{
 if(resource.fileFormat==='VIDEO'||resource.type==='Video link')return 'Video';
 if(resource.fileFormat==='WEB'||resource.type==='Article link'||resource.type==='Article')return 'Article';return 'PDF';
}
