import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { currentUser, authReady } = useApp();
  const location = useLocation();
  if (!authReady) return <div className="min-h-[60vh] grid place-items-center text-sm text-neutral-500 dark:text-neutral-300">Checking session...</div>;
  if (!currentUser) return <Navigate to={adminOnly ? "/admin/login" : "/login"} replace state={{ from: location.pathname+location.search+location.hash }} />;
  if (adminOnly && currentUser.role !== 'admin') return <Navigate to="/browse" replace />;
  return <>{children}</>;
};
