import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Users, BarChart3, Image as ImageIcon, LayoutDashboard, Shield, Activity, AlertTriangle, Database, LineChart as LineChartIcon, AlertOctagon, CheckCircle2, X, FileText, User as UserIcon, MapPin, Clock, EyeOff, MessageSquare, Globe, BookOpen, TrendingUp, Calendar, Flame, Layers, Award, Sparkles, ExternalLink, Filter } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, startAt, endAt, collectionGroup, getCountFromServer, updateDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import UserManagerModal from '../components/UserManagerModal';
import HeroImageManagerModal from '../components/HeroImageManagerModal';
import AdminManagerModal from '../components/AdminManagerModal';
import HiddenDocsManager from '../components/HiddenDocsManager';
import EcosystemManagerModal from '../components/EcosystemManagerModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, BarChart, Bar } from 'recharts';
import { getVietnamDateString } from '../services/analyticsService';

interface ErrorLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  severity: 'Nghiêm trọng' | 'Cảnh báo' | 'Thấp';
  user?: string;
  location?: string;
  details?: string;
  actionContext?: string;
}

const getFriendlyErrorContext = (log: ErrorLog) => {
    let context = 'Không rõ hành động';
    let module = 'Hệ thống chung';

    const locationStr = (log.location || '').toLowerCase();
    const typeStr = (log.type || '').toLowerCase();
    const msgStr = (log.message || '').toLowerCase();
    const detailsStr = (log.details || '').toLowerCase();
    
    if (locationStr.includes('quiz') || typeStr.includes('quiz') || detailsStr.includes('quiz')) {
        module = 'Đề thi (Quiz)';
        if (locationStr.includes('create') || msgStr.includes('create')) context = 'Lỗi khi tạo đề thi';
        else if (locationStr.includes('attempt') || msgStr.includes('submit')) context = 'Lỗi khi đang làm/nộp bài thi';
        else context = 'Lỗi khi duyệt đề thi';
    } else if (locationStr.includes('studyspace') || typeStr.includes('studyspace') || detailsStr.includes('room')) {
        module = 'Study Space';
        if (msgStr.includes('join')) context = 'Lỗi tham gia phòng học';
        else if (msgStr.includes('create')) context = 'Lỗi tạo phòng học';
        else context = 'Lỗi trong phiên học trực tuyến';
    } else if (locationStr.includes('blog') || locationStr.includes('post')) {
        module = 'Blog (Bài viết)';
        context = 'Lỗi xem hoặc tương tác bài viết';
    } else if (locationStr.includes('document') || typeStr.includes('doc')) {
        module = 'Tài liệu (Documents)';
        context = 'Lỗi tải hoặc xem tài liệu';
    } else if (locationStr.includes('mock-exam') || typeStr.includes('mockexam') || detailsStr.includes('mock-exam')) {
        module = 'Thi thử (Mock Exam)';
        context = 'Lỗi trong kỳ thi thử';
    } else if (typeStr.includes('auth') || msgStr.includes('auth') || msgStr.includes('login') || msgStr.includes('user')) {
        module = 'Tài khoản & Xác thực';
        context = 'Lỗi đăng nhập hoặc phiên làm việc';
    }

    // Default fallbacks for specific React errors
    if (msgStr.includes("failed to execute 'insertbefore'") || msgStr.includes("failed to execute 'removechild'") || msgStr.includes("not a child of this node")) {
        context = context !== 'Không rõ hành động' ? `${context} (Lỗi hiển thị UI)` : 'Lỗi đụng độ giao diện (React DOM)';
    } else if (msgStr.includes('timeout') || msgStr.includes('network')) {
        context = context !== 'Không rõ hành động' ? `${context} (Mất kết nối)` : 'Lỗi đường truyền hoặc Time-out';
    } else if (msgStr.includes('permission') || msgStr.includes('denied')) {
        context = context !== 'Không rõ hành động' ? `${context} (Bị từ chối quyền)` : 'Lỗi thiếu quyền truy cập (Permission)';
    }

    if (log.actionContext) {
         context = log.actionContext;
    }

    return { module, context };
};

interface Report {
  id: string;
  documentId: string;
  documentTitle: string;
  subjectId: string;
  subjectName: string;
  reason: string;
  userId: string;
  userEmail: string;
  status: string;
  createdAt: any;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'reports' | 'storage' | 'retention' | 'errors' | 'users' | 'ui' | 'admins' | 'hidden_docs' | 'ecosystem'>('overview');
  const [selectedErrorLog, setSelectedErrorLog] = useState<ErrorLog | null>(null);
  
  // Analytics state
  const [totalVisits, setTotalVisits] = useState(0);
  const [dailyVisits, setDailyVisits] = useState(0);
  const [topSubjects, setTopSubjects] = useState<any[]>([]);
  const [topDocs, setTopDocs] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [systemResources, setSystemResources] = useState({ documents: 0, quizzes: 0 });
  const [systemActivities, setSystemActivities] = useState<any[]>([]);
  
  // Reply to report state
  const [replyingToReport, setReplyingToReport] = useState<Report | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  // Dashboard states
  const [chartRange, setChartRange] = useState<number>(7);
  const [usersCache, setUsersCache] = useState<any>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Real-time Firestore visit metrics for content analytics
  const [todayHourlyData, setTodayHourlyData] = useState<{ [hour: string]: number }>({});
  const [dailyVisitsHistory, setDailyVisitsHistory] = useState<{ [dateStr: string]: number }>({});
  const [subjectHourlyToday, setSubjectHourlyToday] = useState<{ [hour: string]: number }>({});
  const [subjectDailyHistory, setSubjectDailyHistory] = useState<{ [dateStr: string]: number }>({});
  const [docHourlyToday, setDocHourlyToday] = useState<{ [hour: string]: number }>({});
  const [docDailyHistory, setDocDailyHistory] = useState<{ [dateStr: string]: number }>({});

