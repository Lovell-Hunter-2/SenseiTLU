import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

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

export function useActivityLogger() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
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
              const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
              if (subjectDoc.exists()) {
                detailStr = subjectDoc.data().name;
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
          timestamp: Timestamp.now() // Sử dụng Timestamp.now() để có thời gian local lập tức, tránh lỗi delay của serverTimestamp
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    };

    logActivity();
  }, [location.pathname, user]);
}

