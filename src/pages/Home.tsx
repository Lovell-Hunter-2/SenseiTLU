import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Search, Plus, Book, Calculator, Code, Globe, Database, Cpu, FileText, Briefcase, Scale, Lightbulb, Brain, PieChart, ShoppingCart, Rocket, Trash2, Edit2, ChartBar, PenTool, Milestone, Activity, Building, Leaf, Shield, History, Compass, GraduationCap, Microscope, Palette, Landmark, Component, Cloud, DatabaseZap, DollarSign, Euro, Frame, Users, Target, Network, Layers, LayoutDashboard, LineChart, FileSpreadsheet, Bitcoin, CandlestickChart, TrendingUp, BadgeDollarSign, Receipt, Gavel, Building2, HandCoins, MessageCircle, Globe2, Map as MapIcon, HeartHandshake, Vote, MonitorPlay, Smartphone, Terminal, Server, Wifi, Fingerprint, Microchip, Bot, Star, Lock, LogIn } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Icon mapping helper
const iconLabels: Record<string, string> = {
  Book: 'Sách (Lý thuyết chung)',
  Calculator: 'Máy tính (Toán/Kế toán)',
  Code: 'Mã nguồn (Lập trình)',
  Globe: 'Địa cầu (Địa lý/Quốc tế)',
  Database: 'CSDL (Cơ sở dữ liệu)',
  Cpu: 'CPU (Phần cứng)',
  FileText: 'Văn bản (Ngữ văn/Tài liệu)',
  Briefcase: 'Cặp xách (Quản trị kinh doanh)',
  Scale: 'Cán cân (Luật học)',
  Lightbulb: 'Bóng đèn (Ý tưởng/Khởi nghiệp)',
  Brain: 'Bộ não (Tâm lý học/AI)',
  PieChart: 'Biểu đồ tròn (Thống kê)',
  ShoppingCart: 'Giỏ hàng (Thương mại điện tử)',
  Rocket: 'Tên lửa (Khởi nghiệp/Đổi mới)',
  ChartBar: 'Biểu đồ cột (Tài chính)',
  PenTool: 'Bút vẽ (Thiết kế đồ họa)',
  Milestone: 'Cột mốc (Lịch sử/Dự án)',
  Activity: 'Nhịp tim (Y tế/Sức khỏe)',
  Building: 'Tòa nhà (Kiến trúc/Xây dựng)',
  Leaf: 'Chiếc lá (Môi trường/Nông nghiệp)',
  Shield: 'Khiên chắn (An ninh mạng)',
  History: 'Đồng hồ (Lịch sử)',
  Compass: 'La bàn (Điều hướng/Hàng hải)',
  GraduationCap: 'Mũ tốt nghiệp (Giáo dục)',
  Microscope: 'Kính hiển vi (Sinh học/Hóa học)',
  Palette: 'Bảng màu (Nghệ thuật/Thiết kế)',
  Landmark: 'Đền thờ (Ngân hàng/Chính trị)',
  Component: 'Thành phần (Giao diện UI/UX)',
  Cloud: 'Đám mây (Điện toán đám mây)',
  DatabaseZap: 'CSDL Nhanh (Big Data)',
  DollarSign: 'Đô la (Kinh tế)',
  Euro: 'Euro (Kinh tế quốc tế)',
  Frame: 'Khung ảnh (Nhiếp ảnh/Thiết kế)',
  Users: 'Nhóm người (Xã hội học/Nhân sự)',
  Target: 'Mục tiêu (Marketing)',
  Network: 'Mạng lưới (Mạng máy tính)',
  Layers: 'Nhiều lớp (Kiến trúc/Đồ họa)',
  LayoutDashboard: 'Bảng điều khiển (UI/UX)',
  LineChart: 'Biểu đồ đường (Chứng khoán)',
  FileSpreadsheet: 'Bảng tính (Excel/Kế toán)',
  Bitcoin: 'Bitcoin (Tiền điện tử)',
  CandlestickChart: 'Biểu đồ nến (Tài chính/Forex)',
  // Added icons
  TrendingUp: 'Tăng trưởng (Kinh tế vi mô/vĩ mô)',
  BadgeDollarSign: 'Huy hiệu Đô la (Tài chính doanh nghiệp)',
  Receipt: 'Hóa đơn (Kế toán/Thuế)',
  Gavel: 'Búa tòa (Luật kinh tế)',
  Building2: 'Công ty (Quản trị doanh nghiệp)',
  HandCoins: 'Bàn tay đồng xu (Đầu tư/Tài chính)',
  MessageCircle: 'Bong bóng chat (Ngôn ngữ học/Truyền thông)',
  Globe2: 'Địa cầu chi tiết (Quan hệ quốc tế)',
  MapIcon: 'Bản đồ (Địa lý/Quy hoạch)',
  HeartHandshake: 'Bắt tay (Công tác xã hội)',
  Vote: 'Bầu cử (Chính trị học)',
  MonitorPlay: 'Màn hình phát (Truyền thông đa phương tiện)',
  Smartphone: 'Điện thoại (Lập trình di động)',
  Terminal: 'Dòng lệnh (Hệ điều hành)',
  Server: 'Máy chủ (Quản trị mạng)',
  Wifi: 'Wifi (Mạng viễn thông)',
  Fingerprint: 'Vân tay (An toàn thông tin)',
  Microchip: 'Vi mạch (Kiến trúc máy tính)',
  Bot: 'Robot (Trí tuệ nhân tạo)'
};

