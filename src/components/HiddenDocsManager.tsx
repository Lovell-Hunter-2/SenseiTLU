import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { Search, EyeOff, Eye, FileText, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function HiddenDocsManager() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

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
        isHidden: !currentHiddenStatus
      });
      
      // Update local state
      setDocuments(docs => docs.map(d => {
        if (d.id === docId) {
          return { ...d, isHidden: !currentHiddenStatus };
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

  if (!isAdmin) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col h-[600px] max-h-[80vh]">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Quản lý tài liệu ẩn</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tìm kiếm và thay đổi trạng thái ẩn của tài liệu</p>
          </div>
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
      
      <div className="flex-1 overflow-y-auto p-0">
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
            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tên tài liệu</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Môn học</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
