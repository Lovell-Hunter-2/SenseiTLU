import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, serverTimestamp, deleteDoc, limit } from 'firebase/firestore';
import { Book, FileText, Presentation, FileQuestion, Folder, Plus, ExternalLink, Zap, Trash2, Edit2, ChevronDown, ChevronUp, Link as LinkIcon, ClipboardList, ScrollText, Lightbulb, Sigma, X, LayoutTemplate, Lock, LogIn, Bot, Sparkles, Flag } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { logActivityEvent, logSubjectDocumentView } from '../useActivityLogger';

const typeIcons: Record<string, React.ElementType> = {
  'Chatbot': Bot,
  'Giáo trình': Book,
  'Slide': Presentation,
  'Đề cương': FileText,
  'File trắc nghiệm': FileQuestion,
  'Bài tập': ClipboardList,
  'Đề thi mẫu': ScrollText,
  'Tips': Lightbulb,
  'Công thức': Sigma,
  'Khác': Folder
};

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docLimit, setDocLimit] = useState(50);
  const { isAdmin, user, login, loading } = useAuth();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'folder'>('file');
  const [newDoc, setNewDoc] = useState({ title: '', type: 'Giáo trình', url: '', chapter: '', isHidden: false });
  const [folderItems, setFolderItems] = useState([{ title: '', url: '' }]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Report State
  const [reportDocId, setReportDocId] = useState<string | null>(null);
  const [reportDocTitle, setReportDocTitle] = useState<string>('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Document Viewer State
  const [selectedDocument, setSelectedDocument] = useState<{title: string, url: string} | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showIframeModal, setShowIframeModal] = useState(false);

  const handleDocumentClick = (e: React.MouseEvent, title: string, url: string) => {
    e.preventDefault();
    setSelectedDocument({ title, url });
    if (subject && user) {
      logSubjectDocumentView(user.uid, subject.id, subject.name, title, window.location.pathname);
    }
    setShowChoiceModal(true);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      if (url.includes('docs.google.com/presentation/d/')) {
        const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
        if (match) return `https://docs.google.com/presentation/d/${match[1]}/preview`;
      }
      if (url.includes('docs.google.com/document/d/')) {
        const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        if (match) return `https://docs.google.com/document/d/${match[1]}/preview`;
      }
      if (url.includes('docs.google.com/spreadsheets/d/')) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) return `https://docs.google.com/spreadsheets/d/${match[1]}/preview`;
      }
    } catch(e) {
      console.error(e);
    }
    return url;
  };

  // Drive Auto Import State
  const [folderInputMode, setFolderInputMode] = useState<'manual' | 'auto'>('manual');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [isScanningDrive, setIsScanningDrive] = useState(false);
  const [driveApiKey, setDriveApiKey] = useState(localStorage.getItem('driveApiKey') || (import.meta as any).env.VITE_GOOGLE_DRIVE_API_KEY || '');
  const [showDriveApiInput, setShowDriveApiInput] = useState(!driveApiKey);

  const toggleFolder = (docId: string) => {
    setExpandedFolders(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleEditClick = (doc: any) => {
    setEditingDocId(doc.id);
    setUploadMode(doc.isFolder ? 'folder' : 'file');
    setFolderInputMode('manual');
    setNewDoc({
      title: doc.title,
      type: doc.type,
      url: doc.url || '',
      chapter: doc.chapter || '',
      isHidden: doc.isHidden || false
    });
    setFolderItems(doc.items && doc.items.length > 0 ? doc.items : [{ title: '', url: '' }]);
    setIsAddModalOpen(true);
  };

  const handleScanDriveFolder = async () => {
    if (!driveFolderUrl) return;
    if (!driveApiKey) {
      alert("Vui lòng nhập Google Drive API Key để sử dụng tính năng này.");
      setShowDriveApiInput(true);
      return;
    }

    let folderId = '';
    const match1 = driveFolderUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
    const match2 = driveFolderUrl.match(/id=([a-zA-Z0-9-_]+)/);
    if (match1) folderId = match1[1];
    else if (match2) folderId = match2[1];
    else {
      alert("Link thư mục Google Drive không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    setIsScanningDrive(true);
    try {
      localStorage.setItem('driveApiKey', driveApiKey);

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${driveApiKey}&fields=files(id,name,webViewLink)&orderBy=name`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.files && data.files.length > 0) {
        const newItems = data.files.map((file: any) => {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          return {
            title: nameWithoutExt,
            url: file.webViewLink
          };
        });
        
        if (folderItems.length === 1 && !folderItems[0].title && !folderItems[0].url) {
          setFolderItems(newItems);
        } else {
          setFolderItems([...folderItems, ...newItems]);
        }
        
        setFolderInputMode('manual');
        setDriveFolderUrl('');
        setShowDriveApiInput(false);
      } else {
        alert("Thư mục trống hoặc không có quyền truy cập. Hãy đảm bảo thư mục đã được share 'Bất kỳ ai có liên kết'.");
      }
    } catch (error: any) {
      console.error("Error scanning drive:", error);
      alert("Lỗi khi quét thư mục: " + error.message);
      setShowDriveApiInput(true);
    } finally {
      setIsScanningDrive(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    // Fetch subject
    const fetchSubject = async () => {
      const docRef = doc(db, 'subjects', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSubject({ id: docSnap.id, ...data });
        document.title = `Tài liệu ${data.name} TLU`;
      }
    };
    fetchSubject();

    // Fetch documents
    const q = query(collection(db, 'documents'), where('subjectId', '==', id), limit(docLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocuments(docs);
    });

    return unsubscribe;
  }, [id, docLimit]);

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title.trim() || !id) return;
    
    if (uploadMode === 'file' && !newDoc.url.trim()) return;
    
    try {
      const docData: any = {
        subjectId: id,
        title: newDoc.title,
        type: newDoc.type,
        isHidden: newDoc.isHidden || false,
      };

      if (uploadMode === 'file') {
        docData.url = newDoc.url;
        docData.chapter = newDoc.chapter;
        docData.isFolder = false;
        docData.items = [];
      } else {
        docData.isFolder = true;
        docData.items = folderItems.filter(item => item.title.trim() && item.url.trim());
        docData.url = '';
        docData.chapter = '';
      }

      if (editingDocId) {
        await updateDoc(doc(db, 'documents', editingDocId), docData);
      } else {
        docData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'documents'), docData);
      }

      setIsAddModalOpen(false);
      setEditingDocId(null);
      setNewDoc({ title: '', type: 'Giáo trình', url: '', chapter: '', isHidden: false });
      setFolderItems([{ title: '', url: '' }]);
      setUploadMode('file');
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDoc(doc(db, 'documents', docId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportDocId || !reportReason.trim()) return;
    setIsSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        documentId: reportDocId,
        documentTitle: reportDocTitle,
        subjectId: id,
        subjectName: subject?.name || '',
        reason: reportReason.trim(),
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      // Add a notification for admins
      await addDoc(collection(db, 'notifications'), {
        title: `Báo cáo tài liệu: ${reportDocTitle}`,
        message: `Lý do: ${reportReason.trim()}`,
        link: `/subject/${id}`,
        forAdminOnly: true,
        createdAt: serverTimestamp(),
      });
      alert('Đã gửi báo cáo thành công. Cảm ơn bạn!');
      setReportDocId(null);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting:', error);
      alert('Có lỗi xảy ra khi gửi báo cáo.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Đang tải dữ liệu...</div>;

  if (!user) {
    return (
      <div className="py-12 max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <div className="flex flex-col items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 border border-slate-100 dark:border-slate-700">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Nội dung bị khóa
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-lg">
              Yêu cầu <strong>đăng nhập tài khoản Google</strong> để xem và tải các tài liệu của môn học này. Điều này giúp chúng tôi bảo vệ tài liệu được chia sẻ an toàn hơn.
            </p>
            <button
              onClick={login}
              className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              <LogIn className="w-5 h-5" /> Đăng nhập ngay
            </button>
            
            <div className="mt-8 pt-6 border-t border-blue-200/50 dark:border-blue-800/50 w-full">
              <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-center gap-2">
                ← Quay lại Trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) return <div className="py-12 text-center text-slate-500">Đang tải thông tin môn học...</div>;

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (doc.isHidden && !isAdmin) return acc;
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  const types = ['Chatbot', 'Giáo trình', 'Slide', 'Đề cương', 'File trắc nghiệm', 'Bài tập', 'Đề thi mẫu', 'Tips', 'Công thức', 'Khác'];

  const renderDocCard = (doc: any, Icon: any) => {
    const isChatbot = doc.type === 'Chatbot';

    return (
    <div key={doc.id} className={isChatbot ? "relative group rounded-xl p-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-sm hover:shadow-lg transition-all" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow transform-gpu"}>
      <div className={isChatbot ? "bg-white dark:bg-slate-900 rounded-[10px] p-4 flex flex-col gap-4 h-full" : "contents"}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isChatbot ? 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={`font-medium truncate flex items-center gap-2 ${isChatbot ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-900 dark:text-slate-100'}`} title={doc.title}>
                  {doc.title}
                  {isChatbot && <Sparkles className="w-4 h-4 text-amber-500" />}
                  {doc.isHidden && <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Đang ẩn</span>}
                </h4>
                {!doc.isFolder && doc.chapter && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {doc.chapter}
                  </p>
                )}
              </div>
              {doc.isFolder && (
                <button 
                  onClick={() => toggleFolder(doc.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                >
                  {expandedFolders[doc.id] ? (
                    <><ChevronUp className="w-4 h-4" /> Thu gọn</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Mở rộng</>
                  )}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-3">
              {!doc.isFolder ? (
                <a
                  href={doc.url}
                  onClick={isChatbot ? undefined : (e) => handleDocumentClick(e, doc.title, doc.url)}
                  target={isChatbot ? "_blank" : undefined}
                  rel={isChatbot ? "noopener noreferrer" : undefined}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${isChatbot ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isChatbot ? <><Bot className="w-4 h-4" /> Mở Chatbot</> : <><ExternalLink className="w-4 h-4" /> Xem tài liệu</>}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Folder className="w-4 h-4" /> {doc.items?.length || 0} mục
                </span>
              )}
              
              <div className="flex items-center gap-3 ml-auto">
                {user && (
                  <button
                    onClick={() => { setReportDocId(doc.id); setReportDocTitle(doc.title); }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full transition-colors"
                    title="Báo cáo lỗi tài liệu"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
                 
                {isAdmin && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEditClick(doc)}
                      className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Sửa
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(doc.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Folder Items */}
        {doc.isFolder && expandedFolders[doc.id] && doc.items && doc.items.length > 0 && (
          <div className="pl-0 sm:pl-14 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-col gap-1.5">
              {doc.items.map((item: any, idx: number) => (
                <a 
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleDocumentClick(e, item.title, item.url)}
                  className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/30 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-colors"
                  title={item.title}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3">
          <Book className="w-8 h-8 text-blue-500" /> {subject.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {subject.description || `Tổng hợp tài liệu môn ${subject.name} - Sinh viên TLU`}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
          Tài liệu môn học
        </h2>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingDocId(null);
              setNewDoc({ title: '', type: 'Giáo trình', url: '', chapter: '', isHidden: false });
              setFolderItems([{ title: '', url: '' }]);
              setUploadMode('file');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm tài liệu
          </button>
        )}
      </div>

      {/* Mock Exam Card (Fixed at top) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Zap className="w-24 h-24" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">Thi online {subject.name}</h3>
              <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/30 uppercase tracking-wider">
                🔥 Hot
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md line-clamp-2 sm:line-clamp-none">
              Luyện tập với AI - Tự động tạo câu hỏi trắc nghiệm từ tài liệu.
            </p>
          </div>
        </div>
        <Link
          to={`/subject/${subject.id}/mock-exam`}
          className="relative z-10 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Làm bài ngay <span>→</span>
        </Link>
      </div>

      {/* Document Categories */}
      <div className="space-y-8">
        {types.map(type => {
          const docs = groupedDocs[type];
          if (!docs || docs.length === 0) return null;
          const Icon = typeIcons[type] || Folder;

          return (
            <div key={type} className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Icon className="w-5 h-5 text-blue-500" /> {type}
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Column 1 */}
                <div className="flex-1 flex flex-col gap-4 w-full">
                  {docs.filter((_, i) => i % 2 === 0).map(doc => renderDocCard(doc, Icon))}
                </div>
                
                {/* Column 2 */}
                {docs.length > 1 && (
                  <div className="flex-1 flex flex-col gap-4 w-full">
                    {docs.filter((_, i) => i % 2 !== 0).map(doc => renderDocCard(doc, Icon))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {documents.length > 0 && documents.length >= docLimit && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setDocLimit(prev => prev + 50)}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium text-sm border border-slate-200 dark:border-slate-700"
            >
              Tải thêm tài liệu
            </button>
          </div>
        )}

        {documents.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Chưa có tài liệu nào cho môn học này.
          </div>
        )}
      </div>

      {/* Add/Edit Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">{editingDocId ? 'Sửa tài liệu' : 'Thêm tài liệu mới'}</h3>
            
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${uploadMode === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                1 File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('folder')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${uploadMode === 'folder' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Folder (Nhiều mục)
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên tài liệu {uploadMode === 'folder' && '(Tên thư mục)'}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newDoc.title}
                  onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại tài liệu</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newDoc.type}
                  onChange={e => setNewDoc({...newDoc, type: e.target.value})}
                >
                  {types.map(t => (
                    <option key={t} value={t} className="text-slate-900">{t}</option>
                  ))}
                </select>
              </div>

              {uploadMode === 'file' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Chương (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="VD: Chương 1, Chương 2..."
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newDoc.chapter}
                      onChange={e => setNewDoc({...newDoc, chapter: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">URL (Link Drive/PDF)</label>
                    <input
                      type="url"
                      required
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newDoc.url}
                      onChange={e => setNewDoc({...newDoc, url: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-4 mb-2 border-b border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFolderInputMode('manual')}
                      className={`text-sm font-medium pb-2 -mb-[1px] border-b-2 transition-colors ${folderInputMode === 'manual' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      Nhập thủ công
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderInputMode('auto')}
                      className={`text-sm font-medium pb-2 -mb-[1px] border-b-2 transition-colors ${folderInputMode === 'auto' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      Quét từ link Drive
                    </button>
                  </div>

                  {folderInputMode === 'auto' ? (
                    <div className="space-y-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
                        <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>Dán link thư mục Google Drive (đã bật chia sẻ "Bất kỳ ai có liên kết"). Hệ thống sẽ tự động lấy tên và link của tất cả các file bên trong.</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Link thư mục Drive</label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={driveFolderUrl}
                          onChange={e => setDriveFolderUrl(e.target.value)}
                        />
                      </div>

                      {showDriveApiInput && (
                        <div>
                          <label className="block text-sm font-medium mb-1 flex justify-between">
                            <span>Google Drive API Key</span>
                            <a href="https://developers.google.com/drive/api/quickstart/js" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">Cách lấy Key?</a>
                          </label>
                          <input
                            type="text"
                            placeholder="AIzaSy..."
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={driveApiKey}
                            onChange={e => setDriveApiKey(e.target.value)}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleScanDriveFolder}
                        disabled={isScanningDrive || !driveFolderUrl}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        {isScanningDrive ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang quét...</>
                        ) : (
                          <><Zap className="w-4 h-4" /> Quét thư mục</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="block text-sm font-medium">Các mục trong thư mục</label>
                      <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {folderItems.map((item, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                placeholder="Tên (VD: Chương 1)"
                                required
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                                value={item.title}
                                onChange={e => {
                                  const newItems = [...folderItems];
                                  newItems[index].title = e.target.value;
                                  setFolderItems(newItems);
                                }}
                              />
                              <input
                                type="url"
                                placeholder="URL (Link Drive/PDF)"
                                required
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                                value={item.url}
                                onChange={e => {
                                  const newItems = [...folderItems];
                                  newItems[index].url = e.target.value;
                                  setFolderItems(newItems);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (folderItems.length > 1) {
                                  setFolderItems(folderItems.filter((_, i) => i !== index));
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors mt-1"
                              disabled={folderItems.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFolderItems([...folderItems, { title: '', url: '' }])}
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Thêm mục
                      </button>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-4 pb-2">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={newDoc.isHidden}
                  onChange={e => setNewDoc({...newDoc, isHidden: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isHidden" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ẩn tài liệu này (Chỉ QTV mới thấy)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingDocId ? 'Lưu thay đổi' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
               <Flag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Báo cáo lỗi</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              Bạn đang báo cáo tài liệu: <span className="font-semibold">{reportDocTitle}</span>
            </p>
            <form onSubmit={handleReportSubmit}>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Nhập chi tiết nội dung lỗi..."
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm mb-4"
                rows={4}
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setReportDocId(null); setReportReason(''); }}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-600 dark:text-slate-300"
                  disabled={isSubmittingReport}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmittingReport || !reportReason.trim()}
                >
                  {isSubmittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Xóa tài liệu?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Choice Modal for Document Opening Options */}
      {showChoiceModal && selectedDocument && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutTemplate className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Mở tài liệu</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
              Bạn muốn mở <strong>{selectedDocument.title}</strong> ở đâu?
            </p>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setShowChoiceModal(false);
                  setShowIframeModal(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20"
              >
                Xem ngay tại SenseiTLU
              </button>
              
              <a
                href={selectedDocument.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowChoiceModal(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700"
              >
                Mở bằng Google Drive <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
            <button 
              onClick={() => setShowChoiceModal(false)} 
              className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Embedded Document View Modal */}
      {showIframeModal && selectedDocument && (
        <div className="fixed inset-0 z-[45] p-4 sm:p-6 md:p-8 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between px-4 sm:px-6 shrink-0">
              <div className="flex items-center gap-3 w-3/4">
                <div className="w-8 h-8 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-lg shadow-sm">
                  <Book className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{selectedDocument.title}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a 
                  href={selectedDocument.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                  title="Mở trong Google Drive"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                <button 
                  onClick={() => setShowIframeModal(false)} 
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900/50">
              {/* Embedded Iframe */}
              <iframe 
                src={getEmbedUrl(selectedDocument.url)} 
                className="w-full h-full border-0" 
                allow="autoplay; fullscreen"
                title="Trình xem tài liệu"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
