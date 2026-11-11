import React, { useEffect, useRef, useState } from 'react';

type Player = { getCurrentTime(): number; getDuration(): number; destroy(): void };
type YouTubeAPI = { Player: new (node: HTMLElement, options: {
  videoId: string; host: string; width: string; height: string;
  playerVars: { origin: string; playsinline: number };
  events: { onReady(): void; onError(): void };
}) => Player };
type PlayerWindow = Window & { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void };
let apiPromise: Promise<YouTubeAPI> | undefined;

function loadPlayerAPI(): Promise<YouTubeAPI> {
  const page = window as PlayerWindow;
  if (page.YT?.Player) return Promise.resolve(page.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = page.onYouTubeIframeAPIReady;
    const timer = window.setTimeout(() => reject(new Error('Player unavailable')), 20000);
    page.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      try { previous?.(); } finally {
        if (page.YT?.Player) resolve(page.YT);
        else reject(new Error('Player unavailable'));
      }
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error('Player unavailable')); };
      document.head.appendChild(script);
    }
  });
  apiPromise.catch(() => { apiPromise = undefined; });
  return apiPromise;
}

export function YouTubeChapterPlayer({ videoId, onCapture }: {
  videoId: string; onCapture: (seconds: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let instance: Player | undefined;
    setReady(false); setFailed(false);
    const container = host.current;
    if (!container) return;
    // YouTube replaces this child; React owns the outer container.
    const mount = document.createElement('div');
    container.replaceChildren(mount);
    loadPlayerAPI().then(api => {
      if (!active) return;
      instance = new api.Player(mount, {
        videoId, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
        playerVars: { origin: window.location.origin, playsinline: 1 },
        events: {
          onReady: () => { if (active) setReady(true); },
          onError: () => { if (active) { setFailed(true); setReady(false); } },
        },
      });
      player.current = instance;
    }).catch(() => { if (active) setFailed(true); });
    return () => {
      active = false; player.current = null;
      instance?.destroy(); container.replaceChildren();
    };
  }, [videoId]);

  const capture = () => {
    try {
      const value = player.current?.getCurrentTime();
      const duration = player.current?.getDuration() || 0;
      if (value === undefined || !Number.isFinite(value) || value < 0 || duration <= 0) {
        setFailed(true); return;
      }
      onCapture(Math.floor(value));
    } catch { setFailed(true); }
  };

  return <div className="space-y-3">
    <div ref={host} className="aspect-video min-h-[200px] w-full rounded-xl overflow-hidden bg-black" />
    <button type="button" onClick={capture} disabled={!ready}
      className="rounded-full bg-[#FF4A00] px-5 py-3 font-bold text-white disabled:opacity-50">
      Add chapter at current time
    </button>
    <p role="status" className="text-sm text-neutral-300">
      {failed ? 'Could not read the video time. Try playing the video again, enter the time below, or skip chapters.'
        : ready ? 'Play the video, move to the point you want, then add a chapter. Enter its title below.'
        : 'Loading video controls… You can also enter a chapter time below.'}
    </p>
  </div>;
}
