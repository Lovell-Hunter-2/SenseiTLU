import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, Calendar, Calculator, Users, Briefcase, LineChart, Monitor, Smartphone, Globe, Cloud, Code } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const ECOSYSTEM_ICONS: Record<string, React.FC<any>> = {
  Calendar, Calculator, Users, Briefcase, LineChart, Monitor, Smartphone, Globe, Cloud, Code
};

export const ECOSYSTEM_COLORS = [
  { id: 'blue', name: 'Xanh dương', classes: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { id: 'emerald', name: 'Xanh ngọc', classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { id: 'violet', name: 'Tím', classes: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800' },
  { id: 'amber', name: 'Vàng', classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { id: 'rose', name: 'Hồng', classes: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { id: 'indigo', name: 'Chàm', classes: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
];

interface EcosystemApp {
  id: string;
  name: string;
  description: string;
  url: string;
  iconName: string;
  colorTheme: string;
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export default function EcosystemManagerModal({ isOpen, onClose, inline = false }: Props) {
  const [apps, setApps] = useState<EcosystemApp[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    iconName: "Globe",
    colorTheme: "blue"
  });

  useEffect(() => {
    if ((isOpen || inline) && loading) {
      fetchApps();
    }
  }, [isOpen, inline, loading]);

  const fetchApps = async () => {
    try {
      const snap = await getDocs(collection(db, "ecosystem"));
      const appsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EcosystemApp[];
      setApps(appsData);
    } catch (error) {
      console.error("Error fetching ecosystem apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, "ecosystem", editingId), { ...formData });
      } else {
        await addDoc(collection(db, "ecosystem"), { ...formData, createdAt: serverTimestamp() });
      }
      setIsAddMode(false);
      setEditingId(null);
      setFormData({ name: "", description: "", url: "", iconName: "Globe", colorTheme: "blue" });
      fetchApps();
    } catch (error) {
      console.error("Error saving app:", error);
    }
  };

  const handleEdit = (app: EcosystemApp) => {
    setFormData({
      name: app.name,
      description: app.description || "",
      url: app.url,
      iconName: app.iconName || "Globe",
      colorTheme: app.colorTheme || "blue"
    });
    setEditingId(app.id);
    setIsAddMode(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa web app này?")) return;
    try {
      await deleteDoc(doc(db, "ecosystem", id));
      fetchApps();
    } catch (error) {
      console.error("Error deleting app:", error);
    }
  };

  const content = (
    <div className={`bg-white dark:bg-slate-900 ${inline ? '' : 'rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" /> Quản lý Hệ sinh thái
          </h2>
          <p className="text-sm text-slate-500 mt-1">Thêm hoặc chỉnh sửa các trang web liên kết.</p>
        </div>
        {!inline && onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6">
        {isAddMode ? (
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-4">{editingId ? 'Chỉnh sửa Web App' : 'Thêm Web App mới'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên trang web</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="VD: Lịch học TLU" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đường dẫn (URL)</label>
                <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="https://..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-20" placeholder="Mô tả ngắn gọn về trang web..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Icon đại diện</label>
                <select value={formData.iconName} onChange={e => setFormData({...formData, iconName: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {Object.keys(ECOSYSTEM_ICONS).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Màu sắc chủ đạo</label>
                <select value={formData.colorTheme} onChange={e => setFormData({...formData, colorTheme: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {ECOSYSTEM_COLORS.map(color => <option key={color.id} value={color.id}>{color.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setIsAddMode(false); setEditingId(null); }} className="px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu lại</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-500">Danh sách các trang web liên kết trong hệ sinh thái.</p>
              <button onClick={() => { setIsAddMode(true); setFormData({ name: "", description: "", url: "", iconName: "Globe", colorTheme: "blue" }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                <Plus className="w-4 h-4" /> Thêm Web App
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : apps.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Chưa có web app nào.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apps.map(app => {
                  const Icon = ECOSYSTEM_ICONS[app.iconName] || Globe;
                  const theme = ECOSYSTEM_COLORS.find(c => c.id === app.colorTheme) || ECOSYSTEM_COLORS[0];
                  return (
                    <div key={app.id} className={`p-4 rounded-xl border flex items-start gap-4 ${theme.classes} relative group`}>
                      <div className="p-3 bg-white/50 dark:bg-slate-950/50 rounded-lg shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate pr-16">{app.name}</h4>
                        <p className="text-sm opacity-80 mt-1 line-clamp-2">{app.description}</p>
                        <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium underline mt-2 inline-block">Mở liên kết ↗</a>
                      </div>
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button onClick={() => handleEdit(app)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(app.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (inline) return content;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {content}
    </div>
  );
}
