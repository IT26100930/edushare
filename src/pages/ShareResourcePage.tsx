import {ModuleRequestAccess} from '../components/ModuleRequestAccess';
import {useSellingLimits} from '../hooks/useSellingLimits';
import {OwnedVideoPublisher} from '../components/OwnedVideoPublisher';
import { MyLinkReviews } from '../components/MyLinkReviews.tsx';
import { YouTubeChapterPlayer } from '../components/YouTubeChapterPlayer.tsx';
import { parseVideoLink } from '../utils/videoLinks.ts';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Award,
  BookOpen,
  Video,
  Globe,
  Upload,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Eye,
  Info,
  AlertTriangle,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Card } from '../components/shared/Card.tsx';
import { Button } from '../components/Button.tsx';
import { Tag } from '../components/Tag.tsx';
import { Badge } from '../components/shared/Badge.tsx';
import { ResourceCard } from '../components/ResourceCard.tsx';
import { Resource } from '../data/models.ts';
import { Input } from '../components/shared/Input.tsx';
import { ResourceModelFactory } from '../services/originalityService.ts';
import { ReviewPipeline, ReviewCheckResult } from '../services/originalityService.ts';

// Must match the Spring Boot PDF upload limit in application.properties.
const MAX_PDF_FILE_BYTES = 100 * 1024 * 1024;

// Exact Resource Types required by sellability rules
export type ResourceTypeOption =
  | 'Own notes/summary'
  | 'Answers or explanations for a past paper'
  | 'Past paper (official)'
  | 'Official lecture slides / textbook / e-book'
  | 'Video link'
  | 'Article link';

interface TimestampRow {
  id: string;
  time: string;
  label: string;
}

// Fast, dependency-free page count for conventional PDFs. Some PDFs use compressed
// object streams; those must display "Page count unavailable" instead of a fake 0.
const readPdfPageCount = async (file: File): Promise<number | null> => {
  try {
    // Large PDFs are counted by the backend; avoid decoding the entire file in browser memory.
    if (file.size > 16 * 1024 * 1024) return null;
    const raw = await file.arrayBuffer();
    const header = new TextDecoder('latin1').decode(raw.slice(0, 8));
    if (!header.startsWith('%PDF-')) return null;
    const source = new TextDecoder('latin1').decode(raw);
    const pageObjects = source.match(/\/Type\s*\/Page\b(?!s)/g);
    if (pageObjects?.length) return pageObjects.length;
    // The root page-tree /Count is only used if all /Pages nodes agree.
    const treeCounts = Array.from(source.matchAll(/\/Type\s*\/Pages\b[^]*?\/Count\s+(\d+)/g))
      .map((match) => Number(match[1]))
      .filter((count) => Number.isSafeInteger(count) && count > 0);
    return treeCounts.length === 1 ? treeCounts[0] : null;
  } catch {
    return null;
  }
};

// Convert a chapter time to seconds. Accept MM:SS or HH:MM:SS.
const chapterSeconds = (value: string): number | null => {
  const parts = value.trim().split(':');
  if (parts.length !== 2 && parts.length !== 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = numbers;
    return seconds < 60 && minutes <= 999 ? minutes * 60 + seconds : null;
  }
  const [hours, minutes, seconds] = numbers;
  return hours <= 99 && minutes < 60 && seconds < 60
    ? hours * 3600 + minutes * 60 + seconds : null;
};


