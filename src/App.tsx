import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import 'katex/dist/katex.min.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Lazy loading pages for better performance
const Home = lazy(() => import('./pages/Home'));
const SubjectDetail = lazy(() => import('./pages/SubjectDetail'));
const MockExam = lazy(() => import('./pages/MockExam'));
const About = lazy(() => import('./pages/About'));
const Contribute = lazy(() => import('./pages/Contribute'));
const Blog = lazy(() => import('./pages/Blog'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const StudyWorkspace = lazy(() => import('./pages/StudyWorkspacePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

import { useActivityLogger } from './useActivityLogger';
import { logErrorToFirestore } from './services/errorLogger';

function ActivityTracker() {
  useActivityLogger();
  return null;
}

function ErrorTracker() {
  const { user } = useAuth();
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      logErrorToFirestore(
        'Lỗi Javascript Client',
        event.message,
        'Nghiêm trọng',
        event.filename || 'App',
        event.error?.stack || 'Không có stack trace',
        user?.email
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logErrorToFirestore(
        'Lỗi Promise Chưa Xử Lý',
        event.reason?.message || 'Không xác định',
        'Cảnh báo',
        'App',
        event.reason?.stack || String(event.reason),
        user?.email
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [user]);
  return null;
}

// Loading Fallback Component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <BrowserRouter>
          <ActivityTracker />
          <ErrorTracker />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="subject/:id" element={<SubjectDetail />} />
                <Route path="subject/:id/mock-exam" element={<MockExam />} />
                <Route path="subject/:id/mock-exam/:examId" element={<MockExam />} />
                <Route path="about" element={<About />} />
                <Route path="contribute" element={<Contribute />} />
                <Route path="blog" element={<Blog />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
              <Route path="/workspace" element={<StudyWorkspace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