  // Content analytics state (Subjects & Docs)
  const [contentAnalyticsTab, setContentAnalyticsTab] = useState<'subjects' | 'documents'>('subjects');
  const [contentAnalyticsRange, setContentAnalyticsRange] = useState<'day' | 'week' | 'month'>('day');
  const [timeframeContentStats, setTimeframeContentStats] = useState<{
    day: { subjects: { id: string; name: string; views: number }[]; docs: { id: string; title: string; subjectName?: string; views: number }[] };
    week: { subjects: { id: string; name: string; views: number }[]; docs: { id: string; title: string; subjectName?: string; views: number }[] };
    month: { subjects: { id: string; name: string; views: number }[]; docs: { id: string; title: string; subjectName?: string; views: number }[] };
  }>({
    day: { subjects: [], docs: [] },
    week: { subjects: [], docs: [] },
    month: { subjects: [], docs: [] },
  });

  // Helper to get VN time date strings for chart
  const getVnDateStringWithOffset = (offsetDays: number) => {
     const d = new Date();
     const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
     vnTime.setUTCDate(vnTime.getUTCDate() - offsetDays);
     const y = vnTime.getUTCFullYear();
     const m = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
     const dt = String(vnTime.getUTCDate()).padStart(2, '0');
     return {
       dateStr: `${y}-${m}-${dt}`,
       monthStr: `${y}-${m}`,
       displayDate: `${vnTime.getUTCDate()}/${vnTime.getUTCMonth() + 1}`,
       displayMonth: `Tháng ${vnTime.getUTCMonth() + 1}/${String(y).slice(2)}`,
       vnTime
     };
  };

  // Compute timeframe analytics chart data and ranking list for Subjects & Documents strictly by timeframe (Day / Week / Month)
  const getContentAnalyticsData = () => {
    const timeframeData = timeframeContentStats[contentAnalyticsRange] || { subjects: [], docs: [] };
    const rawList = contentAnalyticsTab === 'subjects' ? timeframeData.subjects : timeframeData.docs;

    const totalTimeframeViews = rawList.reduce((acc, curr) => acc + curr.views, 0);
    const maxTimeframeViews = rawList[0]?.views || 1;

    let chartSlots: { name: string; views: number }[] = [];

    const isSubject = contentAnalyticsTab === 'subjects';
    const hourlyMap = isSubject ? (Object.keys(subjectHourlyToday).length > 0 ? subjectHourlyToday : todayHourlyData) : (Object.keys(docHourlyToday).length > 0 ? docHourlyToday : todayHourlyData);
    const dailyMap = isSubject ? (Object.keys(subjectDailyHistory).length > 0 ? subjectDailyHistory : dailyVisitsHistory) : (Object.keys(docDailyHistory).length > 0 ? docDailyHistory : dailyVisitsHistory);

    if (contentAnalyticsRange === 'day') {
      const h = hourlyMap;
      const night = (h['00'] || 0) + (h['01'] || 0) + (h['02'] || 0) + (h['03'] || 0) + (h['04'] || 0) + (h['05'] || 0);
      const morning = (h['06'] || 0) + (h['07'] || 0) + (h['08'] || 0) + (h['09'] || 0) + (h['10'] || 0) + (h['11'] || 0);
      const afternoon = (h['12'] || 0) + (h['13'] || 0) + (h['14'] || 0) + (h['15'] || 0) + (h['16'] || 0) + (h['17'] || 0);
      const evening = (h['18'] || 0) + (h['19'] || 0) + (h['20'] || 0) + (h['21'] || 0) + (h['22'] || 0) + (h['23'] || 0);

      chartSlots = [
        { name: '00h - 06h (Đêm)', views: night },
        { name: '06h - 12h (Sáng)', views: morning },
        { name: '12h - 18h (Chiều)', views: afternoon },
        { name: '18h - 24h (Tối)', views: evening },
      ];
    } else if (contentAnalyticsRange === 'week') {
      chartSlots = [];
      for (let i = 6; i >= 0; i--) {
        const { dateStr, displayDate } = getVnDateStringWithOffset(i);
        const dayV = dailyMap[dateStr] || 0;
        chartSlots.push({
          name: displayDate,
          views: dayV
        });
      }
    } else {
      chartSlots = [];
      const wVisits = [0, 0, 0, 0];
      for (let i = 0; i < 30; i++) {
        const { dateStr } = getVnDateStringWithOffset(i);
        const v = dailyMap[dateStr] || 0;
        if (i < 7) wVisits[3] += v;
        else if (i < 14) wVisits[2] += v;
        else if (i < 21) wVisits[1] += v;
        else wVisits[0] += v;
      }
      const weekLabels = ['Tuần 1 (1-7)', 'Tuần 2 (8-14)', 'Tuần 3 (15-21)', 'Tuần 4 (22-30)'];
      chartSlots = weekLabels.map((name, idx) => ({
        name,
        views: wVisits[idx]
      }));
    }

    // Top 10 by timeframe views
    const rankingList = rawList.slice(0, 10).map((item) => {
      const views = item.views;
      const sharePercent = totalTimeframeViews > 0 ? Math.round((views / totalTimeframeViews) * 100) : 0;
      return {
        ...item,
        views,
        sharePercent,
      };
    });

    return { chartData: chartSlots, rankingList, totalTimeframeViews, maxTimeframeViews };
  };

