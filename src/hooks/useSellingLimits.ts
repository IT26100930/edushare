import {useEffect,useState} from 'react';
export function useSellingLimits(){
 const [limits,setLimits]=useState<{minimum:number;maximum:number}|null>(null),[error,setError]=useState('');
 useEffect(()=>{let live=true;const load=async()=>{try{const r=await fetch('/api/config/resource-selling-limits',{credentials:'include',cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();if(!Number.isInteger(d.minimum)||!Number.isInteger(d.maximum)||d.minimum<1||d.maximum<d.minimum)throw new Error();if(live){setLimits(d);setError('');}}catch{if(live)setError('Could not load selling limits. Refresh before setting a price.');}};void load();window.addEventListener('focus',load);return()=>{live=false;window.removeEventListener('focus',load);};},[]);
 return {limits,error};
}
