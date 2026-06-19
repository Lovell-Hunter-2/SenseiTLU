import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import SubjectDetail from './pages/SubjectDetail';
import MockExam from './pages/MockExam';
import About from './pages/About';
import Contribute from './pages/Contribute';
import Blog from './pages/Blog';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import StudyWorkspace from './pages/StudyWorkspacePage';
import AdminDashboard from './pages/AdminDashboard';
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

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <BrowserRouter>
          <ActivityTracker />
          <ErrorTracker />
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
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
