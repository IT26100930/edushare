import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, Menu, Shield, Plus } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.tsx';
import { OverlayMenu } from './OverlayMenu.tsx';
import { useApp } from '../context/AppContext.tsx';
import { Avatar } from './shared/Avatar.tsx';
import { NotificationBell } from './NotificationBell.tsx';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useApp();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    ...(currentUser ? [{ label: 'Browse', path: '/browse' }, { label: 'Requests', path: '/requests' }, { label: 'Community', path: '/community' }] : []),
    { label: 'Pricing', path: '/pricing' },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/85 dark:bg-[#151821]/85 backdrop-blur-md shadow-xs border-b border-[#E8E2D6]/70 dark:border-neutral-800/80 py-3'
            : 'bg-transparent py-4 sm:py-5'
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between gap-4">
          {/* Logo Brand: chat bubble icon + EduShare */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4A00] rounded-lg shrink-0"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#FF4A00] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <MessageSquare className="w-5 h-5 fill-white stroke-none" />
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#111111] dark:text-neutral-100 font-display">
              EduShare
            </span>
          </Link>

          {/* Desktop Center/Right Navigation Links: Browse, Pricing, Community */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`transition-colors hover:text-[#FF4A00] ${
                    isActive ? 'text-[#FF4A00] font-bold' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Share pill + Auth / User Profile + Theme Toggle + Circular Amber Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Orange pill Share button */}
            {currentUser && (
              <Link
                to="/share"
                className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2 rounded-full text-xs font-bold bg-[#FF4A00] text-white hover:bg-[#e04100] transition-transform duration-200 active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Link>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 pl-2 sm:pr-3 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    isVerified={currentUser.isVerified}
                    size="sm"
                  />
                  <span className="hidden sm:inline text-xs font-semibold text-neutral-800 dark:text-neutral-200 max-w-[100px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-[#FF4A00] transition-colors px-2 py-1"
                >
                  Login
                </Link>
              </div>
            )}

            {currentUser && <NotificationBell />}
            <ThemeToggle />

            {/* Circular amber 40px hamburger with 1.1 scale + 8deg rotate on hover */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 8 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 rounded-full bg-[#FFB31F] text-neutral-950 flex items-center justify-center shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4A00] shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 stroke-[2.3]" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Full screen overlay menu */}
      <OverlayMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};
