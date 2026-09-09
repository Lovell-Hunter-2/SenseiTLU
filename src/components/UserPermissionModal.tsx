import React, { useState, useEffect } from 'react';
import { X, Search, Shield, Clock, Check, Trash2 } from 'lucide-react';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface UserPermissionModalProps {
  user: any;
  onClose: () => void;
}

export default function UserPermissionModal({ user, onClose }: UserPermissionModalProps) {
  const [activeTab, setActiveTab] = useState<'grant' | 'revoke'>('grant');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Grant tab state
  const [hiddenDocs, setHiddenDocs] = useState<any[]>([]);
  const [selectedDocToGrant, setSelectedDocToGrant] = useState<any | null>(null);
  const [duration, setDuration] = useState<string>('1'); // days
  
  // Revoke tab state
  const [grantedDocs, setGrantedDocs] = useState<any[]>([]);
  const [selectedDocsToRevoke, setSelectedDocsToRevoke] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user.id, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'grant') {
        const q = query(collection(db, 'documents'), where('isHidden', '==', true));
        const snap = await getDocs(q);
        setHiddenDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        const userDocRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const permissions = data.documentPermissions || [];
          
          // Need to fetch titles for these permissions
          const docsWithTitles = await Promise.all(permissions.map(async (perm: any) => {
            const dSnap = await getDoc(doc(db, 'documents', perm.docId));
            if (dSnap.exists()) {
              return { ...perm, title: dSnap.data().title };
            }
            return perm;
          }));
          
          setGrantedDocs(docsWithTitles);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHiddenDocs = hiddenDocs.filter(d => 
    d.title && d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrant = async () => {
    if (!selectedDocToGrant) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      
      let expiryTime = null; // null means until revoked
      if (duration !== 'forever') {
        const days = parseInt(duration);
        expiryTime = new Date().getTime() + (days * 24 * 60 * 60 * 1000);
      }

      const newPerm = {
        docId: selectedDocToGrant.id,
        expiryTime,
        grantedAt: new Date().getTime()
      };

      if (userSnap.exists()) {
        const existingPerms = userSnap.data().documentPermissions || [];
        const updatedPerms = existingPerms.filter((p: any) => p.docId !== selectedDocToGrant.id);
        updatedPerms.push(newPerm);
        await updateDoc(userRef, { documentPermissions: updatedPerms });
      } else {
        // Just in case user doc doesn't exist but we have auth
        await setDoc(userRef, { documentPermissions: [newPerm] }, { merge: true });
      }
      
      alert('Cấp quyền thành công!');
      setSelectedDocToGrant(null);
      setSearchQuery('');
    } catch (error) {
      console.error("Lỗi cấp quyền:", error);
      alert('Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (selectedDocsToRevoke.size === 0) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const updatedPerms = grantedDocs.filter(d => !selectedDocsToRevoke.has(d.docId));
      
      await updateDoc(userRef, { documentPermissions: updatedPerms.map(p => ({
        docId: p.docId,
        expiryTime: p.expiryTime,
        grantedAt: p.grantedAt
      })) });
      
      setGrantedDocs(updatedPerms);
      setSelectedDocsToRevoke(new Set());
      alert('Gỡ quyền thành công!');
    } catch (error) {
      console.error("Lỗi gỡ quyền:", error);
      alert('Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRevokeSelection = (docId: string) => {
    const newSet = new Set(selectedDocsToRevoke);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setSelectedDocsToRevoke(newSet);
  };

  const formatExpiry = (time: number | null) => {
    if (!time) return "Đến khi tắt";
    if (time < new Date().getTime()) return "Đã hết hạn";
    return `Đến ${new Date(time).toLocaleDateString('vi-VN')} ${new Date(time).toLocaleTimeString('vi-VN')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cấp quyền tài liệu ẩn</h2>
              <p className="text-sm text-slate-500">Cho người dùng: {user.displayName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'grant' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => setActiveTab('grant')}
          >
            Cấp quyền
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'revoke' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => setActiveTab('revoke')}
          >
            Gỡ quyền
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : activeTab === 'grant' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tài liệu ẩn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-[250px] overflow-y-auto bg-white dark:bg-slate-950">
                {filteredHiddenDocs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy tài liệu ẩn nào.</div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHiddenDocs.map(doc => (
                      <li 
                        key={doc.id}
                        onClick={() => setSelectedDocToGrant(doc)}
                        className={`p-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${selectedDocToGrant?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <span className={selectedDocToGrant?.id === doc.id ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}>{doc.title}</span>
                        {selectedDocToGrant?.id === doc.id && <Check className="w-4 h-4 text-blue-600" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Thời hạn cấp quyền:</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="1">1 ngày</option>
                  <option value="3">3 ngày</option>
                  <option value="7">1 tuần</option>
                  <option value="30">1 tháng</option>
                  <option value="forever">Đến khi tắt</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-y-auto bg-white dark:bg-slate-950">
                {grantedDocs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Người dùng này chưa có quyền đặc biệt nào.</div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {grantedDocs.map(perm => (
                      <li key={perm.docId} className="p-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={selectedDocsToRevoke.has(perm.docId)}
                            onChange={() => toggleRevokeSelection(perm.docId)}
                            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{perm.title || 'Tài liệu không xác định'}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {formatExpiry(perm.expiryTime)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          
          {activeTab === 'grant' ? (
            <button 
              onClick={handleGrant}
              disabled={!selectedDocToGrant || saving}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Đang lưu...' : 'Xác nhận cấp quyền'}
            </button>
          ) : (
            <button 
              onClick={handleRevoke}
              disabled={selectedDocsToRevoke.size === 0 || saving}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {saving ? 'Đang gỡ...' : 'Xác nhận gỡ quyền'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
