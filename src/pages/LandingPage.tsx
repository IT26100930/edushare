import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import {
  TrendingUp,
  ShieldCheck,
  Coins,
  Users,
  GraduationCap,
  FileCheck2,
  DollarSign,
  Share2,
  Sparkles,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

import { Button } from '../components/Button.tsx';
import { Tag } from '../components/Tag.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { Marquee } from '../components/Marquee.tsx';
import { BentoCard } from '../components/BentoCard.tsx';
import { BentoDashboard } from '../components/BentoDashboard.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { PlanCard } from '../components/PlanCard.tsx';
import { AccordionItem } from '../components/AccordionItem.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { useApp } from '../context/AppContext.tsx';
import { PLANS_CONFIG, BillingCycle } from '../data/plansConfig.ts';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { currentUser, addToast } = useApp();

  const [creatorShare, setCreatorShare] = useState(90);
  const [landingPlans, setLandingPlans] = useState(PLANS_CONFIG);
  const [liveStats, setLiveStats] = useState<{
    resources: number; modules: number; groups: number; downloads: number;
  } | null>(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const response = await fetch('/api/public/landing-stats', { cache: 'no-store' });
        if (!response.ok) throw new Error('Statistics unavailable');
        const data: unknown = await response.json();
        if (typeof data !== 'object' || data === null) throw new Error('Invalid statistics');
        const parsed = data as Record<string, unknown>;
        const keys = ['resources', 'modules', 'groups', 'downloads'] as const;
        if (!keys.every(key => typeof parsed[key] === 'number'
            && Number.isSafeInteger(parsed[key]) && (parsed[key] as number) >= 0)) {
          throw new Error('Invalid statistics');
        }
        if (mounted) {
          setLiveStats({
            resources: parsed.resources as number,
            modules: parsed.modules as number,
            groups: parsed.groups as number,
            downloads: parsed.downloads as number,
          });
          setStatsError(false);
        }
      } catch {
        if (mounted) { setLiveStats(null); setStatsError(true); }
      }
    };
    void loadStats();
    window.addEventListener('focus', loadStats);
    return () => { mounted = false; window.removeEventListener('focus', loadStats); };
  }, []);


  useEffect(() => {
    fetch('/api/config/prices', { credentials: 'include', cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Pricing unavailable')))
      .then((values: Record<string, number>) => {
        if (Number.isFinite(values.platformRoyaltyShare)) setCreatorShare(values.platformRoyaltyShare);
        setLandingPlans(PLANS_CONFIG.map(plan => {
          if (plan.id === 'free') return plan;
          const monthly = values[plan.id + 'Monthly'];
          const semester = values[plan.id + 'Semester'];
          const yearly = values[plan.id + 'Yearly'];
          if (![monthly, semester, yearly].every(Number.isFinite)) return plan;
          return { ...plan, pricing: { monthly, semester, yearly },
            perMonthEquivalent: { monthly, semester: Math.round(semester / 5), yearly: Math.round(yearly / 12) } };
        }));
      })
      .catch(() => { /* The default demo prices remain available if offline. */ });
  }, []);

  // Parallax for hero illustration
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroIllustrationY = useTransform(scrollYProgress, [0, 1], [0, 48]);

  // Pricing billing state (3-way: monthly, semester, yearly)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('semester');

  // FAQ accordion state (first item open by default)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Quick Action Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });
  const [modalSuccess, setModalSuccess] = useState(false);

  const handleOpenAction = (title: string, description: string) => {
    if (!currentUser) {
      navigate('/login', {state: {from: '/pricing', intent: title}});
      return;
    }
    navigate('/pricing');
  };

  const handleCloseAction = () => {
    setModalSuccess(false);
    setActionModal((prev) => ({ ...prev, isOpen: false }));
  };

  const faqData = [
    {
      question: 'Why so affordable?',
      answer:
        'EduShare is built by students for students. Free always stays useful; Premium just removes limits.',
    },
    {
      question: 'Is EduShare free to use?',
      answer:
        'Yes! EduShare is completely free to create an account, browse university module catalogs, join peer study lounges, and download community notes every month. Premium is only required for unlimited high-speed downloads and full 5-year past paper solution packs.',
    },
    {
      question: 'Can I sell my own PDFs?',
      answer:
        'You can share your original study notes and past paper solutions. Selling and payouts are demonstrations only; this project does not transfer real money.',
    },
    {
      question: 'How do you stop fake accounts?',
      answer:
        'Every uploader and peer tutor must verify their accredited university email (.edu, .ac.uk, .ac.in, etc.) or submit active semester enrollment credentials. All submitted PDF materials go through an automated malware scanner and peer review validation before going live.',
    },
    {
      question: 'Is the payment real?',
      answer:
        'Not yet. EduShare offers a safe checkout demo for Visa, Mastercard, Google Pay and Sri Lankan bank transfers. It does not collect real payment details or charge money.',
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero: real EduShare art, live accessible text and working navigation. */}
      <section
        id="hero"
        ref={heroRef}
        className="home-hero relative isolate w-full px-4 sm:px-6 lg:px-8 xl:px-14 pt-12 pb-12 md:pt-16 md:pb-20 lg:py-20 overflow-hidden"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none hero-orbit absolute -z-10 rounded-full bg-[#FFF0D4] dark:bg-[#2B1E20]/70"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="home-hero-grid relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-10 xl:gap-16">
          <div className="lg:col-span-7 order-2 lg:order-1 relative flex justify-center items-center min-w-0">
            <motion.div
              className="home-hero-art relative w-full max-w-[980px]"
              style={shouldReduceMotion ? undefined : { y: heroIllustrationY }}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 46, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.img
                src="/images/edushare-collaborative-hero.png"
                alt="Five students studying together around an EduShare laptop, sharing books and notes"
                loading="eager"
                decoding="async"
                className="relative block w-full h-auto object-contain select-none drop-shadow-[0_18px_22px_rgba(36,27,18,0.08)]"
                animate={shouldReduceMotion ? undefined : { y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute top-[16%] left-[12%] rounded-2xl border border-[#FFE3D6] bg-white/95 dark:bg-[#27262C] dark:border-white/10 px-3 py-3 shadow-xl text-[#FF4A00]"
                animate={shouldReduceMotion ? undefined : { y: [0, -10, 0], rotate: [-5, 0, -5] }}
                transition={{ duration: 5.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BookOpen size={24} aria-hidden="true" />
              </motion.div>
              <motion.div
                aria-hidden="true"
                className="absolute right-[13%] top-[13%] rounded-2xl border border-[#FFE3D6] bg-white/95 dark:bg-[#27262C] dark:border-white/10 px-3 py-3 shadow-xl text-[#2563EB]"
                animate={shouldReduceMotion ? undefined : { y: [0, 11, 0], rotate: [4, -2, 4] }}
                transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GraduationCap size={25} aria-hidden="true" />
              </motion.div>
              <motion.div
                aria-hidden="true"
                className="absolute top-[43%] right-[1%] text-[#FF8709]"
                animate={shouldReduceMotion ? undefined : { rotate: [0, 25, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={30} />
              </motion.div>
            </motion.div>
          </div>
          <div className="home-hero-copy lg:col-span-5 order-1 lg:order-2 flex flex-col items-start gap-6 lg:gap-8 min-w-0">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              <Tag variant="peach">Study Together, Go Further</Tag>
            </motion.div>
            <h1 className="font-display font-semibold text-[#111111] dark:text-white leading-[0.98] tracking-[-0.055em] text-[clamp(3.2rem,5.4vw,6.4rem)]">
              {['Learn Smarter', 'with EduShare'].map((line, index) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: '105%' }}
                    animate={{ opacity: 1, y: '0%' }}
                    transition={{ duration: 0.78, delay: 0.24 + index * 0.13, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              className="max-w-lg text-base sm:text-lg md:text-xl text-[#555555] dark:text-neutral-300 leading-relaxed"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 17 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.49 }}
            >
              Share notes, past papers, and study resources with classmates.
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-3 items-center"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 17 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.58 }}
            >
              <Button variant="primary" size="lg" to={currentUser ? '/browse' : '/register'} showArrow>
                {currentUser ? 'Explore Resources' : 'Get Started for Free'}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => {
                document.getElementById('bento')?.scrollIntoView({
                  behavior: shouldReduceMotion ? 'auto' : 'smooth',
                  block: 'start',
                });
              }}>
                Learn more
              </Button>
            </motion.div>
            <motion.div
              className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-600 dark:text-neutral-300 pt-1"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.85 }}
            >
              <span className="inline-flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Student resources</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Collaborative learning</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 3: Marquee */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <Marquee />
      </section>

      {/* Section 4: Bento Section */}
      <section id="bento" className="scroll-mt-24 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14 md:py-20">
        <Reveal className="max-w-2xl mb-12">
          <Tag variant="amber" className="mb-3">
            Curated Academic Hub
          </Tag>
          <h2 className="h2-headline text-[#111111] dark:text-neutral-100 font-display mb-4">
            Everything a student needs, in one place
          </h2>
          <p className="text-base text-[#555555] dark:text-neutral-400 leading-relaxed">
            Find study notes, past papers and shared learning resources in one place.
          </p>
        </Reveal>

        {/* 6-column grid, 4 colour-block cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Card 1: Wide Amber (col-span-4 on 6-col) with mini dashboard mockup */}
          <Reveal delay={0.1} className="md:col-span-4">
            <BentoCard
              variant="amber"
              title="Semester Mastery Dashboard"
              description="See real activity from the EduShare resource catalog."
              icon={<TrendingUp className="w-6 h-6 stroke-[2.3]" />}
              badge="Interactive Live Tracker"
            >
              <BentoDashboard />
            </BentoCard>
          </Reveal>

          {/* Card 2: Blue (col-span-2 on 6-col) */}
          <Reveal delay={0.2} className="md:col-span-2">
            <BentoCard
              variant="blue"
              title="Secure PDF Downloads"
              description="Downloaded PDFs can be marked with your Student ID to discourage unauthorized sharing and protect the original uploader."
              icon={<ShieldCheck className="w-6 h-6 stroke-[2.3]" />}
              badge="Protected"
              className="h-full"
            >
              <div className="mt-6 p-4 rounded-[16px] bg-white/10 backdrop-blur-xs border border-white/20 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-blue-100">
                  <span>Protected PDF</span>
                  <span className="text-emerald-300">Verified &#10003;</span>
                </div>
                <div className="text-neutral-200 text-[11px] leading-tight">
                  Files are available to authorized EduShare members
                </div>
              </div>
            </BentoCard>
          </Reveal>

          {/* Card 3: Orange-Red (col-span-2 on 6-col) */}
          <Reveal delay={0.3} className="md:col-span-2">
            <BentoCard
              variant="orange"
              title={`Share Your Notes · ${creatorShare}% Creator Share`}
              description="Share your notes, lab reports, and coding guides. You can add your own learning resources."
              icon={<Coins className="w-6 h-6 stroke-[2.3]" />}
              badge="Creator Payouts"
              className="h-full"
            >
              <div className="mt-6 p-4 rounded-[16px] bg-white/10 backdrop-blur-xs border border-white/20 text-xs">
                <div className="text-orange-100 text-[11px] uppercase tracking-wider font-semibold mb-1">
                  Demo Creator Share
                </div>
                <div className="text-2xl font-bold font-display text-white tabular-nums">
                  {creatorShare}%
                </div>
                <p className="text-[11px] text-orange-200 mt-1">
                  Real payouts are not enabled
                </p>
              </div>
            </BentoCard>
          </Reveal>

          {/* Card 4: Wide Navy (col-span-4 on 6-col) with illustration bottom-right */}
          <Reveal delay={0.4} className="md:col-span-4">
            <BentoCard
              variant="navy"
              title="Campus Peer Study Circles & Coding Labs"
              description="Collaborate directly with students in your specific cohort. Share live compiler snippets, debug database schema assignments, and conquer tough finals together."
              icon={<Users className="w-6 h-6 stroke-[2.3]" />}
              badge="Peer Lounges"
              className="relative overflow-hidden"
            >
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-12 gap-5 items-end">
                <div className="sm:col-span-6 space-y-3 relative z-10 pb-2">
                  <div className="flex items-center gap-2 text-xs text-blue-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Curated module syllabus mapping</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Verified solution keys from top seniors</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Anonymous discussion & tutor support</span>
                  </div>
                </div>
                <div className="sm:col-span-6 relative flex justify-center sm:justify-end items-end min-h-[205px] sm:min-h-[245px]">
                  {/* Transparent PNG: no white tile or cropped thumbnail background. */}
                  <motion.img
                    src="/images/study-circles-collaboration.png"
                    alt="Students collaborating on coding projects and sharing study notes"
                    loading="lazy"
                    decoding="async"
                    className="w-full max-w-[460px] h-auto max-h-[320px] object-contain object-bottom drop-shadow-[0_15px_14px_rgba(9,14,40,0.26)] select-none pointer-events-none"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
                    transition={shouldReduceMotion ? undefined : {
                      opacity: { duration: 0.65 },
                      scale: { duration: 0.65 },
                      y: { duration: 4.4, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  />
                </div>
              </div>
            </BentoCard>
          </Reveal>
        </div>
      </section>

      {/* Section 5: Stats + Features */}
      <section id="stats" className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14 md:py-20 border-t border-[#E8E2D6] dark:border-neutral-800/80">
        <Reveal className="max-w-2xl mb-12">
          <Tag variant="orange" className="mb-3">
            Proven Academic Impact
          </Tag>
          <h2 className="h2-headline text-[#111111] dark:text-neutral-100 font-display mb-4">
            Learn faster with EduShare
          </h2>
          <p className="text-base text-[#555555] dark:text-neutral-400 leading-relaxed">
            Live EduShare activity: shared learning resources, available modules, study circles and recorded downloads.
          </p>
        </Reveal>

        {/* Real, server-backed counts; never fall back to fabricated numbers. */}
        {liveStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-14">
            <StatCard value={liveStats.resources} suffix="" label="Shared resources" sublabel="Approved resources" />
            <StatCard value={liveStats.modules} suffix="" label="IT modules" sublabel="Active modules" />
            <StatCard value={liveStats.groups} suffix="" label="Study groups" sublabel="Created study circles" />
            <StatCard value={liveStats.downloads} suffix="" label="Downloads" sublabel="Recorded download events" />
          </div>
        ) : (
          <div className="mb-14 rounded-2xl border border-[#E8E2D6] dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/50 p-6 text-sm text-neutral-500 dark:text-neutral-400" role="status">
            {statsError ? 'Live statistics are temporarily unavailable.' : 'Loading live EduShare statistics...'}
          </div>
        )}

        {/* 2x2 Peach Feature Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Student accounts',
              desc: 'Members can request account verification. A verified account does not guarantee that every uploaded document is accurate.',
              icon: GraduationCap,
            },
            {
              title: 'PDF resources',
              desc: 'Preview and download study documents that you have permission to use.',
              icon: FileCheck2,
            },
            {
              title: 'Sell your notes',
              desc: `Set demo prices for your resources. Creators receive a ${creatorShare}% share of simulated sales; no real payouts are made.`,
              icon: DollarSign,
            },
            {
              title: 'Share anywhere',
              desc: 'Browse available resources from your computer or phone. Download access depends on resource permissions.',
              icon: Share2,
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Reveal key={feat.title} delay={idx * 0.08}>
                <motion.div
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -4,
                          boxShadow: '0 16px 24px -10px rgba(255, 74, 0, 0.12)',
                          transition: { type: 'spring', stiffness: 350, damping: 25 },
                        }
                  }
                  className="p-8 rounded-[24px] bg-[#FDE7E0] dark:bg-[#271E1C] border border-[#FF4A00]/20 dark:border-[#FF4A00]/30 flex flex-col justify-between transition-colors shadow-xs"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#382622] text-[#FF4A00] flex items-center justify-center mb-6 shadow-xs">
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#111111] dark:text-neutral-100 font-display mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Section 6: Pricing */}
      <section id="pricing" className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14 md:py-20 border-t border-[#E8E2D6] dark:border-neutral-800/80">
        <Reveal className="max-w-2xl mx-auto text-center mb-10">
          <Tag variant="peach" className="mb-3">
            Simple Student Pricing
          </Tag>
          <h2 className="h2-headline text-[#111111] dark:text-neutral-100 font-display mb-4">
            Choose your plan
          </h2>
          <p className="text-base text-[#555555] dark:text-neutral-400 leading-relaxed">
            Invest in your degree with plans built for individual study sprints or entire university module batches.
          </p>

          {/* 3-WAY SEGMENTED CONTROL: Monthly · Semester · Yearly */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-[#E8E2D6] dark:border-neutral-700 shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#FF4A00] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('semester')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'semester'
                  ? 'bg-[#FF4A00] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <span>Semester</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                  billingCycle === 'semester'
                    ? 'bg-amber-300 text-neutral-950'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                -20%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-[#FF4A00] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                  billingCycle === 'yearly'
                    ? 'bg-amber-300 text-neutral-950'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                Save 37%
              </span>
            </button>
          </div>
        </Reveal>

        {/* 3 Pricing Cards generated from single source PLANS_CONFIG */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {landingPlans.map((plan, idx) => (
            <Reveal key={plan.id} delay={0.1 * (idx + 1)} className="h-full">
              <PlanCard
                plan={plan}
                billingCycle={billingCycle}
                isStudentVerified={Boolean(currentUser?.isVerified)}
                onSelect={() =>
                  handleOpenAction(
                    `${plan.name} Account Access`,
                    plan.id === 'free'
                      ? 'Create your free student account to download 5 verified module papers every month.'
                      : plan.id === 'premium'
                      ? `Unlock complete past papers and unlimited downloads at student-friendly rates.`
                      : 'Enroll your study cohort with 30 student accounts and a shared library.'
                  )
                }
                className="h-full"
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section id="faq" className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14 md:py-20 border-t border-[#E8E2D6] dark:border-neutral-800/80">
        <Reveal className="max-w-2xl mb-12">
          <Tag variant="amber" className="mb-3">
            Got Questions?
          </Tag>
          <h2 className="h2-headline text-[#111111] dark:text-neutral-100 font-display mb-4">
            Frequently asked questions
          </h2>
          <p className="text-base text-[#555555] dark:text-neutral-400 leading-relaxed">
            Clear answers regarding student accounts, copyright integrity, selling notes, and security.
          </p>
        </Reveal>

        {/* 4 Accordion Items */}
        <div className="space-y-4 max-w-3xl">
          {faqData.map((item, idx) => (
            <Reveal key={idx} delay={idx * 0.08}>
              <AccordionItem
                index={idx}
                question={item.question}
                answer={item.answer}
                isOpen={openFaqIndex === idx}
                onToggle={() =>
                  setOpenFaqIndex((prev) => (prev === idx ? null : idx))
                }
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={handleCloseAction}
        title={actionModal.title}
        description={actionModal.description}
      >
        <div className="space-y-4">
          {modalSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Portal access provisioned! Check your student inbox for login details.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  University Student Email
                </label>
                <input
                  type="email"
                  placeholder="name@university.edu"
                  defaultValue="student@campus.edu"
                  className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Select Your Main Module
                </label>
                <select className="w-full px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4A00]">
                  <option>Data Structures & Algorithms (OOP / Java)</option>
                  <option>Database Management Systems (SQL)</option>
                  <option>Computer Networks & Cyber Security</option>
                  <option>Web Technologies & Cloud Computing</option>
                  <option>Artificial Intelligence & Machine Learning</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {modalSuccess ? (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleCloseAction}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setModalSuccess(true);
                    addToast({
                      title: 'Welcome to EduShare!',
                      message: 'Your EduShare account has been activated.',
                      type: 'success',
                    });
                    setTimeout(() => {
                      handleCloseAction();
                    }, 1500);
                  }}
                >
                  Continue &rarr;
                </Button>
                <Button variant="secondary" size="md" onClick={handleCloseAction}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
