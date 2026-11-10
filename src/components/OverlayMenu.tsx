import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, MessageSquare, Github, Twitter, Linkedin, Disc as Discord, Shield, User, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface OverlayMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIMARY_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Browse Resources', path: '/browse' },
  { label: 'Community Feed', path: '/community' },
  { label: 'Share a Resource', path: '/share' },
  { label: 'Pricing & Plans', path: '/pricing' },
  { label: 'Student Profile', path: '/profile' },
  { label: 'My Reports', path: '/my-reports' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Account Verification', path: '/verify' },
];

const SECONDARY_LINKS = [
  { label: 'Java Repository', path: '/browse?category=Programming#resources' },
  { label: 'Python & DSA', path: '/browse?category=Programming#resources' },
  { label: 'SQL Past Papers', path: '/browse?category=Databases&type=Past+paper#resources' },
  { label: 'Cyber Security', path: '/browse?category=Cybersecurity#resources' },
];

const SOCIAL_LINKS = [
  { label: 'GitHub', icon: Github, href: 'https://github.com' },
  { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  { label: 'Discord', icon: Discord, href: 'https://discord.com' },
];

export const OverlayMenu: React.FC<OverlayMenuProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser } = useApp();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-[#111111]/95 dark:bg-[#0A0B0E]/98 backdrop-blur-md text-white flex flex-col justify-between p-6 md:p-12 overflow-y-auto"
        >
          {/* Top Bar inside Menu */}
          <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
            <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF4A00] flex items-center justify-center text-white shadow-sm">
                <MessageSquare className="w-4 h-4 fill-white stroke-none" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                EduShare
              </span>
            </Link>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4A00]"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 stroke-[2.2]" />
            </motion.button>
          </div>

          {/* Main Grid Content */}
          <div className="max-w-6xl w-full mx-auto my-auto py-10 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
            {/* Left: Primary Staggered Links */}
            <div className="md:col-span-7 space-y-2 md:space-y-3">
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block mb-2 dark:text-neutral-300">
                Main Pages
              </span>
              {PRIMARY_LINKS.map((link, idx) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.08 + idx * 0.05,
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    to={link.path}
                    onClick={onClose}
                    className="group inline-flex items-center gap-3 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight font-display hover:text-[#FF4A00] transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-6 h-6 md:w-7 md:h-7 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200 text-[#FF4A00]" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right: Secondary Links & Quick Auth Card */}
            <div className="md:col-span-5 space-y-8 md:pl-8 md:border-l border-white/10">
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block mb-4 dark:text-neutral-300">
                  Explore Resources
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {SECONDARY_LINKS.map((link, idx) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + idx * 0.04, duration: 0.4 }}
                    >
                      <Link
                        to={link.path}
                        onClick={onClose}
                        className="text-sm md:text-base text-neutral-300 hover:text-white hover:underline underline-offset-4 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Callout Card inside overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="p-6 rounded-[22px] bg-white/5 border border-white/10"
              >
                <p className="text-xs uppercase tracking-widest text-neutral-300 font-semibold mb-4">{currentUser ? 'My Account' : 'Get Started'}</p>
                {currentUser ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF4A00] text-white font-bold flex items-center justify-center text-sm">
                        {currentUser.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{currentUser.name}</span>
                          {currentUser.isVerified && (
                            <span className="text-[10px] bg-[#1E6FEB] text-white px-1.5 py-0.2 rounded-full font-bold">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 truncate max-w-[200px] dark:text-neutral-300">
                          {currentUser.university}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Link
                        to="/profile"
                        onClick={onClose}
                        className="text-xs font-semibold px-4 py-2 rounded-full bg-[#FF4A00] text-white hover:bg-[#e04100] transition-colors"
                      >
                        View My Profile &rarr;
                      </Link>
                      <button
                        onClick={() => {
                          switchUser(null);
                          onClose();
                        }}
                        className="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors dark:text-neutral-300"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-semibold text-[#FFB31F] mb-1">
                      Account Verification
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed mb-4 dark:text-neutral-300">
                      Sign in with your university or personal email to access EduShare resources, community features, and account verification.
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        to="/login"
                        onClick={onClose}
                        className="text-xs font-semibold px-4 py-2 rounded-full bg-[#FF4A00] text-white hover:bg-[#e04100] transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={onClose}
                        className="text-xs font-semibold px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Bottom Bar: Socials + Copyright */}
          <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs text-neutral-400 dark:text-neutral-300">
            <div className="flex items-center gap-6">
              {SOCIAL_LINKS.map((soc) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={soc.label}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{soc.label}</span>
                  </a>
                );
              })}
            </div>
            <div>&copy; {new Date().getFullYear()} EduShare Inc. All rights reserved.</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
