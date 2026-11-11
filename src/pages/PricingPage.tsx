import {savingPercent,studentMonthlyPrice} from '../utils/planPricing';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  X,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  BookOpen,
  Zap,
  Users,
  CheckCircle2,
  CreditCard, Building2, Smartphone, LockKeyhole, ReceiptText, ArrowLeft,
} from 'lucide-react';
import { Tag } from '../components/Tag.tsx';
import { Button } from '../components/Button.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { AccordionItem } from '../components/AccordionItem.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  PLANS_CONFIG,
  COMPARISON_TABLE_DATA,
  BillingCycle,
  STUDENT_DISCOUNT,
  getDisplayPlanPrice,
} from '../data/plansConfig.ts';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize shared app context before any effect or dependency references currentUser.
  const { currentUser, addToast, acceptAuthenticatedUser } = useApp();
  useEffect(() => {
    if (location.hash === '#manage-membership') {
      requestAnimationFrame(() => document.getElementById('manage-membership')?.scrollIntoView({behavior: 'smooth', block: 'center'}));
    }
  }, [location.hash]);
  // 3-way segmented control: default selected 'semester'
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('semester');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);
  const [demoMethod, setDemoMethod] = useState<'visa' | 'mastercard' | 'googlepay' | 'bank'>('visa');
  const [demoBank, setDemoBank] = useState('Commercial Bank of Ceylon');
  const [bankHolder, setBankHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [testCardNumber, setTestCardNumber] = useState('');
  const [receiptAccount, setReceiptAccount] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{reference:string; amount:number; method:string} | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<Array<{reference:string; plan:string; cycle:string; amount:string; method:string; date:string; status:string}>>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);

  const [membership, setMembership] = useState<{active:boolean; cancelled:boolean; legacy:boolean; endDate:string; cycle:string} | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('I am not using Premium enough');
  const [cancelConfirm, setCancelConfirm] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const loadMembership = async () => {
    if (!currentUser) return;
    setMembershipLoading(true);
    try {
      const response = await fetch('/api/subscriptions/me', { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const info = await response.json();
        setMembership(info);
        const userResponse = await fetch('/api/users/me', {credentials: 'include', cache: 'no-store'});
        if (userResponse.ok) acceptAuthenticatedUser(await userResponse.json());
      }
    } catch {
      addToast({title: 'Membership unavailable', message: 'Could not load membership details. Try again.', type: 'error'});
    } finally { setMembershipLoading(false); }
  };

  useEffect(() => { if (currentUser) void loadMembership(); else setMembership(null); }, [currentUser?.id]);

  const cancelMembership = async () => {
    if (cancelBusy || cancelConfirm !== 'CANCEL') return;
    setCancelBusy(true); setCancelError('');
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({reason: cancelReason, confirmation: cancelConfirm}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not cancel membership.');
      setCancelOpen(false); setCancelConfirm('');
      await loadMembership();
      addToast({title: 'Cancellation saved', message: result.message || 'Your membership was updated.', type: 'success'});
    } catch (error) { setCancelError(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setCancelBusy(false); }
  };

  // Comparison table accordion categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Downloads & Access': true,
    'Publishing & Storage': true,
    'AI & Collaboration Features': true,
  });

  // 3-question mini quiz state
  const [quizAnswers, setQuizAnswers] = useState<{
    q1?: 'occasional' | 'frequent' | 'group';
    q2?: 'slides' | 'ai' | 'cohort';
    q3?: 'solo' | 'high_gpa' | 'batch';
  }>({});
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const recommendationRef = useRef<HTMLDivElement>(null);

  const [livePlans, setLivePlans] = useState(PLANS_CONFIG);
  const [studentDiscountPercent,setStudentDiscountPercent]=useState(20);
  const verifiedMonthlyPrice=studentMonthlyPrice(livePlans[1].pricing.monthly,studentDiscountPercent);
  const semesterSaving=savingPercent(livePlans[1].pricing.monthly,livePlans[1].pricing.semester,5);
  const yearlySaving=savingPercent(livePlans[1].pricing.monthly,livePlans[1].pricing.yearly,12);
  useEffect(() => {
    const refreshPrices=()=>{void fetch('/api/config/prices', { credentials: 'include', cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Pricing unavailable')))
      .then((v: Record<string, number>) => {
        setLivePlans(PLANS_CONFIG.map(plan => {
          if (plan.id === 'free') return plan;
          const key = plan.id;
          const monthly = v[key + 'Monthly'];
          const semester = v[key + 'Semester'];
          const yearly = v[key + 'Yearly'];
          if (![monthly, semester, yearly].every(Number.isFinite)) return plan;
          return { ...plan, features: plan.id === 'batch' ? plan.features.map(feature=>feature.includes('Rs. 50') ? 'Shared plan for up to 30 members' : feature) : plan.features, pricing: { monthly, semester, yearly },
            perMonthEquivalent: { monthly, semester: Math.round(semester / 5), yearly: Math.round(yearly / 12) } };
        }));
        if (Number.isFinite(v.studentDiscountPercent)) setStudentDiscountPercent(v.studentDiscountPercent);
      })
      .catch(() => addToast({ title: 'Pricing unavailable', message: 'Showing default demo prices until the server is available.', type: 'warning' }));};
    refreshPrices();
    window.addEventListener('focus',refreshPrices);
    return()=>window.removeEventListener('focus',refreshPrices);
  }, []);


  // Check if current logged-in user is student verified
  const isStudentVerified = useMemo(() => {
    if (!currentUser) return false;
    const isEmailVerified =
      Boolean(currentUser.email?.endsWith('.edu') ||
      currentUser.email?.includes('.ac.') ||
      currentUser.email?.endsWith('.edu.lk') ||
      currentUser.isVerified);
    return isEmailVerified;
  }, [currentUser]);

  const handlePlanSelect = (planName: string) => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/pricing', intent: planName } });
      return;
    }
    if (planName === 'Free') {
      addToast({title: 'Free plan', message: 'Free access is already included with your EduShare account.', type: 'info'});
      return;
    }
    if (currentUser.plan === 'Premium') {
      addToast({ title: 'Premium already active', message: 'Your account already has Premium access.', type: 'info' });
      return;
    }
    setPaymentReceipt(null);
    setPaymentError('');
    setDemoMethod('visa');
    setBankHolder(''); setBankAccount(''); setBankBranch(''); setBankReference('');
    setTestCardNumber(''); setReceiptAccount('');
    setSelectedPlanModal(planName);
  };

  const openPaymentHistory = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setHistoryOpen(true);
    setHistoryBusy(true);
    try {
      const response = await fetch('/api/demo-payments/history', {credentials: 'include'});
      if (response.ok) setPaymentHistory(await response.json());
    } finally { setHistoryBusy(false); }
  };

  const handleConfirmPlan = async () => {
    if (!currentUser || !selectedPlanModal || paymentBusy) return;
    setPaymentError('');
    const digits = bankAccount.replace(/\D/g, '');
    if (demoMethod === 'bank') {
      if (bankHolder.trim().length < 3 || bankHolder.trim().length > 80) {
        setPaymentError('Enter an account holder name (3–80 characters).');
        return;
      }
      if (!/^\d{8,16}$/.test(digits)) {
        setPaymentError('Enter an 8–16 digit test account number. Do not use a real bank account.');
        return;
      }
      if (bankBranch.trim().length < 2 || bankBranch.trim().length > 60) {
        setPaymentError('Enter a bank branch name.');
        return;
      }
    }
    const testCards: Record<string, string> = {
      visa: '4111111111111111',
      mastercard: '5555555555554444',
    };
    if (demoMethod === 'visa' || demoMethod === 'mastercard') {
      if (testCardNumber.replace(/\D/g, '') !== testCards[demoMethod]) {
        setPaymentError(`Use the provided ${demoMethod === 'visa' ? 'Visa' : 'Mastercard'} test number. Never enter a real card.`);
        return;
      }
    }
    // Sensitive input is kept in this browser only and is never sent to Java / text files.
    const maskedAccount = demoMethod === 'bank'
      ? `Account ending ${digits.slice(-4)}`
      : demoMethod === 'googlepay' ? 'Demo wallet' : `Test card ending ${testCardNumber.replace(/\D/g, '').slice(-4)}`;
    setPaymentBusy(true);
    const chosenPlan = selectedPlanModal.toLowerCase().includes('batch') ? 'batch' : 'premium';
    try {
      const response = await fetch('/api/demo-payments/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: chosenPlan, cycle: billingCycle, method: demoMethod, bank: demoMethod === 'bank' ? demoBank : '' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not complete the demo payment.');
      const me = await fetch('/api/users/me', {credentials: 'include', cache: 'no-store'});
      if (me.ok) acceptAuthenticatedUser(await me.json());
      setReceiptAccount(maskedAccount);
      setBankAccount(''); setTestCardNumber('');
      setPaymentReceipt({ reference: data.reference, amount: data.amount, method: demoMethod });
      void loadMembership();
      addToast({ title: 'Demo payment complete ✓', message: `Payment reference: ${data.reference}. No real money was charged.`, type: 'success' });
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const toggleCategory = (groupName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Recommended plan based on quiz answers
  const recommendedPlanId = useMemo(() => {
    if (!hasCompletedQuiz) return null;
    const { q1, q2, q3 } = quizAnswers;
    if (q1 === 'group' || q2 === 'cohort' || q3 === 'batch') {
      return 'batch';
    }
    if (q1 === 'occasional' && q2 === 'slides' && q3 === 'solo') {
      return 'free';
    }
    return 'premium';
  }, [quizAnswers, hasCompletedQuiz]);

  useEffect(() => {
    if (!hasCompletedQuiz || !showRecommendation) return;
    const frame = requestAnimationFrame(() => recommendationRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'nearest',
    }));
    return () => cancelAnimationFrame(frame);
  }, [hasCompletedQuiz, showRecommendation, quizAnswers]);

  const handleQuizAnswer = (question: 'q1' | 'q2' | 'q3', answer: any) => {
    const updated = { ...quizAnswers, [question]: answer };
    setQuizAnswers(updated);
    if (updated.q1 && updated.q2 && updated.q3) {
      setHasCompletedQuiz(true);
      if (quizAnswers[question] !== answer) setShowRecommendation(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setHasCompletedQuiz(false);
    setShowRecommendation(false);
  };

  // Frequently Asked Questions
  const pricingFaqs = [
    {
      question: 'Why so affordable?',
      answer:
        'EduShare is built by students for students. Free always stays useful; Premium just removes limits.',
    },
    {
      question: 'How does university student billing work?',
      answer:
        `Billing is available monthly, per semester (5 months), or yearly. Current Premium savings against the regular monthly price: semester ${semesterSaving}%, yearly ${yearlySaving}%. The checkout shows your selected plan total.`,
    },
    {
      question: 'Can I cancel anytime without penalties?',
      answer:
        'Yes. Open Membership & Billing on this page to cancel. Confirm your reason and cancellation. Your Premium access stays until the saved end date. Older demo plans without an end date are cancelled immediately.',
    },
    {
      question: 'What is EduShare’s refund policy?',
      answer:
        'We offer a 14-day hassle-free student guarantee. If you find that the verified lecture notes or past paper answers for your module are not aligned with your university curriculum, reach out for a full refund.',
    },
    {
      question: 'Is the payment real or simulated?',
      answer:
        'Is the payment real? No, this is a student demonstration environment. All checkout flows simulate bank processing without charging real funds or debiting your actual accounts.',
    },
  ];

  return (
    <div className="portal-page w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-16 pb-20">
      {/* 1. HEADER SECTION */}
      <div className="portal-hero portal-hero-copy mx-auto text-center space-y-4 p-6 sm:p-10">
        <Tag variant="peach">Pricing</Tag>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-display text-neutral-900 dark:text-neutral-100 leading-tight">
          Choose your plan
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Transparent, student-friendly plans built for computer science and IT undergraduates. Study smarter together.
        </p>

        {/* Student Verified Benefit Banner if logged in user is verified */}
        {isStudentVerified && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>{STUDENT_DISCOUNT.badgeText}:</strong> Premium is available at Rs. {verifiedMonthlyPrice} / month (was Rs. {livePlans[1].pricing.monthly}).
            </span>
          </div>
        )}

        {/* 3-WAY SEGMENTED CONTROL: Monthly · Semester · Yearly */}
        <div className="pt-4 flex justify-center">
          <div className="relative inline-flex items-center p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-[#E8E2D6] dark:border-neutral-700 shadow-xs">
            {/* Sliding Pill Indicator */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`absolute top-1.5 bottom-1.5 rounded-full shadow-sm bg-[#FF4A00] ${
                billingCycle === 'monthly'
                  ? 'left-1.5 w-[110px] sm:w-[124px]'
                  : billingCycle === 'semester'
                  ? 'left-[118px] sm:left-[132px] w-[130px] sm:w-[150px]'
                  : 'right-1.5 w-[124px] sm:w-[144px]'
              }`}
            />

            {/* Option 1: Monthly */}
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 w-[110px] sm:w-[124px] py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer text-center ${
                billingCycle === 'monthly'
                  ? 'text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>

            {/* Option 2: Semester (Default) */}
            <button
              onClick={() => setBillingCycle('semester')}
              className={`relative z-10 w-[130px] sm:w-[150px] py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                billingCycle === 'semester'
                  ? 'text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <span>Semester</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                  billingCycle === 'semester'
                    ? 'bg-amber-300 text-neutral-950'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {semesterSaving > 0 ? `-${semesterSaving}%` : '5 months'}
              </span>
            </button>

            {/* Option 3: Yearly */}
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative z-10 w-[124px] sm:w-[144px] py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                  billingCycle === 'yearly'
                    ? 'bg-amber-300 text-neutral-950'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {yearlySaving > 0 ? `Save ${yearlySaving}%` : '12 months'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THREE PLAN CARDS (Lift on hover, prices animate, Premium highlighted in orange-red) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
        {livePlans.map((plan) => {
          const isRecommended = recommendedPlanId === plan.id;
          const rawPrice = getDisplayPlanPrice(plan, billingCycle, false);
          const displayPrice = (plan.id === 'premium' && billingCycle === 'monthly' && isStudentVerified && studentDiscountPercent > 0)
            ? { ...rawPrice, amount: verifiedMonthlyPrice,
                isDiscounted: true, originalAmount: plan.pricing.monthly,
                perMonthAmount: verifiedMonthlyPrice }
            : rawPrice;

          return (
            <motion.div
              key={plan.id}
              id={`pricing-plan-${plan.id}`}
              tabIndex={-1}
              aria-label={`${plan.name} plan`}
              whileHover={{
                y: -8,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              }}
              className={`relative rounded-[24px] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-[#FF4A00] text-white shadow-xl ring-2 ring-[#FF4A00]'
                  : 'bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
              } ${
                isRecommended
                  ? 'ring-4 ring-amber-400 shadow-[0_0_35px_rgba(255,179,31,0.45)]'
                  : ''
              }`}
            >
              {/* Badges */}
              <div className="absolute -top-3.5 right-6 flex items-center gap-2">
                {isRecommended && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-400 text-neutral-950 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    <span>Recommended</span>
                  </span>
                )}
                {plan.badge && !isRecommended && (
                  <span
                    className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      plan.isPopular
                        ? 'bg-white text-[#FF4A00] shadow-sm'
                        : 'bg-[#263577] text-white shadow-sm'
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>

              <div>
                {/* Plan Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold font-display tracking-tight">
                      {plan.name}
                    </h3>

                    {/* Student Verified Badge on Premium */}
                    {plan.id === 'premium' && isStudentVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{STUDENT_DISCOUNT.badgeText}</span>
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs sm:text-sm mt-1.5 leading-relaxed min-h-[40px] ${
                      plan.isPopular ? 'text-orange-100' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Animated Price */}
                <div className="my-6 pb-6 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-baseline gap-1.5 font-display">
                    <span className="text-sm font-semibold tracking-wide">Rs.</span>

                    {/* Struck-through original price if student discount active */}
                    {displayPrice.isDiscounted && displayPrice.originalAmount && (
                      <span
                        className={`text-2xl font-bold line-through opacity-70 ${
                          plan.isPopular ? 'text-orange-200' : 'text-neutral-400'
                        }`}
                      >
                        {displayPrice.originalAmount.toLocaleString()}
                      </span>
                    )}

                    <motion.span
                      key={`${displayPrice.amount}-${billingCycle}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums"
                    >
                      {displayPrice.amount.toLocaleString()}
                    </motion.span>

                    <span
                      className={`text-sm font-medium ${
                        plan.isPopular ? 'text-orange-100' : 'text-neutral-500'
                      }`}
                    >
                      {displayPrice.periodLabel}
                    </span>
                  </div>

                  {/* Under Price: Per-month equivalent & Savings note */}
                  <div className="mt-2 space-y-1">
                    {plan.id === 'premium' && (
                      <div className="flex items-center gap-2">
                        {billingCycle === 'semester' && semesterSaving > 0 && (
                          <span
                            className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              plan.isPopular
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            Save {semesterSaving}%
                          </span>
                        )}
                        {billingCycle === 'yearly' && yearlySaving > 0 && (
                          <span
                            className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              plan.isPopular
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {yearlySaving > 0 ? `Save ${yearlySaving}%` : '12 months'}
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            plan.isPopular ? 'text-orange-100' : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {billingCycle === 'monthly'
                            ? isStudentVerified
                              ? `Student rate: Rs. ${verifiedMonthlyPrice.toLocaleString()} / month`
                              : 'Billed monthly'
                            : `≈ Rs. ${displayPrice.perMonthAmount.toLocaleString()} / month`}
                        </span>
                      </div>
                    )}

                    {plan.id === 'batch' && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            plan.isPopular ? 'text-white' : 'text-[#FF4A00]'
                          }`}
                        >
                          {`≈ Rs. ${(displayPrice.amount / 30).toLocaleString('en-LK',{maximumFractionDigits:2})} per member / ${billingCycle}`}
                        </span>
                        <span
                          className={`text-[11px] ${
                            plan.isPopular ? 'text-orange-200' : 'text-neutral-400'
                          }`}
                        >
                          (up to 30 students)
                        </span>
                      </div>
                    )}

                    {plan.id === 'free' && (
                      <span
                        className={`text-xs font-medium ${
                          plan.isPopular ? 'text-orange-100' : 'text-neutral-500'
                        }`}
                      >
                        Free forever · No credit card required
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8 text-xs sm:text-sm">
                  {plan.features.map((featText, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          plan.isPopular
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.8]" />
                      </span>
                      <span
                        className={
                          plan.isPopular
                            ? 'text-white font-medium'
                            : 'text-neutral-800 dark:text-neutral-200 font-medium'
                        }
                      >
                        {featText}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button & Under Button Note */}
              <div>
                <Button
                  variant={plan.isPopular ? 'white' : 'primary'}
                  size="md"
                  showArrow
                  className="w-full justify-between shadow-xs font-bold"
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={plan.id === 'premium' && currentUser?.plan === 'Premium'}
                >
                  {plan.id === 'premium' && currentUser?.plan === 'Premium' ? 'Current Plan ✓' : plan.id === 'premium' ? 'Choose Demo Premium' : plan.ctaText}
                </Button>

                {plan.id === 'premium' && (
                  <p className="text-center text-[11px] mt-2 font-medium text-orange-100/90">
                    Cancel anytime
                  </p>
                )}
                {plan.id !== 'premium' && plan.subCtaText && (
                  <p className="text-center text-[11px] mt-2 font-medium text-neutral-500 dark:text-neutral-400">
                    {plan.subCtaText}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. "WHICH PLAN IS RIGHT FOR ME?" 3-QUESTION MINI QUIZ */}
      <div role="region" aria-label="Student Plan Matcher" className="max-w-4xl mx-auto rounded-[24px] bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <Tag variant="amber">Student Plan Matcher</Tag>
          <h3 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
            Which plan is right for me?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
            Answer all 3 questions. Your recommended plan will appear here, below your answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Question 1 */}
          <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4A00] block">
              1. Download Volume
            </span>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              How often do you download module guides & past papers?
            </p>
            <div className="space-y-2 pt-1 text-xs">
              {[
                { val: 'occasional', label: '1–5 papers right before finals' },
                { val: 'frequent', label: 'Weekly for lab tasks & past papers' },
                { val: 'group', label: 'Collaborative batch downloads' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleQuizAnswer('q1', opt.val)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    quizAnswers.q1 === opt.val
                      ? 'border-[#FF4A00] bg-[#FF4A00]/10 font-bold text-[#FF4A00]'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4A00] block">
              2. Exam Prep Tools
            </span>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              What resources help you prepare for midterms and finals?
            </p>
            <div className="space-y-2 pt-1 text-xs">
              {[
                { val: 'slides', label: 'Free community notes & slides' },
                { val: 'ai', label: 'Full 5-year papers & AI summaries' },
                { val: 'cohort', label: 'Cohort shared question banks' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleQuizAnswer('q2', opt.val)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    quizAnswers.q2 === opt.val
                      ? 'border-[#FF4A00] bg-[#FF4A00]/10 font-bold text-[#FF4A00]'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4A00] block">
              3. Study Environment
            </span>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Do you study individually or with hostel & campus groups?
            </p>
            <div className="space-y-2 pt-1 text-xs">
              {[
                { val: 'solo', label: 'Solo self-paced study' },
                { val: 'high_gpa', label: 'Solo, aiming for top batch GPA' },
                { val: 'batch', label: 'Hostel/cohort study circle (5–30)' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleQuizAnswer('q3', opt.val)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    quizAnswers.q3 === opt.val
                      ? 'border-[#FF4A00] bg-[#FF4A00]/10 font-bold text-[#FF4A00]'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div ref={recommendationRef} aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            {hasCompletedQuiz && recommendedPlanId && showRecommendation && (() => {
              const plan = livePlans.find(p => p.id === recommendedPlanId)!;
              const reason = recommendedPlanId === 'batch'
                ? 'You chose shared resources or group study. Batch Pack is designed for a study group.'
                : recommendedPlanId === 'free'
                ? 'You download occasionally and prefer free community resources. Free is a good starting point.'
                : 'You chose frequent downloads or additional study tools. Premium is worth comparing with Free.';
              return <motion.section key={recommendedPlanId} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}}
                className="plan-match-result relative rounded-2xl border-2 p-5 sm:p-6" aria-labelledby="plan-match-title">
                <button type="button" aria-label="Dismiss plan recommendation" onClick={() => {setShowRecommendation(false); requestAnimationFrame(() => document.getElementById('show-plan-recommendation')?.focus());}}
                  className="absolute top-3 right-3 rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500"><X size={20}/></button>
                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pr-10"><Sparkles size={18}/> Your plan match</p>
                <h4 id="plan-match-title" className="text-2xl font-bold mt-2 pr-8">We recommend {plan.name}</h4>
                <p className="text-sm mt-2 max-w-2xl">{reason}</p>
                <p className="text-sm mt-2 max-w-2xl">Compare the price and features before choosing. Your current membership stays the same.</p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <button type="button" onClick={() => {
                    const card = document.getElementById(`pricing-plan-${recommendedPlanId}`);
                    card?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
                    card?.focus({preventScroll:true});
                  }} className="rounded-full bg-[#263577] text-white px-5 py-2.5 text-sm font-bold">View {plan.name} plan and price ↑</button>
                  <button type="button" onClick={handleResetQuiz} className="rounded-full border border-current px-4 py-2.5 text-sm font-semibold">Start again</button>
                </div>
              </motion.section>;
            })()}
          </AnimatePresence>
        </div>
        {hasCompletedQuiz && !showRecommendation && <div className="flex flex-wrap gap-3">
          <button id="show-plan-recommendation" type="button" onClick={() => setShowRecommendation(true)} className="rounded-full bg-[#263577] text-white px-5 py-2.5 text-sm font-bold">Show my recommendation</button>
          <button type="button" onClick={handleResetQuiz} className="rounded-full border border-neutral-400 px-4 py-2.5 text-sm font-semibold">Start again</button>
        </div>}
      </div>

      {/* 4. FULL FEATURE COMPARISON TABLE (Keep a clear gap, generated from the Plan config) */}
      <div className="space-y-6 max-w-6xl mx-auto pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 dark:text-neutral-100">
            Complete Feature Comparison
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
            Everything included across Free, Premium, and Batch licenses in detail.
          </p>
        </div>

        <div className="rounded-[24px] border border-[#E8E2D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[620px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800/95 backdrop-blur-md border-b border-[#E8E2D6] dark:border-neutral-700">
                <tr>
                  <th className="p-4 sm:p-5 font-extrabold text-neutral-900 dark:text-neutral-100 w-2/5">
                    Plans & Capabilities
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-neutral-800 dark:text-neutral-200 text-center w-1/5">
                    Free
                  </th>
                  <th className="p-4 sm:p-5 font-extrabold text-[#FF4A00] text-center w-1/5 bg-[#FF4A00]/5">
                    Premium
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-neutral-800 dark:text-neutral-200 text-center w-1/5">
                    Batch Pack
                  </th>
                </tr>
              </thead>

              {/* Grouped Rows */}
              <tbody>
                {COMPARISON_TABLE_DATA.map((catGroup) => {
                  const isExpanded = expandedCategories[catGroup.groupName] ?? true;

                  return (
                    <React.Fragment key={catGroup.groupName}>
                      {/* Group Header Row */}
                      <tr
                        onClick={() => toggleCategory(catGroup.groupName)}
                        className="bg-neutral-100/70 dark:bg-neutral-800/60 border-t border-b border-[#E8E2D6] dark:border-neutral-700/80 cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
                      >
                        <td colSpan={4} className="p-3.5 sm:px-5">
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                            <span className="flex items-center gap-2">
                              {catGroup.groupName === 'Downloads & Access' ? (
                                <Download className="w-4 h-4 text-[#FF4A00]" />
                              ) : catGroup.groupName === 'Publishing & Storage' ? (
                                <BookOpen className="w-4 h-4 text-[#1E6FEB]" />
                              ) : (
                                <Zap className="w-4 h-4 text-[#FFB31F]" />
                              )}
                              <span>{catGroup.groupName}</span>
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-neutral-500 lowercase font-normal dark:text-neutral-300">
                              <span>{isExpanded ? 'collapse' : 'expand'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Feature Rows */}
                      {isExpanded &&
                        catGroup.rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-neutral-100 dark:border-neutral-800/80 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                          >
                            {/* Feature Name & Tooltip */}
                            <td className="p-4 sm:px-5 font-medium text-neutral-900 dark:text-neutral-100">
                              <div className="font-semibold">{row.name}</div>
                              {row.tooltip && (
                                <div className="text-[11px] text-neutral-400 mt-0.5 dark:text-neutral-300">
                                  {row.tooltip}
                                </div>
                              )}
                            </td>

                            {/* Free column */}
                            <td className="p-4 text-center">
                              {typeof row.free === 'boolean' ? (
                                row.free ? (
                                  <Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" />
                                ) : (
                                  <X className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
                                )
                              ) : (
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                  {row.free}
                                </span>
                              )}
                            </td>

                            {/* Premium column (highlighted) */}
                            <td className="p-4 text-center bg-[#FF4A00]/5 font-bold text-[#FF4A00]">
                              {typeof row.premium === 'boolean' ? (
                                row.premium ? (
                                  <Check className="w-4 h-4 text-[#FF4A00] mx-auto stroke-[2.8]" />
                                ) : (
                                  <X className="w-4 h-4 text-neutral-300 mx-auto dark:text-neutral-300" />
                                )
                              ) : (
                                <span>{row.premium}</span>
                              )}
                            </td>

                            {/* Batch Pack column */}
                            <td className="p-4 text-center">
                              {typeof row.batch === 'boolean' ? (
                                row.batch ? (
                                  <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[2.5]" />
                                ) : (
                                  <X className="w-4 h-4 text-neutral-300 mx-auto dark:text-neutral-300" />
                                )
                              ) : (
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  {row.batch}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Short note under the table as requested */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border-t border-[#E8E2D6] dark:border-neutral-700 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Demo prices. Checkout is a simulation.
          </div>
        </div>
      </div>

      {/* 5. FAQ ACCORDION */}
      <div className="space-y-5 max-w-3xl mx-auto pt-4">
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
            Frequently Asked Questions
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">
            Answers to common queries regarding student subscriptions and licenses.
          </p>
        </div>

        {pricingFaqs.map((faq, idx) => (
          <AccordionItem
            key={idx}
            index={idx}
            question={faq.question}
            answer={faq.answer}
            isOpen={openFaqIndex === idx}
            onToggle={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
          />
        ))}
      </div>

      {/* 6. FINAL CTA BLOCK IN NAVY (#263577) */}
      <div className="max-w-5xl mx-auto rounded-[28px] bg-[#263577] text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#1E6FEB]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF4A00]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            Ready to Ace Your Exams?
          </span>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display tracking-tight leading-tight">
            Start Learning with EduShare Today
          </h3>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            Join thousands of university IT classmates sharing lecture notes, lab guides, and verified 5-year exam answer proofs.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Button
              variant="primary"
              size="lg"
              className="bg-[#FF4A00] hover:bg-[#e04100] text-white shadow-md font-bold text-sm"
              onClick={() => handlePlanSelect('Premium Pass')}
              disabled={currentUser?.plan === 'Premium'}
            >
              {currentUser?.plan === 'Premium' ? 'Premium Active ✓' : 'Start 7-day free trial →'}
            </Button>
            <Button
              to="/browse"
              variant="white"
              size="lg"
              className="text-[#263577] font-bold text-sm"
            >
              Explore Free Catalog
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs text-blue-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFB31F]" />
              <span>Cancel anytime</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFB31F]" />
              <span>14-day student guarantee</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#FFB31F]" />
              <span>Zero cancellation fees</span>
            </span>
          </div>
        </div>
      </div>

      {currentUser && (
        <section id="manage-membership" className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 space-y-4" aria-label="Membership and billing">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Membership & Billing</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">View or cancel your demo Premium plan. No real payments are made.</p>
            </div>
            <button type="button" onClick={() => void loadMembership()} className="rounded-full border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-semibold">Refresh status</button>
          </div>
          {membershipLoading ? <p className="text-sm">Loading membership...</p> : (
            <div className="space-y-3 text-sm text-neutral-800 dark:text-neutral-100">
              <p><strong>Current plan:</strong> {membership?.active ? 'Premium' : 'Free'}</p>
              {membership?.endDate && <p><strong>Access ends:</strong> {membership.endDate.replace('T', ' ').slice(0, 16)}</p>}
              {membership?.cycle && <p><strong>Billing period:</strong> {membership.cycle}</p>}
              {membership?.cancelled && <p className="text-amber-700 dark:text-amber-300 font-semibold">Cancellation scheduled. Access stays until your end date. No renewal.</p>}
              {membership?.legacy && <p className="text-amber-700 dark:text-amber-300">Older demo membership: no end date saved. Cancelling ends access now.</p>}
              {membership?.active && !membership?.cancelled && <button type="button" onClick={() => {setCancelError(''); setCancelOpen(true);}} className="rounded-full border border-rose-400 px-5 py-2.5 font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30">Cancel Premium</button>}
            </div>
          )}
        </section>
      )}
      <Modal isOpen={cancelOpen} onClose={() => {if (!cancelBusy) setCancelOpen(false);}} title="Cancel Premium" description="Your account and uploaded resources will not be deleted." maxWidth="md">
        <div className="space-y-4 text-sm text-neutral-900 dark:text-neutral-100">
          <p>{membership?.legacy ? 'This older demo plan has no saved end date and will end now.' : 'Your Premium access remains until the saved end date. There is no renewal or cancellation charge.'}</p>
          <label className="block font-semibold" htmlFor="cancel-reason">Why are you cancelling?</label>
          <select id="cancel-reason" value={cancelReason} onChange={event => setCancelReason(event.target.value)} className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-3">
            <option>I am not using Premium enough</option><option>It costs too much</option><option>I do not need the features</option><option>I prefer the Free plan</option><option>Other reason</option>
          </select>
          <label className="block font-semibold" htmlFor="cancel-confirm">Type CANCEL to confirm</label>
          <input id="cancel-confirm" value={cancelConfirm} onChange={event => setCancelConfirm(event.target.value)} placeholder="CANCEL" className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-3" />
          {cancelError && <p role="alert" className="text-rose-600 dark:text-rose-300">{cancelError}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setCancelOpen(false)} disabled={cancelBusy} className="rounded-full border border-neutral-300 dark:border-neutral-700 px-5 py-2.5 font-semibold">Keep Premium</button>
            <button type="button" onClick={() => void cancelMembership()} disabled={cancelBusy || cancelConfirm !== 'CANCEL'} className="rounded-full bg-rose-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{cancelBusy ? 'Saving...' : 'Confirm cancellation'}</button>
          </div>
        </div>
      </Modal>
      <div className="text-center">
        <button type="button" onClick={openPaymentHistory} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 px-5 py-3 font-semibold text-sm hover:border-[#FF4A00] transition-colors"><ReceiptText className="h-4 w-4" /> View My Demo Payment History</button>
      </div>
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="My Demo Payment History" description="Only simulated transactions for your EduShare account are shown here." maxWidth="lg">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {historyBusy ? <p className="text-sm">Loading...</p> : paymentHistory.length === 0 ? <p className="text-sm text-neutral-500 dark:text-neutral-300">No demo payments yet.</p> : paymentHistory.map(item => (
            <div key={item.reference} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-sm space-y-1">
              <div className="flex justify-between gap-2"><strong>{item.reference}</strong><span className="text-emerald-600">Demo successful</span></div>
              <p>{item.plan.toUpperCase()} · {item.cycle} · Rs. {Number(item.amount).toLocaleString('en-LK')}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-300">{item.method} · {item.date}</p>
            </div>
          ))}
        </div>
      </Modal>
      {/* DEMO checkout — uses test method tokens only; no payment credentials are collected. */}
      <Modal
        isOpen={!!selectedPlanModal}
        onClose={() => { if (!paymentBusy) setSelectedPlanModal(null); }}
        title={paymentReceipt ? 'Payment complete' : 'Payment Details — Demo'}
        description="Practice checkout with realistic fields. No real payment is processed."
        maxWidth="lg"
      >
        {paymentReceipt ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-900">
              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-emerald-600" />
              <h4 className="text-xl font-bold">Demo payment successful!</h4>
              <p className="mt-1 text-sm">Your Premium access has been enabled.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4 text-sm space-y-2 dark:border-neutral-700">
              <div className="flex justify-between"><span>Reference</span><strong className="select-all">{paymentReceipt.reference}</strong></div>
              <div className="flex justify-between"><span>Amount</span><strong>Rs. {paymentReceipt.amount.toLocaleString('en-LK')} (DEMO)</strong></div>
              <div className="flex justify-between"><span>Payment type</span><strong>{paymentReceipt.method === 'googlepay' ? 'Google Pay demo' : paymentReceipt.method === 'bank' ? 'Bank transfer demo' : paymentReceipt.method.toUpperCase() + ' demo'}</strong></div>
              <div className="flex justify-between"><span>Test details</span><strong>{receiptAccount}</strong></div>
              <div className="flex justify-between"><span>Charged</span><strong className="text-emerald-600">Rs. 0 — simulation only</strong></div>
            </div>
            <Button variant="primary" size="md" className="w-full" onClick={() => {setSelectedPlanModal(null); setPaymentReceipt(null); navigate('/profile');}}>Go to My Profile →</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-medium text-amber-900">
              <ShieldCheck className="w-5 h-5 shrink-0" /> TEST MODE — Use made-up bank details or the supplied test card. Never enter real banking details, passwords or OTPs. No money will be charged.
            </div>
            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Plan</span><strong>{selectedPlanModal}</strong></div>
              <div className="flex justify-between text-sm"><span>Period</span><strong>{billingCycle === 'semester' ? 'Semester (5 months)' : billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</strong></div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 flex justify-between font-bold"><span>Demo total</span><span>Rs. {(selectedPlanModal?.toLowerCase().includes('batch') ? livePlans[2].pricing[billingCycle] : (billingCycle === 'monthly' && isStudentVerified ? verifiedMonthlyPrice : livePlans[1].pricing[billingCycle])).toLocaleString('en-LK')}</span></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">Choose a payment method</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['visa', 'Visa', CreditCard],
                  ['mastercard', 'Mastercard', CreditCard],
                  ['googlepay', 'Google Pay', Smartphone],
                  ['bank', 'Bank Transfer', Building2],
                ] as const).map(([id, name, Icon]) => (
                  <button type="button" key={id} onClick={() => setDemoMethod(id)} className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold text-left flex items-center gap-2 transition-colors ${demoMethod === id ? 'border-[#FF4A00] bg-orange-50 text-neutral-900' : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-300'}`}>
                    <Icon className="h-5 w-5" /> {name}
                  </button>
                ))}
              </div>
              {demoMethod === 'bank' ? (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><strong>Bank Transfer Details</strong><span className="text-xs text-orange-600 dark:text-orange-300">Test mode</span></div>
                  <label htmlFor="demo-bank" className="block font-semibold">Bank</label>
                  <select id="demo-bank" className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" value={demoBank} onChange={e => setDemoBank(e.target.value)}>
                    <option>Commercial Bank of Ceylon</option><option>Bank of Ceylon</option><option>People's Bank</option><option>Hatton National Bank</option><option>Sampath Bank</option><option>National Development Bank</option>
                  </select>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block"><span className="block mb-1 font-semibold">Account holder</span><input autoComplete="off" value={bankHolder} onChange={e => setBankHolder(e.target.value)} placeholder="Example Student" maxLength={80} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" /></label>
                    <label className="block"><span className="block mb-1 font-semibold">Account number (test only)</span><input autoComplete="off" inputMode="numeric" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="000012345678" maxLength={16} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" /></label>
                    <label className="block"><span className="block mb-1 font-semibold">Bank branch</span><input autoComplete="off" value={bankBranch} onChange={e => setBankBranch(e.target.value)} placeholder="Colombo" maxLength={60} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" /></label>
                    <label className="block"><span className="block mb-1 font-semibold">Transfer reference (optional)</span><input autoComplete="off" value={bankReference} onChange={e => setBankReference(e.target.value)} placeholder="EDU-TEST-001" maxLength={40} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" /></label>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">Example: 000012345678. These fields simulate bank entry only; the account number, holder, branch and reference are never sent to the server or saved.</p>
                </div>
              ) : demoMethod === 'visa' || demoMethod === 'mastercard' ? (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3 text-sm">
                  <strong>{demoMethod === 'visa' ? 'Visa' : 'Mastercard'} test card</strong>
                  <label htmlFor="demo-test-card" className="block font-semibold">Card number (test card only)</label>
                  <input id="demo-test-card" autoComplete="off" inputMode="numeric" value={testCardNumber} onChange={e => setTestCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder={demoMethod === 'visa' ? '4111111111111111' : '5555555555554444'} maxLength={16} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" />
                  <button type="button" onClick={() => setTestCardNumber(demoMethod === 'visa' ? '4111111111111111' : '5555555555554444')} className="text-orange-600 dark:text-orange-300 underline font-semibold">Fill test number</button>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">This demo accepts only the displayed test card. It does not ask for CVV, expiry, OTP or any real card details.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-sm">
                  <strong>Google Pay demonstration</strong>
                  <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-300">Simulated wallet confirmation. No Google login or real wallet payment is requested.</p>
                </div>
              )}
            </div>
            {paymentError && <p role="alert" className="text-sm text-red-600 rounded-lg bg-red-50 p-3">{paymentError}</p>}
            <Button variant="primary" size="md" className="w-full" disabled={paymentBusy} onClick={handleConfirmPlan}>{paymentBusy ? 'Processing demo payment...' : 'Complete Demo Payment →'}</Button>
            <p className="text-center text-xs text-neutral-500 flex items-center justify-center gap-1 dark:text-neutral-300"><LockKeyhole className="h-3 w-3"/> This is a university project simulation, not a live payment gateway.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
