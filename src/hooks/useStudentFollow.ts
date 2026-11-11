import { useCallback, useEffect, useState } from 'react';

type FollowStatus = { authorId: number; followers: number; following: boolean };

/** Server is the source of truth, including after reloads and across tabs. */
export function useStudentFollow(authorId: string | undefined, viewerId: string | undefined) {
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(false);
  const numericAuthorId = authorId?.startsWith('backend-user-') ? Number(authorId.slice('backend-user-'.length)) : NaN;
  const valid = Number.isSafeInteger(numericAuthorId) && numericAuthorId > 0;

  const refresh = useCallback(async () => {
    if (!valid) { setFollowing(false); setFollowers(0); return; }
    const response = await fetch(`/api/follows/${numericAuthorId}`, { credentials:'include', cache:'no-store' });
    if (!response.ok) throw new Error(`Could not load followers (HTTP ${response.status}).`);
    const result: FollowStatus = await response.json();
    setFollowing(result.following);
    setFollowers(result.followers);
  }, [numericAuthorId, valid, viewerId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      try { await refresh(); } catch { if (active) { setFollowing(false); setFollowers(0); } }
    };
    void load();
    window.addEventListener('focus', load);
    return () => { active = false; window.removeEventListener('focus', load); };
  }, [refresh]);

  const toggle = async () => {
    if (!viewerId) throw new Error('Sign in before following another student.');
    if (!valid) throw new Error('This author is not connected to a saved student account.');
    if (viewerId === authorId) throw new Error('You cannot follow yourself.');
    if (loading) return following;
    setLoading(true);
    try {
      const response = await fetch(`/api/follows/${numericAuthorId}`, {
        method: following ? 'DELETE' : 'POST', credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Follow failed (HTTP ${response.status}).`);
      setFollowing(Boolean(result.following));
      setFollowers(Number(result.followers) || 0);
      return Boolean(result.following);
    } finally { setLoading(false); }
  };
  return { isFollowing: following, followerCount: followers, toggleFollow: toggle, followLoading: loading, refreshFollowers: refresh };
}
