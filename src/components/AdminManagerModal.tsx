import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function HeroImageManagerModal({ isOpen, onClose }: Props) {
  const [leftUrl, setLeftUrl] = useState('');
  const [rightUrl, setRightUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchImages = async () => {
        const docRef = doc(db, 'settings', 'heroImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLeftUrl(docSnap.data().leftUrl || '');
          setRightUrl(docSnap.data().rightUrl || '');
        }
      };
      fetchImages();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'heroImages'), {
        leftUrl,
        rightUrl,
      }, { merge: true });
      onClose();
    } catch (error) {
      console.error('Error saving hero images:', error);
      alert('Đã xảy ra lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (side: 'left' | 'right') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 600) { // Giới hạn khoảng 600KB
      alert('Vui lòng chọn ảnh có dung lượng nhỏ hơn 600KB hoặc dán link ảnh trực tiếp!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (side === 'left') setLeftUrl(base64String);
      else setRightUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-xl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            Hình ảnh hoạt họa & Khung tìm kiếm
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Left Image */}
          <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Ảnh trang trí (Bên trái)</h4>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link ảnh (URL)</label>
              <input
                type="text"
                placeholder="https://example.com/image.png"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={leftUrl.startsWith('data:') ? '' : leftUrl}
                onChange={e => setLeftUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">Hoặc tải lên</span>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium">
                <UploadCloud className="w-4 h-4" /> Kéo thả/Tải ảnh
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload('left')} />
              </label>
            </div>
            {leftUrl && (
              <div className="mt-2 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 rounded-lg relative group">
                <img src={leftUrl} alt="Trái" className="h-20 object-contain mx-auto rounded" />
                <button type="button" onClick={() => setLeftUrl('')} className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          {/* Right Image */}
          <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Ảnh trang trí (Bên phải)</h4>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link ảnh (URL)</label>
              <input
                type="text"
                placeholder="https://example.com/image.png"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={rightUrl.startsWith('data:') ? '' : rightUrl}
                onChange={e => setRightUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">Hoặc tải lên</span>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium">
                <UploadCloud className="w-4 h-4" /> Kéo thả/Tải ảnh
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload('right')} />
              </label>
            </div>
            {rightUrl && (
              <div className="mt-2 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 rounded-lg relative group">
                <img src={rightUrl} alt="Phải" className="h-20 object-contain mx-auto rounded" />
                <button type="button" onClick={() => setRightUrl('')} className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt ảnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
