import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFF6E5] dark:bg-[#0E1015] border-t border-[#E8E2D6] dark:border-neutral-800/80 pt-16 pb-12 transition-colors">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Top 4-column block: Brand info + 3 Link columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-16 border-b border-[#E8E2D6] dark:border-neutral-800">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#FF4A00] flex items-center justify-center text-white shadow-sm">
                <MessageSquare className="w-4 h-4 fill-white stroke-none" />
              </div>
              <span className="text-3xl font-bold tracking-tight text-[#111111] dark:text-neutral-100 font-display">
                EduShare
              </span>
            </Link>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed">
              Empowering university IT students to learn faster, share lecture notes, buy and sell verified PDFs, and master challenging modules together.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-2">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-[#FF4A00] fill-[#FF4A00]" />
              <span>for computer science & IT scholars</span>
            </div>
          </div>

          {/* Col 1: Menu */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-500">
              Menu
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link to="/" className="hover:text-[#FF4A00] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-[#FF4A00] transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#FF4A00] transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-[#FF4A00] transition-colors">
                  Account Verification
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#FF4A00] transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-500">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link to="/browse?category=Programming#resources" className="hover:text-[#FF4A00] transition-colors">
                  Java & OOP Repositories
                </Link>
              </li>
              <li>
                <Link to="/browse?category=Databases#resources" className="hover:text-[#FF4A00] transition-colors">
                  Database & SQL Notes
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Past+paper#resources" className="hover:text-[#FF4A00] transition-colors">
                  Past Exam Papers
                </Link>
              </li>
              <li>
                <Link to="/browse?category=Networking#resources" className="hover:text-[#FF4A00] transition-colors">
                  Networks & Packet Labs
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Social */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-500">
              Social
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF4A00] transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF4A00] transition-colors"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF4A00] transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF4A00] transition-colors"
                >
                  Discord Community
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Huge orange EduShare wordmark clamp 60px-180px */}
        <div className="py-12 md:py-16 text-center select-none overflow-hidden">
          <span
            className="block font-display font-extrabold text-[#FF4A00] tracking-tighter leading-none hover:opacity-95 transition-opacity"
            style={{ fontSize: 'clamp(60px, 14vw, 180px)' }}
          >
            EduShare
          </span>
        </div>

        {/* Bottom copyright & legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8E2D6] dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
          <div>
            &copy; {new Date().getFullYear()} EduShare. Learn, share and grow together.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link to="/academic-integrity" className="hover:underline">
              Academic Integrity
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
