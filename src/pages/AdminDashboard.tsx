import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, BarChart3, Image as ImageIcon, LayoutDashboard, Shield } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import UserManagerModal from '../components/UserManagerModal';
import HeroImageManagerModal from '../components/HeroImageManagerModal';
import AdminManagerModal from '../components/AdminManagerModal';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ui' | 'admins'>('overview');
  
  // Analytics state
  const [totalVisits, setTotalVisits] = useState(0);
  const [dailyVisits, setDailyVisits] = useState(0);
  const [topSubjects, setTopSubjects] = useState<any[]>([]);
  const [topDocs, setTopDocs] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);
  const [isHeroManagerOpen, setIsHeroManagerOpen] = useState(false);
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAnalytics = async () => {
      try {
        // Total visits
        const totalRef = doc(db, 'analytics', 'total_visits');
        const totalSnap = await getDoc(totalRef);
        if (totalSnap.exists()) {
          setTotalVisits(totalSnap.data().visits || 0);
        }

        // Daily visits
        const today = new Date().toISOString().split('T')[0];
        const dailyRef = doc(db, 'analytics', `daily_visits_${today}`);
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists()) {
          setDailyVisits(dailySnap.data().visits || 0);
        }

        // Top Subjects
        const subjectsQuery = query(collection(db, 'analytics_subjects'), orderBy('views', 'desc'), limit(6));
        const subjectsSnap = await getDocs(subjectsQuery);
        setTopSubjects(subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Top Docs
        const docsQuery = query(collection(db, 'analytics_documents'), orderBy('views', 'desc'), limit(6));
        const docsSnap = await getDocs(docsQuery);
        setTopDocs(docsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Total Users
        const usersSnap = await getDocs(collection(db, 'users'));
        setTotalUsers(usersSnap.size);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [isAdmin]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sticky top-24">
            <h2 className="text-xl font-bold mb-6 px-2">Dashboard Quản trị</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'users' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Quản lý User
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'admins' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className="w-5 h-5" />
                Phân quyền Admin
              </button>
              <button
                onClick={() => setActiveTab('ui')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'ui' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                Quản lý Giao diện
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                     <BarChart3 className="w-5 h-5" />
                     <h3 className="font-medium">Lượt truy cập hôm nay</h3>
                  </div>
                  <p className="text-4xl font-bold text-blue-600">{dailyVisits}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                     <BarChart3 className="w-5 h-5" />
                     <h3 className="font-medium">Tổng lượt truy cập</h3>
                  </div>
                  <p className="text-4xl font-bold text-slate-800 dark:text-white">{totalVisits}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                    {/* Placeholder for future growth */}
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                     <Users className="w-5 h-5" />
                     <h3 className="font-medium">Tổng tài khoản</h3>
                  </div>
                  <p className="text-4xl font-bold text-slate-800 dark:text-white">{totalUsers}</p>
                </div>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" /> TOP Môn học được quan tâm
                   </h3>
                   <div className="space-y-3">
                     {topSubjects.length > 0 ? topSubjects.map((s, idx) => (
                       <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <span className="font-medium flex items-center gap-3">
                             <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">{idx + 1}</span>
                             {s.name}
                          </span>
                          <span className="text-sm text-slate-500 font-semibold">{s.views} lượt xem</span>
                       </div>
                     )) : (
                        <p className="text-slate-500 italic">Chưa có dữ liệu</p>
                     )}
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" /> TOP Tài liệu xem nhiều nhất
                   </h3>
                   <div className="space-y-3">
                     {topDocs.length > 0 ? topDocs.map((d, idx) => (
                       <div key={d.id} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium flex items-start gap-3">
                               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold mt-0.5 flex-shrink-0">{idx + 1}</span>
                               <span className="line-clamp-2 leading-tight">{d.title}</span>
                            </span>
                            <span className="text-sm text-slate-500 font-semibold whitespace-nowrap">{d.views} lượt</span>
                          </div>
                          <span className="text-xs text-slate-500 mt-2 ml-9">Môn: {d.subjectName}</span>
                       </div>
                     )) : (
                        <p className="text-slate-500 italic">Chưa có dữ liệu</p>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <UserManagerModal inline />
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <AdminManagerModal inline />
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <HeroImageManagerModal inline />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
