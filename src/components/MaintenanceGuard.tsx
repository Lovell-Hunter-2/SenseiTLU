import React, { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MaintenanceConfig } from '../types/maintenance';
import { useAuth } from '../contexts/AuthContext';
import MaintenanceScreen from './MaintenanceScreen';
import MaintenanceModal from './MaintenanceModal';
import { Wrench, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);

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
    // Initial fetch on mount (load/reload page)
    fetchConfig();

    // Listen to real-time changes
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

  // While checking auth on first load
  if (authLoading && loading) {
    return <>{children}</>;
  }

  // If maintenance is enabled
  if (config && config.enabled) {
    // If admin is logged in, grant full access and show indicator
    if (isAdmin) {
      return (
        <>
          {/* Admin warning floating banner */}
          <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-amber-950" />
              <span>
                <strong>Chế độ Bảo trì đang BẬT:</strong> Người dùng thông thường hiện đang bị chặn truy cập.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdminModal(true)}
                className="px-2.5 py-1 bg-amber-950 text-amber-200 hover:bg-black rounded-lg text-xs font-bold transition-colors"
              >
                Cài đặt / Tắt bảo trì
              </button>
              {location.pathname !== '/admin' && (
                <Link
                  to="/admin"
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
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

    // If user is currently on /admin path, let them see the Admin page (which contains login button)
    if (location.pathname.startsWith('/admin')) {
      return <>{children}</>;
    }

    // Non-admin users see the maintenance screen
    return <MaintenanceScreen config={config} onRefresh={fetchConfig} />;
  }

  // Maintenance is not enabled
  return <>{children}</>;
}
