import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Shield, Trash2, UserPlus, X, Search } from 'lucide-react';
import { db } from '../firebase';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminManagerModal({ isOpen, onClose }: AdminManagerModalProps) {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdmins = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminList);
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setError('');
      setSuccess('');
      setNewAdminEmail('');
    }
  }, [isOpen]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Find user by email
      const q = query(collection(db, 'users'), where('email', '==', newAdminEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Người dùng này chưa từng đăng nhập vào hệ thống. Vui lòng yêu cầu họ đăng nhập ít nhất 1 lần trước khi cấp quyền.');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      
      if (userDoc.data().role === 'admin') {
        setError('Người dùng này đã là quản trị viên.');
        setLoading(false);
        return;
      }

      // Update role to admin
      await updateDoc(doc(db, 'users', userDoc.id), {
        role: 'admin'
      });

      setSuccess('Đã thêm quản trị viên thành công!');
      setNewAdminEmail('');
      fetchAdmins(); // Refresh list
    } catch (err) {
      console.error("Error adding admin:", err);
      setError('Có lỗi xảy ra khi thêm quản trị viên.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, email: string) => {
    // Prevent removing the hardcoded root admins just in case
    if (email === 'taikhoanphubg4@gmail.com' || email === 'ngominhthuanbg1612007@gmail.com') {
      alert('Không thể xóa quyền của quản trị viên gốc!');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa quyền quản trị của ${email}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'user'
      });
      fetchAdmins(); // Refresh list
    } catch (err) {
      console.error("Error removing admin:", err);
      alert('Có lỗi xảy ra khi xóa quyền quản trị viên.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" /> Quản lý Admin
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Admin Form */}
        <form onSubmit={handleAddAdmin} className="mb-8">
          <label className="block text-sm font-medium mb-2">Thêm quản trị viên mới</label>
          <div className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Nhập email người dùng..."
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              value={newAdminEmail}
              onChange={e => setNewAdminEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" /> Thêm
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        </form>

        {/* Admin List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Danh sách quản trị viên ({admins.length})
          </h4>
          <div className="space-y-3">
            {admins.map(admin => (
              <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={admin.photoURL || `https://ui-avatars.com/api/?name=${admin.email}`} alt="" className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{admin.displayName || 'Người dùng'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{admin.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                  title="Xóa quyền quản trị"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
