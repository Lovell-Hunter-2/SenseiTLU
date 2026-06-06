import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, ChevronRight, Inbox, Plus, X } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: any;
}

export function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      
      setNotifications(docs);

      // Check unread count
      if (user) {
        const lastReadStr = localStorage.getItem(`lastReadNotif_${user.uid}`);
        const lastReadTime = lastReadStr ? parseInt(lastReadStr, 10) : 0;
        let unread = 0;
        for (const doc of docs) {
          if (doc.createdAt && typeof doc.createdAt.toMillis === 'function') {
            if (doc.createdAt.toMillis() > lastReadTime) {
              unread++;
            }
          } else if (!doc.createdAt) {
            // Pending local write
            unread++;
          }
        }
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && user) {
      // Mark as read immediately when opening
      localStorage.setItem(`lastReadNotif_${user.uid}`, Date.now().toString());
      setUnreadCount(0);
    }
  };

  const handleAddNotification = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      alert("Vui lòng điền đầy đủ Tiêu đề và Nội dung thông báo.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: newTitle.trim(),
        message: newMessage.trim(),
        link: newLink.trim(),
        createdAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewMessage('');
      setNewLink('');
    } catch (error: any) {
      console.error(error);
      alert('Có lỗi xảy ra khi tạo thông báo: ' + error?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative" ref={popoverRef}>
        <button
          onClick={handleOpen}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          title="Thông báo"
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Inbox className="w-5 h-5 text-blue-500" />
                Thông báo
              </h3>
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowAddModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Thêm
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                  <p>Không có thông báo nào.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="relative group">
                      {notif.link ? (
                        <Link 
                          to={notif.link} 
                          onClick={() => setIsOpen(false)}
                          className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                        >
                          <NotifContent notif={notif} />
                        </Link>
                      ) : (
                        <div className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                          <NotifContent notif={notif} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Notification Modal */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Thêm thông báo mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Đóng"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề (*)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Tiêu đề thông báo..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung (*)</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nội dung chi tiết..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link chuyển hướng (tùy chọn)</label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="/blog, /document/abc..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddNotification}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotifContent({ notif }: { notif: AppNotification }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-0.5 text-slate-800 dark:text-slate-200 pr-4">{notif.title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{notif.message}</p>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 block">
        {notif.createdAt && typeof notif.createdAt.toDate === 'function' ? new Date(notif.createdAt.toDate()).toLocaleString('vi-VN') : 'Vừa xong'}
      </span>
      {notif.link && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
          <ChevronRight className="w-5 h-5" />
        </span>
      )}
    </div>
  );
}
