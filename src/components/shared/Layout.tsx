import React from 'react';
import {useLocation} from 'react-router-dom';
import { Navbar } from '../Navbar.tsx';
import { Footer } from '../Footer.tsx';
import { ToastContainer } from './Toast.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {pathname}=useLocation();
  const portal=['/browse','/requests','/community','/pricing'].includes(pathname);
  return (
    <div className={`site-shell ${portal?'portal-shell':''} min-h-screen w-full bg-white dark:bg-[#151821] text-[#111111] dark:text-neutral-100 font-sans selection:bg-[#FF4A00] selection:text-white transition-colors duration-300 flex flex-col overflow-x-hidden`}>
      <Navbar />
      <main className="site-canvas flex-1 w-full">
        {children}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};
