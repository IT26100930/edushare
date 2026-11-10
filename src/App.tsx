import { MyReportsPage } from './pages/MyReportsPage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { TermsOfServicePage } from './pages/TermsOfServicePage.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { AcademicIntegrityPage } from './pages/AcademicIntegrityPage.tsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.tsx';
import { EmailResetPasswordPage } from './pages/EmailResetPasswordPage.tsx';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import { Layout } from './components/shared/Layout.tsx';
import { PageTransition } from './components/shared/PageTransition.tsx';

import { LandingPage } from './pages/LandingPage.tsx';
import { BrowsePage } from './pages/BrowsePage.tsx';
import { ResourceDetailPage } from './pages/ResourceDetailPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { CompletePasswordRecoveryPage } from './pages/CompletePasswordRecoveryPage.tsx';
import { AdminRegistrationPage } from './pages/AdminRegistrationPage';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { AdminSetupPage } from './pages/AdminSetupPage.tsx';
import { AdminRecoveryPage } from './pages/AdminRecoveryPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { VerifyPage } from './pages/VerifyPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { ShareResourcePage } from './pages/ShareResourcePage.tsx';
import { CommunityPage } from './pages/CommunityPage.tsx';
import { RequestsPage } from './pages/RequestsPage.tsx';
import { StudyGroupPage } from './pages/StudyGroupPage.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { useLocation } from 'react-router-dom';

function SiteShell({children}: {children: React.ReactNode}) {
  const location = useLocation();
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/') || location.pathname.startsWith('/secure-admin')) return <>{children}</>;
  return <Layout>{children}</Layout>;
}


function LegacyAdminRedirect() {
  const location = useLocation();
  const suffix = location.pathname.slice('/secure-admin'.length).replace(/\/$/, '');
  return <Navigate to={`${suffix ? '/admin' + suffix : '/admin/login'}${location.search}${location.hash}`} replace />;
}


export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <SiteShell>
          <PageTransition>
            <Routes>
              {/* 1. Landing Page (Exact existing Framer Getblox design) */}
              <Route path="/" element={<LandingPage />} />

              {/* 2. Browse Resources */}
              <Route path="/browse" element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />

              {/* 3. Resource Detail */}
              <Route path="/resource/:id" element={<ProtectedRoute><ResourceDetailPage /></ProtectedRoute>} />

              {/* 4. Login */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/email-reset" element={<EmailResetPasswordPage />} />
              <Route path="/reset-password" element={<CompletePasswordRecoveryPage />} />

              {/* Public legal and content policies */}
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/academic-integrity" element={<AcademicIntegrityPage />} />

              {/* 5. Register */}
              <Route path="/register" element={<RegisterPage />} />

              {/* 6. Admin-reviewed account verification */}
              <Route path="/verify" element={<VerifyPage />} />

              {/* 7. Student Profile & Dashboard (Own and Public) */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/u/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* 8. Pricing & Plans */}
              <Route path="/pricing" element={<PricingPage />} />

              {/* 9. Admin & Moderation */}
              <Route path="/secure-admin/*" element={<LegacyAdminRedirect />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/register" element={<AdminRegistrationPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/setup" element={<AdminSetupPage />} />
              <Route path="/admin/recover" element={<AdminRecoveryPage />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

              {/* 10. Share a Resource */}
              <Route path="/share" element={<ProtectedRoute><ShareResourcePage /></ProtectedRoute>} />

              {/* 11. Student Community & Discussions */}
              <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
              <Route path="/community/groups/:id" element={<ProtectedRoute><StudyGroupPage /></ProtectedRoute>} />

              <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </SiteShell>
      </AppProvider>
    </BrowserRouter>
  );
}
