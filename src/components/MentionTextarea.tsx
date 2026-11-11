import React, {useRef, useState} from 'react';
import type {User} from '../data/models';
type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {value:string; onChange:(value:string)=>void; users:User[]};
export function MentionTextarea({value,onChange,users,...props}:Props) {
  const ref=useRef<HTMLTextAreaElement>(null);
  const [caret,setCaret]=useState(0), [open,setOpen]=useState(false), [active,setActive]=useState(0);
  const match=/(?:^|\s)@([A-Za-z0-9_]*)$/.exec(value.slice(0,caret));
  const choices=match && open ? users.filter(u=>u.username && u.username.toLowerCase().startsWith(match[1].toLowerCase())).slice(0,8) : [];
  const choose=(username:string)=>{
    const start=caret-(match?.[1].length||0)-1;
    const insert=`@${username} `;
    onChange(value.slice(0,start)+insert+value.slice(caret)); setOpen(false);
    requestAnimationFrame(()=>{ref.current?.focus();ref.current?.setSelectionRange(start+insert.length,start+insert.length);});
  };
  return <div className="relative"><textarea {...props} ref={ref} value={value} maxLength={1500}
    aria-label={props['aria-label'] || 'Discussion message'} aria-autocomplete="list" aria-expanded={choices.length>0}
    onChange={e=>{onChange(e.target.value);setCaret(e.target.selectionStart);setOpen(true);setActive(0);}}
    onClick={e=>{setCaret(e.currentTarget.selectionStart);setOpen(true);}}
    onKeyDown={e=>{if(!choices.length)return;if(e.key==='Escape'){setOpen(false);e.preventDefault();}if(e.key==='ArrowDown'){setActive((active+1)%choices.length);e.preventDefault();}if(e.key==='ArrowUp'){setActive((active+choices.length-1)%choices.length);e.preventDefault();}if(e.key==='Enter'){choose(choices[active%choices.length].username);e.preventDefault();}}}/>
    {choices.length>0 && <div role="listbox" aria-label="Mention a member" className="absolute left-0 right-0 z-30 border rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-lg p-1 max-h-56 overflow-auto">{choices.map((u,i)=><button key={u.id} role="option" aria-selected={i===active} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>choose(u.username)} className={`block w-full text-left rounded-lg px-3 py-2 text-sm ${i===active?'bg-orange-100 dark:bg-orange-950':''}`}><strong>@{u.username}</strong> · {u.name}</button>)}</div>}
  </div>;
}
