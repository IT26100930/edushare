import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, X, FileWarning, Megaphone, RefreshCw, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export type StudentNotice = {id:string;title:string;message:string;kind:string;url:string;createdAt:string;read:boolean};
export type StudentNoticeFeed = {items: StudentNotice[]; unread:number};
export const NotificationBell: React.FC = () => {
  const { currentUser, addToast } = useApp();
  const identity = useRef(currentUser?.id);
  identity.current = currentUser?.id;
  const seen = useRef<Set<string> | null>(null);
  const toast = useRef(addToast);
  toast.current = addToast;
  const latestFetch = useRef(0);
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  const [items,setItems] = useState<StudentNotice[]>([]);
  const [unread,setUnread] = useState(0);
  const [error,setError] = useState('');
  const refresh = useCallback(async()=>{
    if (!currentUser) {setItems([]);setUnread(0);return;}
    const owner = currentUser.id;
    const sequence = ++latestFetch.current;
    try {
      const res=await fetch('/api/notifications',{credentials:'include',cache:'no-store'});
      if(!res.ok)throw new Error(`Notifications unavailable (HTTP ${res.status})`);
      const body:StudentNoticeFeed=await res.json();
      if (identity.current !== owner || sequence !== latestFetch.current) return;
      const notices = body.items || [];
      const arrivals = seen.current === null ? [] : notices.filter(item => !item.read && !seen.current!.has(item.id) && ['request-new', 'request', 'request-accepted'].includes(item.kind));
      seen.current = new Set(notices.map(item => item.id));
      if (arrivals.length) toast.current({title: arrivals.length === 1 ? arrivals[0].title : `${arrivals.length} new request updates`, message: 'Open the notification bell to view the request.', type: 'info'});
      setItems(notices);setUnread(body.unread || 0);setError('');
    } catch(e) {if(identity.current === owner && sequence === latestFetch.current)setError(e instanceof Error?e.message:'Unable to load notifications');}
  },[currentUser?.id]);
  useEffect(()=>{
    seen.current = null;setItems([]);setUnread(0);setError('');
    void refresh();
    const timer=window.setInterval(()=>{if(!document.hidden)void refresh()},15000);
    window.addEventListener('focus',refresh);
    window.addEventListener('edushare-notifications-changed',refresh);
    return ()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('edushare-notifications-changed',refresh);latestFetch.current++};
  },[refresh]);
  useEffect(()=>setOpen(false),[currentUser?.id]);
  const openNotice=async(item:StudentNotice)=>{
    setOpen(false);
    if(!item.read) {
      try {await fetch(`/api/notifications/${encodeURIComponent(item.id)}/read`,{method:'POST',credentials:'include'});} catch{}
    }
    void refresh(); navigate(item.url);
  };
  if(!currentUser)return null;
  return <div className="relative shrink-0">
    <button type="button" onClick={()=>{setOpen(!open);if(!open)void refresh()}}
      aria-label={`Notifications, ${unread} unread`} aria-expanded={open}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E2D6] bg-white text-neutral-700 hover:text-[#FF4A00] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
      <Bell size={17}/>{unread>0&&<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[9px] rounded-full bg-[#FF4A00] text-white font-bold flex items-center justify-center">{unread>99?'99+':unread}</span>}
    </button>
    <span className="sr-only" role="status" aria-live="polite">{unread} unread notifications</span>
    {open&&<>
      <button type="button" aria-label="Close notifications" className="fixed inset-0 z-[80] cursor-default" onClick={()=>setOpen(false)} />
      <div role="dialog" aria-label="Notifications" className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-12 z-[90] w-[min(calc(100vw-24px),380px)] max-h-[70vh] overflow-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-[#1C202A] text-neutral-900 dark:text-white">
        <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-[#1C202A]">
          <h3 className="font-extrabold text-sm">Notifications <span className="text-[#FF4A00]">{unread?`(${unread} new)`:''}</span></h3>
          <div className="flex items-center gap-2"><button type="button" onClick={()=>void refresh()} aria-label="Refresh notifications"><RefreshCw size={16}/></button><button type="button" onClick={()=>setOpen(false)} aria-label="Close notification panel"><X size={18}/></button></div>
        </div>
        {error&&<p className="px-4 py-2 text-xs text-rose-600" role="alert">{error}</p>}
        {items.length===0?<p className="p-5 text-sm text-neutral-500 dark:text-neutral-300">No notifications yet. New requests, resource suggestions and other updates will appear here.</p>:
          items.slice(0,12).map(item=><button type="button" key={item.id} onClick={()=>void openNotice(item)} className={`w-full border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 ${!item.read?'bg-orange-50/60 dark:bg-orange-900/10':''}`}>
            <div className="flex gap-3 items-start">{item.kind.startsWith('request')?<MessageSquare size={18} className="text-[#5268A8] dark:text-blue-300 mt-1 shrink-0"/>:item.kind==='evidence'?<FileWarning size={18} className="text-amber-500 mt-1 shrink-0"/>:<Megaphone size={18} className="text-[#FF4A00] mt-1 shrink-0"/>}<div><p className="text-sm font-bold">{item.title}{!item.read&&<span className="ml-2 inline-block w-2 h-2 bg-[#FF4A00] rounded-full"/>}</p><p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-3">{item.message}</p><p className="text-[10px] text-neutral-400 mt-2">{item.kind==='evidence'?'Provide evidence in My Reports':item.kind==='request-new'?'Help with this request':item.kind==='request-accepted'?'View accepted suggestion':item.kind==='request'?'View resource suggestion':item.kind==='followed-resource'?'View creator resource':'Admin announcement'} · {item.createdAt.slice(0,10)}</p></div></div>
          </button>)}
        <div className="flex justify-between gap-3 p-4 border-t border-neutral-100 dark:border-neutral-800 text-xs font-bold">
          <Link to="/notifications" onClick={()=>setOpen(false)} className="text-[#FF4A00]">All Notifications</Link>
          <Link to="/my-reports" onClick={()=>setOpen(false)} className="text-[#FF4A00]">My Reports</Link>
        </div>
      </div>
    </>}
  </div>;
};
