import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Sparkles, Send, Minimize2, Minimize, Minus, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';
import { generateWithFallback, AIMessage } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ScreenshotHelper } from './ScreenshotHelper';

interface AIAssistantProps {
  isVisible: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function AIAssistant({ isVisible, onClose, onMinimize }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'assistant', content: 'Xin chào! Mình là trợ lý AI ở đây để giúp bạn sử dụng các tài liệu, tìm môn học, tạo đề, hoặc giải thích kiến thức.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subjectsList, setSubjectsList] = useState<{ id: string, name: string }[]>([]);
  const [subjectsStr, setSubjectsStr] = useState("");
  const [smartPrompts, setSmartPrompts] = useState<string[]>([]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  
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
    if ((!textToProcess.trim() && !attachedImage) || isLoading) return;
    
    const userMessage: AIMessage = { role: 'user', content: textToProcess, image: attachedImage || undefined };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    const imageToSend = attachedImage;
    setAttachedImage(null);
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
            const docs = snap.docs.map(d => {
              const data = d.data();
              return `- [${data.type || 'Tài liệu'}] ${data.title} ${data.url ? `(Link: ${data.url})` : ''}`;
            });
            docsInfo = docs.join('\n');
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
      const systemMessage: AIMessage = { 
        role: 'system', 
        content: `Bạn là trợ lý AI "Sensei AI" trên nền tảng ôn thi SenseiTLU.
1. Hãy trả lời cực kỳ NGẮN GỌN, CHÍNH XÁC, đi thẳng vào vấn đề. KHÔNG dài dòng, KHÔNG tự ý gợi ý những thứ người dùng không hỏi.
2. Dưới đây là danh sách các môn học (để tạo link khi cần):
${subjectsStr}
Khi nhắc đến môn học, có thể dùng format Link Markdown để người dùng bấm vào: [Tên môn](/subject/ID).
3. NGỮ CẢNH HIỆN TẠI (Vô cùng quan trọng): ${currentContext}
4. Giải đáp kiến thức bằng chuyên môn sư phạm. Luôn bám sát ngữ cảnh hiện tại trước tiên.`
      };
      
      const chatMessages = [
        systemMessage,
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      ];

      const responseText = await generateWithFallback({ 
        messages: chatMessages,
        attachedImage: imageToSend || undefined
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
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
        drag
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
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-move rounded-t-2xl">
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Sensei AI</span>
        </div>
        <div className="flex items-center gap-1">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'user' ? (
                <>
                  {msg.image && (
                    <img src={msg.image} alt="User attachment" className="w-full h-auto rounded-lg mb-2 object-contain bg-white/10" style={{ maxHeight: '200px' }} />
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

        {/* Selected Image Preview */}
        {attachedImage && (
          <div className="relative inline-block w-fit mb-1 mt-1">
            <img src={attachedImage} alt="Selected preview" className="h-16 w-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
            <button 
              onClick={() => setAttachedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setAttachedImage(reader.result as string);
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
            disabled={(!inputValue.trim() && !attachedImage) || isLoading}
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
          setAttachedImage(base64);
          setIsCapturing(false);
        }}
        onCancel={() => setIsCapturing(false)}
      />
    )}
    </>
  );
}
