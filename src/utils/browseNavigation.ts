/** Match older subject shortcuts to the category names actually saved by admins. */
export function resolveBrowseCategory(value:string|null,names:string[]):string {
 if(!value||value.toLowerCase()==='all')return 'All';
 const exact=names.find(name=>name.toLowerCase()===value.toLowerCase());if(exact)return exact;
 const aliases:Record<string,string>={java:'Programming',python:'Programming',sql:'Databases','cyber security':'Cybersecurity','java & oop':'Programming'};
 const canonical=aliases[value.toLowerCase()]||value;
 return names.find(name=>name.toLowerCase()===canonical.toLowerCase())||canonical;
}
export function resolveBrowseType(value:string|null):string {
 const types:Record<string,string>={'past paper':'Past paper','past papers':'Past paper',pdf:'PDF','lecture note':'Lecture note','video link':'Video link',article:'Article'};
 return types[(value||'').toLowerCase()]||'All';
}
