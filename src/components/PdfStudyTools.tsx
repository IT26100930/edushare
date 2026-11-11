import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Sparkles} from 'lucide-react';
type Mode='summary'|'quiz'|'flashcards';
type Question={question:string;options:string[];answerIndex:number;explanation:string};
type Flashcard={question:string;answer:string};
type Result={summary?:string;questions?:Question[];cards?:Flashcard[];coverage:string;limited:boolean};
export function PdfStudyTools({resourceId,pages,canUse}:{resourceId:string;pages:number;canUse:boolean}) {
  const [mode,setMode]=useState<Mode>('summary'),[limits,setLimits]=useState({maxPages:250,maxCharacters:300000,maxUploadMb:100,configured:true});
  const [start,setStart]=useState('1'),[end,setEnd]=useState(''),[results,setResults]=useState<Partial<Record<Mode,Result>>>({});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[choices,setChoices]=useState<Record<number,number>>({}),[graded,setGraded]=useState(false),[flipped,setFlipped]=useState<Record<number,boolean>>({});
  const request=useRef<AbortController|null>(null),sequence=useRef(0);
  useEffect(()=>{const controller=new AbortController();fetch('/api/resources/ai-limits',{credentials:'include',cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(value=>{if(value&&!controller.signal.aborted)setLimits(value);}).catch(()=>{});return()=>controller.abort();},[]);
  useEffect(()=>{setStart('1');setEnd('');},[resourceId]);
  useEffect(()=>{sequence.current++;request.current?.abort();setBusy(false);setResults({});setChoices({});setGraded(false);setFlipped({});setError('');return()=>{sequence.current++;request.current?.abort();};},[resourceId,start,end]);
  const generate=async()=>{
    if(busy||!canUse)return;
    const first=Number(start),last=end.trim()?Number(end):undefined;
    if(!Number.isInteger(first)||first<1||(last!==undefined&&(!Number.isInteger(last)||last<first||last-first+1>limits.maxPages))||(pages>0&&(first>pages||(last!==undefined&&last>pages)))){setError(`Choose pages within this PDF, with at most ${limits.maxPages} pages in one request.`);return;}
    const controller=new AbortController();request.current=controller;const current=++sequence.current;
    setBusy(true);setError('');
    try {
      const range=new URLSearchParams({startPage:String(first)});if(last!==undefined)range.set('endPage',String(last));
      const response=await fetch(`/api/resources/${encodeURIComponent(resourceId)}/${mode==='summary'?'ai-summary?'+range:'ai-study'}`,{method:'POST',credentials:'include',signal:controller.signal,headers:{'Content-Type':'application/json'},...(mode==='summary'?{}:{body:JSON.stringify({mode,startPage:first,endPage:last})})});
      const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Study request failed (${response.status}).`);
      if(mode==='summary'&&(!result.summary||typeof result.summary!=='string'))throw new Error('The provider returned no summary.');
      if(mode==='quiz'&&(!Array.isArray(result.questions)||result.questions.length!==5||result.questions.some((q:Question)=>typeof q.question!=='string'||!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>3)))throw new Error('The provider returned an incomplete quiz. Try a smaller page range.');
      if(mode==='flashcards'&&(!Array.isArray(result.cards)||result.cards.length!==8||result.cards.some((c:Flashcard)=>typeof c.question!=='string'||typeof c.answer!=='string')))throw new Error('The provider returned incomplete flashcards. Try a smaller page range.');
      if(current!==sequence.current)return;setResults(previous=>({...previous,[mode]:result}));
      if(mode==='quiz'){setChoices({});setGraded(false);}if(mode==='flashcards')setFlipped({});
    }catch(e){if(!controller.signal.aborted&&current===sequence.current)setError(e instanceof Error?e.message:'Study generation failed.');}
    finally{if(current===sequence.current)setBusy(false);}
  };
  const result=results[mode],questions=result?.questions||[],cards=result?.cards||[];
  const score=questions.filter((q,i)=>choices[i]===q.answerIndex).length;
  return <section aria-label="PDF study tools" className="rounded-[22px] border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-5 sm:p-6 space-y-4">
    <div className="flex items-start gap-3"><Sparkles className="text-[#263577] dark:text-blue-200 shrink-0 mt-1"/><div><h3 className="font-bold">AI PDF Study Tools</h3><p className="text-sm text-neutral-600 dark:text-neutral-300">Keep the summary, practise with a five-question quiz, or revise with eight flashcards. All are based on the selected PDF text.</p></div></div>
    <div role="group" aria-label="Choose a study tool" className="flex flex-wrap gap-2">{(['summary','quiz','flashcards'] as const).map(value=><button key={value} type="button" disabled={busy} aria-pressed={mode===value} onClick={()=>{setMode(value);setError('');}} className={`rounded-full px-4 py-2 text-sm font-bold border disabled:opacity-50 ${mode===value?'bg-[#263577] text-white border-[#263577]':'border-neutral-300 dark:border-neutral-600'}`}>{value==='summary'?'AI Summary':value==='quiz'?'Self-test Quiz':'Flashcards'}</button>)}</div>
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <p className="text-sm">Read up to <strong>{limits.maxPages} pages</strong> and <strong>{limits.maxCharacters.toLocaleString()} characters</strong> per request. For a longer PDF, choose another page range next.</p>
      <div className="grid grid-cols-2 gap-3 max-w-md"><label className="text-sm font-semibold">Start page<input aria-label="Study start page" type="number" min="1" max={pages||undefined} disabled={busy} value={start} onChange={e=>setStart(e.target.value)} className="block w-full mt-1 rounded-xl border p-2 bg-white dark:bg-neutral-800"/></label><label className="text-sm font-semibold">End page (optional)<input aria-label="Study end page" type="number" min={Number(start)||1} max={pages||undefined} disabled={busy} value={end} onChange={e=>setEnd(e.target.value)} placeholder="Automatic range" className="block w-full mt-1 rounded-xl border p-2 bg-white dark:bg-neutral-800"/></label></div>
    </div>
    {canUse?<><button type="button" disabled={busy||!limits.configured} onClick={()=>void generate()} className="rounded-full bg-[#263577] text-white px-5 py-2.5 text-sm font-bold disabled:opacity-50">{busy?'Reading PDF and generating…':mode==='summary'?(result?'Regenerate AI Summary':'Generate AI Summary'):mode==='quiz'?(result?'Generate another quiz':'Generate Self-test Quiz'):(result?'Generate new flashcards':'Generate Flashcards')}</button>{!limits.configured&&<p className="text-sm">These tools are not configured by the administrator yet.</p>}</>:<p className="text-sm">These tools are available to the uploader, administrators and Premium members with document access. <Link to="/pricing" className="underline">View plans</Link></p>}
    {busy&&<p role="status" className="text-sm">The selected range is being processed. Large documents may take longer.</p>}
    {error&&<p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    {result&&<div className="space-y-4">
      <p className={`rounded-xl p-3 text-sm ${result.limited?'shared-link-pending':'shared-link-approved'}`}>{result.coverage}</p>
      {mode==='summary'&&<div className="whitespace-pre-wrap rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4 text-sm leading-relaxed">{result.summary}</div>}
      {mode==='quiz'&&<div className="space-y-4" aria-label="Generated self-test quiz">
        {questions.map((q,i)=><fieldset key={i} className="rounded-xl border border-neutral-300 dark:border-neutral-700 p-4 space-y-2"><legend className="px-2 font-bold text-sm">{i+1}. {q.question}</legend>{q.options.map((option,j)=><label key={j} className="flex items-start gap-3 text-sm py-1"><input type="radio" name={`study-question-${resourceId}-${i}`} disabled={graded} checked={choices[i]===j} onChange={()=>setChoices({...choices,[i]:j})} className="mt-1 shrink-0"/><span>{option}</span></label>)}{graded&&<p className={`rounded-lg p-3 text-sm ${choices[i]===q.answerIndex?'shared-link-approved':'shared-link-pending'}`}><strong>{choices[i]===q.answerIndex?'Correct.':'Review this answer.'}</strong> Answer: {q.options[q.answerIndex]}. {q.explanation}</p>}</fieldset>)}
        {graded?<div role="status" className="space-y-3"><p className="font-bold">Your score: {score} / {questions.length}</p><button type="button" onClick={()=>{setChoices({});setGraded(false);}} className="rounded-full border px-4 py-2 font-bold">Try this quiz again</button></div>:<button type="button" disabled={Object.keys(choices).length!==questions.length} onClick={()=>setGraded(true)} className="rounded-full bg-[#263577] text-white px-5 py-2.5 font-bold disabled:opacity-50">Check my answers</button>}
      </div>}
      {mode==='flashcards'&&<div className="grid sm:grid-cols-2 gap-3" aria-label="Generated flashcards">{cards.map((card,i)=><button type="button" key={i} aria-expanded={!!flipped[i]} onClick={()=>setFlipped({...flipped,[i]:!flipped[i]})} className="text-left rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4 min-h-36 space-y-3"><span className="block text-xs font-bold">Card {i+1} · {flipped[i]?'Answer':'Question'}</span><span className="block text-sm font-semibold">{flipped[i]?card.answer:card.question}</span><span className="block text-xs underline">{flipped[i]?'Show question':'Reveal answer'}</span></button>)}</div>}
      <p className="text-xs text-neutral-600 dark:text-neutral-300">AI-generated revision material can contain mistakes. Check it against the original PDF.</p>
    </div>}
    <p className="text-xs text-neutral-600 dark:text-neutral-300">Only the extracted text range is sent when you generate a tool. Scanned PDFs need OCR. Provider quotas and model context limits still apply.</p>
  </section>;
}
