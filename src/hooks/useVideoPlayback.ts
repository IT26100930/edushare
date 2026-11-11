import {useEffect,useRef} from 'react';
type Player={getCurrentTime:()=>number;seekTo:(seconds:number,ahead:boolean)=>void;playVideo:()=>void;destroy:()=>void};
let apiPromise:Promise<void>|undefined;
function youtubeApi():Promise<void>{
  const win=window as any;
  if(win.YT?.Player)return Promise.resolve();
  if(!apiPromise) apiPromise=new Promise((resolve,reject)=>{
    const previous=win.onYouTubeIframeAPIReady;
    const timeout=window.setTimeout(()=>reject(new Error('Video API unavailable')),15000);
    win.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);previous?.();resolve();};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
    script.onerror=()=>{clearTimeout(timeout);reject(new Error('Video API unavailable'));};document.head.appendChild(script);
  });
  return apiPromise;
}
export function useVideoPlayback(enabled:boolean, platform:string, videoId:string, requestedSeconds:number, onTime:(seconds:number)=>void, requestRevision=0){
  const player=useRef<Player|null>(null), ready=useRef(false), latest=useRef(requestedSeconds), callback=useRef(onTime);
  latest.current=requestedSeconds;callback.current=onTime;
  useEffect(()=>{
    if(!enabled || platform!=='youtube')return;
    let cancelled=false,timer:number|undefined;
    void youtubeApi().then(()=>{
      if(cancelled)return;
      player.current=new (window as any).YT.Player('edu-youtube-player',{events:{onReady:()=>{
        if(cancelled)return;ready.current=true;
        player.current?.seekTo(latest.current,true);player.current?.playVideo();
        timer=window.setInterval(()=>{const time=player.current?.getCurrentTime();if(typeof time==='number' && Number.isFinite(time))callback.current(Math.floor(time));},500);
      }}});
    }).catch(()=>{/* Native iframe playback remains available; a manual comment time can be entered. */});
    return()=>{cancelled=true;ready.current=false;clearInterval(timer);player.current=null;};
  },[enabled,platform,videoId]);
  useEffect(()=>{if(ready.current){player.current?.seekTo(requestedSeconds,true);player.current?.playVideo();}},[requestedSeconds,requestRevision]);
  useEffect(()=>{
    if(!enabled || platform!=='vimeo')return;
    const frame=document.getElementById('edu-youtube-player') as HTMLIFrameElement|null;
    const subscribe=()=>frame?.contentWindow?.postMessage({method:'addEventListener',value:'timeupdate'},'https://player.vimeo.com');
    const receive=(event:MessageEvent)=>{
      if(event.origin!=='https://player.vimeo.com' || event.source!==frame?.contentWindow)return;
      try {const data=typeof event.data==='string'?JSON.parse(event.data):event.data;if(data.event==='timeupdate' && Number.isFinite(data.data?.seconds))callback.current(Math.floor(data.data.seconds));if(data.event==='ready')subscribe();}catch{}
    };
    subscribe();frame?.addEventListener('load',subscribe);window.addEventListener('message',receive);
    return()=>{frame?.removeEventListener('load',subscribe);window.removeEventListener('message',receive);};
  },[enabled,platform,videoId]);
  useEffect(()=>{if(enabled && platform==='vimeo'){
    const frame=document.getElementById('edu-youtube-player') as HTMLIFrameElement|null;
    frame?.contentWindow?.postMessage({method:'setCurrentTime',value:requestedSeconds},'https://player.vimeo.com');
  }},[enabled,platform,requestedSeconds,requestRevision]);
}
