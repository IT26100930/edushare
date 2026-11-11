import {AdminModuleRequests} from '../components/AdminModuleRequests';
import {PendingTasksCard} from '../components/PendingTasksCard';
import {ResourceSellingSettings} from '../components/ResourceSellingSettings';
import {CatalogMaintenance} from '../components/CatalogMaintenance';
import {PlanDiscountEditor} from '../components/PlanDiscountEditor';
import { AdminUnifiedCatalog } from '../components/AdminUnifiedCatalog.tsx';
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  FileText,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  Flag,
  CreditCard,
  Bell,
  Settings,
  Search,
  Menu,
  ChevronRight,
  TrendingUp,
  Download,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Image,
  Upload,
  Sparkles,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Lock,
  Eye,
  Filter,
  RefreshCw,
  Sliders,
  Send,
  HelpCircle,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Card } from '../components/shared/Card.tsx';
import { Button } from '../components/Button.tsx';
import { Tag } from '../components/Tag.tsx';
import { Avatar } from '../components/shared/Avatar.tsx';
import { Badge } from '../components/shared/Badge.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { Input } from '../components/shared/Input.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { AdminResourceInspector } from '../components/AdminResourceInspector.tsx';
import { Resource } from '../data/models.ts';
import { matchesBrowseCategory } from '../utils/resourceCategories.ts';
interface AdminAccount {
  id: number; name: string; username: string; email: string; role: string; verified: boolean;
  suspended: boolean; premium: boolean; university: string; degree: string; avatar: string;
  cancellationScheduled: boolean; premiumUntil: string;
}

// Visual presets are bundled locally. Selecting one saves its URL in categories.txt.
const CATEGORY_COVER_PRESETS = [
  { label: 'Programming', src: '/images/category-presets/programming.svg' },
  { label: 'PDF Notes', src: '/images/category-presets/pdf-notes.svg' },
  { label: 'Video Lessons', src: '/images/category-presets/video-lessons.svg' },
  { label: 'Past Papers', src: '/images/category-presets/past-papers.svg' },
  { label: 'Cybersecurity', src: '/images/category-presets/cybersecurity.svg' },
  { label: 'Databases', src: '/images/category-presets/databases.svg' },
  { label: 'Networking', src: '/images/category-presets/networking.svg' },
  { label: 'AI & ML', src: '/images/category-presets/ai-ml.svg' },
  { label: 'Mathematics', src: '/images/category-presets/mathematics.svg' },
  { label: 'Study Circles', src: '/images/category-presets/study-circles.svg' },
] as const;

// Categories Configuration
interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string;
  altText: string;
}

interface AcademicModuleItem {
  id: number;
  code: string;
  name: string;
  facultySubject: string;
  active: boolean;
}

interface AdminCircle {
  id: number; name: string; moduleCode: string; description: string;
  schedule: string; badgeColor: string; meetingUrl: string;
  creatorId: number; creatorName: string; membersCount: number; postsCount: number;
}
interface AdminCircleMember { id: number; name: string; username: string; avatar: string; }
interface AdminCirclePost { id: number; groupId: number; userId: number; authorName: string; message: string; resourceUrl: string; createdAt: string; }

// Reports Configuration
interface ReportItem {
  id: string;
  resourceId?: number;
  type?: 'resource' | 'comment' | 'link';
  targetTitle: string;
  reportedBy: string;
  reason: string;
  severity?: 'high' | 'medium' | 'low';
  date: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'needs_evidence' | 'restored';
}

