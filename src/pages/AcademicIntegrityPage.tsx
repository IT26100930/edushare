import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const AcademicIntegrityPage: React.FC = () => (
  <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12 text-neutral-900 dark:text-neutral-100">
    <Link to="/register" className="inline-flex items-center gap-2 text-sm text-[#FF4A00] hover:underline mb-6"><ArrowLeft size={16}/> Back to Registration</Link>
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-3"><ShieldCheck className="text-[#FF4A00]" size={28}/><span className="text-xs tracking-wider uppercase font-bold text-neutral-500 dark:text-neutral-400">EduShare policies</span></div>
      <h1 className="text-3xl sm:text-4xl font-extrabold">Academic Integrity</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">Rules for lawful and responsible sharing of university learning materials.</p>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Last updated: 8 November 2026 · Project policy draft for review before public launch</p>
    </header>
    <article className="rounded-2xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 sm:p-9 space-y-7">
      <section className="space-y-2">
        <h2 className="font-bold text-lg">1. Rights to share</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Only share resources you authored, that are under a compatible open license, or for which you have explicit permission. Cite the original creator, course, publisher and license where applicable.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">2. University and copyrighted materials</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Do not upload proprietary lecture slides, textbooks, exam papers, paid courses or recordings solely because you can access them. Check university rules and distribution rights first. Free access is not necessarily permission to redistribute.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">3. Assessment misconduct</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Do not post leaked exams, confidential marking schemes, plagiarized assignments, solutions intended for dishonest submission or material that violates assessment rules.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">4. Video, social and article links</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Prefer sharing the original owner’s public URL rather than copying or rehosting a video, article or PDF. External platform terms and the author’s license still apply.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">5. Paid resources and AI</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Sell resources only if commercial redistribution is permitted. AI summaries are study aids; verify factual accuracy, respect copyright and do not represent AI-produced or third-party work as entirely your own.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">6. Reports and consequences</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Users may report problematic content. Administrators can investigate and remove items, restrict publication or suspend accounts in accordance with project rules.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">External link content checks</h2>
        <p className="text-sm leading-7">Videos and articles are checked before publication. Do not share graphic gore for shock, explicit sexual content, promotion of violence, terrorism, hate, harassment, scams or instructions facilitating criminal harm. Educational history, medical learning, news and defensive cybersecurity are assessed in context. Uncertain or inaccessible links wait for administrator review. Automated checks may make mistakes; ask an administrator to review a rejected link. External content can change after publication, so report unsuitable material.</p>
      </section>
    </article>
    <nav aria-label="Other policies" className="flex flex-wrap gap-4 mt-8 text-sm text-[#FF4A00] font-semibold">
      <Link to="/terms" className="hover:underline">Terms of Service</Link>
      <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
      <Link to="/academic-integrity" className="hover:underline">Academic Integrity</Link>
    </nav>
  </main>
 );
