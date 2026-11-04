import React, { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  MaintenanceConfig,
  getMaintenanceStatus,
  formatTimeRemaining,
  parseMaintenanceDate,
  formatMaintenanceMessage,
} from '../types/maintenance';
import { useAuth } from '../contexts/AuthContext';
import MaintenanceScreen from './MaintenanceScreen';
import MaintenanceModal from './MaintenanceModal';
import { AlertTriangle, ArrowRight, Clock, Bell, X } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [dismissScheduledNotice, setDismissScheduledNotice] = useState(false);

  // Precision 1-second interval for automatic start & end transitions
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'maintenance'));
      if (snap.exists()) {
        setConfig(snap.data() as MaintenanceConfig);
      } else {
        setConfig({ enabled: false, startTime: '', endTime: '' });
      }
    } catch (err) {
      console.warn('Không thể kiểm tra trạng thái bảo trì:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    const unsub = onSnapshot(
      doc(db, 'settings', 'maintenance'),
      (snap) => {
        if (snap.exists()) {
          setConfig(snap.data() as MaintenanceConfig);
        } else {
          setConfig({ enabled: false, startTime: '', endTime: '' });
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Lỗi listener bảo trì:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [fetchConfig]);

  // If user is admin and maintenance has expired past endTime, clean up Firestore enabled flag
  useEffect(() => {
    if (!isAdmin || !config || !config.enabled) return;
    const endMs = parseMaintenanceDate(config.endTime);
    if (endMs !== null && nowMs >= endMs) {
      updateDoc(doc(db, 'settings', 'maintenance'), {
        enabled: false,
        autoDisabledAt: new Date().toISOString(),
      }).catch((err) => console.warn('Lỗi tự động tắt bảo trì:', err));
    }
  }, [isAdmin, config, nowMs]);

  // While checking auth on initial load
  if (authLoading && loading) {
    return <>{children}</>;
  }

  const currentStatus = getMaintenanceStatus(config, nowMs);
  const endMs = parseMaintenanceDate(config?.endTime);
  const startMs = parseMaintenanceDate(config?.startTime);

  // 1. ACTIVE MAINTENANCE: Currently within scheduled window or enabled manually
  if (currentStatus === 'active') {
    // Admin bypass: grant access and show high-priority admin banner
    if (isAdmin) {
      return (
        <>
          {/* Admin warning floating banner (z-[60] stays above layout headers and mobile bars) */}
          <div className="sticky top-0 z-[60] bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-amber-950" />
              <span>
                <strong>Chế độ Bảo trì đang BẬT:</strong> Người dùng thông thường hiện đang bị chặn truy cập.
                {endMs && (
                  <span className="ml-1 text-amber-950 font-normal">
                    (Tự động tắt sau: <strong>{formatTimeRemaining(endMs, nowMs)}</strong>)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="px-2.5 py-1 bg-amber-950 text-amber-200 hover:bg-black rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cài đặt / Tắt bảo trì
              </button>
              {location.pathname !== '/admin' && (
                <Link
                  to="/admin"
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Vào Admin <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          <MaintenanceModal
            isOpen={showAdminModal}
            onClose={() => setShowAdminModal(false)}
            onSaved={(newCfg) => setConfig(newCfg)}
          />

          {children}
        </>
      );
    }

    // Allow accessing /admin route for login attempt
    if (location.pathname.startsWith('/admin')) {
      return <>{children}</>;
    }

    // Non-admin visitor is gated by the maintenance screen
    return <MaintenanceScreen config={config!} onRefresh={fetchConfig} />;
  }

  // 2. SCHEDULED MAINTENANCE: Start time is in the future
  if (currentStatus === 'scheduled' && config) {
    return (
      <>
        {/* Subtle top notification for upcoming maintenance */}
        {!dismissScheduledNotice && (
          <div className="sticky top-0 z-[60] bg-blue-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 shrink-0 animate-bounce text-blue-200" />
              <span>
                <strong>Thông báo:</strong> Hệ thống đã lên lịch bảo trì nâng cấp.{' '}
                {startMs && (
                  <span>
                    Tự động bật sau: <strong>{formatTimeRemaining(startMs, nowMs)}</strong>.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="px-2 py-0.5 bg-blue-800 hover:bg-blue-900 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Chỉnh giờ
                </button>
              )}
              <button
                type="button"
                onClick={() => setDismissScheduledNotice(true)}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <MaintenanceModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSaved={(newCfg) => setConfig(newCfg)}
        />

        {children}
      </>
    );
  }

  // 3. INACTIVE: Normal site access
  return <>{children}</>;
}
