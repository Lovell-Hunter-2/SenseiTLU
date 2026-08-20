import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  LogIn,
  LogOut,
  MessageCircle,
  Menu,
  X,
  Minus,
  Shield,
  ArrowLeft,
  Image as ImageIcon,
  Users,
  Sparkles,
  Heart,
  Download,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import DonateModal from "./DonateModal";
import {
  AIAssistantWidget,
  toggleAIAssistant,
  pingAIAssistant,
} from "./AIAssistantWidget";
import { TextSelectionHelper } from "./TextSelectionHelper";
import ClockWidget from "./ClockWidget";
import { PomodoroWidget } from "./PomodoroWidget";
import { NotificationBell } from "./NotificationBell";
import avtTlu from "../assets/avt_tlu.jpg";
import { InstallAppModal } from "./InstallAppModal";
import EcosystemDropdown from "./EcosystemDropdown";

export default function Layout() {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportPopover, setShowSupportPopover] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Handle PWA installation
  useEffect(() => {
    // Check if it's already captured
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
      console.log("beforeinstallprompt fired and captured");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt || deferredPrompt;
    console.log("Install clicked. promptEvent:", promptEvent);
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
        }
      } catch (error) {
        console.error("Error prompting install:", error);
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Reset popover state when returning to home
  useEffect(() => {
    // We intentionally removed the popover reset here so once dismissed by '-',
    // it stays dismissed unless hard refresh.
  }, [location.pathname]);

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: "About", path: "/about" },
    { name: "Đóng góp tài liệu", path: "/contribute" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors -ml-2 p-1"
                title="Quay lại"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <Link
              to="/"
              className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <span className="text-2xl md:text-3xl">🎓</span> SenseiTLU
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap ${
                    location.pathname === link.path
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <EcosystemDropdown />
              <button
                onClick={() => setIsDonateModalOpen(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors animate-pulse hover:animate-none whitespace-nowrap"
              >
                <Heart className="w-4 h-4 fill-current" />
                Ủng hộ Web
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            <div className="hidden xl:block shrink-0">
              <ClockWidget />
            </div>

            <NotificationBell />

            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              {/* Support icon next to theme toggle (only on subpages) */}
              {location.pathname !== "/" && (
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

              {/* AIAssistant Toggle */}
              <button
                onClick={() => {
                  toggleAIAssistant();
                  pingAIAssistant();
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-blue-600 dark:text-blue-400"
                title="Trợ lý AI"
              >
                <img src="/avt_tlu (remove).png" alt="AI" className="w-[26px] h-[26px] object-contain rounded-b-[4px] drop-shadow-sm scale-110" />
              </button>

              {/* Auth */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <img
                      src={user.photoURL || ""}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 transition-all duration-200 z-50 overflow-hidden">
                        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                          <p className="text-sm font-bold truncate text-slate-900 dark:text-white">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        
                        <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                          <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300">Tải ứng dụng</span>
                            <Download className="w-4 h-4 text-slate-500" />
                          </button>
                          
                          <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300">Chế độ hiển thị</span>
                            <div className="flex items-center gap-2 text-slate-500">
                              {theme === "dark" ? (
                                <><Sun className="w-4 h-4" /> Sáng</>
                              ) : (
                                <><Moon className="w-4 h-4" /> Tối</>
                              )}
                            </div>
                          </button>
                        </div>

                        {isAdmin && (
                          <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => {
                                setIsProfileOpen(false);
                                navigate("/admin");
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex items-center gap-2 font-medium transition-colors"
                            >
                              <Shield className="w-4 h-4" /> Quản trị viên
                            </button>
                          </div>
                        )}

                        <div className="p-2">
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              logout();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2 font-medium transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                          </button>
                        </div>
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
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-4 shadow-inner">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-sm font-medium py-2 ${
                    location.pathname === link.path
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="py-2 border-t border-slate-100 dark:border-slate-800">
                <EcosystemDropdown />
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDonateModalOpen(true);
                }}
                className="flex items-center gap-1.5 w-full text-left text-sm font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors py-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                Ủng hộ Web
              </button>
            </div>

            {/* Mobile Tool Row */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  handleInstallClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
                title="Cài đặt ứng dụng"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                )}
              </button>

              <button
                onClick={() => {
                  toggleAIAssistant();
                  pingAIAssistant();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
                title="Trợ lý AI"
              >
                <img src="/avt_tlu (remove).png" alt="AI" className="w-[26px] h-[26px] object-contain rounded-b-[4px] drop-shadow-sm scale-110" />
              </button>

              {location.pathname !== "/" && (
                <a
                  href="https://www.facebook.com/lovelltitussof1910"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
                  title="Hỗ trợ"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Mobile Auth Row */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <img
                      src={user.photoURL || ""}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/admin");
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Shield className="w-5 h-5" /> Dashboard Quản trị
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-5 h-5" /> Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    login();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogIn className="w-5 h-5" /> Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto bg-transparent border-b">
        <div className="container mx-auto px-8 sm:px-24 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <Link
            to="/privacy"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors order-2 md:order-1"
          >
            Chính sách bảo mật
          </Link>
          <p className="order-1 md:order-2">
            © {new Date().getFullYear()} LovellTituss161. All rights reserved.
          </p>
          <Link
            to="/terms"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors order-3"
          >
            Điều khoản dịch vụ
          </Link>
        </div>
      </footer>

      <DonateModal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
      />
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Floating Mascot & Support Button */}
      {location.pathname === "/" && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Mascot Popover */}
          {showSupportPopover && (
            <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Close button */}
              <button
                onClick={() => setShowSupportPopover(false)}
                className="absolute -top-2 -right-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 p-1 rounded-full z-10 shadow-md transition-all duration-200"
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
                    src="/avt_tlu (remove).png"
                    alt="Hỗ trợ viên Capybara"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-2xl rounded-b-[2rem] sm:rounded-b-[2.5rem]"
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
            className="bg-[#ff6b00] hover:bg-[#e66000] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-bold">Hỗ trợ</span>
          </a>
        </div>
      )}

      <TextSelectionHelper />
      <AIAssistantWidget />
    </div>
  );
}
