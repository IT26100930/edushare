import {PdfStudyTools} from '../components/PdfStudyTools';
import {ResourceDetailsEditor} from '../components/ResourceDetailsEditor';
import {ProtectedVideoPlayer} from '../components/ProtectedVideoPlayer';
import {ResourcePriceEditor} from '../components/ResourcePriceEditor';
import {libraryRequest,personalResourceId} from '../utils/personalLibrary';
import {useVideoPlayback} from '../hooks/useVideoPlayback';
import {MentionTextarea} from '../components/MentionTextarea';
import {discussionId, parseDiscussionTime, formatDiscussionTime, commentDate} from '../utils/discussion';
import { useStudentFollow } from '../hooks/useStudentFollow.ts';
import { parseVideoLink } from '../utils/videoLinks.ts';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Bookmark,
  Share2,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  Star,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  MessageSquare,
  Lock,
  CheckCircle2,
  Heart,
  CornerDownRight,
  Send,
  Flag,
  MoreVertical,
  QrCode,
  Copy,
  Check,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Eye,
  UserCheck,
  UserPlus,
  HelpCircle,
  BookOpen,
  Award,
  Globe,
  SlidersHorizontal,
  ThumbsUp,
  Trash2,
  Edit2,
  ExternalLink,
  Play,
  Clock,
  FolderPlus,
  AlertTriangle,
  Video,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Resource, User } from '../data/models.ts';
import { Badge } from '../components/shared/Badge.tsx';
import { Avatar } from '../components/shared/Avatar.tsx';
import { Rating } from '../components/shared/Rating.tsx';
import { Card } from '../components/shared/Card.tsx';
import { Button } from '../components/Button.tsx';
import { Tag } from '../components/Tag.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { Input } from '../components/shared/Input.tsx';
import { calculatePdfPrice, MARKETPLACE_CONFIG } from '../data/plansConfig.ts';

interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  university: string;
  isVerified: boolean;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  replies?: CommentItem[];
}

