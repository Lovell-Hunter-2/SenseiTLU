import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Sparkles, Send, Minimize2, Minimize, Minus } from 'lucide-react';
import { generateWithFallback, AIMessage } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [subjectsStr, setSubjectsStr] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isVisible]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        const list = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return `- ${data.name} (Link: /subject/${doc.id})`;
        });
        setSubjectsStr(list.join('\n'));
      } catch (error) {
        console.error("Lỗi khi fetch subject cho AI", error);
      }
    };
    fetchSubjects();
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: AIMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const systemMessage: AIMessage = { 
        role: 'system', 
        content: `Bạn là trợ lý AI tên là "Sensei AI" được tích hợp trên ứng dụng SenseiTLU (nền tảng chia sẻ tài liệu và ôn thi).
1. Hãy trả lời ngắn gọn, thân thiện và xúc tích.
2. Dưới đây là danh sách các môn học hiện có trong hệ thống và đường dẫn của nó:
${subjectsStr}
Khi người dùng tìm kiếm môn học hoặc tài liệu, hãy sử dụng Link Markdown để gắn link truy cập nhanh thẳng vào môn học cho họ bấm vào. Ví dụ: [Tên môn học](/subject/ID). Tuyệt đối không bịa ra hoặc nhầm lẫn tên môn học không có trong list được cung cấp.
Nếu người dùng hỏi về chức năng hoặc cách làm bài, hãy dựa vào đường dẫn trang hiện tại của người dùng để tư vấn. Người dùng đang ở: ${location.pathname}
3. Giải đáp các câu hỏi học tập bằng kiến thức sư phạm và chuyên môn.`
      };
      
      const chatMessages = [
        systemMessage,
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      ];

      const responseText = await generateWithFallback({ messages: chatMessages });
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Xin lỗi, có lỗi xảy ra: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      drag
      dragConstraints={{ top: 0, left: 0, right: window.innerWidth - 320, bottom: window.innerHeight - 400 }}
      dragElastic={0.1}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
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
                msg.content
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi AI..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
