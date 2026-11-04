import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertTriangle, Clock, Check, Power, Eye, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MaintenanceConfig, formatMaintenanceMessage } from '../types/maintenance';
import { useAuth } from '../contexts/AuthContext';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newConfig: MaintenanceConfig) => void;
}

export default function MaintenanceModal({ isOpen, onClose, onSaved }: MaintenanceModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  // Load current settings when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setFetching(true);
    setSavedSuccess(false);

    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'maintenance'));
        if (snap.exists() && isMounted) {
          const data = snap.data() as Partial<MaintenanceConfig>;
          setEnabled(Boolean(data.enabled));
          setStartTime(data.startTime || '');
          setEndTime(data.endTime || '');
          setReason(data.reason || '');
        }
      } catch (err) {
        console.error('Lỗi khi tải cấu hình bảo trì:', err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const previewMessage = formatMaintenanceMessage(startTime, endTime);

  // Quick preset helper
  const addHoursToEndTime = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => String(n).padStart(2, '0');
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEndTime(str);
  };

  const setTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(6, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEndTime(str);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const configToSave: MaintenanceConfig = {
        enabled,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        reason: reason.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
      };

      await setDoc(doc(db, 'settings', 'maintenance'), configToSave, { merge: true });
      setSavedSuccess(true);
      if (onSaved) onSaved(configToSave);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình bảo trì:', err);
      alert('Không thể lưu cấu hình bảo trì: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              enabled 
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                Cài đặt Chế độ Bảo trì
                {enabled && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 animate-pulse">
                    ĐANG BẬT
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tạm dừng quyền truy cập của người dùng để bảo trì nâng cấp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${enabled ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      Kích hoạt Chế độ Bảo trì
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bật để chặn người dùng truy cập và hiện thông báo bảo trì
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Time pickers */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start time */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Giờ bắt đầu (Tùy chọn)
                      </label>
                      {startTime && (
                        <button
                          type="button"
                          onClick={() => setStartTime('')}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nếu để trống: Chỉ thông báo &quot;tới [Giờ kết thúc]&quot;
                    </p>
                  </div>

                  {/* End time */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Giờ kết thúc (Tùy chọn)
                      </label>
                      {endTime && (
                        <button
                          type="button"
                          onClick={() => setEndTime('')}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Thời điểm dự kiến hoàn thành bảo trì
                    </p>
                  </div>
                </div>

                {/* Quick Buttons for End Time */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Gợi ý nhanh kết thúc:</span>
                  <button
                    type="button"
                    onClick={() => addHoursToEndTime(1)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                  >
                    +1 Giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => addHoursToEndTime(2)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                  >
                    +2 Giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => addHoursToEndTime(4)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                  >
                    +4 Giờ
                  </button>
                  <button
                    type="button"
                    onClick={setTomorrowMorning}
                    className="px-2 py-0.5 text-[11px] bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-md transition-colors"
                  >
                    Sáng mai (06:00)
                  </button>
                </div>
              </div>

              {/* Optional reason/details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do / Ghi chú bổ sung (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nâng cấp máy chủ cơ sở dữ liệu và tối ưu tốc độ"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước thông báo hiển thị cho người dùng:</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-amber-100 dark:border-amber-900/40">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    📢 {previewMessage}
                  </p>
                  {reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                      Chi tiết: {reason}
                    </p>
                  )}
                </div>
                <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 flex items-start gap-1">
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    {!startTime && !endTime && 'Quy tắc: Không chọn giờ -> Báo đang bảo trì chung.'}
                    {!startTime && endTime && 'Quy tắc: Chỉ chọn giờ kết thúc -> Báo bảo trì tới giờ kết thúc.'}
                    {startTime && endTime && 'Quy tắc: Chọn cả start & end -> Báo bảo trì từ giờ bắt đầu đến giờ kết thúc.'}
                  </span>
                </div>
              </div>

              {/* Admin reassurance note */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Khi bật, người dùng tải lại trang hoặc mở trang mới sẽ bị chặn và xem thông báo bảo trì. Quản trị viên đã đăng nhập vẫn có quyền xem và truy cập trang quản trị bình thường.
                </span>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                savedSuccess
                  ? 'bg-emerald-600'
                  : enabled
                  ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Đã lưu thành công!
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  {enabled ? 'Lưu & Kích hoạt Bảo trì' : 'Lưu cài đặt'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
