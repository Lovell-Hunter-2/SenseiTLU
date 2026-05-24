import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Search, Sparkles, Send, Minimize2, Minimize, Minus, Image as ImageIcon, Camera, Trash2, Settings2 } from 'lucide-react';
import { generateWithFallback, AIMessage } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ScreenshotHelper } from './ScreenshotHelper';
import { AIPersonalizeModal } from './AIPersonalizeModal';

// Dynamically import PDF.js via CDN to avoid package size
const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      return resolve((window as any).pdfjsLib);
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjs);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

interface AIAssistantProps {
  isVisible: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function AIAssistant({ isVisible, onClose, onMinimize }: AIAssistantProps) {
  const { user, driveToken, login } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'assistant', content: 'Xin chào! Mình là trợ lý AI ở đây để giúp bạn sử dụng các tài liệu, tìm môn học, tạo đề, hoặc giải thích kiến thức.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subjectsList, setSubjectsList] = useState<{ id: string, name: string }[]>([]);
  const [subjectsStr, setSubjectsStr] = useState("");
  const [smartPrompts, setSmartPrompts] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<{name: string, type: string, data: string} | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const dragControls = useDragControls();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isVisible]);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'subject' && pathParts[2]) {
      setSmartPrompts([
        "Tóm tắt môn học này",
        "Tạo đề ôn tập",
        "Học môn này cần lưu ý gì?"
      ]);
    } else if (pathParts[1] === 'mock-exam') {
      setSmartPrompts([
        "Làm sao để được điểm cao?",
        "Giải thích câu khó",
      ]);
    } else if (pathParts[1] === '') {
      setSmartPrompts([
        "Môn nào đang hot?",
        "Tìm tài liệu Toán",
        "Hướng dẫn ôn thi"
      ]);
    } else {
      setSmartPrompts([
        "Sensei ơi giúp mình",
        "Tìm tài liệu",
      ]);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user && isVisible) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.aiPreferences) setUserProfile(data.aiPreferences);
            if (data.aiHistory && data.aiHistory.length > 0) {
              setMessages([
                { role: 'assistant', content: 'Xin chào! Mình đã tải lại lịch sử trò chuyện trước đó của bạn.' },
                ...data.aiHistory
              ]);
            }
          }
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu AI cá nhân:", error);
        }
      };
      fetchUserData();
    }
  }, [user, isVisible]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setSubjectsList(list);
        
        const listStr = list.map(item => `- ${item.name} (Link: /subject/${item.id})`);
        setSubjectsStr(listStr.join('\n'));
      } catch (error) {
        console.error("Lỗi khi fetch subject cho AI", error);
      }
    };
    fetchSubjects();
  }, []);

  const handleSend = async (textOverride?: string) => {
    // If the event object from React is passed accidentally, we don't want to use it
    const textToProcess = typeof textOverride === 'string' ? textOverride : inputValue;
    if ((!textToProcess.trim() && !attachedFile) || isLoading) return;
    
    const userMessage: AIMessage = { role: 'user', content: textToProcess, attachedFileData: attachedFile?.data, attachedFileName: attachedFile?.name, attachedFileType: attachedFile?.type };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    const fileToSend = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);
    
    // Tìm context chính xác
    let currentContext = `Đường dẫn trang hiện tại: ${location.pathname}`;
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'subject' && pathParts[2]) {
      const subjectId = pathParts[2];
      const foundSubject = subjectsList.find(s => s.id === subjectId);
      if (foundSubject) {
        let docsInfo = "Chưa có tài liệu nào.";
        try {
          const q = query(collection(db, 'documents'), where('subjectId', '==', subjectId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docsDetails = [];
            for (const d of snap.docs) {
              const data = d.data();
              let docStr = `- [${data.type || 'Tài liệu'}] ${data.title} ${data.url ? `(Link: ${data.url})` : ''}`;
              
              if (data.url && data.url.includes('drive.google.com') || data.url && data.url.includes('docs.google.com')) {
                 const driveApiKey = localStorage.getItem('driveApiKey') || (import.meta as any).env.VITE_GOOGLE_DRIVE_API_KEY || '';
                 const headers = driveToken ? { Authorization: `Bearer ${driveToken}` } : {};
                 const match = data.url.match(/(?:[-\w]{25,})|([a-zA-Z0-9-_]{25,})/);
                 const fileId = match ? match[0] : null;

                 if (fileId) {
                    try {
                       let extractedText = "";
                       let mimeType = "";
                       let isPublicBypass = false;

                       // Attempt official API if key/token exists
                       if (driveApiKey || driveToken) {
                         const metadataRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType&key=${driveApiKey}`, { headers });
                         if (metadataRes.ok) {
                           const metadata = await metadataRes.json();
                           mimeType = metadata.mimeType;
                         } else {
                           isPublicBypass = true;
                         }
                       } else {
                         isPublicBypass = true;
                       }

                       if (isPublicBypass) {
                         // Guess type from URL
                         if (data.url.includes('presentation')) mimeType = 'presentation';
                         else if (data.url.includes('document')) mimeType = 'document';
                         else if (data.url.includes('spreadsheets')) mimeType = 'spreadsheet';
                         else mimeType = 'unknown';

                         if (mimeType !== 'unknown') {
                            const exportUrl = mimeType === 'document' ? `https://docs.google.com/document/d/${fileId}/export?format=txt` :
                                              mimeType === 'presentation' ? `https://docs.google.com/presentation/d/${fileId}/export/txt` :
                                              `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
                            
                            const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(exportUrl)}`);
                            if (proxyRes.ok) {
                               const proxyData = await proxyRes.json();
                               extractedText = proxyData.contents || "";
                            }
                         } else {
                            docStr += `\n   -> (Không thể xác định loại file từ URL công khai)`;
                         }
                       } else {
                         // Official API approach
                         if (mimeType.includes('presentation')) {
                           const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf&key=${driveApiKey}`, { headers });
                           if (fileRes.ok) {
                             const arrayBuffer = await fileRes.arrayBuffer();
                             const pdfjs = await loadPdfJs();
                             const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                             const maxPages = Math.min(pdf.numPages, 30);
                             for (let i = 1; i <= maxPages; i++) {
                               const page = await pdf.getPage(i);
                               const textContent = await page.getTextContent();
                               extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                             }
                           } else {
                             isPublicBypass = true;
                           }
                         } else if (mimeType.includes('document') || mimeType.includes('spreadsheet')) {
                           const exportType = mimeType.includes('spreadsheet') ? 'text/csv' : 'text/plain';
                           const docRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportType}&key=${driveApiKey}`, { headers });
                           if (docRes.ok) extractedText = await docRes.text();
                           else isPublicBypass = true;
                         } else if (mimeType === 'application/pdf') {
                           const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${driveApiKey}`, { headers });
                           if (fileRes.ok) {
                             const arrayBuffer = await fileRes.arrayBuffer();
                             const pdfjs = await loadPdfJs();
                             const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                             const maxPages = Math.min(pdf.numPages, 30);
                             for (let i = 1; i <= maxPages; i++) {
                               const page = await pdf.getPage(i);
                               const textContent = await page.getTextContent();
                               extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                             }
                           }
                         }
                         
                         // Fallback to proxy if export failed due to permissions on export endpoint
                         if (isPublicBypass && (mimeType.includes('document') || mimeType.includes('presentation') || mimeType.includes('spreadsheet'))) {
                            const parsedMime = mimeType.includes('document') ? 'document' : mimeType.includes('presentation') ? 'presentation' : 'spreadsheet';
                            if (parsedMime === 'presentation') {
                               const exportUrl = `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
                               const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`);
                               if (proxyRes.ok) {
                                  try {
                                     const arrayBuffer = await proxyRes.arrayBuffer();
                                     const pdfjs = await loadPdfJs();
                                     const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                                     const maxPages = Math.min(pdf.numPages, 30);
                                     for (let i = 1; i <= maxPages; i++) {
                                        const page = await pdf.getPage(i);
                                        const textContent = await page.getTextContent();
                                        extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                                     }
                                  } catch(e) {
                                     console.error('Lỗi khi đọc PDF từ Slides', e);
                                  }
                               }
                            } else {
                               const exportUrl = parsedMime === 'document' ? `https://docs.google.com/document/d/${fileId}/export?format=txt` :
                                                 `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
                               
                               const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(exportUrl)}`);
                               if (proxyRes.ok) {
                                  const proxyData = await proxyRes.json();
                                  extractedText = proxyData.contents || "";
                               }
                            }
                         }
                       }

                       if (extractedText && (extractedText.includes('<!DOCTYPE html>') || extractedText.includes('<html'))) {
                           extractedText = "";
                       }

                       if (extractedText && extractedText.trim()) {
                         docStr += `\n   -> NỘI DUNG TỪ GOOGLE DRIVE:\n"""\n${extractedText.substring(0, 50000)}...\n"""\n`;
                       } else {
                         docStr += `\n   -> (Nội dung trống hoặc không thể trích xuất text từ Google Drive)`;
                       }
                    } catch (e) {
                       console.error("Lỗi khi đọc file drive", e);
                       docStr += `\n   -> (Lỗi lấy nội dung từ Drive: Lỗi mạng hoặc URL không công khai)`;
                    }
                 }
              }
              docsDetails.push(docStr);
            }
            docsInfo = docsDetails.join('\n');
          }
        } catch (error) {
          console.error("Lỗi khi fetch docs cho AI:", error);
        }
        
        currentContext = `Người dùng đang ở trong trang của môn học: "${foundSubject.name}".
Hiện tại môn học này có các tài liệu sau trên hệ thống:
${docsInfo}

YÊU CẦU ĐẶC BIỆT: Nếu người dùng hỏi về tài liệu môn này có gì, hoặc tóm tắt môn này, hãy TẬP TRUNG tư vấn dựa trên TÀI LIỆU CỦA MÔN "${foundSubject.name}" ở trên. KHÔNG gợi ý sang các môn khác trừ khi được yêu cầu. Dùng format markdown link để dẫn link tài liệu.`;
      }
    } else if (pathParts[1] === '') {
      currentContext = `Người dùng đang ở Trang Chủ (Home).`;
    }

    try {
      let personalizeContext = "";
      if (userProfile) {
        const toneStr = 
          userProfile.aiTone === 'friendly' ? 'Vui vẻ, động viên, gần gũi, hay dùng emoji' :
          userProfile.aiTone === 'strict' ? 'Nghiêm khắc, kỷ luật, đi thẳng vấn đề, văn phong học thuật' :
          userProfile.aiTone === 'concise' ? 'Ngắn gọn, súc tích, chỉ gạch đầu dòng' :
          userProfile.aiTone === 'socratic' ? 'Không trả lời trực tiếp mà hỏi gợi mở để người dùng tự tìm kết quả' : 'Bình thường';
          
        const answerStyleStr = 
          userProfile.answerStyle === 'step_by_step' ? 'Chỉ đưa ra hướng dẫn từng bước để tự luyện tập (không giải trọn vẹn)' : 
          'Đưa ra đáp án chi tiết và giải thích ngay lập tức';

        const needsStr = (userProfile.aiNeeds || []).join(', ');

        personalizeContext = `\n\n--- HỒ SƠ & THIẾT LẬP CÁ NHÂN HÓA ---
Vui lòng tuân thủ TUYỆT ĐỐI các thiết lập sau khi giao tiếp:
- PHONG CÁCH GIAO TIẾP CỦA BẠN: ${toneStr}
- CÁCH ĐƯA ĐÁP ÁN: ${answerStyleStr}
- Môn yếu cần theo sát: ${userProfile.weakSubjects || 'Không rõ'}
- Ghi chú phong cách học: ${userProfile.learningStyle || 'Không có'}
- Nhu cầu hỗ trợ chính: ${needsStr || 'Nhiều nhu cầu'}
(CHÚ Ý: bạn PHẢI áp dụng phong cách giao tiếp và cách đưa đáp án này trong MỌI câu trả lời, không cần nhắc lại thiết lập này)`;
      }

      const systemMessage: AIMessage = { 
        role: 'system', 
        content: `Bạn là trợ lý AI "Sensei AI" trên nền tảng ôn thi SenseiTLU.
1. Hãy trả lời cực kỳ NGẮN GỌN, CHÍNH XÁC, đi thẳng vào vấn đề. KHÔNG dài dòng, KHÔNG tự ý gợi ý những thứ người dùng không hỏi.
2. Hệ thống ĐÃ tự động hỗ trợ khả năng đọc file từ Google Drive. Khi người dùng hỏi bạn có thể đọc được link Google Drive hay không, hãy khẳng định là có (cho phép phân tích Google Docs, Sheets, Slides, PDF nếu nó nằm trong ngữ cảnh hoặc được cung cấp).
3. Dưới đây là danh sách các môn học (để tạo link khi cần):
${subjectsStr}
Khi nhắc đến môn học, có thể dùng format Link Markdown để người dùng bấm vào: [Tên môn](/subject/ID).
4. NGỮ CẢNH HIỆN TẠI (Vô cùng quan trọng): ${currentContext}${personalizeContext}
5. Giải đáp kiến thức bằng chuyên môn sư phạm. Luôn bám sát ngữ cảnh hiện tại trước tiên.`
      };
      
      const chatMessages = [
        systemMessage,
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      ];

      const responseText = await generateWithFallback({ 
        messages: chatMessages,
        attachedFileString: fileToSend ? fileToSend.data : undefined
      });
      
      const assistantMessage: AIMessage = { role: 'assistant', content: responseText };
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // Save to Firebase (background)
        if (user) {
           const historyToSave = [...messages.filter(m => m.role !== 'system'), userMessage, assistantMessage].slice(-10); // Keep last 10
           updateDoc(doc(db, 'users', user.uid), {
             aiHistory: historyToSave.map(m => ({ role: m.role, content: m.content })) // omit base64 to save size
           }).catch(e => console.error("Could not save history", e));
        }
        return newMessages;
      });
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Xin lỗi, có lỗi xảy ra: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleFill = (e: any) => {
      const text = e.detail;
      if (text) {
        setInputValue(text);
        setTimeout(() => {
          handleSend(text);
        }, 300);
      }
    };
    window.addEventListener('ai-assistant-fill', handleFill);
    return () => window.removeEventListener('ai-assistant-fill', handleFill);
  }, [handleSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      onMinimize();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        id="ai-assistant-container"
        drag
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, left: 0, right: typeof window !== 'undefined' ? window.innerWidth - 320 : 0, bottom: typeof window !== 'undefined' ? window.innerHeight - 500 : 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: isCapturing ? 0 : 1, scale: 1, y: 0, pointerEvents: isCapturing ? 'none' : 'auto' }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed z-50 bottom-4 right-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        style={{ height: '500px', maxHeight: '80vh' }}
      >
      {/* Header (Drag Handle) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-move rounded-t-2xl touch-none"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Sensei AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowPersonalizeModal(true)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
            title="Cá nhân hóa AI"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onMinimize}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 cursor-text"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ WebkitTouchCallout: 'default' }}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            >
              {msg.role === 'user' ? (
                <>
                  {msg.attachedFileType && msg.attachedFileData && msg.attachedFileType.startsWith('image/') && (
                    <img src={msg.attachedFileData} alt="User attachment" className="w-full h-auto rounded-lg mb-2 object-contain bg-white/10" style={{ maxHeight: '200px' }} />
                  )}
                  {msg.attachedFileType && msg.attachedFileData && !msg.attachedFileType.startsWith('image/') && (
                    <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg mb-2 border border-white/10 text-xs">
                      <span className="truncate max-w-[150px]">{msg.attachedFileName}</span>
                    </div>
                  )}
                  {msg.content}
                </>
              ) : (
                <div className="text-sm">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <Link to={props.href || "#"} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 underline font-semibold transition-colors" onClick={onMinimize}>
                          {props.children}
                        </Link>
                      ),
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />,
                      code: ({ node, inline, ...props }: any) => 
                        inline 
                          ? <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs text-pink-600 dark:text-pink-400 font-mono" {...props} />
                          : <code className="block bg-slate-200 dark:bg-slate-700 p-2 rounded text-xs font-mono my-2 overflow-x-auto" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-bl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10">
        {/* Smart Prompts */}
        {smartPrompts.length > 0 && messages.length < 5 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {smartPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Selected File Preview */}
        {attachedFile && (
          <div className="relative inline-block w-fit mb-1 mt-1">
            {attachedFile.type.startsWith('image/') ? (
              <img src={attachedFile.data} alt="Selected preview" className="h-16 w-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
            ) : (
              <div className="h-12 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-sm font-medium">
                {attachedFile.name.length > 20 ? attachedFile.name.substring(0, 20) + '...' : attachedFile.name}
              </div>
            )}
            <button 
              onClick={() => setAttachedFile(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 z-10"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <input 
            type="file" 
            accept="image/*,.pdf,.txt,.md" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setAttachedFile({name: file.name, type: file.type || 'unknown', data: reader.result as string});
                reader.readAsDataURL(file);
              }
              if (e.target) e.target.value = '';
            }} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 mb-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            title="Đăng ảnh"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsCapturing(true)}
            className="p-2 mb-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            title="Chụp màn hình"
          >
            <Camera className="w-5 h-5" />
          </button>

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi AI..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-2 text-sm"
            rows={1}
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />

          <button 
            onClick={() => handleSend()}
            disabled={(!inputValue.trim() && !attachedFile) || isLoading}
            className="p-2 mb-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0 mr-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
    {isCapturing && (
      <ScreenshotHelper 
        onCapture={(base64) => {
          setAttachedFile({name: 'screenshot.png', type: 'image/png', data: base64});
          setIsCapturing(false);
        }}
        onCancel={() => setIsCapturing(false)}
      />
    )}
    <AIPersonalizeModal 
      isOpen={showPersonalizeModal} 
      onClose={() => {
        setShowPersonalizeModal(false);
        // Retry fetch manually to update profile quickly
        if (user) {
          getDoc(doc(db, 'users', user.uid))
            .then(snap => {
              if (snap.exists() && snap.data().aiPreferences) {
                 setUserProfile(snap.data().aiPreferences);
              }
            });
        }
      }} 
    />
    </>
  );
}
