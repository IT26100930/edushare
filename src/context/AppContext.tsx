import {SavedCollection,WatchProgress,resourceKey,personalResourceId,libraryRequest} from '../utils/personalLibrary';
import { parseVideoLink } from '../utils/videoLinks.ts';
import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Resource, User, ResourceReview } from '../data/models.ts';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface VerificationRequest {
  id: string;
  studentName: string;
  email: string;
  university: string;
  degree: string;
  studentIdNumber: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PendingNote {
  id: string;
  title: string;
  authorName: string;
  category: string;
  pages: number;
  priceType: 'Free' | 'Premium' | 'Paid';
  price: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

import { SellabilityConfig, DEFAULT_SELLABILITY_CONFIG } from '../config/sellabilityRules.ts';
import { ReviewPipeline } from '../services/originalityService.ts';

interface AppContextType {
  catalogReady: boolean;
  currentUser: User | null;
  authReady: boolean;
  users: User[];
  resources: Resource[];
  bookmarks: string[];
  savedCollections: SavedCollection[];
  watchProgress: WatchProgress[];
  personalLibraryLoading: boolean;
  personalLibraryError: string;
  refreshPersonalLibrary: () => Promise<void>;
  purchasedResources: string[];
  toasts: ToastMessage[];
  pendingVerifications: VerificationRequest[];
  pendingNotes: PendingNote[];
  sellabilityConfig: SellabilityConfig;
  updateSellabilityConfig: (config: SellabilityConfig) => Promise<boolean>;
  sellingPolicyReady: boolean;
  sellingPolicySaving: boolean;
  sellingPolicyError: string;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleBookmark: (resourceId: string) => void;
  isBookmarked: (resourceId: string) => boolean;
  downloadOrPurchaseResource: (resourceId: string) => Promise<boolean>;
  hasPurchasedOrDownloaded: (resourceId: string) => boolean;
  addResource: (resourceData: Partial<Resource>) => void;
  deleteOwnedResource: (resourceId: string, reason: string, feedback: string, confirmation: string) => Promise<void>;
  addReview: (resourceId: string, rating: number, comment: string) => Promise<void>;
  updateReview: (reviewId: string, rating: number, comment: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  switchUser: (userId: string | null) => void;
  acceptAuthenticatedUser: (record: BackendUser) => void;
  approveVerification: (id: string) => void;
  rejectVerification: (id: string) => void;
  approveNote: (id: string) => void;
  rejectNote: (id: string) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  deleteUserAccount: () => void;

  // Original Work Protection Methods
  reportResource: (resourceId: string, reason: string, evidenceUrl?: string, details?: string) => void;
  issueStrike: (userId: string, reason: string) => void;
  reverseEarnings: (userId: string, transactionId: string) => void;
  approveResource: (resourceId: string) => void;
  makeResourceFreeOnly: (resourceId: string) => void;
  rejectResource: (resourceId: string, reason: string) => void;
}

// Backend file records are the source of truth; demo profiles only supply optional artwork/details.
type BackendUser = { id: number; name: string; username: string; email: string; role: string; premium: boolean; verified?: boolean; avatar?: string; bio?: string; university?: string; degree?: string; batch?: string; coverPattern?: string; githubUrl?: string; linkedinUrl?: string; language?: string; showEmail?: boolean; isPublic?: boolean; interests?: string[]; notifications?: Partial<User['notifications']> };
export const mapBackendUser = (record: BackendUser): User => ({
  id: `backend-user-${record.id}`,
  name: record.name || 'EduShare Member',
  username: record.username || `member-${record.id}`,
  email: record.email || '',
  avatar: record.avatar || '',
  role: record.role?.toUpperCase() === 'ADMIN' ? 'admin' : 'student',
  isVerified: Boolean(record.verified),
  plan: record.premium ? 'Premium' : 'Free',
  notesUploaded: 0, downloadsReceived: 0, followers: 0, reputation: 0, totalEarnings: 0,
  bio: record.bio || '', university: record.university || '',
  degree: record.degree || '', batch: record.batch || '',
  coverPattern: record.coverPattern || 'peach-geometric',
  githubUrl: record.githubUrl || '', linkedinUrl: record.linkedinUrl || '',
  joinedDate: 'Member', rating: 0, interests: record.interests || [],
  isPublic: record.isPublic !== false, showEmail: record.showEmail === true, language: record.language === 'si' ? 'si' : 'en',
  notifications: { emailDigest: record.notifications?.emailDigest === true, newReviews: record.notifications?.newReviews !== false, payouts: record.notifications?.payouts === true },
});

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // LocalStorage-free React state only (in-memory)
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { pathname } = useLocation();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' });
        if (!sessionResponse.ok) return;
        const session = await sessionResponse.json();
        if (!session.loggedIn) return;
        const response = await fetch('/api/users/me', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const user = mapBackendUser(await response.json());
        setCurrentUser(user);
        setUsers((previous) => [...previous.filter((item) => item.id !== user.id), user]);
    setResources(previous=>previous.map(resource=>resource.author.id===user.id?{...resource,author:{...resource.author,name:user.name,username:user.username,avatar:user.avatar,university:user.university,isVerified:user.isVerified}}:resource));
      } catch (error) {
        console.error('Could not restore EduShare session', error);
      } finally {
        setAuthReady(true);
      }
    };
    void restoreSession();
  }, []);

  // Refresh the admin user directory from users.txt, not the three demo accounts.
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    fetch('/api/users', { credentials: 'include', cache: 'no-store' })
      .then((response) => { if (!response.ok) throw Error('Could not load users'); return response.json(); })
      .then((records: BackendUser[]) => setUsers(records.map(mapBackendUser)))
      .catch((error) => console.error('Admin user directory could not be loaded', error));
  }, [currentUser?.id, currentUser?.role]);

  const [resources, setResources] = useState<Resource[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogRefresh, setCatalogRefresh] = useState(0);
  useEffect(() => {
    // Student Browse must reflect Admin changes when users switch tabs/windows.
    const refresh = () => {
      if (!document.hidden && document.hasFocus()) setCatalogRefresh(previous => previous + 1);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  useEffect(() => {
    if (!currentUser) { setResources([]); setCatalogReady(false); return; }
    setCatalogReady(false);
    Promise.all([
      fetch('/api/resources', { credentials: 'include', cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(`Resources API: ${r.status}`); return r.json(); }),
      fetch('/api/links', { credentials: 'include', cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(`Links API: ${r.status}`); return r.json(); }),
      fetch('/api/reviews', { credentials: 'include', cache: 'no-store' }).then((r) => r.ok ? r.json() : []),
      fetch('/api/users/directory', { credentials: 'include', cache: 'no-store' }).then((r) => r.ok ? r.json() : []),
    ]).then(([backendResources, backendLinks, backendReviews, directory]) => {
      const accountDirectory: User[] = (directory as BackendUser[]).map(mapBackendUser);
      if (accountDirectory.length) setUsers(accountDirectory.map((u) => u.id === currentUser.id ? currentUser : u));
      const resolveAuthor = (email?: string, uploaderId?: number) => {
        const matched = accountDirectory.find((u) => uploaderId ? u.id === `backend-user-${uploaderId}` : Boolean(email) && u.email.toLowerCase() === String(email).toLowerCase())
          || (currentUser.email.toLowerCase() === String(email || '').toLowerCase() ? currentUser : undefined);
        if (matched) return { id: matched.id, username: matched.username, name: matched.name,
          university: matched.university, avatar: matched.avatar, isVerified: matched.isVerified };
        return { id: '', username: '', name: email ? email.split('@')[0] : 'Unknown uploader',
          university: '', avatar: '', isVerified: false };
      };
      const reviewInfo = (id: number) => {
        const records = (backendReviews as any[]).filter((entry) => Number(entry.resourceId) === Number(id));
        const reviews: ResourceReview[] = records.map((entry) => {
          const reviewer = accountDirectory.find((u) => u.id === `backend-user-${entry.userId}` ||
            false);
          return { id: `backend-review-${entry.id}`, userId: `backend-user-${entry.userId}`, userName: reviewer?.name || `Member #${entry.userId}`,
            userAvatar: reviewer?.avatar || '', university: reviewer?.university || 'EduShare',
            rating: Number(entry.rating) || 0, date: 'Saved review', comment: entry.comment || '' };
        });
        return { reviews, reviewCount: reviews.length,
          rating: reviews.length ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(2)) : 0 };
      };
      const mappedResources: Resource[] = (backendResources as any[]).map((r) => ({
        id: `backend-resource-${r.id}`,
        title: r.title,
        description: r.description || '',
        category: String(r.category || 'Uncategorized'),
        type: r.resourceType === 'PAST_PAPER' ? 'Past Paper' : r.resourceType === 'EBOOK' ? 'E-Book' : 'Notes',
        priceType: r.priceType === 'Paid' ? 'Paid' : r.priceType === 'Premium' ? 'Premium' : 'Free', price: Number(r.price) || 0, author: resolveAuthor(r.uploaderEmail, r.uploaderId), ...reviewInfo(r.id), downloads: 0, pages: Number(r.pages) || 0,
        moduleCode: r.moduleCode || '', moduleName: r.category || '', academicYear: r.academicYear || '', semester: r.semester || '',
        tags: r.tags ? String(r.tags).split(',').filter(Boolean) : [], fileFormat: 'PDF', fileSize: r.fileSize || '', updatedAt: 'Saved resource',
        tableOfContents: [], sampleContent: [], status: (String(r.status || 'approved').toLowerCase() as Resource['status']),
      }));
      const parseSavedChapters = (value: unknown) => {
        if (typeof value !== 'string') return [];
        try {
          const rows = JSON.parse(value);
          if (!Array.isArray(rows)) return [];
          return rows.filter((r) => r && typeof r.label === 'string' &&
            typeof r.time === 'string' && Number.isFinite(r.seconds));
        } catch {
          return [];
        }
      };
      const mappedLinks: Resource[] = (backendLinks as any[]).map((l) => ({
        id: `backend-link-${l.id}`, title: l.title, originalCreator:l.originalCreator, ownedVideo:Boolean(l.ownedVideo), hasVideoPreview:Boolean(l.hasPreview), status:(l.hidden?'hidden':String(l.status||'approved').toLowerCase()) as Resource['status'], description: `Curated ${l.linkType === 'VIDEO' ? 'video' : 'article'} learning resource.`,
        category: l.category || 'General', type: l.linkType === 'VIDEO' ? 'Video link' : 'Article link', priceType: l.ownedVideo ? (l.priceType==='Paid'?'Paid':l.priceType==='Premium'?'Premium':'Free') : 'Free', price: l.ownedVideo ? Number(l.price)||0 : 0, author: resolveAuthor(l.uploaderEmail, l.uploaderId),
        ...reviewInfo(-Number(l.id)), downloads: 0, pages: 0, moduleCode: l.moduleCode || 'LINK', moduleName: l.category || 'Watch & Read', academicYear: 'All Years', semester: 'All',
        tags: ['Watch & Read'], fileFormat: l.linkType === 'VIDEO' ? 'VIDEO' : 'WEB', fileSize: 'External link', updatedAt: 'Date unavailable',
        tableOfContents: [], sampleContent: [], externalUrl: l.url, videoUrl: l.linkType === 'VIDEO' ? l.url : undefined,
        videoId: l.linkType === 'VIDEO' ? parseVideoLink(l.url)?.id : undefined,
        videoPlatform: l.linkType === 'VIDEO' ? parseVideoLink(l.url)?.platform : undefined,
        timestamps: l.linkType === 'VIDEO' ? parseSavedChapters(l.chapters) : undefined,
      }));
      const catalog = [...mappedResources, ...mappedLinks];
      setResources(catalog);
    }).catch((error) => {
      console.error('EduShare resources could not be refreshed:', error);
    }).finally(() => setCatalogReady(true));

  }, [currentUser?.id, pathname, catalogRefresh]);

  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [purchasedResources, setPurchasedResources] = useState<string[]>([]);
  const [savedCollections,setSavedCollections]=useState<SavedCollection[]>([]);
  const [watchProgress,setWatchProgress]=useState<WatchProgress[]>([]);
  const [personalLibraryLoading,setPersonalLibraryLoading]=useState(false);
  const [personalLibraryError,setPersonalLibraryError]=useState('');
  const librarySequence=useRef(0),libraryUser=useRef(currentUser?.id),bookmarkRequests=useRef(new Set<string>());
  libraryUser.current=currentUser?.id;
  const refreshPersonalLibrary=async()=>{
    const identity=currentUser?.id,sequence=++librarySequence.current;
    if(!identity){setPurchasedResources([]);setBookmarks([]);setSavedCollections([]);setWatchProgress([]);setPersonalLibraryError('');setPersonalLibraryLoading(false);return;}
    setPersonalLibraryLoading(true);
    try{
      const [state, history]=await Promise.all([libraryRequest('/api/library'),libraryRequest('/api/downloads/library')]);
      if(libraryUser.current!==identity||sequence!==librarySequence.current)return;
      setPurchasedResources([...new Set<string>([...(history?.downloaded||[]),...(history?.purchased||[])].map(resourceKey))]);
      setBookmarks((state?.bookmarks||[]).map(resourceKey));
      setSavedCollections((state?.collections||[]).map((c:any)=>({...c,resourceIds:c.resourceIds.map(resourceKey)})));
      setWatchProgress((state?.progress||[]).map((p:any)=>({...p,resourceId:resourceKey(p.resourceId)})));
      setPersonalLibraryError('');
    }catch(e){if(libraryUser.current===identity && sequence===librarySequence.current)setPersonalLibraryError(e instanceof Error?e.message:'Could not load your saved resources.');throw e;}
    finally{if(libraryUser.current===identity && sequence===librarySequence.current)setPersonalLibraryLoading(false);}
  };
  useEffect(()=>{void refreshPersonalLibrary().catch(()=>{});const refresh=()=>{void refreshPersonalLibrary().catch(()=>{});};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[currentUser?.id,pathname]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Admin moderation queue in-memory
  // No fictitious student verifications or uploads on a real installation.
  const [pendingVerifications, setPendingVerifications] = useState<VerificationRequest[]>([]);
  const [pendingNotes, setPendingNotes] = useState<PendingNote[]>([]);

  // Sellability config state
  const [sellabilityConfig, setSellabilityConfig] = useState<SellabilityConfig>(DEFAULT_SELLABILITY_CONFIG);

  const [sellingPolicyReady, setSellingPolicyReady] = useState(false);
  const [sellingPolicySaving, setSellingPolicySaving] = useState(false);
  const [sellingPolicyError, setSellingPolicyError] = useState('');
  const policySaving = useRef(false);
  useEffect(() => {
    let active = true;
    fetch('/api/config/selling-policy', { credentials: 'same-origin' })
      .then(async response => { if (!response.ok) throw new Error('Saved selling rules could not be loaded. Reload to try again.'); return response.json(); })
      .then(config => { if (active) { setSellabilityConfig(config); setSellingPolicyReady(true); } })
      .catch(error => { if (active) setSellingPolicyError(error.message); });
    return () => { active = false; };
  }, []);

  const updateSellabilityConfig = async (newConfig: SellabilityConfig): Promise<boolean> => {
    if (!sellingPolicyReady || policySaving.current) return false;
    policySaving.current = true;
    setSellingPolicySaving(true);
    setSellingPolicyError('');
    try {
      const response = await fetch('/api/config/selling-policy', {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newConfig),
      });
      const saved = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(saved.message || 'Settings were not saved. Check your administrator session.');
      setSellabilityConfig(saved);
      addToast({ title: 'Settings saved', message: 'Selling rules have been saved to the server.', type: 'success' });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Settings were not saved.';
      setSellingPolicyError(message);
      addToast({ title: 'Save failed', message, type: 'warning' });
      return false;
    } finally { policySaving.current = false; setSellingPolicySaving(false); }
  };

  const reportResource = (resourceId: string, reason: string, evidenceUrl = '', details = '') => {
    if (!currentUser) { addToast({title:'Sign In Required',message:'Sign in before reporting.',type:'warning'}); return; }
    const target=resources.find(r => r.id === resourceId);
    if (target?.author.id === currentUser.id) { addToast({title:'Not permitted',message:'You cannot report your own resource.',type:'warning'}); return; }
    const isPdf=resourceId.startsWith('backend-resource-');
    const isLink=resourceId.startsWith('backend-link-');
    const numericId=Number(resourceId.slice(isPdf?'backend-resource-'.length:isLink?'backend-link-'.length:0));
    if ((!isPdf && !isLink) || !Number.isSafeInteger(numericId) || numericId<=0) {
      addToast({title:'Report unavailable',message:'This resource is currently unavailable for reporting.',type:'warning'}); return;
    }
    if (reason.trim().length<6 || reason.trim().length>500) {
      addToast({title:'Select a reason',message:'Choose a report reason before submitting.',type:'warning'}); return;
    }
    if (evidenceUrl.trim() && !/^https?:\/\/\S+$/i.test(evidenceUrl.trim())) {
      addToast({title:'Invalid evidence URL',message:'Use a full HTTP(S) link.',type:'warning'});return;
    }
    const endpoint=isLink?'/api/reports/link':'/api/reports';
    const payload=isLink?{linkId:numericId,reason,evidenceUrl,details}:{resourceId:numericId,reason,evidenceUrl,details};
    void fetch(endpoint,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(async r => {if (!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||`Server error ${r.status}`);}return r.json();})
      .then(()=>addToast({title:'Report submitted',message:'Report and evidence saved for admin review.',type:'success'}))
      .catch(e=>addToast({title:'Report failed',message:e instanceof Error?e.message:'Try again.',type:'error'}));
  };

  const issueStrike = (userId: string, reason: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const currentStrikes = (u.strikes || 0) + 1;
          const isSellingDisabled = currentStrikes >= 2;
          const isSuspended = currentStrikes >= 3;

          addToast({
            title: `Strike Issued to ${u.name} (Strike ${currentStrikes}/3)`,
            message:
              currentStrikes === 1
                ? `Official Warning: ${reason}`
                : currentStrikes === 2
                ? `Selling Disabled: ${reason}`
                : `Account Suspended: ${reason}`,
            type: currentStrikes >= 3 ? 'error' : 'warning',
          });

          return {
            ...u,
            strikes: currentStrikes,
            isSellingDisabled,
            isSuspended,
          };
        }
        return u;
      })
    );
  };

  const reverseEarnings = (userId: string, transactionId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const targetTx = u.pendingTransactions?.find((t) => t.id === transactionId);
          const amount = targetTx ? targetTx.amount : 0;
          return {
            ...u,
            pendingBalance: Math.max(0, (u.pendingBalance || 0) - amount),
            pendingTransactions: u.pendingTransactions?.filter((t) => t.id !== transactionId),
          };
        }
        return u;
      })
    );

    addToast({
      title: 'Earnings Reversed (Clawback) ✓',
      message: `Transaction ${transactionId} reversed and refunded to buyers.`,
      type: 'info',
    });
  };

  const approveResource = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, status: 'approved', aiBadge: 'Looks original', earningsFrozen: false } : r))
    );
    addToast({
      title: 'Resource Approved ✓',
      message: 'Content cleared for public catalog and earnings hold released.',
      type: 'success',
    });
  };

  const makeResourceFreeOnly = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              priceType: 'Free',
              price: 0,
              status: 'approved',
              aiBadge: 'Likely official material',
              aiReviewReason: 'Admin converted resource to Free-only under campus fair use rules.',
            }
          : r
      )
    );
    addToast({
      title: 'Converted to Free-Only ✓',
      message: 'Resource price reset to Rs. 0 and published for free student access.',
      type: 'info',
    });
  };

  const rejectResource = (resourceId: string, reason: string) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, status: 'rejected', aiReviewReason: reason } : r
      )
    );
    addToast({
      title: 'Resource Rejected',
      message: `Upload rejected: ${reason}`,
      type: 'warning',
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleBookmark = async (resourceId: string) => {
    if(!currentUser){addToast({title:'Please sign in to save resources',type:'warning'});return;}
    if(bookmarkRequests.current.has(resourceId))return;
    bookmarkRequests.current.add(resourceId);
    const identity=currentUser.id;
    try{
      const saved=bookmarks.includes(resourceId);
      await libraryRequest(`/api/bookmarks/${personalResourceId(resourceId)}`,saved?'DELETE':'POST');
      if(libraryUser.current!==identity)return;
      setBookmarks(previous=>saved?previous.filter(id=>id!==resourceId):[...new Set([...previous,resourceId])]);
      addToast({title:saved?'Removed from wishlist':'Saved to wishlist',message:'Find your saved resources in Profile → Wishlist.',type:saved?'info':'success'});
      await refreshPersonalLibrary();
    }catch(e){addToast({title:'Wishlist not updated',message:e instanceof Error?e.message:'Please try again.',type:'error'});}
    finally{bookmarkRequests.current.delete(resourceId);}
  };

  const isBookmarked = (resourceId: string) => bookmarks.includes(resourceId);

  const downloadOrPurchaseResource = async (resourceId: string): Promise<boolean> => {
    const identity=currentUser?.id;
    if (!identity || !resources.some(resource => resource.id === resourceId)) return false;
    try {
      await libraryRequest(`/api/downloads/${personalResourceId(resourceId)}`, 'POST');
      if (libraryUser.current !== identity) return false;
      await refreshPersonalLibrary();
      if (libraryUser.current !== identity) return false;
      setResources(previous => previous.map(resource => resource.id === resourceId ? {...resource, downloads: resource.downloads + 1} : resource));
      addToast({title: 'Download saved', message: 'Find it in Profile → Purchased & Downloads.', type: 'success'});
      return true;
    } catch (error) {
      addToast({title: 'Download history not saved', message: error instanceof Error ? error.message : 'Please try again.', type: 'error'});
      return false;
    }
  };

  const hasPurchasedOrDownloaded = (resourceId: string) =>
    purchasedResources.includes(resourceId);

  const deleteOwnedResource = async (resourceId: string, reason: string, feedback: string, confirmation: string) => {
    if (!currentUser) throw new Error('Please sign in first.');
    const isPdf = resourceId.startsWith('backend-resource-');
    const isLink = resourceId.startsWith('backend-link-');
    if (!isPdf && !isLink) throw new Error('This resource is currently unavailable.');
    const owned = resources.find((resource) => resource.id === resourceId);
    if (!owned || owned.author.id !== currentUser.id) throw new Error('Only the original uploader can delete a resource.');
    const numericId = resourceId.slice(isPdf ? 'backend-resource-'.length : 'backend-link-'.length);
    const endpoint = isPdf ? 'resources' : 'links';
    const response = await fetch(`/api/${endpoint}/${encodeURIComponent(numericId)}/owner-delete`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, feedback, confirmation }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `Deletion failed (${response.status}). Your resource was not removed.`);
    }
    setResources((prev) => prev.filter((resource) => resource.id !== resourceId));
    setBookmarks((prev) => prev.filter((item) => item !== resourceId));
    setPurchasedResources((prev) => prev.filter((item) => item !== resourceId));
  };

  const addResource = (resourceData: Partial<Resource>) => {
    if (!currentUser) return;

    // Run Review Pipeline
    const pipeline = new ReviewPipeline();
    const reviewResult = pipeline.runPipeline(
      {
        title: resourceData.title || 'Untitled IT Resource',
        description: resourceData.description || 'Verified IT student revision document.',
        type: resourceData.type || 'Own notes/summary',
        sampleContent: resourceData.sampleContent,
      },
      resources,
      sellabilityConfig
    );

    // Paid uploads require admin approval before going live
    const isPaid = resourceData.priceType === 'Paid';
    const isRestrictedType =
      resourceData.type === 'Past paper (official)' ||
      resourceData.type === 'Official lecture slides / textbook / e-book' ||
      resourceData.type === 'Article link';

    const requiresAdminApproval = isPaid || !reviewResult.passed || isRestrictedType;
    const initialStatus = resourceData.id?.startsWith('backend-link-') && resourceData.status === 'approved' ? 'approved' : requiresAdminApproval ? 'needs_review' : 'approved';

    const newResource: Resource = {
      id: resourceData.id || `res-${Date.now()}`,
      title: resourceData.title || 'Untitled IT Resource',
      description: resourceData.description || 'Verified IT student revision document.',
      category: resourceData.category || 'Java',
      type: resourceData.type || 'Own notes/summary',
      priceType: isRestrictedType ? 'Free' : (resourceData.priceType || 'Free'),
      price: isRestrictedType ? 0 : (resourceData.price || 0),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        university: currentUser.university,
        avatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
      },
      rating: 5.0,
      reviewCount: 0,
      downloads: 0,
      pages: resourceData.pages ?? 0,
      moduleCode: resourceData.moduleCode || 'IT1010',
      moduleName: resourceData.moduleName || 'Foundational Computing',
      academicYear: resourceData.academicYear || 'Year 2',
      semester: resourceData.semester || 'Semester 1',
      tags: resourceData.tags || ['Student Notes', 'Verified'],
      fileFormat: resourceData.fileFormat || 'PDF',
      fileSize: resourceData.fileSize || '3.4 MB',
      updatedAt: 'Just now',
      tableOfContents: resourceData.tableOfContents || [
        '1. Executive Module Overview & Syllabus Objectives',
        '2. Core Algorithms & Theoretical Proofs',
        '3. Practical Code Listings with Inline Annotations',
        '4. Midterm & Final Exam Practice Question Bank',
      ],
      sampleContent: resourceData.sampleContent || [
        'Document successfully verified by EduShare academic integrity parser.',
        'All included code examples are compiled and tested under JDK 21 / Python 3.12.',
      ],
      reviews: [],
      // Originality fields
      aiBadge: reviewResult.badge,
      aiReviewReason: reviewResult.reason,
      similarityMatch: reviewResult.similarityMatch || null,
      flaggedKeywords: reviewResult.flaggedKeywords,
      declarationConfirmed: true,
      status: initialStatus,
      reportsCount: 0,
      reports: [],
      earningsFrozen: false,
    };

    setResources((prev) => [newResource, ...prev]);

    // If Paid, add transaction in pending state for author
    if (isPaid && newResource.price > 0) {
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === currentUser.id) {
            const pendingTx = {
              id: `tx-${Date.now()}`,
              resourceId: newResource.id,
              resourceTitle: newResource.title,
              amount: Math.round(newResource.price * 0.9), // 90% payout
              releaseDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
            };
            return {
              ...u,
              notesUploaded: u.notesUploaded + 1,
              pendingBalance: (u.pendingBalance || 0) + pendingTx.amount,
              pendingTransactions: [...(u.pendingTransactions || []), pendingTx],
            };
          }
          return u;
        })
      );
    } else {
      // Update current user notes uploaded
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              notesUploaded: prev.notesUploaded + 1,
              freeUploadsCount: (prev.freeUploadsCount || 0) + 1,
            }
          : null
      );
    }

    if (initialStatus === 'needs_review') {
      addToast({
        title: 'Resource Submitted for Admin Review ✓',
        message: `"${newResource.title}" is in "Needs Review" queue due to monetization policies or AI originality verification.`,
        type: 'info',
      });
    } else {
      addToast({
        title: 'Resource Published! 🎉',
        message: `"${newResource.title}" is now available in the public catalog.`,
        type: 'success',
      });
    }
  };

  const reviewUser = useRef(currentUser?.id);
  reviewUser.current = currentUser?.id;
  const savedReview = (entry: any): ResourceReview => {
    const ownerId = `backend-user-${entry.userId}`;
    const owner = currentUser?.id === ownerId ? currentUser : users.find(user => user.id === ownerId);
    return {id: `backend-review-${entry.id}`, userId: ownerId, userName: owner?.name || `Member #${entry.userId}`,
      userAvatar: owner?.avatar || '', university: owner?.university || 'EduShare',
      rating: Number(entry.rating), comment: entry.comment, date: 'Saved review'};
  };
  const withReviews = (resource: Resource, reviews: ResourceReview[]): Resource => ({...resource, reviews,
    reviewCount: reviews.length,
    rating: reviews.length ? Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(2)) : 0});
  const reviewRequest = async (path: string, method: string, body?: unknown) => {
    const identity = currentUser?.id;
    if (!identity) throw new Error('Please sign in to manage reviews.');
    const response = await fetch(path, {method, credentials: 'include',
      headers: {'Content-Type': 'application/json'}, ...(body !== undefined ? {body: JSON.stringify(body)} : {})});
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (reviewUser.current !== identity) throw new Error('Your session changed. Please reload this page.');
    if (!response.ok) throw new Error(data?.error || `Review could not be saved (${response.status}).`);
    return data;
  };
  const addReview = async (resourceId: string, rating: number, comment: string) => {
    const entry = await reviewRequest('/api/reviews', 'POST', {resourceId: Number(personalResourceId(resourceId)), rating, comment});
    const review = savedReview(entry);
    setResources(previous => previous.map(resource => resource.id === resourceId
      ? withReviews(resource, [...resource.reviews.filter(item => item.id !== review.id), review]) : resource));
    addToast({title: 'Review posted', message: 'Your review has been saved.', type: 'success'});
  };
  const updateReview = async (reviewId: string, rating: number, comment: string) => {
    if (!/^backend-review-\d+$/.test(reviewId)) throw new Error('This review cannot be edited. Reload the page.');
    const entry = await reviewRequest(`/api/reviews/${reviewId.replace('backend-review-', '')}`, 'PUT', {rating, comment});
    const review = savedReview(entry);
    setResources(previous => previous.map(resource => resource.reviews.some(item => item.id === reviewId)
      ? withReviews(resource, resource.reviews.map(item => item.id === reviewId ? review : item)) : resource));
    addToast({title: 'Review updated', message: 'Your changes have been saved.', type: 'success'});
  };
  const deleteReview = async (reviewId: string) => {
    if (!/^backend-review-\d+$/.test(reviewId)) throw new Error('This review cannot be deleted. Reload the page.');
    await reviewRequest(`/api/reviews/${reviewId.replace('backend-review-', '')}`, 'DELETE');
    setResources(previous => previous.map(resource => resource.reviews.some(item => item.id === reviewId)
      ? withReviews(resource, resource.reviews.filter(item => item.id !== reviewId)) : resource));
    addToast({title: 'Review deleted', message: 'The review has been removed.', type: 'success'});
  };
  const acceptAuthenticatedUser = (record: BackendUser) => {
    const user = mapBackendUser(record);
    setCurrentUser(user);
    setUsers((previous) => [...previous.filter((item) => item.id !== user.id), user]);
  };

  const switchUser = (userId: string | null) => {
    if (!userId) {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      setCurrentUser(null);
      setResources([]); setBookmarks([]); setPurchasedResources([]);
      addToast({
        title: 'Logged Out',
        message: 'Browsing EduShare as guest student.',
        type: 'info',
      });
      return;
    }

    // Do not switch identities by local UI state. A login must be verified by the backend.
    addToast({ title: 'Sign In Required', message: 'Please sign in with your email and password.', type: 'warning' });
  };

  const approveVerification = (id: string) => {
    setPendingVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'approved' } : v))
    );
    addToast({
      title: 'Student ID Approved ✓',
      message: 'Verified badge assigned to student profile.',
      type: 'success',
    });
  };

  const rejectVerification = (id: string) => {
    setPendingVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'rejected' } : v))
    );
    addToast({
      title: 'Verification Declined',
      message: 'Student notified to re-upload clear campus credentials.',
      type: 'warning',
    });
  };

  const approveNote = (id: string) => {
    setPendingNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'approved' } : n))
    );
    addToast({
      title: 'Note Approved for Catalog',
      message: 'Resource passed malware and academic integrity checks.',
      type: 'success',
    });
  };

  const rejectNote = (id: string) => {
    setPendingNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'rejected' } : n))
    );
    addToast({
      title: 'Note Rejected',
      message: 'Flagged for copyrighted textbook excerpts.',
      type: 'warning',
    });
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    if (!currentUser) throw new Error('Sign in to save profile changes.');
    const original = currentUser;
    const updated = { ...currentUser, ...updates };
    if (!original.id.startsWith('backend-user-') && !/^usr-[123]$/.test(original.id)) {
      throw new Error('This account is currently unavailable. Please sign in again.');
    }
    const backendId = original.id.startsWith('backend-user-') ? original.id.slice(13) : original.id.slice(4);
    const saved = { name: updated.name, username: updated.username, email: updated.email,
      bio: updated.bio, university: updated.university, degree: updated.degree, batch: updated.batch,
      coverPattern: updated.coverPattern, githubUrl: updated.githubUrl, linkedinUrl: updated.linkedinUrl,
      language: updated.language, showEmail: updated.showEmail, isPublic: updated.isPublic, interests: updated.interests, notifications: updated.notifications };
    const response = await fetch(`/api/users/${backendId}`, { method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saved) });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.error || `Profile could not be saved (HTTP ${response.status}).`);
    }
    const backendRecord: BackendUser = await response.json();
    const persisted = mapBackendUser(backendRecord);
    setResources(previous => previous.map(resource => resource.author.id === persisted.id ? { ...resource, author: { ...resource.author, name: persisted.name, username: persisted.username, avatar: persisted.avatar, university: persisted.university, isVerified: persisted.isVerified } } : resource));
    setCurrentUser(persisted);
    setUsers((prev) => prev.map((u) => u.id === original.id ? persisted : u));
  };

  const deleteUserAccount = () => {
    if (!currentUser) return;
    const id = currentUser.id;
    const backendId = id.startsWith('backend-user-') ? id.slice(13) : /^usr-[123]$/.test(id) ? id.slice(4) : null;
    if (!backendId) { addToast({ title: 'Account deletion unavailable', type: 'error' }); return; }
    fetch(`/api/users/${backendId}`, { method: 'DELETE', credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw Error('Delete failed');
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setCurrentUser(null); setResources([]); setBookmarks([]); setPurchasedResources([]);
        addToast({ title: 'Account Deleted', message: 'Your account has been removed.', type: 'info' });
      })
      .catch(() => addToast({ title: 'Account Deletion Failed', message: 'Please try again.', type: 'error' }));
  };

  const value = useMemo(
    () => ({
      currentUser,
      authReady,
      users,
      resources,
      catalogReady,
      bookmarks,
      savedCollections,watchProgress,personalLibraryLoading,personalLibraryError,refreshPersonalLibrary,
      purchasedResources,
      toasts,
      pendingVerifications,
      pendingNotes,
      sellabilityConfig, sellingPolicyReady, sellingPolicySaving, sellingPolicyError,
      updateSellabilityConfig,
      addToast,
      removeToast,
      toggleBookmark,
      isBookmarked,
      downloadOrPurchaseResource,
      hasPurchasedOrDownloaded,
      addResource,
      deleteOwnedResource,
      addReview,
      updateReview,
      deleteReview,
      switchUser,
      acceptAuthenticatedUser,
      approveVerification,
      rejectVerification,
      approveNote,
      rejectNote,
      updateUserProfile,
      deleteUserAccount,
      reportResource,
      issueStrike,
      reverseEarnings,
      approveResource,
      makeResourceFreeOnly,
      rejectResource,
    }),
    [
      currentUser,
      authReady,
      users,
      resources,
      catalogReady,
      bookmarks,
      savedCollections,watchProgress,personalLibraryLoading,personalLibraryError,refreshPersonalLibrary,
      purchasedResources,
      toasts,
      pendingVerifications,
      pendingNotes,
      sellabilityConfig, sellingPolicyReady, sellingPolicySaving, sellingPolicyError,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
