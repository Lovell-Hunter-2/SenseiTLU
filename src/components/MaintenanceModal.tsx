import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertTriangle, Clock, Check, Power, Eye, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  MaintenanceConfig,
  formatMaintenanceMessage,
  getMaintenanceStatus,
  formatTimeRemaining,
  parseMaintenanceDate,
} from '../types/maintenance';
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
  const [nowMs, setNowMs] = useState(Date.now());

  // Update clock every second while modal is open for accurate preview & status
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const currentConfig: MaintenanceConfig = {
    enabled,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    reason: reason.trim(),
  };

  const status = getMaintenanceStatus(currentConfig, nowMs);
  const previewMessage = formatMaintenanceMessage(startTime, endTime);

  const startMs = parseMaintenanceDate(startTime);
  const endMs = parseMaintenanceDate(endTime);

  // Quick preset helper for end time
  const addHoursToEndTime = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
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

  const setStartNow = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setStartTime(str);
  };

  const handleSaveConfig = async (overrideEnabled?: boolean) => {
    setLoading(true);
    try {
      const finalEnabled = overrideEnabled !== undefined ? overrideEnabled : enabled;
      const configToSave: MaintenanceConfig = {
        enabled: finalEnabled,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        reason: reason.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
      };

      await setDoc(doc(db, 'settings', 'maintenance'), configToSave, { merge: true });
      if (overrideEnabled !== undefined) {
        setEnabled(overrideEnabled);
      }
      setSavedSuccess(true);
      if (onSaved) onSaved(configToSave);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình bảo trì:', err);
      alert('Không thể lưu cấu hình bảo trì: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveConfig();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-auto relative z-10 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                status === 'active'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  : status === 'scheduled'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>Cài đặt Chế độ Bảo trì</span>
                {status === 'active' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                    ĐANG BẢO TRÌ (BẬT)
                  </span>
                )}
                {status === 'scheduled' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                    ĐÃ LÊN LỊCH
                  </span>
                )}
                {status === 'inactive' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    ĐANG TẮT
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động bật / tắt chính xác theo thời gian đã thiết lập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng bảng cài đặt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${enabled ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      Kích hoạt Chế độ Bảo trì
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {enabled
                      ? 'Đang bật: Sẽ tự động áp dụng theo thời gian bắt đầu & kết thúc'
                      : 'Đang tắt: Người dùng truy cập bình thường'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Status Explanation Card */}
              {enabled && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Trạng thái tự động:</span>
                  </div>
                  {status === 'scheduled' && startMs && (
                    <p className="text-blue-600 dark:text-blue-400">
                      ⏱️ <strong>Chưa đến giờ:</strong> Sẽ <strong>TỰ ĐỘNG BẬT</strong> sau{' '}
                      <strong>{formatTimeRemaining(startMs, nowMs)}</strong>.
                    </p>
                  )}
                  {status === 'active' && endMs && (
                    <p className="text-amber-600 dark:text-amber-400">
                      ⚡ <strong>Đang bảo trì:</strong> Sẽ <strong>TỰ ĐỘNG TẮT</strong> sau{' '}
                      <strong>{formatTimeRemaining(endMs, nowMs)}</strong>.
                    </p>
                  )}
                  {status === 'active' && !endMs && (
                    <p className="text-amber-600 dark:text-amber-400">
                      ⚡ <strong>Đang bảo trì thủ công:</strong> Chưa đặt giờ kết thúc. Bảo trì sẽ duy trì cho đến khi tắt hoặc đặt giờ kết thúc.
                    </p>
                  )}
                  {status === 'inactive' && endMs && nowMs >= endMs && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✅ <strong>Đã quá giờ kết thúc:</strong> Hệ thống đã tự động mở lại cho người dùng.
                    </p>
                  )}
                </div>
              )}

              {/* Time pickers */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Start time */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Giờ bắt đầu (Tùy chọn)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={setStartNow}
                          className="text-[11px] text-blue-500 hover:underline"
                        >
                          Bây giờ
                        </button>
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
                    </div>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nếu đặt trong tương lai, hệ thống sẽ chờ đến đúng giờ mới tự bật.
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
                      Đến đúng giờ này, hệ thống sẽ <strong>TỰ ĐỘNG TẮT</strong> bảo trì.
                    </p>
                  </div>
                </div>

                {/* Quick Buttons for End Time */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Gợi ý kết thúc:</span>
                  <button
                    type="button"
                    onClick={() => addHoursToEndTime(1)}
                    className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    +1 Giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => addHoursToEndTime(2)}
                    className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    +2 Giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => addHoursToEndTime(4)}
                    className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    +4 Giờ
                  </button>
                  <button
                    type="button"
                    onClick={setTomorrowMorning}
                    className="px-2 py-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg transition-colors cursor-pointer"
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
                <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-lg border border-amber-100 dark:border-amber-900/40">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    📢 {previewMessage}
                  </p>
                  {reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                      Nội dung: {reason}
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
            </>
          )}

          {/* Fixed Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              {enabled && (
                <button
                  type="button"
                  onClick={() => handleSaveConfig(false)}
                  disabled={loading}
                  className="px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors cursor-pointer"
                >
                  Tắt bảo trì ngay
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || fetching}
                className={`px-4 sm:px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
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
                    {enabled ? 'Lưu & Bật bảo trì' : 'Lưu cài đặt'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
