import { WrittenReviewCard } from '../components/WrittenReviewCard';
import {ProfilePhotoEditor} from '../components/ProfilePhotoEditor';
import {ProfileStudyLibrary} from '../components/ProfileStudyLibrary';
import { ProfileStatsPanel } from '../components/ProfileStatsPanel.tsx';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  CheckCircle,
  CheckCheck,
  Rocket,
  HeartHandshake,
  Award,
  ShieldCheck,
  Sparkles,
  Share2,
  ExternalLink,
  Github,
  Linkedin,
  Edit3,
  Sliders,
  Download,
  Bookmark,
  BookOpen,
  User as UserIcon,
  Mail,
  Lock,
  Trash2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Globe,
  Bell,
  X,
  Plus,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Building,
  Calendar,
  Layers,
  Star,
  FileText,
  AlertTriangle,
  LogOut,
  Smile,
  Clock,
  Upload,
} from 'lucide-react';
import { useApp, mapBackendUser } from '../context/AppContext.tsx';
import { useStudentFollow } from '../hooks/useStudentFollow.ts';
import { User, Resource } from '../data/models.ts';
import { Avatar } from '../components/shared/Avatar.tsx';
import { Card } from '../components/shared/Card.tsx';
import { Button } from '../components/Button.tsx';
import { Badge } from '../components/shared/Badge.tsx';
import { Tag } from '../components/Tag.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { Input } from '../components/shared/Input.tsx';
import { PLANS_CONFIG, STUDENT_DISCOUNT } from '../data/plansConfig.ts';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const [profileParams]=useSearchParams();
  const navigate = useNavigate();
  const {
    currentUser,
    users,
    resources,
    bookmarks,
    savedCollections,watchProgress,personalLibraryError,personalLibraryLoading,refreshPersonalLibrary,
    purchasedResources,
    updateUserProfile,
    deleteUserAccount,
    addResource,
    deleteOwnedResource,
    addToast,
    toggleBookmark,
    downloadOrPurchaseResource,
  } = useApp();

  const [fetchedProfile, setFetchedProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(username));
  useEffect(() => {
    if (!username) { setFetchedProfile(null); setProfileLoading(false); return; }
    if (currentUser && (currentUser.username.toLowerCase() === username.toLowerCase() || currentUser.id === username)) {
      setFetchedProfile(currentUser); setProfileLoading(false); return;
    }
    const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (found) { setFetchedProfile(found); setProfileLoading(false); return; }
    let active = true;
    setProfileLoading(true);
    fetch(`/api/users/profile/${encodeURIComponent(username)}`, { credentials: 'include', cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((record) => { if (active) setFetchedProfile(record ? mapBackendUser(record) : null); })
      .catch(() => { if (active) setFetchedProfile(null); })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [username, currentUser?.id, currentUser?.username, users]);

  // Determine target user
  const targetUser: User | null = useMemo(() => {
    if (!username) return currentUser;
    if (currentUser && (currentUser.username.toLowerCase() === username.toLowerCase() || currentUser.id === username)) return currentUser;
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase() || u.id === username) || fetchedProfile;
  }, [username, users, currentUser, fetchedProfile]);

  const isOwnProfile = Boolean(
    currentUser && targetUser && currentUser.id === targetUser.id
  );

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>(()=>{const tab=profileParams.get('tab');return tab==='wishlist'?'bookmarks':tab==='collections'||tab==='history'||tab==='reviews'?tab:'uploads';});

  // Modals state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [resourceDeleteReason, setResourceDeleteReason] = useState('Uploaded the wrong document');
  const [resourceDeleteFeedback, setResourceDeleteFeedback] = useState('');
  const [resourceDeleteConfirmation, setResourceDeleteConfirmation] = useState('');
  const [resourceDeleting, setResourceDeleting] = useState(false);
  const [resourceDeleteError, setResourceDeleteError] = useState('');
  const closeResourceDelete = () => { if (!resourceDeleting) { setResourceToDelete(null); setResourceDeleteError(''); } };
  const submitResourceDelete = async () => {
    if (!resourceToDelete || resourceDeleting) return;
    setResourceDeleting(true); setResourceDeleteError('');
    try {
      await deleteOwnedResource(resourceToDelete.id, resourceDeleteReason, resourceDeleteFeedback, resourceDeleteConfirmation);
      setResourceToDelete(null); setResourceDeleteFeedback(''); setResourceDeleteConfirmation('');
      addToast({ title: 'Resource removed', message: 'Your feedback has been submitted and the resource removed from EduShare.', type: 'success' });
    } catch (error) {
      setResourceDeleteError(error instanceof Error ? error.message : 'Unable to delete resource. Please try again.');
    } finally { setResourceDeleting(false); }
  };
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);



  // Cover pattern preset options
  const coverPresets = [
    { id: 'peach-geometric', name: 'Peach Sunset Curve', bg: 'bg-[#FDE7E0]', bgHex: '#FDE7E0', primary: '#FF4A00', secondary: '#FFB31F', accent: 'from-[#FF4A00] to-[#FFB31F]', dots: '#263577' },
    { id: 'blue-mesh', name: 'Cyber Blue Waves', bg: 'bg-[#EBF2FF]', bgHex: '#EBF2FF', primary: '#1E6FEB', secondary: '#263577', accent: 'from-[#1E6FEB] to-[#263577]', dots: '#1E3A8A' },
    { id: 'amber-radial', name: 'Golden Amber Glow', bg: 'bg-[#FEF5E7]', bgHex: '#FEF5E7', primary: '#FFB31F', secondary: '#FF4A00', accent: 'from-[#FFB31F] to-[#FF4A00]', dots: '#92400E' },
    { id: 'navy-code', name: 'Deep Navy Grid', bg: 'bg-[#1E293B]', bgHex: '#1E293B', primary: '#263577', secondary: '#1E6FEB', accent: 'from-[#263577] to-[#1E6FEB]', dots: '#93C5FD' },
  ];
  const [selectedCover, setSelectedCover] = useState(targetUser?.coverPattern || 'peach-geometric');
  useEffect(() => { setSelectedCover(targetUser?.coverPattern || 'peach-geometric'); }, [targetUser?.id, targetUser?.coverPattern]);
  const activeCover = coverPresets.find((preset) => preset.id === selectedCover) || coverPresets[0];

  // Following state for public profile
  const { isFollowing, followerCount, toggleFollow, followLoading, refreshFollowers } = useStudentFollow(targetUser?.id, currentUser?.id);

  // Settings form state (synced with targetUser)
  const [formData, setFormData] = useState({
    name: targetUser?.name || '',
    username: targetUser?.username || '',
    bio: targetUser?.bio || '',
    university: targetUser?.university || '',
    degree: targetUser?.degree || '',
    batch: targetUser?.batch || '',
    githubUrl: targetUser?.githubUrl || '',
    linkedinUrl: targetUser?.linkedinUrl || '',
    isPublic: targetUser?.isPublic ?? true,
    showEmail: targetUser?.showEmail ?? false,
    notifications: targetUser?.notifications || {
      emailDigest: true,
      newReviews: true,
      payouts: true,
    },
    newTagInput: '',
    interests: targetUser?.interests ? [...targetUser.interests] : [],
    // Change Email / Password state
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: targetUser?.email || '',
    deleteConfirmText: '',
  });

  const [credentialsSaving, setCredentialsSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [emailChangeSaving, setEmailChangeSaving] = useState(false);

  useEffect(() => {
    if (!showEditProfileModal || !targetUser) return;
    setFormData(previous => ({ ...previous,
      name: targetUser.name, username: targetUser.username, bio: targetUser.bio || '',
      university: targetUser.university || '', degree: targetUser.degree || '', batch: targetUser.batch || '',
      githubUrl: targetUser.githubUrl || '', linkedinUrl: targetUser.linkedinUrl || '',
      isPublic: targetUser.isPublic, showEmail: targetUser.showEmail === true,
      notifications: { ...targetUser.notifications }, interests: [...targetUser.interests],
      newEmail: targetUser.email || '', currentPassword: '', newPassword: '', confirmPassword: '',
    }));
  }, [showEditProfileModal, targetUser?.id]);

  // Resource Upload form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState<'Java' | 'Python' | 'SQL' | 'Networking' | 'OOP' | 'Cyber Security' | 'AI/ML' | 'Web Dev'>('Java');
  const [noteType, setNoteType] = useState<'Notes' | 'Past Paper' | 'E-Book' | 'Cheat Sheet' | 'Lab Guide'>('Notes');
  const [notePriceType, setNotePriceType] = useState<'Free' | 'Premium' | 'Paid'>('Free');
  const [notePrice, setNotePrice] = useState('0');
  const [noteModule, setNoteModule] = useState('IT2030');
  const [notePages, setNotePages] = useState('24');
  const [noteDesc, setNoteDesc] = useState('');

  if (profileLoading && !targetUser) return (
    <div className="px-6 py-20 text-center text-neutral-500 dark:text-neutral-300">Loading account from EduShare...</div>
  );

  // Handle guest or not found
  if (!targetUser || (!targetUser.isPublic && !isOwnProfile && currentUser?.role !== 'admin')) {
    return (
      <div className="px-6 py-20 text-center max-w-md mx-auto">
        <UserIcon className="w-14 h-14 text-neutral-400 mx-auto mb-4 dark:text-neutral-300" />
        <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100 mb-2">
          Student Profile Not Found
        </h2>
        <p className="text-sm text-neutral-500 mb-6 dark:text-neutral-300">
          The user <code className="text-[#FF4A00]">@{username}</code> doesn&apos;t exist or has set their account to private.
        </p>
        <Button to="/browse" variant="primary">
          Explore Study Catalog &rarr;
        </Button>
      </div>
    );
  }

  // User's resources
  const userUploads = resources.filter((r) => r.author.id === targetUser.id);
  const downloadedList = resources.filter((r) => purchasedResources.includes(r.id));
  const bookmarkedList = resources.filter((r) => bookmarks.includes(r.id));

  // Reviews received on this user's notes
  const writtenReviews = resources.flatMap(resource => resource.reviews.filter(review => review.userId === targetUser.id).map(review => ({...review,resourceId:resource.id,resourceTitle:resource.title})));
  const userReviews = userUploads.flatMap((r) =>
    r.reviews.map((rev) => ({ ...rev, resourceTitle: r.title, resourceId: r.id }))
  );

  // Badge eligibility is based on real activity, never on a demo-only constant.
  // These counts come from the profile's currently loaded resource records.
  const reviewRatings = userReviews.map((rev) => rev.rating).filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
  const reviewCount = reviewRatings.length;
  const averageReviewRating = reviewCount > 0
    ? reviewRatings.reduce((total, rating) => total + rating, 0) / reviewCount
    : 0;
  const positiveReviews = reviewRatings.filter((rating) => rating >= 4).length;
  const positiveReviewPercent = reviewCount > 0 ? Math.round((positiveReviews / reviewCount) * 100) : null;
  const downloadCount = userUploads.reduce((total, resource) => total + Math.max(0, Number(resource.downloads) || 0), 0);
  const earnedBadges = {
    firstUpload: userUploads.length >= 1,
    campusHelper: downloadCount >= 10,
    highlyRated: reviewCount >= 5 && averageReviewRating >= 4.5,
    accountApproved: targetUser.isVerified === true,
  };
  const earnedBadgeCount = Object.values(earnedBadges).filter(Boolean).length;
  const ratingLabel = reviewCount === 0 ? 'Not rated yet'
    : averageReviewRating >= 4.5 && reviewCount >= 5 ? 'Highly Rated Contributor'
    : 'Building Reputation';

  // Profile completion calculation
  const profileCompletionSteps = [
    { label: 'Profile avatar photo', done: Boolean(formData.name && targetUser.avatar), weight: 15 },
    { label: 'Student bio description', done: formData.bio.trim().length >= 10, weight: 15 },
    { label: 'University & Degree', done: Boolean(formData.university && formData.degree), weight: 20 },
    { label: 'Account Verification', done: targetUser.isVerified, weight: 15 },
    { label: 'Subject interests tags (3+)', done: formData.interests.length >= 3, weight: 15 },
    { label: 'Developer links (GitHub/LinkedIn)', done: Boolean(formData.githubUrl || formData.linkedinUrl), weight: 20 },
  ];
  const completionPercentage = profileCompletionSteps.reduce(
    (sum, step) => (step.done ? sum + step.weight : sum),
    0
  );

  // Handlers
  const handleFollowToggle = async () => {
    try {
      const nowFollowing = await toggleFollow();
      addToast({
        title: nowFollowing ? 'Following' : 'Unfollowed',
        message: nowFollowing ? `You now follow @${targetUser.username}.` : `You unfollowed @${targetUser.username}.`,
        type: nowFollowing ? 'success' : 'info',
      });
    } catch (error) {
      addToast({ title: 'Could not update Follow', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    }
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/u/${targetUser.username}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    addToast({
      title: 'Profile Link Copied!',
      message: `Direct link to @${targetUser.username} copied to clipboard.`,
      type: 'success',
    });
  };

  const handleSelectCover = (coverId: string) => {
    setSelectedCover(coverId);
    void updateUserProfile({ coverPattern: coverId }).catch(() =>
      addToast({ title: 'Cover save failed', type: 'error' })
    );
    setShowCoverModal(false);
    addToast({
      title: 'Cover Banner Updated',
      message: 'New abstract visual pattern applied to your profile.',
      type: 'success',
    });
  };

  const handleAddInterest = () => {
    const tag = formData.newTagInput.trim();
    if (tag && !formData.interests.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, tag],
        newTagInput: '',
      }));
    }
  };

  const handleRemoveInterest = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((t) => t !== tagToRemove),
    }));
  };

  const credentialPost = async (endpoint: string, body: unknown) => {
    const res = await fetch(endpoint, { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || `Request failed (HTTP ${res.status}).`);
    return result;
  };
  const handleChangePassword = async () => {
    if (!formData.currentPassword) { addToast({ title: 'Current Password Required', type: 'error' }); return; }
    if (formData.newPassword.length < 8 || !/[A-Za-z]/.test(formData.newPassword) || !/\d/.test(formData.newPassword)) {
      addToast({ title: 'Use 8+ characters with a letter and number.', type: 'error' }); return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      addToast({ title: 'New passwords do not match.', type: 'error' }); return;
    }
    setCredentialsSaving(true);
    try {
      await credentialPost('/api/users/me/change-password', { currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      addToast({ title: 'Password Changed', message: 'Please log out and sign in again with your new password.', type: 'success' });
      setShowEditProfileModal(false);
    } catch (e) { addToast({ title: 'Password Change Failed', message: e instanceof Error ? e.message : 'Please retry.', type: 'error' }); }
    finally { setCredentialsSaving(false); }
  };
  const handleRequestEmailChange = async () => {
    if (!formData.currentPassword) { addToast({ title: 'Current Password Required', type: 'error' }); return; }
    setEmailChangeSaving(true);
    try {
      const result = await credentialPost('/api/users/me/request-email-change',
        { currentPassword: formData.currentPassword, newEmail: formData.newEmail.trim() });
      addToast({ title: 'Check Your New Inbox', message: result.message || 'Verify the email to finish changing your address.', type: 'success' });
      setFormData(prev => ({ ...prev, currentPassword: '' }));
    } catch (e) { addToast({ title: 'Email Change Failed', message: e instanceof Error ? e.message : 'Please retry.', type: 'error' }); }
    finally { setEmailChangeSaving(false); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsSaving) return;

    if (!formData.name.trim()) {
      addToast({ title: 'Validation Error', message: 'Display name cannot be empty.', type: 'error' });
      return;
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      addToast({ title: 'Validation Error', message: 'Username must be at least 3 characters.', type: 'error' });
      return;
    }

    setSettingsSaving(true);
    try {
    await updateUserProfile({
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase().replace(/\s+/g, '_'),
      bio: formData.bio.trim(),
      university: formData.university.trim(),
      degree: formData.degree.trim(),
      batch: formData.batch.trim(),
      githubUrl: formData.githubUrl.trim(),
      linkedinUrl: formData.linkedinUrl.trim(),
      isPublic: formData.isPublic,
      showEmail: formData.showEmail,
      notifications: formData.notifications,
      interests: formData.interests,
    });

    addToast({
      title: 'Profile Saved Successfully! ✓',
      message: 'Your profile changes have been saved.',
      type: 'success',
    });

    if (username && formData.username.trim().toLowerCase() !== username.toLowerCase()) navigate(`/u/${formData.username.trim().toLowerCase().replace(/\s+/g, '_')}`, { replace: true });
    setShowEditProfileModal(false);
    } catch (error) {
      addToast({ title: 'Profile Save Failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally { setSettingsSaving(false); }
  };

  const handleDownloadData = () => {
    const dataStr = JSON.stringify(
      {
        user: targetUser,
        uploads: userUploads,
        downloadCount: downloadedList.length,
        savedBookmarks: bookmarkedList.length,
        exportTimestamp: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edushare-profile-${targetUser.username}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      title: 'Data Archive Exported',
      message: 'Your complete EduShare learning footprint has been saved as JSON.',
      type: 'info',
    });
  };

  const handleDeleteAccountConfirm = () => {
    if (formData.deleteConfirmText !== 'DELETE') {
      addToast({
        title: 'Confirmation Failed',
        message: 'Please type DELETE exactly to confirm account termination.',
        type: 'error',
      });
      return;
    }
    setShowDeleteModal(false);
    deleteUserAccount();
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    addResource({
      title: noteTitle.trim(),
      category: noteCategory,
      type: noteType,
      priceType: notePriceType,
      price: notePriceType === 'Paid' ? parseInt(notePrice) || 250 : 0,
      moduleCode: noteModule.toUpperCase(),
      pages: parseInt(notePages) || 20,
      description: noteDesc || 'Comprehensive student revision guide with practical examples.',
    });

    setShowUploadModal(false);
    setNoteTitle('');
    setNoteDesc('');
    setActiveTab('uploads');
  };

  // Define tabs list
  const tabsList = [
    { id: 'uploads', label: 'Uploads', count: userUploads.length, icon: <BookOpen className="w-4 h-4" /> },
    ...(isOwnProfile
      ? [
          { id: 'seller', label: 'Seller Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'purchased', label: 'Purchased & Downloads', count: downloadedList.length, icon: <Download className="w-4 h-4" /> },
          { id: 'bookmarks', label: 'Wishlist', count: bookmarkedList.length, icon: <Bookmark className="w-4 h-4" /> },
          { id: 'collections', label: 'Collections', count: savedCollections.length, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'history', label: 'Watch history', count: watchProgress.length, icon: <BookOpen className="w-4 h-4" /> },
        ]
      : []),
    { id: 'reviews', label: 'Reviews', count: userReviews.length + (isOwnProfile ? writtenReviews.length : 0), icon: <Star className="w-4 h-4" /> },
    ...(isOwnProfile ? [{ id: 'settings', label: 'Settings', icon: <Sliders className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10 space-y-8 pb-12">
      {/* 1. COVER BANNER */}
      <div
        className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#E8E2D6] dark:border-neutral-800 shadow-sm transition-all duration-300"
        style={{ backgroundColor: activeCover.bgHex }}
      >
        {/* Cover Graphic Elements */}
        <div className="h-44 sm:h-56 md:h-64 w-full relative overflow-hidden flex items-center justify-center">
          {/* Abstract SVG curves inspired by Framer Getblox */}
          <div className="absolute inset-0 opacity-80 mix-blend-multiply dark:mix-blend-screen pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1120 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              <rect width="1120" height="280" fill={activeCover.bgHex} />
              <circle cx="950" cy="80" r="180" fill={activeCover.secondary} fillOpacity="0.45" />
              <path
                d="M-50 200 C 200 40, 450 300, 750 120 C 950 0, 1150 160, 1200 120 L 1200 350 L -50 350 Z"
                fill={activeCover.primary}
                fillOpacity="0.35"
              />
              <path
                d="M100 -20 C 350 180, 600 -40, 850 160 C 1050 300, 1200 120, 1250 80 L 1250 -40 L 100 -40 Z"
                fill={activeCover.secondary}
                fillOpacity="0.25"
              />
              {/* Halftone grid dots */}
              <pattern id="cover-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.5" fill={activeCover.dots} fillOpacity="0.12" />
              </pattern>
              <rect width="1120" height="280" fill="url(#cover-dots)" />
            </svg>
          </div>

          {/* Action buttons on Cover */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
            {isOwnProfile && (
              <button
                onClick={() => setShowCoverModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-white/50 shadow-sm hover:bg-white dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF4A00]" />
                <span>Change Cover</span>
              </button>
            )}
            <button
              onClick={handleShareProfile}
              className="p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-white/50 shadow-sm hover:bg-white dark:hover:bg-neutral-800 transition-all cursor-pointer"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. PROFILE HERO OVERLAP BAR */}
        <div className="px-6 sm:px-8 md:px-10 pb-8 bg-white dark:bg-neutral-900/90 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Overlapping Avatar with Camera Trigger */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white dark:ring-neutral-900 shadow-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {targetUser.avatar ? <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full object-cover"/> : <span className="text-4xl font-bold text-[#FF4A00]">{targetUser.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('')}</span>}
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute bottom-1 right-1 p-2.5 rounded-full bg-[#FF4A00] text-white shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer ring-2 ring-white dark:ring-neutral-900"
                    title="Change profile picture"
                    aria-label="Upload photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Names & Main Badges */}
              <div className="space-y-1.5 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-neutral-100">
                    {targetUser.name}
                  </h1>

                  {/* Plan Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      targetUser.plan === 'Premium'
                        ? 'bg-[#FF4A00] text-white'
                        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {targetUser.plan} Scholar
                  </span>

                  {/* Verified Student Badge */}
                  {targetUser.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Demo Verified</span>
                    </span>
                  ) : (
                    <Link
                      to="/verify"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Verify Account</span>
                    </Link>
                  )}
                </div>

                {/* Handle & Role */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-300">
                  <span className="font-mono text-neutral-600 dark:text-neutral-400 font-semibold">
                    @{targetUser.username}
                  </span>
                  <span>&bull;</span>
                  <span className="capitalize">{targetUser.role} Contributor</span>
                  <span>&bull;</span>
                  <span>Joined {targetUser.joinedDate}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    to="/share"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>Upload Resource</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setShowEditProfileModal(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    <span>Edit Profile</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    onClick={() => { void handleFollowToggle(); }}
                    disabled={followLoading}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1.5" />
                        <span>Follow Student</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleShareProfile}
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    <span>Share</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bio & Academic Chips */}
          <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 max-w-3xl leading-relaxed">
              {targetUser.bio || 'Computer Science student passionate about distributed systems, backend engineering, and helping classmates crack exams.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <Building className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300" />
                <span>{targetUser.university}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <GraduationCap className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300" />
                <span>{targetUser.degree}</span>
              </span>

              {targetUser.batch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300" />
                  <span>{targetUser.batch}</span>
                </span>
              )}

              {targetUser.email && (isOwnProfile || targetUser.showEmail || currentUser?.role === 'admin') && (
                <a href={`mailto:${targetUser.email}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 break-all">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{targetUser.email}</span>
                </a>
              )}

              {targetUser.githubUrl && (
                <a
                  href={`https://${targetUser.githubUrl.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:text-[#FF4A00] transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}

              {targetUser.linkedinUrl && (
                <a
                  href={`https://${targetUser.linkedinUrl.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:text-[#1E6FEB] transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saved academic interests are visible on the member profile, not only in Edit Profile. */}
      {Array.isArray(targetUser.interests) && targetUser.interests.length > 0 && (
        <section data-testid="profile-academic-interests" className="rounded-[22px] border border-[#E8E2D6] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#FF4A00]" />
            <h3 className="text-sm font-bold text-neutral-900">Academic Focus & Interests</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {targetUser.interests.map((interest, index) => (
              <span key={`${interest}-${index}`} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#C2410C]">
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}
      {/* Clickable profile statistics and connections */}
      <ProfileStatsPanel
        profileId={targetUser.id}
        viewerId={currentUser?.id}
        uploads={userUploads}
        followingSignal={isFollowing}
        onConnectionChange={() => { void refreshFollowers().catch(() => {}); }}
      />

      {/* 4. BADGE SHELF (First Upload, Helper, Top Seller, Verified Student) */}
      <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FF4A00]" />
              <span>Campus Achievement Badges</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
              Badges earned through academic contribution and peer evaluation on EduShare.
            </p>
          </div>
          <Tag variant="peach" className="text-xs font-semibold py-1">
            {earnedBadgeCount} / 4 Badges Unlocked
          </Tag>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Badge 1: First Upload */}
          <div className={`group relative p-4 rounded-[20px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 hover:border-[#FF4A00] transition-all ${earnedBadges.firstUpload ? '' : 'opacity-45 grayscale'}`} aria-label={earnedBadges.firstUpload ? 'First Upload unlocked' : 'First Upload locked'}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF4A00]/10 flex items-center justify-center text-[#FF4A00]">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  First Upload
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-300">Resource Pioneer</p>
              </div>
            </div>
            {/* Tooltip on hover */}
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-xl bg-neutral-900 text-white text-[11px] leading-snug shadow-xl z-20 pointer-events-none">
              Unlock by publishing your first resource to the EduShare catalog.
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Award criteria apply</div>
            </div>
          </div>

          {/* Badge 2: Campus Helper */}
          <div className={`group relative p-4 rounded-[20px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 hover:border-[#1E6FEB] transition-all ${earnedBadges.campusHelper ? '' : 'opacity-45 grayscale'}`} aria-label={earnedBadges.campusHelper ? 'Campus Helper unlocked' : 'Campus Helper locked'}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E6FEB]/10 flex items-center justify-center text-[#1E6FEB]">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Campus Helper
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-300">Peer download milestone</p>
              </div>
            </div>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-xl bg-neutral-900 text-white text-[11px] leading-snug shadow-xl z-20 pointer-events-none">
              Unlock after your shared resources receive 10 downloads.
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Award criteria apply</div>
            </div>
          </div>

          {/* Badge 3: Top Seller */}
          <div className={`group relative p-4 rounded-[20px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 hover:border-[#FFB31F] transition-all ${earnedBadges.highlyRated ? '' : 'opacity-45 grayscale'}`} aria-label={earnedBadges.highlyRated ? 'Highly Rated unlocked' : 'Highly Rated locked'}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFB31F]/10 flex items-center justify-center text-[#FFB31F]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Highly Rated
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-300">Five reviews, 4.5+ average</p>
              </div>
            </div>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-xl bg-neutral-900 text-white text-[11px] leading-snug shadow-xl z-20 pointer-events-none">
              Unlock after receiving at least five reviews averaging 4.5 stars or above.
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Award criteria apply</div>
            </div>
          </div>

          {/* Badge 4: Verified Student */}
          <div className={`group relative p-4 rounded-[20px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 hover:border-emerald-500 transition-all ${earnedBadges.accountApproved ? '' : 'opacity-45 grayscale'}`} aria-label={earnedBadges.accountApproved ? 'Account Approved unlocked' : 'Account Approved locked'}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Account Approved
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-300">Admin-approved profile</p>
              </div>
            </div>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-xl bg-neutral-900 text-white text-[11px] leading-snug shadow-xl z-20 pointer-events-none">
              Unlock when your account is approved by the EduShare administrator. This is not official university ID verification.
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Award criteria apply</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. MAIN CONTENT LAYOUT: TABS ON LEFT (2 COLUMNS), STICKY SIDEBAR ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Tabs & Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Own Profile: Profile Completion Ring Widget */}
          {isOwnProfile && completionPercentage < 100 && (
            <Card variant="peach" hoverable={false} className="p-5 border-transparent">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* SVG Circular Progress Meter */}
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-neutral-300 dark:text-neutral-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#FF4A00] transition-all duration-1000 ease-out"
                      strokeDasharray={`${completionPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-display font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                    {completionPercentage}%
                  </span>
                </div>

                {/* Progress Details */}
                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-between">
                    <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100">
                      Complete your Scholar Profile
                    </h4>
                    <span className="text-xs font-semibold text-[#FF4A00] hidden sm:inline">
                      {completionPercentage}% Completed
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-snug">
                    Verified profiles with university details and subject interests get 3.4x more downloads and tutor inquiries.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    {profileCompletionSteps
                      .filter((s) => !s.done)
                      .slice(0, 2)
                      .map((step, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (step.label === 'Profile avatar photo') {
                              setShowAvatarModal(true);
                            } else {
                              setShowEditProfileModal(true);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-800 dark:text-neutral-100 bg-white/70 dark:bg-neutral-800 hover:bg-white dark:hover:bg-neutral-700 px-2.5 py-1 rounded-full border border-neutral-300 dark:border-neutral-600 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-[#FF4A00]" />
                          <span>{step.label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SLIDING UNDERLINE TABS */}
          <nav aria-label="Profile sections" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 rounded-2xl bg-[#EEF1F8] dark:bg-neutral-900 p-3 border border-[#DCE2F0] dark:border-neutral-700">
            {tabsList.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  aria-current={isActive?'page':undefined}
                  onClick={() => {
                    if (tab.id === 'settings') {
                      setShowEditProfileModal(true);
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`relative flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-bold transition-colors cursor-pointer rounded-xl text-left min-w-0 min-h-16 ${
                    isActive
                      ? 'bg-[#263577] text-white shadow-sm'
                      : 'bg-white dark:bg-neutral-800 text-[#263577] dark:text-neutral-200 hover:bg-orange-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {tab.icon}
                  <span className="min-w-0 flex-1 whitespace-normal leading-snug">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeProfileTabUnderline"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFB31F]"
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* TAB PANELS */}

          {/* Panel 1: Uploads */}
          {activeTab === 'uploads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                  Published Study Resources ({userUploads.length})
                </h3>
                {isOwnProfile && (
                  <Button variant="primary" size="sm" to="/share">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Upload New</span>
                  </Button>
                )}
              </div>

              {userUploads.length === 0 ? (
                <div className="p-12 text-center rounded-[20px] bg-neutral-50 dark:bg-neutral-900/40 border border-[#E8E2D6] dark:border-neutral-800">
                  <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2 dark:text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    No resources uploaded yet.
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto dark:text-neutral-300">
                    Share your verified lecture notes, exam cheatsheets, or lab manuals with classmates.
                  </p>
                  {isOwnProfile && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-4"
                      to="/share"
                    >
                      Publish First Guide &rarr;
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {userUploads.map((res) => (
                    <Card
                      key={res.id}
                      variant="white"
                      className="p-5 border-[#E8E2D6] dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Tag variant="peach" className="text-[10px] py-0.5">
                            {res.category}
                          </Tag>
                          <Badge type={res.priceType} size="sm" />
                          <span className="font-mono text-xs font-semibold text-[#FF4A00]">
                            {res.moduleCode}
                          </span>
                        </div>
                        <Link
                          to={`/resource/${res.id}`}
                          className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-[#FF4A00] transition-colors block text-sm sm:text-base"
                        >
                          {res.title}
                        </Link>
                        <div className="text-xs text-neutral-500 flex items-center gap-3 dark:text-neutral-300">
                          <span>{res.downloads} downloads</span>
                          <span>&bull;</span>
                          <span>{res.rating}★ rating ({res.reviewCount} reviews)</span>
                          <span>&bull;</span>
                          <span>{res.pages} pages</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button to={`/resource/${res.id}`} variant="secondary" size="sm">
                          View Details
                        </Button>
                        {isOwnProfile && (res.id.startsWith('backend-resource-') || res.id.startsWith('backend-link-')) && (
                          <button type="button" onClick={() => {
                            setResourceToDelete(res); setResourceDeleteReason('Uploaded the wrong document');
                            setResourceDeleteFeedback(''); setResourceDeleteConfirmation(''); setResourceDeleteError('');
                          }} className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Panel 1.5: Seller Dashboard & Eligibility Checklist */}
          {activeTab === 'seller' && isOwnProfile && (
            <div className="space-y-6">
              {/* STRIKES WARNING BANNER */}
              {targetUser.strikes && targetUser.strikes > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="font-extrabold flex items-center gap-2 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Account Policy Status: {targetUser.strikes} / 3 Strikes</span>
                  </div>
                  <p className="text-rose-800 dark:text-rose-300">
                    {targetUser.strikes === 1
                      ? 'Warning: 1 strike issued for publishing uncredited campus materials. Please ensure all uploads are your own work.'
                      : targetUser.strikes === 2
                      ? 'Selling Disabled: 2 strikes issued. Monetized uploads are locked. You can only share free study notes.'
                      : 'Account Suspended: 3 strikes issued. Your seller privileges are disabled.'}
                  </p>
                </div>
              ) : null}

              {/* SELLER ELIGIBILITY CHECKLIST WITH UNLOCK ANIMATION */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#FF4A00]" />
                      <span>Seller Eligibility Checklist</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
                      To prevent copyright spam, sellers must meet 3 verification criteria before unlocking paid uploads.
                    </p>
                  </div>

                  {/* Unlock Status Badge */}
                  {targetUser.isVerified && (targetUser.freeUploadsCount || userUploads.length) >= 3 ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                      <span>Paid Uploads Unlocked! 🎉</span>
                    </motion.div>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                      Progress: {(targetUser.isVerified ? 1 : 0) + (userUploads.length >= 3 ? 1 : 0) + 1} / 3 Complete
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        (((targetUser.isVerified ? 1 : 0) + (userUploads.length >= 3 ? 1 : 0) + 1) / 3) *
                        100
                      }%`,
                    }}
                    className="bg-gradient-to-r from-[#FF4A00] to-emerald-500 h-full transition-all duration-700"
                  />
                </div>

                {/* Checklist Items */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Criterion 1: Verified Email / ID */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                      targetUser.isVerified
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-200'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        targetUser.isVerified ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {targetUser.isVerified ? <Check className="w-3.5 h-3.5" /> : '1'}
                    </div>
                    <div>
                      <div className="font-bold">Account Review Status</div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-300">
                        {targetUser.isVerified ? '✓ Verified' : 'Pending Verification'}
                      </div>
                    </div>
                  </div>

                  {/* Criterion 2: Account Age > 14 days */}
                  <div className="p-3.5 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">Account Age &gt; 14 Days</div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-300">✓ Active member since {targetUser.joinedDate}</div>
                    </div>
                  </div>

                  {/* Criterion 3: At least 3 Free Uploads */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                      userUploads.length >= 3
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-200'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        userUploads.length >= 3 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {userUploads.length >= 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                    </div>
                    <div>
                      <div className="font-bold">3+ Free Uploads Shared</div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-300">
                        {userUploads.length} / 3 Free Guides Published
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* EARNINGS BREAKDOWN: PENDING (14-DAY HOLD) & AVAILABLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pending Balance Card */}
                <Card variant="peach" hoverable={false} className="p-5 border-transparent space-y-2">
                  <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-200">
                    <span className="text-xs uppercase font-bold tracking-wider">Pending (14-Day Hold)</span>
                    <Clock className="w-4 h-4 text-[#FF4A00]" />
                  </div>
                  <div className="text-3xl font-extrabold font-display text-[#FF4A00] tabular-nums">
                    Rs. {(targetUser.pendingBalance || 3150).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    Held for 14 days during buyer protection & report review window.
                  </p>
                </Card>

                {/* Available Balance Card */}
                <Card variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-300">
                    <span className="text-xs uppercase font-bold tracking-wider">Available for Withdrawal</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold font-display text-emerald-600 dark:text-emerald-400 tabular-nums">
                    Rs. {(targetUser.availableBalance || 11050).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-300">
                    Cleared earnings ready for bank transfer or LKR bank account payout.
                  </p>
                </Card>
              </div>

              {/* TIMELINE OF PENDING TRANSACTIONS RELEASE DATES */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF4A00]" />
                    <span>Pending Earnings Release Timeline</span>
                  </h4>
                  <span className="text-xs font-mono text-neutral-400 dark:text-neutral-300">14-Day Guarantee</span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'tx-101',
                      title: 'SCS2201 Advanced Concurrency Notes (Single Purchase)',
                      amount: 1200,
                      releaseDate: 'Nov 8, 2026',
                      isFrozen: false,
                    },
                    {
                      id: 'tx-102',
                      title: 'CS2042 Database Normalization Answers Pack',
                      amount: 1950,
                      releaseDate: 'Nov 12, 2026',
                      isFrozen: targetUser.strikes ? targetUser.strikes > 0 : false,
                    },
                  ].map((tx) => (
                    <div
                      key={tx.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                        tx.isFrozen
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200'
                          : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                          <span>{tx.title}</span>
                          {tx.isFrozen && (
                            <span className="px-2 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px]">
                              FROZEN (Under Review)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono dark:text-neutral-300">
                          Unlocks on: <strong>{tx.releaseDate}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold font-display text-sm text-[#FF4A00]">
                          +Rs. {tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-mono dark:text-neutral-300">90% Payout</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Panel 2: Purchased & Downloads (Own Profile only) */}
          {activeTab === 'purchased' && isOwnProfile && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                Downloaded Library & Guides ({downloadedList.length})
              </h3>

              {downloadedList.length === 0 ? (
                <div className="p-12 text-center rounded-[20px] bg-neutral-50 dark:bg-neutral-900/40 border border-[#E8E2D6] dark:border-neutral-800">
                  <Download className="w-8 h-8 text-neutral-400 mx-auto mb-2 dark:text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    No resources downloaded yet.
                  </p>
                  <Button to="/browse" variant="primary" size="sm" className="mt-3">
                    Browse Popular Notes &rarr;
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {downloadedList.map((res) => (
                    <Card key={res.id} variant="white" className="p-5 border-[#E8E2D6] space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge type={res.priceType} size="sm" />
                        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-300">
                          {res.fileFormat} &bull; {res.fileSize}
                        </span>
                      </div>
                      <Link to={`/resource/${res.id}`} className="block hover:text-[#FF4A00]">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-display line-clamp-2">
                          {res.title}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                        <span className="font-mono text-neutral-500 dark:text-neutral-300">{res.moduleCode}</span>
                        <Button to={`/resource/${res.id}`} variant="secondary" size="sm">
                          Open Reader
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Panel 3: Bookmarks */}
          {isOwnProfile && activeTab === 'collections' && <ProfileStudyLibrary section="collections"/>}
          {isOwnProfile && activeTab === 'history' && <ProfileStudyLibrary section="history"/>}
          {isOwnProfile && activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                My wishlist ({bookmarkedList.length})
              </h3>

              <p className="text-sm text-neutral-500 dark:text-neutral-300">Resources you bookmark are saved here for later. <button type="button" onClick={()=>void refreshPersonalLibrary().catch(()=>{})} className="underline">Refresh wishlist</button></p>
              {personalLibraryError && <p role="alert" className="text-red-600 dark:text-red-300">{personalLibraryError}</p>}
              {personalLibraryLoading && <p role="status">Loading wishlist…</p>}
              {bookmarkedList.length === 0 ? (
                <div className="p-12 text-center rounded-[20px] bg-neutral-50 dark:bg-neutral-900/40 border border-[#E8E2D6] dark:border-neutral-800">
                  <Bookmark className="w-8 h-8 text-neutral-400 mx-auto mb-2 dark:text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Your wishlist is empty. Save a PDF, video or article to find it here.
                  </p>
                  <Button to="/browse" variant="primary" size="sm" className="mt-3">
                    Explore Resources &rarr;
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookmarkedList.map((res) => (
                    <Card key={res.id} variant="white" className="p-5 border-[#E8E2D6] space-y-3">
                      <div className="flex items-center justify-between">
                        <Tag variant="peach" className="text-[10px] py-0.5">
                          {res.category}
                        </Tag>
                        <Badge type={res.priceType} size="sm" />
                      </div>
                      <Link to={`/resource/${res.id}`} className="block hover:text-[#FF4A00]">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-display line-clamp-2">
                          {res.title}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                        <span className="text-neutral-500 truncate max-w-[130px] dark:text-neutral-300">
                          {res.author.name}
                        </span>
                        <div className="flex gap-2"><button type="button" onClick={()=>toggleBookmark(res.id)} className="text-red-600 dark:text-red-300">Remove</button><Button to={`/resource/${res.id}`} variant="primary" size="sm">
                          View
                        </Button></div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Panel 4: Reviews Received */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {isOwnProfile && <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
                <h3 className="font-bold">Reviews I wrote ({writtenReviews.length})</h3>
                {writtenReviews.length === 0 && <p className="text-sm text-neutral-500">Your saved reviews will appear here after you review another member's resource.</p>}
                {writtenReviews.map(review => <WrittenReviewCard key={review.id} review={review} />)}
              </div>}
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                Peer Reviews & Feedback ({userReviews.length})
              </h3>

              {userReviews.length === 0 ? (
                <div className="p-12 text-center rounded-[20px] bg-neutral-50 dark:bg-neutral-900/40 border border-[#E8E2D6] dark:border-neutral-800">
                  <Star className="w-8 h-8 text-neutral-400 mx-auto mb-2 dark:text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    No peer reviews yet.
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-300">
                    When members review your resources, their feedback will display here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userReviews.map((rev) => (
                    <Card
                      key={rev.id}
                      variant="white"
                      hoverable={false}
                      className="p-5 border-[#E8E2D6] dark:border-neutral-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar src={rev.userAvatar} name={rev.userName} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                              {rev.userName}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-300">
                              {rev.university} &bull; {rev.date}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-[#FFB31F] text-xs font-bold">
                          {'★'.repeat(rev.rating)}
                          <span className="text-neutral-300 dark:text-neutral-700">
                            {'★'.repeat(5 - rev.rating)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      <div className="pt-2 text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 dark:text-neutral-300">
                        Review for note:{' '}
                        <Link
                          to={`/resource/${rev.resourceId}`}
                          className="text-[#FF4A00] font-semibold hover:underline"
                        >
                          {rev.resourceTitle}
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}


        </div>

        {/* Right 1 Column: Sticky Reputation & Upgrade Cards */}
        <div className="space-y-6">
          {/* Reputation & Campus Rank Card */}
          <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">
                Tutor Reputation
              </span>
              <span className="text-xs font-extrabold text-[#FF4A00] bg-[#FF4A00]/10 px-2.5 py-0.5 rounded-full">
                {reviewCount === 0 ? 'Unranked' : `${reviewCount} Peer Reviews`}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-[#FFB31F] flex items-center justify-center font-display font-extrabold text-2xl">
                {reviewCount === 0 ? '—' : `${averageReviewRating.toFixed(1)}★`}
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                  {ratingLabel}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-300">
                  {reviewCount === 0 ? 'No verified reviews yet' : `Based on ${reviewCount} resource reviews`}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Code Integrity Score:</span>
                <span className="font-semibold text-emerald-600">Not assessed</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Response Time to Queries:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">Not tracked</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Verified Classmates:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">Not tracked</span>
              </div>
            </div>
          </Card>

          {isOwnProfile && (
            <Link to="/pricing#manage-membership" className="flex items-center justify-between rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-5 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:border-[#FF4A00] transition-colors">
              <span>Membership & Billing — {currentUser?.plan === 'Premium' ? 'Manage or cancel Premium' : 'View plans'}</span>
              <ArrowRight className="h-4 w-4 text-[#FF4A00]" />
            </Link>
          )}
          {/* Only free users should see the upgrade promotion. */}
          {currentUser?.plan !== 'Premium' && (
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#FF4A00] text-white shadow-lg space-y-5 relative overflow-hidden">
            {/* Background graphic flare */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  Best Value
                </span>
                {currentUser?.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-[11px] font-bold border border-emerald-300/40">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Student Verified</span>
                  </span>
                )}
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight leading-snug">
                Ace Every Exam with Premium Access
              </h4>
              <p className="text-xs text-white/90 leading-relaxed">
                {currentUser?.isVerified
                  ? 'Special student rate: Rs. 159 / month (was Rs. 199) or Rs. 799 / semester.'
                  : 'From just Rs. 125 / month (Rs. 1,499/yr) or Rs. 799 / semester (Save 20%).'}
              </p>
            </div>

            <div className="space-y-2 text-xs text-white/95 relative z-10">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FFB31F]" />
                <span>Unlimited downloads across all modules</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FFB31F]" />
                <span>15% off all student-priced paid PDFs</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FFB31F]" />
                <span>On-demand AI PDF summaries and private study groups</span>
              </div>
            </div>

            <div className="pt-2 relative z-10 space-y-2">
              <Link
                to="/pricing"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-[#FF4A00] font-bold text-xs sm:text-sm hover:bg-neutral-100 active:scale-98 transition-all shadow-md"
              >
                <span>Start 7-day free trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-[11px] text-white/80 font-medium">
                Cancel anytime · Zero cancellation fee
              </p>
            </div>
          </div>
          )}


        </div>
      </div>

      {/* 6. MODALS */}

      {showAvatarModal&&isOwnProfile&&<ProfilePhotoEditor avatar={currentUser?.avatar||''} name={currentUser?.name||''} onClose={()=>setShowAvatarModal(false)}/>}

      {/* B. Cover Pattern Modal */}
      <Modal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        title="Customize Cover Banner"
        description="Select a geometric theme for your profile header."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coverPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleSelectCover(preset.id)}
                className={`p-4 rounded-[20px] border cursor-pointer transition-all ${
                  selectedCover === preset.id
                    ? 'border-[#FF4A00] ring-2 ring-[#FF4A00]/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                }`}
              >
                <div className={`h-16 rounded-[14px] ${preset.bg} mb-2 relative overflow-hidden flex items-center justify-center`}>
                  <div className={`w-20 h-10 rounded-full bg-gradient-to-r ${preset.accent} opacity-60 blur-md`} />
                </div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {preset.name}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowCoverModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* C. Publish Note Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Publish New IT Study Resource"
        description="Share your lecture notes or past paper solutions with university classmates."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateResource} className="space-y-4">
          <Input
            label="Resource Title"
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="e.g. Complete Concurrency & Thread Pools Study Guide"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              >
                <option value="Java">Java</option>
                <option value="Python">Python</option>
                <option value="SQL">SQL</option>
                <option value="Networking">Networking</option>
                <option value="OOP">OOP</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Web Dev">Web Dev</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                Resource Type
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              >
                <option value="Notes">Notes</option>
                <option value="Past Paper">Past Paper</option>
                <option value="Cheat Sheet">Cheat Sheet</option>
                <option value="Lab Guide">Lab Guide</option>
                <option value="E-Book">E-Book</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Module Code"
              type="text"
              value={noteModule}
              onChange={(e) => setNoteModule(e.target.value)}
              placeholder="e.g. CS2201"
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                Pricing Model
              </label>
              <select
                value={notePriceType}
                onChange={(e) => setNotePriceType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              >
                <option value="Free">Free</option>
                <option value="Premium">Premium</option>
                <option value="Paid">Paid (Single Purchase)</option>
              </select>
            </div>

            {notePriceType === 'Paid' ? (
              <Input
                label="Price (Rs.)"
                type="number"
                value={notePrice}
                onChange={(e) => setNotePrice(e.target.value)}
                placeholder="250"
              />
            ) : (
              <Input
                label="Estimated Pages"
                type="number"
                value={notePages}
                onChange={(e) => setNotePages(e.target.value)}
                placeholder="24"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
              Description & Topics Covered
            </label>
            <textarea
              value={noteDesc}
              onChange={(e) => setNoteDesc(e.target.value)}
              placeholder="Summarize the core concepts, lab tasks, or exam topics this guide covers..."
              rows={3}
              className="w-full p-3 rounded-[16px] border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00] resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button variant="primary" size="md" type="submit" className="w-full">
              Publish to EduShare Catalog &rarr;
            </Button>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Owner-only resource deletion with mandatory feedback and confirmation. */}
      <Modal isOpen={Boolean(resourceToDelete)} onClose={closeResourceDelete}
        title="Remove your resource" description="This will remove the resource from the catalog for everyone."
        maxWidth="md">
        <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-200">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <p className="font-semibold">{resourceToDelete?.title}</p>
            <p className="mt-1 text-xs">Deletion requires feedback and a final confirmation. Other students will no longer be able to access this resource.</p>
          </div>
          <label className="block font-semibold">Why are you deleting this resource?
            <select value={resourceDeleteReason} onChange={(event) => setResourceDeleteReason(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
              <option>Uploaded the wrong document</option><option>Outdated or inaccurate content</option>
              <option>Copyright or ownership concern</option><option>Duplicate upload</option><option>Other reason</option>
            </select>
          </label>
          <label className="block font-semibold">Feedback (required, at least 10 characters)
            <textarea value={resourceDeleteFeedback} onChange={(event) => setResourceDeleteFeedback(event.target.value)}
              rows={3} maxLength={1000} placeholder="Tell us what went wrong or why you want to remove it..."
              className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
          </label>
          <label className="block font-semibold">Type DELETE to confirm
            <input value={resourceDeleteConfirmation} onChange={(event) => setResourceDeleteConfirmation(event.target.value)}
              autoComplete="off" placeholder="DELETE" className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
          </label>
          {resourceDeleteError && <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-300">{resourceDeleteError}</p>}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={closeResourceDelete} disabled={resourceDeleting} className="rounded-full border border-neutral-300 px-5 py-2.5 font-bold dark:border-neutral-700">Cancel</button>
            <button onClick={submitResourceDelete} disabled={resourceDeleting || resourceDeleteFeedback.trim().length < 10 || resourceDeleteConfirmation !== 'DELETE'}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-rose-700">
              <Trash2 className="h-4 w-4" /> {resourceDeleting ? 'Removing...' : 'Submit feedback & delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* D. Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Termination"
        description="This action is immediate and irrevocable."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-[16px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <p className="font-bold">Are you absolutely sure?</p>
            <p>
              Your verified scholar credentials, upload records, and royalties will be permanently removed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Type <strong className="text-rose-600 font-mono">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={formData.deleteConfirmText}
              onChange={(e) => setFormData({ ...formData, deleteConfirmText: e.target.value })}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 rounded-full border border-rose-300 dark:border-rose-800 bg-white dark:bg-neutral-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDeleteAccountConfirm}
              className="w-full py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs sm:text-sm hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
            >
              Permanently Terminate Account
            </button>
            <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Membership actions are managed by the backend and are not profile-field updates. */}
      {/* E. Edit Profile Modal Popup */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => { if (!settingsSaving) setShowEditProfileModal(false); }}
        title="Edit Profile Settings"
        description="Update your personal information, academic focus, social links, and account preferences."
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveSettings} className="space-y-6 pt-2">
          {/* Section 1: Basic Profile Details */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-neutral-50/70 dark:bg-neutral-800/40 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <div className="border-b border-neutral-200 dark:border-neutral-700/80 pb-3">
              <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#FF4A00]" />
                <span>Personal Information</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
                Manage how your name, handle, and bio appear across campus search and note cards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Username Handle"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  })
                }
                helperText={`Public URL: edushare.lk/u/${formData.username || 'username'}`}
                required
              />
            </div>

            {/* Bio with 200 Char Counter */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Short Bio
                </label>
                <span
                  className={`text-xs font-mono ${
                    formData.bio.length > 180 ? 'text-[#FF4A00] font-bold' : 'text-neutral-400'
                  }`}
                >
                  {formData.bio.length} / 200
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell classmates about your academic interests, GPA strengths, or study focus..."
                className="w-full p-3 rounded-[16px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="University"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
              <Input
                label="Degree Program"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
              <Input
                label="Batch / Year"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="e.g. 2022/2026 Batch"
              />
            </div>
          </div>

          {/* Section 2: Subject Interests & Tags */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-neutral-50/70 dark:bg-neutral-800/40 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <div className="border-b border-neutral-200 dark:border-neutral-700/80 pb-3">
              <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFB31F]" />
                <span>Academic Focus & Interest Tags</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
                Add tags representing your core module specialties or research topics.
              </p>
            </div>

            {/* Tags List */}
            <div className="flex flex-wrap gap-2 items-center">
              {formData.interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4A00]/10 text-[#FF4A00] text-xs font-semibold border border-[#FF4A00]/20"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(tag)}
                    className="hover:text-red-700 cursor-pointer"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.newTagInput}
                onChange={(e) => setFormData({ ...formData, newTagInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                placeholder="Add an interest (e.g. Docker, Cyber Security, SQL)..."
                className="flex-1 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddInterest}>
                <Plus className="w-4 h-4 mr-1" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Section 3: Social & Developer Links */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-neutral-50/70 dark:bg-neutral-800/40 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <div className="border-b border-neutral-200 dark:border-neutral-700/80 pb-3">
              <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1E6FEB]" />
                <span>Social & Developer Links</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
                Connect your professional profiles for prospective study groups and internship scouts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GitHub Profile URL"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="github.com/alex-perera"
              />
              <Input
                label="LinkedIn Profile URL"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="linkedin.com/in/alex-perera"
              />
            </div>
          </div>

          {/* Section 4: Privacy & Preferences */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-neutral-50/70 dark:bg-neutral-800/40 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <div className="border-b border-neutral-200 dark:border-neutral-700/80 pb-3">
              <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Privacy & Preferences</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
                Manage profile visibility, contact details and notification preferences.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-[16px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Public Profile
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-300">
                    Allow other members to view your full profile. Published resources remain in Browse.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 accent-[#FF4A00] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[16px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Show your email to other members
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-300">
                    Allow other members to see the university or personal email linked to your account.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showEmail}
                  onChange={(e) => setFormData({ ...formData, showEmail: e.target.checked })}
                  className="w-4 h-4 accent-[#FF4A00] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                  Notification Digest
                </label>
                <select
                  value={formData.notifications.emailDigest ? 'weekly' : 'never'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        emailDigest: e.target.value === 'weekly',
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                >
                  <option value="weekly">Weekly Exam & Note Digest</option>
                  <option value="never">Important Security Alerts Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Security (Email & Password) */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-neutral-50/70 dark:bg-neutral-800/40 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <div className="border-b border-neutral-200 dark:border-neutral-700/80 pb-3">
              <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <span>Security Credentials</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-300">
                Update your login credentials or verified institutional contact.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Registered Email (Admin / Student)"
                value={formData.newEmail}
                onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                helperText="Email changes require a link sent to the NEW inbox. Use the button below; profile Save does not change login credentials."
              />

              <Input
                label="Current Password (required for email or password changes)"
                type="password"
                placeholder="Enter your current login password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              />
              <button type="button" disabled={emailChangeSaving || formData.newEmail.trim().toLowerCase() === (targetUser?.email || '').toLowerCase()}
                onClick={handleRequestEmailChange}
                className="px-4 py-2.5 text-sm rounded-full bg-indigo-700 text-white disabled:opacity-50">
                {emailChangeSaving ? 'Sending...' : 'Send Email Verification Link'}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              <button type="button" disabled={credentialsSaving || !formData.newPassword}
                onClick={handleChangePassword}
                className="px-4 py-2.5 text-sm rounded-full bg-indigo-700 text-white disabled:opacity-50">
                {credentialsSaving ? 'Updating Password...' : 'Change Password'}
              </button>
              <p className="text-xs text-neutral-500 dark:text-neutral-300">Save Profile Changes only saves profile details. Use the separate buttons above for credentials.</p>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="bg-white dark:bg-[#151821] pt-4 pb-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="md" disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Profile Changes ✓'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={settingsSaving}
                onClick={() => setShowEditProfileModal(false)}
              >
                Cancel
              </Button>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleDownloadData}
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>Export Data</span>
            </Button>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="p-5 rounded-[20px] border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-sm font-bold text-rose-700 dark:text-rose-400 font-display">
                  Delete EduShare Account
                </h5>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  Permanently wipe your profile, verified badges, and unpublished draft guides.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditProfileModal(false);
                  setShowDeleteModal(true);
                }}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
