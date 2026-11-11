import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => (
  <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12 text-neutral-900 dark:text-neutral-100">
    <Link to="/register" className="inline-flex items-center gap-2 text-sm text-[#FF4A00] hover:underline mb-6"><ArrowLeft size={16}/> Back to Registration</Link>
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-3"><ShieldCheck className="text-[#FF4A00]" size={28}/><span className="text-xs tracking-wider uppercase font-bold text-neutral-500 dark:text-neutral-400">EduShare policies</span></div>
      <h1 className="text-3xl sm:text-4xl font-extrabold">Privacy Policy</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">How the EduShare project handles account and learning-platform information.</p>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Last updated: 8 November 2026 · Project policy draft for review before public launch</p>
    </header>
    <article className="rounded-2xl border border-[#E8E2D6] dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 sm:p-9 space-y-7">
      <section className="space-y-2">
        <h2 className="font-bold text-lg">1. Information collected</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">The application may store your name, username, email address, profile details, account role, verification status and activity such as uploaded resources, discussions and subscription status. Your password is used to sign you in and is not displayed on your public profile.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">2. How information is used</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">This information is used to provide accounts, authentication, email verification, password recovery, resource access, moderation, collaboration and application troubleshooting.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">3. Your account information</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">EduShare keeps account information, shared resources and related activity to provide its features. Contact the administrator if you need help accessing, correcting or deleting your information.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">4. Email delivery and third-party services</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">When automatic link checks are configured, the submitted public URL, title and linked content are processed by Google Gemini to assess suitability. Account credentials and uploader email are not included in the content-check request. If configured, account verification and password-reset messages are sent through the configured email provider. When you request an AI summary, extracted PDF text may be sent to the configured AI provider for processing. Do not submit personal or confidential information for AI summarization unless you are authorized to do so.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">5. Visibility and sharing</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Public resources, profiles and community posts may be viewed by other users depending on the application settings. Avoid posting passwords, recovery codes, private contact information or sensitive student records.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">6. Retention and deletion</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Account and content records may remain until removed using available app features or by the project administrator. A production deployment must define precise retention periods, backups and deletion procedures before collecting real user data.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-lg">7. Security and user requests</h2>
        <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-300">Use HTTPS, restrict administrator privileges, keep API and email keys private, protect reset tokens, and restrict access to files. Contact the project administrator to request access, correction or deletion of your account data. This project draft is not a legal compliance certification.</p>
      </section>
    </article>
    <nav aria-label="Other policies" className="flex flex-wrap gap-4 mt-8 text-sm text-[#FF4A00] font-semibold">
      <Link to="/terms" className="hover:underline">Terms of Service</Link>
      <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
      <Link to="/academic-integrity" className="hover:underline">Academic Integrity</Link>
    </nav>
  </main>
 );
