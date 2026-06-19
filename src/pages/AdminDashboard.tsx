import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, BarChart3, Image as ImageIcon, LayoutDashboard, Shield, Activity, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import UserManagerModal from '../components/UserManagerModal';
import HeroImageManagerModal from '../components/HeroImageManagerModal';
import AdminManagerModal from '../components/AdminManagerModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'reports' | 'users' | 'ui' | 'admins'>('overview');
  
  // Analytics state
  const [totalVisits, setTotalVisits] = useState(0);
  const [dailyVisits, setDailyVisits] = useState(0);
  const [topSubjects, setTopSubjects] = useState<any[]>([]);
  const [topDocs, setTopDocs] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

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

        // Daily visits (today)
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyRef = doc(db, 'analytics', `daily_visits_${todayStr}`);
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

        // Chart Data (Last 7 days)
        const generateChartData = async () => {
          const data = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const ref = doc(db, 'analytics', `daily_visits_${dateStr}`);
            const snap = await getDoc(ref);
            
            // Format nice title for x-axis
            const displayDate = `${date.getDate()}/${date.getMonth() + 1}`;
            
            data.push({
              name: displayDate,
              visits: snap.exists() ? snap.data().visits : 0
            });
          }
          setChartData(data);
        };
        await generateChartData();

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
              
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoạt động</p>
              </div>
              
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'activity' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-5 h-5" />
                Lịch sử hoạt động
              </button>
              
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                Quản lý Báo cáo
              </button>

              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hệ thống</p>
              </div>
              
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

              {/* Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                 <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" /> Thống kê truy cập (7 ngày qua)
                 </h3>
                 <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                        />
                        <Area type="monotone" dataKey="visits" name="Lượt truy cập" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                      </AreaChart>
                    </ResponsiveContainer>
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

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Lịch sử hoạt động hệ thống</h2>
                  <p className="text-sm text-slate-500">Theo dõi các sự kiện chính trên nền tảng (Timeline).</p>
                </div>
              </div>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {/* Dummy items */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">Admin Update</span>
                      <span className="text-xs font-medium text-blue-500">Vừa xong</span>
                    </div>
                    <p className="text-sm text-slate-500">Tính năng Lịch sử hoạt động vừa được thiết lập.</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">Hệ thống</span>
                      <span className="text-xs font-medium text-slate-500">2 giờ trước</span>
                    </div>
                    <p className="text-sm text-slate-500">Cập nhật thống kê truy cập hàng ngày.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center text-sm text-slate-500 italic">
                *Đang tải thêm kết nối tới Firestore collection `activities`...
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Quản lý Báo cáo / Nội dung</h2>
                  <p className="text-sm text-slate-500">Kiểm duyệt các tệp tải lên hoặc báo cáo người dùng.</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3 opacity-50" />
                <h3 className="font-bold text-lg mb-2">Chưa có báo cáo nào</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Tính năng kiểm duyệt nội dung đang trong giai đoạn phát triển. Khi hệ thống bình luận hoặc tải tài liệu của người dùng được mở, các báo cáo sẽ xuất hiện tại đây.
                </p>
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
