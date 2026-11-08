import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Shield, Clock, Check, Trash2, BookOpen } from 'lucide-react';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { loadCatalog } from '../services/catalogService';

interface UserPermissionModalProps {
  user: any;
  onClose: () => void;
}

// Accent-insensitive normalization helper for Vietnamese search
const normalizeVietnamese = (str: string) => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

export default function UserPermissionModal({ user, onClose }: UserPermissionModalProps) {
  const [activeTab, setActiveTab] = useState<'grant' | 'revoke'>('grant');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Grant tab state
  const [hiddenDocs, setHiddenDocs] = useState<any[]>([]);
  const [selectedDocsToGrant, setSelectedDocsToGrant] = useState<any[]>([]);
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
      // 1. Fetch all subjects to map subjectId -> subject name
      // Combining static catalog and Firestore to guarantee complete subject resolution
      const subjectMap: Record<string, string> = {};

      try {
        const cat = await loadCatalog();
        if (cat && cat.subjects) {
          cat.subjects.forEach((s: any) => {
            if (s.id && s.name) subjectMap[s.id] = s.name;
          });
        }
      } catch (e) {
        // Fallback to Firestore
      }

      try {
        const subjectsSnap = await getDocs(collection(db, 'subjects'));
        subjectsSnap.forEach(s => {
          subjectMap[s.id] = s.data().name;
        });
      } catch (err) {
        console.warn("Could not fetch live subjects, using cached map:", err);
      }

      if (activeTab === 'grant') {
        const q = query(collection(db, 'documents'), where('isHidden', '==', true));
        const snap = await getDocs(q);
        const docsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const docsWithSubjects = docsData.map((d: any) => ({
          ...d,
          subjectName: subjectMap[d.subjectId] || d.subjectName || 'Môn học không xác định'
        }));
        setHiddenDocs(docsWithSubjects);
      } else {
        const userDocRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const permissions = data.documentPermissions || [];
          
          // Fetch titles and subjects for these permissions
          const docsWithTitles = await Promise.all(permissions.map(async (perm: any) => {
            try {
              const dSnap = await getDoc(doc(db, 'documents', perm.docId));
              if (dSnap.exists()) {
                const dData = dSnap.data();
                return { 
                  ...perm, 
                  title: dData.title, 
                  subjectName: subjectMap[dData.subjectId] || dData.subjectName || 'Môn học không xác định',
                  chapter: dData.chapter || ''
                };
              }
            } catch (e) {
              console.warn("Error fetching doc detail:", e);
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

  // Helper matching function: searches across doc title, subject name, subjectId, chapter, type
  // Supports both case-insensitive and Vietnamese accent-insensitive matching
  const matchDocument = (item: any, queryStr: string) => {
    if (!queryStr.trim()) return true;
    const qLower = queryStr.trim().toLowerCase();
    const qNorm = normalizeVietnamese(queryStr);

    const title = (item.title || '').toLowerCase();
    const titleNorm = normalizeVietnamese(item.title);

    const subjectName = (item.subjectName || '').toLowerCase();
    const subjectNorm = normalizeVietnamese(item.subjectName);

    const subjectId = (item.subjectId || '').toLowerCase();
    const chapter = (item.chapter || '').toLowerCase();
    const chapterNorm = normalizeVietnamese(item.chapter);

    const type = (item.type || '').toLowerCase();
    const typeNorm = normalizeVietnamese(item.type);

    return (
      title.includes(qLower) ||
      titleNorm.includes(qNorm) ||
      subjectName.includes(qLower) ||
      subjectNorm.includes(qNorm) ||
      subjectId.includes(qLower) ||
      chapter.includes(qLower) ||
      chapterNorm.includes(qNorm) ||
      type.includes(qLower) ||
      typeNorm.includes(qNorm)
    );
  };

  // Filter hidden documents in Grant tab
  const filteredHiddenDocs = useMemo(() => {
    return hiddenDocs.filter(d => matchDocument(d, searchQuery));
  }, [hiddenDocs, searchQuery]);

  // Filter granted documents in Revoke tab
  const filteredGrantedDocs = useMemo(() => {
    return grantedDocs.filter(d => matchDocument(d, searchQuery));
  }, [grantedDocs, searchQuery]);

  const toggleGrantSelection = (doc: any) => {
    setSelectedDocsToGrant(prev => {
      const isSelected = prev.some(d => d.id === doc.id);
      if (isSelected) {
        return prev.filter(d => d.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  const handleGrant = async () => {
    if (selectedDocsToGrant.length === 0) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      
      let expiryTime = null; // null means until revoked
      if (duration !== 'forever') {
        const days = parseInt(duration);
        expiryTime = new Date().getTime() + (days * 24 * 60 * 60 * 1000);
      }

      const newPerms = selectedDocsToGrant.map(doc => ({
        docId: doc.id,
        expiryTime,
        grantedAt: new Date().getTime()
      }));

      if (userSnap.exists()) {
        const existingPerms = userSnap.data().documentPermissions || [];
        const updatedPerms = existingPerms.filter((p: any) => !selectedDocsToGrant.some(d => d.id === p.docId));
        updatedPerms.push(...newPerms);
        await updateDoc(userRef, { documentPermissions: updatedPerms });
      } else {
        await setDoc(userRef, { documentPermissions: newPerms }, { merge: true });
      }
      
      // Gửi thông báo cho từng tài liệu được cấp quyền
      for (const docToGrant of selectedDocsToGrant) {
         await addDoc(collection(db, 'notifications'), {
             title: 'Được cấp quyền tài liệu',
             message: `Bạn đã được cấp quyền xem tài liệu ẩn: ${docToGrant.title} - Môn: ${docToGrant.subjectName}`,
             targetUserId: user.id,
             forAdminOnly: false,
             createdAt: serverTimestamp()
         });
      }
      
      alert(`Đã cấp quyền ${selectedDocsToGrant.length} tài liệu thành công!`);
      setSelectedDocsToGrant([]);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cấp quyền tài liệu ẩn</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cho người dùng: <strong className="text-slate-700 dark:text-slate-200">{user.displayName || user.email}</strong></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'grant' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => {
              setActiveTab('grant');
              setSearchQuery('');
            }}
          >
            Cấp quyền
            {selectedDocsToGrant.length > 0 && activeTab === 'grant' && (
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100 text-xs px-2 py-0.5 rounded-full font-bold">{selectedDocsToGrant.length}</span>
            )}
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'revoke' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => {
              setActiveTab('revoke');
              setSearchQuery('');
            }}
          >
            Gỡ quyền
            {selectedDocsToRevoke.size > 0 && activeTab === 'revoke' && (
              <span className="bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100 text-xs px-2 py-0.5 rounded-full font-bold">{selectedDocsToRevoke.size}</span>
            )}
          </button>
        </div>

        {/* Search bar with multi-field search hint */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên tài liệu hoặc tên môn học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>
                Kết quả cho: &ldquo;<strong className="text-blue-600 dark:text-blue-400">{searchQuery}</strong>&rdquo;
              </span>
              <span>
                Tìm thấy {activeTab === 'grant' ? filteredHiddenDocs.length : filteredGrantedDocs.length} tài liệu
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : activeTab === 'grant' ? (
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-[300px] overflow-y-auto bg-white dark:bg-slate-950 shadow-inner">
                {filteredHiddenDocs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    {searchQuery.trim() 
                      ? 'Không tìm thấy tài liệu ẩn nào khớp với tên tài liệu hoặc tên môn này.' 
                      : 'Không có tài liệu ẩn nào trong hệ thống.'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHiddenDocs.map(doc => {
                      const isSelected = selectedDocsToGrant.some(d => d.id === doc.id);
                      return (
                        <li 
                          key={doc.id}
                          onClick={() => toggleGrantSelection(doc)}
                          className={`p-3 text-sm cursor-pointer transition-colors flex items-center gap-3 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                {doc.title}
                              </span>
                              {doc.subjectName && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-900/50 shrink-0">
                                  {doc.subjectName}
                                </span>
                              )}
                              {doc.chapter && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                  {doc.chapter}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Thời hạn cấp quyền:</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-slate-100"
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
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-[300px] overflow-y-auto bg-white dark:bg-slate-950 shadow-inner">
                {filteredGrantedDocs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    {searchQuery.trim()
                      ? 'Không tìm thấy tài liệu đã cấp quyền nào khớp với từ khóa.'
                      : 'Người dùng này chưa có quyền đặc biệt nào.'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredGrantedDocs.map(perm => (
                      <li 
                        key={perm.docId} 
                        className={`p-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${selectedDocsToRevoke.has(perm.docId) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                        onClick={() => toggleRevokeSelection(perm.docId)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input 
                            type="checkbox"
                            checked={selectedDocsToRevoke.has(perm.docId)}
                            readOnly
                            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {perm.title || 'Tài liệu không xác định'}
                              </span>
                              {perm.subjectName && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                                  {perm.subjectName}
                                </span>
                              )}
                            </div>
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
              disabled={selectedDocsToGrant.length === 0 || saving}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {saving ? 'Đang lưu...' : `Xác nhận cấp quyền (${selectedDocsToGrant.length})`}
            </button>
          ) : (
            <button 
              onClick={handleRevoke}
              disabled={selectedDocsToRevoke.size === 0 || saving}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              {saving ? 'Đang gỡ...' : `Xác nhận gỡ quyền (${selectedDocsToRevoke.size})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