export const ShareResourcePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    resources,
    addResource,
    addToast,
    isBookmarked,
    toggleBookmark,
    sellabilityConfig,
  } = useApp();

  // Current Step (1 to 4)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Autosave status
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Step 1: Resource Type
  const [selectedType, setSelectedType] = useState<ResourceTypeOption>('Own notes/summary');

  // Step 2: Form Details State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState('');
  const [moduleCode, setModuleCode] = useState('');

  interface AcademicModuleOption {
    id: number;
    code: string;
    name: string;
    facultySubject: string;
    active: boolean;
  }
  const [academicModules, setAcademicModules] = useState<AcademicModuleOption[]>([]);

  const moduleSelection=useRef({moduleCode,category});moduleSelection.current={moduleCode,category};
  useEffect(() => {
    let active=true;
    const refresh=()=>{void fetch('/api/modules',{credentials:'include',cache:'no-store'})
      .then(r=>r.ok?r.json():Promise.reject(new Error('Modules unavailable'))).then((rows:AcademicModuleOption[])=>{
        if(!active)return;setAcademicModules(rows);
        const selected=rows.find(m=>m.code===moduleSelection.current.moduleCode)||rows.find(m=>m.facultySubject===moduleSelection.current.category)||rows[0];
        if(selected){setModuleCode(selected.code);setCategory(selected.facultySubject||'Other');}
      }).catch(()=>{});};
    refresh();window.addEventListener('focus',refresh);window.addEventListener('edushare:modules-updated',refresh);
    return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('edushare:modules-updated',refresh);};
  }, []);

  const facultySubjects = useMemo(() => {
    const fromModules = academicModules.map((m) => m.facultySubject).filter(Boolean);
    return Array.from(new Set(fromModules));
  }, [academicModules]);

  const modulesForSubject = useMemo(() =>
    academicModules.filter((m) => m.facultySubject === category),
    [academicModules, category]
  );
  const [academicYear, setAcademicYear] = useState('Year 2');
  const [semester, setSemester] = useState('Semester 1');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('/images/hero-illustration.png');
  const [imageAltText, setImageAltText] = useState('Cover illustration for study guide');

  // PDF File Upload Simulation State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    pages: number | null;
    fileHash?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(100);
  const [binaryFile, setBinaryFile] = useState<File | null>(null);

  // Video Link Specific State
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [extractedVideoId, setExtractedVideoId] = useState<string | null>(null);
  const [videoPlatform, setVideoPlatform] = useState<'youtube' | 'vimeo' | null>(null);
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [videoLanguage, setVideoLanguage] = useState<'English' | 'Sinhala' | 'Bilingual' | 'Tamil'>('English');
  const [difficultyLevel, setDifficultyLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [timestamps, setTimestamps] = useState<TimestampRow[]>([]);


  // Article Link Specific State
  const [articleUrl, setArticleUrl] = useState('');
  const [articleError, setArticleError] = useState<string | null>(null);
  const [articleSummary, setArticleSummary] = useState('');
  const [articleDomain, setArticleDomain] = useState<string | null>(null);

  // Mandatory Declaration Checkbox
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [originalCreator, setOriginalCreator] = useState('');
  const isExternal = selectedType === 'Video link' || selectedType === 'Article link';
  useEffect(() => { setDeclarationConfirmed(false); }, [selectedType]);

  // Step 3: Pricing & Visibility State
  const [pricingModel, setPricingModel] = useState<'Free' | 'Paid' | 'Premium'>('Free');
  const [paidPrice, setPaidPrice] = useState<number>(350);
  const {limits:sellingLimits,error:sellingLimitsError}=useSellingLimits();
  const [ownedVideoMode,setOwnedVideoMode]=useState(false);
  const [visibility, setVisibility] = useState<'public' | 'batch_only' | 'private'>('public');

  // Step 4: Submission & Success State
  const [checkingContent, setCheckingContent] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [submissionReason, setSubmissionReason] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [createdResourceId, setCreatedResourceId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Strategy Pattern Pricing Rule derived via OOP Factory
  const pricingStrategy = useMemo(() => {
    const resourceModel = ResourceModelFactory.create(selectedType, 'temp', title);
    return resourceModel.getPriceRule(sellabilityConfig);
  }, [selectedType, title, sellabilityConfig]);

  // Run Review Pipeline for Originality Checks
  const originalityCheckResult: ReviewCheckResult = useMemo(() => {
    const pipeline = new ReviewPipeline();
    return pipeline.runPipeline(
      {
        title,
        description,
        type: selectedType,
        fileHash: uploadedFile?.fileHash,
        sampleContent: [title, description, subCategory],
      },
      resources,
      sellabilityConfig
    );
  }, [title, description, selectedType, uploadedFile, resources, sellabilityConfig]);

  // Auto-enforce pricing restrictions if selected type or keyword check restricts Paid
  useEffect(() => {
    if (isExternal && pricingModel !== 'Free') {
      setPricingModel('Free');
    } else if (!pricingStrategy.isPriceTypeAllowed(pricingModel)) {
      setPricingModel('Free');
    } else if (originalityCheckResult.flaggedKeywords.length > 0 && pricingModel === 'Paid') {
      setPricingModel('Free');
      addToast({
        title: 'Paid Option Locked',
        message: 'Contains official examination metadata flags. Only Free sharing is allowed.',
        type: 'info',
      });
    }
  }, [selectedType, pricingStrategy, originalityCheckResult, pricingModel, isExternal]);

  // Auto-save simulation trigger
  useEffect(() => {
    setIsSavingDraft(true);
    const timer = setTimeout(() => {
      setIsSavingDraft(false);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 800);
    return () => clearTimeout(timer);
  }, [title, description, selectedType, videoUrl, articleUrl, pricingModel, paidPrice, declarationConfirmed, originalCreator]);

  // Live YouTube/Vimeo validation
  const validateVideoUrl = (url: string) => {
    setVideoUrl(url);
    if (!url.trim()) {
      setVideoError(null);
      setExtractedVideoId(null);
      setVideoPlatform(null);
      return;
    }

    const parsed = parseVideoLink(url);
    if (parsed) {
      setVideoError(null);
      setExtractedVideoId(parsed.id);
      setVideoPlatform(parsed.platform);
      return;
    }

    setVideoError('Please enter a valid YouTube or Vimeo video URL.');
    setExtractedVideoId(null);
    setVideoPlatform(null);
  };

  // Article URL validation
  const validateArticleUrl = (url: string) => {
    setArticleUrl(url);
    if (!url.trim()) {
      setArticleError(null);
      setArticleDomain(null);
      return;
    }

    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      setArticleError(null);
      setArticleDomain(parsed.hostname.replace('www.', ''));
      if (!title) {
        setTitle(`Comprehensive Guide to ${category} Systems`);
      }
    } catch {
      setArticleError('Please enter a valid URL (e.g. dev.to/article)');
      setArticleDomain(null);
    }
  };

  // Upload messages are written for students rather than exposing backend details.
  const showPdfError = (title: string, message: string) => {
    addToast({ title, message, type: 'error' });
  };

  // Real PDF selection. The binary file is uploaded to Spring Boot when the user publishes.
  const handlePdfSelection = async (file?: File) => {
    if (!file) return;
    // Clear the previous selection so an invalid replacement cannot be published.
    setBinaryFile(null);
    setUploadedFile(null);

    if (file.size > MAX_PDF_FILE_BYTES) {
      showPdfError(
        'This file is too large',
        'Your PDF exceeds the 100 MB upload limit. Please choose a smaller file or compress your PDF and try again.'
      );
      return;
    }

    if (file.size === 0 || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
      showPdfError('Please select a valid PDF', 'Choose a non-empty PDF document to upload.');
      return;
    }

    setBinaryFile(file);
    const detectedPages = await readPdfPageCount(file);
    setUploadedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      pages: detectedPages,
      fileHash: `local-${file.size}-${file.lastModified}`,
    });
    setUploadProgress(100);
    if (!title) setTitle(file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '));
    addToast({ title: 'PDF selected ✓', message: 'Your PDF is ready. Complete the details to submit it.', type: 'success' });
  };

  // Timestamps manager
  const handleAddTimestamp = () => {
    setTimestamps((prev) => [
      ...prev,
      { id: `ts-${Date.now()}-${Math.random().toString(36).slice(2)}`, time: '', label: '' },
    ]);
  };

  const handleCaptureChapter = (seconds: number) => {
    if (seconds >= 360000) {
      addToast({ title: 'Chapter time is too large', type: 'warning' }); return;
    }
    const filled = timestamps.filter(row => row.time.trim() || row.label.trim());
    if (filled.length >= 50) {
      addToast({ title: 'Up to 50 chapters are allowed', type: 'warning' }); return;
    }
    if (filled.some(row => chapterSeconds(row.time) === seconds)) {
      addToast({ title: 'A chapter already exists at this time', type: 'info' }); return;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    const rest = String(seconds % 60).padStart(2, '0');
    const time = hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
    const next = [...filled, { id: `ts-${Date.now()}-${Math.random().toString(36).slice(2)}`, time, label: '' }];
    next.sort((a, b) => (chapterSeconds(a.time) ?? Infinity) - (chapterSeconds(b.time) ?? Infinity));
    setTimestamps(next);
    addToast({ title: `Chapter added at ${time}`, message: 'Enter a short chapter title below.', type: 'success' });
  };

  const handleRemoveTimestamp = (id: string) => {
    setTimestamps((prev) => prev.filter((t) => t.id !== id));
  };

  // Tags manager
  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Format Selection Cards Config
  const typeCards = [
    {
      id: 'Own notes/summary' as ResourceTypeOption,
      title: 'Own notes/summary',
      subtitle: 'Your handwritten or typed lecture summaries & study guides.',
      icon: FileText,
      badgeText: 'Monetizable',
      accent: 'border-[#FF4A00] bg-[#FF4A00]/5 text-[#FF4A00]',
    },
    {
      id: 'Answers or explanations for a past paper' as ResourceTypeOption,
      title: 'Answers or explanations',
      subtitle: 'Your own written step-by-step answers, code examples or proofs, uploaded as a PDF. For a video explanation, choose Video link instead.',
      icon: Award,
      badgeText: 'Monetizable',
      accent: 'border-[#1E6FEB] bg-[#1E6FEB]/5 text-[#1E6FEB]',
    },
    {
      id: 'Past paper (official)' as ResourceTypeOption,
      title: 'Past paper (official)',
      subtitle: 'Official university end-of-semester exam paper. Free sharing only.',
      icon: BookOpen,
      badgeText: 'Free-Only',
      accent: 'border-[#FFB31F] bg-[#FFB31F]/5 text-amber-700',
    },
    {
      id: 'Official lecture slides / textbook / e-book' as ResourceTypeOption,
      title: 'Official slides / textbook',
      subtitle: 'Campus slides, open e-books, or professor handouts. Free sharing only.',
      icon: ShieldCheck,
      badgeText: 'Free-Only',
      accent: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'Video link' as ResourceTypeOption,
      title: 'Video link',
      subtitle: 'Share a Free learning link, or upload your own video with Free, Paid or Premium access.',
      icon: Video,
      badgeText: 'Free / Paid / Premium',
      accent: 'border-[#263577] bg-[#263577]/5 text-[#263577]',
    },
    {
      id: 'Article link' as ResourceTypeOption,
      title: 'Article link',
      subtitle: 'Technical blog, documentation, or tutorial URL. Free sharing only.',
      icon: Globe,
      badgeText: 'Free-Only',
      accent: 'border-purple-500 bg-purple-50 text-purple-700',
    },
  ];

  // Step 2 Validation check
  const canProceedStep2 = useMemo(() => {
    if (!title.trim() || !declarationConfirmed || (isExternal && originalCreator.trim().length < 2)) return false;
    if (selectedType === 'Video link') return Boolean(extractedVideoId && !videoError);
    if (selectedType === 'Article link') return Boolean(articleUrl && !articleError);
    return Boolean(uploadedFile);
  }, [title, declarationConfirmed, selectedType, extractedVideoId, videoError, articleUrl, articleError, uploadedFile, isExternal, originalCreator]);

  // Construct Mock Resource for Live Preview
  const previewResource: Resource = useMemo(() => {
    return {
      id: 'preview-new',
      title: title || 'Untitled Study Resource',
      description: description || '',
      category: category,
      type: selectedType as any,
      priceType: pricingModel,
      price: pricingModel === 'Paid' ? paidPrice : 0,
      author: {
        id: currentUser?.id || '',
        username: currentUser?.username || '',
        name: currentUser?.name || '',
        university: currentUser?.university || '',
        avatar: currentUser?.avatar || '',
        isVerified: currentUser?.isVerified ?? false,
      },
      rating: 0,
      reviewCount: 0,
      downloads: 0,
      pages: uploadedFile?.pages ?? 0,
      moduleCode: moduleCode || '',
      moduleName: subCategory || '',
      academicYear: academicYear,
      semester: semester,
      tags: tags,
      fileFormat: selectedType === 'Video link' ? 'VIDEO' : selectedType === 'Article link' ? 'WEB' : 'PDF',
      fileSize: uploadedFile?.size || '',
      updatedAt: 'Just now',
      tableOfContents: [

      ],
      sampleContent: [

      ],
      reviews: [],
      declarationConfirmed,
    };
  }, [
    title,
    description,
    category,
    selectedType,
    pricingModel,
    paidPrice,
    currentUser,
    uploadedFile,
    moduleCode,
    subCategory,
    academicYear,
    semester,
    tags,
    originalityCheckResult,
    declarationConfirmed,
  ]);

  // Final Publish Handler
  const handlePublish = async () => {
    if(pricingModel==='Paid'&&(!sellingLimits||!Number.isInteger(paidPrice)||paidPrice<sellingLimits.minimum||paidPrice>sellingLimits.maximum)){addToast({title:'Check selling price',message:sellingLimits?`Choose Rs. ${sellingLimits.minimum} to Rs. ${sellingLimits.maximum}.`:sellingLimitsError,type:'error'});return;}
    if (!moduleCode || !category || !academicModules.some(m => m.code === moduleCode && m.facultySubject === category)) {
      addToast({title: 'Choose a valid module', message: 'Ask an admin to add a subject and module before publishing.', type: 'warning'});
      return;
    }

    if (selectedType === 'Video link' && !parseVideoLink(videoUrl)) {
      addToast({ title: 'Invalid video link', message: 'Paste a valid YouTube or Vimeo video URL.', type: 'error' });
      return;
    }
    if (selectedType === 'Article link' && (!articleUrl.trim() || articleError)) {
      addToast({ title: 'Invalid article link', message: 'Enter a valid article URL.', type: 'error' });
      return;
    }
    if (isExternal && originalCreator.trim().length < 2) {
      addToast({ title: 'Credit the original creator', message: 'Enter the original channel, publisher or author before sharing this external resource.', type: 'warning' });
      return;
    }
    if (!declarationConfirmed) {
      addToast({
        title: 'Declaration Required',
        message: isExternal ? 'Confirm the third-party resource sharing declaration.' : 'You must confirm ownership or permission to share this PDF.',
        type: 'warning',
      });
      return;
    }

    // Recheck before submitting; the backend enforces the same limit independently.
    if (binaryFile && binaryFile.size > MAX_PDF_FILE_BYTES) {
      showPdfError('This file is too large', 'Please select a PDF smaller than 100 MB.');
      return;
    }

    // Validate chapters before publishing and before making any network request.
    const savedChapters = selectedType === 'Video link'
      ? timestamps.filter(chapter => chapter.time.trim() !== '' || chapter.label.trim() !== '').map((chapter) => ({
          id: chapter.id,
          time: chapter.time.trim(),
          label: chapter.label.trim(),
          seconds: chapterSeconds(chapter.time),
        }))
      : [];

    if (savedChapters.length > 50 || savedChapters.some((c) =>
      c.seconds === null || !c.label || c.label.length > 120
    )) {
      addToast({
        title: 'Check your video chapters',
        message: savedChapters.length > 50 ? 'Up to 50 chapters are allowed.' : `Chapter ${savedChapters.findIndex(c => c.seconds === null || !c.label || c.label.length > 120) + 1}: enter a valid time and a title of 1–120 characters, or remove this row.`,
        type: 'error',
      });
      return;
    }
    const chapterTimes = savedChapters.map((c) => c.seconds as number);
    if (new Set(chapterTimes).size !== chapterTimes.length ||
      chapterTimes.some((seconds, index) => index > 0 && seconds <= chapterTimes[index - 1])) {
      addToast({
        title: 'Check chapter order',
        message: 'Chapter times must increase and cannot be duplicated.',
        type: 'error',
      });
      return;
    }

    if (checkingContent) return;
    setCheckingContent(true);
    let newId: string;
    let linkStatus = '';
    try {
      if (selectedType === 'Video link' || selectedType === 'Article link') {
        const linkUrl = selectedType === 'Video link' ? videoUrl : articleUrl;
        const response = await fetch('/api/links', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: selectedType === 'Video link' ? 'VIDEO' : 'ARTICLE', title: title.trim(), url: linkUrl, chapters: selectedType === 'Video link' ? JSON.stringify(savedChapters) : '[]', originalCreator: originalCreator.trim(), thirdPartyConfirmed: declarationConfirmed, category, moduleCode: moduleCode.toUpperCase() }),
        });
        if (!response.ok) throw new Error('Could not save link');
        const saved = await response.json();
        newId = `backend-link-${saved.id}`;
        linkStatus = saved.status;
        setSubmissionStatus(saved.status);
        setSubmissionReason(saved.moderationReason || '');
      } else if (binaryFile) {
        const form = new FormData();
        const backendType = selectedType === 'Past paper (official)' ? 'PAST_PAPER' : selectedType === 'Official lecture slides / textbook / e-book' ? 'EBOOK' : 'LECTURE_NOTE';
        form.append('type', backendType); form.append('contentType', selectedType); form.append('title', title.trim()); form.append('moduleCode', moduleCode.toUpperCase()); form.append('category', category); form.append('priceType', pricingModel); form.append('price', String(pricingModel === 'Paid' ? paidPrice : 0)); form.append('pages', String(uploadedFile?.pages ?? 0)); form.append('description', description.trim()); form.append('academicYear', academicYear); form.append('semester', semester); form.append('tags', tags.join(',')); form.append('file', binaryFile);
        const response = await fetch('/api/resources/upload', { method: 'POST', credentials: 'include', body: form });
        if (!response.ok) {
          if (response.status === 413) {
            showPdfError('This file is too large', 'Your PDF exceeds the 100 MB upload limit. Please compress it or choose a smaller file.');
          } else if (response.status === 401 || response.status === 403) {
            showPdfError('Please sign in again', 'Your session may have expired. Sign in and try uploading again.');
          } else if (response.status === 400 || response.status === 415) {
            showPdfError('Please check your PDF', 'We could not accept this file. Choose a valid PDF and try again.');
          } else {
            showPdfError('Upload unsuccessful', 'We could not save your PDF. Please try again.');
          }
          return;
        }
        const saved = await response.json();
        newId = `backend-resource-${saved.id}`;
      } else {
        const backendType = selectedType === 'Past paper (official)' ? 'PAST_PAPER' : selectedType === 'Official lecture slides / textbook / e-book' ? 'EBOOK' : 'LECTURE_NOTE';
        const response = await fetch('/api/resources', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: backendType, contentType: selectedType, title: title.trim(), moduleCode: moduleCode.toUpperCase(), category, fileName: uploadedFile?.name || '', filePath: '', priceType: pricingModel, price: pricingModel === 'Paid' ? paidPrice : 0, pages: uploadedFile?.pages ?? 0, description: description.trim(), academicYear, semester, tags: tags.join(','), fileSize: uploadedFile?.size || '' }),
        });
        if (!response.ok) throw new Error('Could not save resource');
        const saved = await response.json();
        newId = `backend-resource-${saved.id}`;
      }
    } catch (error) {
      // A rejected HTTP response is handled above; a thrown error is typically network-related.
      showPdfError(
        'Unable to complete your upload',
        'We could not connect to EduShare. Check that the site is available and try again.'
      );
      return;
    } finally { setCheckingContent(false); }

    if (!linkStatus || linkStatus === 'APPROVED') addResource({
      id: newId,
      ...(linkStatus === 'APPROVED' ? {status: 'approved' as const} : {}),
      title: title.trim(),
      description: description.trim(),
      category: category,
      type: selectedType as any,
      priceType: pricingModel,
      price: pricingModel === 'Paid' ? paidPrice : 0,
      moduleCode: moduleCode.toUpperCase(),
      academicYear: academicYear,
      semester: semester,
      pages: uploadedFile?.pages ?? 0,
      fileFormat: selectedType === 'Video link' ? 'VIDEO' : selectedType === 'Article link' ? 'WEB' : 'PDF',
      fileSize: selectedType === 'Video link' ? 'External video' : (uploadedFile?.size || ''),
      tags: tags,
      videoId: selectedType === 'Video link' ? extractedVideoId || undefined : undefined,
      videoUrl: selectedType === 'Video link' ? videoUrl : undefined,
      videoPlatform: selectedType === 'Video link' ? (videoPlatform || 'youtube') : undefined,
      learningOutcomes: selectedType === 'Video link' ? learningOutcomes : undefined,
      difficultyLevel: selectedType === 'Video link' ? difficultyLevel : undefined,
      language: selectedType === 'Video link' ? videoLanguage : undefined,
      timestamps: selectedType === 'Video link' ? savedChapters.map((c) => ({ ...c, seconds: c.seconds as number })) : undefined,
    });

    setCreatedResourceId(newId);
    setIsPublished(true);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/resource/${createdResourceId || 'res-java-1'}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast({
      title: 'Direct Link Copied ✓',
      message: 'Ready to share with your university classmates.',
      type: 'success',
    });
  };

  if(ownedVideoMode) return <><OwnedVideoPublisher onBack={()=>setOwnedVideoMode(false)}/><ModuleRequestAccess autoOpenOnly defaultSubject={category}/></>;
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-8 pb-24">
      <ModuleRequestAccess autoOpenOnly defaultSubject={category}/>
      <MyLinkReviews refreshKey={isPublished} />
      {/* HEADER: Title & Originality Safeguard Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D6] dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Tag variant="orange" className="text-xs font-semibold">
              Original-Work Protection Enabled
            </Tag>
            <span className="text-xs text-neutral-400 font-mono dark:text-neutral-300">
              Academic Council Ethics Standard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-neutral-100 mt-1">
            Share a study resource
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
            Share your notes, answers, or official campus materials under verified fair-use rules.
          </p>
        </div>

        {/* Draft Autosave Indicator */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isSavingDraft ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="font-mono text-[11px]">
            {isSavingDraft ? 'Saving draft...' : `Draft saved at ${lastSavedTime}`}
          </span>
        </div>
      </div>

      {/* ANIMATED STEPPER */}
      {!isPublished && (
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { num: 1, title: 'Sellability Rules' },
            { num: 2, title: 'Details & Upload' },
            { num: 3, title: 'Pricing & Tooltip' },
            { num: 4, title: 'Review & Publish' },
          ].map((s) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <button
                key={s.num}
                disabled={step < s.num}
                onClick={() => setStep(s.num as any)}
                className={`flex flex-col items-center sm:items-start p-3 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 ring-2 ring-[#FF4A00]/20'
                    : isPassed
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center font-mono ${
                      isCurrent
                        ? 'bg-[#FF4A00] text-white'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </span>
                  <span className="hidden sm:inline font-bold text-xs font-display text-neutral-900 dark:text-neutral-100">
                    {s.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP CONTENT PANELS */}
      <AnimatePresence mode="wait">
        {/* ==================================================== */}
        {/* STEP 1: CHOOSE RESOURCE TYPE & VIEW SELLABILITY RULES */}
        {/* ==================================================== */}
        {step === 1 && !isPublished && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 pt-2"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                Step 1: What type of content are you uploading?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
                EduShare protects original creators: Official campus material belongs to universities and is free-only. You can sell your own notes and explanations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeCards.map((card) => {
                const isSelected = selectedType === card.id;
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedType(card.id)}
                    className={`p-5 rounded-[22px] border-2 cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? `${card.accent} ring-4 ring-[#FF4A00]/20 shadow-md`
                        : 'border-[#E8E2D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-2xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                            card.badgeText === 'Monetizable'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {card.badgeText}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm font-display text-neutral-900 dark:text-neutral-100">
                          {card.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed dark:text-neutral-300">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-2 text-[11px] font-semibold text-[#FF4A00]">
                      {isSelected ? '✓ Selected type' : 'Select type'}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(2)}
                className="font-bold text-sm"
              >
                <span>Continue to Details & Content Checks</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: DETAILS, UPLOAD & REAL-TIME ORIGINALITY CHECKS */}
        {/* ==================================================== */}
        {step === 2 && !isPublished && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 pt-2"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                Step 2: Upload & Originality Checks
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
                Selected format: <strong className="text-[#FF4A00] font-mono">{selectedType}</strong>. Automated checks run in real-time.
              </p>
            </div>

            {selectedType==='Video link'&&<section className="rounded-2xl border border-orange-300 p-5 space-y-3"><h3 className="font-bold">Whose video are you sharing?</h3><p className="text-sm">For a public YouTube or Vimeo learning link, continue below. For your own video or a video you have permission to sell, upload the video instead.</p><button type="button" onClick={()=>setOwnedVideoMode(true)} className="rounded-full bg-[#FF4A00] text-white px-5 py-3 font-bold">Share my own / authorised video</button></section>}
            {/* Sharing classification: never claim a verified AI originality result. */}
            {isExternal ? (
              <Card variant="white" hoverable={false} className="p-5 border-2 border-[#FF4A00]/30 bg-orange-50/60 dark:bg-[#27221F] space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#FF4A00]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-neutral-800 dark:text-neutral-100">Third-Party Educational Resource</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF4A00]/10 text-[#D63D00] dark:text-orange-300">External Link</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">EduShare links to the original public {selectedType === 'Video link' ? 'video' : 'article'}. Adding creator credit does not verify copyright ownership or grant permission to re-upload or sell the content.</p>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Source attribution: {originalCreator.trim() ? 'Creator credit entered (not independently verified)' : 'Original creator credit required'}</p>
              </Card>
            ) : (
              <Card variant="white" hoverable={false} className="p-5 border-2 border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#FF4A00]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-neutral-800 dark:text-neutral-100">Document Integrity Review</span></div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">Not Independently Verified</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">Basic title, duplicate and keyword checks can flag potential issues. They cannot prove originality, permission or copyright ownership. Admin review may be required.</p>
                {originalityCheckResult.similarityMatch && <p className="text-xs text-amber-800 dark:text-amber-200">Possible matching title: {originalityCheckResult.similarityMatch.matchedTitle}. Check source and attribution before uploading.</p>}
                {originalityCheckResult.flaggedKeywords.length > 0 && <p className="text-xs text-rose-700 dark:text-rose-300">Keywords requiring review: {originalityCheckResult.flaggedKeywords.join(', ')}</p>}
              </Card>
            )}

            {/* BRANCH A: PDF Upload */}
            {(selectedType === 'Own notes/summary' ||
              selectedType === 'Answers or explanations for a past paper' ||
              selectedType === 'Past paper (official)' ||
              selectedType === 'Official lecture slides / textbook / e-book') && (
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <h3 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#FF4A00]" />
                  <span>Document File (PDF)</span>
                </h3>

                <input id="real-pdf-upload" type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => {
                  const selected = e.target.files?.[0];
                  void handlePdfSelection(selected);
                  e.target.value = ''; // allow choosing the same file after an error
                }} />
                <div
                  onClick={() => document.getElementById('real-pdf-upload')?.click()}
                  className="p-8 rounded-[20px] border-2 border-dashed border-[#FF4A00]/40 bg-[#FF4A00]/5 text-center space-y-2.5 cursor-pointer hover:bg-[#FF4A00]/10 transition-colors"
                >
                  <FileText className="w-10 h-10 text-[#FF4A00] mx-auto" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Click to select or drag PDF file here
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-300">
                      PDF only · Maximum file size: 100 MB.
                    </p>
                  </div>

                  {isUploading && (
                    <div className="w-64 mx-auto pt-2 space-y-1">
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                        <div style={{ width: `${uploadProgress}%` }} className="bg-[#FF4A00] h-full transition-all" />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-300">Hash Fingerprinting: {uploadProgress}%</span>
                    </div>
                  )}

                  {uploadedFile && !isUploading && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{uploadedFile.name} ({uploadedFile.size} &bull; {uploadedFile.pages !== null ? `${uploadedFile.pages} pages` : "Page count unavailable"})</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* BRANCH B: Video Link */}
            {selectedType === 'Video link' && (
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <h3 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#263577]" />
                  <span>Curated Video Link & Chapter Index</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    YouTube or Vimeo URL
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => validateVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
                    className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00]"
                  />
                  {videoError && <p className="text-xs text-rose-600 font-semibold mt-1.5">{videoError}</p>}
                </div>

                {extractedVideoId && (
                  <div className="p-3 rounded-2xl bg-neutral-950 text-white space-y-2">
                    <span className="text-xs font-semibold text-neutral-300 dark:text-neutral-300">Live Video Preview Embed</span>
                    {videoPlatform === 'youtube' ? (
                      <YouTubeChapterPlayer videoId={extractedVideoId} onCapture={handleCaptureChapter} />
                    ) : (
                      <div className="aspect-video min-h-[200px] w-full rounded-xl overflow-hidden bg-black">
                        <iframe src={`https://player.vimeo.com/video/${extractedVideoId}`} title="Video player" className="w-full h-full border-none" allowFullScreen />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-5">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Video Chapters & Timestamps
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Optional: For YouTube, use “Add chapter at current time” above, then enter a short title below. You can also enter a time manually. Skip chapters if you do not need them.
                    </p>
                  </div>

                  {timestamps.map((chapter, index) => (
                      <div key={chapter.id} className="flex flex-wrap gap-2 items-center">
                        <input
                            type="text"
                            placeholder="MM:SS"
                            aria-label={`Chapter ${index + 1} timestamp`}
                            value={chapter.time}
                            onChange={(e) => {
                              setTimestamps((previous) =>
                                  previous.map((item) =>
                                      item.id === chapter.id
                                          ? { ...item, time: e.target.value }
                                          : item
                                  )
                              );
                            }}
                            className="w-36 shrink-0 rounded-lg border p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        />

                        <input
                            type="text"
                            placeholder="Chapter title"
                            aria-label={`Chapter ${index + 1} title`}
                            maxLength={120}
                            value={chapter.label}
                            onChange={(e) => {
                              setTimestamps((previous) =>
                                  previous.map((item) =>
                                      item.id === chapter.id
                                          ? { ...item, label: e.target.value }
                                          : item
                                  )
                              );
                            }}
                            className="min-w-0 flex-1 rounded-lg border p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        />

                        <button
                            type="button"
                            aria-label="Remove chapter"
                            onClick={() => handleRemoveTimestamp(chapter.id)}
                            className="p-2 text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="w-full text-xs text-gray-600 dark:text-gray-300">
                          Chapter {index + 1}: {chapter.label.length}/120 characters. Short topic title only.
                        </span>
                      </div>
                  ))}

                  <button
                      type="button"
                      onClick={handleAddTimestamp}
                      className="flex items-center gap-2 rounded-lg border border-orange-500 px-4 py-2 text-orange-600 dark:text-orange-400"
                  >
                    <Plus size={18} />
                    Add chapter manually
                  </button>
                </div>
              </Card>
            )}

            {/* BRANCH C: Article Link */}
            {selectedType === 'Article link' && (
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <h3 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Technical Article or Documentation URL</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Article Link
                  </label>
                  <input
                    type="url"
                    value={articleUrl}
                    onChange={(e) => validateArticleUrl(e.target.value)}
                    placeholder="https://dev.to/author/guide-to-sql"
                    className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00]"
                  />
                  {articleDomain && <p className="text-xs text-emerald-600 font-semibold mt-1">Source Domain: {articleDomain}</p>}
                  {articleError && <p className="text-xs text-rose-600 font-semibold mt-1">{articleError}</p>}
                </div>
              </Card>
            )}

            {/* FORM METADATA */}
            <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
              <h3 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 border-b pb-2">
                Syllabus & Faculty Metadata
              </h3>

              <Input
                label="Resource Title"
                placeholder="e.g. Complete SCS2201 Concurrency & Thread Synchronization Explanations"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe key concepts, lab exercises, or exam marking schemes covered in this resource..."
                  className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Faculty Subject
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const nextSubject = e.target.value;
                      setCategory(nextSubject);
                      const firstModule = academicModules.find((m) => m.facultySubject === nextSubject);
                      if (firstModule) setModuleCode(firstModule.code);
                    }}
                    className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00]"
                  >
                    {facultySubjects.length === 0 && <option value="">No subjects yet. Ask an admin to add modules.</option>}
                    {facultySubjects.map((subject) => (
                      <option key={subject} value={subject}>{subject === 'SQL' ? 'SQL & Databases' : subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1">
                    Module Code
                  </label>
                  <select
                    value={moduleCode}
                    onChange={(e) => setModuleCode(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm focus:ring-2 focus:ring-[#FF4A00]"
                  >
                    {modulesForSubject.length === 0 && <option value="">No active modules yet</option>}
                    {modulesForSubject.map((module) => (
                      <option key={module.id} value={module.code}>
                        {module.code} - {module.name}
                      </option>
                    ))}
                  </select>
                  <ModuleRequestAccess defaultSubject={category}/>
                </div>

                <Input
                  label="Sub-topic"
                  placeholder="e.g. Multithreading & Memory Models"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                />
              </div>

              {isExternal && <div className="space-y-2 mt-4">
                <label htmlFor="original-creator" className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Original Creator / Channel / Publisher (Required)</label>
                <input id="original-creator" type="text" maxLength={120} value={originalCreator} onChange={e=>setOriginalCreator(e.target.value)} placeholder="e.g. NeuralNine, freeCodeCamp or official publisher" className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-[#FF4A00]" required />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-300">Credit the actual creator, not the EduShare student who submitted this link.</p>
              </div>}

              {/* MANDATORY COPYRIGHT DECLARATION CHECKBOX */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 mt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationConfirmed}
                    onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#FF4A00] rounded cursor-pointer"
                    required
                  />
                  <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    <strong className="text-neutral-900 dark:text-neutral-100 block font-display">
                      {isExternal ? 'Third-Party Resource Sharing Declaration (Required)' : 'Original Work & Distribution Permission (Required)'}
                    </strong>
                    {isExternal ? 'This is a third-party educational resource. I am sharing its original public link, have identified the creator or publisher, do not claim ownership, and will not re-upload or sell its content. I will follow the creator’s terms and EduShare policies. I understand that this public link and title may be processed by Google for content checking.' : 'I created this document or have permission to distribute it. I understand that uncredited content or unauthorized official university material may be removed after review.'}
                  </div>
                </label>
              </div>
            </Card>

            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back to Format</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
              >
                <span>Pricing Rules & Tooltip</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: PRICING RULES, EXPLANATORY TOOLTIP & SUGGESTIONS */}
        {/* ==================================================== */}
        {step === 3 && !isPublished && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 pt-2"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                Step 3: Pricing & Sellability Rules
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
                Type: <strong className="text-[#FF4A00] font-mono">{selectedType}</strong>. Pricing options are automatically validated against sellability rules.
              </p>
            </div>

            {/* EXPLANATORY TOOLTIP & SUGGESTION CARD FOR RESTRICTED CONTENT */}
            {!pricingStrategy.isPriceTypeAllowed('Paid') && (
              <div className="p-4 sm:p-5 rounded-[22px] bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <Info className="w-5 h-5 text-amber-600" />
                  <span>Monetization Policy Notice</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                  &ldquo;{pricingStrategy.getExplanatoryTooltip()}&rdquo;
                </p>

                {/* Helpful Suggestion Card */}
                {pricingStrategy.getSuggestionCard() && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 flex items-start gap-3 shadow-2xs">
                    <Sparkles className="w-5 h-5 text-[#FFB31F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {pricingStrategy.getSuggestionCard()?.title}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {pricingStrategy.getSuggestionCard()?.text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isExternal && <p className="text-xs text-[#D63D00] dark:text-orange-300 font-semibold">Third-party public links are shared Free only. Original creator content cannot be sold or placed behind Scholar Pass by the submitting student.</p>}
            {/* PRICING OPTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Free */}
              <div
                onClick={() => setPricingModel('Free')}
                className={`p-5 rounded-[22px] border-2 cursor-pointer transition-all ${
                  pricingModel === 'Free'
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 ring-2 ring-[#FF4A00]/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge type="Free" />
                  {pricingModel === 'Free' && <Check className="w-4 h-4 text-[#FF4A00]" />}
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Free Community Access
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-snug dark:text-neutral-300">
                  Accessible to all undergraduates for zero cost. Earn campus reputation points.
                </p>
              </div>

              {/* Option 2: Paid (Locked if restricted type or keyword flag) */}
              <div
                onClick={() => {
                  if (!isExternal && pricingStrategy.isPriceTypeAllowed('Paid') && originalityCheckResult.flaggedKeywords.length === 0) {
                    setPricingModel('Paid');
                  }
                }}
                className={`p-5 rounded-[22px] border-2 transition-all relative ${
                  isExternal || !pricingStrategy.isPriceTypeAllowed('Paid') || originalityCheckResult.flaggedKeywords.length > 0
                    ? 'opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/40'
                    : pricingModel === 'Paid'
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 ring-2 ring-[#FF4A00]/20 cursor-pointer'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 cursor-pointer'
                }`}
              >
                {(isExternal || !pricingStrategy.isPriceTypeAllowed('Paid') || originalityCheckResult.flaggedKeywords.length > 0) && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    Paid Purchase
                  </span>
                  {pricingModel === 'Paid' && <Check className="w-4 h-4 text-[#FF4A00]" />}
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Single Purchase (LKR)
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-snug dark:text-neutral-300">
                  Earn creator royalties on every download after admin review.
                </p>
              </div>

              {/* Option 3: Premium */}
              <div
                onClick={() => {
                  if (!isExternal && pricingStrategy.isPriceTypeAllowed('Premium')) {
                    setPricingModel('Premium');
                  }
                }}
                className={`p-5 rounded-[22px] border-2 transition-all ${
                  isExternal || !pricingStrategy.isPriceTypeAllowed('Premium')
                    ? 'opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/40'
                    : pricingModel === 'Premium'
                    ? 'border-[#FF4A00] bg-[#FF4A00]/5 ring-2 ring-[#FF4A00]/20 cursor-pointer'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge type="Premium" />
                  {pricingModel === 'Premium' && <Check className="w-4 h-4 text-[#FF4A00]" />}
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Scholar Pass Exclusive
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-snug dark:text-neutral-300">
                  Unlocked by verified subscribers. Royalties paid from monthly pool.
                </p>
              </div>
            </div>

            {/* Price Slider if Paid */}
            {pricingModel === 'Paid' && pricingStrategy.isPriceTypeAllowed('Paid') && (
              <Card variant="white" hoverable={false} className="p-6 border-[#E8E2D6] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Set Selling Price
                  </span>
                  <span className="text-2xl font-extrabold font-display text-[#FF4A00] tabular-nums">
                    Rs. {paidPrice.toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-300">{sellingLimits?`Allowed selling price: Rs. ${sellingLimits.minimum.toLocaleString()} – Rs. ${sellingLimits.maximum.toLocaleString()}`:sellingLimitsError||'Loading selling limits…'}</p>
                <input aria-label="Selling price in rupees" type="number" min={sellingLimits?.minimum} max={sellingLimits?.maximum} step="1" value={paidPrice} onChange={e=>setPaidPrice(e.target.valueAsNumber)} className="border rounded-xl p-3 bg-white dark:bg-neutral-800"/>
                <input
                  type="range"
                  min={sellingLimits?.minimum ?? 1}
                  max={sellingLimits?.maximum ?? 1}
                  step="1"
                  disabled={!sellingLimits}
                  value={paidPrice}
                  onChange={(e) => setPaidPrice(parseInt(e.target.value))}
                  className="w-full accent-[#FF4A00] cursor-pointer"
                />

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 block dark:text-neutral-300">Student Creator Royalty:</span>
                    <strong className="text-emerald-600 font-bold text-sm">
                      You earn Rs. {Math.round(paidPrice * 0.9).toLocaleString()} (90% split, 14-day hold)
                    </strong>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono dark:text-neutral-300">10% Platform fee</span>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" size="md" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back to Upload</span>
              </Button>

              <Button variant="primary" size="md" onClick={() => setStep(4)}>
                <span>Final Review & Publish</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: FINAL REVIEW & PUBLISH */}
        {/* ==================================================== */}
        {step === 4 && !isPublished && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 pt-2"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
                Step 4: Final Review & Publish
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
                Review the resource, credit or permission declaration, and details before publishing.
              </p>
            </div>

            {/* Checklist */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
              <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Pre-Publication Declaration Checklist</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-800 dark:text-emerald-300">
                <p>✓ Type: {selectedType}</p>
                <p>✓ {isExternal ? `Creator credit: ${originalCreator.trim() || 'Missing'}` : 'Document: independent originality verification not provided'}</p>
                <p>✓ Pricing: {pricingModel} {pricingModel === 'Paid' ? `(Rs. ${paidPrice})` : ''}</p>
                <p>✓ {isExternal ? 'External link declaration' : 'Document rights declaration'} confirmed</p>
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#FF4A00]" />
                <span>Live Catalog Card Preview</span>
              </h3>
              <div className="max-w-sm">
                <ResourceCard
                  resource={previewResource}
                  isBookmarked={isBookmarked(previewResource.id)}
                  onToggleBookmark={toggleBookmark}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="secondary" size="md" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back to Pricing</span>
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handlePublish}
                disabled={checkingContent}
                className="font-bold text-sm shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2 text-[#FFB31F]" />
                <span>{checkingContent ? 'Checking content… Please wait' : 'Submit to EduShare'}</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* ==================================================== */}
        {/* Submission result */}
        {/* ==================================================== */}
        {isPublished && (
          <motion.div
            key="publishedSuccess"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10 space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 stroke-[2.3]" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-neutral-900 dark:text-neutral-100">
                Resource Submitted Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed dark:text-neutral-300">
                Your resource <strong className="text-neutral-900 dark:text-neutral-100">&ldquo;{title}&rdquo;</strong> {submissionStatus === 'APPROVED' ? 'is approved and published.' : submissionStatus === 'REJECTED' ? 'was rejected and is not public. You can ask an administrator to review the decision.' : 'is awaiting review and is not public yet.'}
                {submissionReason && <span className="block mt-2">{submissionReason}</span>}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {(!submissionStatus || submissionStatus === 'APPROVED') && <Button
                to={`/resource/${createdResourceId || 'res-java-1'}`}
                variant="primary"
                size="md"
              >
                <span>View Published Resource &rarr;</span>
              </Button>}

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsPublished(false); setSubmissionStatus(''); setSubmissionReason('');
                  setStep(1);
                  setTitle('');
                  setDescription('');
                }}
              >
                <span>Share Another Guide</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
