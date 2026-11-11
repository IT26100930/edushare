import React,{useEffect,useRef,useState} from 'react';
export function ProtectedVideoPlayer({id,allowed,hasPreview,requestedSeconds,revision,onTime,onPlay}:{id:string;allowed:boolean|null;hasPreview:boolean;requestedSeconds:number;revision:number;onTime:(seconds:number)=>void;onPlay:()=>void}){
 const ref=useRef<HTMLVideoElement>(null),[error,setError]=useState('');
 const source=allowed?`/api/owned-videos/${id}/stream`:hasPreview?`/api/owned-videos/${id}/preview`:'';
 useEffect(()=>{setError('');},[source]);
 useEffect(()=>{const video=ref.current;if(!video||!allowed)return;const seek=()=>{try{video.currentTime=requestedSeconds;}catch{}};if(video.readyState>=1)seek();else video.addEventListener('loadedmetadata',seek,{once:true});return()=>video.removeEventListener('loadedmetadata',seek);},[requestedSeconds,revision,allowed,source]);
 if(allowed===null)return <p className="p-6 text-white">Checking video access…</p>;
 if(!source)return <p className="p-6 text-white">No preview clip is available. Full video access is required.</p>;
 return <div className="h-full flex flex-col bg-black text-white"><video key={source} ref={ref} controls playsInline preload="metadata" src={source} aria-label={allowed?'Full creator video':'Preview clip'} className="w-full min-h-0 flex-1" onPlay={()=>{if(allowed)onPlay();}} onTimeUpdate={e=>{if(allowed)onTime(Math.floor(e.currentTarget.currentTime));}} onError={()=>setError('Video could not be played. Check your access or report this resource. MP4 H.264/AAC or WebM is required for browser playback.')}/><p className="text-xs px-3 py-2">{allowed?'Full video':'Preview only · unlock access to watch the full video'}</p>{error&&<p role="alert" className="text-xs px-3 pb-2 text-red-300">{error}</p>}</div>;
}
