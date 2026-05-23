import React, { useState, useEffect } from 'react';
import { X, Save, User, Brain, Target, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AIPersonalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIPersonalizeModal({ isOpen, onClose }: AIPersonalizeModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<{
    aiTone: string;
    aiNeeds: string[];
    weakSubjects: string;
    answerStyle: string;
    learningStyle: string;
  }>({
    aiTone: 'friendly',
    aiNeeds: [],
    weakSubjects: '',
    answerStyle: 'step_by_step',
    learningStyle: '',
  });

  const aiToneOptions = [
    { value: 'friendly', label: 'Vui vẻ & Động viên', description: 'Trò chuyện gần gũi, hay dùng emoji' },
    { value: 'strict', label: 'Nghiêm khắc & Kỷ luật', description: 'Điểm đúng sai rõ ràng, văn phong học thuật' },
    { value: 'concise', label: 'Ngắn gọn & Súc tích', description: 'Đi thẳng vào vấn đề, dùng bullet points' },
    { value: 'socratic', label: 'Phương pháp Socratic', description: 'Hỏi ngược lại để học sinh tự tìm ra câu trả lời' }
  ];

  const aiNeedsOptions = [
    { value: 'theory', label: 'Giải thích lý thuyết, khái niệm khó' },
    { value: 'exercises', label: 'Hướng dẫn giải bài tập chi tiết' },
    { value: 'mock_exam', label: 'Tạo đề thi/Quiz trắc nghiệm ôn tập' },
    { value: 'summary', label: 'Tóm tắt tài liệu dài' },
    { value: 'roadmap', label: 'Lên lộ trình/Kế hoạch học tập' }
  ];

  const answerStyleOptions = [
    { value: 'step_by_step', label: 'Gợi ý từng bước để mình tự giải (Phát triển tư duy)' },
    { value: 'direct', label: 'Đưa ra đáp án chi tiết và giải thích ngay lập tức (Tiết kiệm thời gian)' }
  ];

  const toggleNeed = (value: string) => {
    setPreferences(prev => {
      const needs = prev.aiNeeds || [];
      if (needs.includes(value)) {
        return { ...prev, aiNeeds: needs.filter(n => n !== value) };
      }
      return { ...prev, aiNeeds: [...needs, value] };
    });
  };

  useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().aiPreferences) {
            setPreferences(docSnap.data().aiPreferences);
          }
        } catch (error) {
          console.error("Lỗi khi tải AI Profile", error);
        }
      };
      fetchProfile();
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        aiPreferences: preferences
      });
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu thiết lập AI:", error);
      alert("Không thể lưu thiết lập. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-center p-6">
           <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold mb-2">Đăng nhập để sử dụng</h3>
           <p className="text-slate-500 mb-6">Bạn cần đăng nhập để thiết lập thông tin cá nhân hóa AI của riêng mình.</p>
           <button 
             onClick={onClose}
             className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
           >
             Đóng
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Cá nhân hóa Sensei AI</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Giúp AI hiểu bạn hơn để hỗ trợ hiệu quả nhất</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-blue-500" /> Phong cách giao tiếp của AI
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiToneOptions.map(option => (
                <div 
                  key={option.value}
                  onClick={() => setPreferences({...preferences, aiTone: option.value})}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    preferences.aiTone === option.value 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{option.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Target className="w-4 h-4 text-red-500" /> Nhu cầu hỗ trợ chính <span className="text-xs font-normal text-slate-400">(Có thể chọn nhiều)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiNeedsOptions.map(option => (
                <label key={option.value} className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={(preferences.aiNeeds || []).includes(option.value)}
                    onChange={() => toggleNeed(option.value)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Brain className="w-4 h-4 text-green-500" /> Cách AI đưa ra đáp án bài tập
            </label>
            <div className="flex flex-col gap-2">
              {answerStyleOptions.map(option => (
                <label key={option.value} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <input 
                    type="radio" 
                    name="answerStyle"
                    checked={preferences.answerStyle === option.value}
                    onChange={() => setPreferences({...preferences, answerStyle: option.value})}
                    className="w-4 h-4 mt-0.5 text-purple-600 border-slate-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4 text-orange-500" /> Môn học cần được AI theo sát nhất
            </label>
            <input 
              type="text"
              value={preferences.weakSubjects}
              onChange={(e) => setPreferences({...preferences, weakSubjects: e.target.value})}
              placeholder="VD: Toán Đại số, Tiếng Anh giao tiếp..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Ghi chú bổ sung về phong cách học
            </label>
            <textarea 
              value={preferences.learningStyle}
              onChange={(e) => setPreferences({...preferences, learningStyle: e.target.value})}
              placeholder="VD: Mình hay quên công thức, cần nhắc lại nhiều lần..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 min-h-[80px]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-70 transition-all"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Đang lưu...' : 'Lưu thiết lập'}
          </button>
        </div>
      </div>
    </div>
  );
}