export const ResourceDetailPage: React.FC = () => {
  const {id}=useParams();
  const {resources,catalogReady}=useApp();
  if(!resources.some(r=>r.id===id)) return <div className="px-6 py-20 text-center"><h2 className="text-xl font-bold">{catalogReady ? 'Study Resource Not Found' : 'Loading resource…'}</h2>{catalogReady && <Link to="/browse" className="text-[#FF4A00] underline">Back to Browse</Link>}</div>;
  return <ResourceDetailContent key={id}/>;
};
const ResourceDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    resources,
    users,
    currentUser,
    savedCollections,watchProgress,refreshPersonalLibrary,
    isBookmarked,
    toggleBookmark,
    downloadOrPurchaseResource,
    hasPurchasedOrDownloaded,
    addReview,
    updateReview,
    deleteReview,
    addToast,
    deleteOwnedResource,
    reportResource,
  } = useApp();

  const resource = resources.find((r) => r.id === id);

  const [reportEvidenceUrl, setReportEvidenceUrl] = useState('');
  const [reportEvidenceDetails, setReportEvidenceDetails] = useState('');
  const [myEvidenceRequests, setMyEvidenceRequests] = useState<Array<{id:string;resourceId:number;targetTitle:string;status:string}>>([]);
  const [replyEvidenceId, setReplyEvidenceId] = useState<string | null>(null);
  const [replyEvidenceUrl, setReplyEvidenceUrl] = useState('');
  const [replyEvidenceDetails, setReplyEvidenceDetails] = useState('');
  const [evidenceSaving, setEvidenceSaving] = useState(false);
  useEffect(() => {
    if (!currentUser) { setMyEvidenceRequests([]); return; }
    let cancelled=false;
    void fetch('/api/reports/mine',{credentials:'include',cache:'no-store'})
      .then(r=>r.ok?r.json():[])
      .then(data=>{if (!cancelled && Array.isArray(data)) setMyEvidenceRequests(data);})
      .catch(()=>{});
    return ()=>{cancelled=true;};
  }, [currentUser?.id, id]);
  const sendAdditionalEvidence = async (reportId: string) => {
    if (evidenceSaving) return;
    setEvidenceSaving(true);
    try {
      const response=await fetch(`/api/reports/${reportId}/evidence`,{method:'POST',credentials:'include',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({evidenceUrl:replyEvidenceUrl,details:replyEvidenceDetails})});
      if (!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'Could not submit evidence.');}
      setMyEvidenceRequests(prev=>prev.map(r=>r.id===reportId?{...r,status:'pending'}:r));
      setReplyEvidenceId(null);setReplyEvidenceUrl('');setReplyEvidenceDetails('');
      addToast({title:'Evidence submitted',message:'Admin can now continue reviewing your report.',type:'success'});
    } catch (error) { addToast({title:'Evidence not sent',message:error instanceof Error?error.message:'Try again.',type:'error'}); }
    finally {setEvidenceSaving(false);}
  };

  const [showDeleteResourceModal, setShowDeleteResourceModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Uploaded the wrong document');
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingResource, setDeletingResource] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const confirmOwnerDeletion = async () => {
    if (!resource || deletingResource) return;
    setDeletingResource(true); setDeleteError('');
    try {
      await deleteOwnedResource(resource.id, deleteReason, deleteFeedback, deleteConfirmation);
      addToast({ title: 'Resource removed', message: 'Your feedback has been saved and the resource was removed.', type: 'success' });
      setShowDeleteResourceModal(false);
      navigate('/profile');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Deletion failed. Your resource was not removed.');
    } finally { setDeletingResource(false); }
  };

  // Active Main Tab: Overview, Preview, Reviews, Comments
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'reviews' | 'comments'>(()=>new URLSearchParams(window.location.search).has('discussion') ? 'comments' : new URLSearchParams(window.location.search).get('tab') === 'reviews' ? 'reviews' : 'overview');

  // Preview Carousel State
  const [previewPage, setPreviewPage] = useState(1);
  const [pdfBookmarks, setPdfBookmarks] = useState<{title:string;page:number}[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  // Re-check the persisted demo unlock after a refresh or new login.
  const [serverUnlockedPdfId, setServerUnlockedPdfId] = useState<string | null>(null);
  const [missingOriginalPdfId, setMissingOriginalPdfId] = useState<string | null>(null);
  useEffect(() => {
    setPdfBookmarks([]);
    if (!id?.startsWith('backend-resource-')) return;
    const pdfId = id.slice('backend-resource-'.length);
    let active = true;
    fetch(`/api/resources/${encodeURIComponent(pdfId)}/bookmarks`, {credentials:'include'})
      .then(r => r.ok ? r.json() : [])
      .then(rows => { if (active && Array.isArray(rows)) setPdfBookmarks(rows); })
      .catch(() => {});
    return () => {active = false;};
  }, [id, serverUnlockedPdfId]);

  useEffect(() => {
    setServerUnlockedPdfId(null);
    setMissingOriginalPdfId(null);
    if (!id?.startsWith('backend-resource-') || !currentUser) return;
    const pdfId = id.slice('backend-resource-'.length);
    let live = true;
    fetch(`/api/resources/${encodeURIComponent(pdfId)}/access`, {credentials: 'include'})
      .then((r) => r.ok ? r.json() : null)
      .then((result) => { if (!live || !result) return; if (result.allowed) setServerUnlockedPdfId(pdfId); if (result.available === false) setMissingOriginalPdfId(pdfId); })
      .catch(() => {});
    return () => { live = false; };
  }, [id, currentUser?.id]);

  const [ownedVideoAccess,setOwnedVideoAccess]=useState<boolean|null>(null);
  useEffect(()=>{setOwnedVideoAccess(null);if(!resource?.ownedVideo||!id||!currentUser)return;let live=true;const numeric=id.replace('backend-link-','');fetch(`/api/owned-videos/${numeric}/access`,{credentials:'include'}).then(r=>r.ok?r.json():null).then(d=>{if(live)setOwnedVideoAccess(Boolean(d?.allowed));}).catch(()=>{if(live)setOwnedVideoAccess(false);});return()=>{live=false;};},[id,currentUser?.id,currentUser?.plan,resource?.ownedVideo,resource?.priceType]);

  // Follow State
  const { isFollowing, followerCount: authorFollowers, toggleFollow, followLoading } = useStudentFollow(resource?.author.id, currentUser?.id);

  // Share Popover Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Checkout 3-Step Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Reviews State
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  useEffect(() => {
    if (!editingReviewId) return;
    const frame = requestAnimationFrame(() => document.getElementById('review-editor')?.scrollIntoView({behavior: 'smooth', block: 'center'}));
    return () => cancelAnimationFrame(frame);
  }, [editingReviewId]);
  useEffect(() => {
    setEditingReviewId(null); setDeletingReviewId(null); setReviewError(''); setReviewComment(''); setReviewRating(0);
  }, [id]);
  const [reviewComment, setReviewComment] = useState('');

  // Comments State (with nested replies, likes, editing, deleting)
  const [commentSort, setCommentSort] = useState<'newest' | 'top'>('top');
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const [comments, setComments] = useState<CommentItem[]>([]);
  const resourceNumber = discussionId(id);
  const [commentBusy,setCommentBusy]=useState(false);
  const [commentError,setCommentError]=useState('');
  const [manualTime,setManualTime]=useState('');
  const refreshComments = async () => {
    if (!resourceNumber) { setComments([]); return; }
    const response = await fetch(`/api/resource-comments/resource/${resourceNumber}`, { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load comments');
    setComments(await response.json());
  };
  useEffect(() => { void refreshComments().catch(() => setCommentError('Could not load discussion. Refresh to retry.')); }, [id, currentUser?.id]);
  useEffect(()=>{if(activeTab==='comments' && comments.length && window.location.hash) requestAnimationFrame(()=>document.getElementById(window.location.hash.slice(1))?.scrollIntoView({block:'center'}));},[comments,activeTab]);

  if (!resource) {
    return (
      <div className="px-6 py-20 text-center max-w-lg mx-auto">
        <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100 mb-2">
          Study Resource Not Found
        </h2>
        <p className="text-sm text-neutral-500 mb-6 dark:text-neutral-300">
          The requested study document may have been removed or relocated in the syllabus.
        </p>
        <Button to="/browse" variant="primary">
          Explore Catalog &rarr;
        </Button>
      </div>
    );
  }

  const bookmarked = isBookmarked(resource.id);
  const hasAccess = resource.ownedVideo ? ownedVideoAccess===true : hasPurchasedOrDownloaded(resource.id) || resource.priceType === 'Free' || (resource.priceType === 'Premium' && currentUser?.plan === 'Premium') || (resource.id.startsWith('backend-resource-') && serverUnlockedPdfId === resource.id.slice('backend-resource-'.length));
  const isPremiumUser = currentUser?.plan === 'Premium';
  const uploadedPdfId = resource.id.startsWith('backend-resource-') ? resource.id.slice('backend-resource-'.length) : null;
  const canViewUploadedPdf = hasAccess || Boolean(currentUser && resource.author.id === currentUser.id);
  const pdfPriceInfo = useMemo(() => {
    return calculatePdfPrice(resource.price, isPremiumUser && !resource.ownedVideo);
  }, [resource.price, isPremiumUser,resource.ownedVideo]);

  const [searchParams] = useSearchParams();
  const timeParam = searchParams.get('t');

  const parseTimeStrToSeconds = (str: string): number => {
    if (!str) return 0;
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    const parts = str.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const formatSecondsToTime = formatDiscussionTime;

  const isArticle=resource.fileFormat==='WEB'||resource.type==='Article link'||resource.type==='Article';
  const isVideo = resource.fileFormat === 'VIDEO' || resource.type === 'Video link' || Boolean(resource.videoId);
  const parsedVideo = resource.videoUrl ? parseVideoLink(resource.videoUrl) : null;
  const videoId = parsedVideo?.id || resource.videoId || '';
  const videoPlatform = resource.ownedVideo ? 'owned' : parsedVideo?.platform || resource.videoPlatform || 'youtube';


  // Video Chapters list fallback
  const videoChapters = useMemo(() => {
    if (resource.timestamps && resource.timestamps.length > 0) {
      return resource.timestamps;
    }
    // Newly submitted videos do not inherit chapters from the demo video.
    return [];
  }, [resource.timestamps]);

  // Video Player state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [currentSeekSec, setCurrentSeekSec] = useState<number>(() => {
    return timeParam ? parseTimeStrToSeconds(timeParam) : 0;
  });
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    videoChapters.length > 0 ? videoChapters[0].id : null
  );
  const [requestedSeekSec,setRequestedSeekSec]=useState(currentSeekSec);
  const [seekRevision,setSeekRevision]=useState(0);
  useVideoPlayback(isPlayingVideo,videoPlatform,videoId,requestedSeekSec,setCurrentSeekSec,seekRevision);
  const initialVideoStart=useRef(currentSeekSec);
  const videoEmbedUrl = videoId ? (videoPlatform === 'vimeo'
    ? `https://player.vimeo.com/video/${videoId}?autoplay=1#t=${initialVideoStart.current}s`
    : `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&autoplay=1&start=${initialVideoStart.current}`) : '';


  // Watched state
  const progress=watchProgress?.find(p=>p.resourceId===resource.id);
  const isWatched=progress?.status==='COMPLETED';
  const [libraryBusy,setLibraryBusy]=useState(false);
  const [libraryActionError,setLibraryActionError]=useState('');
  const playbackRef=useRef(currentSeekSec);playbackRef.current=currentSeekSec;
  useEffect(()=>{
    if(!isPlayingVideo || !currentUser || isWatched || (resource.ownedVideo && !ownedVideoAccess))return;
    const save=()=>libraryRequest(`/api/library/progress/${personalResourceId(resource.id)}`,'PUT',{status:'IN_PROGRESS',seconds:playbackRef.current,automatic:true});
    void save().then(()=>refreshPersonalLibrary()).catch(()=>{});
    const interval=window.setInterval(()=>{void save().catch(()=>{});},15000);
    return()=>clearInterval(interval);
  },[isPlayingVideo,resource.id,currentUser?.id,isWatched,ownedVideoAccess]);

  // Video Share specific state
  const [copiedTimestampLink, setCopiedTimestampLink] = useState(false);

  // Collections state
  const [showSaveCollectionModal, setShowSaveCollectionModal] = useState(false);
  const userCollections=(savedCollections||[]).map(c=>({...c,count:c.resourceIds.length,hasItem:c.resourceIds.includes(resource.id),color:'#FF4A00'}));
  const [newCollectionName, setNewCollectionName] = useState('');

  // Broken Link report modal
  const [showBrokenLinkModal, setShowBrokenLinkModal] = useState(false);
  const [brokenLinkReason, setBrokenLinkReason] = useState('Video has been made private, unlisted, or deleted on YouTube');
  const [brokenLinkNote, setBrokenLinkNote] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Original Work Report Modal State
  const [showAuthorReportModal, setShowAuthorReportModal] = useState(false);
  const [authorReportReason, setAuthorReportReason] = useState<string>('Official university exam paper');

  // Handle URL time param on mount
  useEffect(() => {
    if (timeParam) {
      const sec = parseTimeStrToSeconds(timeParam);
      if (sec > 0) {
        setCurrentSeekSec(sec);
        setRequestedSeekSec(sec);
        setIsPlayingVideo(true);
        const match = [...videoChapters].reverse().find((ch) => sec >= ch.seconds);
        if (match) setActiveChapterId(match.id);
      }
    }
  }, [timeParam, videoChapters]);

  // Learning Points for video or guide
  const learningPoints = useMemo(() => {
    if (resource.learningOutcomes) {
      return resource.learningOutcomes
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean);
    }
    return resource.description?.trim() ? [resource.description.trim()] : ['No description has been added yet.'];
  }, [resource.learningOutcomes, resource.description]);

  // Seek video
  const seekToTimestamp = (seconds: number, chapterId?: string) => {
    setCurrentSeekSec(seconds);
    if (chapterId) {
      setActiveChapterId(chapterId);
    } else {
      const match = [...videoChapters].reverse().find((ch) => seconds >= ch.seconds);
      if (match) setActiveChapterId(match.id);
    }

    setRequestedSeekSec(seconds);
    setSeekRevision(v=>v+1);
    setIsPlayingVideo(true);

    const playerContainer = document.getElementById('video-player-container');
    if (playerContainer) {
      playerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleToggleWatched = async () => {
    if(libraryBusy)return;setLibraryBusy(true);setLibraryActionError('');
    try{await libraryRequest(`/api/library/progress/${personalResourceId(resource.id)}`,'PUT',{status:isWatched?'IN_PROGRESS':'COMPLETED',seconds:currentSeekSec});await refreshPersonalLibrary();addToast({title:isWatched?'Marked as not finished':'Marked as watched',message:'View this video in Profile → Watch history.',type:'success'});}
    catch(e){const message=e instanceof Error?e.message:'Progress could not be saved.';setLibraryActionError(message);addToast({title:'Progress not saved',message,type:'error'});}finally{setLibraryBusy(false);}
  };
  const handleToggleSaveToCollection = async (colId:string) => {
    if(libraryBusy)return;setLibraryBusy(true);setLibraryActionError('');
    try{const saved=userCollections.find(c=>c.id===colId)?.hasItem;await libraryRequest(`/api/library/collections/${colId}/items/${personalResourceId(resource.id)}`,saved?'DELETE':'PUT');await refreshPersonalLibrary();addToast({title:saved?'Removed from collection':'Saved to collection',message:'View your collections in your profile.',type:'success'});}
    catch(e){setLibraryActionError(e instanceof Error?e.message:'Collection not updated.');}finally{setLibraryBusy(false);}
  };
  const handleCreateCollection = async () => {
    if(!newCollectionName.trim()||libraryBusy)return;setLibraryBusy(true);setLibraryActionError('');
    try{await libraryRequest('/api/library/collections','POST',{name:newCollectionName.trim(),resourceId:Number(personalResourceId(resource.id))});await refreshPersonalLibrary();setNewCollectionName('');addToast({title:'Collection created',message:'This resource is saved in your new collection.',type:'success'});}
    catch(e){setLibraryActionError(e instanceof Error?e.message:'Could not create collection.');}finally{setLibraryBusy(false);}
  };

  const handleSubmitBrokenLinkReport = async () => {
    if (!currentUser) {
      addToast({ title: 'Sign in required', message: 'Please sign in before reporting a link.', type: 'warning' });
      return;
    }
    const linkId = resource?.id.startsWith('backend-link-')
      ? Number(resource.id.slice('backend-link-'.length)) : NaN;
    if (!Number.isSafeInteger(linkId) || linkId <= 0) {
      addToast({ title: 'Report unavailable', message: 'This link is currently unavailable for reporting.', type: 'warning' });
      return;
    }
    const reason = `${brokenLinkReason}. ${brokenLinkNote}`.trim();
    setIsSubmittingReport(true);
    try {
      const response = await fetch('/api/reports/link', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, reason }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Could not submit report (HTTP ${response.status}).`);
      setShowBrokenLinkModal(false);
      setBrokenLinkNote('');
      addToast({ title: 'Report submitted', message: 'Your report was saved and is ready for admin review.', type: 'success' });
    } catch (error) {
      addToast({ title: 'Report not saved', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCopyTimestampLink = () => {
    const url = `${window.location.origin}/resource/${resource.id}?t=${currentSeekSec}`;
    navigator.clipboard?.writeText(url);
    setCopiedTimestampLink(true);
    setTimeout(() => setCopiedTimestampLink(false), 2000);
    addToast({
      title: 'Timestamped Link Copied ✓',
      message: `Direct link starting at ${formatSecondsToTime(currentSeekSec)} copied to clipboard.`,
      type: 'success',
    });
  };

  // Related Resources (same category or popular)
  const relatedResources = resources
    .filter((r) => r.id !== resource.id && (r.category === resource.category || r.rating >= 4.8))
    .slice(0, 3);

  // Author handle
  const authorCleanHandle = resource.author.username || ''; // saved username, never derived from a display name
  const isOwnResource = Boolean(currentUser && resource.author.id === currentUser.id);

  // Handlers
  const handleFollowToggle = async () => {
    if (isOwnResource) return;
    try {
      const nowFollowing = await toggleFollow();
      addToast({
        title: nowFollowing ? 'Following Student Author' : 'Unfollowed Author',
        message: nowFollowing ? `You now follow @${authorCleanHandle}.` : `You no longer follow @${authorCleanHandle}.`,
        type: nowFollowing ? 'success' : 'info',
      });
    } catch (error) {
      addToast({ title: 'Follow could not be saved', message: error instanceof Error ? error.message : 'Please sign in and try again.', type: 'error' });
    }
  };

  // Download the actual stored PDF. Never show a success toast before bytes arrive.
  const downloadActualPdf = async () => {
    if (isDownloading) return;
    if (!uploadedPdfId) {
      addToast({ title: 'Original file unavailable', message: 'This catalog entry has no uploaded PDF. Ask the author to upload one.', type: 'error' });
      return;
    }
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/resources/${encodeURIComponent(uploadedPdfId)}/download`, { credentials: 'include' });
      if (!response.ok) {
        const reason = response.status === 404 ? 'The original PDF is not available on this server. Check the data/uploads folder.'
          : response.status === 403 ? 'This PDF has not been unlocked for your account.'
          : response.status === 401 ? 'Please sign in again before downloading.'
          : `Download failed (HTTP ${response.status}).`;
        throw new Error(reason);
      }
      const file = await response.blob();
      if (file.size === 0) throw new Error('The server returned an empty file.');
      const firstBytes = await file.slice(0, 5).text();
      if (firstBytes !== '%PDF-') throw new Error('The server did not return a valid PDF document.');
      const objectUrl = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${resource.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100) || 'EduShare-Resource'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      await downloadOrPurchaseResource(resource.id);
    } catch (error) {
      addToast({ title: 'PDF download failed', message: error instanceof Error ? error.message : 'Unable to download original PDF.', type: 'error' });
    } finally { setIsDownloading(false); }
  };

  const handleOpenBuyFlow = () => {
    if (resource.priceType === 'Premium' && !isPremiumUser && !isOwnResource && !hasAccess) {
      navigate('/pricing');
      return;
    }
    if (hasAccess || isOwnResource) {
      if(resource.ownedVideo){setIsPlayingVideo(true);return;}
      void downloadActualPdf();
    } else {
      setCheckoutStep(1);
      setShowCheckoutModal(true);
    }
  };

  const handleProceedToPayment = () => {
    setCheckoutStep(2);
  };

  const handleSimulatePayment = async () => {
    setIsProcessingPayment(true);
    try {
      if(resource.ownedVideo){const result=await fetch(`/api/owned-videos/${resource.id.replace('backend-link-','')}/demo-unlock`,{method:'POST',credentials:'include'});if(!result.ok)throw new Error('Could not unlock video.');setOwnedVideoAccess(true);}
      if (uploadedPdfId) {
        const result = await fetch(`/api/resources/${encodeURIComponent(uploadedPdfId)}/demo-unlock`, {method: 'POST', credentials: 'include'});
        if (!result.ok) throw new Error('Could not save demo access');
      }
      if (uploadedPdfId) setServerUnlockedPdfId(uploadedPdfId);
      await refreshPersonalLibrary();
      setCheckoutStep(3);
    } catch (e) {
      addToast({title: 'Demo checkout failed', message: e instanceof Error ? e.message : 'Try again', type: 'error'});
    } finally {setIsProcessingPayment(false);}
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast({
      title: 'Link Copied to Clipboard ✓',
      message: 'Share this study resource with your classmates.',
      type: 'success',
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewBusy || !reviewComment.trim() || reviewRating < 1) return;
    setReviewBusy(true); setReviewError('');
    try {
      if (editingReviewId) await updateReview(editingReviewId, reviewRating, reviewComment.trim());
      else await addReview(resource.id, reviewRating, reviewComment.trim());
      setReviewComment(''); setReviewRating(0); setEditingReviewId(null);
    } catch (error) { setReviewError(error instanceof Error ? error.message : 'Review could not be saved.'); }
    finally { setReviewBusy(false); }
  };
  const handleReviewDelete = async () => {
    if (!deletingReviewId || reviewBusy) return;
    setReviewBusy(true); setReviewError('');
    try {
      await deleteReview(deletingReviewId);
      if (editingReviewId === deletingReviewId) {setEditingReviewId(null);setReviewComment('');setReviewRating(0);}
      setDeletingReviewId(null);
    } catch (error) { setReviewError(error instanceof Error ? error.message : 'Review could not be deleted.'); }
    finally { setReviewBusy(false); }
  };

  // Resource discussion actions persist in Java file storage.
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !resourceNumber || commentBusy) return;
    setCommentBusy(true); setCommentError('');
    try {
      const response = await fetch(`/api/resource-comments/resource/${resourceNumber}`, {
        method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: commentInput.trim()}),
      });
      if (!response.ok) { const error=await response.json().catch(()=>({})); throw new Error(error.error || (response.status===401 ? 'Please sign in again.' : 'Comment could not be saved.')); }
      setCommentInput(''); await refreshComments();
      addToast({title: 'Comment posted', type: 'success'});
    } catch(error) { setCommentError(error instanceof Error ? error.message : 'Comment not saved.'); } finally {setCommentBusy(false);}
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyInput.trim() || !resourceNumber) return;
    try {
      const response = await fetch(`/api/resource-comments/resource/${resourceNumber}`, {
        method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: replyInput.trim(), parentId: Number(parentId.replace('comment-', ''))}),
      });
      if (!response.ok) throw new Error('Reply could not be saved');
      setReplyInput(''); setReplyingToId(null);
      await refreshComments();
      addToast({title: 'Reply posted', type: 'success'});
    } catch { addToast({title: 'Reply not saved', type: 'error'}); }
  };

  const handleToggleLike = async (commentId: string, _isReply = false, _parentId?: string) => {
    try {
      const response = await fetch(`/api/resource-comments/${commentId.replace('comment-', '')}/like`, {
        method: 'POST', credentials: 'include',
      });
      if (!response.ok) throw new Error('Like not saved');
      await refreshComments();
    } catch { addToast({title: 'Could not save like', type: 'error'}); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete your comment?')) return;
    try {
      const response = await fetch(`/api/resource-comments/${commentId.replace('comment-', '')}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!response.ok) throw new Error('Comment not deleted');
      await refreshComments();
      addToast({title: 'Comment deleted', type: 'success'});
    } catch { addToast({title: 'Could not delete comment', type: 'error'}); }
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editInput.trim()) return;
    try {
      const response = await fetch(`/api/resource-comments/${commentId.replace('comment-', '')}`, {
        method: 'PUT', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: editInput.trim()}),
      });
      if (!response.ok) throw new Error('Comment not updated');
      setEditingCommentId(null); setEditInput('');
      await refreshComments();
      addToast({title: 'Comment updated', type: 'success'});
    } catch { addToast({title: 'Could not update comment', type: 'error'}); }
  };

  const handleReportComment = () => {
    addToast({title: 'Use Report Resource', message: 'Comment reports are not yet supported. Use the resource report option for content concerns.', type: 'info'});
  };

  // Sort comments
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (commentSort === 'top') {
        return b.likes - a.likes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments, commentSort]);

  // Render text with @mention and video timestamps highlighted and clickable
  const renderFormattedText = (text: string) => {
    // Splits by @mentions or time tokens like 03:20 or 12:45
    const tokenRegex = /(?<![\w@])(@[a-zA-Z0-9_]+|\b\d{1,3}:\d{2}(?::\d{2})?\b)/g;
    const parts = text.split(tokenRegex);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const member=users.find(u=>u.username.toLowerCase()===part.slice(1).toLowerCase());
        return member ? <Link key={i} to={`/u/${encodeURIComponent(member.username)}`} className="text-[#FF4A00] font-bold hover:underline">{part}</Link> : <span key={i}>{part}</span>;
      }
      if (isVideo && parseDiscussionTime(part) !== null) {
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const sec = parseDiscussionTime(part)!;
              seekToTimestamp(sec);
            }}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#FF4A00] bg-[#FF4A00]/10 hover:bg-[#FF4A00]/25 px-2 py-0.5 rounded-full transition-all cursor-pointer mx-1 align-baseline border border-[#FF4A00]/20"
            title={`Jump video to ${part}`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{part}</span>
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-8 pb-16">
      {(currentUser?.id===resource.author.id||currentUser?.role==='admin')&&<div className="space-y-3"><ResourceDetailsEditor resource={resource}/><ResourcePriceEditor resource={resource}/></div>}
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 overflow-x-auto no-scrollbar">
        <Link to="/" className="hover:text-[#FF4A00] transition-colors whitespace-nowrap">
          Home
        </Link>
        <span>/</span>
        <Link to="/browse" className="hover:text-[#FF4A00] transition-colors whitespace-nowrap">
          Browse
        </Link>
        <span>/</span>
        <Link
          to={`/browse?category=${encodeURIComponent(resource.category)}`}
          className="hover:text-[#FF4A00] transition-colors font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
        >
          {resource.category}
        </Link>
        <span>/</span>
        <span className="truncate max-w-[240px] text-neutral-400 dark:text-neutral-300">{resource.title}</span>
      </nav>

      {/* 2. HEADER: Category Chip, Title, Rating, Uploader Card with Follow */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#FF4A00]/10 text-[#FF4A00] border border-[#FF4A00]/20">
            {resource.category}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {resource.type}
          </span>
          <Badge type={resource.priceType} />

          {/* Originality badge only when actually recorded by the uploader/reviewer */}
          {resource.aiBadge && <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
              (resource.aiBadge || 'Looks original') === 'Looks original'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : resource.aiBadge === 'Needs review'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
            title={resource.aiReviewReason || 'AI original work verification badge'}
          >
            <Sparkles className="w-3 h-3 text-[#FF4A00]" />
            <span>AI: {resource.aiBadge}</span>
          </span>}

          <span className="text-xs text-neutral-400 dark:text-neutral-300">&bull;</span>
          <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300">
            {resource.moduleCode}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-300">&bull;</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-300">
            {resource.academicYear} &bull; {resource.semester}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-neutral-100 leading-tight">
          {resource.title}
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
          {resource.description}
        </p>

        {/* UPLOADER CARD ROW */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E8E2D6] dark:border-neutral-800">
          {/* Author Block */}
          <div className="flex items-center gap-3">
            <Link to={authorCleanHandle ? `/u/${encodeURIComponent(authorCleanHandle)}` : "/browse"}>
              <Avatar
                src={resource.author.avatar}
                name={resource.author.name}
                isVerified={resource.author.isVerified}
                size="md"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={authorCleanHandle ? `/u/${encodeURIComponent(authorCleanHandle)}` : "/browse"}
                  className="font-bold text-sm text-neutral-900 dark:text-neutral-100 hover:text-[#FF4A00] transition-colors"
                >
                  {resource.author.name}
                </Link>
                <span className="text-xs font-mono text-neutral-400 dark:text-neutral-300">
                  {authorCleanHandle ? `@${authorCleanHandle}` : "Uploader"}
                </span>
                {resource.author.isVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Approved Account</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-300">
                {resource.author.university} &bull; {authorFollowers} student followers
              </div>
            </div>

            {/* Never offer a user the option to follow their own resource author profile. */}
            {!isOwnResource && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { void handleFollowToggle(); }}
                disabled={followLoading}
                className={`ml-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700'
                    : 'bg-[#FF4A00] text-white hover:bg-[#e04100] shadow-xs'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Quick Rating & Share Strip */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-900 dark:text-neutral-100">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{resource.rating.toFixed(1)}</span>
              <span className="text-xs text-neutral-400 font-normal dark:text-neutral-300">
                ({resource.reviewCount} peer reviews)
              </span>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {isOwnResource && (resource.id.startsWith('backend-resource-') || resource.id.startsWith('backend-link-')) && (
              <button type="button" onClick={() => { setDeleteError(''); setDeleteFeedback(''); setDeleteConfirmation(''); setShowDeleteResourceModal(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-300 text-rose-700 dark:border-rose-900 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40">
                <Trash2 className="w-3.5 h-3.5" /> Delete my resource
              </button>
            )}

            {/* A user cannot report their own resource. */}
            {!isOwnResource && (
              <button
                onClick={() => setShowAuthorReportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-rose-600" />
                <span>Report: not author&apos;s work</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN LAYOUT: Left (Preview + Tabs), Right (Sticky Purchase Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8 cols): Video Player / PDF Preview + Tabs */}
        <div className="lg:col-span-8 space-y-8">
          {/* CONDITIONAL: VIDEO PLAYER & CHAPTERS OR PDF WATERMARKED CAROUSEL */}
          {isVideo ? (
            <div id="video-player-container" className="space-y-6">
              {/* VIDEO PLAYER & CHAPTERS BENTO CARD */}
              <div className="rounded-[24px] border border-[#E8E2D6] dark:border-neutral-800 bg-neutral-950 text-white overflow-hidden shadow-xl p-4 sm:p-5">
                {/* Video Toolbar */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-neutral-300 font-semibold uppercase tracking-wider dark:text-neutral-300">
                      {resource.ownedVideo?'Creator Video':videoPlatform === 'vimeo' ? 'Vimeo Embed' : 'YouTube Privacy Mode'}
                    </span>
                    <span className="hidden sm:inline text-[11px] font-mono text-neutral-400 dark:text-neutral-300">
                      &bull; {resource.ownedVideo?'EduShare':videoPlatform === 'vimeo' ? 'Vimeo' : 'YouTube'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 font-mono text-neutral-400 text-xs dark:text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-[#FFB31F]" />
                      <span>{resource.duration || 'Not provided'}</span>
                    </span>
                    <button
                      onClick={() => setShowBrokenLinkModal(true)}
                      className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer dark:text-neutral-300"
                      title="Report broken video link"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span className="hidden sm:inline">Report link</span>
                    </button>
                  </div>
                </div>

                {/* Player and Chapters layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* 16:9 EMBEDDED PLAYER CONTAINER */}
                  <div className="lg:col-span-8 flex flex-col justify-center">
                    <div className="relative aspect-video w-full rounded-[20px] overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner group">
                      {resource.ownedVideo ? <ProtectedVideoPlayer id={resource.id.replace('backend-link-','')} allowed={ownedVideoAccess} hasPreview={Boolean(resource.hasVideoPreview)} requestedSeconds={requestedSeekSec} revision={seekRevision} onTime={setCurrentSeekSec} onPlay={()=>setIsPlayingVideo(true)}/> : isPlayingVideo ? (
                        <iframe
                          id="edu-youtube-player"
                          src={videoEmbedUrl}
                          title={resource.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full border-0 rounded-[20px]"
                        />
                      ) : (
                        /* LAZY LOAD THUMBNAIL PLACEHOLDER (protects privacy & performance) */
                        <div
                          onClick={() => {
                            setIsPlayingVideo(true);
                            if (currentSeekSec > 0) {
                              seekToTimestamp(currentSeekSec);
                            }
                          }}
                          className="w-full h-full relative cursor-pointer flex items-center justify-center select-none"
                        >
                          <img
                            src={videoPlatform === 'youtube' ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '/images/hero-illustration.png'}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

                          {/* Big Animated Play Button */}
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#FF4A00] to-[#FFB31F] text-white flex items-center justify-center shadow-2xl ring-4 ring-white/20 transition-all duration-300 group-hover:ring-[#FF4A00]/60"
                            >
                              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white ml-1" />
                            </motion.div>
                            <div className="text-center">
                              <p className="text-xs sm:text-sm font-bold tracking-tight text-white drop-shadow">
                                Play Video
                              </p>
                              <p className="text-[10px] text-neutral-300 drop-shadow dark:text-neutral-300">
                                Hosted by the original creator &bull; Watch on this page
                              </p>
                            </div>
                          </div>

                          {/* Duration badge */}
                          <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold text-white backdrop-blur-xs flex items-center gap-1.5 border border-white/10">
                            <Clock className="w-3 h-3 text-[#FFB31F]" />
                            <span>{resource.duration || 'Not provided'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHAPTERS LIST */}
                  <div className="lg:col-span-4 flex flex-col h-full bg-neutral-900/90 rounded-[20px] border border-neutral-800 p-4 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF4A00]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                          Chapters ({videoChapters.length})
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-300">
                        Interactive
                      </span>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[290px] pr-1 no-scrollbar flex-1">
                      {videoChapters.length === 0 && <p className="text-xs text-neutral-400 p-3 dark:text-neutral-300">No timestamps were provided for this video.</p>}
                      {videoChapters.map((chapter) => {
                        const isActive = activeChapterId === chapter.id;
                        return (
                          <button
                            key={chapter.id}
                            onClick={() => seekToTimestamp(chapter.seconds, chapter.id)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-start gap-2.5 group ${
                              isActive
                                ? 'bg-[#FF4A00]/20 border border-[#FF4A00]/50 text-white shadow-xs'
                                : 'bg-neutral-800/60 hover:bg-neutral-800 border border-transparent text-neutral-300'
                            }`}
                          >
                            <span
                              className={`shrink-0 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                isActive
                                  ? 'bg-[#FF4A00] text-white'
                                  : 'bg-neutral-700/80 text-neutral-300 group-hover:text-white'
                              }`}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{chapter.time}</span>
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`line-clamp-2 leading-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                                {chapter.label}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-300">
                      <span>Click timestamp in comments to seek</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BELOW THE PLAYER: WHAT YOU WILL LEARN, CHIPS, UPLOADER CARD, MARK AS WATCHED */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] dark:border-neutral-800 space-y-6">
                {/* Row of Chips and "Mark as Watched" Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Level Chip */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <Award className="w-3.5 h-3.5" />
                      <span>Level: {resource.difficultyLevel || 'Not specified'}</span>
                    </span>

                    {/* Language Chip */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{resource.language || 'Language not specified'}</span>
                    </span>

                    {/* Module Code Chip */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FF4A00]/10 text-[#FF4A00] border border-[#FF4A00]/20">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{resource.moduleCode}</span>
                    </span>

                    {/* Duration Chip */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{resource.duration || 'Not provided'}</span>
                    </span>
                  </div>

                  {/* "Mark as watched" toggle + Progress badge */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                        isWatched
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {isWatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Watched</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>{progress ? 'In progress' : 'Not watched yet'}</span>
                        </>
                      )}
                    </span>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleToggleWatched}
                      disabled={libraryBusy}
                      title="Mark this video as watched when you finish it."
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isWatched
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90'
                      }`}
                    >
                      {isWatched ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as not finished</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Mark as Watched</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* "What you will learn" Notes */}
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF4A00]" />
                    <span>{resource.learningOutcomes ? 'What you will learn' : 'About this video'}</span>
                  </h3>
                  <div className="p-4 rounded-[18px] bg-[#FFF6E5]/70 dark:bg-neutral-800/60 border border-[#E8E2D6] dark:border-neutral-700/60 space-y-2.5">
                    {learningPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                        <CheckCircle2 className="w-4 h-4 text-[#FF4A00] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Uploader Card with Follow */}
                <div className="p-4 rounded-[18px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={resource.author.avatar} name={resource.author.name} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link to={authorCleanHandle ? `/u/${encodeURIComponent(authorCleanHandle)}` : "/browse"} className="font-bold text-sm text-neutral-900 dark:text-neutral-100 hover:underline">
                          {resource.author.name}
                        </Link>
                        {resource.author.isVerified && (
                          <span title="Verified Peer Contributor">
                            <ShieldCheck className="w-4 h-4 text-[#1E6FEB]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-300">
                        @{authorCleanHandle} &bull; {resource.author.university} &bull; {authorFollowers} followers
                      </p>
                    </div>
                  </div>

                  {!isOwnResource && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { void handleFollowToggle(); }}
                disabled={followLoading}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isFollowing
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                          : 'bg-[#FF4A00] text-white hover:bg-[#e04100] shadow-xs'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow Author</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <>
              {/* Actual uploaded PDF, loaded from authenticated Spring Boot endpoint. */}
              <div className="rounded-[24px] border border-[#E8E2D6] dark:border-neutral-800 bg-neutral-950 text-white overflow-hidden shadow-xl">
                <div className="flex flex-wrap justify-between gap-3 px-5 py-4 border-b border-neutral-800">
                  <span className="inline-flex items-center gap-2 font-semibold text-sm"><FileText className="w-4 h-4 text-[#FF4A00]" />PDF Document Preview</span>
                  {resource.pages > 0 && <span className="text-xs font-mono text-neutral-400 dark:text-neutral-300">{resource.pages} pages</span>}
                </div>
                {uploadedPdfId && missingOriginalPdfId === uploadedPdfId ? (
                  <div className="min-h-[300px] flex items-center justify-center px-6 text-center">
                    <p className="text-sm text-neutral-300 max-w-md dark:text-neutral-300">The original PDF file is missing on this server. Ask the uploader to upload it again; the old demo preview has been removed.</p>
                  </div>
                ) : uploadedPdfId && canViewUploadedPdf ? (
                  <div className="bg-neutral-800 p-2 sm:p-4">
                    <iframe
                      key={`${uploadedPdfId}-${previewPage}`}
                      id="edushare-pdf-preview"
                      src={`/api/resources/${encodeURIComponent(uploadedPdfId)}/preview#page=${previewPage}&toolbar=1&navpanes=0`}
                      title={`Original PDF: ${resource.title}`}
                      className="block w-full rounded-lg border-0 bg-white"
                      style={{ height: 'min(78vh, 800px)', minHeight: 480 }}
                    />
                    <p className="text-xs text-neutral-300 mt-3 text-center dark:text-neutral-300">Use the toolbar to browse and zoom. Available pages depend on your access.</p>
                    <a href={`/api/resources/${encodeURIComponent(uploadedPdfId)}/preview`} target="_blank" rel="noreferrer" className="block text-center text-xs text-amber-300 underline mt-1">Open PDF in a new tab</a>
                  </div>
                ) : uploadedPdfId ? (
                  <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <Lock className="w-10 h-10 text-amber-400" />
                    <h3 className="font-bold text-lg">PDF locked</h3>
                    <p className="text-sm text-neutral-300 max-w-md dark:text-neutral-300">First 3 pages are available as a free preview. Unlock this resource to view the complete PDF.</p>
                    <iframe
                      id="edushare-pdf-preview"
                      title={`First three pages: ${resource.title}`}
                      src={`/api/resources/${encodeURIComponent(uploadedPdfId)}/preview#toolbar=1&navpanes=0`}
                      className="block w-full min-h-[480px] rounded-lg border-0 bg-white"
                    />
                    <button onClick={handleOpenBuyFlow} className="bg-[#FF4A00] rounded-full px-6 py-3 text-sm font-bold">{resource.priceType === 'Premium' ? 'View Premium Plans' : 'Unlock Demo Access'}</button>
                  </div>
                ) : (
                  <div className="min-h-[300px] flex items-center justify-center px-6 text-center">
                    <p className="text-sm text-neutral-300 max-w-md dark:text-neutral-300">No original PDF file is attached to this resource. The previous sample document has been removed. Upload a PDF to enable real previews.</p>
                  </div>
                )}
              </div>

          {uploadedPdfId && canViewUploadedPdf && <PdfStudyTools resourceId={uploadedPdfId} pages={resource.pages||0} canUse={Boolean(isPremiumUser||resource.author.id===currentUser?.id||currentUser?.role==='admin')}/>}

        </>
      )}

          {/* TABS: Overview, Preview/Chapters, Reviews, Comments */}
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D6] dark:border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Overview & Syllabus', icon: Layers },
                {
                  id: 'preview',
                  label: isVideo ? `Video Chapters (${videoChapters.length})` : `PDF Bookmarks (${pdfBookmarks.length})`,
                  icon: isVideo ? Clock : BookOpen,
                },
                { id: 'reviews', label: `Reviews (${resource.reviewCount})`, icon: Star },
                { id: 'comments', label: `Discussion (${comments.length})`, icon: MessageSquare },
              ].filter(tab => tab.id !== 'preview' || isVideo || pdfBookmarks.length > 0).map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-[#FF4A00]'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeResourceTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4A00]"
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT PANELS */}

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                  <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                    About this Study Guide
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {resource.description} Written by top-performing students and verified against current academic faculty curricula. All equations and code segments are formatted for printing and offline tablet reading.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <div>
                      <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Module Code</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{resource.moduleCode}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Faculty</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">Computing & IT</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Level</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{resource.academicYear}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Language</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">English (Technical)</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tab 2: Table of Contents / Video Chapters */}
            {activeTab === 'preview' && (
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                    {isVideo
                      ? `Lecture Timestamps & Chapters (${videoChapters.length} Topics)`
                      : `PDF Bookmarks (${pdfBookmarks.length})`}
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono dark:text-neutral-300">
                    {isVideo ? (resource.duration || 'Not provided') : resource.pages > 0 ? `${resource.pages} Total Pages` : 'Page count unavailable'}
                  </span>
                </div>
                <div className="space-y-2">
                  {isVideo
                    ? videoChapters.map((chapter, idx) => {
                        const isActive = activeChapterId === chapter.id;
                        return (
                          <div
                            key={chapter.id}
                            onClick={() => seekToTimestamp(chapter.seconds, chapter.id)}
                            className={`flex items-center justify-between p-3.5 rounded-[14px] border text-xs cursor-pointer transition-all ${
                              isActive
                                ? 'bg-[#FF4A00]/10 border-[#FF4A00]/40 text-[#FF4A00] font-bold shadow-2xs'
                                : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200/60 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-full font-mono font-bold text-[11px] flex items-center justify-center ${
                                  isActive
                                    ? 'bg-[#FF4A00] text-white'
                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span>{chapter.label}</span>
                            </div>
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-700/60">
                              {chapter.time}
                            </span>
                          </div>
                        );
                      })
                    : pdfBookmarks.map((section, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setPreviewPage(section.page); document.getElementById('edushare-pdf-preview')?.scrollIntoView({behavior:'smooth'}); }}
                          className="cursor-pointer flex items-center justify-between p-3 rounded-[14px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 font-mono font-bold text-[11px] flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {section.title}
                            </span>
                          </div>
                          <span className="font-mono text-neutral-400 text-[11px] dark:text-neutral-300">
                            Pg. {section.page}
                          </span>
                        </div>
                      ))}
                </div>
              </Card>
            )}

            {/* Tab 3: Reviews with Star Distribution */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating & Distribution Breakdown */}
                <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    {/* Big Score */}
                    <div className="text-center sm:text-left space-y-1">
                      <div className="text-4xl sm:text-5xl font-extrabold font-display text-neutral-900 dark:text-neutral-100">
                        {resource.rating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-amber-400 text-sm">
                        {'★'.repeat(Math.round(resource.rating))}
                        <span className="text-neutral-300 dark:text-neutral-700">
                          {'★'.repeat(5 - Math.round(resource.rating))}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-300">
                        Based on {resource.reviews.length} {resource.reviews.length === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>

                    {/* Star Distribution Bars */}
                    <div className="sm:col-span-2 space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = resource.reviews.filter(review => review.rating === star).length;
                        const pct = resource.reviews.length ? Math.round(count * 100 / resource.reviews.length) : 0;
                        return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-7 font-mono font-bold text-neutral-600 dark:text-neutral-400">
                            {star}★
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            />
                          </div>
                          <span className="w-9 text-right font-mono text-neutral-400 dark:text-neutral-300">
                            {pct}%
                          </span>
                        </div>
                      );})}
                    </div>
                  </div>
                  {resource.reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet. Be the first to share your feedback.</p>}

                  {/* Submit Review Form */}
                  {reviewError && <p role="alert" className="text-sm text-red-600">{reviewError}</p>}
                  {(!isOwnResource || editingReviewId) && (!resource.reviews.some(review => review.userId === currentUser?.id) || editingReviewId) ? (
                  <form id="review-editor" onSubmit={handleReviewSubmit} className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                        {editingReviewId ? 'Edit review' : 'Rate & review this resource'}
                      </span>
                      <Rating value={reviewRating} interactive={!reviewBusy} onChange={setReviewRating} size="md" />
                    </div>
                    <textarea
                      value={reviewComment}
                      maxLength={2000}
                      disabled={reviewBusy}
                      aria-label="Your review"
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share how this study guide helped with your coursework or exams..."
                      rows={2}
                      className="w-full p-3 rounded-[14px] border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      {editingReviewId && <Button variant="secondary" size="sm" type="button" disabled={reviewBusy} onClick={() => {setEditingReviewId(null);setReviewComment('');setReviewRating(0);setReviewError('');}}>Cancel Edit</Button>}
                      <Button variant="primary" size="sm" type="submit" disabled={reviewBusy || !reviewComment.trim() || reviewRating < 1}>
                        {reviewBusy ? 'Saving...' : editingReviewId ? 'Save Review' : 'Post Review'}
                      </Button>
                    </div>
                  </form>
                  ) : (
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-300">
                      {isOwnResource ? 'You cannot rate or review your own resource.' : 'You have reviewed this resource. Use Edit or Delete below to manage your review.'}
                    </div>
                  )}
                </Card>

                {/* Review Cards */}
                <div className="space-y-3">
                  {resource.reviews.map((rev) => (
                    <Card key={rev.id} variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={rev.userAvatar} name={rev.userName} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <span>{rev.userName}</span>

                            </div>
                            <div className="text-[11px] text-neutral-400 dark:text-neutral-300">
                              {rev.university} &bull; {rev.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-amber-400 font-bold">
                          {'★'.repeat(rev.rating)}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                      {(rev.userId === currentUser?.id || currentUser?.role === 'admin') && (
                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                          <Button type="button" variant="secondary" size="sm" disabled={reviewBusy} onClick={() => {setEditingReviewId(rev.id);setReviewRating(rev.rating);setReviewComment(rev.comment);setReviewError('');}}>Edit</Button>
                          <Button type="button" variant="secondary" size="sm" disabled={reviewBusy} onClick={() => {setDeletingReviewId(rev.id);setReviewError('');}}>Delete</Button>
                        </div>
                      )}
                      {deletingReviewId === rev.id && <div role="alert" className="rounded-xl border border-neutral-200 p-3 space-y-2">
                        <p className="text-sm">Delete this review? This removes your rating and comment.</p>
                        <div className="flex gap-2"><Button size="sm" disabled={reviewBusy} onClick={handleReviewDelete}>{reviewBusy ? 'Deleting...' : 'Confirm Delete'}</Button><Button type="button" variant="secondary" size="sm" disabled={reviewBusy} onClick={() => setDeletingReviewId(null)}>Cancel</Button></div>
                      </div>}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Comments (Composer, Nested Replies, Likes, Mention Highlight, Sort) */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Comments Header & Sort */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                    Student Discussion & Q&A ({comments.length})
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400 font-semibold dark:text-neutral-300">Sort by:</span>
                    <select
                      value={commentSort}
                      onChange={(e) => setCommentSort(e.target.value as any)}
                      className="px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF4A00]"
                    >
                      <option value="top">Top Comments</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>

                {/* Main Comment Composer */}
                <form onSubmit={handleAddComment} className="p-4 rounded-[20px] bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={currentUser?.avatar || ''}
                      name={currentUser?.name || 'You'}
                      size="sm"
                    />
                    <div className="flex-1 space-y-2">
                      <MentionTextarea
                        users={users}
                        rows={2}
                        value={commentInput}
                        onChange={setCommentInput}
                        placeholder={`Ask a question or tag classmates (e.g. @${authorCleanHandle})...`}
                        className="w-full p-3 rounded-[14px] border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00] resize-none"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-300">
                            Type <strong className="text-[#FF4A00]">@</strong> to choose a member.{isVideo && ' A time like 03:20 means 3 minutes 20 seconds.'}
                          </span>
                          {isVideo && (
                            <button
                              type="button"
                              onClick={() => {
                                const t = formatSecondsToTime(currentSeekSec);
                                setCommentInput((prev) => (prev ? `${prev} ${t}` : t));
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#FF4A00] bg-[#FF4A00]/10 hover:bg-[#FF4A00]/20 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer border border-[#FF4A00]/20"
                              title="Insert current playback timestamp into comment"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Add playback time ({formatSecondsToTime(currentSeekSec)})</span>
                            </button>
                          )}
                        </div>
                        <Button variant="primary" size="sm" type="submit" disabled={commentBusy || !commentInput.trim()}>
                          <Send className="w-3.5 h-3.5 mr-1" />
                          <span>{commentBusy ? 'Posting…' : 'Post Comment'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>

                {isVideo && <div className="flex flex-wrap items-center gap-2 text-sm"><label htmlFor="discussion-time">Add a video time:</label><input id="discussion-time" value={manualTime} onChange={e=>setManualTime(e.target.value)} placeholder="03:20" className="border rounded-lg p-2 w-28 bg-white text-neutral-900"/><button type="button" onClick={()=>{const seconds=parseDiscussionTime(manualTime); if(seconds===null){setCommentError('Use minutes:seconds (03:20) or hours:minutes:seconds.');return;} setCommentInput(v=>`${v}${v?' ':''}${formatDiscussionTime(seconds)}`);setManualTime('');setCommentError('');}} className="rounded-lg border px-3 py-2">Insert time</button><span className="text-neutral-500 dark:text-neutral-300">Click a posted time to jump to that point in the video.</span></div>}
                {commentError && <p role="alert" className="text-red-600 dark:text-red-300">{commentError}</p>}
                {/* Comments List with Nested Replies */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {sortedComments.map((comment) => {
                      const isMyComment = currentUser && comment.authorId === currentUser.id;
                      const isEditing = editingCommentId === comment.id;

                      return (
                        <motion.div
                          key={comment.id}
                          id={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-5 rounded-[20px] bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 space-y-3 shadow-2xs"
                        >
                          {/* Comment Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Avatar src={comment.authorAvatar} name={comment.authorName} size="sm" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                                    {comment.authorName}
                                  </span>
                                  <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-300">
                                    @{comment.authorUsername}
                                  </span>
                                  {comment.isVerified && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-300">
                                  {comment.university} &bull; {commentDate(comment.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Actions / Report menu */}
                            <div className="flex items-center gap-1">
                              {isMyComment && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditInput(comment.content);
                                    }}
                                    className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors dark:text-neutral-300"
                                    title="Edit Comment"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors dark:text-neutral-300"
                                    title="Delete Comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={handleReportComment}
                                className="p-1.5 text-neutral-400 hover:text-amber-600 transition-colors dark:text-neutral-300"
                                title="Report to Moderator"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Comment Content / Edit Mode */}
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-[#FF4A00] resize-none"
                              />
                              <div className="flex gap-2">
                                <Button variant="primary" size="sm" onClick={() => handleSaveEditComment(comment.id)}>
                                  Save Edits
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => setEditingCommentId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                              {renderFormattedText(comment.content)}
                            </p>
                          )}

                          {/* Comment Footer: Like button & Reply trigger */}
                          <div className="flex items-center gap-4 pt-1 text-xs">
                            <button
                              onClick={() => handleToggleLike(comment.id)}
                              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                                comment.likedByMe ? 'text-[#FF4A00] font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${comment.likedByMe ? 'fill-[#FF4A00]' : ''}`} />
                              <span>{comment.likes}</span>
                            </button>

                            <button
                              onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                              className="text-neutral-500 hover:text-[#FF4A00] font-semibold transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>

                          {/* Nested Reply Composer */}
                          {replyingToId === comment.id && (
                            <div className="mt-3 pl-4 border-l-2 border-[#FF4A00]/40 space-y-2">
                              <MentionTextarea
                                users={users}
                                rows={2}
                                value={replyInput}
                                onChange={setReplyInput}
                                placeholder={`Replying to @${comment.authorUsername}...`}
                                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-[#FF4A00] resize-none"
                              />
                              <div className="flex gap-2">
                                <Button variant="primary" size="sm" onClick={() => handleAddReply(comment.id)}>
                                  Post Reply
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => setReplyingToId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Nested Replies List */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 sm:pl-6 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-3 pt-1">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Avatar src={reply.authorAvatar} name={reply.authorName} size="sm" />
                                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                        {reply.authorName}
                                      </span>
                                      <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-300">
                                        @{reply.authorUsername}
                                      </span>
                                      <span className="text-[10px] text-neutral-400 dark:text-neutral-300">&bull; {commentDate(reply.createdAt)}</span>
                                    </div>
                                    <button
                                      onClick={() => handleToggleLike(reply.id, true, comment.id)}
                                      className={`flex items-center gap-1 ${
                                        reply.likedByMe ? 'text-[#FF4A00] font-bold' : 'text-neutral-400 hover:text-neutral-600'
                                      }`}
                                    >
                                      <Heart className={`w-3 h-3 ${reply.likedByMe ? 'fill-[#FF4A00]' : ''}`} />
                                      <span>{reply.likes}</span>
                                    </button>
                                  </div>
                                  <p className="text-neutral-700 dark:text-neutral-300 pl-6 leading-relaxed">
                                    {renderFormattedText(reply.content)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Sticky Video Action Card or PDF Purchase Card */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {isVideo ? (
            <Card
              variant={resource.priceType === 'Premium' ? 'peach' : 'white'}
              hoverable={false}
              className="border-[#E8E2D6] dark:border-neutral-800 shadow-md p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <Badge type={resource.priceType} />
                <span className="text-xs text-neutral-500 font-medium dark:text-neutral-300">
                  {resource.downloads} student views
                </span>
              </div>

              {/* Video Title & Pricing */}
              <div>
                <div className="flex items-baseline gap-1 font-display">
                  <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                    {resource.priceType === 'Paid'?`Rs. ${resource.price.toLocaleString()}`:resource.priceType === 'Free' ? 'Free Resource' : 'Premium Video'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold font-display text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {resource.ownedVideo?(resource.priceType==='Paid'?'Single video purchase':resource.priceType==='Premium'?'Included with Premium':'Creator video'):'Public Learning Link'}
                </h3>

                {/* REQUIRED MANDATORY NOTICE */}
                <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{resource.ownedVideo?'Creator Video':'Curated Educational Link'}</span>
                  </div>
                  <p className="leading-relaxed text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                    {resource.ownedVideo?`Creator: ${resource.originalCreator||resource.author.name}. Shared under an ownership or permission declaration.`: 'Video belongs to its original creator. EduShare only shares the link.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Action: Stream */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md text-sm font-bold"
                  onClick={() => {
                    if(resource.ownedVideo){if(!hasAccess){handleOpenBuyFlow();return;}setIsPlayingVideo(true);document.getElementById('video-player-container')?.scrollIntoView({behavior:'smooth'});return;}
                    if (!videoId && resource.videoUrl) { window.open(resource.videoUrl, '_blank', 'noopener,noreferrer'); return; }
                    if (!videoId) { addToast({ title: 'Video link missing', message: 'The original video URL was not saved.', type: 'error' }); return; }
                    setIsPlayingVideo(true);
                    const el = document.getElementById('video-player-container');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  <span>{resource.ownedVideo&&!hasAccess?(resource.priceType==='Premium'?'View Premium Plans':resource.priceType==='Paid'?'Unlock Demo Access':'Check Video Access'):isPlayingVideo ? 'Playing Lecture Now' : 'Watch Video'}</span>
                </Button>

                {/* Save to Collection Button */}
                <button
                  onClick={() => setShowSaveCollectionModal(true)}
                  className="w-full py-2.5 rounded-full text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#1E6FEB]" />
                  <span>Save to Collection</span>
                </button>

                {/* Bookmark Button */}
                <button
                  onClick={() => toggleBookmark(resource.id)}
                  className={`w-full py-2.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    bookmarked
                      ? 'border-[#FF4A00] bg-[#FF4A00]/10 text-[#FF4A00]'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#FF4A00]' : ''}`} />
                  <span>{bookmarked ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
                </button>
                {bookmarked&&<Link to="/profile?tab=wishlist" className="block text-center text-xs text-[#FF4A00] underline">View my wishlist</Link>}

                {/* Share Button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-2.5 rounded-full text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Video Link</span>
                </button>

                {/* Report Broken Link Action */}
                <button
                  onClick={() => setShowBrokenLinkModal(true)}
                  className="w-full py-2 rounded-full text-[11px] font-medium text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Report broken or private link</span>
                </button>
              </div>

              {/* Video Specs List */}
              <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Platform:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 uppercase">
                    {videoPlatform}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration:</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">
                    {resource.duration || 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Chapters:</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">
                    {videoChapters.length} Timestamped Topics
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Module Code:</span>
                  <span className="font-mono font-bold text-[#FF4A00]">
                    {resource.moduleCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Difficulty:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {resource.difficultyLevel || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Language:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {resource.language || 'Language not specified'}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card
              variant={resource.priceType === 'Premium' ? 'peach' : 'white'}
              hoverable={false}
              className="border-[#E8E2D6] dark:border-neutral-800 shadow-md p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <Badge type={resource.priceType} />
                <span className="text-xs text-neutral-500 font-medium dark:text-neutral-300">
                  {resource.id.startsWith('backend-resource-') ? 'PDF document' : `${resource.downloads} student downloads`}
                </span>
              </div>

              {/* Price display */}
              <div>
                <div className="flex items-baseline gap-1.5 font-display">
                  <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                    {resource.priceType === 'Free' ? 'Free Access' : resource.priceType === 'Premium' ? 'Scholar Pass' : 'Rs.'}
                  </span>

                  {/* Strikethrough base price for paid PDF if Premium user discount applies */}
                  {resource.priceType === 'Paid' && isPremiumUser && pdfPriceInfo.isDiscounted && (
                    <span className="text-xl font-bold line-through text-neutral-400 mr-1 dark:text-neutral-300">
                      {resource.price}
                    </span>
                  )}

                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {resource.priceType === 'Free'
                      ? '0'
                      : isPremiumUser && resource.priceType === 'Paid'
                      ? pdfPriceInfo.price
                      : resource.priceType === 'Premium' ? 'Included' : resource.price}
                  </span>
                  {resource.priceType === 'Premium' && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-300">/ or included in pass</span>
                  )}
                </div>

                {/* Discount line for Premium users (15% off) */}
                {resource.priceType === 'Paid' && (
                  <div className="mt-1.5 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFB31F]" />
                    <span>
                      {isPremiumUser
                        ? `EduShare Premium Member: 15% discount applied (Save Rs. ${pdfPriceInfo.discount})!`
                        : `EduShare Premium Members pay Rs. ${Math.round(resource.price * 0.85)} (15% OFF)`}
                    </span>
                  </div>
                )}

                <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-300">
                  {hasAccess
                    ? '✓ Complete unrestricted PDF unlocked in your library.'
                    : resource.priceType === 'Free'
                    ? 'Free download contributed by student community.'
                    : resource.priceType === 'Premium' ? 'Active Scholar Pass required for full PDF access.' : 'Preview 3 pages free; demo checkout unlocks the full PDF.'}
                </p>
              </div>

              {/* Main Action Button */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md text-sm font-bold"
                  onClick={()=>{
                    if(isArticle){try{const url=new URL(resource.externalUrl||'');if(url.protocol!=='https:'||url.username||url.password)throw new Error();window.open(url.href,'_blank','noopener,noreferrer');}catch{addToast({title:'Original article unavailable',message:'Please report this link so it can be checked.',type:'error'});}return;}
                    handleOpenBuyFlow();
                  }}
                  disabled={isDownloading}
                >
                  {isArticle?<ExternalLink className="w-4 h-4 mr-2"/>:<Download className="w-4 h-4 mr-2"/>}
                  <span>
                    {isArticle
                      ? 'Open original article'
                      : hasAccess
                      ? 'Download Original PDF'
                      : resource.priceType === 'Free'
                      ? 'Download Free (PDF)'
                      : resource.priceType === 'Premium' && !isPremiumUser
                      ? 'Upgrade to Unlock'
                      : `Buy for Rs. ${pdfPriceInfo.price}`}
                  </span>
                </Button>

                <button type="button" onClick={()=>setShowSaveCollectionModal(true)} className="w-full py-2.5 rounded-full text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1.5"><FolderPlus className="w-3.5 h-3.5"/>Save to Collection</button>
                <button
                  onClick={() => toggleBookmark(resource.id)}
                  className={`w-full py-2.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    bookmarked
                      ? 'border-[#FF4A00] bg-[#FF4A00]/10 text-[#FF4A00]'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#FF4A00]' : ''}`} />
                  <span>{bookmarked ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
                </button>
                {bookmarked&&<Link to="/profile?tab=wishlist" className="block text-center text-xs text-[#FF4A00] underline">View my wishlist</Link>}

                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-2.5 rounded-full text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share with Classmates</span>
                </button>
              </div>

              {/* Document Details Specs List */}
              <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Total Pages:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {resource.pages > 0 ? `${resource.pages} pages` : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>File Size:</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">
                    {resource.fileSize || 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Module Code:</span>
                  <span className="font-mono font-bold text-[#FF4A00]">
                    {resource.moduleCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Academic Year:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {resource.academicYear} ({resource.semester})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Language:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    English (Sri Lanka IT Syllabus)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Format:</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">
                    {resource.fileFormat} (Watermarked)
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Guarantee Box */}
          <div className="p-5 rounded-[20px] bg-neutral-100/70 dark:bg-neutral-800/50 border border-[#E8E2D6] dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>EduShare Integrity Promise</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Verified malware-free, formatted to current semester university syllabus, with 85% of royalties going directly to verified student creators.
            </p>
          </div>
        </div>
      </div>

      {/* 4. RELATED RESOURCES ROW */}
      <div className="pt-8 border-t border-[#E8E2D6] dark:border-neutral-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
              Related {resource.category} Resources
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Other recommended notes and exam question papers from the same IT faculty
            </p>
          </div>
          <Link to={`/browse?category=${encodeURIComponent(resource.category)}`} className="text-xs font-bold text-[#FF4A00] hover:underline">
            View all {resource.category} guides &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {relatedResources.map((rel) => (
            <Card key={rel.id} variant="white" className="p-5 border-[#E8E2D6] space-y-3">
              <div className="flex items-center justify-between">
                <Tag variant="peach" className="text-[10px] py-0.5">
                  {rel.category}
                </Tag>
                <Badge type={rel.priceType} size="sm" />
              </div>
              <Link to={`/resource/${rel.id}`} className="block hover:text-[#FF4A00] transition-colors">
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-display line-clamp-2">
                  {rel.title}
                </h4>
              </Link>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-300">
                <span>{rel.author.name}</span>
                <span className="font-mono text-xs">{rel.rating}★ ({rel.downloads})</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. DEMO CHECKOUT MODAL (3 STEPS) */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title={
          checkoutStep === 1
            ? 'Step 1 of 3: Order Summary'
            : checkoutStep === 2
            ? 'Step 2 of 3: Secure Card Payment'
            : 'Payment Confirmed!'
        }
        description={
          checkoutStep === 1
            ? 'Review your study resource purchase before payment.'
            : checkoutStep === 2
            ? 'Demo student card simulator (no actual charges applied).'
            : 'Your guide is unlocked and available in your permanent library.'
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* STEP 1: ORDER SUMMARY */}
          {checkoutStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-[16px] bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100">
                  <span>{resource.title}</span>
                  <span>Rs. {resource.price}</span>
                </div>
                <div className="flex justify-between text-neutral-500 dark:text-neutral-300">
                  <span>Author:</span>
                  <span>{resource.author.name}</span>
                </div>
                {isPremiumUser && pdfPriceInfo.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>EduShare Premium Member Discount (15%):</span>
                    <span>- Rs. {pdfPriceInfo.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500 dark:text-neutral-300">
                  <span>Platform Fee (EduShare Zero-Fee):</span>
                  <span className="text-emerald-600 font-bold">Rs. 0</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                  <span>Total Amount Due:</span>
                  <span className="text-[#FF4A00]">Rs. {pdfPriceInfo.price}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Student voucher or coupon code..."
                  className="flex-1 px-3.5 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-[#FF4A00]"
                />
                <Button variant="secondary" size="sm" type="button">
                  Apply
                </Button>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button variant="primary" size="md" className="w-full" onClick={handleProceedToPayment}>
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button variant="secondary" size="md" onClick={() => setShowCheckoutModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: FAKE CARD FORM */}
          {checkoutStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-300">
                <span className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                  <CreditCard className="w-4 h-4 text-[#FF4A00]" />
                  <span>Card Simulation</span>
                </span>
                <span className="text-emerald-600 font-mono text-[11px]">256-Bit SSL Demo</span>
              </div>

              <Input
                label="Cardholder Name"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Full name"
              />

              <Input
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4111 2222 3333 4444"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expires"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
                <Input
                  label="CVC"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="789"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={isProcessingPayment}
                  onClick={handleSimulatePayment}
                >
                  {isProcessingPayment ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <span>Pay Rs. {resource.price} &rarr;</span>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  disabled={isProcessingPayment}
                  onClick={() => setCheckoutStep(1)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS WITH CHECK ANIMATION & DOWNLOAD BUTTON */}
          {checkoutStep === 3 && (
            <div className="space-y-5 text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 stroke-[2.3]" />
              </motion.div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold font-display text-neutral-900 dark:text-neutral-100">
                  Demo access unlocked!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-300">
                  Demo checkout total: Rs. {pdfPriceInfo.price} · No money charged
                </p>
                <p className="text-xs text-emerald-600 font-semibold pt-1">
                  {resource.ownedVideo?'Full video access has been unlocked for this demo account.':'Original uploaded PDF has been unlocked for this demo account.'}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-lg"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    if(resource.ownedVideo){setIsPlayingVideo(true);document.getElementById('video-player-container')?.scrollIntoView({behavior:'smooth'});return;}
                    void downloadActualPdf();
                  }}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>{resource.ownedVideo?'Watch full video':isDownloading ? 'Preparing PDF…' : 'Download Original PDF'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 6. SHARE POPOVER MODAL (Copy Link, WhatsApp, Telegram, FB, X, QR Code) */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Study Resource"
        description="Recommend this guide to your university batch or peer study groups."
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Quick Copy URL */}
          <div className="flex items-center gap-2 p-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
            <span className="flex-1 text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate pl-3">
              {window.location.href}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-4 py-1.5 rounded-full bg-[#FF4A00] text-white text-xs font-bold hover:bg-[#e04100] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Video Specific: Copy at Current Timestamp */}
          {isVideo && (
            <div className="p-3.5 rounded-2xl bg-[#FFF6E5] dark:bg-neutral-800/80 border border-[#E8E2D6] dark:border-neutral-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF4A00]" />
                  <span>Share at timestamp ({formatSecondsToTime(currentSeekSec)})</span>
                </span>
                <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-300">
                  ?t={currentSeekSec}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate pl-2">
                  {`${window.location.origin}/resource/${resource.id}?t=${currentSeekSec}`}
                </span>
                <button
                  onClick={handleCopyTimestampLink}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedTimestampLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTimestampLink ? 'Copied' : 'Copy at Time'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Social Platform Share Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">
              Share directly to:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this ${resource.title} on EduShare: ${window.location.origin}/resource/${resource.id}${isVideo && currentSeekSec > 0 ? `?t=${currentSeekSec}` : ''}`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
              >
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/resource/${resource.id}${isVideo && currentSeekSec > 0 ? `?t=${currentSeekSec}` : ''}`)}&text=${encodeURIComponent(resource.title)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-xs font-bold flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
              >
                <span>Telegram</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Studying ${resource.title} on EduShare: ${window.location.origin}/resource/${resource.id}${isVideo && currentSeekSec > 0 ? `?t=${currentSeekSec}` : ''}`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
              >
                <span>X (Twitter)</span>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/resource/${resource.id}${isVideo && currentSeekSec > 0 ? `?t=${currentSeekSec}` : ''}`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
              >
                <span>Facebook</span>
              </a>
            </div>
          </div>

          {/* QR Code Block */}
          <div className="p-4 rounded-[20px] bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center gap-4">
            {/* Styled SVG QR Code */}
            <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-xs border border-neutral-200 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-900 dark:text-neutral-100" fill="currentColor">
                {/* 3 Corner Finder Patterns */}
                <rect x="0" y="0" width="30" height="30" rx="4" fill="#FF4A00" />
                <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
                <rect x="10" y="10" width="10" height="10" rx="1" fill="#FF4A00" />

                <rect x="70" y="0" width="30" height="30" rx="4" fill="#1E6FEB" />
                <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
                <rect x="80" y="10" width="10" height="10" rx="1" fill="#1E6FEB" />

                <rect x="0" y="70" width="30" height="30" rx="4" fill="#FFB31F" />
                <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
                <rect x="10" y="80" width="10" height="10" rx="1" fill="#FFB31F" />

                {/* QR Data Grid Matrix */}
                <rect x="36" y="6" width="6" height="6" />
                <rect x="48" y="6" width="6" height="6" />
                <rect x="58" y="12" width="6" height="6" />
                <rect x="36" y="24" width="6" height="6" />
                <rect x="48" y="24" width="6" height="6" />
                <rect x="6" y="36" width="6" height="6" />
                <rect x="18" y="36" width="6" height="6" />
                <rect x="36" y="36" width="12" height="12" fill="#FF4A00" />
                <rect x="54" y="36" width="6" height="6" />
                <rect x="66" y="36" width="6" height="6" />
                <rect x="78" y="36" width="6" height="6" />
                <rect x="88" y="36" width="6" height="6" />
                <rect x="36" y="54" width="6" height="6" />
                <rect x="48" y="54" width="6" height="6" />
                <rect x="60" y="54" width="6" height="6" />
                <rect x="72" y="54" width="6" height="6" />
                <rect x="36" y="72" width="6" height="6" />
                <rect x="48" y="72" width="6" height="6" />
                <rect x="66" y="72" width="12" height="12" />
                <rect x="84" y="72" width="6" height="6" />
                <rect x="36" y="88" width="6" height="6" />
                <rect x="54" y="88" width="6" height="6" />
              </svg>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#FF4A00]" />
                <span>Scan with Mobile Camera</span>
              </h5>
              <p className="text-[11px] text-neutral-500 leading-snug dark:text-neutral-300">
                {isVideo
                  ? 'Instantly opens this lecture stream on your phone or tablet.'
                  : 'Instantly opens this guide on your phone or tablet for mobile reading.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteResourceModal} onClose={() => { if (!deletingResource) setShowDeleteResourceModal(false); }}
        title="Delete your published resource" description="Please share your feedback before permanently removing this resource from the catalog." maxWidth="md">
        <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <p className="font-semibold">{resource.title}</p>
            <p className="mt-1 text-xs">Other students will no longer be able to view or download this resource. This cannot be undone from the dashboard.</p>
          </div>
          <label className="block font-semibold">Reason for deletion
            <select value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
              <option>Uploaded the wrong document</option><option>Outdated or inaccurate content</option>
              <option>Copyright or ownership concern</option><option>Duplicate upload</option><option>Other reason</option>
            </select>
          </label>
          <label className="block font-semibold">Feedback (required)
            <textarea rows={3} value={deleteFeedback} maxLength={1000}
              onChange={(event) => setDeleteFeedback(event.target.value)}
              placeholder="Explain why you're removing this upload (at least 10 characters)."
              className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
          </label>
          <label className="block font-semibold">Type DELETE to confirm
            <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder="DELETE" autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
          </label>
          {deleteError && <p role="alert" className="font-semibold text-rose-600 dark:text-rose-300">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" disabled={deletingResource} onClick={() => setShowDeleteResourceModal(false)} className="rounded-full border border-neutral-300 px-5 py-2.5 font-semibold dark:border-neutral-700">Cancel</button>
            <button type="button" onClick={confirmOwnerDeletion}
              disabled={deletingResource || deleteFeedback.trim().length < 10 || deleteConfirmation !== 'DELETE'}
              className="rounded-full bg-rose-600 px-5 py-2.5 font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
              {deletingResource ? 'Deleting...' : 'Submit feedback & delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 7. SAVE TO COLLECTION MODAL */}
      <Modal
        isOpen={showSaveCollectionModal}
        onClose={() => setShowSaveCollectionModal(false)}
        title="Save to Collection"
        description="Organize your lectures and study guides into personalized revision folders."
        maxWidth="md"
      >
        <div className="space-y-4">
          {libraryActionError && <p role="alert" className="text-red-600 dark:text-red-300">{libraryActionError}</p>}
          {!userCollections.length && <p className="text-sm text-neutral-500 dark:text-neutral-300">Create a collection below to organise your saved resources.</p>}
          <div className="space-y-2">
            {userCollections.map((col) => (
              <div
                key={col.id}
                role="button" tabIndex={0} aria-disabled={libraryBusy}
                onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();void handleToggleSaveToCollection(col.id);}}}
                onClick={() => void handleToggleSaveToCollection(col.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  col.hasItem
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 dark:bg-[#FF4A00]/10'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: `${col.color}20`, color: col.color }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {col.name}
                    </h5>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-300">
                      {col.count} saved study resources
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                    col.hasItem
                      ? 'bg-[#FF4A00] border-[#FF4A00] text-white'
                      : 'border-neutral-300 dark:border-neutral-700 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          <Link to="/profile?tab=collections" onClick={()=>setShowSaveCollectionModal(false)} className="inline-block text-sm text-[#FF4A00] underline">View my collections</Link>
          {/* Create New Collection Inline Input */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">
              Create New Folder
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                maxLength={80}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCollection();
                  }
                }}
                placeholder="e.g. Distributed Systems Finals..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCollection}
                disabled={libraryBusy||!newCollectionName.trim()}
              >
                Create
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowSaveCollectionModal(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. REPORT BROKEN LINK MODAL */}
      <Modal
        isOpen={showBrokenLinkModal}
        onClose={() => setShowBrokenLinkModal(false)}
        title="Report Broken Video Link"
        description="Help maintain EduShare quality by notifying student moderators of broken, private, or restricted embeds."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">
              Select Issue
            </label>
            {[
              'Video has been made private, unlisted, or deleted on YouTube',
              'Copyright takedown or geo-blocking in Sri Lanka',
              'Audio is muted or heavily distorted',
              'Video content does not match the module syllabus or title',
              'Other playback error',
            ].map((reason) => (
              <label
                key={reason}
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  brokenLinkReason === reason
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="brokenReason"
                  checked={brokenLinkReason === reason}
                  onChange={() => setBrokenLinkReason(reason)}
                  className="mt-0.5 text-[#FF4A00] focus:ring-[#FF4A00]"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              value={brokenLinkNote}
              onChange={(e) => setBrokenLinkNote(e.target.value)}
              placeholder="e.g. YouTube player displays error code 150 on playback..."
              className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-[#FF4A00] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBrokenLinkModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitBrokenLinkReport}
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </Modal>

      {myEvidenceRequests.filter(r=>r.status==='needs_evidence' &&
        (r.resourceId === (id?.startsWith('backend-link-') ? -Number(id.slice(13)) : Number(id?.replace('backend-resource-', ''))))).map(report=>(
        <section key={report.id} className="my-4 p-4 rounded-xl border border-amber-300 bg-amber-50 text-neutral-900 space-y-3">
          <h3 className="font-bold text-sm">Administrator requested more evidence for your report</h3>
          <p className="text-xs">{report.targetTitle}</p>
          {replyEvidenceId===report.id ? <>
            <input type="url" value={replyEvidenceUrl} onChange={e=>setReplyEvidenceUrl(e.target.value)}
              placeholder="Original source or evidence URL (optional)" className="w-full rounded-lg border p-2 text-sm" />
            <textarea maxLength={1200} value={replyEvidenceDetails} onChange={e=>setReplyEvidenceDetails(e.target.value)}
              placeholder="What additional evidence supports your report?" rows={3} className="w-full rounded-lg border p-2 text-sm" />
            <button type="button" disabled={evidenceSaving} onClick={()=>void sendAdditionalEvidence(report.id)}
              className="rounded-full bg-[#273778] text-white px-4 py-2 text-xs font-bold disabled:opacity-50">Submit Evidence</button>
          </> : <button type="button" onClick={()=>setReplyEvidenceId(report.id)} className="rounded-full bg-amber-600 text-white px-4 py-2 text-xs font-bold">Provide Evidence</button>}
        </section>
      ))}

      {/* MODAL: REPORT NOT AUTHOR'S WORK */}
      <Modal
        isOpen={showAuthorReportModal}
        onClose={() => setShowAuthorReportModal(false)}
        title="Report: Not the Author's Work"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
            <strong>Copyright & Attribution Protection:</strong>
            <p className="mt-0.5">
              EduShare enforces zero-tolerance for uncredited official materials or stolen notes. Reports are investigated by administrators. Submission does not automatically remove a resource.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
              Select Violation Reason
            </label>
            {[
              'Missing original creator attribution',
              'Misleading or incorrect ownership claim',
              'Official university exam paper (should be Free-only)',
              'Official lecture slides / textbook / e-book excerpt',
              'Plagiarized notes from another author',
              'Copyright violation or confidential exam leak',
            ].map((reason) => (
              <label
                key={reason}
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  authorReportReason === reason
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <input
                  type="radio"
                  name="authorReportReasonRadio"
                  checked={authorReportReason === reason}
                  onChange={() => setAuthorReportReason(reason)}
                  className="mt-0.5 text-[#FF4A00] focus:ring-[#FF4A00]"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="copyright-source-url" className="text-xs font-bold block">Evidence URL (optional)</label>
            <input id="copyright-source-url" type="url" maxLength={700} value={reportEvidenceUrl}
              onChange={e=>setReportEvidenceUrl(e.target.value)} placeholder="https://original-source.example/..."
              className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
            <label htmlFor="copyright-evidence-note" className="text-xs font-bold block">Evidence details (optional)</label>
            <textarea id="copyright-evidence-note" rows={3} maxLength={1200} value={reportEvidenceDetails}
              onChange={e=>setReportEvidenceDetails(e.target.value)} placeholder="Explain why you believe this content needs review..."
              className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAuthorReportModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                reportResource(resource.id, authorReportReason, reportEvidenceUrl.trim(), reportEvidenceDetails.trim());
                setShowAuthorReportModal(false);
                setReportEvidenceUrl('');setReportEvidenceDetails('');
              }}
            >
              Submit Integrity Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