export const AdminPage: React.FC = () => {
  const location=useLocation();
  const {
    currentUser,
    users,
    resources,
    pendingNotes,
    pendingVerifications,
    approveNote,
    rejectNote,
    approveVerification,
    rejectVerification,
    addToast,
    sellabilityConfig: savedSellabilityConfig,
    sellingPolicyReady, sellingPolicySaving, sellingPolicyError,
    updateSellabilityConfig,
    approveResource,
    makeResourceFreeOnly,
    rejectResource,
    issueStrike,
    reverseEarnings,
  } = useApp();
  const [sellabilityConfig, setSellabilityConfig] = useState(savedSellabilityConfig);
  useEffect(() => { setSellabilityConfig(savedSellabilityConfig); }, [savedSellabilityConfig]);


  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'resources' | 'categories' | 'module-requests' | 'community' | 'reports' | 'plans' | 'announcements' | 'settings'
  >(new URLSearchParams(location.search).get('tab')==='module-requests'?'module-requests':'overview');
  useEffect(()=>{if(new URLSearchParams(location.search).get('tab')==='module-requests')setActiveTab('module-requests');},[location.search]);

  const [showOpenReportsOnly, setShowOpenReportsOnly] = useState(false);

  // Mobile sidebar drawer
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [savedAnnouncements, setSavedAnnouncements] = useState<Array<{id:string;title:string;message:string;type:string;audience:string;createdAt:string}>>([]);
  const [backendStats, setBackendStats] = useState<{users:number;resources:number;openRequests:number;reviews:number; downloads:number; demoPaymentTotal:number; pendingResources:number;pendingReports:number;pendingModuleRequests?:number;dailyDownloads:Record<string,number>;publicResources?:number;pendingLinks?:number;pendingDocuments?:number;rejectedResources?:number;hiddenLinks?:number;categoryCounts?:Record<string,number>;recentCatalog?:Array<{id:string;title:string;uploaderEmail:string;kind:string;status:string}>} | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [adminCircles, setAdminCircles] = useState<AdminCircle[]>([]);
  const [circleFilter, setCircleFilter] = useState('');
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [circleMembers, setCircleMembers] = useState<AdminCircleMember[]>([]);
  const [circlePosts, setCirclePosts] = useState<AdminCirclePost[]>([]);
  const [circleLoadError, setCircleLoadError] = useState('');
  const [circleBusy, setCircleBusy] = useState(false);
  const [circleSchedule, setCircleSchedule] = useState('');
  const [circleMeetingUrl, setCircleMeetingUrl] = useState('');
  const [circleName, setCircleName] = useState('');
  const [circleModule, setCircleModule] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [circleDeleteTarget, setCircleDeleteTarget] = useState<AdminCircle | null>(null);
  const [circleDeleteConfirm, setCircleDeleteConfirm] = useState('');
  const [circlePostToDelete, setCirclePostToDelete] = useState<AdminCirclePost | null>(null);

  const loadAdminCircles = async () => {
    try {
      const res = await fetch('/api/study-groups/admin', {credentials:'include', cache:'no-store'});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Could not load study circles (HTTP ${res.status})`);
      if (!Array.isArray(data)) throw new Error('Unexpected group list response.');
      setAdminCircles(data);
      setCircleLoadError('');
    } catch (error) {
      setCircleLoadError(error instanceof Error ? error.message : 'Could not load study circles.');
    }
  };
  const loadCircleDetails = async (groupId: number) => {
    try {
      const [membersResponse, postsResponse] = await Promise.all([
        fetch(`/api/study-groups/${groupId}/members`, {credentials:'include', cache:'no-store'}),
        fetch(`/api/study-groups/admin/${groupId}/posts`, {credentials:'include', cache:'no-store'}),
      ]);
      if (!membersResponse.ok || !postsResponse.ok) throw new Error('Could not load group members or messages.');
      setCircleMembers(await membersResponse.json());
      setCirclePosts(await postsResponse.json());
      setCircleLoadError('');
    } catch (error) {
      setCircleLoadError(error instanceof Error ? error.message : 'Could not load group details.');
    }
  };
  useEffect(() => {
    if (activeTab !== 'community' || currentUser?.role !== 'admin') return;
    void loadAdminCircles();
  }, [activeTab, currentUser?.id, currentUser?.role]);
  useEffect(() => {
    if (activeTab !== 'community' || selectedCircleId == null || currentUser?.role !== 'admin') return;
    void loadCircleDetails(selectedCircleId);
  }, [activeTab, selectedCircleId, currentUser?.id, currentUser?.role]);

  const selectAdminCircle = (circle: AdminCircle) => {
    setSelectedCircleId(circle.id);
    setCircleMembers([]);
    setCirclePosts([]);
    setCircleSchedule(circle.schedule);
    setCircleMeetingUrl(circle.meetingUrl || '');
    setCircleName(circle.name); setCircleModule(circle.moduleCode); setCircleDescription(circle.description);
    setCircleLoadError('');
  };
  const saveCircleDetails = async () => {
    if (selectedCircleId == null || circleBusy) return;
    setCircleBusy(true);
    try {
      const res = await fetch(`/api/study-groups/admin/${selectedCircleId}`, {
        method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:circleName.trim(),moduleCode:circleModule.trim(),description:circleDescription.trim()}),
      });
      const data=await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || `Update failed (HTTP ${res.status})`);
      await loadAdminCircles();
      addToast({title:'Study circle details updated',type:'success'});
    } catch (error) {addToast({title:error instanceof Error?error.message:'Could not update group',type:'error'});}
    finally {setCircleBusy(false);}
  };
  const saveCircleMeeting = async () => {
    if (selectedCircleId == null || circleBusy) return;
    setCircleBusy(true);
    try {
      const res = await fetch(`/api/study-groups/${selectedCircleId}/meeting`, {
        method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({schedule:circleSchedule.trim(), meetingUrl:circleMeetingUrl.trim()}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Save failed (HTTP ${res.status})`);
      await loadAdminCircles();
      addToast({title:'Meeting details updated', type:'success'});
    } catch (error) { addToast({title:error instanceof Error?error.message:'Could not update meeting', type:'error'}); }
    finally { setCircleBusy(false); }
  };
  const deleteAdminCircle = async () => {
    if (!circleDeleteTarget || circleBusy || circleDeleteConfirm !== circleDeleteTarget.name) return;
    setCircleBusy(true);
    try {
      const res = await fetch(`/api/study-groups/${circleDeleteTarget.id}`, {
        method:'DELETE', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({confirmationName:circleDeleteConfirm}),
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(data.error || `Delete failed (HTTP ${res.status})`);
      }
      if (selectedCircleId === circleDeleteTarget.id) {setSelectedCircleId(null);setCircleMembers([]);setCirclePosts([]);}
      setCircleDeleteTarget(null);setCircleDeleteConfirm('');
      await loadAdminCircles();
      addToast({title:'Study circle deleted',type:'success'});
    } catch (error) { addToast({title:error instanceof Error?error.message:'Could not delete circle',type:'error'}); }
    finally {setCircleBusy(false);}
  };
  const removeAdminCirclePost = async () => {
    if (!circlePostToDelete || selectedCircleId == null || circleBusy) return;
    setCircleBusy(true);
    try {
      const res = await fetch(`/api/study-groups/admin/${selectedCircleId}/posts/${circlePostToDelete.id}`, {
        method:'DELETE', credentials:'include',
      });
      if (!res.ok) {
        const data=await res.json().catch(()=>({}));
        throw new Error(data.error || `Remove message failed (HTTP ${res.status})`);
      }
      setCirclePostToDelete(null);
      await Promise.all([loadCircleDetails(selectedCircleId),loadAdminCircles()]);
      addToast({title:'Group message removed',type:'success'});
    } catch (error) {addToast({title:error instanceof Error?error.message:'Could not remove message',type:'error'});}
    finally {setCircleBusy(false);}
  };
  const selectedCircle = adminCircles.find(c => c.id === selectedCircleId) || null;
  const visibleAdminCircles = adminCircles.filter(c =>
    [c.name,c.moduleCode,c.creatorName,c.description].some(v => v.toLowerCase().includes(circleFilter.toLowerCase().trim()))
  );

  const [verificationRequests, setVerificationRequests] = useState<Array<{
    userId: number; name: string; email: string; university: string; degree: string;
    note: string; submittedAt: string; status: string;
  }>>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<Array<{
    userId: number; name: string; username: string; email: string; submittedAt: string; status: string;
  }>>([]);
  const [recoveryLoadError, setRecoveryLoadError] = useState('');
  const loadRecoveryRequests = async () => {
    try {
      const response = await fetch('/api/password-recovery/admin', {credentials:'include',cache:'no-store'});
      if (!response.ok) throw new Error(`Recovery requests could not load (HTTP ${response.status}).`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected recovery response.');
      setRecoveryRequests(data); setRecoveryLoadError('');
    } catch (error) { setRecoveryLoadError(error instanceof Error ? error.message : 'Recovery loading failed.'); }
  };
  const rejectRecoveryRequest = async (userId: number) => {
    try {
      const response = await fetch(`/api/password-recovery/admin/${userId}/reject`, {method:'POST', credentials:'include'});
      if (!response.ok) throw new Error('Could not reject request.');
      await loadRecoveryRequests();
      addToast({title:'Recovery request rejected',type:'info'});
    } catch (error) { addToast({title:error instanceof Error?error.message:'Could not reject request',type:'error'}); }
  };
  const [recoveryApproveUser, setRecoveryApproveUser] = useState<{userId:number;name:string;email:string}|null>(null);
  const [recoveryAdminPassword, setRecoveryAdminPassword] = useState('');
  const [issuedRecoveryCode, setIssuedRecoveryCode] = useState<{code:string;expiresAt:string;name:string}|null>(null);
  const [recoveryApproveBusy, setRecoveryApproveBusy] = useState(false);
  const approveRecoveryRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recoveryApproveUser || recoveryApproveBusy) return;
    setRecoveryApproveBusy(true);
    try {
      const response = await fetch(`/api/password-recovery/admin/${recoveryApproveUser.userId}/approve`, {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({adminPassword:recoveryAdminPassword}),
      });
      const data = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(data.error || `Approval failed (HTTP ${response.status}).`);
      setIssuedRecoveryCode({code:data.code, expiresAt:data.expiresAt, name:recoveryApproveUser.name});
      setRecoveryApproveUser(null); setRecoveryAdminPassword('');
      await loadRecoveryRequests();
      addToast({title:'Recovery code issued securely',type:'success'});
    } catch (error) {addToast({title:error instanceof Error?error.message:'Could not approve recovery',type:'error'});}
    finally {setRecoveryApproveBusy(false);}
  };
  const [verificationLoadError, setVerificationLoadError] = useState('');
  const [verificationRefreshing, setVerificationRefreshing] = useState(false);
  const loadVerificationRequests = async () => {
    setVerificationRefreshing(true);
    try {
      const response = await fetch('/api/verification/admin', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Could not load verification requests. Please sign in again or try later.`);
      }
      const requests = await response.json();
      if (!Array.isArray(requests)) throw new Error('Invalid verification requests response.');
      setVerificationRequests(requests);
      setVerificationLoadError('');
    } catch (error) {
      setVerificationLoadError(error instanceof Error ? error.message : 'Could not load verification requests.');
    } finally {
      setVerificationRefreshing(false);
    }
  };
  const reviewVerification = async (userId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/verification/admin/${userId}/${action}`, {
        method: 'POST', credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Could not save the review (HTTP ${response.status}).`);
      }
      await Promise.all([loadVerificationRequests(), loadAdminData()]);
      addToast({title: action === 'approve' ? 'Account approved' : 'Request rejected', type: 'success'});
    } catch { addToast({title: 'Review could not be saved', type: 'error'}); }
  };
  const [adminResources, setAdminResources] = useState<any[]>([]);
  const [resourceToDelete, setResourceToDelete] = useState<any | null>(null);
  const [resourceDeleteConfirm, setResourceDeleteConfirm] = useState('');
  const [resourceDeleteBusy, setResourceDeleteBusy] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('');
  const [inspectionResource, setInspectionResource] = useState<{id:number;title:string}|null>(null);
  const [adminLoadError, setAdminLoadError] = useState('');
  const loadAdminData = async () => {
    try {
      // Load each dashboard section independently. A reports or statistics error must
      // never hide newly registered users that are already saved in users.txt.
      const sections = [
        { label: 'Accounts', url: '/api/admin/accounts' },
        { label: 'Statistics', url: '/api/admin/stats' },
        { label: 'Resources', url: '/api/resources' },
        { label: 'Reports', url: '/api/reports/admin' },
      ];
      const results = await Promise.all(sections.map(async section => {
        try {
          const response = await fetch(section.url, {credentials:'include',cache:'no-store'});
          if (!response.ok) return {ok: false as const, error: `${section.label}: HTTP ${response.status}`, data: null};
          return {ok: true as const, error: '', data: await response.json()};
        } catch {
          return {ok: false as const, error: `${section.label}: connection failed`, data: null};
        }
      }));
      const [accountsResult, statsResult, resourcesResult, reportsResult] = results;
      if (accountsResult.ok && Array.isArray(accountsResult.data)) setAdminAccounts(accountsResult.data);
      if (statsResult.ok && statsResult.data) setBackendStats(statsResult.data);
      if (resourcesResult.ok && Array.isArray(resourcesResult.data)) setAdminResources(resourcesResult.data);
      if (reportsResult.ok && Array.isArray(reportsResult.data)) {
        setReportsList((reportsResult.data as any[]).map(r=>({...r, severity:'medium', type:r.resourceId < 0 ? 'link' : 'resource'})));
      }
      window.dispatchEvent(new Event('edushare:admin-refresh'));
      const failures = results.filter(r => !r.ok).map(r => r.error);
      setAdminLoadError(failures.length ? `Some data could not be refreshed: ${failures.join('; ')}. Please sign in again or retry.` : '');
    } catch (error) {setAdminLoadError(error instanceof Error ? error.message : 'Could not load administrator information. Please try again.');}
  };
  useEffect(() => { if(currentUser?.role==='admin') void loadAdminData(); }, [currentUser?.id,currentUser?.role]);
  useEffect(() => { if(currentUser?.role==='admin') void loadVerificationRequests(); }, [currentUser?.id,currentUser?.role]);
  // Reports submitted by students in another browser must appear without an admin logout.
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const onFocus = () => { if (!document.hidden) { void loadAdminData(); void loadVerificationRequests(); } };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (activeTab !== 'reports' || currentUser?.role !== 'admin') return;
    void loadAdminData();
    const refresh = window.setInterval(() => { if (!document.hidden) void loadAdminData(); }, 15000);
    return () => window.clearInterval(refresh);
  }, [activeTab, currentUser?.id, currentUser?.role]);

  // Keep the account roster synchronized across student/admin browser sessions.
  useEffect(() => {
    if (activeTab !== 'users' || currentUser?.role !== 'admin') return;
    void loadAdminData();
    const refresh = window.setInterval(() => {
      if (!document.hidden) { void loadAdminData(); void loadVerificationRequests(); void loadRecoveryRequests(); }
    }, 10000);
    void loadVerificationRequests(); void loadRecoveryRequests();
    return () => window.clearInterval(refresh);
  }, [activeTab, currentUser?.id, currentUser?.role]);

  const pendingBackendResources=adminResources.filter(r=>['PENDING','NEEDS_REVIEW'].includes(String(r.status||'').toUpperCase()));
  const displayCategories=Object.entries(backendStats?.categoryCounts || adminResources.reduce((result:Record<string,number>,r:any)=>{const label=String(r.category||'Uncategorized');result[label]=(result[label]||0)+1;return result;},{} as Record<string,number>)).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,10);
  const downloadDays=Object.entries(backendStats?.dailyDownloads || {});
  const downloadsMax=Math.max(1,...downloadDays.map(([,n])=>Number(n)));


  // ------------------------------------------
  // Category Management State
  // ------------------------------------------
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);

  useEffect(() => {
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        setCategoriesList(rows.map((row) => ({
          id: String(row.id), name: row.name, slug: String(row.name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: row.parentName ? `${row.parentName} / ${row.name}` : row.name, count: 0,
          image: row.image || '', altText: `${row.name} educational resources`,
        })));
      }).catch(() => {});
  }, []);


  // Academic module catalog managed by admins and used by the Share Resource form
  const [academicModules, setAcademicModules] = useState<AcademicModuleItem[]>([]);

  // Global Admin Search: search actual server-backed account, PDF, module, and category data.
  // Do not search fabricated demo results; loadAdminData() refreshes the first two indexes.
  const globalSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return [] as Array<{kind: 'user' | 'resource' | 'module' | 'category'; key: string; title: string; subtitle: string; filterValue: string}>;

    const matches = (...values: unknown[]) => values.some(value => String(value ?? '').toLocaleLowerCase().includes(query));
    const results: Array<{kind: 'user' | 'resource' | 'module' | 'category'; key: string; title: string; subtitle: string; filterValue: string}> = [];

    for (const account of adminAccounts) {
      if (matches(account.name, account.username, account.email, account.role, account.premium ? 'premium' : 'free')) {
        results.push({kind: 'user', key: `u-${account.id}`, title: account.name, subtitle: `@${account.username} · ${account.email}`, filterValue: account.email});
      }
    }
    for (const resource of adminResources) {
      if (matches(resource.title, resource.moduleCode, resource.category, resource.uploaderEmail, resource.type)) {
        results.push({kind: 'resource', key: `r-${resource.id}`, title: String(resource.title || 'Untitled resource'), subtitle: `${resource.moduleCode || resource.category || 'Resource'} · ${resource.uploaderEmail || 'Unknown author'}`, filterValue: String(resource.title || '')});
      }
    }
    for (const module of academicModules) {
      if (matches(module.code, module.name, module.facultySubject)) {
        results.push({kind: 'module', key: `m-${module.id}`, title: `${module.code} — ${module.name}`, subtitle: `Module · ${module.facultySubject}`, filterValue: module.code});
      }
    }
    for (const category of categoriesList) {
      if (matches(category.name, category.description)) {
        results.push({kind: 'category', key: `c-${category.id}`, title: category.name, subtitle: `Category · ${category.description}`, filterValue: category.name});
      }
    }
    return results.slice(0, 15);
  }, [searchQuery, adminAccounts, adminResources, academicModules, categoriesList]);

  const chooseGlobalSearchResult = (result: (typeof globalSearchResults)[number]) => {
    if (result.kind === 'user') {
      setUserSearch(result.filterValue);
      setActiveTab('users');
    } else if (result.kind === 'resource') {
      setResourceFilter(result.filterValue);
      setActiveTab('resources');
    } else {
      setActiveTab('categories');
      // Keep the query visible for reference in the category/module manager.
    }
    setSearchQuery('');
    setShowGlobalSearch(false);
  };

  const [moduleCodeInput, setModuleCodeInput] = useState('');
  const [moduleNameInput, setModuleNameInput] = useState('');
  const [moduleSubjectInput, setModuleSubjectInput] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);

  const loadAcademicModules = () => {
    fetch('/api/admin/modules', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((rows: AcademicModuleItem[]) => setAcademicModules(rows))
      .catch(() => {});
  };

  useEffect(() => { loadAcademicModules(); }, []);

  // Edit Category Image Modal State
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [imageModalTab, setImageModalTab] = useState<'library' | 'upload' | 'ai'>('library');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [selectedImageChoice, setSelectedImageChoice] = useState<string>('');

  // Add Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatAlt, setNewCatAlt] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  // ------------------------------------------
  // Users Management State
  // ------------------------------------------
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'creator' | 'admin'>('all');
  const [selectedUserAction, setSelectedUserAction] = useState<{
    user: AdminAccount;
    action: 'suspend' | 'activate' | 'verify' | 'unverify' | 'role_admin' | 'role_student' | 'plan_free' | 'delete';
  } | null>(null);

  // Admin-assisted password reset (student accounts only).
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminAccount | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [confirmStudentPassword, setConfirmStudentPassword] = useState('');
  const [adminPasswordConfirmation, setAdminPasswordConfirmation] = useState('');
  const [resetPasswordBusy, setResetPasswordBusy] = useState(false);

  const closeResetPassword = () => {
    if (resetPasswordBusy) return;
    setResetPasswordUser(null);
    setNewStudentPassword('');
    setConfirmStudentPassword('');
    setAdminPasswordConfirmation('');
  };

  // ------------------------------------------
  // Resources Moderation Queue State
  // ------------------------------------------
  const [activePreviewResource, setActivePreviewResource] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [targetRejectNoteId, setTargetRejectNoteId] = useState<string | null>(null);

  // ------------------------------------------
  // Reports Queue State
  // ------------------------------------------
  // Reports are intentionally not fabricated. A persisted reporting API is required before this queue is enabled.
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<{
    type: string; available: boolean; hidden?: boolean; sourceUrl?: string;
    resourceType?: string; resourceStatus?: string; uploaderEmail?: string; description?: string;
    evidence: Array<{date:string;url:string;details:string}>;
    history: Array<{date:string;action:string;note:string;actorId:string}>;
  } | null>(null);
  const [investigationError, setInvestigationError] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionBusy, setDecisionBusy] = useState(false);

  // ------------------------------------------
  // Plans & Pricing Editor State
  // ------------------------------------------
  const [planPrices, setPlanPrices] = useState({
    freeMonthly: 0,
    studentDiscountPercent: 20,
    premiumMonthly: 199,
    premiumSemester: 799,
    premiumYearly: 1499,
    batchMonthly: 1499,
    batchSemester: 5999,
    batchYearly: 11999,
    platformRoyaltyShare: 90, // % to student authors (10% fee)
  });

  // ------------------------------------------
  // Blocked Email Domains State
  // ------------------------------------------
  const [blockedDomains, setBlockedDomains] = useState<string[]>([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'disposablemail.org',
    'throwawaymail.com',
    'trashmail.net',
  ]);
  const [newDomainInput, setNewDomainInput] = useState('');

  // ------------------------------------------
  // Announcements Composer State
  // ------------------------------------------
  const [announcementTitle, setAnnouncementTitle] = useState('Final Examination Past Papers Released');
  const [announcementAudience, setAnnouncementAudience] = useState<'all' | 'premium' | 'tutors'>('all');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success'>('info');
  const [announcementEmailEnabled, setAnnouncementEmailEnabled] = useState(false);
  const [announcementBusy, setAnnouncementBusy] = useState(false);
  const [announcementDeliveryStatus, setAnnouncementDeliveryStatus] = useState('');
  const [announcementRetrying, setAnnouncementRetrying] = useState<string|null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState(
    'Semester 1 final examination papers for Computer Science & Information Technology faculties (2020–2024) are now fully indexed and verified.'
  );

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    fetch('/api/config/prices', { credentials: 'include', cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Prices unavailable')))
      .then(saved => setPlanPrices(old => ({ ...old, ...saved })))
      .catch(() => setAdminLoadError('Could not load saved pricing.'));
    fetch('/api/config/blocked-domains', { credentials: 'include', cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Blocked domains unavailable')))
      .then((domains: string[]) => setBlockedDomains(domains))
      .catch(() => setAdminLoadError('Could not load blocked email domains.'));
    fetch('/api/config/announcements', { credentials: 'include', cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(setSavedAnnouncements)
      .catch(() => {});
  }, [currentUser?.id, currentUser?.role]);

  // ==========================================
  // ACCESS DENIED GUARD: Mock Admin check
  // ==========================================
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="px-6 py-20 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-neutral-900 dark:text-neutral-100">
            Access Denied
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            The Admin Dashboard is available to authorized administrators only.
          </p>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 text-left font-mono">
            Current user: <strong className="text-[#FF4A00]">{currentUser?.name || 'Guest'}</strong> (Role: {currentUser?.role || 'none'})
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button to="/browse" variant="secondary" size="md">
            Return to Browse
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleOpenEditImage = (category: CategoryItem) => {
    setEditingCategory(category);
    setImageModalTab('library');
    setAiPrompt(
      `flat vector illustration of students learning ${category.name}, orange/blue/yellow palette`
    );
    setSelectedImageChoice(category.image);
  };

  const handleSaveCategoryImage = async () => {
    if (!editingCategory || !selectedImageChoice) return;
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({image:selectedImageChoice})
      });
      if(!response.ok) throw new Error('Category image could not be saved.');
      setCategoriesList(prev=>prev.map(c=>c.id===editingCategory.id?{...c,image:selectedImageChoice}:c));
      setEditingCategory(null);
      addToast({title:'Category visual saved',message:'Students can now see this cover in Browse.',type:'success'});
    }catch(error){addToast({title:'Save failed',message:error instanceof Error?error.message:'Please try again',type:'error'});}
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      addToast({
        title: 'Missing Fields',
        message: 'Please enter a category name.',
        type: 'warning',
      });
      return;
    }

    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      slug: newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: newCatDesc.trim() || 'University semester revision materials.',
      count: 0,
      image: newCatImage,
      altText: newCatAlt.trim(),
    };

    try {
      const response = await fetch('/api/admin/categories', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCat.name, parentName: 'IT', image: newCat.image }) });
      if (!response.ok) throw new Error('Could not save the category. Please try again.');
      const saved = await response.json();
      newCat.id = String(saved.id);
    } catch (error) {
      addToast({ title: 'Category save failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
      return;
    }

    setCategoriesList((prev) => [...prev, newCat]);
    setShowAddCategoryModal(false);
    setNewCatName('');
    setNewCatDesc('');
    setNewCatAlt('');
    setNewCatImage('');
    addToast({
      title: 'Category Created ✓',
      message: `${newCat.name} has been published to student search filters.`,
      type: 'success',
    });
  };

  const handleRenameCategory = async (category: CategoryItem) => {
    const proposed = window.prompt('Category name', category.name);
    if (proposed === null || proposed.trim() === category.name) return;
    const nextName = proposed.trim();
    if (!nextName) {
      addToast({ title: 'Name required', message: 'Enter a category name.', type: 'warning' });
      return;
    }
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({name: nextName}),
      });
      if (!response.ok) throw new Error('Category name could not be saved.');
      const saved = await response.json();
      setCategoriesList(items => items.map(item => item.id === category.id
        ? {...item, name: saved.name, slug: saved.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
        : item));
      addToast({title: 'Category updated', message: 'Browse filters will use the saved name.', type: 'success'});
    } catch (error) {
      addToast({title: 'Update failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error'});
    }
  };

  const handleDeleteCategory = async (category: CategoryItem) => {
    const confirmed = window.confirm(`Delete category "${category.name}"? This removes it from Browse filters. Existing resource records are not deleted.`);
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || 'Could not delete this category.');
      }
      setCategoriesList((items) => items.filter((item) => item.id !== category.id));
      addToast({title: 'Category deleted', message: `${category.name} was removed from the category list.`, type: 'success'});
    } catch (error) {
      addToast({title: 'Delete failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error'});
    }
  };

  const resetModuleForm = () => {
    setEditingModuleId(null);
    setModuleCodeInput('');
    setModuleNameInput('');
    setModuleSubjectInput('');
  };

  const handleSaveAcademicModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleCodeInput.trim() || !moduleNameInput.trim() || !moduleSubjectInput.trim()) {
      addToast({ title: 'Missing module details', message: 'Module code, name and faculty subject are required.', type: 'warning' });
      return;
    }
    const payload = {
      code: moduleCodeInput.trim().toUpperCase(),
      name: moduleNameInput.trim(),
      facultySubject: moduleSubjectInput.trim(),
      active: true,
    };
    const url = editingModuleId ? `/api/admin/modules/${editingModuleId}` : '/api/admin/modules';
    const method = editingModuleId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!response.ok) {
      addToast({ title: 'Module save failed', message: 'Please check the module details and try again.', type: 'error' });
      return;
    }
    await loadAcademicModules();
    addToast({ title: editingModuleId ? 'Module updated ✓' : 'Module added ✓', message: `${payload.code} is now available in the Share Resource form.`, type: 'success' });
    resetModuleForm();
  };

  const handleEditAcademicModule = (module: AcademicModuleItem) => {
    setEditingModuleId(module.id);
    setModuleCodeInput(module.code);
    setModuleNameInput(module.name);
    setModuleSubjectInput(module.facultySubject);
  };

  const handleDeleteAcademicModule = async (module: AcademicModuleItem) => {
    const response = await fetch(`/api/admin/modules/${module.id}`, { method: 'DELETE', credentials: 'include' });
    if (!response.ok) {
      addToast({ title: 'Could not delete module', message: 'Please try again.', type: 'error' });
      return;
    }
    setAcademicModules((prev) => prev.filter((m) => m.id !== module.id));
    if (editingModuleId === module.id) resetModuleForm();
    addToast({ title: 'Module removed', message: `${module.code} was removed from the student dropdown.`, type: 'info' });
  };

  const saveBlockedDomains = async (next: string[]) => {
    try {
      const response = await fetch('/api/config/blocked-domains', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error('Could not save email restrictions.');
      setBlockedDomains(await response.json());
      addToast({ title: 'Email restrictions saved', message: 'Registration rules updated on the server.', type: 'success' });
    } catch (error) {
      addToast({ title: 'Save failed', message: error instanceof Error ? error.message : 'Try again', type: 'error' });
    }
  };

  const handleAddBlockedDomain = () => {
    const domain = newDomainInput.trim().toLowerCase().replace(/^@/, '');
    if (!/^[a-z0-9][a-z0-9.-]{1,250}\.[a-z]{2,}$/.test(domain)) {
      addToast({ title: 'Invalid domain', message: 'Enter a domain such as example.com.', type: 'error' });
      return;
    }
    if (!blockedDomains.includes(domain)) void saveBlockedDomains([...blockedDomains, domain]);
    setNewDomainInput('');
  };

  const handleRemoveBlockedDomain = (domainToRemove: string) => {
    void saveBlockedDomains(blockedDomains.filter(d => d !== domainToRemove));
  };

  const loadInvestigation = async (reportId: string) => {
    setInvestigationId(reportId);
    setInvestigation(null);
    setInvestigationError('');
    setDecisionNote('');
    try {
      const response = await fetch(`/api/reports/admin/${reportId}/investigation`, {
        credentials: 'include', cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Could not load investigation (HTTP ${response.status}).`);
      setInvestigation(await response.json());
    } catch (error) {
      setInvestigationError(error instanceof Error ? error.message : 'Investigation unavailable.');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'takedown' | 'request' | 'restore') => {
    const note = decisionNote.trim();
    if (note.length < 10 || note.length > 1000) {
      addToast({title:'Decision reason required',message:'Write 10–1000 characters explaining your findings.',type:'warning'});
      return;
    }
    if (action === 'takedown' && !window.confirm('Hide this resource after reviewing the evidence?')) return;
    if (action === 'restore' && !window.confirm('Restore this taken-down resource?')) return;
    setDecisionBusy(true);
    try {
      const response=await fetch(`/api/reports/admin/${reportId}${action === 'restore' ? '/restore' : ''}`,{
        method: action === 'restore' ? 'POST' : 'PATCH',
        credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({status:action==='dismiss'?'dismissed':action==='request'?'needs_evidence':'resolved', note}),
      });
      if (!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error || `Report update failed (HTTP ${response.status}). Check your admin session and decision reason.`);}
      const decisionResult: {status:string;reportId:string;emailSent?:boolean}=await response.json();
      await loadAdminData();
      await loadInvestigation(reportId);
      const msg=action==='request'
        ? (decisionResult.emailSent ? 'Evidence request saved. Reporter received an in-app notification; SMTP accepted the email.' : 'Evidence request saved and visible in the reporter notification bell. Email delivery failed or is not configured.')
        : 'The decision and review note were saved to audit history.';
      addToast({title:'Decision saved',message:msg,type:action==='request'&&!decisionResult.emailSent?'warning':'success'});
    } catch(error) {
      addToast({title:'Could not review report',message:error instanceof Error?error.message:'Error',type:'error'});
    } finally { setDecisionBusy(false); }
  };

  const submitStudentPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resetPasswordUser || resetPasswordBusy) return;
    if (newStudentPassword.length < 8 || newStudentPassword.length > 128 ||
        !/[A-Za-z]/.test(newStudentPassword) || !/[0-9]/.test(newStudentPassword)) {
      addToast({title:'Password requirements', message:'Use 8–128 characters, including letters and numbers.', type:'error'});
      return;
    }
    if (newStudentPassword !== confirmStudentPassword) {
      addToast({title:'Passwords do not match', type:'error'});
      return;
    }
    if (!adminPasswordConfirmation) {
      addToast({title:'Confirm your administrator password', type:'error'});
      return;
    }
    setResetPasswordBusy(true);
    try {
      const response = await fetch(`/api/admin/accounts/${resetPasswordUser.id}/reset-password`, {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({adminPassword:adminPasswordConfirmation, newPassword:newStudentPassword}),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || `Reset failed (${response.status})`);
      }
      await loadRecoveryRequests();
      setResetPasswordUser(null);
      setNewStudentPassword('');
      setConfirmStudentPassword('');
      setAdminPasswordConfirmation('');
      addToast({title:'Student password reset', message:'Password saved securely. Share the new password privately with the student.', type:'success'});
    } catch (error) {
      addToast({title:'Password reset failed', message:error instanceof Error ? error.message : 'Please retry.', type:'error'});
    } finally {
      setResetPasswordBusy(false);
    }
  };

  const handleConfirmUserAction = async () => {
    if (!selectedUserAction) return;
    const {user,action}=selectedUserAction;
    try {
      const response=await fetch(`/api/admin/accounts/${user.id}`,{
        method:action==='delete'?'DELETE':'PATCH', credentials:'include',
        headers:{'Content-Type':'application/json'},
        ...(action!=='delete'?{body:JSON.stringify({action})}:{})
      });
      if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||`Server rejected action (${response.status})`);}
      await loadAdminData(); setSelectedUserAction(null);
      addToast({title:'Account updated',message:`${user.name}: account changes saved.`,type:'success'});
    } catch(error){addToast({title:'Action failed',message:error instanceof Error?error.message:'Please retry',type:'error'});}
  };

  const moderateBackendResource = async (resourceId:number, status:'APPROVED'|'REJECTED') => {
    try {
      const response=await fetch(`/api/admin/resources/${resourceId}/status`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
      if(!response.ok) throw new Error('Could not save the review decision. Please try again.');
      await loadAdminData();
      addToast({title:'Moderation saved',message:`Resource #${resourceId}: ${status}.`,type:'success'});
    }catch(error){addToast({title:'Moderation failed',message:error instanceof Error?error.message:'Error',type:'error'});}
  };

  const deleteBackendResource = async () => {
    if (!resourceToDelete || resourceDeleteConfirm !== 'DELETE' || resourceDeleteBusy) return;
    setResourceDeleteBusy(true);
    try {
      const response = await fetch(`/api/admin/resources/${resourceToDelete.id}`, {
        method: 'DELETE', credentials: 'include', cache: 'no-store'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Delete failed (HTTP ${response.status}).`);
      }
      // Check the server again rather than removing a card optimistically.
      const verify = await fetch(`/api/resources/${resourceToDelete.id}`, {
        credentials: 'include', cache: 'no-store'
      });
      if (verify.status !== 404) throw new Error('Delete response received, but the resource is still available. Please refresh and retry.');
      setResourceToDelete(null);
      setResourceDeleteConfirm('');
      await loadAdminData();
      addToast({ title: 'Resource removed', message: 'Removed from saved resources and the public Browse catalog.', type: 'success' });
    } catch (error) {
      addToast({ title: 'Could not delete resource', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally { setResourceDeleteBusy(false); }
  };

  const handleConfirmRejectNote = () => {
    if (!targetRejectNoteId) return;
    rejectNote(targetRejectNoteId);
    setShowRejectModal(false);
    setTargetRejectNoteId(null);
    setRejectReason('');
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (announcementBusy) return;
    if (announcementAudience==='tutors' && announcementEmailEnabled) {
      setAnnouncementDeliveryStatus('Tutor email audience is not configured. Choose All or Premium.');return;
    }
    if (announcementEmailEnabled && !window.confirm('Publish this announcement and send one email to every eligible verified account in the selected audience?')) return;
    setAnnouncementBusy(true);setAnnouncementDeliveryStatus('');
    try {
      const response = await fetch('/api/config/announcements', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announcementTitle, message: announcementMessage,
          audience: announcementAudience, type: announcementType, sendEmail: announcementEmailEnabled }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Announcement could not be saved.');
      const saved: {id:string;title:string;message:string;audience:string;type:string;createdAt:string;emailSummary?:{sent:number;failed:number;skipped:number}} = await response.json();
      setSavedAnnouncements(old => [saved, ...old]);
      const result=saved.emailSummary;
      const summary=announcementEmailEnabled ? `Emails attempted: ${result?.sent||0} sent; ${result?.failed||0} failed; ${result?.skipped||0} skipped. Inbox delivery is not guaranteed.` : 'In-app notifications published; email sending was not selected.';
      setAnnouncementDeliveryStatus(summary);
      setAnnouncementEmailEnabled(false);
      addToast({ title: 'Announcement published', message: summary, type: 'success' });
    } catch (error) {
      addToast({ title: 'Publish failed', message: error instanceof Error ? error.message : 'Try again', type: 'error' });
    } finally {setAnnouncementBusy(false)}
  };

  const retryAnnouncementEmail = async (id:string) => {
    if(announcementRetrying) return;
    if(!window.confirm('Retry emails to eligible users who do not have a successful delivery recorded? Already-sent recipients will be skipped.'))return;
    setAnnouncementRetrying(id);setAnnouncementDeliveryStatus('');
    try {
      const r=await fetch(`/api/config/announcements/${encodeURIComponent(id)}/retry-email`,{method:'POST',credentials:'include'});
      if(!r.ok)throw new Error('Email retry request failed.');
      const result:{sent:number;failed:number;skipped:number}=await r.json();
      setAnnouncementDeliveryStatus(`Retry: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped.`);
    }catch(e){setAnnouncementDeliveryStatus(e instanceof Error?e.message:'Email retry failed.')}
    finally{setAnnouncementRetrying(null)}
  };

  const handleSavePlanPrices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/config/prices', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planPrices),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not save prices.');
      const saved = await response.json();
      setPlanPrices(old => ({ ...old, ...saved }));
      addToast({ title: 'Pricing saved', message: 'Updated prices are now shown on the Pricing page and at checkout.', type: 'success' });
    } catch (error) {
      addToast({ title: 'Pricing save failed', message: error instanceof Error ? error.message : 'Try again', type: 'error' });
    }
  };

  useEffect(()=>{
    if(currentUser?.role!=='admin')return;
    const controller=new AbortController();
    const refresh=()=>{void fetch('/api/admin/stats',{credentials:'include',cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(stats=>{if(stats&&!controller.signal.aborted)setBackendStats(stats);}).catch(()=>{});};
    const timer=window.setInterval(refresh,15000);window.addEventListener('focus',refresh);
    return()=>{controller.abort();window.clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[currentUser?.id,currentUser?.role]);

  // Nav items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: adminAccounts.length },
    { id: 'resources', label: 'Resources Queue', icon: BookOpen, badge: pendingBackendResources.length },
    { id: 'categories', label: 'Categories & Modules', icon: FolderTree, badge: academicModules.length },
    { id: 'module-requests', label: 'Module requests', icon: FolderTree, badge: backendStats?.pendingModuleRequests ?? 0 },
    { id: 'community', label: 'Community Groups', icon: Users, badge: adminCircles.length },
    { id: 'reports', label: 'Reports', icon: Flag, badge: reportsList.filter((r) => r.status === 'pending' || r.status === 'needs_evidence').length },
    { id: 'plans', label: 'Plans & Pricing', icon: CreditCard },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'settings', label: 'Security & Settings', icon: Settings },
  ];

  return (
    <div className="admin-shell flex min-h-[85vh] bg-white dark:bg-[#151821] rounded-[8px] overflow-hidden">
      {/* 1. LEFT SIDEBAR (Desktop Fixed, Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-[#E8E2D6] dark:border-neutral-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Sidebar Header Brand */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Link to="/" aria-label="EduShare home" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4A00]">
                <span className="w-9 h-9 shrink-0 rounded-[10px] bg-[#FF4A00] flex items-center justify-center text-white shadow-sm">
                  <MessageSquare aria-hidden="true" className="w-5 h-5 fill-white stroke-none" />
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#111111] dark:text-neutral-100 font-display">EduShare</span>
              </Link>
              <span className="block text-sm font-semibold text-neutral-600 dark:text-neutral-300">Admin Dashboard</span>
            </div>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 lg:hidden text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FF4A00] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Moderator Profile */}
        <div className="p-4 border-t border-[#E8E2D6] dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar src={currentUser?.avatar} name={currentUser?.name || 'Admin'} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold uppercase">
                  Faculty Moderator
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="p-1.5 text-neutral-400 hover:text-[#FF4A00] transition-colors"
              title="View Profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar Bar: Search, Mobile Toggle, Role Switcher */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#151821]/90 backdrop-blur-md border-b border-[#E8E2D6] dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 lg:hidden cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Global Admin Search: searchable data and actionable results */}
            <div className="relative w-56 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-300 pointer-events-none" />
              <input
                type="search"
                aria-label="Search admin students, resources, modules and categories"
                autoComplete="off"
                value={searchQuery}
                onFocus={() => setShowGlobalSearch(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setShowGlobalSearch(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowGlobalSearch(false);
                  if (e.key === 'Enter' && globalSearchResults.length) {
                    e.preventDefault();
                    chooseGlobalSearchResult(globalSearchResults[0]);
                  }
                }}
                placeholder="Search students, resources, modules..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:ring-2 focus:ring-[#FF4A00] outline-none"
              />
              {showGlobalSearch && searchQuery.trim() && (
                <div role="region" aria-label="Admin search results" className="absolute left-0 top-full mt-2 z-50 w-[min(90vw,440px)] max-h-96 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl">
                  <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                    {globalSearchResults.length} matching result{globalSearchResults.length === 1 ? '' : 's'} (up to 15)
                  </div>
                  {globalSearchResults.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-500 dark:text-neutral-300">No matching students, PDF resources, modules or categories.</div>
                  ) : globalSearchResults.map(result => (
                    <button
                      type="button"
                      key={result.key}
                      onClick={() => chooseGlobalSearchResult(result)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-neutral-800 border-b last:border-b-0 border-neutral-100 dark:border-neutral-800"
                    >
                      <span className="shrink-0 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] uppercase font-semibold px-2 py-1">{result.kind}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{result.title}</span>
                        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-300">{result.subtitle}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              to="/browse"
              className="text-xs"
            >
              <span>Student View</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="p-4 sm:p-8 space-y-8 flex-1">
          {adminLoadError && <div className="rounded-xl border border-rose-400 bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{adminLoadError}</div>}
          <div className="flex justify-end"><button onClick={()=>void loadAdminData()} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"><RefreshCw className="w-3 h-3"/> Refresh data</button></div>
          {/* ==================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top KPI Cards with Count-up */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-1">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-300">
                    <span className="text-xs uppercase font-bold tracking-wider">Total Users</span>
                    <Users className="w-4 h-4 text-[#1E6FEB]" />
                  </div>
                  <div className="text-3xl font-extrabold font-display text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {backendStats?.users ?? '—'}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Registered accounts</span>
                  </p>
                </Card>

                <Card variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-1">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-300">
                    <span className="text-xs uppercase font-bold tracking-wider">Catalog Resources</span>
                    <BookOpen className="w-4 h-4 text-[#FF4A00]" />
                  </div>
                  <div className="text-3xl font-extrabold font-display text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {backendStats?.resources ?? '—'} Resources
                  </div>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-300">
                    {backendStats?.publicResources ?? 0} public · {backendStats?.pendingResources ?? 0} in review · {backendStats?.rejectedResources ?? 0} rejected · {backendStats?.hiddenLinks ?? 0} links hidden
                  </p>
                </Card>

                <Card variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-1">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-300">
                    <span className="text-xs uppercase font-bold tracking-wider">Demo Payment Total</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold font-display text-[#FF4A00] tabular-nums">
                    Rs. {backendStats?.demoPaymentTotal?.toLocaleString() ?? '—'}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-300">
                    Simulated checkout only · not real revenue
                  </p>
                </Card>

                <PendingTasksCard
                  counts={backendStats}
                  onModules={() => {setActiveTab('module-requests');window.scrollTo({top:0,behavior:'smooth'});}}
                  onResources={() => {setActiveTab('resources'); window.scrollTo({top: 0, behavior: 'smooth'});}}
                  onReports={() => {setShowOpenReportsOnly(true); setActiveTab('reports'); window.scrollTo({top: 0, behavior: 'smooth'});}}
                />
              </div>

              {/* Charts Section: Animated Line Chart (Downloads, 30 days) + Bar Chart (Uploads per Category) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. Animated Line Chart (30 Days Downloads) */}
                <Card variant="white" hoverable={false} className="lg:col-span-7 p-6 border-[#E8E2D6] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                        Daily Student Downloads (Last 30 Days)
                      </h4>
                      <p className="text-xs text-neutral-400 dark:text-neutral-300">
                        PDF downloads
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                      {backendStats?.downloads ?? '—'} Total
                    </span>
                  </div>

                  <div className="h-52 flex items-end gap-px border-b border-neutral-200 dark:border-neutral-700 py-3" aria-label="Daily downloads for the past 30 days">
                    {downloadDays.map(([day,count])=>(
                      <div title={`${day}: ${count} downloads`} key={day} className="flex-1 bg-[#FF4A00] rounded-t-sm min-w-[3px]" style={{height:`${Math.max(2,Number(count)/downloadsMax*100)}%`}}/>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-300"><span>30 days ago</span><span>Today</span></div>
                </Card>

                {/* 2. Bar Chart (Uploads per Category) */}
                <Card variant="white" hoverable={false} className="lg:col-span-5 p-6 border-[#E8E2D6] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                        Uploads per Faculty Category
                      </h4>
                      <p className="text-xs text-neutral-400 dark:text-neutral-300">
                        Distribution across IT syllabus subjects
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {displayCategories.map(([name,count],i) => ({name,count:Number(count),max:Math.max(1,Number(displayCategories[0]?.[1]||1)),color:['bg-[#FF4A00]','bg-[#FFB31F]','bg-[#1E6FEB]','bg-[#263577]','bg-emerald-500'][i%5]})).map((bar) => (
                      <div key={bar.name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-neutral-700 dark:text-neutral-300">{bar.name}</span>
                          <span className="font-mono text-neutral-500 dark:text-neutral-300">{bar.count} files</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div
                            style={{ width: `${(bar.count / bar.max) * 100}%` }}
                            className={`h-full ${bar.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Recent Activity Feed + Pending Uploads Mini Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Pending Uploads Mini Table */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF4A00]" />
                      <span>Pending Uploads Moderation</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('resources')}
                      className="text-xs font-bold text-[#FF4A00] hover:underline"
                    >
                      View All Queue &rarr;
                    </button>
                  </div>

                  <div className="rounded-[20px] border border-[#E8E2D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-[#E8E2D6] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold">
                        <tr>
                          <th className="p-3.5">Resource</th>
                          <th className="p-3.5">Author</th>
                          <th className="p-3.5">Model</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {(backendStats?.pendingLinks || 0)>0 && <p className="text-sm text-amber-700 dark:text-amber-300">{backendStats?.pendingLinks} links need review. Open All Resources below and select Links needing review.</p>}
                {pendingBackendResources.length===0 && <tr><td colSpan={4} className="p-5 text-neutral-500 dark:text-neutral-300">No pending uploads.</td></tr>}
                        {pendingBackendResources.slice(0, 3).map((note) => (
                          <tr key={note.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                            <td className="p-3.5">
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                                {note.title}
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono dark:text-neutral-300">
                                {note.category} &bull; {note.pages || 'Unknown'} pages
                              </div>
                            </td>
                            <td className="p-3.5 text-neutral-600 dark:text-neutral-300 font-medium">
                              {note.uploaderEmail || 'Unknown'}
                            </td>
                            <td className="p-3.5">
                              <Badge type={note.priceType} size="sm" />
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              {['PENDING','NEEDS_REVIEW'].includes(String(note.status).toUpperCase()) ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setInspectionResource({id:Number(note.id),title:note.title||'Resource'})}
                                    className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setInspectionResource({id:Number(note.id),title:note.title||'Resource'})}
                                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-neutral-400 capitalize dark:text-neutral-300">
                                  {note.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1E6FEB]" />
                    <span>Recent Catalog Resources</span>
                  </h4>

                  <Card variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-3">
                    {(backendStats?.recentCatalog || adminResources.slice(-4).reverse()).map((r:any)=>({action:`${r.kind || 'PDF'} · ${r.status || 'In catalog'}`,desc:`${r.title} · ${r.uploaderEmail || 'Unknown uploader'}`,time:`#${r.id}`,color:'text-[#FF4A00]'})).map((act, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs border-b border-neutral-100 dark:border-neutral-800 last:border-none pb-2.5 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-[#FF4A00] mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="font-bold text-neutral-800 dark:text-neutral-200">
                            {act.action}
                          </div>
                          <div className="text-neutral-500 text-[11px] dark:text-neutral-300">{act.desc}</div>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono dark:text-neutral-300">{act.time}</span>
                      </div>
                    ))}
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: USERS */}
          {/* ==================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                    User Accounts ({adminAccounts.length})
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Manage accounts and review verification requests.
                  </p>
                </div>

                <Link to="/admin/register" className="inline-flex items-center gap-2 rounded-full bg-[#FF4A00] text-white px-4 py-2.5 font-semibold text-sm shrink-0"><UserCheck className="w-4 h-4" />Add Administrator</Link>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  <div className="relative w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-300" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Filter by name, @username..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-[#FF4A00] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-bold text-neutral-900 dark:text-white">Account Review Requests ({verificationRequests.length})</h4>
                  <button type="button" onClick={() => void loadVerificationRequests()} disabled={verificationRefreshing}
                    className="rounded-full px-4 py-2 text-xs font-semibold border border-orange-500 text-orange-600 dark:text-orange-400 disabled:opacity-50">
                    {verificationRefreshing ? 'Refreshing...' : 'Refresh Requests'}
                  </button>
                </div>
                {verificationLoadError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{verificationLoadError}</p>}
                {!verificationLoadError && verificationRequests.length === 0 && <p className="text-xs text-neutral-600 dark:text-neutral-300">No pending requests.</p>}
                {verificationRequests.map(item => (
                  <div key={item.userId} className="flex flex-col sm:flex-row gap-3 justify-between border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    <div className="text-xs text-neutral-700 dark:text-neutral-200">
                      <strong>{item.name}</strong> · {item.email}
                      <p>{item.university || 'University not specified'} · {item.degree || 'Degree not specified'}</p>
                      {item.note && <p className="mt-1">Message: {item.note}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => void reviewVerification(item.userId, 'approve')} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-semibold">Approve</button>
                      <button onClick={() => void reviewVerification(item.userId, 'reject')} className="px-4 py-2 border border-neutral-400 rounded-full text-xs text-neutral-900 dark:text-white">Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin-assisted student password recovery queue */}
              <div className="rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-bold text-neutral-900 dark:text-white">Password Recovery Requests ({recoveryRequests.length})</h4>
                  <button type="button" onClick={()=>void loadRecoveryRequests()} className="rounded-full border border-orange-500 px-4 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400">Refresh Recovery Requests</button>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">Verify the student’s identity using a separate trusted channel. Approve to issue a one-time code (valid 30 minutes), then privately share it. The student chooses their own password at /reset-password. No email is sent.</p>
                {recoveryLoadError && <p role="alert" className="text-sm text-red-600">{recoveryLoadError}</p>}
                {!recoveryLoadError && recoveryRequests.length === 0 && <p className="text-xs text-neutral-500 dark:text-neutral-400">No pending password recovery requests.</p>}
                {recoveryRequests.map(item => (
                  <div key={item.userId} className="flex flex-col sm:flex-row gap-3 justify-between border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    <div className="text-xs text-neutral-700 dark:text-neutral-200">
                      <strong>{item.name}</strong> · @{item.username} · {item.email}
                      <p className="text-neutral-500 dark:text-neutral-400">Requested {item.submittedAt}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={()=>{
                        setRecoveryApproveUser({userId:item.userId,name:item.name,email:item.email});
                        setRecoveryAdminPassword('');
                      }} className="px-4 py-2 bg-[#FF4A00] text-white rounded-full text-xs font-semibold">Approve & Issue Code</button>
                      <button type="button" onClick={()=>void rejectRecoveryRequest(item.userId)} className="px-4 py-2 border border-neutral-400 text-neutral-900 dark:text-white rounded-full text-xs">Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Users Clean Zebra-Free Table */}
              <div className="rounded-[22px] border border-[#E8E2D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-[#E8E2D6] dark:border-neutral-700 font-bold text-neutral-600 dark:text-neutral-300">
                    <tr>
                      <th className="p-4">Undergraduate</th>
                      <th className="p-4">University & Degree</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {adminAccounts
                      .filter((u) => {
                        const q = userSearch.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.username.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={u.avatar} name={u.name} isVerified={u.verified} size="sm" />
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono dark:text-neutral-300">
                                  @{u.username} &bull; {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-600 dark:text-neutral-400">
                            <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {u.university}
                            </div>
                            <div className="text-[11px]">{u.degree}</div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                u.premium
                                  ? 'bg-[#FF4A00] text-white'
                                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                              }`}
                            >
                              {u.premium ? (u.cancellationScheduled ? 'Premium · Ending' : 'Premium') : 'Free'}
                            </span>
                            {u.cancellationScheduled && u.premium && <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">Cancellation scheduled · until {u.premiumUntil}</div>}
                          </td>
                          <td className="p-4 font-mono font-semibold capitalize text-neutral-700 dark:text-neutral-300">
                            {u.role}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                                u.verified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : !u.verified
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {u.verified?'Approved':'Unverified'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${u.suspended?'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-200':'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'}`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{u.suspended ? 'Suspended' : 'Active'}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button onClick={()=>setSelectedUserAction({user:u,action:u.verified?'unverify':'verify'})} className="px-2.5 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs">{u.verified?'Unverify':'Approve'}</button>
                              <button onClick={()=>setSelectedUserAction({user:u,action:u.suspended?'activate':'suspend'})} disabled={String(u.id)===String(currentUser?.id).replace('backend-user-','')} className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs disabled:opacity-40">{u.suspended?'Reactivate':'Suspend'}</button>
                              <button onClick={()=>setSelectedUserAction({user:u,action:u.role==='ADMIN'?'role_student':'role_admin'})} disabled={String(u.id)===String(currentUser?.id).replace('backend-user-','')} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs disabled:opacity-40">{u.role==='ADMIN'?'Make Student':'Make Admin'}</button>
                              {u.role.toUpperCase() === 'STUDENT' && <button type="button" onClick={() => {setResetPasswordUser(u);setNewStudentPassword('');setConfirmStudentPassword('');setAdminPasswordConfirmation('');}} className="px-2.5 py-1 rounded-full border border-indigo-400 text-indigo-700 dark:text-indigo-300 text-xs" title="Set a new password for this student">Reset Password</button>}
                              {u.premium && <button onClick={()=>setSelectedUserAction({user:u,action:'plan_free'})} className="px-2.5 py-1 rounded-full border border-orange-400 text-orange-700 dark:text-orange-300 text-xs" title="Immediately end this demo Premium membership">Set Free Now</button>}
                              <button onClick={()=>setSelectedUserAction({user:u,action:'delete'})} disabled={String(u.id)===String(currentUser?.id).replace('backend-user-','')} className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs disabled:opacity-40">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: RESOURCES MODERATION QUEUE */}
          {/* ==================================================== */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                    Resource Moderation Queue
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Review each resource before approving or rejecting it. Check the content and source before making a decision.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {(backendStats?.pendingLinks || 0)>0 && <p className="text-sm text-amber-700 dark:text-amber-300">{backendStats?.pendingLinks} links need review. Open All Resources below and select Links needing review.</p>}
                {pendingBackendResources.length===0 && <p className="text-sm text-neutral-500 dark:text-neutral-300 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">No PDF documents pending moderation.</p>}
                {pendingBackendResources.map((res) => (
                    <Card
                      key={res.id}
                      variant="white"
                      hoverable={false}
                      className="p-5 border-[#E8E2D6] space-y-4"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag variant="peach" className="text-[10px] py-0.5">
                            {res.category}
                          </Tag>
                          <Badge type={res.priceType} size="sm" />
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                              (res.aiBadge || 'Needs review') === 'Looks original'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.aiBadge === 'Needs review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {res.status || 'Pending'}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-500 font-mono dark:text-neutral-300">
                          Storage Status: <strong className="text-emerald-600">{res.status || 'Unknown'}</strong>
                        </div>
                      </div>

                      {/* Main Resource Info */}
                      <div>
                        <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                          {res.title}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed dark:text-neutral-300">
                          Author: <strong className="text-neutral-800 dark:text-neutral-200">{res.uploaderEmail || 'Unknown'}</strong>   &bull; Type: <span className="font-mono text-[#FF4A00]">{res.resourceType}</span> &bull; Target Price: Rs. {res.price}
                        </p>
                      </div>

                      {/* AI Reason & Keyword Flags */}
                      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1.5">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#FF4A00]" />
                          <span>Manual Review Notice:</span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400">No automated copyright or similarity assessment has been performed.</p>

                      </div>

                      {/* Admin Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={() => setInspectionResource({id:Number(res.id),title:res.title})}
                          className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          Inspect & Decide
                        </button>
                        <button
                          onClick={() => setInspectionResource({id:Number(res.id),title:res.title})}
                          className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                        >
                          Review Details
                        </button>

                      </div>
                    </Card>
                  ))}
              </div>

              <CatalogMaintenance onChanged={loadAdminData}/>
              <AdminUnifiedCatalog onChanged={loadAdminData} onDeletePDF={resource => { setResourceToDelete(resource); setResourceDeleteConfirm(''); }} />
              <AdminResourceInspector resource={inspectionResource} onClose={()=>setInspectionResource(null)} onChanged={loadAdminData} />
              <Modal isOpen={!!resourceToDelete} onClose={()=>{if(!resourceDeleteBusy){setResourceToDelete(null);setResourceDeleteConfirm('');}}}
                title="Delete saved resource" description="This will remove the resource from the catalog for every user. The original uploaded file is kept for backup.">
                <div className="space-y-4">
                  <p className="font-semibold break-words text-neutral-900 dark:text-white">{resourceToDelete?.title}</p>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Type DELETE to confirm
                    <input autoFocus value={resourceDeleteConfirm} onChange={e=>setResourceDeleteConfirm(e.target.value)} placeholder="DELETE"
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"/>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>{setResourceToDelete(null);setResourceDeleteConfirm('');}} disabled={resourceDeleteBusy} className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600">Cancel</button>
                    <button onClick={()=>void deleteBackendResource()} disabled={resourceDeleteConfirm!=='DELETE'||resourceDeleteBusy}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50">{resourceDeleteBusy?'Deleting...':'Delete Resource'}</button>
                  </div>
                </div>
              </Modal>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: CATEGORIES MANAGEMENT */}
          {/* ==================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                    Subjects & Academic Modules
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Manage subjects, cover images and modules. Cover images also appear on Browse subject cards.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddCategoryModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Add Subject</span>
                </Button>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoriesList.length === 0 && (
                  <p className="col-span-full rounded-xl border border-dashed border-neutral-400 p-8 text-sm text-neutral-600 dark:text-neutral-300">
                    No categories yet. Add your first category to display it in Browse.
                  </p>
                )}
                {categoriesList.map((cat) => (
                  <Card
                    key={cat.id}
                    variant="white"
                    hoverable={false}
                    className="p-5 border-[#E8E2D6] space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Category Cover Image Display */}
                      <div className="h-32 rounded-[16px] bg-[#FDE7E0] dark:bg-neutral-800 overflow-hidden relative flex items-center justify-center border border-[#E8E2D6] dark:border-neutral-700 mb-3">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.altText} className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-xs text-neutral-500 dark:text-neutral-300">No cover image</span>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-mono text-[10px]">
                          {resources.filter(r => matchesBrowseCategory(r, cat.name)).length} resources
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed dark:text-neutral-300">
                        {cat.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-300">/{cat.slug}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEditImage(cat)}
                      >
                        <Image className="w-3.5 h-3.5 mr-1 text-[#FF4A00]" />
                        <span>Edit Image</span>
                      </Button>
                      <button type="button" onClick={() => void handleRenameCategory(cat)}
                        className="ml-2 rounded-full px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" />Rename
                      </button>
                      <button type="button" onClick={() => void handleDeleteCategory(cat)}
                        className="ml-2 rounded-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950"
                        aria-label={`Delete ${cat.name} category`}>
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Academic Modules Manager */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold font-display text-neutral-900 dark:text-neutral-100">Academic Modules</h4>
                    <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-300">Add or update missing module codes. Active modules appear automatically in the Share Resource form.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveAcademicModule} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <Input label="Module Code" value={moduleCodeInput} onChange={(e) => setModuleCodeInput(e.target.value)} placeholder="e.g. IT1010" required />
                  <Input label="Module Name" value={moduleNameInput} onChange={(e) => setModuleNameInput(e.target.value)} placeholder="e.g. Introduction to Programming" required />
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Category</label>
                    <select required value={moduleSubjectInput} onChange={e => setModuleSubjectInput(e.target.value)}
                      className="w-full rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-4 py-3 text-sm">
                      <option value="">Choose a category</option>
                      {categoriesList.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="sm">
                      <Plus className="w-4 h-4 mr-1" />{editingModuleId ? 'Update Module' : 'Add Module'}
                    </Button>
                    {editingModuleId && <Button type="button" variant="secondary" size="sm" onClick={resetModuleForm}>Cancel</Button>}
                  </div>
                </form>

                <div className="overflow-x-auto rounded-2xl border border-[#E8E2D6] dark:border-neutral-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      <tr><th className="p-3">Code</th><th className="p-3">Module Name</th><th className="p-3">Faculty Subject</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {academicModules.map((module) => (
                        <tr key={module.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="p-3 font-mono font-bold text-[#FF4A00]">{module.code}</td>
                          <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">{module.name}</td>
                          <td className="p-3 text-neutral-600 dark:text-neutral-300">{module.facultySubject}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span></td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEditAcademicModule(module)} className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold hover:text-[#FF4A00] flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                              <button onClick={() => handleDeleteAcademicModule(module)} className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: REPORTS QUEUE */}
          {/* ==================================================== */}
          {activeTab === 'community' && (
            <section className="space-y-5 text-neutral-900 dark:text-white">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold">Community Management</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-300">Review study circles, members and discussions. Only admins may moderate from here.</p>
                </div>
                <button type="button" onClick={()=>void loadAdminCircles()} className="inline-flex gap-2 items-center rounded-full border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
                  <RefreshCw className="w-4 h-4"/> Refresh Groups
                </button>
              </div>
              {circleLoadError && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950 p-3 text-sm text-rose-700 dark:text-rose-200">{circleLoadError}</p>}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,1.6fr)] gap-5">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900 space-y-3">
                  <div className="flex items-center justify-between"><h3 className="font-bold">Study Circles</h3><span className="text-xs text-neutral-500">{adminCircles.length} total</span></div>
                  <input aria-label="Search study circles" placeholder="Search groups or creators..." value={circleFilter} onChange={e=>setCircleFilter(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"/>
                  <div className="space-y-2 max-h-[620px] overflow-y-auto">
                    {visibleAdminCircles.length===0 && <p className="text-sm text-neutral-500">No matching study circles.</p>}
                    {visibleAdminCircles.map(circle => (
                      <button type="button" key={circle.id} onClick={()=>selectAdminCircle(circle)}
                        className={`w-full text-left rounded-xl p-3 border transition-colors ${selectedCircleId===circle.id?'border-orange-500 bg-orange-50 dark:bg-orange-950':'border-neutral-200 dark:border-neutral-700 hover:border-orange-300'}`}>
                        <div className="font-bold text-sm truncate">{circle.name}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">{circle.moduleCode} · {circle.creatorName}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">{circle.membersCount} members · {circle.postsCount} messages</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 bg-white dark:bg-neutral-900 space-y-5">
                  {!selectedCircle ? <div className="text-sm text-neutral-500">Select a study circle to view its members, messages and management tools.</div> : <>
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="text-xl font-bold">{selectedCircle.name}</h3><p className="text-sm text-neutral-500 dark:text-neutral-300">Creator: {selectedCircle.creatorName} · {selectedCircle.moduleCode}</p></div>
                      <button type="button" onClick={()=>{setCircleDeleteTarget(selectedCircle);setCircleDeleteConfirm('');}}
                        className="inline-flex gap-2 items-center rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300"><Trash2 className="w-4 h-4"/> Delete Group</button>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{selectedCircle.description}</p>
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4 space-y-3">
                      <h4 className="font-bold text-sm">Edit Study Circle</h4>
                      <label className="text-xs font-semibold block">Group Name
                        <input maxLength={80} value={circleName} onChange={e=>setCircleName(e.target.value)} className="block mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 bg-white dark:bg-neutral-900 text-sm" />
                      </label>
                      <label className="text-xs font-semibold block">Module / Subject
                        <input maxLength={40} value={circleModule} onChange={e=>setCircleModule(e.target.value)} className="block mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 bg-white dark:bg-neutral-900 text-sm" />
                      </label>
                      <label className="text-xs font-semibold block">Description
                        <textarea rows={3} maxLength={500} value={circleDescription} onChange={e=>setCircleDescription(e.target.value)} className="block mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 bg-white dark:bg-neutral-900 text-sm" />
                      </label>
                      <button type="button" disabled={circleBusy} onClick={()=>void saveCircleDetails()} className="rounded-full bg-[#FF4A00] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save Group Details</button>
                    </div>
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4 space-y-3">
                      <h4 className="font-bold text-sm">Meeting Details</h4>
                      <label className="text-xs font-semibold block">Schedule
                        <input value={circleSchedule} onChange={e=>setCircleSchedule(e.target.value)} maxLength={80} className="block mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 bg-white dark:bg-neutral-900 text-sm" />
                      </label>
                      <label className="text-xs font-semibold block">Google Meet / Zoom / Teams URL
                        <input type="url" value={circleMeetingUrl} onChange={e=>setCircleMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." className="block mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 bg-white dark:bg-neutral-900 text-sm" />
                      </label>
                      <button type="button" disabled={circleBusy} onClick={()=>void saveCircleMeeting()} className="rounded-full bg-[#FF4A00] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save Meeting Details</button>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Members ({circleMembers.length})</h4>
                      {circleMembers.length===0 ? <p className="text-sm text-neutral-500">No members in this circle.</p> :
                      <div className="flex flex-wrap gap-2">{circleMembers.map(member=><span key={member.id} className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs">{member.name} (@{member.username})</span>)}</div>}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold">Group Messages ({circlePosts.length})</h4>
                      {circlePosts.length===0 && <p className="text-sm text-neutral-500">No group messages yet.</p>}
                      {circlePosts.map(post=><article key={post.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-xs">{post.authorName} · {post.createdAt}</span>
                          <button type="button" title="Remove group message" onClick={()=>setCirclePostToDelete(post)} className="text-rose-600 text-xs inline-flex gap-1 items-center"><Trash2 className="w-3.5 h-3.5"/> Remove</button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{post.message}</p>
                        {post.resourceUrl && <p className="text-xs text-neutral-500 break-all">Shared link: {post.resourceUrl}</p>}
                      </article>)}
                    </div>
                  </>}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                  Submitted Resource Reports ({reportsList.filter((r) => r.status === 'pending' || r.status === 'needs_evidence').length} open)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-300">
                  Review PDF, video and article reports with source links, evidence and a saved decision history.
                </p>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Report filters">
                <button type="button" aria-pressed={showOpenReportsOnly} onClick={() => setShowOpenReportsOnly(true)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${showOpenReportsOnly ? 'bg-[#263577] text-white border-[#263577]' : 'border-neutral-300 dark:border-neutral-700'}`}>Open reports</button>
                <button type="button" aria-pressed={!showOpenReportsOnly} onClick={() => setShowOpenReportsOnly(false)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${!showOpenReportsOnly ? 'bg-[#263577] text-white border-[#263577]' : 'border-neutral-300 dark:border-neutral-700'}`}>All reports</button>
              </div>
              {showOpenReportsOnly && reportsList.length > 0 && !reportsList.some(r => r.status === 'pending' || r.status === 'needs_evidence') && <p className="text-sm text-neutral-600 dark:text-neutral-300">No open reports. Choose All reports to view past decisions.</p>}
              <div className="space-y-3">
                {reportsList.length===0 && <p className="text-sm text-neutral-600 dark:text-neutral-300 p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl">No submitted reports yet.</p>}
                {(showOpenReportsOnly ? reportsList.filter(r => r.status === 'pending' || r.status === 'needs_evidence') : reportsList).map((rep) => (
                  <Card key={rep.id} variant="white" hoverable={false} className="p-5 border-[#E8E2D6] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              rep.severity === 'high'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : rep.severity === 'medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {rep.severity} Severity
                          </span>
                          <span className="text-xs text-neutral-400 font-mono dark:text-neutral-300">{rep.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {rep.targetTitle}
                        </h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                          Reason: <strong className="text-[#FF4A00]">{rep.reason}</strong>
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 dark:text-neutral-300">
                          Reported by: {rep.reportedBy}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <span className="text-xs font-semibold text-neutral-500 capitalize">{rep.status.replace('_',' ')}</span>
                        <button type="button" onClick={() => investigationId === rep.id ? setInvestigationId(null) : void loadInvestigation(rep.id)}
                          className="px-3.5 py-1.5 rounded-full bg-[#273778] text-white font-bold text-xs">
                          {investigationId === rep.id ? 'Close Investigation' : 'Investigate Report'}
                        </button>
                      </div>
                    </div>
                    {investigationId === rep.id && (
                      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-4">
                        {investigationError && <p role="alert" className="text-sm text-red-600">{investigationError}</p>}
                        {!investigation && !investigationError && <p className="text-sm">Loading investigation...</p>}
                        {investigation && <>
                          <h4 className="font-bold text-neutral-900 dark:text-white">Evidence &amp; Original Resource</h4>
                          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4 text-sm space-y-2 break-words">
                            <p><strong>Type:</strong> {investigation.resourceType || investigation.type}</p>
                            <p><strong>Uploader:</strong> {investigation.uploaderEmail || 'Unknown'}</p>
                            <p><strong>Availability:</strong> {investigation.available ? (investigation.hidden ? 'Hidden by admin' : investigation.resourceStatus || 'Available') : 'Original resource unavailable'}</p>
                            {investigation.description && <p><strong>Description:</strong> {investigation.description}</p>}
                            {investigation.sourceUrl && /^https?:\/\//i.test(investigation.sourceUrl) && <a href={investigation.sourceUrl}
                              target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">
                              <ExternalLink className="h-4 w-4" /> Open Original Source
                            </a>}
                            <Link to={`/resource/${rep.resourceId && rep.resourceId < 0 ? `backend-link-${-rep.resourceId}` : `backend-resource-${rep.resourceId}`}`}
                              target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">View EduShare Resource</Link>
                            <p className="text-xs text-neutral-500">Compare title, creator credit, source and evidence manually; automated copyright verification is not provided.</p>
                          </div>
                          <h4 className="text-sm font-bold">Submitted Evidence ({investigation.evidence.length})</h4>
                          {investigation.evidence.length === 0 && <p className="text-sm text-neutral-500">No supporting URL or additional details were provided.</p>}
                          {investigation.evidence.map((e, i) => <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-xs space-y-1 break-words">
                            <p>{e.date}</p><p className="whitespace-pre-wrap">{e.details || 'No additional explanation.'}</p>
                            {e.url && /^https?:\/\//i.test(e.url) && <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Evidence Link</a>}
                          </div>)}
                          <h4 className="text-sm font-bold">Decision History ({investigation.history.length})</h4>
                          {investigation.history.length === 0 && <p className="text-xs text-neutral-500">No decisions recorded for legacy reports.</p>}
                          {investigation.history.map((h, i) => <p key={i} className="rounded-lg bg-neutral-50 dark:bg-neutral-900 p-2 text-xs break-words">
                            <strong>{h.action}</strong> · {h.date} · Actor #{h.actorId}<span className="block whitespace-pre-wrap">{h.note}</span>
                          </p>)}
                          {(rep.status === 'pending' || rep.status === 'needs_evidence' || rep.status === 'resolved') && <div className="space-y-3">
                            <label className="text-xs font-bold block" htmlFor={`report-note-${rep.id}`}>Admin decision reason (required)</label>
                            <textarea id={`report-note-${rep.id}`} value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
                              maxLength={1000} rows={3} placeholder="Summarize evidence checked and why this action is appropriate..."
                              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 p-3 text-sm bg-white dark:bg-neutral-900" />
                            <div className="flex flex-wrap gap-2">
                              {(rep.status === 'pending' || rep.status === 'needs_evidence') && <>
                                {rep.status === 'needs_evidence' ? <span className="text-xs font-semibold text-amber-600 px-3 py-2">Awaiting reporter evidence</span> : <button type="button" disabled={decisionBusy} onClick={() => void handleResolveReport(rep.id,'request')}
                                  className="rounded-full bg-amber-100 text-amber-900 px-4 py-2 text-xs font-bold disabled:opacity-50">Request Evidence</button>}
                                <button type="button" disabled={decisionBusy} onClick={() => void handleResolveReport(rep.id,'dismiss')}
                                  className="rounded-full bg-neutral-200 text-neutral-900 px-4 py-2 text-xs font-bold disabled:opacity-50">Dismiss Report</button>
                                <button type="button" disabled={decisionBusy} onClick={() => void handleResolveReport(rep.id,'takedown')}
                                  className="rounded-full bg-rose-600 text-white px-4 py-2 text-xs font-bold disabled:opacity-50">Take Down (Hide)</button>
                              </>}
                              {rep.status === 'resolved' && <button type="button" disabled={decisionBusy} onClick={() => void handleResolveReport(rep.id,'restore')}
                                className="rounded-full bg-green-700 text-white px-4 py-2 text-xs font-bold disabled:opacity-50">Restore Resource</button>}
                            </div>
                          </div>}
                        </>}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: PLANS & PRICING EDITOR */}
          {/* ==================================================== */}
          {activeTab === 'plans' && (
            <form onSubmit={handleSavePlanPrices} className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                  Plan Prices & Creator Share
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-300">
                  Saved prices appear on the Pricing Page and in Demo Checkout. All amounts are in Sri Lankan Rupees (Rs.).
                </p>
              </div>

              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  Premium Scholar Pass
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Price (Rs.)"
                    type="number"
                    value={planPrices.premiumMonthly.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, premiumMonthly: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Semester Price (5 months, Rs.)"
                    type="number"
                    value={planPrices.premiumSemester.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, premiumSemester: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Annual Price (Rs.)"
                    type="number"
                    value={planPrices.premiumYearly.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, premiumYearly: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </Card>

              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  Batch Pack (Up to 30 Students)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Price (Rs.)"
                    type="number"
                    value={planPrices.batchMonthly.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, batchMonthly: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Semester Price (5 months, Rs.)"
                    type="number"
                    value={planPrices.batchSemester.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, batchSemester: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Annual Price (Rs.)"
                    type="number"
                    value={planPrices.batchYearly.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, batchYearly: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </Card>

              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-3">
                <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  Student Creator Royalty Share
                </h4>
                <div className="flex items-center gap-4">
                  <Input
                    label="Author Payout %"
                    type="number"
                    value={planPrices.platformRoyaltyShare.toString()}
                    onChange={(e) => setPlanPrices({ ...planPrices, platformRoyaltyShare: parseInt(e.target.value) || 0 })}
                  />
                  <div className="text-xs text-neutral-500 pt-5 dark:text-neutral-300">
                    The other {100 - planPrices.platformRoyaltyShare}% is the demo platform share. No real money is transferred.
                  </div>
                </div>
              </Card>

              <ResourceSellingSettings/>
              <PlanDiscountEditor prices={planPrices} onChange={values=>setPlanPrices(old=>({...old,...values}))}/>
              <Button type="submit" variant="primary" size="md">
                Save Pricing Changes ✓
              </Button>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAB 7: ANNOUNCEMENTS COMPOSER */}
          {/* ==================================================== */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form */}
              <form onSubmit={handleBroadcastAnnouncement} className="lg:col-span-7 space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                    Post an Announcement
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Share exam updates and new resource notices with students.
                  </p>
                </div>

                <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                  <Input
                    label="Announcement Headline"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                        Audience Target
                      </label>
                      <select
                        value={announcementAudience}
                        onChange={(e) => setAnnouncementAudience(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                      >
                        <option value="all">All Verified Users</option>
                        <option value="premium">Scholar Pass Members Only</option>
                        {/* Tutor targeting is disabled until contributor membership is defined server-side. */}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                        Banner Style
                      </label>
                      <select
                        value={announcementType}
                        onChange={(e) => setAnnouncementType(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                      >
                        <option value="info">Info (Blue Navy)</option>
                        <option value="warning">Important Alert (Amber)</option>
                        <option value="success">Catalog Release (Emerald)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                      Message Body
                    </label>
                    <textarea
                      rows={3}
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      className="w-full p-3 rounded-[16px] border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00] resize-none"
                    />
                  </div>

                  <label className="flex gap-3 items-start p-3 rounded-xl bg-orange-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 text-sm">
                    <input type="checkbox" checked={announcementEmailEnabled} onChange={e=>setAnnouncementEmailEnabled(e.target.checked)} className="mt-1 h-4 w-4 accent-[#FF4A00]" />
                    <span><strong>Also email eligible registered users</strong><span className="block text-xs text-neutral-500 dark:text-neutral-300 mt-1">Each verified, active recipient receives one private email; failed deliveries are tracked. Public URL must be configured for clickable links. No emails are sent unless checked.</span></span>
                  </label>
                  {announcementDeliveryStatus&&<p role="status" className="text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">{announcementDeliveryStatus}</p>}
                  <Button type="submit" variant="primary" size="md" disabled={announcementBusy}>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    <span>{announcementBusy?'Publishing / delivering emails...':'Publish Announcement'}</span>
                  </Button>
                </Card>
              </form>

              {/* Real-time Student Preview */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#FF4A00]" />
                  <span>Student View Preview</span>
                </h4>

                <div
                  className={`p-5 rounded-[22px] border space-y-2 transition-all ${
                    announcementType === 'info'
                      ? 'bg-[#263577] text-white border-[#263577]'
                      : announcementType === 'warning'
                      ? 'bg-[#FFB31F] text-neutral-950 border-amber-400'
                      : 'bg-emerald-600 text-white border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-80">
                    <span>Campus Broadcast</span>
                    <span>Audience: {announcementAudience}</span>
                  </div>
                  <h5 className="font-extrabold text-base font-display">
                    {announcementTitle || 'Announcement Title'}
                  </h5>
                  <p className="text-xs leading-relaxed opacity-90">
                    {announcementMessage || 'Your message will appear directly on undergraduate study feeds.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Published announcements</h5>
                  {savedAnnouncements.length === 0 ? <p className="text-xs text-neutral-500 dark:text-neutral-400">No announcements published.</p> :
                    savedAnnouncements.map(item => (
                      <div key={item.id} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">{item.message}</p>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Audience: {item.audience}</span>
                        <button type="button" disabled={announcementRetrying===item.id} onClick={()=>void retryAnnouncementEmail(item.id)} className="ml-3 text-[10px] font-bold underline text-[#FF4A00] disabled:opacity-50">{announcementRetrying===item.id?'Sending...':'Send / Retry Unsent Emails'}</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 8: SETTINGS & SELLABILITY CONFIG */}
          {/* ==================================================== */}
          {activeTab === 'module-requests' && <AdminModuleRequests onReviewed={()=>{void loadAdminData();loadAcademicModules();}}/>}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                  Security & Selling Rules
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-300">
                  Configure original-work protection policies, monetization matrices, keyword auto-flag lists, and seller eligibility thresholds.
                </p>
              </div>

              <p role="status" className="text-sm">{sellingPolicyError || (!sellingPolicyReady ? 'Loading saved selling rules…' : 'Edit the rules below, then save your changes.')}</p>
              <fieldset disabled={!sellingPolicyReady || sellingPolicySaving} className="space-y-8 min-w-0">
              {/* SECTION A: SELLABILITY MATRIX CONFIG EDITOR */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#FF4A00]" />
                    <span>Resource Type Monetization Matrix</span>
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Control which pricing options (Free, Premium, Paid) are permitted per resource category.
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(sellabilityConfig.allowedPricingByResourceType).map(([type, allowedPrices]) => (
                    <div
                      key={type}
                      className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">
                        {type}
                      </div>

                      <div className="flex items-center gap-2">
                        {(['Free', 'Premium', 'Paid'] as const).map((p) => {
                          const isAllowed = allowedPrices.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const nextPrices = isAllowed
                                  ? allowedPrices.filter((x) => x !== p)
                                  : [...allowedPrices, p];
                                setSellabilityConfig({
                                  ...sellabilityConfig,
                                  allowedPricingByResourceType: {
                                    ...sellabilityConfig.allowedPricingByResourceType,
                                    [type]: nextPrices.length > 0 ? nextPrices : ['Free'],
                                  },
                                });
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                isAllowed
                                  ? 'bg-[#FF4A00] text-white shadow-2xs'
                                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:text-neutral-900'
                              }`}
                            >
                              {p} {isAllowed ? '✓' : '×'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* SECTION B: KEYWORD FLAGS LIST EDITOR */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-rose-600" />
                    <span>Auto-Flagging Keyword List ({sellabilityConfig.keywordFlags.length})</span>
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Uploads containing these institutional keywords automatically lock Paid monetization and require Admin approval.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {sellabilityConfig.keywordFlags.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSellabilityConfig({
                            ...sellabilityConfig,
                            keywordFlags: sellabilityConfig.keywordFlags.filter((k) => k !== kw),
                          });
                        }}
                        className="hover:text-rose-900 cursor-pointer"
                        title="Remove keyword"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Keyword Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    id="newKeywordInput"
                    placeholder="Add restricted keyword (e.g. Term Final Exam)..."
                    className="flex-1 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-[#FF4A00]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !sellabilityConfig.keywordFlags.includes(val)) {
                          setSellabilityConfig({
                            ...sellabilityConfig,
                            keywordFlags: [...sellabilityConfig.keywordFlags, val],
                          });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('newKeywordInput') as HTMLInputElement | null;
                      if (input && input.value.trim()) {
                        const val = input.value.trim();
                        if (!sellabilityConfig.keywordFlags.includes(val)) {
                          setSellabilityConfig({
                            ...sellabilityConfig,
                            keywordFlags: [...sellabilityConfig.keywordFlags, val],
                          });
                          input.value = '';
                        }
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add Keyword</span>
                  </Button>
                </div>
              </Card>

              <p className="text-sm text-neutral-500">Hold periods and seller thresholds are saved demo settings. Real seller payouts are not processed by this project.</p>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={sellabilityConfig.sellerEligibility.requireVerifiedEmail}
                  onChange={e => setSellabilityConfig({...sellabilityConfig, sellerEligibility: {...sellabilityConfig.sellerEligibility, requireVerifiedEmail: e.target.checked}})} />
                Require a verified email for seller eligibility
              </label>
              {/* SECTION C: HOLD PERIOD & SELLER ELIGIBILITY */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF4A00]" />
                    <span>Earnings Hold & Seller Eligibility Thresholds</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Earnings Hold Period (Days)
                    </label>
                    <input
                      type="number" min="0" max="3650" step="1"
                      value={sellabilityConfig.holdPeriodDays}
                      onChange={(e) =>
                        setSellabilityConfig({
                          ...sellabilityConfig,
                          holdPeriodDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Min Account Age (Days)
                    </label>
                    <input
                      type="number" min="0" max="3650" step="1"
                      value={sellabilityConfig.sellerEligibility.minAccountAgeDays}
                      onChange={(e) =>
                        setSellabilityConfig({
                          ...sellabilityConfig,
                          sellerEligibility: {
                            ...sellabilityConfig.sellerEligibility,
                            minAccountAgeDays: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Min Free Uploads
                    </label>
                    <input
                      type="number" min="0" max="100000" step="1"
                      value={sellabilityConfig.sellerEligibility.minFreeUploads}
                      onChange={(e) =>
                        setSellabilityConfig({
                          ...sellabilityConfig,
                          sellerEligibility: {
                            ...sellabilityConfig.sellerEligibility,
                            minFreeUploads: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                    />
                  </div>
                </div>
              </Card>

              <button type="button" disabled={!sellingPolicyReady || sellingPolicySaving}
                onClick={() => { void updateSellabilityConfig(sellabilityConfig); }}
                className="px-5 py-3 rounded-full bg-[#283579] text-white font-semibold disabled:opacity-50">
                {sellingPolicySaving ? 'Saving…' : 'Save Selling Rules'}
              </button>
              </fieldset>
              {/* Blocked Domains Editor */}
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h4 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-100">
                    Blocked Disposable Email Domains ({blockedDomains.length})
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Registrations using these domains are rejected immediately on the auth form.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {blockedDomains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-mono font-semibold border border-rose-200 dark:border-rose-900"
                    >
                      <span>@{domain}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedDomain(domain)}
                        className="hover:text-rose-900 cursor-pointer"
                        title="Remove domain"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBlockedDomain();
                      }
                    }}
                    placeholder="Add domain to blacklist (e.g. fakeinbox.com)..."
                    className="flex-1 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                  />
                  <Button type="button" variant="primary" size="sm" onClick={handleAddBlockedDomain}>
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Block Domain</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* ==================================================== */}
      {/* 3. MODALS */}
      {/* ==================================================== */}

      {/* A. 3-Tab Category Image Editor Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={`Choose cover for "${editingCategory?.name}"`}
        description="Choose a cover image or upload your own PNG or JPEG."
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Tabs: Choose Library | Upload | Generate with AI */}
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            {[
              { id: 'library', label: 'Choose from Library', icon: Image },
              { id: 'upload', label: 'Upload Image', icon: Upload },
            ].map((tab) => {
              const isActive = imageModalTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setImageModalTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF4A00] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Library Presets */}
          {imageModalTab === 'library' && (
            <div className="space-y-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-300">
                Choose a cover for this subject. It will appear on Browse, not just in Admin:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[430px] overflow-y-auto pr-1" role="group" aria-label="Category cover choices">
                {CATEGORY_COVER_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.src}
                    onClick={() => setSelectedImageChoice(preset.src)}
                    aria-pressed={selectedImageChoice === preset.src}
                    className={`rounded-2xl border-2 overflow-hidden text-left bg-white dark:bg-neutral-900 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                      selectedImageChoice === preset.src
                        ? 'border-[#FF4A00] ring-2 ring-[#FF4A00]/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-[#FF4A00]/60'
                    }`}
                  >
                    <img src={preset.src} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover" />
                    <span className="flex items-center justify-between gap-1 py-2 px-2.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {preset.label}
                      {selectedImageChoice === preset.src && <Check className="w-4 h-4 text-[#FF4A00]" aria-label="Selected" />}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">10 unique covers • Select one and click Save. You can also upload a custom image.</p>
            </div>
          )}

          {imageModalTab === 'upload' && editingCategory && (
            <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 p-5 space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">Upload a PNG or JPEG up to 5 MB to use as this category’s cover image.</p>
              <input type="file" accept="image/png,image/jpeg" className="block w-full text-xs text-neutral-700 dark:text-neutral-200" onChange={async e=>{
                const file=e.target.files?.[0];if(!file)return;
                if(file.size>5*1024*1024){addToast({title:'Too large',message:'Maximum size is 5 MB.',type:'error'});return;}
                const form=new FormData();form.append('file',file);
                try{
                  const response=await fetch(`/api/admin/categories/${editingCategory.id}/image`,{method:'POST',credentials:'include',body:form});
                  if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error||'Upload failed.');}
                  const saved=await response.json();
                  setCategoriesList(prev=>prev.map(c=>c.id===editingCategory.id?{...c,image:saved.image}:c));
                  setEditingCategory(null);
                  addToast({title:'Cover saved',message:'Students can now see this cover in Browse.',type:'success'});
                }catch(error){addToast({title:'Upload failed',message:error instanceof Error?error.message:'Error',type:'error'});}
              }}/>
            </div>
          )}
          {/* Action Bar */}
          <div className="flex items-center gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="primary" size="md" className="w-full" onClick={handleSaveCategoryImage} disabled={imageModalTab==='upload'}>
              Save Cover &rarr;
            </Button>
            <Button variant="secondary" size="md" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* B. Add Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add New Subject"
        description="Add a subject and choose a cover. It will appear on the Browse page."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Cloud Computing & DevOps"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
              Short Curriculum Description
            </label>
            <textarea
              rows={2}
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="e.g. Docker, Kubernetes, CI/CD pipelines, AWS and microservices architectures."
              className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Subject cover (optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1" role="group" aria-label="New category image">
              {CATEGORY_COVER_PRESETS.map(preset => (
                <button
                  key={preset.src}
                  type="button"
                  onClick={() => setNewCatImage(preset.src)}
                  aria-pressed={newCatImage === preset.src}
                  className={`rounded-xl border-2 overflow-hidden text-left bg-white dark:bg-neutral-900 transition-colors ${newCatImage === preset.src ? 'border-[#FF4A00]' : 'border-neutral-200 dark:border-neutral-700'}`}
                >
                  <img src={preset.src} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" />
                  <span className="flex justify-between items-center px-2 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">{preset.label}{newCatImage === preset.src && <Check className="w-4 h-4 text-[#FF4A00]" />}</span>
                </button>
              ))}
            </div>
            {newCatImage && <button type="button" onClick={() => setNewCatImage('')} className="text-xs text-neutral-600 dark:text-neutral-300 underline">No cover image</button>}
          </div>

          <Input
            label="Image description (optional)"
            placeholder="Describe visual for screen readers (e.g. Students configuring Docker containers)"
            value={newCatAlt}
            onChange={(e) => setNewCatAlt(e.target.value)}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" size="md" type="submit" className="w-full">
              Create Subject &rarr;
            </Button>
            <Button variant="secondary" size="md" type="button" onClick={() => setShowAddCategoryModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!circleDeleteTarget} onClose={()=>{if(!circleBusy){setCircleDeleteTarget(null);setCircleDeleteConfirm('');}}}
        title="Permanently Delete Study Circle" description="This also deletes its group memberships and discussion messages." maxWidth="md">
        <div className="space-y-4 text-neutral-900 dark:text-white">
          <p className="text-sm text-rose-700 dark:text-rose-300">This operation cannot be undone. Student accounts and shared resources will not be deleted.</p>
          <label className="block text-sm font-semibold">Type the exact group name: <strong>{circleDeleteTarget?.name}</strong>
            <input value={circleDeleteConfirm} onChange={e=>setCircleDeleteConfirm(e.target.value)}
              className="block w-full mt-2 p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" disabled={circleBusy} onClick={()=>{setCircleDeleteTarget(null);setCircleDeleteConfirm('');}} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button type="button" disabled={circleBusy || circleDeleteConfirm!==circleDeleteTarget?.name} onClick={()=>void deleteAdminCircle()}
              className="px-4 py-2 rounded-lg bg-rose-700 text-white font-semibold disabled:opacity-50">Delete Permanently</button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!circlePostToDelete} onClose={()=>{if(!circleBusy)setCirclePostToDelete(null);}}
        title="Remove Group Message" description="Delete this message from the group discussion?" maxWidth="md">
        <div className="space-y-4 text-neutral-900 dark:text-white">
          <p className="text-sm rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3 break-words">{circlePostToDelete?.message}</p>
          <div className="flex justify-end gap-3">
            <button type="button" disabled={circleBusy} onClick={()=>setCirclePostToDelete(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button type="button" disabled={circleBusy} onClick={()=>void removeAdminCirclePost()} className="px-4 py-2 rounded-lg bg-rose-700 text-white font-semibold disabled:opacity-50">Remove Message</button>
          </div>
        </div>
      </Modal>

      {/* One-time recovery: require administrator re-authentication. */}
      <Modal isOpen={!!recoveryApproveUser} onClose={()=>{setRecoveryApproveUser(null);setRecoveryAdminPassword('');}}
        title="Approve password recovery" description={`Verify ${recoveryApproveUser?.name || 'student'} identity first, outside EduShare.`} maxWidth="md">
        <form onSubmit={approveRecoveryRequest} className="space-y-4 text-gray-900 dark:text-white">
          <p className="text-sm text-amber-700 dark:text-amber-300">This creates a 30-minute single-use code for {recoveryApproveUser?.email}. Do not share it publicly.</p>
          <label className="block text-sm font-semibold">Your current administrator password
            <input autoComplete="current-password" type="password" required value={recoveryAdminPassword} onChange={e=>setRecoveryAdminPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3"/>
          </label>
          <button type="submit" disabled={recoveryApproveBusy} className="w-full bg-[#FF4A00] text-white rounded-full py-3 font-bold disabled:opacity-50">{recoveryApproveBusy?'Approving...':'Approve & Generate One-Time Code'}</button>
        </form>
      </Modal>
      <Modal isOpen={!!issuedRecoveryCode} onClose={()=>setIssuedRecoveryCode(null)} title="One-Time Recovery Code" description="Shown only now. The server stores a hash, not the code." maxWidth="md">
        <div className="space-y-4 text-gray-900 dark:text-white">
          <p className="text-sm">Privately deliver this code to the verified student <strong>{issuedRecoveryCode?.name}</strong>. It expires at {issuedRecoveryCode?.expiresAt ? new Date(issuedRecoveryCode.expiresAt).toLocaleString() : ''}.</p>
          <input aria-label="One-time recovery code" readOnly value={issuedRecoveryCode?.code || ''}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 font-mono text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          <button type="button" onClick={()=>{if(issuedRecoveryCode) void navigator.clipboard.writeText(issuedRecoveryCode.code)}} className="rounded-full bg-[#FF4A00] text-white px-5 py-2 font-bold">Copy Code</button>
          <p className="text-sm text-gray-600 dark:text-gray-300">Student opens <strong>/reset-password</strong>, enters their registered email and this code, then chooses their own password. Do not include the code in screenshots.</p>
        </div>
      </Modal>
      {/* Admin-confirmed student password reset: no email service required. */}
      <Modal
        isOpen={!!resetPasswordUser}
        onClose={closeResetPassword}
        title="Reset Student Password"
        description={`Set a new password for ${resetPasswordUser?.name || 'this student'}. The administrator must confirm their own password.`}
        maxWidth="md"
      >
        <form onSubmit={submitStudentPasswordReset} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
            For account <strong>@{resetPasswordUser?.username}</strong>. The previous password will stop working immediately. Share the new password privately; do not put it in public chats or GitHub.
          </div>
          <label className="block space-y-1 text-sm text-gray-900 dark:text-white">
            <span className="font-semibold">New student password</span>
            <input autoComplete="new-password" type="password" value={newStudentPassword}
              onChange={e=>setNewStudentPassword(e.target.value)} minLength={8} maxLength={128} required
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-gray-900 dark:text-white" />
            <span className="block text-xs text-gray-500 dark:text-gray-300">8–128 characters, with at least one letter and one number.</span>
          </label>
          <label className="block space-y-1 text-sm text-gray-900 dark:text-white">
            <span className="font-semibold">Confirm new student password</span>
            <input autoComplete="new-password" type="password" value={confirmStudentPassword}
              onChange={e=>setConfirmStudentPassword(e.target.value)} minLength={8} maxLength={128} required
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-gray-900 dark:text-white" />
          </label>
          <label className="block space-y-1 text-sm text-gray-900 dark:text-white">
            <span className="font-semibold">Your current admin password</span>
            <input autoComplete="current-password" type="password" value={adminPasswordConfirmation}
              onChange={e=>setAdminPasswordConfirmation(e.target.value)} required
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-gray-900 dark:text-white" />
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" size="md" onClick={closeResetPassword}>Cancel</Button>
            <button type="submit" disabled={resetPasswordBusy}
              className="rounded-full px-5 py-2.5 bg-[#FF4A00] text-white text-sm font-bold disabled:opacity-50">
              {resetPasswordBusy ? 'Saving...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* C. User Action Confirmation Modal */}
      <Modal
        isOpen={!!selectedUserAction}
        onClose={() => setSelectedUserAction(null)}
        title="Confirm Administrative Action"
        description={`Modify student profile status for ${selectedUserAction?.user.name}.`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-xs space-y-1">
            <div>
              User: <strong className="text-neutral-900 dark:text-neutral-100">{selectedUserAction?.user.name}</strong> (@{selectedUserAction?.user.username})
            </div>
            <div>
              Action:{' '}
              <span className="font-bold uppercase text-[#FF4A00]">
                {selectedUserAction?.action === 'plan_free' ? 'End Premium immediately (Free)' : selectedUserAction?.action.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" size="md" className="w-full" onClick={handleConfirmUserAction}>
              Execute Action
            </Button>
            <Button variant="secondary" size="md" onClick={() => setSelectedUserAction(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* D. Reject Note with Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Resource Submission"
        description="Specify why this study material failed moderation integrity checks."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
              Rejection Reason & Feedback for Student
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Scanned pages are illegible; copyrighted textbook excerpts detected in section 3..."
              className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00] resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleConfirmRejectNote}
              className="w-full py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer"
            >
              Confirm Rejection & Send Feedback
            </button>
            <Button variant="secondary" size="md" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* E. Resource Preview Drawer Modal */}
      <Modal
        isOpen={!!activePreviewResource}
        onClose={() => setActivePreviewResource(null)}
        title={activePreviewResource?.title || 'Resource Preview'}
        description="Detailed document metadata and academic integrity breakdown."
        maxWidth="lg"
      >
        {activePreviewResource && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div>
                <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Author</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{activePreviewResource.authorName}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Category</span>
                <span className="font-bold text-[#FF4A00]">{activePreviewResource.category}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Total Pages</span>
                <span className="font-mono font-bold">{activePreviewResource.pages}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-semibold uppercase text-[10px] dark:text-neutral-300">Pricing Model</span>
                <Badge type={activePreviewResource.priceType} size="sm" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
              <h5 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                Integrity Scanner Findings
              </h5>
              <div className="space-y-1 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>No automated malware, plagiarism, OCR-quality or code-validation scan has been performed.</p>
                <p>Inspect the source document and its rights before approval.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  approveNote(activePreviewResource.id);
                  setActivePreviewResource(null);
                }}
              >
                Approve to Catalog &rarr;
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActivePreviewResource(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
