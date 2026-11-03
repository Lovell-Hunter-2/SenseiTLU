import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { collection, addDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logGlobalPageView, logSubjectView, logDocumentView, updatePresence } from './services/analyticsService';
import { getCachedData } from './services/cacheService';

const routeNames: Record<string, string> = {
  '/': 'Trang chủ',
  '/about': 'Về chúng tôi & Tính năng',
  '/contribute': 'Đóng góp tài liệu',
  '/privacy': 'Chính sách bảo mật',
  '/terms': 'Điều khoản dịch vụ',
  '/workspace': 'Không gian học tập (Study Space)',
  '/blog': 'Blog / Thảo luận',
};

// Hàm tiện ích để log các sự kiện tùy chỉnh (bấm nút, bắt đầu làm bài, v.v.)
export async function logActivityEvent(userUid: string | undefined, action: string, details: string, path: string = '') {
  if (!userUid) return;
  try {
    await addDoc(collection(db, 'users', userUid, 'activities'), {
      type: 'custom_event',
      action,
      details,
      path,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error("Failed to log custom activity:", error);
  }
}

// Hàm log riêng cho việc xem tài liệu để gom nhóm chung theo môn học trong ngày (0 Firestore reads!)
export async function logSubjectDocumentView(userUid: string | undefined, subjectId: string, subjectName: string, docTitle: string, path: string = '') {
  if (!userUid || !subjectId) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const actDocId = `doc_view_${subjectId}_${today}`;
    const activityRef = doc(db, 'users', userUid, 'activities', actDocId);
    
    // Log document globally (increment counter with session deduplication)
    logDocumentView(docTitle, subjectName);

    // Write with merge - ZERO document reads required!
    await setDoc(activityRef, {
      type: 'document_view',
      action: 'Xem tài liệu ôn thi',
      details: docTitle ? `Môn: ${subjectName} - ${docTitle}` : `Môn: ${subjectName}`,
      subjectId,
      docTitle: docTitle || '',
      path,
      timestamp: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error("Failed to log document view activity:", error);
  }
}

// Phát hiện bot / crawler tự động (Googlebot, Bing, Baidu, Ahrefs, Semrush, ByteSpider, tool cào dữ liệu, v.v.)
export function isLikelyBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent || '';
  if (!ua) return true;
  return /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|slurp|duckduckbot|ahrefs|semrush|petalbot|bytespider|mj12bot|dotbot|rogerbot|exabot|facebookexternalhit|feedfetcher|lighthouse|headlesschrome/i.test(ua);
}

export function useActivityLogger() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Không ghi log nếu là bot / crawler tự động để tránh spam Firestore
    if (isLikelyBot()) return;

    // Chỉ đếm 1 truy cập mỗi lần người dùng thật mở trang (đã deduplicate 30 phút theo session)
    logGlobalPageView();
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !user.uid) return;
    if (lastPathRef.current === location.pathname) return;

    lastPathRef.current = location.pathname;

    // Chỉ log các hoạt động học tập có giá trị (Xem môn, Thi thử, Workspace, Đóng góp, Blog)
    // Bỏ qua các trang tĩnh không cần thiết (Trang chủ, Về chúng tôi, Chính sách) để tiết kiệm 100% quota ghi
    const isStudyRoute = location.pathname.startsWith('/subject/') || 
                         location.pathname.startsWith('/workspace') || 
                         location.pathname.startsWith('/blog') || 
                         location.pathname.startsWith('/contribute');
    if (!isStudyRoute) return;

    const logActivity = async () => {
      try {
        let actionStr = 'Hoạt động học tập';
        let detailStr = location.pathname;

        if (routeNames[location.pathname]) {
          detailStr = routeNames[location.pathname];
        } else if (location.pathname.startsWith('/subject/')) {
          actionStr = 'Xem môn học';
          const parts = location.pathname.split('/');
          const subjectId = parts[2]; // /subject/ID
          
          if (parts.includes('mock-exam')) {
             actionStr = 'Vào chế độ Thi thử';
          }

          if (subjectId) {
            try {
              // 1. Check direct subject cache
              const cachedSub = getCachedData<any>(`subject_${subjectId}`);
              if (cachedSub && cachedSub.name) {
                detailStr = cachedSub.name;
                logSubjectView(subjectId, detailStr);
              } else {
                // 2. Check full subjects list cache
                const allSubs = getCachedData<any[]>('home_subjects_list_v2');
                const found = allSubs?.find(s => s.id === subjectId);
                if (found && found.name) {
                  detailStr = found.name;
                  logSubjectView(subjectId, detailStr);
                } else {
                  // 3. Fallback to localStorage legacy list
                  let foundInLocal = false;
                  try {
                    const localRaw = localStorage.getItem('sensei_cached_subjects');
                    if (localRaw) {
                      const list = JSON.parse(localRaw);
                      const m = list.find((s: any) => s.id === subjectId);
                      if (m && m.name) {
                        detailStr = m.name;
                        logSubjectView(subjectId, detailStr);
                        foundInLocal = true;
                      }
                    }
                  } catch (e) {}

                  if (!foundInLocal) {
                    detailStr = `Môn học (ID: ${subjectId})`;
                  }
                }
              }
            } catch (e) {
               detailStr = `Môn học (ID: ${subjectId})`;
            }
          }
        }

        // Chống spam ghi hoạt động trùng lặp trong cùng 1 phiên:
        // Nếu người dùng lướt qua lại cùng 1 môn hoặc 1 trang trong vòng 10 phút, không ghi thêm dòng log thừa
        const sessionActKey = `sensei_act_${user.uid}_${location.pathname}`;
        const lastActTime = sessionStorage.getItem(sessionActKey);
        const now = Date.now();
        if (lastActTime && now - Number(lastActTime) < 10 * 60 * 1000) {
          return;
        }
        sessionStorage.setItem(sessionActKey, String(now));

        await addDoc(collection(db, 'users', user.uid, 'activities'), {
          type: 'page_view',
          action: actionStr,
          details: detailStr,
          path: location.pathname,
          timestamp: Timestamp.now()
        });
      } catch (error: any) {
        console.error("Failed to log activity:", error);
      }
    };

    logActivity();
  }, [location.pathname, user]);
}

