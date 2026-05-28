import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import SubjectDetail from './pages/SubjectDetail';
import MockExam from './pages/MockExam';
import About from './pages/About';
import Contribute from './pages/Contribute';
import Blog from './pages/Blog';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
export default function App() {
return (
<ThemeProvider defaultTheme="system">
<AuthProvider>
<BrowserRouter>
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
</Route>
</Routes>
</BrowserRouter>
</AuthProvider>
</ThemeProvider>
);
}