const iconMap: Record<string, React.ElementType> = {
  Book, Calculator, Code, Globe, Database, Cpu, FileText, Briefcase, Scale, Lightbulb, Brain, PieChart, ShoppingCart, Rocket,
  ChartBar, PenTool, Milestone, Activity, Building, Leaf, Shield, History, Compass, GraduationCap, Microscope, Palette, Landmark, 
  Component, Cloud, DatabaseZap, DollarSign, Euro, Frame, Users, Target, Network, Layers, LayoutDashboard, LineChart, FileSpreadsheet, Bitcoin, CandlestickChart,
  TrendingUp, BadgeDollarSign, Receipt, Gavel, Building2, HandCoins, MessageCircle, Globe2, MapIcon, HeartHandshake, Vote, MonitorPlay, Smartphone, Terminal, Server, Wifi, Fingerprint, Microchip, Bot
};

export default function Home() {
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [subjects, setSubjects] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cachedSubjects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteSubjects');
    return saved ? JSON.parse(saved) : [];
  });

  const { isAdmin, user, login } = useAuth();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '', iconName: 'Book' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [heroImages, setHeroImages] = useState<{ leftUrl: string, rightUrl: string }>({ leftUrl: '', rightUrl: '' });

  useEffect(() => {
    localStorage.setItem('favoriteSubjects', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleGlobalTouch = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.subject-card')) {
        setActiveSubjectId(null);
      }
    };
    document.addEventListener('touchstart', handleGlobalTouch);
    return () => document.removeEventListener('touchstart', handleGlobalTouch);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.title = "SenseiTLU";
    
    // Fetch hero images
    const unsubImages = onSnapshot(doc(db, 'settings', 'heroImages'), (docsnap) => {
      if (docsnap.exists()) {
        setHeroImages(docsnap.data() as { leftUrl: string, rightUrl: string });
      }
    });

    const q = query(collection(db, 'subjects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      subs.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'vi'));
      setSubjects(subs);
      try {
        localStorage.setItem('cachedSubjects', JSON.stringify(subs));
      } catch (e) {
        console.error("Could not cache subjects", e);
      }
    }, (error) => {
      console.error("Error fetching subjects:", error);
    });
    return () => {
      unsubscribe();
      unsubImages();
    };
  }, []);

  const filteredSubjects = subjects
    .filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0; // The original list is already sorted by name
    });

  const toggleFavorite = (subjectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    
    try {
      await addDoc(collection(db, 'subjects'), {
        name: newSubject.name,
        description: newSubject.description,
        iconName: newSubject.iconName,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewSubject({ name: '', description: '', iconName: 'Book' });
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.name.trim()) return;
    
    try {
      await updateDoc(doc(db, 'subjects', editingSubject.id), {
        name: editingSubject.name,
        description: editingSubject.description,
        iconName: editingSubject.iconName,
      });
      setEditingSubject(null);
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero / Search Section */}
      <div className="relative flex items-center justify-center py-12 px-4">
        {/* Left Image */}
        {heroImages.leftUrl && (
          <div className="hidden lg:block absolute left-8 xl:left-16 w-48 xl:w-64 z-0 animate-in fade-in zoom-in duration-700">
            <img src={heroImages.leftUrl} alt="Trái" className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl" />
          </div>
        )}
        
        {/* Main Center Content */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center z-10 w-full max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            📚 Tài liệu <span className="text-blue-600 dark:text-blue-400">SenseiTLU</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Nền tảng chia sẻ tài liệu học tập, giáo trình, đề cương và thi thử trực tuyến dành cho sinh viên Trường Đại học Thủy lợi.
          </p>
          
          <div className="relative w-full mt-4 z-50" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                  filteredSubjects.map(sub => (
                    <button
                      key={`suggestion-${sub.id}`}
                      onClick={() => {
                        setSearchQuery(sub.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      <span>{sub.name}</span>
                      {favorites.includes(sub.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 ml-auto" />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-500 text-sm">Không tìm thấy "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Image */}
        {heroImages.rightUrl && (
          <div className="hidden lg:block absolute right-8 xl:right-16 w-48 xl:w-64 z-0 animate-in fade-in zoom-in duration-700 delay-150">
            <img src={heroImages.rightUrl} alt="Phải" className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Subjects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
            Danh sách môn học
            <span className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs">
              {subjects.length}
            </span>
          </h2>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm môn
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map(subject => {
            const Icon = iconMap[subject.iconName] || Book;
            const isFav = favorites.includes(subject.id);
            return (
              <div 
                key={subject.id} 
                className="subject-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl xl:hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group relative focus:outline-none select-none md:select-auto"
                onTouchStart={() => {
                  if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                  touchTimerRef.current = setTimeout(() => {
                    setActiveSubjectId(subject.id);
                    if (window.navigator && window.navigator.vibrate) {
                      window.navigator.vibrate(50);
                    }
                  }, 400); // 400ms long press threshold
                }}
                onTouchEnd={() => {
                  if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                }}
                onTouchMove={() => {
                  if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
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
                      ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 opacity-100' 
                      : `text-slate-300 dark:text-slate-600 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 ${activeSubjectId === subject.id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`
                  }`}
                  title={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                  <Star className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>
                {isAdmin && (
                  <div className={`absolute top-4 ${isFav || activeSubjectId === subject.id ? 'right-14' : 'right-4 md:group-hover:right-14'} flex items-center gap-1 transition-all z-10 ${activeSubjectId === subject.id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingSubject(subject);
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
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{subject.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                  {subject.description || `Tổng hợp tài liệu môn ${subject.name}`}
                </p>
                <Link
                  to={`/subject/${subject.id}`}
                  className="w-full text-center bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Xem ngay <span className="text-lg leading-none">→</span>
                </Link>
              </div>
            );
          })}
        </div>
        
        {filteredSubjects.length === 0 && user && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>Không tìm thấy môn học nào phù hợp. <br /> Nếu vừa cập nhật hãy đợi vài giây hoặc F5 lại trang nhé!</p> 
          </div>
        )}

        {!user && (
          <div className="space-y-6 max-w-4xl mx-auto mt-8 relative z-10">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 sm:p-8 text-center shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Đăng nhập để xem và tải tài liệu
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                  Hệ thống yêu cầu đăng nhập để bảo vệ nội dung tài liệu. Vui lòng đăng nhập bằng tài khoản Google để truy cập kho đề cương, slide bài giảng, đề thi và sử dụng trợ lý AI.
                </p>
                <button
                  onClick={login}
                  className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20"
                >
                  <LogIn className="w-5 h-5" /> Đăng nhập để tiếp tục
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                 <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                   <LayoutDashboard className="w-5 h-5 text-blue-500" />
                   Về SenseiTLU
                 </h3>
                 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                   SenseiTLU là một nền tảng hỗ trợ sinh viên học tập, cung cấp kho tài liệu tham khảo phong phú và tính năng tạo bài thi thử tự động. Mọi người dùng đều có thể khám phá danh sách các môn học, đọc thông tin mô tả và tìm kiếm tài liệu mong muốn một cách dễ dàng ngay trên trang chủ.
                 </p>
               </div>
               
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                 <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                   <Shield className="w-5 h-5 text-emerald-500" />
                   Tại sao cần quyền Google Drive?
                 </h3>
                 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                   Để mang lại trải nghiệm ôn tập tốt hơn, SenseiTLU cung cấp tính năng AI phân tích chuyên sâu tài liệu cá nhân của bạn.
                 </p>
                 <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-5">
                   <li>Ứng dụng yêu cầu quyền <b>đọc (readonly)</b> vào Google Drive của bạn.</li>
                   <li>Quyền này <b>chỉ</b> được sử dụng khi bạn chủ động chọn một file từ Drive để AI đọc và tạo bộ đề thi mô phỏng từ file đó.</li>
                   <li>Chúng tôi không lưu trữ hoặc chia sẻ dữ liệu Drive của bạn với bất kỳ bên thứ ba nào khác. Tham khảo thêm tại <Link to="/privacy" className="text-blue-500 hover:underline">Chính sách bảo mật</Link> và <Link to="/terms" className="text-blue-500 hover:underline">Điều khoản dịch vụ</Link>.</li>
                 </ul>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">Thêm môn học mới</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên môn học</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.name}
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.description}
                  onChange={e => setNewSubject({...newSubject, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject.iconName}
                  onChange={e => setNewSubject({...newSubject, iconName: e.target.value})}
                >
                  {Object.keys(iconMap).map(key => (
                    <option key={key} value={key} className="text-slate-900">
                      {key} {iconLabels[key] ? `- ${iconLabels[key]}` : ''}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">Sửa môn học</h3>
            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên môn học</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingSubject.name}
                  onChange={e => setEditingSubject({...editingSubject, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingSubject.description}
                  onChange={e => setEditingSubject({...editingSubject, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingSubject.iconName}
                  onChange={e => setEditingSubject({...editingSubject, iconName: e.target.value})}
                >
                  {Object.keys(iconMap).map(key => (
                    <option key={key} value={key} className="text-slate-900">
                      {key} {iconLabels[key] ? `- ${iconLabels[key]}` : ''}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Xóa môn học?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Bạn có chắc chắn muốn xóa môn học này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteSubject(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
