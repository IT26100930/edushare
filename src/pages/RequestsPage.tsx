import React,{useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {BookOpen,Plus,Search,Clock3,CheckCircle2,Trash2,Link as LinkIcon,Send,CalendarDays,Filter,RefreshCw,Lightbulb,GraduationCap} from 'lucide-react';
import {useApp} from '../context/AppContext.tsx';

type RequestItem={id:number;title:string;message:string;status:string;requestedById:number;moduleCode:string;resourceType:string;academicYear:string;neededBy:string;createdAt:string};
type ResourceOffer={id:number;requestId:number;offeredById:number;url:string;note:string;status:string;createdAt:string};
const field='w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1D222D] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';
const label='block text-xs uppercase tracking-wide font-bold text-neutral-600 dark:text-neutral-300 mb-1.5';
export const RequestsPage:React.FC=()=>{
 const {currentUser,addToast}=useApp();const [params]=useSearchParams();const focus=params.get('focus');
 const [items,setItems]=useState<RequestItem[]>([]),[offers,setOffers]=useState<Record<number,ResourceOffer[]>>({});
 const [title,setTitle]=useState(''),[message,setMessage]=useState(''),[moduleCode,setModuleCode]=useState('SE1020'),[resourceType,setResourceType]=useState('Notes'),[academicYear,setAcademicYear]=useState('2026'),[neededBy,setNeededBy]=useState('');
 const [search,setSearch]=useState(''),[status,setStatus]=useState<'all'|'OPEN'|'FULFILLED'|'mine'>(()=>params.get('status')==='OPEN'?'OPEN':'all');
 const [offerOpen,setOfferOpen]=useState<number|null>(null),[offerUrl,setOfferUrl]=useState(''),[offerNote,setOfferNote]=useState('');
 const [editingId,setEditingId]=useState<number|null>(null);
 const [busy,setBusy]=useState(false),[loadError,setLoadError]=useState('');
 const myId=Number(currentUser?.id?.replace('backend-user-',''))||0;
 const isAdmin=currentUser?.role==='admin';
 const load=async()=>{try{
   const r=await fetch('/api/requests',{credentials:'include',cache:'no-store'});if(!r.ok)throw new Error('Could not load resource requests.');
   const data:RequestItem[]=await r.json();setItems(data.slice().sort((a,b)=>b.id-a.id));setLoadError('');
   const results=await Promise.all(data.map(async item=>{
     try {const o=await fetch(`/api/requests/${item.id}/offers`,{credentials:'include',cache:'no-store'});return [item.id,o.ok?await o.json():[]] as const}
     catch {return [item.id,[]] as const}
   }));setOffers(Object.fromEntries(results));
  }catch(e){setLoadError(e instanceof Error?e.message:'Load failed');}
 };
 useEffect(()=>{void load()},[currentUser?.id,focus]);
 useEffect(()=>{if(!focus && params.get('status')==='OPEN')setStatus('OPEN');},[params,focus]);
 useEffect(()=>{if(focus){setStatus('all');setSearch('');}},[focus]);
 const visible=useMemo(()=>items.filter(item=>{
   if(status==='mine'&&item.requestedById!==myId)return false;
   if(status!=='mine'&&status!=='all'&&item.status!==status)return false;
   const q=search.toLowerCase().trim();return !q || [item.title,item.message,item.moduleCode,item.resourceType].some(t=>(t||'').toLowerCase().includes(q));
 }),[items,search,status,myId]);
 useEffect(()=>{if(!focus)return;const frame=window.requestAnimationFrame(()=>document.getElementById(`resource-request-${focus}`)?.scrollIntoView({behavior:'smooth',block:'center'}));return()=>window.cancelAnimationFrame(frame);},[focus,visible]);
 const errorToast=(e:unknown)=>addToast({title:'Could not complete action',message:e instanceof Error?e.message:'Try again.',type:'error'});
 const submitRequest=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);try{
   const r=await fetch(editingId?`/api/requests/${editingId}`:'/api/requests',{method:editingId?'PUT':'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title.trim(),message:message.trim(),moduleCode:moduleCode.trim(),resourceType,academicYear,neededBy})});
   if(!r.ok)throw new Error('Please enter a clear title (6+ characters), details (12+ characters) and valid module/year.');
   setTitle('');setMessage('');setNeededBy('');addToast({title:editingId?'Request updated':'Request published',message:'Students can now suggest useful learning resources.',type:'success'});setEditingId(null);await load();window.dispatchEvent(new Event('edushare-notifications-changed'));
  }catch(err){errorToast(err)}finally{setBusy(false)}};
 const submitOffer=async(id:number)=>{if(busy)return;setBusy(true);try{
   const r=await fetch(`/api/requests/${id}/offers`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:offerUrl,note:offerNote})});
   if(!r.ok){const body=await r.json().catch(()=>({}));throw new Error(body.error||'Provide a valid HTTPS URL and a helpful explanation (10+ characters).')}
   setOfferOpen(null);setOfferUrl('');setOfferNote('');addToast({title:'Resource suggested',message:'The requester can review and accept your offer.',type:'success'});await load();window.dispatchEvent(new Event('edushare-notifications-changed'));
  }catch(err){errorToast(err)}finally{setBusy(false)}};
 const acceptOffer=async(id:number,offerId:number)=>{if(!window.confirm('Mark this request fulfilled with the selected resource link?'))return;setBusy(true);try{
   const r=await fetch(`/api/requests/${id}/offers/${offerId}/accept`,{method:'PUT',credentials:'include'});if(!r.ok)throw new Error('Could not accept this resource offer.');
   addToast({title:'Request fulfilled',message:'The accepted resource remains linked to this request.',type:'success'});await load();window.dispatchEvent(new Event('edushare-notifications-changed'));
  }catch(e){errorToast(e)}finally{setBusy(false)}};
 const deleteRequest=async(id:number)=>{if(!window.confirm('Delete this resource request?'))return;try{
   const r=await fetch(`/api/requests/${id}`,{method:'DELETE',credentials:'include'});if(!r.ok)throw new Error('Only the requester or an admin may delete this.');
   addToast({title:'Request deleted',type:'success'});await load();window.dispatchEvent(new Event('edushare-notifications-changed'));
  }catch(e){errorToast(e)}};
 const openCount=items.filter(x=>x.status==='OPEN').length;
 return <main className="portal-page max-w-[1600px] mx-auto px-4 sm:px-7 py-9 text-neutral-900 dark:text-white">
   <div className="portal-hero rounded-3xl p-6 md:p-10 mb-8 bg-[#FFF1E9] dark:bg-[#282321] flex flex-wrap gap-7 justify-between items-center">
     <div className="portal-hero-copy max-w-2xl"><p className="text-[#FF4A00] font-bold text-xs uppercase tracking-widest">Student Collaboration</p>
       <h1 className="text-3xl sm:text-4xl font-extrabold font-display mt-3">Ask the community for a resource.</h1>
       <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mt-3">Looking for a lecture note, past paper, useful video or article? Describe exactly what you need and get suggestions from fellow students.</p></div>
     <div className="grid grid-cols-2 gap-3"><div className="portal-stat rounded-2xl bg-white/80 dark:bg-neutral-800 p-5 text-center"><p className="text-3xl font-black text-[#FF4A00]">{openCount}</p><p className="text-xs font-semibold">Open requests</p></div><div className="portal-stat rounded-2xl bg-white/80 dark:bg-neutral-800 p-5 text-center"><p className="text-3xl font-black text-emerald-600">{items.length-openCount}</p><p className="text-xs font-semibold">Fulfilled</p></div></div>
   </div>
   {loadError&&<p role="alert" className="text-red-600 mb-4">{loadError}</p>}
   <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,390px)_1fr] gap-6 items-start">
     <section id="request-editor" className="scroll-mt-24 lg:sticky lg:top-24 rounded-3xl bg-white dark:bg-[#1A1E27] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
       <div className="flex gap-2 items-center mb-2"><Plus className="text-[#FF4A00]"/><h2 className="text-xl font-extrabold">{editingId?'Edit Request':'Create a Request'}</h2></div>
       <p className="text-xs text-neutral-500 dark:text-neutral-300 mb-5">Be specific about the module and format to get better answers.</p>
       <form onSubmit={submitRequest} className="space-y-4">
         <div><label className={label}>Resource title *</label><input required minLength={6} maxLength={150} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. SE1020 OOP 2025 past paper" className={field}/></div>
         <div className="grid grid-cols-2 gap-3"><div><label className={label}>Module *</label><input required minLength={2} maxLength={20} value={moduleCode} onChange={e=>setModuleCode(e.target.value)} placeholder="IT1020" className={field}/></div><div><label className={label}>Academic Year *</label><select value={academicYear} onChange={e=>setAcademicYear(e.target.value)} className={field}>{['2026','2025','2024','2023','2022','N/A'].map(x=><option key={x} value={x}>{x}</option>)}</select></div></div>
         <div><label className={label}>Type needed *</label><select className={field} value={resourceType} onChange={e=>setResourceType(e.target.value)}>{['Notes','Past Paper','Video Lesson','Article','Other'].map(x=><option key={x}>{x}</option>)}</select></div>
         <div><label className={label}>Needed by (optional)</label><input className={field} type="date" value={neededBy} onChange={e=>setNeededBy(e.target.value)}/></div>
         <div><label className={label}>Explain your request *</label><textarea required minLength={12} maxLength={1000} rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Topics, semester, preferred language and other helpful information..." className={field}/></div>
         <button disabled={busy} type="submit" className="w-full flex gap-2 items-center justify-center rounded-full bg-[#FF4A00] text-white p-3 font-bold disabled:opacity-50"><Plus size={16}/>{busy?'Saving...':editingId?'Save request changes':'Publish Request'}</button>{editingId&&<button type="button" disabled={busy} onClick={()=>{setEditingId(null);setTitle('');setMessage('');setNeededBy('');}} className="rounded-full border px-4 py-2 text-sm">Cancel editing</button>}
       </form>
     </section>
     <section className="min-w-0">
       <div className="flex justify-between gap-3 flex-wrap items-center mb-4"><h2 className="text-2xl font-extrabold">Find & Fulfil Requests</h2><button onClick={()=>void load()} className="flex gap-2 items-center text-sm rounded-full border px-4 py-2"><RefreshCw size={14}/>Refresh</button></div>
       <div className="flex flex-wrap gap-2 mb-4">{([['all','All'],['OPEN','Open'],['FULFILLED','Fulfilled'],['mine','My Requests']] as const).map(([key,text])=><button type="button" key={key} onClick={()=>setStatus(key)} className={`rounded-full px-4 py-2 text-xs font-bold border ${status===key?'bg-[#252D67] text-white border-[#252D67]':'border-neutral-200 dark:border-neutral-700'}`}>{text}</button>)}</div>
       <div className="relative mb-5"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className={field+' pl-11'} placeholder="Search module, topic, request type..." aria-label="Search resource requests"/></div>
       {visible.length===0?<div className="rounded-2xl border p-8 text-center text-neutral-500 dark:border-neutral-700"><Lightbulb size={28} className="mx-auto mb-3"/>No requests match these filters.</div>:<div className="space-y-4">{visible.map(req=>{
         const mine=myId===req.requestedById; const list=offers[req.id]||[]; const isOpen=req.status==='OPEN';
         return <article key={req.id} id={`resource-request-${req.id}`} className={`rounded-3xl border ${focus===String(req.id)?'border-[#FF4A00] ring-2 ring-orange-100':'border-neutral-200'} dark:border-neutral-700 bg-white dark:bg-[#1A1E27] p-5 sm:p-6 shadow-sm`}>
           <div className="flex justify-between gap-3 flex-wrap"><div className="flex items-center gap-2 flex-wrap"><span className={`rounded-full px-3 py-1 text-xs font-bold ${isOpen?'bg-amber-100 text-amber-800':'bg-emerald-100 text-emerald-800'}`}>{isOpen?<Clock3 size={13} className="inline mr-1"/>:<CheckCircle2 size={13} className="inline mr-1"/>}{isOpen?'OPEN':'FULFILLED'}</span><span className="text-xs text-neutral-500 dark:text-neutral-300">{req.resourceType||'Resource'} · {req.moduleCode||'Module not set'}</span></div><span className="text-xs text-neutral-500 dark:text-neutral-300">#{req.id} {req.createdAt?'· '+req.createdAt.slice(0,10):''}</span></div>
           <h3 className="text-lg font-extrabold mt-3">{req.title}</h3><p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 whitespace-pre-wrap">{req.message}</p>
           <div className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-300 my-4"><span><GraduationCap size={14} className="inline mr-1"/>Year: {req.academicYear||'N/A'}</span>{req.neededBy&&<span><CalendarDays size={14} className="inline mr-1"/>Needed by {req.neededBy}</span>}<span>{list.length} student suggestion{list.length===1?'':'s'}</span>{mine&&<span className="font-bold text-[#FF4A00]">Your request</span>}</div>
           {list.length>0&&<div className="border-t dark:border-neutral-700 pt-4 mt-3 space-y-3"><h4 className="text-xs uppercase font-extrabold tracking-wider">Resource Suggestions</h4>{list.map(o=><div key={o.id} className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3"><a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4A00] break-all"><LinkIcon size={14}/>{o.url}</a><p className="text-sm mt-2">{o.note}</p><div className="mt-3 flex flex-wrap justify-between gap-2 items-center"><span className="text-[11px] text-neutral-500">Suggested by student #{o.offeredById} · {o.status}</span>{isOpen&&(mine||isAdmin)&&<button type="button" disabled={busy} onClick={()=>void acceptOffer(req.id,o.id)} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-full text-xs">Accept & Mark Fulfilled</button>}</div></div>)}</div>}
           <div className="flex items-center flex-wrap gap-3 mt-4 pt-4 border-t dark:border-neutral-700">{isOpen&&!mine&&<button type="button" onClick={()=>{setOfferOpen(offerOpen===req.id?null:req.id);setOfferUrl('');setOfferNote('')}} className="rounded-full px-4 py-2.5 bg-[#FF4A00] text-white text-xs font-bold flex gap-2 items-center"><Send size={14}/>Suggest a Resource</button>}
           {(mine||isAdmin)&&<button type="button" disabled={busy} onClick={()=>{setEditingId(req.id);setTitle(req.title);setMessage(req.message);setModuleCode(req.moduleCode);setResourceType(req.resourceType);setAcademicYear(req.academicYear);setNeededBy(req.neededBy);document.getElementById('request-editor')?.scrollIntoView({behavior:'smooth'});}} className="rounded-full border px-4 py-2 text-sm font-semibold">Edit request</button>}{(mine||isAdmin)&&<button type="button" onClick={()=>void deleteRequest(req.id)} className="px-3 py-2 rounded-full text-red-600 text-xs font-semibold border border-red-200 flex gap-1 items-center"><Trash2 size={14}/>Delete</button>}
           </div>
           {offerOpen===req.id&&<form onSubmit={e=>{e.preventDefault();void submitOffer(req.id)}} className="mt-4 p-4 sm:p-5 rounded-2xl border border-[#DCE2F0] dark:border-[#3D4870] space-y-4">
             <p className="font-bold text-base">Help this student find a resource</p>
             <div id={`suggestion-guide-${req.id}`} className="rounded-xl bg-[#EEF2FA] dark:bg-[#232C43] p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200 space-y-3">
               <p className="font-semibold text-[#263577] dark:text-blue-200">How to suggest a resource</p>
               <p><strong>Have a PDF on your device?</strong> Upload it through <Link to="/share" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#344B93] dark:text-blue-200 underline underline-offset-2">Share (opens in a new tab)</Link> first. Once other members have permission to view its resource page, copy that page’s URL and paste it below.</p>
               <p><strong>Found a resource on another website?</strong> Copy the URL of the PDF, video or article page and paste it below. Choose a link the requester can access.</p>
               <p>This form accepts a link and a short explanation. After you submit, the requester or an admin can check your suggestion and accept it to mark the request as fulfilled.</p>
             </div>
             <div>
               <label htmlFor={`suggestion-url-${req.id}`} className={label}>Resource link (required)</label>
               <input id={`suggestion-url-${req.id}`} type="url" required value={offerUrl} onChange={e=>setOfferUrl(e.target.value)} placeholder="https://example.com/learning-resource" aria-describedby={`suggestion-guide-${req.id}`} className={field}/>
             </div>
             <div>
               <label htmlFor={`suggestion-note-${req.id}`} className={label}>How does this resource help? (required)</label>
               <textarea id={`suggestion-note-${req.id}`} required minLength={10} rows={3} value={offerNote} onChange={e=>setOfferNote(e.target.value)} placeholder="For example: Explains Java inheritance with simple superclass and subclass examples." aria-describedby={`suggestion-source-note-${req.id}`} className={field}/>
               <p id={`suggestion-source-note-${req.id}`} className="mt-2 text-xs text-neutral-500 dark:text-neutral-300">Write at least 10 characters and credit the original author or website. Check external sources before sharing.</p>
             </div>
             <div className="flex flex-wrap gap-2"><button disabled={busy} type="submit" className="rounded-full bg-[#FF4A00] text-white px-4 py-2 text-xs font-bold">Submit Suggestion</button><button type="button" onClick={()=>setOfferOpen(null)} className="rounded-full border px-4 py-2 text-xs">Cancel</button></div>
           </form>}

         </article>
       })}</div>}
     </section>
   </div>
 </main>;
};
