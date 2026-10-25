import React, { useState, useEffect, useRef } from "react";
import ClockWidget from "../components/ClockWidget";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import {
  Search,
  Plus,
  Book,
  Calculator,
  Code,
  Globe,
  Database,
  Cpu,
  FileText,
  Briefcase,
  Scale,
  Lightbulb,
  Brain,
  PieChart,
  ShoppingCart,
  Rocket,
  Trash2,
  Edit2,
  ChartBar,
  PenTool,
  Milestone,
  Activity,
  Building,
  Leaf,
  Shield,
  History,
  Compass,
  GraduationCap,
  Microscope,
  Palette,
  Landmark,
  Component,
  Cloud,
  DatabaseZap,
  DollarSign,
  Euro,
  Frame,
  Users,
  Target,
  Network,
  Layers,
  LayoutDashboard,
  LineChart,
  FileSpreadsheet,
  Bitcoin,
  CandlestickChart,
  TrendingUp,
  BadgeDollarSign,
  Receipt,
  Gavel,
  Building2,
  HandCoins,
  MessageCircle,
  Globe2,
  Map as MapIcon,
  HeartHandshake,
  Vote,
  MonitorPlay,
  Smartphone,
  Terminal,
  Server,
  Wifi,
  Fingerprint,
  Microchip,
  Bot,
  Star,
  Lock,
  LogIn,
  Pin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { getCachedData, setCachedData, invalidateCache, CacheTTL } from "../services/cacheService";
import { AnimatedHeroTitle } from "../components/AnimatedHeroTitle";

// Icon mapping helper
const iconLabels: Record<string, string> = {
  Book: "Sách (Lý thuyết chung)",
  Calculator: "Máy tính (Toán/Kế toán)",
  Code: "Mã nguồn (Lập trình)",
  Globe: "Địa cầu (Địa lý/Quốc tế)",
  Database: "CSDL (Cơ sở dữ liệu)",
  Cpu: "CPU (Phần cứng)",
  FileText: "Văn bản (Ngữ văn/Tài liệu)",
  Briefcase: "Cặp xách (Quản trị kinh doanh)",
  Scale: "Cán cân (Luật học)",
  Lightbulb: "Bóng đèn (Ý tưởng/Khởi nghiệp)",
  Brain: "Bộ não (Tâm lý học/AI)",
  PieChart: "Biểu đồ tròn (Thống kê)",
  ShoppingCart: "Giỏ hàng (Thương mại điện tử)",
  Rocket: "Tên lửa (Khởi nghiệp/Đổi mới)",
  ChartBar: "Biểu đồ cột (Tài chính)",
  PenTool: "Bút vẽ (Thiết kế đồ họa)",
  Milestone: "Cột mốc (Lịch sử/Dự án)",
  Activity: "Nhịp tim (Y tế/Sức khỏe)",
  Building: "Tòa nhà (Kiến trúc/Xây dựng)",
  Leaf: "Chiếc lá (Môi trường/Nông nghiệp)",
  Shield: "Khiên chắn (An ninh mạng)",
  History: "Đồng hồ (Lịch sử)",
  Compass: "La bàn (Điều hướng/Hàng hải)",
  GraduationCap: "Mũ tốt nghiệp (Giáo dục)",
  Microscope: "Kính hiển vi (Sinh học/Hóa học)",
  Palette: "Bảng màu (Nghệ thuật/Thiết kế)",
  Landmark: "Đền thờ (Ngân hàng/Chính trị)",
  Component: "Thành phần (Giao diện UI/UX)",
  Cloud: "Đám mây (Điện toán đám mây)",
  DatabaseZap: "CSDL Nhanh (Big Data)",
  DollarSign: "Đô la (Kinh tế)",
  Euro: "Euro (Kinh tế quốc tế)",
  Frame: "Khung ảnh (Nhiếp ảnh/Thiết kế)",
  Users: "Nhóm người (Xã hội học/Nhân sự)",
  Target: "Mục tiêu (Marketing)",
  Network: "Mạng lưới (Mạng máy tính)",
  Layers: "Nhiều lớp (Kiến trúc/Đồ họa)",
  LayoutDashboard: "Bảng điều khiển (UI/UX)",
  LineChart: "Biểu đồ đường (Chứng khoán)",
  FileSpreadsheet: "Bảng tính (Excel/Kế toán)",
  Bitcoin: "Bitcoin (Tiền điện tử)",
  CandlestickChart: "Biểu đồ nến (Tài chính/Forex)",
  // Added icons
  TrendingUp: "Tăng trưởng (Kinh tế vi mô/vĩ mô)",
  BadgeDollarSign: "Huy hiệu Đô la (Tài chính doanh nghiệp)",
  Receipt: "Hóa đơn (Kế toán/Thuế)",
  Gavel: "Búa tòa (Luật kinh tế)",
  Building2: "Công ty (Quản trị doanh nghiệp)",
  HandCoins: "Bàn tay đồng xu (Đầu tư/Tài chính)",
  MessageCircle: "Bong bóng chat (Ngôn ngữ học/Truyền thông)",
  Globe2: "Địa cầu chi tiết (Quan hệ quốc tế)",
  MapIcon: "Bản đồ (Địa lý/Quy hoạch)",
  HeartHandshake: "Bắt tay (Công tác xã hội)",
  Vote: "Bầu cử (Chính trị học)",
  MonitorPlay: "Màn hình phát (Truyền thông đa phương tiện)",
  Smartphone: "Điện thoại (Lập trình di động)",
  Terminal: "Dòng lệnh (Hệ điều hành)",
  Server: "Máy chủ (Quản trị mạng)",
  Wifi: "Wifi (Mạng viễn thông)",
  Fingerprint: "Vân tay (An toàn thông tin)",
  Microchip: "Vi mạch (Kiến trúc máy tính)",
  Bot: "Robot (Trí tuệ nhân tạo)",
};

const iconMap: Record<string, React.ElementType> = {
  Book,
  Calculator,
  Code,
  Globe,
  Database,
  Cpu,
  FileText,
  Briefcase,
  Scale,
  Lightbulb,
  Brain,
  PieChart,
  ShoppingCart,
  Rocket,
  ChartBar,
  PenTool,
  Milestone,
  Activity,
  Building,
  Leaf,
  Shield,
  History,
  Compass,
  GraduationCap,
  Microscope,
  Palette,
  Landmark,
  Component,
  Cloud,
  DatabaseZap,
  DollarSign,
  Euro,
  Frame,
  Users,
  Target,
  Network,
  Layers,
  LayoutDashboard,
  LineChart,
  FileSpreadsheet,
  Bitcoin,
  CandlestickChart,
  TrendingUp,
  BadgeDollarSign,
  Receipt,
  Gavel,
  Building2,
  HandCoins,
  MessageCircle,
  Globe2,
  MapIcon,
  HeartHandshake,
  Vote,
  MonitorPlay,
  Smartphone,
  Terminal,
  Server,
  Wifi,
  Fingerprint,
  Microchip,
  Bot,
};

const emojiMap: Record<string, string> = {
  Book: "📚",
  Calculator: "🧮",
  Code: "💻",
  Globe: "🌐",
  Database: "💽",
  Cpu: "🧠",
  FileText: "📝",
  Briefcase: "💼",
  Scale: "⚖️",
  Lightbulb: "💡",
  Brain: "🧠",
  PieChart: "🥧",
  ShoppingCart: "🛒",
  Rocket: "🚀",
  ChartBar: "📊",
  PenTool: "🖌️",
  Milestone: "🚩",
  Activity: "💓",
  Building: "🏢",
  Leaf: "🍃",
  Shield: "🛡️",
  History: "🕰️",
  Compass: "🧭",
  GraduationCap: "🎓",
  Microscope: "🔬",
  Palette: "🎨",
  Landmark: "🏛️",
  Component: "🧩",
  Cloud: "☁️",
  DatabaseZap: "⚡",
  DollarSign: "💲",
  Euro: "💶",
  Frame: "🖼️",
  Users: "👥",
  Target: "🎯",
  Network: "🕸️",
  Layers: "🥞",
  LayoutDashboard: "🎛️",
  LineChart: "📈",
  FileSpreadsheet: "🧾",
  Bitcoin: "🪙",
  CandlestickChart: "📉",
  TrendingUp: "🚀",
  BadgeDollarSign: "🏅",
  Receipt: "🧾",
  Gavel: "🔨",
  Building2: "🏢",
  HandCoins: "🤲",
  MessageCircle: "💬",
  Globe2: "🌎",
  MapIcon: "🗺️",
  HeartHandshake: "🤝",
  Vote: "🗳️",
  MonitorPlay: "📺",
  Smartphone: "📱",
  Terminal: "💻",
  Server: "🗄️",
  Wifi: "📶",
  Fingerprint: "👆",
  Microchip: "🔌",
  Bot: "🤖",
};

export default function Home() {
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [subjects, setSubjects] = useState<any[]>(() => {
    const cached = getCachedData<any[]>("home_subjects_list");
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    try {
      const legacy = localStorage.getItem("sensei_cached_subjects");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [totalSubjectsCount, setTotalSubjectsCount] = useState<number>(() => {
    const cachedCount = getCachedData<number>("home_subjects_count");
    if (cachedCount) return cachedCount;
    try {
      const legacy = localStorage.getItem("sensei_cached_subjects_count");
      if (legacy) return Number(legacy);
    } catch (e) {}
    return 0;
  });
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isHomeRefreshing, setIsHomeRefreshing] = useState(false);
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteSubjects");
    return saved ? JSON.parse(saved) : [];
  });

  const { isAdmin, user, login } = useAuth();

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    description: "",
    iconName: "Book",
    isPriority: false,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [heroImages, setHeroImages] = useState<{
    leftUrl: string;
    rightUrl: string;
  }>({ leftUrl: "", rightUrl: "" });

  useEffect(() => {
    localStorage.setItem("favoriteSubjects", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleGlobalTouch = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest(".subject-card")) {
        setActiveSubjectId(null);
      }
    };
    document.addEventListener("touchstart", handleGlobalTouch);
    return () => document.removeEventListener("touchstart", handleGlobalTouch);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInitial = async (forceRefresh: boolean = false) => {
    const CACHE_KEY = "home_subjects_list_v2";

    // If not forcing refresh and valid complete cache exists, skip network requests!
    if (!forceRefresh) {
      const cached = getCachedData<any[]>(CACHE_KEY);
      // Validate cached data has full subjects (more than 30 items)
      if (cached && Array.isArray(cached) && cached.length > 30) {
        setSubjects(cached);
        setTotalSubjectsCount(cached.length);
        setInitialLoading(false);
        return;
      }
    }

    if (forceRefresh) setIsHomeRefreshing(true);

    try {
      setInitialLoading(true);

      // Fetch all subjects in one single query (87 docs = 87 reads once, cached for 6 hours)
      const q = query(collection(db, "subjects"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      const allSubs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (allSubs.length > 0) {
        setSubjects(allSubs);
        setTotalSubjectsCount(allSubs.length);
        setCachedData(CACHE_KEY, allSubs, CacheTTL.VERY_LONG);
        try {
          localStorage.setItem("sensei_cached_subjects", JSON.stringify(allSubs));
          localStorage.setItem("sensei_cached_subjects_count", String(allSubs.length));
          // Clean up legacy stale 14-item cache
          localStorage.removeItem("sensei_cache_v1_home_subjects_list");
        } catch (e) {}
      }
      setQuotaExceeded(false);
    } catch (err: any) {
      console.error("Error loading subjects:", err);
      const isQuota =
        err?.code === "resource-exhausted" ||
        err?.message?.includes("Quota") ||
        err?.message?.includes("resource-exhausted");

      if (isQuota) {
        setQuotaExceeded(true);
      }

      // Graceful fallback to any existing cache
      const staleSubs = getCachedData<any[]>(CACHE_KEY, true) || getCachedData<any[]>("home_subjects_list", true);
      if (staleSubs && staleSubs.length > 0) {
        setSubjects(staleSubs);
        setTotalSubjectsCount(staleSubs.length);
      }
    } finally {
      setInitialLoading(false);
      if (forceRefresh) {
        setTimeout(() => setIsHomeRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    document.title = "SenseiTLU";

    // Fetch hero images (Cache-First)
    const cachedHero = getCachedData<{ leftUrl: string; rightUrl: string }>("hero_images_settings");
    if (cachedHero) {
      setHeroImages(cachedHero);
    } else {
      getDoc(doc(db, "settings", "heroImages")).then((docsnap) => {
        if (docsnap.exists()) {
          const data = docsnap.data() as { leftUrl: string; rightUrl: string };
          setHeroImages(data);
          setCachedData("hero_images_settings", data, CacheTTL.VERY_LONG);
        }
      }).catch(err => {
        const staleHero = getCachedData<{ leftUrl: string; rightUrl: string }>("hero_images_settings", true);
        if (staleHero) setHeroImages(staleHero);
      });
    }

    fetchInitial(false);
  }, []);

  // Reset to page 1 whenever user searches
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredSubjects = subjects
    .filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.description &&
          sub.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      // 1. User's personal favorites always come first
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      // 2. System Priority (set by admin) comes next for all users
      const aPriority = Boolean(a.isPriority);
      const bPriority = Boolean(b.isPriority);
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;

      // 3. Alphabetical order by name
      return (a.name || "").localeCompare(b.name || "", "vi");
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubjects.length / PAGE_SIZE)
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const displayedSubjects = filteredSubjects.slice(startIndex, endIndex);

  const handlePageChange = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) return;
    setCurrentPage(targetPage);

    // Smoothly scroll to the top of the subjects section
    const elem = document.getElementById("subjects-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleFavorite = (subjectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;

    try {
      const isPriority = Boolean(newSubject.isPriority);
      const docRef = await addDoc(collection(db, "subjects"), {
        name: newSubject.name.trim(),
        description: newSubject.description.trim(),
        iconName: newSubject.iconName,
        isPriority: isPriority,
        createdAt: serverTimestamp(),
      });
      setSubjects((prev) => [
        {
          id: docRef.id,
          name: newSubject.name.trim(),
          description: newSubject.description.trim(),
          iconName: newSubject.iconName,
          isPriority: isPriority,
        },
        ...prev,
      ]);
      setTotalSubjectsCount((prev) => prev + 1);
      if (isAdmin && user) {
        await addDoc(collection(db, 'system_updates'), {
          action: 'Tạo mới',
          entity: 'Môn học',
          details: `Tên môn: ${newSubject.name.trim()}${isPriority ? ' (Ưu tiên)' : ''}`,
          adminEmail: user.email,
          adminId: user.uid,
          timestamp: serverTimestamp(),
        });
      }
      setIsAddModalOpen(false);
      setNewSubject({ name: "", description: "", iconName: "Book", isPriority: false });
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.name.trim()) return;

    try {
      const isPriority = Boolean(editingSubject.isPriority);
      await updateDoc(doc(db, "subjects", editingSubject.id), {
        name: editingSubject.name.trim(),
        description: editingSubject.description?.trim() || "",
        iconName: editingSubject.iconName || "Book",
        isPriority: isPriority,
      });
      setSubjects((prev) =>
        prev.map((s) => (s.id === editingSubject.id ? { ...s, ...editingSubject, isPriority } : s))
      );
      if (isAdmin && user) {
        await addDoc(collection(db, 'system_updates'), {
          action: 'Cập nhật',
          entity: 'Môn học',
          details: `Tên môn: ${editingSubject.name.trim()}${isPriority ? ' (Ưu tiên)' : ''}`,
          adminEmail: user.email,
          adminId: user.uid,
          timestamp: serverTimestamp(),
        });
      }
      setEditingSubject(null);
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    try {
      await deleteDoc(doc(db, "subjects", subjectId));
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      setTotalSubjectsCount((prev) => Math.max(0, prev - 1));
      if (isAdmin && user) {
        await addDoc(collection(db, 'system_updates'), {
          action: 'Xóa',
          entity: 'Môn học',
          details: `Tên môn: ${subjectName}`,
          adminEmail: user.email,
          adminId: user.uid,
          timestamp: serverTimestamp(),
        });
      }
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  return (
    <div className="space-y-8 relative min-h-screen">
      {/* Mobile Clock Widgets (in flow below header, not covered by sticky layout) */}
      <div className="md:hidden relative w-full pt-1 px-1 z-20">
        <ClockWidget isMobileView={true} />
      </div>
      {/* Background Capybara Watermark */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center z-0 opacity-[0.04] dark:opacity-[0.08] mt-20">
        <img src="/avt_tlu (remove).png" alt="" className="w-[80vw] max-w-[600px] object-contain object-bottom" />
      </div>

      {/* Hero / Search Section */}
      <div className="relative flex items-center justify-center py-12 px-4 z-30">
        {/* Left Image */}
        {heroImages.leftUrl && (
          <div className="hidden lg:block absolute left-8 xl:left-16 w-48 xl:w-64 z-0 animate-in fade-in zoom-in duration-700">
            <img
              src={heroImages.leftUrl}
              alt="Trái"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl pointer-events-none select-none"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Main Center Content */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center z-10 w-full max-w-xl">
          <AnimatedHeroTitle />
          <p className="text-slate-600 dark:text-slate-400">
            Nền tảng chia sẻ tài liệu học tập, giáo trình, đề cương và thi thử
            trực tuyến dành cho sinh viên Trường Đại học Thủy lợi.
          </p>

          <div className="relative w-full mt-4 z-50" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none focus:shadow-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="Tìm môn học..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && searchQuery && (
              <div className="absolute w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto hidden-scrollbar">
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((sub) => (
                    <button
                      key={`suggestion-${sub.id}`}
                      onClick={() => {
                        setSearchQuery(sub.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{sub.name}</span>
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        {sub.isPriority && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                            <Pin className="w-2.5 h-2.5 rotate-45" /> Ưu tiên
                          </span>
                        )}
                        {favorites.includes(sub.id) && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-500 text-sm">
                    Không tìm thấy "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Image */}
        {heroImages.rightUrl && (
          <div className="hidden lg:block absolute right-8 xl:right-16 w-48 xl:w-64 z-0 animate-in fade-in zoom-in duration-700 delay-150">
            <img
              src={heroImages.rightUrl}
              alt="Phải"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl pointer-events-none select-none"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}
      </div>

      {/* Subjects Section */}
      <div id="subjects-section" className="space-y-4 relative z-10 scroll-mt-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
              Danh sách môn học
              <span className="ml-1 sm:ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs font-semibold">
                {searchQuery.trim()
                  ? `${filteredSubjects.length}${totalSubjectsCount > 0 ? ` / ${totalSubjectsCount}` : ""}`
                  : (totalSubjectsCount > 0 ? totalSubjectsCount : subjects.length)}
              </span>
            </h2>
            <button
              onClick={() => fetchInitial(true)}
              disabled={isHomeRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-95 disabled:opacity-60"
              title="Làm mới danh sách môn học từ máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHomeRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline">{isHomeRefreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm môn
            </button>
          )}
        </div>

        {/* Quota Exceeded Cache Notification Banner */}
        {quotaExceeded && subjects.length > 0 && (
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-800 dark:text-amber-200 text-xs sm:text-sm shadow-xs">
            <span className="text-lg">⚡</span>
            <p className="flex-1 leading-snug">
              <strong>Đang hiển thị từ bộ nhớ đệm:</strong> Máy chủ đang ghi nhận lượng truy cập cao, hệ thống tự động nạp từ bộ nhớ đệm để bạn tiếp tục ôn luyện mà không bị gián đoạn.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-slate-500 text-sm">Đang tải danh sách môn học...</p>
            </div>
          ) : displayedSubjects.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg mt-8">
                <span className="text-6xl">{quotaExceeded ? "⚡" : "👻"}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {quotaExceeded ? "Hệ thống hiện đang quá tải!" : "Trống trơn rồi!"}
              </h3>
              <p className="text-slate-500 max-w-md text-sm leading-relaxed">
                {quotaExceeded
                  ? "Website hiện đang ghi nhận lượng truy cập quá lớn. Bạn vui lòng quay lại sau nhé!"
                  : "Không tìm thấy môn học nào. Có vẻ chúng đang đi trốn đâu đó quanh đây... 🐾"}
              </p>
            </div>
          ) : (
            displayedSubjects.map((subject) => {
              const Icon = iconMap[subject.iconName] || Book;
              const isFav = favorites.includes(subject.id);
              const isPriority = Boolean(subject.isPriority);
              return (
                <div
                  key={subject.id}
                  className={`subject-card bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none xl:hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group relative focus:outline-none select-none md:select-auto ${
                    isPriority
                      ? "border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                  onTouchStart={() => {
                    if (touchTimerRef.current)
                      clearTimeout(touchTimerRef.current);
                    touchTimerRef.current = setTimeout(() => {
                      setActiveSubjectId(subject.id);
                      if (window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(50);
                      }
                    }, 400); // 400ms long press threshold
                  }}
                  onTouchEnd={() => {
                    if (touchTimerRef.current)
                      clearTimeout(touchTimerRef.current);
                  }}
                  onTouchMove={() => {
                    if (touchTimerRef.current)
                      clearTimeout(touchTimerRef.current);
                  }}
                  onContextMenu={(e) => {
                    if (activeSubjectId === subject.id) {
                      e.preventDefault(); // Prevent native right click selection on long press
                    }
                  }}
                >
                  <button
                    onClick={(e) => toggleFavorite(subject.id, e)}
                    className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-10 ${
                      isFav
                        ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 opacity-100"
                        : `text-slate-300 dark:text-slate-600 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 ${activeSubjectId === subject.id ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"}`
                    }`}
                    title={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                  >
                    <Star
                      className={`w-5 h-5 ${isFav ? "fill-current" : ""}`}
                    />
                  </button>
                  {isAdmin && (
                    <div
                      className={`absolute top-4 ${isFav || activeSubjectId === subject.id ? "right-14" : "right-4 md:group-hover:right-14"} flex items-center gap-1 transition-all z-10 ${activeSubjectId === subject.id ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"}`}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingSubject({
                            ...subject,
                            isPriority: Boolean(subject.isPriority),
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Sửa môn học"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteConfirmId(subject.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa môn học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {emojiMap[subject.iconName] || "📚"}
                    </div>
                    {isPriority && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 mr-12 shadow-xs">
                        <Pin className="w-3 h-3 rotate-45 text-amber-600 dark:text-amber-400" />
                        Ưu tiên
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{subject.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                    {subject.description ||
                      `Tổng hợp tài liệu môn ${subject.name}`}
                  </p>
                  <Link
                    to={`/subject/${subject.id}`}
                    className="w-full text-center bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Xem ngay <span className="text-lg leading-none">→</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination & Load More Controls */}
        {!searchQuery.trim() && (
          <div className="pt-6 pb-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Range info */}
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Đang xem <strong className="text-slate-800 dark:text-slate-200">{filteredSubjects.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(filteredSubjects.length, currentPage * PAGE_SIZE)}</strong> trên tổng số <strong className="text-slate-800 dark:text-slate-200">{filteredSubjects.length}</strong> môn học {filteredSubjects.length !== subjects.length && `(tìm kiếm trong ${subjects.length} môn)`}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trang trước</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-xs text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            currentPage === p
                              ? "bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold shadow-xs"
                              : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                title="Trang sau"
              >
                <span className="hidden sm:inline">Trang sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">Thêm môn học mới</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên môn học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Web, Giải tích 1..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  placeholder="Mô tả tóm tắt nội dung môn học..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.description}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.iconName}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, iconName: e.target.value })
                  }
                >
                  {Object.keys(emojiMap).map((key) => (
                    <option
                      key={key}
                      value={key}
                      className="text-slate-900 drop-shadow-sm"
                    >
                      {emojiMap[key]}{" "}
                      {iconLabels[key] ? `- ${iconLabels[key]}` : key}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Checkbox Option */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${newSubject.isPriority ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      <Pin className="w-4 h-4 rotate-45" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        Ưu tiên môn học
                        {newSubject.isPriority && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.2 rounded font-medium">Bật</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Ghim môn học này lên đầu danh sách cho tất cả người dùng
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer accent-amber-500 shrink-0 ml-2"
                    checked={newSubject.isPriority}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, isPriority: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">Sửa môn học</h3>
            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên môn học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingSubject.name}
                  onChange={(e) =>
                    setEditingSubject({
                      ...editingSubject,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingSubject.description}
                  onChange={(e) =>
                    setEditingSubject({
                      ...editingSubject,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingSubject.iconName}
                  onChange={(e) =>
                    setEditingSubject({
                      ...editingSubject,
                      iconName: e.target.value,
                    })
                  }
                >
                  {Object.keys(emojiMap).map((key) => (
                    <option
                      key={key}
                      value={key}
                      className="text-slate-900 drop-shadow-sm"
                    >
                      {emojiMap[key]}{" "}
                      {iconLabels[key] ? `- ${iconLabels[key]}` : key}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Checkbox Option */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${editingSubject.isPriority ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      <Pin className="w-4 h-4 rotate-45" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        Ưu tiên môn học
                        {editingSubject.isPriority && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.2 rounded font-medium">Bật</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Ghim môn học này lên đầu danh sách cho tất cả người dùng
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer accent-amber-500 shrink-0 ml-2"
                    checked={Boolean(editingSubject.isPriority)}
                    onChange={(e) =>
                      setEditingSubject({
                        ...editingSubject,
                        isPriority: e.target.checked,
                      })
                    }
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Xóa môn học?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa môn học này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const subjectToDelete = filteredSubjects.find(s => s.id === deleteConfirmId);
                  if (subjectToDelete) handleDeleteSubject(deleteConfirmId, subjectToDelete.name);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Workspace Button (Desktop only >= 768px; mobile uses Ecosystem drawer) */}
      <Link
        to="/workspace"
        className="hidden md:flex fixed bottom-6 left-6 z-40 items-center justify-center p-3 sm:p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
        title="Vào Study Space"
      >
        <div className="flex items-center justify-center gap-2">
          <MonitorPlay className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-medium hidden sm:inline">Study Space</span>
        </div>
      </Link>
    </div>
  );
}
