import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => (
  <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12 text-neutral-900 dark:text-neutral-100">
    <Link to="/register" className="inline-flex items-center gap-2 text-sm text-[#FF4A00] hover:underline mb-6"><ArrowLeft size={16}/> Back to Registration</Link>
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-3"><ShieldCheck className="text-[#FF4A00]" size={28}/><span className="text-xs tracking-wider uppercase font-bold text-neutral-500 dark:text-neutral-400">EduShare policies</span></div>
      <h1 className="text-3xl sm:text-4xl font-extrabold">Terms of Service</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">Rules for using EduShare as a learning-resource sharing platform.</p>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Last updated: 6 November 2026 · Project policy draft for review before public launch</p>
    </header>
    <article className="rounded-2xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 sm:p-9 space-y-7">
      <section className="space-y-2">
        <h2 className="font-bold text-lg">1. Eligibility and accounts</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">EduShare is an educational project intended for university learners. You must provide accurate registration details, keep login credentials private, and not access another person’s account. Email verification confirms control of an inbox; it does not itself establish university affiliation.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">2. Acceptable use</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Use the platform for legitimate studying, collaboration and sharing resources you are authorized to distribute. Do not post malware, personal data without consent, threats, harassment, misleading material or attempts to bypass access controls.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">3. Upload ownership and attribution</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Upload original content, openly licensed content within its license terms, or content for which you have express permission to distribute. Credit authors and retain required attribution. Access to a lecture PDF, video or website does not automatically grant permission to re-upload or sell it.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">4. Pricing and demo payments</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">The current EduShare payment and subscription flows are demonstrations, not live payment transactions. Prices, balances and subscription entitlements shown in the demo should not be presented as real purchases or revenues. Do not use EduShare to sell content without distribution and commercial-use rights.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">5. Moderation</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Administrators may review, restrict or remove content and suspend accounts that violate these rules. Report suspected copyright infringement or inappropriate resources using the available reporting features.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">6. Service availability and AI features</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">This student project is provided for educational and demonstration use; interruptions, incomplete features and errors may occur. AI-generated summaries can be incomplete or incorrect; always verify important claims against the original permitted source.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">7. Changes and contact</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">We may revise these project policies as features change. Before a public launch, the project team should provide an accountable operator identity, working contact details and a reviewed effective date.</p>
      </section>
    </article>
    <nav aria-label="Other policies" className="flex flex-wrap gap-4 mt-8 text-sm text-[#FF4A00] font-semibold">
      <Link to="/terms" className="hover:underline">Terms of Service</Link>
      <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
      <Link to="/academic-integrity" className="hover:underline">Academic Integrity</Link>
    </nav>
  </main>
 );
