import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogIn, LogOut, MessageCircle, Menu, X, Minus, Shield, ArrowLeft, Image as ImageIcon, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AdminManagerModal from './AdminManagerModal';
import UserManagerModal from './UserManagerModal';
import HeroImageManagerModal from './HeroImageManagerModal';
import avtTlu from '../assets/avt_tlu.jpg';

export default function Layout() {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportPopover, setShowSupportPopover] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserManagerModalOpen, setIsUserManagerModalOpen] = useState(false);
  const [isHeroImageModalOpen, setIsHeroImageModalOpen] = useState(false);

  // Reset popover state when returning to home
  useEffect(() => {
    // We intentionally removed the popover reset here so once dismissed by '-', 
    // it stays dismissed unless hard refresh.
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
              <span className="text-3xl">⚡</span> SenseiTLU
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
            {/* Support icon next to theme toggle (only on subpages) */}
            {location.pathname !== '/' && (
              <a
                href="https://www.facebook.com/lovelltitussof1910"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                title="Hỗ trợ"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}

            {/* Admin only: Hero Image Manager */}
            {isAdmin && (
              <button
                onClick={() => setIsHeroImageModalOpen(true)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-blue-600 dark:text-blue-400"
                title="Quản lý ảnh trang trí"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            )}

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
                        <>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              setIsAdminModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800"
                          >
                            <Shield className="w-4 h-4" /> Quản lý Admin
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              setIsUserManagerModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800"
                          >
                            <Users className="w-4 h-4" /> Quản lý Người dùng
                          </button>
                        </>
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
      <footer className="w-full py-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50 dark:bg-slate-900 border-b">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} LovellTituss161. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Điều khoản dịch vụ
            </Link>
          </div>
        </div>
      </footer>

      <AdminManagerModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />

      {isUserManagerModalOpen && (
        <UserManagerModal onClose={() => setIsUserManagerModalOpen(false)} />
      )}

      <HeroImageManagerModal
        isOpen={isHeroImageModalOpen}
        onClose={() => setIsHeroImageModalOpen(false)}
      />

      {/* Floating Mascot & Support Button */}
      {location.pathname === '/' && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Mascot Popover */}
          {showSupportPopover && (
            <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Close button */}
              <button 
                onClick={() => setShowSupportPopover(false)}
                className="absolute -top-2 -right-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 p-1 rounded-full z-10 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label="Đóng"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              {/* Mascot Link */}
              <a
                href="https://www.facebook.com/lovelltitussof1910"
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer"
                title="Cần hỗ trợ? Nhấn vào đây!"
              >
                <div className="animate-wobble origin-bottom hover:scale-105 transition-transform duration-300">
                  <img 
                    src={avtTlu} 
                    alt="Hỗ trợ viên Capybara" 
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl mix-blend-multiply dark:mix-blend-normal rounded-full dark:bg-white"
                  />
                </div>
              </a>
            </div>
          )}

          {/* Orange Support Button */}
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
      )}
    </div>
  );
}
