import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { Search, EyeOff, Eye, FileText, Loader2, AlertCircle, Clock, CheckSquare, Square } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function HiddenDocsManager() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showUnhideMenu, setShowUnhideMenu] = useState(false);
  const [customDays, setCustomDays] = useState('');

  // Load subjects once
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'subjects'));
        const map: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
          map[doc.id] = doc.data().name;
        });
        setSubjectsMap(map);
      } catch (err) {
        console.error("Lỗi khi tải môn học", err);
      }
    };
    if (isAdmin) {
      fetchSubjects();
    }
  }, [isAdmin]);

  // Fetch documents based on search or hidden status
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!searchQuery.trim()) {
          // Empty search -> only fetch hidden docs
          const q = query(collection(db, 'documents'), where('isHidden', '==', true));
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setDocuments(docs);
        } else {
          // With search -> fetch all docs and filter
          // In a real large app, this is bad, but for a simple admin dashboard it's okay.
          const snapshot = await getDocs(collection(db, 'documents'));
          const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          
          const queryLower = searchQuery.toLowerCase();
          const filtered = allDocs.filter(doc => {
            const docNameMatch = doc.title && doc.title.toLowerCase().includes(queryLower);
            const subjectName = subjectsMap[doc.subjectId] || '';
            const subjectMatch = subjectName.toLowerCase().includes(queryLower);
            return docNameMatch || subjectMatch;
          });
          
          setDocuments(filtered);
        }
      } catch (err) {
        console.error("Lỗi khi tải tài liệu", err);
        setError("Không thể tải danh sách tài liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchDocs();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isAdmin, searchQuery, subjectsMap]);

  const toggleHidden = async (docId: string, currentHiddenStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'documents', docId), {
        isHidden: !currentHiddenStatus,
        tempUnhideUntil: null
      });
      
      // Update local state
      setDocuments(docs => docs.map(d => {
        if (d.id === docId) {
          return { ...d, isHidden: !currentHiddenStatus, tempUnhideUntil: null };
        }
        return d;
      }));
      
      // If we are not searching, and we just unhid it, we might want to remove it from the list
      if (!searchQuery.trim() && currentHiddenStatus) {
        setDocuments(docs => docs.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái ẩn", err);
      alert("Đã xảy ra lỗi khi cập nhật trạng thái.");
    }
  };

  const cancelTempUnhide = async (docId: string) => {
    try {
      await updateDoc(doc(db, 'documents', docId), {
        tempUnhideUntil: null
      });
      setDocuments(docs => docs.map(d => {
        if (d.id === docId) {
          return { ...d, tempUnhideUntil: null };
        }
        return d;
      }));
    } catch (err) {
      console.error("Lỗi", err);
    }
  };

  const toggleSelection = (docId: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setSelectedDocs(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents.length && documents.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  const handleBulkUnhide = async (days: number) => {
    if (!days || days <= 0) return;
    const unhideUntil = new Date();
    unhideUntil.setDate(unhideUntil.getDate() + days);

    try {
      const promises = Array.from(selectedDocs).map(docId => {
        return updateDoc(doc(db, 'documents', docId), {
          tempUnhideUntil: unhideUntil
        });
      });
      await Promise.all(promises);

      setDocuments(docs => docs.map(d => {
        if (selectedDocs.has(d.id)) {
          return { ...d, tempUnhideUntil: unhideUntil };
        }
        return d;
      }));

      setSelectedDocs(new Set());
      setShowUnhideMenu(false);
      setCustomDays('');
      alert(`Đã gỡ ẩn tạm thời ${selectedDocs.size} tài liệu trong ${days} ngày.`);
    } catch (err) {
      console.error("Lỗi khi gỡ ẩn hàng loạt", err);
      alert("Đã xảy ra lỗi khi gỡ ẩn tài liệu.");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col h-[600px] max-h-[80vh]">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Quản lý tài liệu ẩn</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tìm kiếm và thay đổi trạng thái ẩn của tài liệu</p>
            </div>
          </div>
          
          {/* Bulk Action Header */}
          {selectedDocs.size > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl animate-in slide-in-from-top-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                Đã chọn {selectedDocs.size}
              </span>
              <div className="relative">
                <button 
                  onClick={() => setShowUnhideMenu(!showUnhideMenu)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Gỡ ẩn tạm thời
                </button>
                {showUnhideMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-2 z-50 animate-in zoom-in-95">
                    <div className="space-y-1">
                      <button onClick={() => handleBulkUnhide(7)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors">1 tuần</button>
                      <button onClick={() => handleBulkUnhide(14)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors">2 tuần</button>
                      <button onClick={() => handleBulkUnhide(21)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors">3 tuần</button>
                      <button onClick={() => handleBulkUnhide(30)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors">1 tháng</button>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                      <div className="flex items-center gap-2 px-2 py-2">
                        <input 
                          type="number" 
                          min="1"
                          placeholder="Số ngày..."
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                          className="w-full min-w-0 px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button 
                          onClick={() => handleBulkUnhide(parseInt(customDays))}
                          disabled={!customDays || parseInt(customDays) <= 0}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50 transition-colors"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên tài liệu hoặc môn học (để trống để xem tài liệu đang ẩn)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-0 min-h-0">
        {error && (
          <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <FileText className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
            <p>{searchQuery ? 'Không tìm thấy tài liệu nào khớp.' : 'Không có tài liệu nào đang bị ẩn.'}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-[0_1px_0_0_theme(colors.slate.200)] dark:shadow-[0_1px_0_0_theme(colors.slate.700)]">
              <tr>
                <th className="px-6 py-3 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-500 transition-colors">
                    {selectedDocs.size === documents.length && documents.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tên tài liệu</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Môn học</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {documents.map((doc) => {
                let isTempUnhidden = false;
                if (doc.isHidden && doc.tempUnhideUntil) {
                  const unhideDate = doc.tempUnhideUntil.toDate ? doc.tempUnhideUntil.toDate() : new Date(doc.tempUnhideUntil);
                  if (unhideDate.getTime() > new Date().getTime()) {
                    isTempUnhidden = true;
                  }
                }
                
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleSelection(doc.id)} className="text-slate-400 hover:text-blue-500 transition-colors">
                        {selectedDocs.has(doc.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1" title={doc.title}>
                        {doc.title || 'Không có tiêu đề'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{doc.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {subjectsMap[doc.subjectId] || 'Không rõ môn học'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isTempUnhidden ? (
                         <button 
                           onClick={() => cancelTempUnhide(doc.id)}
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors" 
                           title="Đang hiện tạm thời (Nhấp để hủy và ẩn lại)"
                         >
                           <Clock className="w-4 h-4" /> Đã gỡ ẩn tạm thời
                         </button>
                      ) : (
                        <button
                          onClick={() => toggleHidden(doc.id, !!doc.isHidden)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            doc.isHidden
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                          }`}
                          title={doc.isHidden ? "Đang ẩn (Nhấp để hiện)" : "Đang hiện (Nhấp để ẩn)"}
                        >
                          {doc.isHidden ? (
                            <>
                              <EyeOff className="w-4 h-4" /> Ẩn
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" /> Hiện
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
