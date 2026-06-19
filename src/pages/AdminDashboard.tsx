import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, BarChart3, Image as ImageIcon, LayoutDashboard, Shield, Activity, AlertTriangle, Database, LineChart as LineChartIcon, AlertOctagon } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import UserManagerModal from '../components/UserManagerModal';
import HeroImageManagerModal from '../components/HeroImageManagerModal';
import AdminManagerModal from '../components/AdminManagerModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'reports' | 'storage' | 'retention' | 'errors' | 'users' | 'ui' | 'admins'>('overview');
  
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
                onClick={() => setActiveTab('retention')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'retention' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <LineChartIcon className="w-5 h-5" />
                Tỷ lệ quay lại
              </button>

              <button
                onClick={() => setActiveTab('errors')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'errors' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <AlertOctagon className="w-5 h-5" />
                Tình trạng Lỗi
              </button>

              <button
                onClick={() => setActiveTab('storage')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'storage' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Database className="w-5 h-5" />
                Giám sát Lưu trữ
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

          {activeTab === 'storage' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Giám sát Lưu trữ (Storage Monitor)</h2>
                  <p className="text-sm text-slate-500">Quản lý tài nguyên lưu trữ và phân bổ các tệp tin trên Firebase Storage.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 text-center">
                  <h3 className="text-sm font-semibold text-slate-500 mb-1">Dung lượng Hệ thống</h3>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">15.4 GB <span className="text-base text-slate-400 font-normal">/ 50 GB</span></p>
                  
                  <div className="mt-4 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 h-full" style={{ width: '30%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-left">Đã dùng 30% dung lượng</p>

                  <div className="grid grid-cols-3 gap-2 mt-6">
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-2 text-center rounded-lg">
                        <span className="block text-xs text-slate-500">Tệp PDF</span>
                        <span className="font-bold">8.2 GB</span>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-2 text-center rounded-lg">
                        <span className="block text-xs text-slate-500">Hình ảnh</span>
                        <span className="font-bold">4.5 GB</span>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-2 text-center rounded-lg">
                        <span className="block text-xs text-slate-500">Mã/File khác</span>
                        <span className="font-bold">2.7 GB</span>
                     </div>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-slate-500 w-full text-left mb-2">Phân bổ loại tệp tin tải lên</h3>
                  <div className="h-48 w-full max-w-xs mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'PDF', value: 8200, color: '#ef4444' }, // Red
                            { name: 'Img', value: 4500, color: '#3b82f6' }, // Blue
                            { name: 'Docx', value: 1200, color: '#10b981' }, // Green
                            { name: 'Khác', value: 1500, color: '#cbd5e1' }, // Gray
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {
                            [
                              { name: 'PDF', value: 8200, color: '#ef4444' },
                              { name: 'Img', value: 4500, color: '#3b82f6' },
                              { name: 'Docx', value: 1200, color: '#10b981' },
                              { name: 'Khác', value: 1500, color: '#cbd5e1' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                            ))
                          }
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `${(Number(value) / 1000).toFixed(1)} GB`}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-slate-500 italic">
                  *Đây là dữ liệu mẫu để minh họa. Để hiển thị số liệu thật, cần cấu hình metadata Firebase Storage.
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <LineChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Tỷ lệ Người dùng quay lại (Retention)</h2>
                  <p className="text-sm text-slate-500">So sánh số lượng người dùng mới (đăng ký mới) và người dùng cũ quay lại theo tuần.</p>
                </div>
              </div>
              
              <div className="h-80 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { day: 'T2', newUsers: 12, returningUsers: 45 },
                      { day: 'T3', newUsers: 19, returningUsers: 50 },
                      { day: 'T4', newUsers: 8, returningUsers: 60 },
                      { day: 'T5', newUsers: 15, returningUsers: 48 },
                      { day: 'T6', newUsers: 22, returningUsers: 55 },
                      { day: 'T7', newUsers: 30, returningUsers: 70 },
                      { day: 'CN', newUsers: 25, returningUsers: 65 },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="newUsers" name="Người dùng Mới" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="returningUsers" name="Người dùng Quay lại" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center text-xs text-slate-500 italic">
                  *Biểu đồ sử dụng dữ liệu mẫu để minh họa tính năng Retention.
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Thống kê Lỗi (Error Logs)</h2>
                    <p className="text-sm text-slate-500">Giám sát các lỗi hệ thống theo thời gian thực.</p>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  Live
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Loại lỗi</th>
                      <th className="px-4 py-3">Thông điệp cốt lõi</th>
                      <th className="px-4 py-3">Mức độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">Hôm nay 10:45</td>
                      <td className="px-4 py-3 font-medium">Lỗi Tải lên Fỉe</td>
                      <td className="px-4 py-3 font-mono text-xs text-red-500">Firebase Storage: Quota exceeded (403)</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Nghiêm trọng</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">Hôm nay 09:12</td>
                      <td className="px-4 py-3 font-medium">Xác thực người dùng</td>
                      <td className="px-4 py-3 font-mono text-xs text-orange-500">Auth: ID Token expired</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Cảnh báo</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">Hôm qua 23:30</td>
                      <td className="px-4 py-3 font-medium">Gián đoạn mạng</td>
                      <td className="px-4 py-3 font-mono text-xs text-yellow-600 dark:text-yellow-500">Network Error: Timeout after 10000ms</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Thấp</span></td>
                    </tr>
                  </tbody>
                </table>
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
