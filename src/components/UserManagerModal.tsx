import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, Users, RefreshCw, Filter, ArrowUp, ArrowDown, Activity, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Shield, Search } from 'lucide-react';
import UserPermissionModal from './UserPermissionModal';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  isOnline?: boolean;
}

interface ActivityData {
  id: string;
  action: string;
  details: string;
  path: string;
  timestamp: any;
}

interface UserManagerModalProps {
  onClose?: () => void;
  inline?: boolean;
}

export default function UserManagerModal({ onClose, inline }: UserManagerModalProps) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionUser, setPermissionUser] = useState<UserData | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = user.displayName?.toLowerCase().includes(query);
    const emailMatch = user.email?.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Reset page when search query, sort order, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder, pageSize]);

  // Keep currentPage valid if totalPages changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(filteredUsers.length, startIndex + pageSize);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(clamped);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      if (onClose) onClose();
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      let fetchedUsers = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as UserData;
        const userObj = { id: docSnap.id, ...data };
        
        // Check if lastLoginAt or createdAt is recorded in the future (due to client clock mismatch)
        const loginTime = userObj.lastLoginAt ? new Date(userObj.lastLoginAt).getTime() : 0;
        if (loginTime > now + 60000) {
          // Auto-correct corrupt future timestamp in Firestore
          updateDoc(doc(db, 'users', docSnap.id), {
            lastLoginAt: new Date(now).toISOString()
          }).catch(console.error);
          userObj.lastLoginAt = new Date(now).toISOString();
        }

        return userObj;
      });
      
      // Sort logic with future-time clamping
      fetchedUsers.sort((a, b) => {
        const rawA = new Date(a.lastLoginAt || a.createdAt || 0).getTime();
        const rawB = new Date(b.lastLoginAt || b.createdAt || 0).getTime();
        const timeA = rawA > now ? now : rawA;
        const timeB = rawB > now ? now : rawB;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });

      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, sortOrder]);

  useEffect(() => {
    if (!selectedUser) {
      setActivities([]);
      setActivitiesError(null);
      return;
    }

    setLoadingActivities(true);
    setActivitiesError(null);
    const q = query(
      collection(db, 'users', selectedUser.id, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityData));
      setActivities(fetchedActivities);
      setLoadingActivities(false);
    }, (error) => {
      console.error("Error fetching activities:", error);
      setActivitiesError(error.message);
      setLoadingActivities(false);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  if (!isAdmin) return null;

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa rõ';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Chưa rõ';
      
      // Prevent displaying future time if client machine was set ahead
      const now = Date.now();
      const safeTime = date.getTime() > now ? new Date(now) : date;

      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(safeTime);
    } catch {
      return 'Chưa rõ';
    }
  };

  const formatActivityDate = (timestamp: any) => {
    if (!timestamp) return 'Vừa xong';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

  const renderPaginationControls = (isTop: boolean = true) => (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" aria-label="Phân trang danh sách người dùng">
      {/* Về trang đầu tiên (Double arrow left) */}
      <button
        type="button"
        onClick={() => goToPage(1)}
        disabled={currentPage === 1 || loading || filteredUsers.length === 0}
        title="Về trang đầu tiên"
        aria-label="Về trang đầu tiên"
        className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center active:scale-95"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Trang trước (Single arrow left) */}
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1 || loading || filteredUsers.length === 0}
        title="Trang trước"
        aria-label="Trang trước"
        className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Hiển thị số trang ở giữa */}
      <div className="flex items-center px-2 sm:px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs whitespace-nowrap min-w-[85px] sm:min-w-[105px] justify-center select-none">
        <span>
          Trang <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredUsers.length === 0 ? 0 : currentPage}</strong> / {totalPages}
        </span>
      </div>

      {/* Trang kế tiếp (Single arrow right) */}
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages || loading || filteredUsers.length === 0}
        title="Trang kế tiếp"
        aria-label="Trang kế tiếp"
        className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center active:scale-95"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Đến trang cuối cùng (Double arrow right) */}
      <button
        type="button"
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages || loading || filteredUsers.length === 0}
        title="Đến trang cuối cùng"
        aria-label="Đến trang cuối cùng"
        className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center active:scale-95"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );

  const content = (
    <>
      <div className={inline ? "w-full h-full flex flex-col min-h-0 overflow-hidden" : "bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"}>
        
        {/* Pinned Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 text-blue-600 dark:text-blue-400 min-w-0">
            {selectedUser ? (
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                title="Quay lại danh sách"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : (
              <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                {selectedUser ? 'Lịch sử hoạt động' : 'Quản lý người dùng'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                {selectedUser ? `Theo dõi hoạt động của ${selectedUser.displayName}` : 'Theo dõi hoạt động, đăng nhập và phân quyền người dùng'}
              </p>
            </div>
          </div>
          {!inline && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body content */}
        {selectedUser ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 bg-slate-50 dark:bg-slate-950/50">
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              {/* User Info Header in Activity View */}
              <div className="flex items-center gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <img src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.displayName}`} alt={selectedUser.displayName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">{selectedUser.displayName}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{selectedUser.email}</p>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[200px] shadow-xs">
                {loadingActivities ? (
                  <div className="absolute inset-0 flex justify-center items-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : activitiesError ? (
                  <div className="p-8 text-center text-red-500 flex flex-col items-center">
                    <Activity className="w-12 h-12 text-red-300 dark:text-red-700 mb-2" />
                    <p>Lỗi hiển thị dữ liệu: {activitiesError}</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                    <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                    <p>Chưa có dữ liệu hoạt động</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activities.map((act) => (
                      <div key={act.id} className="p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 sm:gap-4">
                        <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full mt-0.5 shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                            {act.action}: <span className="text-blue-600 dark:text-blue-400">{act.details}</span>
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{formatActivityDate(act.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Controls & Pagination Toolbar */}
            <div className="shrink-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-3 sm:py-3.5 space-y-3 sm:space-y-3.5 z-10">
              {/* Row 1: Search, Filter, Page Size and 4 Pagination Arrows */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Search box */}
                  <div className="relative flex-1 min-w-[180px] max-w-xs sm:max-w-sm">
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Xóa tìm kiếm"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort button */}
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap shadow-xs"
                    title="Đổi chiều sắp xếp theo thời gian đăng nhập"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Đăng nhập:</span>
                    {sortOrder === 'desc' ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">Mới nhất <ArrowDown className="w-3.5 h-3.5"/></span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">Cũ nhất <ArrowUp className="w-3.5 h-3.5"/></span>
                    )}
                  </button>

                  {/* Page Size Selector (20, 25, 50) */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="hidden sm:inline">Mỗi trang:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm focus:outline-none cursor-pointer"
                    >
                      <option value={20} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">20 tên / trang</option>
                      <option value={25} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">25 tên / trang</option>
                      <option value={50} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">50 tên / trang</option>
                    </select>
                  </div>
                </div>

                {/* 4 Pagination Arrows Toolbar at top */}
                <div className="flex items-center justify-end self-end sm:self-auto">
                  {renderPaginationControls(true)}
                </div>
              </div>

              {/* Row 2: Prominent, larger user count badge lowered down into the spacious area */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 sm:pt-2">
                <div className="inline-flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700/90 shadow-xs">
                  <div className="p-1 sm:p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-200 font-medium">
                    <span>Hiển thị người dùng </span>
                    <strong className="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base md:text-lg">
                      {filteredUsers.length > 0 ? `${startIndex + 1} – ${endIndex}` : '0'}
                    </strong>
                    <span className="text-slate-400 dark:text-slate-500 mx-1.5 font-normal">/</span>
                    <strong className="font-bold text-slate-900 dark:text-white text-sm sm:text-base md:text-lg">
                      {filteredUsers.length.toLocaleString('vi-VN')}
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300 ml-1">người dùng</span>
                  </div>
                </div>

                {searchQuery && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs sm:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Đang lọc theo:</span>
                    <strong className="font-semibold">"{searchQuery}"</strong>
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-red-500 text-slate-400 transition-colors"
                      title="Bỏ tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Table Area inside the bounded box */}
            <div 
              ref={tableContainerRef}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-slate-50 dark:bg-slate-950/40 relative"
            >
              {loading ? (
                <div className="flex flex-col justify-center items-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Đang tải danh sách người dùng...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-xs">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Người dùng</th>
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Email</th>
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Trạng thái</th>
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Lần cuối đăng nhập</th>
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-900">
                    {paginatedUsers.map((u) => (
                      <tr 
                        key={u.id} 
                        onClick={() => setSelectedUser(u)}
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-3 sm:px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt={u.displayName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                            <div className="font-medium text-slate-900 dark:text-white max-w-[120px] sm:max-w-[200px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={u.displayName}>
                              {u.displayName || 'Không rõ'}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
                          {u.email}
                        </td>
                        <td className="px-3 sm:px-6 py-3">
                          <div className={`flex items-center gap-1.5 inline-flex px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                            u.isOnline 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${u.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            {u.isOnline ? 'Đang online' : 'Ngoại tuyến'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(u.lastLoginAt || u.createdAt)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-right">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPermissionUser(u);
                            }}
                            className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-blue-200 dark:border-blue-800/50 flex items-center justify-center gap-1 ml-auto whitespace-nowrap shadow-xs"
                          >
                            <Shield className="w-3.5 h-3.5" /> Cấp quyền
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            <p className="font-medium">Không tìm thấy người dùng nào</p>
                            {searchQuery && (
                              <button 
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Xóa bộ lọc tìm kiếm
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Bar: Summary & Navigation */}
            {!loading && filteredUsers.length > 0 && (
              <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm">
                    Đang hiển thị <strong className="text-blue-600 dark:text-blue-400 font-bold">{startIndex + 1} – {endIndex}</strong> trên tổng số <strong className="text-slate-900 dark:text-white font-bold">{filteredUsers.length.toLocaleString('vi-VN')}</strong> người dùng
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {renderPaginationControls(false)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {permissionUser && (
        <UserPermissionModal 
          user={permissionUser} 
          onClose={() => setPermissionUser(null)} 
        />
      )}
    </>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
}
