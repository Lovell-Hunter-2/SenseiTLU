import React from 'react';
import { X, Share, PlusSquare, Smartphone, Download } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Cài đặt Ứng dụng
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Trình duyệt của bạn không hỗ trợ cài đặt tự động. Hãy làm theo hướng dẫn dưới đây để thêm ứng dụng vào màn hình chính.
            </p>
          </div>

          <div className="space-y-4">
            {/* iOS Guide */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                  <Smartphone className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Dành cho iOS (Safari)</h3>
              </div>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-3 ml-2">
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                  Nhấn vào biểu tượng <Share className="w-4 h-4 inline mx-1" /> (Chia sẻ) ở thanh dưới cùng.
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                  Kéo xuống và chọn <strong>Thêm vào MH chính</strong> <PlusSquare className="w-4 h-4 inline mx-1" />
                </li>
              </ol>
            </div>

            {/* Android Guide */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                  <Smartphone className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Dành cho Android</h3>
              </div>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-3 ml-2">
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                  Nhấn vào biểu tượng <strong>3 chấm</strong> ở góc trên bên phải.
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                  Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>.
                </li>
              </ol>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
