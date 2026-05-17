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
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    grade: '',
    goals: '',
    weakSubjects: '',
    strongSubjects: '',
    learningStyle: '',
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
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
  }, [isOpen, currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
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
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-blue-500" /> Bạn đang học lớp mấy?
            </label>
            <input 
              type="text"
              value={preferences.grade}
              onChange={(e) => setPreferences({...preferences, grade: e.target.value})}
              placeholder="VD: Lớp 12, Đại học năm 1,..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Target className="w-4 h-4 text-red-500" /> Mục tiêu học tập
            </label>
            <textarea 
              value={preferences.goals}
              onChange={(e) => setPreferences({...preferences, goals: e.target.value})}
              placeholder="VD: Thi đỗ Đại học Bách Khoa khối A1, điểm 9+ Toán,..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Brain className="w-4 h-4 text-green-500" /> Môn thế mạnh
              </label>
              <input 
                type="text"
                value={preferences.strongSubjects}
                onChange={(e) => setPreferences({...preferences, strongSubjects: e.target.value})}
                placeholder="VD: Vật lý, Hóa học..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <BookOpen className="w-4 h-4 text-orange-500" /> Môn còn yếu
              </label>
              <input 
                type="text"
                value={preferences.weakSubjects}
                onChange={(e) => setPreferences({...preferences, weakSubjects: e.target.value})}
                placeholder="VD: Tiếng Anh, Văn..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Phong cách học mong muốn
            </label>
            <textarea 
              value={preferences.learningStyle}
              onChange={(e) => setPreferences({...preferences, learningStyle: e.target.value})}
              placeholder="VD: Thích giải thích bằng hình ảnh/ví dụ thực tế, cần được kiểm tra thường xuyên..."
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
