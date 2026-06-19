import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { collection, addDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logGlobalPageView, logSubjectView, logDocumentView } from './services/analyticsService';

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

// Hàm log riêng cho việc xem tài liệu để gom nhóm chung theo môn học trong ngày
export async function logSubjectDocumentView(userUid: string | undefined, subjectId: string, subjectName: string, docTitle: string, path: string = '') {
  if (!userUid || !subjectId) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const actDocId = `doc_view_${subjectId}_${today}`;
    const activityRef = doc(db, 'users', userUid, 'activities', actDocId);
    
    // Log document globally
    logDocumentView(docTitle, subjectName);

    const docSnap = await getDoc(activityRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const existingDocs: string[] = data.viewedDocs || [];
      if (!existingDocs.includes(docTitle)) {
         const newDocs = [...existingDocs, docTitle];
         await setDoc(activityRef, {
           viewedDocs: newDocs,
           action: `Xem ${newDocs.length} tài liệu`,
           details: `Môn: ${subjectName} (${newDocs.join(', ')})`,
           timestamp: Timestamp.now()
         }, { merge: true });
      } else {
         await setDoc(activityRef, { timestamp: Timestamp.now() }, { merge: true });
      }
    } else {
      await setDoc(activityRef, {
        type: 'document_view',
        action: 'Xem 1 tài liệu',
        details: `Môn: ${subjectName} (${docTitle})`,
        viewedDocs: [docTitle],
        path,
        timestamp: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Failed to log document view activity:", error);
  }
}

export function useActivityLogger() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("ActivityTracker route change:", location.pathname, user?.uid);
    if (!user || !user.uid) return;
    if (lastPathRef.current === location.pathname) return;

    lastPathRef.current = location.pathname;
    logGlobalPageView(); // Log global visit

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
              const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
              if (subjectDoc.exists()) {
                detailStr = subjectDoc.data().name;
                logSubjectView(subjectId, detailStr); // Log global subject view
              } else {
                detailStr = `Môn học (ID: ${subjectId})`;
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

