import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogIn, LogOut, MessageCircle, Menu, X, Minus, Shield, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AdminManagerModal from './AdminManagerModal';

export default function Layout() {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportPopover, setShowSupportPopover] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Reset popover state when returning to home
  useEffect(() => {
    if (location.pathname === '/') {
      setShowSupportPopover(true);
    }
  }, [location.pathname]);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Đóng góp tài liệu', path: '/contribute' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {location.pathname !== '/' && (
              <button 
                onClick={() => navigate(-1)} 
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors -ml-2 p-1"
                title="Quay lại"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="text-3xl">🎓</span> SenseiTLU
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                    location.pathname === link.path
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <img src={user.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{user.displayName}</span>
                </button>
                
                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 transition-all duration-200 z-50">
                      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsAdminModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800"
                        >
                          <Shield className="w-4 h-4" /> Quản lý Admin
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 rounded-b-lg"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-medium ${
                  location.pathname === link.path
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <p>© {new Date().getFullYear()} LovellTituss161. All rights reserved.</p>
      </footer>

      <AdminManagerModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />

      {/* Floating Contact Button */}
      {location.pathname === '/' ? (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Popover */}
          {showSupportPopover && (
            <div className="bg-[#1a1d2d] dark:bg-[#131524] rounded-2xl p-5 shadow-2xl border border-slate-800 text-white w-[280px] animate-in slide-in-from-bottom-4 fade-in duration-300 relative">
              <button 
                onClick={() => setShowSupportPopover(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                aria-label="Đóng"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <img src="https://graph.facebook.com/100021966144577/picture?type=large" alt="Thuận Ngô" className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover" />
                <div>
                  <h4 className="font-bold text-base">Thuận Ngô</h4>
                  <div className="flex items-center gap-1.5 text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Đang online
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-4 text-center leading-relaxed">
                Cần hỗ trợ gì không? Mình luôn sẵn sàng giúp bạn! 👋
              </p>
              <a
                href="https://www.facebook.com/lovelltitussof1910"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#0084ff] hover:bg-[#0073e6] text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4 fill-current" /> Nhắn Messenger
              </a>
            </div>
          )}
          {/* Icon */}
          <a
            href="https://www.facebook.com/lovelltitussof1910"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#ff6b00] hover:bg-[#e66000] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-bold">Hỗ trợ</span>
          </a>
        </div>
      ) : (
        <a
          href="https://www.facebook.com/lovelltitussof1910"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-[#ff6b00] hover:bg-[#e66000] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 z-50"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-bold">Hỗ trợ</span>
        </a>
      )}
    </div>
  );
}
