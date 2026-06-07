import React from 'react';
import { X, Heart } from 'lucide-react';
import qrCodeImage from '../assets/qr-mbbank.jpg';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-3 text-rose-500">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <Heart className="w-6 h-6 animate-pulse" fill="currentColor" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ủng hộ Web</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Đồng hành cùng SenseiTLU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center overflow-y-auto">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium italic mb-6">
            "Mọi sự ủng hộ của bạn là động lực rất lớn để Admin cập nhật thêm nhiều tài liệu và tính năng hay cho web. Xin cảm ơn rất nhiều vì đã đồng hành cùng SenseiTLU."
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-2 flex justify-center items-center shadow-inner border border-slate-100 dark:border-slate-700">
            {/* The image should be named qr-donate.jpg or .png and placed in public/ by the user */}
            <div className="w-full max-w-[280px] sm:max-w-full aspect-[1/1] sm:aspect-auto bg-white rounded-lg p-2 flex items-center justify-center">
               <img 
                 src={qrCodeImage} 
                 alt="Mã QR Donate" 
                 className="w-full h-auto max-h-[40vh] rounded-lg object-contain"
               />
            </div>
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-4">
             Chủ tài khoản: Ngo Minh Thuan <br/>
             Số tài khoản: 0326729422
          </div>
        </div>
      </div>
    </div>
  );
}
