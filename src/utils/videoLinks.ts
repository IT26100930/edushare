/** Convert the exact shared URL into a supported video ID. Never substitute demo media. */
export function parseVideoLink(input: string): { platform: 'youtube' | 'vimeo'; id: string } | null {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    if (['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = host === 'youtu.be' ? parts[0] :
        parts[0] === 'watch' ? url.searchParams.get('v') :
        ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] : null;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return { platform: 'youtube', id };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
      if (id) return { platform: 'vimeo', id };
    }
  } catch { /* Invalid URL */ }
  return null;
}