  const { chartData: contentChartData, rankingList: contentRankingList } = getContentAnalyticsData();
useEffect(() => {
    if (!isAdmin) return;

    // Real-time Top Subjects (Top 10)
    const unsubSubjects = onSnapshot(
      query(collection(db, 'analytics_subjects'), orderBy('views', 'desc'), limit(10)),
      (snapshot) => {
        setTopSubjects(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Error in real-time subjects subscription:", err)
    );

    // Real-time Top Documents (Top 10)
    const unsubDocs = onSnapshot(
      query(collection(db, 'analytics_documents'), orderBy('views', 'desc'), limit(10)),
      (snapshot) => {
        setTopDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Error in real-time docs subscription:", err)
    );

    // Real-time Daily visits
    const todayStr = getVietnamDateString();
    const unsubDaily = onSnapshot(
      doc(db, 'analytics', `daily_visits_${todayStr}`),
      (snap) => {
        if (snap.exists()) {
          setDailyVisits(snap.data().visits || 0);
        }
      },
      (err) => console.error("Error in real-time daily visits subscription:", err)
    );

    // Real-time Total visits
    const unsubTotal = onSnapshot(
      doc(db, 'analytics', 'total_visits'),
      (snap) => {
        if (snap.exists()) {
          setTotalVisits(snap.data().visits || 0);
        }
      },
      (err) => console.error("Error in real-time total visits subscription:", err)
    );

    const fetchHourlyAndDailyStats = async () => {
      try {
        const todayStr = getVietnamDateString();
        // 1. Fetch real 24 hours of today
        const hourlyPromises = [];
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0');
          hourlyPromises.push(getDoc(doc(db, 'analytics', `hourly_visits_${todayStr}_${hour}`)));
        }
        const hourlySnaps = await Promise.all(hourlyPromises);
        const hourlyMap: { [hour: string]: number } = {};
        hourlySnaps.forEach((snap, i) => {
          const hour = i.toString().padStart(2, '0');
          hourlyMap[hour] = snap.exists() ? (snap.data().visits || 0) : 0;
        });
        setTodayHourlyData(hourlyMap);

        // 2. Fetch real 30 days history
        const dailyPromises = [];
        const dates: string[] = [];
        for (let i = 0; i < 30; i++) {
          const { dateStr } = getVnDateStringWithOffset(i);
          dates.push(dateStr);
          dailyPromises.push(getDoc(doc(db, 'analytics', `daily_visits_${dateStr}`)));
        }
        const dailySnaps = await Promise.all(dailyPromises);
        const dailyMap: { [dateStr: string]: number } = {};
        dailySnaps.forEach((snap, i) => {
          dailyMap[dates[i]] = snap.exists() ? (snap.data().visits || 0) : 0;
        });
        setDailyVisitsHistory(dailyMap);
      } catch (err) {
        console.error("Error fetching hourly/daily analytics history:", err);
      }
    };

    fetchHourlyAndDailyStats();

    // Fetch timeframe stats (day, week, month) for ALL subjects and documents strictly using real data
    const fetchContentTimeframeStats = async () => {
      try {
        const todayStr = getVietnamDateString();

        // 1. Get all subjects
        const subjectsSnap = await getDocs(collection(db, 'analytics_subjects'));
        let subjectsList: { id: string; name: string; views: number }[] = [];
        if (!subjectsSnap.empty) {
          subjectsList = subjectsSnap.docs.map(d => ({ id: d.id, name: d.data().name || d.id, views: d.data().views || 0 }));
        } else {
          const rawSubSnap = await getDocs(collection(db, 'subjects'));
          subjectsList = rawSubSnap.docs.map(d => ({ id: d.id, name: d.data().name || d.id, views: 0 }));
        }

        // 2. Get all documents
        const docsSnap = await getDocs(collection(db, 'analytics_documents'));
        let docsList: { id: string; title: string; subjectName?: string; views: number }[] = [];
        if (!docsSnap.empty) {
          docsList = docsSnap.docs.map(d => ({
            id: d.id,
            title: d.data().title || d.id,
            subjectName: d.data().subjectName || '',
            views: d.data().views || 0
          }));
        }

        // 3. Process Subjects by timeframe
        const subDayItems: { id: string; name: string; views: number }[] = [];
        const subWeekItems: { id: string; name: string; views: number }[] = [];
        const subMonthItems: { id: string; name: string; views: number }[] = [];
        const subDailySumMap: Record<string, number> = {};
        const subHourlyMap: Record<string, number> = {};

        // Fetch subject hourly totals
        const subHourPromises = [];
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0');
          subHourPromises.push(getDoc(doc(db, 'analytics', `sub_hourly_${todayStr}_${hour}`)));
        }
        const subHourSnaps = await Promise.all(subHourPromises);
        subHourSnaps.forEach((snap, i) => {
          const hour = i.toString().padStart(2, '0');
          subHourlyMap[hour] = snap.exists() ? (snap.data().visits || 0) : 0;
        });
        setSubjectHourlyToday(subHourlyMap);

        await Promise.all(subjectsList.map(async (s) => {
          try {
            // Check today (sub_daily or sub_today)
            const todayDoc = await getDoc(doc(db, 'analytics', `sub_daily_${todayStr}_${s.id}`));
            let todayV = todayDoc.exists() ? (todayDoc.data().visits || 0) : 0;
            if (todayV === 0) {
              const legacyToday = await getDoc(doc(db, 'analytics', `sub_today_${todayStr}_${s.id}`));
              if (legacyToday.exists()) todayV = legacyToday.data().visits || 0;
            }

            // Check 30 days
            const dailyPromises = [];
            const dates: string[] = [];
            for (let i = 0; i < 30; i++) {
              const { dateStr } = getVnDateStringWithOffset(i);
              dates.push(dateStr);
              dailyPromises.push(getDoc(doc(db, 'analytics', `sub_daily_${dateStr}_${s.id}`)));
            }
            const dailySnaps = await Promise.all(dailyPromises);

            let weekV = todayV;
            let monthV = todayV;

            dailySnaps.forEach((snap, idx) => {
              const dateStr = dates[idx];
              const v = snap.exists() ? (snap.data().visits || 0) : 0;
              subDailySumMap[dateStr] = (subDailySumMap[dateStr] || 0) + v;
              if (idx < 7 && idx > 0) weekV += v;
              if (idx > 0) monthV += v;
            });

            subDayItems.push({ id: s.id, name: s.name, views: todayV });
            subWeekItems.push({ id: s.id, name: s.name, views: weekV });
            subMonthItems.push({ id: s.id, name: s.name, views: monthV });
          } catch (e) {
            console.error("Error processing subject timeframe:", e);
          }
        }));

        setSubjectDailyHistory(subDailySumMap);

        // 4. Process Documents by timeframe
        const docDayItems: { id: string; title: string; subjectName?: string; views: number }[] = [];
        const docWeekItems: { id: string; title: string; subjectName?: string; views: number }[] = [];
        const docMonthItems: { id: string; title: string; subjectName?: string; views: number }[] = [];
        const docDailySumMap: Record<string, number> = {};
        const docHourlyMap: Record<string, number> = {};

        // Fetch doc hourly totals
        const docHourPromises = [];
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0');
          docHourPromises.push(getDoc(doc(db, 'analytics', `doc_hourly_${todayStr}_${hour}`)));
        }
        const docHourSnaps = await Promise.all(docHourPromises);
        docHourSnaps.forEach((snap, i) => {
          const hour = i.toString().padStart(2, '0');
          docHourlyMap[hour] = snap.exists() ? (snap.data().visits || 0) : 0;
        });
        setDocHourlyToday(docHourlyMap);

        await Promise.all(docsList.map(async (d) => {
          try {
            const docKey = (d.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || d.id;
            
            // Check today
            const todayDoc = await getDoc(doc(db, 'analytics', `doc_daily_${todayStr}_${docKey}`));
            let todayV = todayDoc.exists() ? (todayDoc.data().visits || 0) : 0;
            if (todayV === 0) {
              const legacyDoc = await getDoc(doc(db, 'analytics', `doc_today_${todayStr}_${docKey}`));
              if (legacyDoc.exists()) todayV = legacyDoc.data().visits || 0;
            }

            // Check 30 days
            const dailyPromises = [];
            const dates: string[] = [];
            for (let i = 0; i < 30; i++) {
              const { dateStr } = getVnDateStringWithOffset(i);
              dates.push(dateStr);
              dailyPromises.push(getDoc(doc(db, 'analytics', `doc_daily_${dateStr}_${docKey}`)));
            }
            const dailySnaps = await Promise.all(dailyPromises);

            let weekV = todayV;
            let monthV = todayV;

            dailySnaps.forEach((snap, idx) => {
              const dateStr = dates[idx];
              const v = snap.exists() ? (snap.data().visits || 0) : 0;
              docDailySumMap[dateStr] = (docDailySumMap[dateStr] || 0) + v;
              if (idx < 7 && idx > 0) weekV += v;
              if (idx > 0) monthV += v;
            });

            docDayItems.push({ id: d.id, title: d.title, subjectName: d.subjectName, views: todayV });
            docWeekItems.push({ id: d.id, title: d.title, subjectName: d.subjectName, views: weekV });
            docMonthItems.push({ id: d.id, title: d.title, subjectName: d.subjectName, views: monthV });
          } catch (e) {
            console.error("Error processing doc timeframe:", e);
          }
        }));

        setDocDailyHistory(docDailySumMap);

        // Sort each timeframe list descending by views
        subDayItems.sort((a, b) => b.views - a.views);
        subWeekItems.sort((a, b) => b.views - a.views);
        subMonthItems.sort((a, b) => b.views - a.views);

        docDayItems.sort((a, b) => b.views - a.views);
        docWeekItems.sort((a, b) => b.views - a.views);
        docMonthItems.sort((a, b) => b.views - a.views);

        setTimeframeContentStats({
          day: { subjects: subDayItems, docs: docDayItems },
          week: { subjects: subWeekItems, docs: docWeekItems },
          month: { subjects: subMonthItems, docs: docMonthItems },
        });

      } catch (err) {
        console.error("Error fetching content timeframe stats:", err);
      }
    };

    fetchContentTimeframeStats();

    const fetchAnalytics = async () => {
      // System Updates (Admin activities)
      try {
        const activitiesQuery = query(collection(db, 'system_updates'), orderBy('timestamp', 'desc'), limit(15));
        const activitiesSnap = await getDocs(activitiesQuery);
        const fetchedActivities = activitiesSnap.docs.map((d) => {
          const data = d.data();
          let tsString = '';
          if (data.timestamp?.toDate) {
             const t = data.timestamp.toDate();
             tsString = `${t.toLocaleDateString('vi-VN')} ${t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
          } else {
             tsString = 'Vừa xong';
          }
          
          let userName = data.adminEmail?.split('@')[0] || 'Admin';

          return { id: d.id, ...data, timestampStr: tsString, userName };
        });
        setSystemActivities(fetchedActivities);
      } catch (err) {
        console.error("Error fetching system updates:", err);
      }

      // Users Data
      let currentUsersSnap: any = null;
      try {
        currentUsersSnap = await getDocs(collection(db, 'users'));
        setTotalUsers(currentUsersSnap.size);
        setUsersCache(currentUsersSnap);
      } catch (err) {
         console.error("Error fetching users:", err);
      }

      // System resources (Documents & Quizzes)
      try {
        const docCount = await getCountFromServer(collection(db, 'documents'));
        const quizCount = await getCountFromServer(collection(db, 'quizzes'));
        setSystemResources({
          documents: docCount.data().count,
          quizzes: quizCount.data().count
        });
      } catch (err) {
         console.error("Error fetching system resources:", err);
      }

      // Error Logs
      try {
        const errorLogsQuery = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(15));
        const errorLogsSnap = await getDocs(errorLogsQuery);
        const fetchedLogs = errorLogsSnap.docs.map(d => {
          const data = d.data();
          let tsString = '';
          if (data.timestamp?.toDate) {
            tsString = data.timestamp.toDate().toLocaleString('vi-VN');
          } else {
            tsString = new Date().toLocaleString('vi-VN');
          }
          return { id: d.id, ...data, timestamp: tsString } as ErrorLog;
        });
        setErrorLogs(fetchedLogs);
      } catch (err) {
         console.error("Error fetching error logs:", err);
      }
    };

    fetchAnalytics();

    return () => {
      unsubSubjects();
      unsubDocs();
      unsubDaily();
      unsubTotal();
    };
  }, [isAdmin]);

  // Chart Generation Effect
  useEffect(() => {
    if (!isAdmin) return;

    const qReports = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(docs);
    });

    return () => {
      unsubscribeReports();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    
    const generateChartData = async () => {
      setIsChartLoading(true);
      try {
        const data = [];
        const retData = [];
        const now = new Date();
        const todayStr = getVietnamDateString();
        
        // 1. Preprocess users for fast lookup
        const userStats: Record<string, { new: number, returning: number }> = {};
        
        if (usersCache) {
           usersCache.forEach((userDoc: any) => {
             const uData = userDoc.data();
             if (uData.createdAt && uData.lastLoginAt) {
                 const createdIso = uData.createdAt; // e.g. 2023-10-01T12:00:00.000Z
                 const loginIso = uData.lastLoginAt; 
                 
                 if (chartRange === 1) {
                    // Group by hour for today
                    if (createdIso.startsWith(todayStr)) {
                       const h = createdIso.slice(11, 13);
                       if (!userStats[h]) userStats[h] = { new: 0, returning: 0 };
                       userStats[h].new++;
                    }
                    if (loginIso.startsWith(todayStr) && createdIso.split('T')[0] !== loginIso.split('T')[0]) {
                       const h = loginIso.slice(11, 13);
                       if (!userStats[h]) userStats[h] = { new: 0, returning: 0 };
                       userStats[h].returning++;
                    }
                 } else if (chartRange >= 180) {
                    // Group by month YYYY-MM
                    const createMonth = createdIso.slice(0, 7);
                    const loginMonth = loginIso.slice(0, 7);
                    if (!userStats[createMonth]) userStats[createMonth] = { new: 0, returning: 0 };
                    userStats[createMonth].new++;
                    
                    if (createMonth !== loginMonth) {
                       if (!userStats[loginMonth]) userStats[loginMonth] = { new: 0, returning: 0 };
                       userStats[loginMonth].returning++;
                    }
                 } else {
                    // Group by day YYYY-MM-DD
                    const createDay = createdIso.split('T')[0];
                    const loginDay = loginIso.split('T')[0];
                    if (!userStats[createDay]) userStats[createDay] = { new: 0, returning: 0 };
                    userStats[createDay].new++;
                    
                    if (createDay !== loginDay) {
                       if (!userStats[loginDay]) userStats[loginDay] = { new: 0, returning: 0 };
                       userStats[loginDay].returning++;
                    }
                 }
             }
           });
        }

        // 2. Fetch visits
        if (chartRange === 1) {
            // Fetch hourly for today
            const fetchPromises = [];
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0');
                const ref = doc(db, 'analytics', `hourly_visits_${todayStr}_${hour}`);
                fetchPromises.push(getDoc(ref));
            }
            const visitsSnaps = await Promise.all(fetchPromises);
            
            for (let i = 0; i < 24; i++) {
               const hour = i.toString().padStart(2, '0');
               const snap = visitsSnaps[i];
               
               data.push({
                 name: `${hour}:00`,
                 visits: snap.exists() ? snap.data().visits : 0
               });
               
               retData.push({
                 day: `${hour}:00`,
                 newUsers: userStats[hour]?.new || 0,
                 returningUsers: userStats[hour]?.returning || 0
               });
            }
        } else if (chartRange >= 180) {
            // Aggregate by month
            const monthsToFetch = chartRange === 180 ? 6 : 12;
            const visitAgg: Record<string, number> = {};
            
            // To be accurate with visits without storing monthly aggregates, we'd need to fetch all daily visits for the range.
            // Since max range is 365 days, we can do 365 concurrent reads (Firestore supports this, but it's a bit heavy).
            // A better way is to do chunked or just use the current month for now. Let's just fetch all daily for the range and aggregate.
            const fetchPromises = [];
            const dates = [];
            for (let i = chartRange - 1; i >= 0; i--) {
               const vnDate = getVnDateStringWithOffset(i);
               dates.push(vnDate);
               const ref = doc(db, 'analytics', `daily_visits_${vnDate.dateStr}`);
               fetchPromises.push(getDoc(ref));
            }
            
            // Chunk promises if needed, but 365 should be okay for a lightweight admin dashboard
            const visitSnaps = await Promise.all(fetchPromises);
            
            visitSnaps.forEach((snap, idx) => {
               if (snap.exists()) {
                   const d = dates[idx];
                   const monthStr = d.monthStr;
                   visitAgg[monthStr] = (visitAgg[monthStr] || 0) + snap.data().visits;
               }
            });
            
            // Reconstruct timeline array (months)
            for (let i = monthsToFetch - 1; i >= 0; i--) {
               const d = new Date();
               const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
               vnTime.setUTCMonth(vnTime.getUTCMonth() - i);
               const y = vnTime.getUTCFullYear();
               const mStr = `${y}-${String(vnTime.getUTCMonth() + 1).padStart(2, '0')}`;
               const displayDate = `Tháng ${vnTime.getUTCMonth() + 1}/${String(y).slice(2)}`;
               
               data.push({
                 name: displayDate,
                 visits: visitAgg[mStr] || 0
               });
               
               retData.push({
                 day: displayDate,
                 newUsers: userStats[mStr]?.new || 0,
                 returningUsers: userStats[mStr]?.returning || 0
               });
            }
            
        } else {
            // Daily aggregation (7 or 30 days)
            const fetchPromises = [];
            const dates = [];
            for (let i = chartRange - 1; i >= 0; i--) {
              const vnDate = getVnDateStringWithOffset(i);
              dates.push(vnDate);
              const ref = doc(db, 'analytics', `daily_visits_${vnDate.dateStr}`);
              fetchPromises.push(getDoc(ref));
            }

            const visitSnaps = await Promise.all(fetchPromises);

            for (let i = 0; i < chartRange; i++) {
              const date = dates[i];
              const dateStr = date.dateStr;
              const snap = visitSnaps[i];
              
              const displayDate = date.displayDate;
              
              data.push({
                name: displayDate,
                visits: snap.exists() ? snap.data().visits : 0
              });

              retData.push({
                day: displayDate,
                newUsers: userStats[dateStr]?.new || 0,
                returningUsers: userStats[dateStr]?.returning || 0
              });
            }
        }
        
        setChartData(data);
        setRetentionData(retData);
      } catch (err) {
         console.error("Error fetching chart data:", err);
      } finally {
         setIsChartLoading(false);
      }
    };

    generateChartData();
  }, [isAdmin, chartRange, usersCache]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const handleResolveReport = async (reportId: string) => {
    if (!window.confirm("Đánh dấu báo cáo này là đã xử lý và xóa khỏi danh sách?")) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      console.error("Error resolving report:", error);
      alert('Có lỗi xảy ra khi xử lý báo cáo.');
    }
  };

  const handleSendReply = async () => {
    if (!replyingToReport || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: `Phản hồi từ Admin về báo cáo tài liệu`,
        message: replyMessage.trim(),
        link: `/subject/${replyingToReport.subjectId}`,
        targetUserId: replyingToReport.userId,
        createdAt: serverTimestamp(),
      });
      alert('Đã gửi thông báo cho người dùng thành công.');
      setReplyingToReport(null);
      setReplyMessage('');
    } catch (error) {
      console.error("Error sending reply:", error);
      alert('Có lỗi xảy ra khi gửi thông báo.');
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 pt-1 sm:pt-2 pb-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        
        {/* Sidebar - sticky on desktop with independent scroll */}
        <div className="w-full md:w-64 flex-shrink-0 md:sticky md:top-16 md:self-start z-10">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-4 max-h-[calc(100vh-5rem)] overflow-y-auto hidden-scrollbar">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 px-2">Dashboard Quản trị</h2>
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
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Người dùng</p>
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
                Quản lý Users
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
                Danh sách Admin
              </button>
              
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoạt động & Dữ liệu</p>
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
                Lịch sử hệ thống
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
                Reports
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
                Tài nguyên hệ thống
              </button>

              <button
                onClick={() => setActiveTab('hidden_docs')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'hidden_docs' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <EyeOff className="w-5 h-5" />
                Tài liệu ẩn
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
                Tỷ lệ người dùng
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
                Lỗi hệ thống
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
                Quản lý giao diện
              </button>

              <button
                onClick={() => setActiveTab('ecosystem')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'ecosystem' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Globe className="w-5 h-5" />
                Hệ sinh thái
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6 pb-8">
          
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                     <BarChart3 className="w-5 h-5" />
                     <h3 className="font-medium">Lượt truy cập hôm nay</h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-blue-600">{dailyVisits}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                     <BarChart3 className="w-5 h-5" />
                     <h3 className="font-medium">Tổng lượt truy cập</h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white">{totalVisits}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                     <Users className="w-5 h-5" />
                     <h3 className="font-medium">Tổng tài khoản</h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white">{totalUsers}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                   <h3 className="text-lg font-bold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" /> Thống kê truy cập
                   </h3>
                   <select 
                      value={chartRange}
                      onChange={(e) => setChartRange(Number(e.target.value))}
                      disabled={isChartLoading}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer disabled:opacity-50"
                   >
                     <option value={1}>1 ngày qua</option>
                     <option value={7}>7 ngày qua</option>
                     <option value={30}>1 tháng qua</option>
                     <option value={180}>6 tháng qua</option>
                     <option value={365}>1 năm qua</option>
                   </select>
                 </div>
                 <div className="h-72 relative">
                    {isChartLoading && (
                      <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                           dataKey="name" 
                           stroke="#888888" 
                           fontSize={12} 
                           tickLine={false} 
                           axisLine={false} 
                           minTickGap={20}
                        />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                        />
                        <Area type="monotone" dataKey="visits" name="Lượt truy cập" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Interactive Subject & Document Content Analytics Section */}
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                {/* Header with Title, Tab Switcher, and Timeframe Select */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Phân tích Môn học & Tài liệu
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold">
                          {contentAnalyticsTab === 'subjects' ? `${topSubjects.length} Môn quan tâm` : `${topDocs.length} Tài liệu xem nhiều`}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi mức độ truy cập và xu hướng theo từng khoảng thời gian
                      </p>
                    </div>
                  </div>

                  {/* Controls: 2 Tabs & Range Selector */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* 2 Tabs */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
                      <button
                        onClick={() => setContentAnalyticsTab('subjects')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                          contentAnalyticsTab === 'subjects'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" /> Theo môn học
                      </button>
                      <button
                        onClick={() => setContentAnalyticsTab('documents')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                          contentAnalyticsTab === 'documents'
                            ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-4 h-4" /> Theo tài liệu
                      </button>
                    </div>

                    {/* Timeframe selector */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setContentAnalyticsRange('day')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          contentAnalyticsRange === 'day'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Hôm nay (Khoảng giờ)
                      </button>
                      <button
                        onClick={() => setContentAnalyticsRange('week')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          contentAnalyticsRange === 'week'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        7 ngày qua (Theo ngày)
                      </button>
                      <button
                        onClick={() => setContentAnalyticsRange('month')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          contentAnalyticsRange === 'month'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        30 ngày qua (Theo tuần)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart & Ranked Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Visual Distribution Chart */}
                  <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        {contentAnalyticsRange === 'day' && 'Phân bổ lượt xem theo khoảng giờ (Hôm nay)'}
                        {contentAnalyticsRange === 'week' && 'Phân bổ lượt xem 7 ngày qua (Theo ngày)'}
                        {contentAnalyticsRange === 'month' && 'Phân bổ lượt xem 30 ngày qua (Theo tuần)'}
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        {contentAnalyticsTab === 'subjects' ? 'Môn học' : 'Tài liệu'}
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={contentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.15)', background: '#1e293b', color: '#fff' }}
                            labelStyle={{ fontWeight: 'bold', color: '#93c5fd' }}
                          />
                          <Bar
                            dataKey="views"
                            name="Lượt xem"
                            fill={contentAnalyticsTab === 'subjects' ? '#3b82f6' : '#8b5cf6'}
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                    {/* Top List with Progress Bars & Badges */}
                    <div className="lg:col-span-6 space-y-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          Bảng xếp hạng {contentAnalyticsTab === 'subjects' ? 'Môn học' : 'Tài liệu'} xem nhiều ({contentAnalyticsRange === 'day' ? 'Hôm nay' : contentAnalyticsRange === 'week' ? '7 ngày qua' : '30 ngày qua'})
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {contentAnalyticsRange === 'day' ? 'Hôm nay' : contentAnalyticsRange === 'week' ? '7 ngày qua' : '30 ngày qua'}
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {contentRankingList.length > 0 ? (
                          contentRankingList.map((item, idx) => {
                            const maxViews = contentRankingList[0]?.views || 1;
                            const progressPercent = Math.min(100, Math.round((item.views / maxViews) * 100));
                            const isTop1 = idx === 0;
                            const isTop2 = idx === 1;
                            const isTop3 = idx === 2;

                            return (
                              <div
                                key={item.id || idx}
                                className={`p-3 rounded-xl border transition-all ${
                                  isTop1
                                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800/60'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isTop1 ? 'bg-amber-500 text-white shadow-xs' :
                                      isTop2 ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white' :
                                      isTop3 ? 'bg-amber-700/80 text-white' :
                                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold truncate text-slate-900 dark:text-slate-100" title={item.name || item.title}>
                                          {item.name || item.title}
                                        </span>
                                        {isTop1 && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                                            <Flame className="w-3 h-3 fill-current text-amber-500" /> Hot #1
                                          </span>
                                        )}
                                      </div>
                                      {item.subjectName && (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                          Môn: {item.subjectName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {item.views}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-1">
                                      {contentAnalyticsRange === 'day' ? 'lượt hôm nay' : contentAnalyticsRange === 'week' ? 'lượt / 7 ngày' : 'lượt / 30 ngày'}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress bar and peak info */}
                                <div className="space-y-1 mt-2">
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        contentAnalyticsTab === 'subjects'
                                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                      }`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                                    <span>Tỷ trọng: ~{item.sharePercent}% {contentAnalyticsRange === 'day' ? 'trong ngày' : contentAnalyticsRange === 'week' ? 'trong tuần' : 'trong tháng'}</span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">
                                      {item.views > 0 ? (isTop1 ? 'Xem nhiều nhất' : `Hạng #${idx + 1}`) : 'Chưa có lượt xem'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                        <div className="py-8 text-center text-slate-400 text-sm">Chưa có dữ liệu thống kê</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lists: TOP Môn học & TOP Tài liệu */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                {/* TOP 10 Môn học */}
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 sm:p-6 overflow-hidden flex flex-col justify-between">
                   <div>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                          <BarChart3 className="w-5 h-5 text-blue-500 shrink-0" /> TOP Môn học được quan tâm
                       </h3>
                       <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                         Top 10
                       </span>
                     </div>
                     <div className="space-y-2.5">
                       {topSubjects.length > 0 ? topSubjects.slice(0, 10).map((s, idx) => (
                         <div 
                           key={s.id || idx} 
                           className="h-[56px] flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                         >
                            <div className="font-medium flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2 sm:pr-3">
                               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                 {idx + 1}
                                </span>
                               <div className="min-w-0">
                                 <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight" title={s.name}>
                                   {s.name}
                                 </p>
                                 <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                   Môn học trực tuyến
                                 </p>
                               </div>
                            </div>
                            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap shrink-0">
                              {s.views || 0} lượt
                            </span>
                         </div>
                       )) : (
                          <p className="text-slate-500 italic py-4 text-center">Chưa có dữ liệu</p>
                       )}
                     </div>
                   </div>
                </div>

                {/* TOP 10 Tài liệu */}
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 sm:p-6 overflow-hidden flex flex-col justify-between">
                   <div>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                          <BarChart3 className="w-5 h-5 text-purple-500 shrink-0" /> TOP Tài liệu xem nhiều nhất
                       </h3>
                       <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold">
                         Top 10
                       </span>
                     </div>
                     <div className="space-y-2.5">
                       {topDocs.length > 0 ? topDocs.slice(0, 10).map((d, idx) => (
                         <div 
                           key={d.id || idx} 
                           className="h-[56px] flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                         >
                            <div className="font-medium flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2 sm:pr-3">
                               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-bold shrink-0">
                                 {idx + 1}
                               </span>
                               <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight" title={d.title}>
                                    {d.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5" title={`Môn: ${d.subjectName || 'Tài liệu chung'}`}>
                                    Môn: {d.subjectName || 'Tài liệu chung'}
                                  </p>
                               </div>
                            </div>
                            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap shrink-0">
                              {d.views || 0} lượt
                            </span>
                         </div>
                       )) : (
                          <p className="text-slate-500 italic py-4 text-center">Chưa có dữ liệu</p>
                       )}
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Lịch sử cập nhật hệ thống</h2>
                  <p className="text-sm text-slate-500">Theo dõi các thay đổi tài liệu, môn học, bài viết bởi Admin.</p>
                </div>
              </div>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {systemActivities.length === 0 ? (
                  <p className="text-center text-slate-500 italic relative z-10 bg-white dark:bg-slate-900 py-4">Chưa có hoạt động cập nhật nào.</p>
                ) : (
                  systemActivities.map((activity, index) => (
                  <div key={activity.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {activity.action === 'Tạo mới' ? <CheckCircle2 className="w-4 h-4" /> : activity.action === 'Xóa' ? <X className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{activity.action} {activity.entity}</span>
                        <span className="text-xs font-medium text-slate-500 shrink-0">{activity.timestampStr}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">Bởi: {activity.userName} ({activity.adminEmail})</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{activity.details}</p>
                    </div>
                  </div>
                  ))
                )}
              </div>
              
              <div className="mt-8 text-center text-sm text-slate-500 italic">
                *Chỉ hiển thị 15 hoạt động cập nhật gần nhất.
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Quản lý Báo cáo / Nội dung</h2>
                  <p className="text-sm text-slate-500">Kiểm duyệt các tệp tải lên hoặc báo cáo người dùng.</p>
                </div>
              </div>
              
              {reports.length === 0 ? (
                <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 p-6 sm:p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3 opacity-50" />
                  <h3 className="font-bold text-lg mb-2">Chưa có báo cáo nào</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm">
                    Hiện tại không có báo cáo lỗi tài liệu nào cần xử lý.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <h4 className="font-bold text-base sm:text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" /> Báo cáo lỗi tài liệu
                          </h4>
                          <p className="text-sm font-medium truncate">
                            <span className="text-slate-500 dark:text-slate-400">Tài liệu:</span>{' '}
                            <Link to={`/subject/${report.subjectId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {report.documentTitle}
                            </Link>
                          </p>
                          <p className="text-sm font-medium">
                            <span className="text-slate-500 dark:text-slate-400">Môn học:</span> {report.subjectName}
                          </p>
                          <p className="text-sm font-medium">
                            <span className="text-slate-500 dark:text-slate-400">Người báo cáo:</span> {report.userEmail}
                          </p>
                          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm mt-2">
                            <span className="font-semibold block mb-1">Chi tiết lỗi:</span>
                            {report.reason}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {report.createdAt && typeof report.createdAt.toDate === 'function' ? report.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2 sm:gap-3">
                          <button
                            onClick={() => setReplyingToReport(report)}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-4 h-4" /> Phản hồi
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Đã xử lý
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Giám sát Tài nguyên Hệ thống</h2>
                  <p className="text-sm text-slate-500">Thống kê số lượng bộ dữ liệu thực tế đang tồn tại trên Firestore.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 text-center">
                  <h3 className="text-sm font-semibold text-slate-500 mb-1">Tài liệu học tập</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mt-2">{systemResources.documents} <span className="text-base text-slate-400 font-normal">Tệp</span></p>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 text-center">
                  <h3 className="text-sm font-semibold text-slate-500 mb-1">Bộ đề trắc nghiệm (Quiz)</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mt-2">{systemResources.quizzes} <span className="text-base text-slate-400 font-normal">Đề thi</span></p>
                </div>
              </div>
              <div className="mt-6 text-center text-xs sm:text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Thông tin kỹ thuật:</span> Dữ liệu được đo đếm trực tiếp từ các bộ sưu tập Firestore (documents, quizzes). Đối với dung lượng bộ nhớ thực tế (Cloud Storage cho PDF/JPEG), Firebase Client SDK không cung cấp phương thức đọc tổng dung lượng. Để đọc dung lượng Storage, hệ thống sẽ cần tích hợp Firebase Admin SDK hoặc Cloud Functions (mở rộng sau).
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <LineChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     Tỷ lệ Người dùng quay lại (Retention)
                     <select 
                      value={chartRange}
                      onChange={(e) => setChartRange(Number(e.target.value))}
                      disabled={isChartLoading}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer disabled:opacity-50"
                     >
                       <option value={1}>1 ngày qua</option>
                       <option value={7}>7 ngày qua</option>
                       <option value={30}>1 tháng qua</option>
                       <option value={180}>6 tháng qua</option>
                       <option value={365}>1 năm qua</option>
                     </select>
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">So sánh số lượng người dùng mới (đăng ký mới) và người dùng cũ quay lại theo thời gian thực.</p>
                </div>
              </div>
              
              <div className="h-80 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-4 relative">
                 {isChartLoading && (
                   <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center backdrop-blur-sm">
                     <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                 )}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={retentionData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
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
                  *Biểu đồ hiển thị dữ liệu thật về lượt đăng ký mới & đăng nhập (active) từ Firebase (`users` collection).
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
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
                      <th className="px-3 sm:px-4 py-3">Thời gian</th>
                      <th className="px-3 sm:px-4 py-3">Phân hệ</th>
                      <th className="px-3 sm:px-4 py-3">Ngữ cảnh lỗi</th>
                      <th className="px-3 sm:px-4 py-3">Mức độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {errorLogs.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">Chưa ghi nhận lỗi hệ thống nào.</td></tr>
                    ) : errorLogs.map((log) => {
                      const { module, context } = getFriendlyErrorContext(log);
                      return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedErrorLog(log)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="px-3 sm:px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                           <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs">{module}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-900 dark:text-white font-medium">{context}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            log.severity === 'Nghiêm trọng' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                              : log.severity === 'Cảnh báo'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <UserManagerModal inline />
            </div>
          )}

          
          {activeTab === 'hidden_docs' && (
            <HiddenDocsManager />
          )}

          {activeTab === 'admins' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <AdminManagerModal inline />
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <HeroImageManagerModal inline />
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <EcosystemManagerModal inline />
          )}

        </div>
      </div>
      
      {/* Error Log Detail Modal */}
      {selectedErrorLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertOctagon className={`w-6 h-6 ${
                  selectedErrorLog.severity === 'Nghiêm trọng' ? 'text-red-500' :
                  selectedErrorLog.severity === 'Cảnh báo' ? 'text-orange-500' : 'text-yellow-500'
                }`} />
                Chi tiết lỗi
              </h3>
              <button 
                onClick={() => setSelectedErrorLog(null)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    selectedErrorLog.severity === 'Nghiêm trọng' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50' : 
                    selectedErrorLog.severity === 'Cảnh báo' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50'
                  }`}>
                    Mức độ: {selectedErrorLog.severity}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Phân hệ: {getFriendlyErrorContext(selectedErrorLog).module}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold mb-1">{getFriendlyErrorContext(selectedErrorLog).context}</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">{selectedErrorLog.type}</p>
                
                <p className="font-mono text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                  {selectedErrorLog.message}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Clock className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Thời gian ghi nhận</h5>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedErrorLog.timestamp}</p>
                  </div>
                </div>

                {selectedErrorLog.user && (
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <UserIcon className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Người dùng ảnh hưởng</h5>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedErrorLog.user}</p>
                      </div>
                    </div>
                )}
                
                {selectedErrorLog.location && (
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vị trí phát sinh</h5>
                        <p className="text-slate-700 dark:text-slate-300 font-mono text-sm">{selectedErrorLog.location}</p>
                      </div>
                    </div>
                )}
              </div>

              {selectedErrorLog.details && (
                <div>
                    <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <FileText className="w-4 h-4" />
                        Mô tả chi tiết & Phân tích
                    </h5>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedErrorLog.details}
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Reply Modal */}
      {replyingToReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" /> Phản hồi báo cáo
              </h3>
              <button
                onClick={() => {
                  setReplyingToReport(null);
                  setReplyMessage('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Đang phản hồi cho:</p>
                <p className="font-medium text-slate-900 dark:text-slate-200">{replyingToReport.userEmail}</p>
                <p className="text-sm text-slate-500 mt-2 truncate">Tài liệu: {replyingToReport.documentTitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung tin nhắn
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi (ví dụ: Cảm ơn bạn, chúng tôi đã khắc phục lỗi này...)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setReplyingToReport(null);
                  setReplyMessage('');
                }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || isSendingReply}
                className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isSendingReply ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
