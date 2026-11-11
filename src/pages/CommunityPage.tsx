import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  HelpCircle,
  Lightbulb,
  FileText,
  Video,
  Play,
  ArrowUp,
  Share2,
  Bookmark,
  Plus,
  Search,
  Filter,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Check,
  Send,
  X,
  Flame,
  Clock,
  ThumbsUp,
  Hash,
  Copy,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Avatar } from '../components/shared/Avatar.tsx';
import { Modal } from '../components/shared/Modal.tsx';

export type PostType = 'Question' | 'Tip' | 'Resource share' | 'Video share';
export type SortOption = 'hot' | 'latest' | 'upvoted';

export interface CommunityComment {
  id: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorUniversity: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface CommunityPost {
  canManage?:boolean;
  id: string;
  type: PostType;
  title: string;
  content: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    university: string;
    batch: string;
    isVerified: boolean;
  };
  moduleCode: string;
  timestamp: string;
  upvotes: number;
  isUpvoted?: boolean;
  isSaved?: boolean;
  commentsCount: number;
  comments: CommunityComment[];
  tags: string[];
  videoData?: {
    videoId: string;
    url: string;
    duration: string;
    thumbnail: string;
    chapters?: { time: string; label: string }[];
  };
  resourceData?: {
    resourceId?: string;
    title: string;
    category: string;
    type: string;
    pagesOrDuration: string;
    priceType: 'Free' | 'Premium' | 'Paid';
    link: string;
  };
}

export interface StudyGroup {
  id: string;
  name: string;
  moduleCode: string;
  membersCount: number;
  isJoined: boolean;
  schedule: string;
  description: string;
  badgeColor: string;
}

export interface TopContributor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  university: string;
  batch: string;
  points: number;
  rank: number;
  badge: string;
  isFollowing: boolean;
  backendUserId?: number;
  verified?: boolean;
}

// Community content comes from the Java file-backed API, never sample arrays.

