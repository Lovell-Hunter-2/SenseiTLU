import React, { useState, useEffect } from 'react';
import { Wrench, RefreshCw, ShieldAlert, LogIn, Clock } from 'lucide-react';
import {
  MaintenanceConfig,
  formatMaintenanceMessage,
  parseMaintenanceDate,
  formatTimeRemaining,
} from '../types/maintenance';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BowingMascot3D from './BowingMascot3D';

interface MaintenanceScreenProps {
  config: MaintenanceConfig;
  onRefresh?: () => void;
}

export default function MaintenanceScreen({ config, onRefresh }: MaintenanceScreenProps) {
  const { user, isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const [loggingIn, setLoggingIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  // Tự động đếm từng giây để cập nhật thời gian còn lại
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const message = formatMaintenanceMessage(config.startTime, config.endTime);
  const endMs = parseMaintenanceDate(config.endTime);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAdminLogin = async () => {
    setLoggingIn(true);
    try {
      await login();
      navigate('/admin');
    } catch (err) {
      console.error('Đăng nhập thất bại:', err);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* Main Layout: Flanked by 2 Bowing 3D Mascots */}
      <div className="relative z-10 w-full max-w-6xl px-2 sm:px-4 flex flex-col items-center justify-center">
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 xl:gap-12">
          
          {/* Left 3D Bowing Mascot (Desktop/Large Screen) */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-52 xl:w-60">
            <BowingMascot3D
              side="left"
              badgeText="Xin lỗi bạn nhiều nha... 🙇‍♂️"
              className="hover:scale-105 transition-transform"
            />
          </div>

          {/* Center Card */}
          <div className="max-w-lg w-full text-center space-y-5 px-2">
            {/* Animated Icon Badge */}
            <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-amber-500/20 to-orange-500/20 blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-3xl bg-slate-900/90 border border-amber-500/30 p-5 flex items-center justify-center shadow-2xl backdrop-blur-md">
                <Wrench className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 animate-[wiggle_3s_ease-in-out_infinite]" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider shadow-md">
                Bảo trì
              </span>
            </div>

            {/* Branding & Status with avt_tlu official logo */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300 shadow-xs">
                <img
                  src="/avt_tlu (remove).png"
                  alt="SenseiTLU Logo"
                  className="w-4 h-4 rounded-full object-contain shrink-0"
                />
                <span>Nâng Cấp Hệ Thống SenseiTLU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Hệ Thống Đang Bảo Trì
              </h1>
            </div>

            {/* User-facing message card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-3">
              <p className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed">
                {message}
              </p>

              {/* Real-time countdown if endTime is specified and in future */}
              {endMs && endMs > nowMs && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    Dự kiến kết thúc sau: <strong className="text-white">{formatTimeRemaining(endMs, nowMs)}</strong>
                  </span>
                </div>
              )}

              {config.reason && (
                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Nội dung: {config.reason}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Tải lại trang</span>
              </button>

              {!isAdmin && (
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  disabled={loggingIn}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 active:scale-98 text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>{loggingIn ? 'Đang xác thực...' : 'Quản trị viên đăng nhập'}</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Vào trang Quản trị (Admin)</span>
                </button>
              )}
            </div>

            {/* Mobile View: 2 Bowing Mascots side-by-side underneath */}
            <div className="flex lg:hidden items-center justify-center gap-2 sm:gap-6 pt-4 pb-1">
              <BowingMascot3D
                side="left"
                badgeText="Xin lỗi nha 🙇"
                className="scale-90"
              />
              <BowingMascot3D
                side="right"
                badgeText="Thông cảm ạ 🙇"
                className="scale-90"
              />
            </div>

            {/* Footer small note */}
            <p className="text-[11px] text-slate-500 pt-2 sm:pt-4">
              SenseiTLU xin lỗi vì sự bất tiện này. Chúng tôi đang nỗ lực hoàn thiện hệ thống sớm nhất có thể.
            </p>
          </div>

          {/* Right 3D Bowing Mascot (Desktop/Large Screen) */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-52 xl:w-60">
            <BowingMascot3D
              side="right"
              badgeText="Mong bạn thông cảm ạ! 🙇‍♀️"
              className="hover:scale-105 transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
