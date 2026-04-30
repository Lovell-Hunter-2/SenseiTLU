import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, Users, RefreshCw, Filter, ArrowUp, ArrowDown } from 'lucide-react';

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

interface UserManagerModalProps {
  onClose: () => void;
}

export default function UserManagerModal({ onClose }: UserManagerModalProps) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (!isAdmin) {
      onClose();
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      
      // Sort logic
      fetchedUsers.sort((a, b) => {
        const timeA = new Date(a.lastLoginAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastLoginAt || b.createdAt || 0).getTime();
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

  if (!isAdmin) return null;

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa rõ';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Chưa rõ';
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch {
      return 'Chưa rõ';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi hoạt động và đăng nhập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Tổng số: <span className="font-bold text-slate-700 dark:text-slate-200">{users.length}</span> người dùng
            </div>
            <button
              onClick={toggleSort}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Filter className="w-4 h-4" />
              Sắp xếp theo thời gian đăng nhập {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4"/> : <ArrowUp className="w-4 h-4"/>}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <th className="px-6 py-4 whitespace-nowrap">Người dùng</th>
                      <th className="px-6 py-4 whitespace-nowrap">Email</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                      <th className="px-6 py-4 whitespace-nowrap">Lần cuối đăng nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt={u.displayName} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" referrerPolicy="no-referrer" />
                            <div className="font-medium text-slate-900 dark:text-white max-w-[150px] sm:max-w-[200px] truncate" title={u.displayName}>
                              {u.displayName || 'Không rõ'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            u.isOnline 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            {u.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(u.lastLoginAt || u.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          Chưa có dữ liệu người dùng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