export const CommunityPage: React.FC = () => {
  const { currentUser, addToast } = useApp();

  // Feed & filter states
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(true);
  const [circlesError, setCirclesError] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupModule, setNewGroupModule] = useState('');
  const [newGroupSchedule, setNewGroupSchedule] = useState('Flexible / Online');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [newGroupMeetingUrl, setNewGroupMeetingUrl] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');

  const handleCreateStudyGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingGroup) return;
    setCreatingGroup(true);
    setCreateGroupError('');
    try {
      const response = await fetch('/api/study-groups', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(), moduleCode: newGroupModule.trim(),
          schedule: newGroupSchedule.trim(), description: newGroupDescription.trim(),
          badgeColor: newGroupColor, meetingUrl: newGroupMeetingUrl.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || (response.status === 401 ? 'Please sign in again.' : 'Could not create study circle.'));
      }
      setIsCreateGroupOpen(false);
      setNewGroupName(''); setNewGroupModule(''); setNewGroupDescription('');
      setNewGroupSchedule('Flexible / Online'); setNewGroupMeetingUrl('');
      await refreshStudyGroups();
      addToast({title: 'Study circle created', message: 'Your group is ready. You are its first member!', type: 'success'});
    } catch (error) {
      setCreateGroupError(error instanceof Error ? error.message : 'Could not create group.');
    } finally { setCreatingGroup(false); }
  };

  const [contributors, setContributors] = useState<TopContributor[]>([]);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);

  // Resolve leaderboard post authors to real EduShare accounts, then read follow status
  // from the same persistent API used on the user's Profile page.
  useEffect(() => {
    let cancelled = false;
    const loadFollowing = async () => {
      const usernames = [...new Set(posts.map(post => post.author.username.toLowerCase()))];
      if (usernames.length === 0) return;
      try {
        const directoryResponse = await fetch('/api/users/directory', {
          credentials: 'include', cache: 'no-store',
        });
        if (!directoryResponse.ok) throw new Error(`HTTP ${directoryResponse.status}`);
        const directory: Array<{id: number; username: string; verified?: boolean}> = await directoryResponse.json();
        const usersByName = new Map(directory.map(u => [u.username.toLowerCase(), u]));
        const statuses = await Promise.all(usernames.map(async username => {
          const account = usersByName.get(username);
          if (!account) return [username, null] as const;
          try {
            const response = await fetch(`/api/follows/${account.id}`, {
              credentials: 'include', cache: 'no-store',
            });
            if (!response.ok) return [username, {...account, following: false}] as const;
            const status: {following: boolean} = await response.json();
            return [username, {...account, following: Boolean(status.following)}] as const;
          } catch { return [username, {...account, following: false}] as const; }
        }));
        if (cancelled) return;
        const lookup = new Map(statuses);
        setContributors(previous => previous.map(contributor => {
          const profile = lookup.get(contributor.username.toLowerCase());
          return profile
            ? {...contributor, backendUserId: profile.id, verified: Boolean(profile.verified), isFollowing: profile.following}
            : {...contributor, backendUserId: undefined, isFollowing: false};
        }));
      } catch {
        // Unavailable directory: no fabricated following state.
      }
    };
    void loadFollowing();
    const onFocus = () => { if (!document.hidden) void loadFollowing(); };
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
  }, [posts, currentUser?.id]);

  const refreshPosts = async () => {
    const response = await fetch('/api/community/posts', { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('Community posts unavailable');
    const savedPosts: CommunityPost[] = await response.json();
    setPosts(savedPosts);
    const authors = new Map<string, TopContributor>();
    savedPosts.forEach((post) => {
      const key = post.author.username;
      const existing = authors.get(key);
      if (existing) { existing.points += 1; return; }
      authors.set(key, {
        id: key, username: key, name: post.author.name, avatar: post.author.avatar,
        university: post.author.university, batch: post.author.batch,
        points: 1, rank: 0, badge: 'Contributor', isFollowing: false,
      });
    });
    const ranking = Array.from(authors.values()).sort((a, b) => b.points - a.points);
    setContributors(ranking.map((member, i) => ({ ...member, rank: i + 1 })));
  };

  const refreshStudyGroups = async () => {
    try {
      const response = await fetch('/api/study-groups', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const groups: any[] = await response.json();
      const colorMap: Record<string,string> = { orange: 'bg-[#FF4A00]', blue: 'bg-[#1E6FEB]', amber: 'bg-[#FFB31F]', navy: 'bg-[#263577]' };
      setStudyGroups(groups.map(g => ({ id: String(g.id), name: g.name, moduleCode: g.moduleCode, membersCount: g.membersCount, isJoined: g.joined, schedule: g.schedule, description: g.description, badgeColor: colorMap[g.badgeColor] || 'bg-[#FF4A00]' })));
      setCirclesError(false);
    } catch { setCirclesError(true); }
    finally { setCirclesLoading(false); }
  };

  useEffect(() => {
    void refreshPosts().catch(() => addToast({title: 'Community unavailable', message: 'Could not load discussions.', type: 'warning'}));
    void refreshStudyGroups();
  }, []);

  useEffect(() => {
    const update = () => { if (!document.hidden) void refreshStudyGroups(); };
    window.addEventListener('focus', update);
    return () => window.removeEventListener('focus', update);
  }, []);

  const trendingModules = Array.from(
    posts.reduce((items, post) => {
      const previous = items.get(post.moduleCode) || 0;
      items.set(post.moduleCode, previous + 1);
      return items;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, name: code, posts: count }));

  const [activeTab, setActiveTab] = useState<'All' | PostType>('All');
  const [sortBy, setSortBy] = useState<SortOption>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModuleFilter, setActiveModuleFilter] = useState<string | null>(null);

  // Video embed states (which post's video player is currently playing inline)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Inline comment section open states: map of postId -> boolean
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Share menu open states: map of postId -> boolean
  const [openShareMenu, setOpenShareMenu] = useState<Record<string, boolean>>({});

  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPostId,setEditingPostId]=useState<string|null>(null);
  const [deletingPost,setDeletingPost]=useState<CommunityPost|null>(null);
  const [postSaving,setPostSaving]=useState(false);
  const [newPostType, setNewPostType] = useState<PostType>('Question');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostModule, setNewPostModule] = useState('');
  const [availableModules, setAvailableModules] = useState<Array<{code: string; name: string}>>([]);
  useEffect(() => {
    fetch('/api/modules', {credentials: 'include', cache: 'no-store'})
      .then(response => response.ok ? response.json() : [])
      .then((modules: Array<{code: string; name: string}>) => {
        setAvailableModules(modules);
        setNewPostModule(previous => modules.some(item => item.code === previous)
          ? previous : (modules[0]?.code || ''));
      }).catch(() => {});
  }, []);

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVideoUrl, setNewPostVideoUrl] = useState('');
  const [newPostTags, setNewPostTags] = useState('');

  // Extract YouTube ID helper
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Likes and saved posts are persisted by Spring Boot in .txt files.
  const handleToggleUpvote = async (postId: string) => {
    const id = postId.replace(/^post-/, '');
    try {
      const response = await fetch(`/api/community/posts/${id}/like`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Like could not be saved');
      const result: {enabled: boolean; count: number} = await response.json();
      setPosts((items) => items.map(item => item.id === postId
        ? { ...item, isUpvoted: result.enabled, upvotes: result.count } : item));
    } catch { addToast({title: 'Could not save like', type: 'error'}); }
  };

  const handleToggleBookmark = async (postId: string) => {
    const id = postId.replace(/^post-/, '');
    try {
      const response = await fetch(`/api/community/posts/${id}/bookmark`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Save failed');
      const result: {enabled: boolean} = await response.json();
      setPosts((items) => items.map(item => item.id === postId ? {...item, isSaved: result.enabled} : item));
      addToast({title: result.enabled ? 'Post saved' : 'Post removed from saved', type: 'success'});
    } catch { addToast({title: 'Could not save post', type: 'error'}); }
  };

  // Toggle comments expanded state
  const handleToggleComments = (postId: string) => {
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      const response = await fetch(`/api/community/posts/${postId.replace(/^post-/, '')}/comments`, {
        method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text}),
      });
      if (!response.ok) throw new Error('Could not save comment');
      setCommentInputs(prev => ({...prev, [postId]: ''}));
      await refreshPosts();
      addToast({title: 'Comment published', type: 'success'});
    } catch { addToast({title: 'Comment could not be saved', type: 'error'}); }
  };

  // Share action
  const handleCopyPostLink = (post: CommunityPost) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/community#${post.id}`
    );
    addToast({ title: 'Post link copied to clipboard!', type: 'success' });
    setOpenShareMenu((prev) => ({ ...prev, [post.id]: false }));
  };

  // Join / Leave study group with backend persistence
  const handleToggleJoinGroup = async (groupId: string) => {
    const group = studyGroups.find((g) => g.id === groupId);
    if (!group) return;
    const response = await fetch(`/api/study-groups/${groupId}/${group.isJoined ? 'leave' : 'join'}`, {
      method: group.isJoined ? 'DELETE' : 'POST',
      credentials: 'include',
    });
    if (!response.ok) { addToast({ title: 'Could not update study circle', type: 'error' }); return; }
    const updated = await response.json();
    setStudyGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, isJoined: updated.joined, membersCount: updated.membersCount } : g));
    addToast({ title: updated.joined ? `Joined ${updated.name}!` : `Left ${updated.name}`, message: updated.joined ? 'Open the circle to view posts, members, and shared resources.' : undefined, type: updated.joined ? 'success' : 'info' });
  };

  const handleToggleFollowContributor = async (contributor: TopContributor) => {
    if (followBusyId) return;
    if (!currentUser) {
      addToast({title: 'Sign in required', message: 'Log in before following a student.', type: 'warning'});
      return;
    }
    if (!contributor.backendUserId) {
      addToast({title: 'Account unavailable', message: 'This contributor could not be matched to an active EduShare account.', type: 'warning'});
      return;
    }
    if (currentUser.id === `backend-user-${contributor.backendUserId}` ||
        currentUser.username.toLowerCase() === contributor.username.toLowerCase()) return;
    setFollowBusyId(contributor.id);
    try {
      const response = await fetch(`/api/follows/${contributor.backendUserId}`, {
        method: contributor.isFollowing ? 'DELETE' : 'POST', credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Follow failed (HTTP ${response.status})`);
      setContributors(previous => previous.map(item => item.id === contributor.id
        ? {...item, isFollowing: Boolean(result.following)} : item));
      addToast({title: result.following ? 'Following student' : 'Unfollowed student', type: 'success'});
    } catch (error) {
      addToast({title: 'Could not update following', message: error instanceof Error ? error.message : 'Try again.', type: 'error'});
    } finally {
      setFollowBusyId(null);
    }
  };

  // Posts are saved by Java, then refreshed from the persistent file.
  const startNewPost=()=>{setEditingPostId(null);setNewPostTitle('');setNewPostContent('');setNewPostTags('');setNewPostVideoUrl('');setIsCreateModalOpen(true);};
  const editPost=(post:CommunityPost)=>{setEditingPostId(post.id);setNewPostTitle(post.title);setNewPostContent(post.content);setNewPostType(post.type);setNewPostModule(post.moduleCode);setNewPostTags(post.tags.join(', '));setNewPostVideoUrl(post.videoData?.url||'');setIsCreateModalOpen(true);};
  const removePost=async()=>{if(!deletingPost||postSaving)return;setPostSaving(true);try{const r=await fetch(`/api/community/posts/${deletingPost.id.replace('post-','')}`,{method:'DELETE',credentials:'include'});if(!r.ok)throw new Error('Could not delete this post.');await refreshPosts();setDeletingPost(null);addToast({title:'Post deleted',type:'success'});}catch(e){addToast({title:'Delete failed',message:(e as Error).message,type:'error'});}finally{setPostSaving(false);}};
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if(postSaving)return;
    if (!newPostTitle.trim() || !newPostContent.trim() || !newPostModule.trim()) {
      addToast({title: 'Enter the title, module and message', type: 'warning'});
      return;
    }
    setPostSaving(true);
    try {
      const response = await fetch(editingPostId?`/api/community/posts/${editingPostId.replace('post-','')}`:'/api/community/posts', {
        method: editingPostId?'PUT':'POST', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          type: newPostType, title: newPostTitle.trim(), content: newPostContent.trim(),
          moduleCode: newPostModule.trim().toUpperCase(),
          videoUrl: newPostType === 'Video share' ? newPostVideoUrl.trim() : '',
          tags: newPostTags.trim(),
        }),
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || 'Could not publish this post');
      }
      await refreshPosts();
      setIsCreateModalOpen(false);
      setNewPostTitle(''); setNewPostContent(''); setNewPostVideoUrl(''); setNewPostTags('');
      addToast({title: editingPostId?'Post updated':'Post published', type: 'success'});setEditingPostId(null);
    } catch (error) {
      addToast({title: 'Post not saved', message: error instanceof Error ? error.message : 'Please try again.', type: 'error'});
    }finally{setPostSaving(false);}
  };

  // Filter & sort logic
  const filteredPosts = posts
    .filter((post) => {
      // Type tab filter
      if (activeTab !== 'All' && post.type !== activeTab) {
        return false;
      }
      // Module tag filter
      if (
        activeModuleFilter &&
        post.moduleCode.toLowerCase() !== activeModuleFilter.toLowerCase()
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesAuthor = post.author.name.toLowerCase().includes(query);
        const matchesModule = post.moduleCode.toLowerCase().includes(query);
        const matchesTags = post.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesAuthor || matchesModule || matchesTags;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'hot') {
        // High upvotes + comments
        const scoreA = a.upvotes * 2 + a.commentsCount * 3;
        const scoreB = b.upvotes * 2 + b.commentsCount * 3;
        return scoreB - scoreA;
      }
      if (sortBy === 'upvoted') {
        return b.upvotes - a.upvotes;
      }
      // Latest (default order)
      return 0;
    });

  // Post type color & icon helper
  const getPostTypeBadge = (type: PostType) => {
    switch (type) {
      case 'Question':
        return {
          icon: HelpCircle,
          label: 'Question',
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'Tip':
        return {
          icon: Lightbulb,
          label: 'Study Tip',
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'Resource share':
        return {
          icon: FileText,
          label: 'Resource Share',
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'Video share':
        return {
          icon: Video,
          label: 'Video Share',
          bg: 'bg-[#FF4A00]/10 text-[#FF4A00] dark:bg-[#FF4A00]/20 border-[#FF4A00]/30',
        };
    }
  };

  return (
    <div className="portal-page w-full pb-20">
      {/* 1. Header Banner */}
      <div className="portal-hero community-hero relative border-b border-[#E8E2D6] dark:border-neutral-800 bg-[#FFFDF9] dark:bg-[#151821] px-4 sm:px-6 md:px-8 py-8 sm:py-10">
        <div className="w-full max-w-[1600px] mx-auto">
          {/* Pill tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFB31F]/20 text-[#FFD08B] mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Student Community</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="portal-hero-copy">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display text-[#111111] dark:text-neutral-100">
                Connect, collaborate, and share knowledge
              </h1>
              <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
                Ask tough module questions, share revision tips, recommend resources, or post video breakdowns. Learn together with university peers across Sri Lanka.
              </p>
            </div>

            {/* Quick Action Button in Header */}
            <button
              onClick={startNewPost}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold bg-[#FF4A00] text-white hover:bg-[#e04100] shadow-md transition-transform duration-200 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="#study-circles" className="inline-flex items-center gap-2 rounded-full bg-[#263577] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1e2a62] focus:outline-none focus:ring-2 focus:ring-[#FF4A00]">
              <Users className="h-4 w-4"/> Explore Study Circles
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{studyGroups.length}</span>
            </a>
            <button type="button" onClick={() => { setCreateGroupError(''); setIsCreateGroupOpen(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF4A00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e04100] focus:ring-2 focus:ring-[#263577]">
              <Plus className="h-4 w-4" /> Create Study Circle
            </button>
            <span className="portal-hero-hint text-sm">Find a module group, join, and share resources with classmates.</span>
          </div>

          {/* Search bar inside header */}
          <div className="mt-6 max-w-xl relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none dark:text-neutral-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions, module questions, tips..."
              className="w-full pl-11 pr-10 py-2.5 rounded-full border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00] transition-shadow shadow-xs placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 dark:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid (Left: Feed, Right: Sidebar) */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Tabs & Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D6] dark:border-neutral-800">
              {/* Type Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {(['All', 'Question', 'Tip', 'Resource share', 'Video share'] as const).map(
                  (tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? 'bg-[#111111] dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {tab === 'All' ? 'All Posts' : `${tab}s`}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Sort Dropdown / Segmented Buttons */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-full shrink-0 text-xs font-semibold">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                    sortBy === 'hot'
                      ? 'bg-white dark:bg-neutral-900 text-[#FF4A00] shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Hot</span>
                </button>
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                    sortBy === 'latest'
                      ? 'bg-white dark:bg-neutral-900 text-[#111111] dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Latest</span>
                </button>
                <button
                  onClick={() => setSortBy('upvoted')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                    sortBy === 'upvoted'
                      ? 'bg-white dark:bg-neutral-900 text-[#FFB31F] shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Top</span>
                </button>
              </div>
            </div>

            {/* Active Tag Filter Banner */}
            {activeModuleFilter && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-[#FF4A00]/10 border border-orange-200 dark:border-[#FF4A00]/30 text-xs">
                <div className="flex items-center gap-2 text-[#FF4A00] font-bold">
                  <Hash className="w-4 h-4" />
                  <span>Filtering by module #{activeModuleFilter}</span>
                </div>
                <button
                  onClick={() => setActiveModuleFilter(null)}
                  className="flex items-center gap-1 font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  <span>Clear filter</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Empty State */}
            {filteredPosts.length === 0 && (
              <div className="p-12 text-center rounded-2xl border border-dashed border-[#E8E2D6] dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400 mb-3 dark:text-neutral-300">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                  No discussions found
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || activeModuleFilter
                    ? 'No posts matched your search filters. Try clearing your search keyword or selected module.'
                    : 'Be the first student to start a discussion in this topic!'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveModuleFilter(null);
                    setActiveTab('All');
                  }}
                  className="mt-4 px-4 py-2 rounded-full text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* Post Feed List */}
            <div className="space-y-5">
              {filteredPosts.map((post) => {
                const badgeInfo = getPostTypeBadge(post.type);
                const BadgeIcon = badgeInfo.icon;
                const isPlayingThisVideo = playingVideoId === post.id;
                const isCommentsOpen = !!openComments[post.id];
                const isShareOpen = !!openShareMenu[post.id];

                return (
                  <motion.article
                    key={post.id}
                    id={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-[#181C26] border border-[#E8E2D6] dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                  >
                    {/* Top Meta: Type badge, module tag, author info, timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-2">
                        {/* Post Type Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeInfo.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badgeInfo.label}</span>
                        </span>

                        {/* Module Code Chip */}
                        <button
                          onClick={() => setActiveModuleFilter(post.moduleCode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 hover:bg-[#FF4A00]/10 hover:text-[#FF4A00] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          <Hash className="w-3 h-3 text-[#FF4A00]" />
                          <span>{post.moduleCode}</span>
                        </button>
                      </div>

                      {/* Author snippet & time */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <Link
                          to={`/u/${post.author.username}`}
                          className="flex items-center gap-1.5 font-medium hover:text-[#FF4A00] transition-colors"
                        >
                          <Avatar
                            src={post.author.avatar}
                            name={post.author.name}
                            size="sm"
                            isVerified={post.author.isVerified}
                          />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {post.author.name}
                          </span>
                        </Link>
                        <span>•</span>
                        <span>{post.timestamp}</span>
                      </div>
                    </div>

                    {post.canManage&&<div className="flex flex-wrap gap-2 mt-2"><button type="button" onClick={()=>editPost(post)} className="rounded-full border px-3 py-1.5 text-sm font-semibold">Edit post</button><button type="button" onClick={()=>setDeletingPost(post)} className="rounded-full border border-red-200 text-red-600 dark:text-red-300 px-3 py-1.5 text-sm font-semibold">Delete post</button></div>}
                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111111] dark:text-neutral-100 font-display hover:text-[#FF4A00] dark:hover:text-[#FF4A00] transition-colors">
                      {post.title}
                    </h2>

                    {/* Content text */}
                    <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* INLINE VIDEO EMBED (For Video Share Posts) */}
                    {post.type === 'Video share' && post.videoData && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-[#E8E2D6] dark:border-neutral-800 bg-neutral-900">
                        {isPlayingThisVideo ? (
                          <div className="relative w-full aspect-video">
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${post.videoData.videoId}?autoplay=1&rel=0`}
                              title={post.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-none"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => setPlayingVideoId(post.id)}
                            className="relative w-full aspect-video group cursor-pointer overflow-hidden bg-neutral-900"
                          >
                            <img
                              src={post.videoData.thumbnail}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                            />
                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                            {/* Centered Play Button */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                              <motion.div
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-16 h-16 rounded-full bg-[#FF4A00] text-white flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:bg-[#ff5d1a]"
                              >
                                <Play className="w-7 h-7 fill-white translate-x-0.5" />
                              </motion.div>
                              <span className="mt-3 text-xs font-semibold text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
                                Click to load video player (privacy-friendly)
                              </span>
                            </div>

                            {/* Duration Badge */}
                            <span className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-[11px] font-bold bg-black/80 text-white backdrop-blur-xs">
                              {post.videoData.duration}
                            </span>
                          </div>
                        )}

                        {/* Chapters / Timestamps if available */}
                        {post.videoData.chapters && post.videoData.chapters.length > 0 && (
                          <div className="p-3 bg-neutral-950/70 border-t border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs text-neutral-300 no-scrollbar dark:text-neutral-300">
                            <span className="text-neutral-400 font-bold text-[11px] uppercase tracking-wider shrink-0 dark:text-neutral-300">
                              Chapters:
                            </span>
                            {post.videoData.chapters.map((chap, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setPlayingVideoId(post.id);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-[#FF4A00] text-white transition-colors shrink-0 font-medium"
                              >
                                <span className="font-mono text-[#FFB31F] text-[10px]">
                                  {chap.time}
                                </span>
                                <span>{chap.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* RESOURCE ATTACHMENT CARD (For Resource Share Posts) */}
                    {post.type === 'Resource share' && post.resourceData && (
                      <div className="mt-4 p-4 rounded-xl border border-[#E8E2D6] dark:border-neutral-800 bg-[#FFFDF9] dark:bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {post.resourceData.title}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {post.resourceData.category} • {post.resourceData.type} • {post.resourceData.pagesOrDuration}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={post.resourceData.link}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#1E6FEB] text-white hover:bg-blue-600 transition-colors shadow-xs shrink-0"
                        >
                          <span>Open Resource</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {/* Tags row */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Engagement Actions Bar */}
                    <div className="mt-5 pt-4 border-t border-[#E8E2D6]/80 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs">
                      {/* Left: Upvote & Comment counts */}
                      <div className="flex items-center gap-2">
                        {/* Upvote Button */}
                        <button
                          onClick={() => handleToggleUpvote(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all active:scale-95 ${
                            post.isUpvoted
                              ? 'bg-[#FF4A00] text-white shadow-xs'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#FF4A00]/10 hover:text-[#FF4A00]'
                          }`}
                        >
                          <ArrowUp
                            className={`w-4 h-4 transition-transform ${
                              post.isUpvoted ? '-translate-y-0.5' : ''
                            }`}
                          />
                          <span>{post.upvotes}</span>
                        </button>

                        {/* Comments Toggle Button */}
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-colors ${
                            isCommentsOpen
                              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.commentsCount} comments</span>
                        </button>
                      </div>

                      {/* Right: Share Popover & Bookmark */}
                      <div className="flex items-center gap-1 relative">
                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleToggleBookmark(post.id)}
                          className={`p-2 rounded-full transition-colors ${
                            post.isSaved
                              ? 'text-[#FF4A00] bg-orange-50 dark:bg-orange-950/40'
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`}
                          />
                        </button>

                        {/* Share Button & Popover */}
                        <button
                          onClick={() =>
                            setOpenShareMenu((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {/* Share dropdown popover */}
                        {isShareOpen && (
                          <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 shadow-xl p-2 z-20 space-y-1">
                            <button
                              onClick={() => handleCopyPostLink(post)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy link</span>
                            </button>
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `${post.title} - EduShare: ${window.location.origin}/community#${post.id}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                            >
                              <span className="text-[#25D366] font-bold">WA</span>
                              <span>Share on WhatsApp</span>
                            </a>
                            <a
                              href={`https://t.me/share/url?url=${encodeURIComponent(
                                `${window.location.origin}/community#${post.id}`
                              )}&text=${encodeURIComponent(post.title)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
                            >
                              <span className="text-[#0088cc] font-bold">TG</span>
                              <span>Share on Telegram</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EXPANDABLE COMMENTS SECTION */}
                    <AnimatePresence>
                      {isCommentsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-[#E8E2D6] dark:border-neutral-800 space-y-4 overflow-hidden"
                        >
                          {/* List of comments */}
                          {post.comments.length > 0 ? (
                            <div className="space-y-3">
                              {post.comments.map((comm) => (
                                <div
                                  key={comm.id}
                                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[#E8E2D6]/60 dark:border-neutral-800"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Avatar
                                        src={comm.authorAvatar}
                                        name={comm.authorName}
                                        size="sm"
                                      />
                                      <div>
                                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                          {comm.authorName}
                                        </span>
                                        <span className="text-[11px] text-neutral-400 ml-1.5 dark:text-neutral-300">
                                          @{comm.authorUsername} • {comm.authorUniversity}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-300">
                                      {comm.timestamp}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-8">
                                    {comm.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-500 italic dark:text-neutral-300">
                              No comments yet. Be the first to reply!
                            </p>
                          )}

                          {/* Comment Input Box */}
                          <div className="flex items-center gap-2 pt-2">
                            <Avatar
                              src={
                                currentUser?.avatar ||
                                ''
                              }
                              name={currentUser?.name || 'EduShare member'}
                              size="sm"
                            />
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(post.id);
                                  }
                                }}
                                placeholder="Write a constructive answer or comment..."
                                className="w-full px-4 py-2 pr-10 rounded-full border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#FF4A00] disabled:text-neutral-300 hover:scale-105 active:scale-95 transition-transform"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. ACTIVE STUDY GROUPS WIDGET */}
            <div id="study-circles" className="scroll-mt-28 p-5 rounded-[20px] bg-white dark:bg-[#181C26] border border-[#E8E2D6] dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-[#FF4A00]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Study Circles
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-300">
                      Module study groups and discussions
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {circlesLoading && <div className="text-xs text-neutral-500 dark:text-neutral-300" role="status">Loading study circles...</div>}
                {circlesError && <div role="alert" className="text-sm text-red-600 dark:text-red-300">Could not load study circles. Check your sign-in and try again. <button className="font-bold underline" onClick={() => void refreshStudyGroups()}>Retry</button></div>}
                {!circlesLoading && !circlesError && studyGroups.length === 0 && <div className="rounded-xl border border-dashed border-[#E8E2D6] p-4 text-sm text-neutral-600 dark:text-neutral-300">No study circles yet. Be the first to create one!</div>}
                {studyGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 rounded-xl border border-[#E8E2D6]/80 dark:border-neutral-800 bg-[#FFFDF9] dark:bg-neutral-900/50 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${group.badgeColor}`}
                          />
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {group.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#FF4A00] font-semibold mt-0.5 inline-block">
                          #{group.moduleCode}
                        </span>
                      </div>

                      {/* Join / Leave button */}
                      <button
                        onClick={() => handleToggleJoinGroup(group.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 shrink-0 ${
                          group.isJoined
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-[#111111] dark:bg-white text-white dark:text-neutral-900 hover:bg-[#FF4A00] dark:hover:bg-[#FF4A00] dark:hover:text-white'
                        }`}
                      >
                        {group.isJoined ? 'Joined ✓' : 'Join'}
                      </button>
                    </div>
                    <Link to={`/community/groups/${group.id}`} className="mt-2 inline-flex text-[11px] font-bold text-[#1E6FEB] hover:underline">Open Circle →</Link>

                    <p className="mt-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {group.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-neutral-400 dark:text-neutral-300" />
                        {group.membersCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400 dark:text-neutral-300" />
                        {group.schedule}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TOP CONTRIBUTORS LEADERBOARD */}
            <div className="p-5 rounded-[20px] bg-white dark:bg-[#181C26] border border-[#E8E2D6] dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#B37400] dark:text-[#FFB31F]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Top Contributors
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-300">
                    Weekly peer reputation ranks
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#E8E2D6]/80 dark:divide-neutral-800">
                {contributors.map((contrib) => (
                  <div
                    key={contrib.id}
                    className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 text-center text-xs font-bold ${
                          contrib.rank === 1
                            ? 'text-amber-500'
                            : contrib.rank === 2
                            ? 'text-neutral-400'
                            : contrib.rank === 3
                            ? 'text-amber-700'
                            : 'text-neutral-500'
                        }`}
                      >
                        #{contrib.rank}
                      </span>
                      <Avatar
                        src={contrib.avatar}
                        name={contrib.name}
                        size="sm"
                        isVerified={Boolean(contrib.verified)}
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/u/${contrib.username}`}
                            className="text-xs font-bold text-neutral-900 dark:text-neutral-100 hover:text-[#FF4A00] transition-colors"
                          >
                            {contrib.name}
                          </Link>
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-300">
                          {contrib.university} • {contrib.points} pts
                        </span>
                      </div>
                    </div>

                    {!(currentUser && (contrib.id === currentUser.id || contrib.username === currentUser.username)) && (
                    <button
                      onClick={() => void handleToggleFollowContributor(contrib)}
                      disabled={followBusyId === contrib.id || !contrib.backendUserId}
                      title={!contrib.backendUserId ? 'Account not available to follow' : undefined}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                        contrib.isFollowing
                          ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'bg-orange-50 text-[#FF4A00] hover:bg-[#FF4A00] hover:text-white dark:bg-orange-950/40'
                      }`}
                    >
                      {followBusyId === contrib.id ? 'Saving...' : contrib.isFollowing ? 'Following' : '+ Follow'}
                    </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TRENDING MODULE TAGS */}
            <div className="p-5 rounded-[20px] bg-white dark:bg-[#181C26] border border-[#E8E2D6] dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-[#1E6FEB]">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Trending Modules
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-300">
                    Most active discussions
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {trendingModules.map((mod) => {
                  const isSelected = activeModuleFilter === mod.code;
                  return (
                    <button
                      key={mod.code}
                      onClick={() =>
                        setActiveModuleFilter(isSelected ? null : mod.code)
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#FF4A00] text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="font-bold">#{mod.code}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {mod.posts}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Floating Orange Pill Button: "Share or ask" */}
      <motion.button
        onClick={startNewPost}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#FF4A00] hover:bg-[#e04100] text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-orange-600/30 transition-all border-2 border-white/20"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Share or ask</span>
      </motion.button>

      {/* Create Study Circle Modal - available to authenticated students and admins */}
      <Modal
        isOpen={isCreateGroupOpen}
        onClose={() => { if (!creatingGroup) setIsCreateGroupOpen(false); }}
        title="Create a Study Circle"
        description="Start a study community and invite classmates to join."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudyGroup} className="space-y-4 pt-2">
          <div>
            <label htmlFor="circle-name" className="block text-sm font-semibold mb-1 dark:text-white">Group Name *</label>
            <input id="circle-name" required minLength={3} maxLength={80} value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)} placeholder="Java OOP Study Circle"
              className="w-full rounded-xl border border-neutral-300 p-3 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white dark:border-neutral-700" />
          </div>
          <div>
            <label htmlFor="circle-module" className="block text-sm font-semibold mb-1 dark:text-white">Module / Subject *</label>
            <input id="circle-module" required maxLength={40} value={newGroupModule}
              onChange={e => setNewGroupModule(e.target.value)} placeholder="Object-Oriented Programming"
              className="w-full rounded-xl border border-neutral-300 p-3 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white dark:border-neutral-700" />
          </div>
          <div>
            <label htmlFor="circle-desc" className="block text-sm font-semibold mb-1 dark:text-white">Description *</label>
            <textarea id="circle-desc" required minLength={10} maxLength={500} rows={3} value={newGroupDescription}
              onChange={e => setNewGroupDescription(e.target.value)} placeholder="Discuss Java classes, inheritance and practical coding exercises."
              className="w-full rounded-xl border border-neutral-300 p-3 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white dark:border-neutral-700" />
          </div>
          <div>
            <label htmlFor="circle-schedule" className="block text-sm font-semibold mb-1 dark:text-white">Meeting Schedule</label>
            <input id="circle-schedule" maxLength={80} value={newGroupSchedule}
              onChange={e => setNewGroupSchedule(e.target.value)} placeholder="Saturdays at 6 PM / Online"
              className="w-full rounded-xl border border-neutral-300 p-3 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white dark:border-neutral-700" />
          </div>
          <div>
            <label htmlFor="circle-meeting-url" className="block text-sm font-semibold mb-1 dark:text-white">Meeting Link (optional)</label>
            <input id="circle-meeting-url" type="url" maxLength={500} value={newGroupMeetingUrl}
              onChange={e => setNewGroupMeetingUrl(e.target.value)} placeholder="https://meet.google.com/xxx-yyyy-zzz"
              className="w-full rounded-xl border border-neutral-300 p-3 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white dark:border-neutral-700" />
            <p className="text-xs text-neutral-500 mt-1">Paste your existing Google Meet, Zoom or Teams link. EduShare does not generate meetings.</p>
          </div>
          <div>
            <label htmlFor="circle-color" className="block text-sm font-semibold mb-1 dark:text-white">Group Accent</label>
            <select id="circle-color" value={newGroupColor} onChange={e => setNewGroupColor(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 p-3 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white dark:border-neutral-700">
              <option value="blue">Blue</option><option value="orange">Orange</option>
              <option value="amber">Gold</option><option value="navy">Navy</option>
            </select>
          </div>
          {createGroupError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{createGroupError}</p>}
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" disabled={creatingGroup} onClick={() => setIsCreateGroupOpen(false)}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Cancel</button>
            <button type="submit" disabled={creatingGroup}
              className="rounded-full bg-[#FF4A00] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {creatingGroup ? 'Creating...' : 'Create Study Circle'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deletingPost)} onClose={()=>{if(!postSaving)setDeletingPost(null);}} title="Delete this post?"><p className="text-sm">The post and its comments will be removed. Other posts will be kept.</p><div className="flex gap-3 mt-5"><button type="button" disabled={postSaving} onClick={()=>void removePost()} className="rounded-full bg-red-600 px-5 py-3 text-white font-bold">Delete post</button><button type="button" disabled={postSaving} onClick={()=>setDeletingPost(null)} className="rounded-full border px-5 py-3">Cancel</button></div></Modal>
      {/* 4. Create Post Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingPostId?'Edit your post':'Share or Ask in Community'}
        description="Connect with fellow IT students across Sri Lankan universities"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5 dark:text-neutral-300">
              Post Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { type: 'Question', icon: HelpCircle, label: 'Question' },
                  { type: 'Tip', icon: Lightbulb, label: 'Study Tip' },
                  { type: 'Resource share', icon: FileText, label: 'Resource' },
                  { type: 'Video share', icon: Video, label: 'Video Share' },
                ] as const
              ).map((item) => {
                const ItemIcon = item.icon;
                const isSelected = newPostType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setNewPostType(item.type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#FF4A00] bg-[#FF4A00]/10 text-[#FF4A00] ring-2 ring-[#FF4A00]/20'
                        : 'border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Code Selector & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5 dark:text-neutral-300">
                Module Code
              </label>
              <select
                value={newPostModule}
                onChange={(e) => setNewPostModule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              >
                {!availableModules.length && <option value="">No modules yet. Ask an admin.</option>}
                {availableModules.map(module => (
                  <option key={module.code} value={module.code}>{module.code} - {module.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5 dark:text-neutral-300">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                placeholder="e.g. Dijkstra, SpringBoot, Exam2025"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              />
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5 dark:text-neutral-300">
              Title
            </label>
            <input
              type="text"
              required
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder={
                newPostType === 'Question'
                  ? 'e.g. How does indexing optimize range queries in PostgreSQL?'
                  : newPostType === 'Video share'
                  ? 'e.g. Complete Dynamic Programming Walkthrough for Exam Prep'
                  : 'e.g. 5 essential tips for passing your OOP final practical'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
            />
          </div>

          {/* Conditional Video URL input */}
          {newPostType === 'Video share' && (
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5 dark:text-neutral-300">
                YouTube Video URL
              </label>
              <input
                type="url"
                required
                value={newPostVideoUrl}
                onChange={(e) => setNewPostVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              />
              <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-300">
                Supports youtube.com/watch, youtu.be, and YouTube Shorts. Player will embed with privacy-safe nocookie.
              </p>
            </div>
          )}

          {/* Content / Body */}
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5 dark:text-neutral-300">
              Description / Notes
            </label>
            <textarea
              required
              rows={4}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Provide background, question details, or explanation of the share..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E8E2D6] dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button disabled={postSaving}
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#FF4A00] text-white hover:bg-[#e04100] shadow-sm transition-transform active:scale-95"
            >
              {postSaving?'Saving…':editingPostId?'Save post changes':'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
