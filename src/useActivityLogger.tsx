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
    
    // Log document globally (increment counter)
    logDocumentView(docTitle, subjectName);

    // Write with merge - ZERO document reads required!
    await setDoc(activityRef, {
      type: 'document_view',
      action: 'Xem tài liệu ôn thi',
      details: `Môn: ${subjectName}`,
      subjectId,
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

    // Chỉ đếm 1 truy cập mỗi lần người dùng thật mở hoặc tải lại trang web
    logGlobalPageView();
    updatePresence(user?.uid);

    // Heartbeat chỉ gửi khi tab đang được người dùng xem (không gửi ngầm khi tab ẩn)
    // Tăng chu kỳ lên 3 phút thay vì 60s để giảm 66% số lượt ghi
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        updatePresence(user?.uid);
      }
    }, 180000);

    return () => clearInterval(interval);
  }, [user?.uid]);

  useEffect(() => {
    console.log("ActivityTracker route change:", location.pathname, user?.uid);
    if (!user || !user.uid) return;
    if (lastPathRef.current === location.pathname) return;

    lastPathRef.current = location.pathname;

    const logActivity = async () => {
      try {
        let actionStr = 'Truy cập tab';
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

