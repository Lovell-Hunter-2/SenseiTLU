import React, { useState, useEffect } from "react";
import "@google/model-viewer";
import { 
  X, 
  UploadCloud, 
  Cloud, 
  Link as LinkIcon, 
  Monitor, 
  Smartphone, 
  Layers, 
  Sparkles, 
  Clock, 
  FileText, 
  Compass, 
  CheckCircle2,
  Columns,
  Ruler,
  Eye,
  Palette,
  Snowflake,
  RotateCcw,
  Check,
  AlertCircle
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { setCachedData, CacheTTL } from "../services/cacheService";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  BannerConfig,
  DEFAULT_BANNER_CONFIG,
  DEFAULT_MAIN_MASCOT,
  MASCOT_OPTIONS,
  WebTheme,
} from "../types/banner";

const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || "";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

const DrivePicker = ({ onPick }: { onPick: (url: string) => void }) => {
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly',
    onSuccess: (tokenResponse) => {
      const loadPicker = async () => {
         await new Promise((resolve) => {
            if ((window as any).google?.picker) {
                resolve(true);
            } else {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    (window as any).gapi.load('picker', () => resolve(true));
                }
                document.body.appendChild(script);
            }
         });
         
         const pickerOrigin =
          window.location.ancestorOrigins &&
          window.location.ancestorOrigins.length > 0
            ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
            : window.location.origin;

        const view = new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.DOCS)
          .setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,image/gif');

        const picker = new (window as any).google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(tokenResponse.access_token)
          .setCallback((data: any) => {
            if (data.action === (window as any).google.picker.Action.PICKED) {
              const file = data.docs[0];
              onPick(`https://drive.google.com/uc?id=${file.id}`);
            }
          })
          .setOrigin(pickerOrigin)
          .build();
        picker.setVisible(true);
      };
      loadPicker();
    }
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-semibold"
    >
      <Cloud className="w-3.5 h-3.5" /> Drive
    </button>
  );
};

/* =========================================================================
   REALISTIC MINI LIVE PREVIEWS (Mô phỏng thực tế giao diện khi hiển thị)
   ========================================================================= */

// 1. Desktop Subject Detail Skyscraper Preview
const SidesLivePreview = ({ leftUrl, rightUrl }: { leftUrl?: string; rightUrl?: string }) => (
  <div className="w-full rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl p-3 text-slate-100 select-none">
    {/* Browser Bar */}
    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500/80" />
        <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
        <span className="w-2 h-2 rounded-full bg-green-500/80" />
        <span className="ml-2 font-mono text-slate-500 text-[9px]">senseitlu.edu.vn/subject/tieng-anh</span>
      </div>
      <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
        <Monitor className="w-3 h-3" /> Màn hình máy tính (Môn học)
      </span>
    </div>

    {/* Top Navbar */}
    <div className="flex items-center justify-between py-1 px-2 mb-2.5 bg-slate-900/80 rounded-lg text-[9px] text-slate-400 border border-slate-800/60">
      <div className="flex items-center gap-2 font-bold text-white">
        <span className="text-blue-400">🎓</span> SenseiTLU
        <span className="font-normal text-slate-400 ml-1">Trang chủ</span>
        <span className="font-normal text-slate-400">Blog</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[8px] text-amber-300">22:00</span>
        <div className="w-4 h-4 rounded-full bg-blue-500 text-[8px] text-center font-bold text-white leading-4">A</div>
      </div>
    </div>

    {/* 3-Column Layout: Left Skyscraper - Content Center - Right Skyscraper */}
    <div className="flex justify-between items-start gap-2 min-h-[175px]">
      {/* Left Skyscraper Column */}
      <div className="w-16 shrink-0 flex flex-col items-center">
        {leftUrl ? (
          <div className="w-full rounded-lg overflow-hidden border border-blue-500/50 shadow-lg bg-slate-900">
            <img src={leftUrl} alt="Banner trái" className="w-full h-36 object-contain object-top" />
          </div>
        ) : (
          <div className="w-full h-36 border border-dashed border-slate-800 rounded-lg flex items-center justify-center p-1 text-center bg-slate-900/30">
            <span className="text-[7.5px] text-slate-600 font-medium leading-tight">Chưa đặt banner trái</span>
          </div>
        )}
      </div>

      {/* Middle Content */}
      <div className="flex-1 max-w-[280px] mx-auto text-center space-y-1 py-0.5">
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-white">
          <span>📘 Tiếng Anh đầu ra</span>
        </div>
        <div className="w-fit mx-auto px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-[7px] text-blue-300">
          Lượt truy cập: Hôm nay: 5 • Tổng: 420
        </div>
        <div className="w-44 mx-auto py-1 px-2 rounded-full bg-slate-900 border border-slate-800 text-[8px] text-slate-500 text-left truncate">
          🔍 Tìm kiếm môn học khác...
        </div>

        {/* Action bar & Cards */}
        <div className="text-left pt-1">
          <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Tài liệu môn học</span>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div className="p-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-[7px]">
              <span className="block font-semibold text-slate-200 truncate">Destination B1</span>
              <div className="mt-1 bg-blue-600 text-white rounded text-[7px] px-1 py-0.5 w-fit">Xem tài liệu</div>
            </div>
            <div className="p-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-[7px]">
              <span className="block font-semibold text-slate-200 truncate">English Vocab</span>
              <div className="mt-1 bg-blue-600 text-white rounded text-[7px] px-1 py-0.5 w-fit">Xem tài liệu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Skyscraper Column */}
      <div className="w-16 shrink-0 flex flex-col items-center">
        {rightUrl ? (
          <div className="w-full rounded-lg overflow-hidden border border-blue-500/50 shadow-lg bg-slate-900">
            <img src={rightUrl} alt="Banner phải" className="w-full h-36 object-contain object-top" />
          </div>
        ) : (
          <div className="w-full h-36 border border-dashed border-slate-800 rounded-lg flex items-center justify-center p-1 text-center bg-slate-900/30">
            <span className="text-[7.5px] text-slate-600 font-medium leading-tight">Chưa đặt banner phải</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// 2. Desktop Home Hero Preview
const HeroLivePreview = ({ leftUrl, rightUrl }: { leftUrl?: string; rightUrl?: string }) => (
  <div className="w-full rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl p-3 text-slate-100 select-none">
    {/* Browser Bar */}
    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500/80" />
        <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
        <span className="w-2 h-2 rounded-full bg-green-500/80" />
        <span className="ml-2 font-mono text-slate-500 text-[9px]">senseitlu.edu.vn</span>
      </div>
      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
        <Monitor className="w-3 h-3" /> Trang chủ máy tính (Hero)
      </span>
    </div>

    {/* Top Navbar */}
    <div className="flex items-center justify-between py-1 px-2 mb-2 bg-slate-900/80 rounded-lg text-[9px] text-slate-400 border border-slate-800/60">
      <div className="flex items-center gap-2 font-bold text-white">
        <span className="text-blue-400">🎓</span> SenseiTLU
        <span className="font-normal text-blue-400 ml-1">Trang chủ</span>
        <span className="font-normal text-slate-400">Blog</span>
      </div>
      <div className="w-4 h-4 rounded-full bg-blue-500 text-[8px] text-center font-bold text-white leading-4">A</div>
    </div>

    {/* Hero Section with left & right images flanking search */}
    <div className="relative flex items-center justify-between gap-2 py-3 px-2 bg-slate-900/40 rounded-xl min-h-[125px]">
      {/* Left Hero Image */}
      <div className="w-20 shrink-0 flex items-center justify-center">
        {leftUrl ? (
          <img src={leftUrl} alt="Hero Trái" className="max-w-full max-h-20 object-contain drop-shadow-md rounded-lg" />
        ) : (
          <div className="w-16 h-16 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-[7px] text-slate-600 text-center p-1 bg-slate-900/20">
            Chưa đặt ảnh trái
          </div>
        )}
      </div>

      {/* Middle Hero Title & Search */}
      <div className="flex-1 text-center space-y-1">
        <div className="text-xs font-extrabold text-white">
          📚 Tài liệu <span className="text-blue-400">SenseiTLU</span>
        </div>
        <p className="text-[8px] text-slate-400 max-w-[200px] mx-auto truncate">
          Nền tảng chia sẻ tài liệu học tập sinh viên TLU
        </p>
        <div className="w-48 mx-auto py-1 px-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-[8px] text-slate-400 text-left flex items-center gap-1.5 shadow-xs">
          <span>🔍</span> Tìm môn học...
        </div>
      </div>

      {/* Right Hero Image */}
      <div className="w-20 shrink-0 flex items-center justify-center">
        {rightUrl ? (
          <img src={rightUrl} alt="Hero Phải" className="max-w-full max-h-20 object-contain drop-shadow-md rounded-lg" />
        ) : (
          <div className="w-16 h-16 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-[7px] text-slate-600 text-center p-1 bg-slate-900/20">
            Chưa đặt ảnh phải
          </div>
        )}
      </div>
    </div>

    {/* Subject Cards Preview */}
    <div className="mt-2 pt-2 border-t border-slate-900/80">
      <span className="text-[8px] font-bold uppercase text-slate-500 tracking-wider">Danh sách môn học</span>
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-[7px] text-slate-300">
          📘 English Books
        </div>
        <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-[7px] text-slate-300">
          🌐 Tiếng Anh 1
        </div>
        <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-[7px] text-slate-300">
          💻 Cơ sở dữ liệu
        </div>
      </div>
    </div>
  </div>
);

// 3. Mobile Live Phone Preview
const MobileLivePreview = ({ bannerUrl }: { bannerUrl?: string }) => (
  <div className="w-full flex justify-center py-2 select-none">
    <div className="w-60 bg-slate-950 border-4 border-slate-700 rounded-3xl p-3 shadow-2xl relative flex flex-col overflow-hidden text-slate-100">
      {/* Top Phone Notch / Island */}
      <div className="w-16 h-2.5 bg-slate-800 rounded-full mx-auto mb-2 shrink-0" />

      {/* Phone Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[9px] text-slate-400">
        <span className="font-bold text-white flex items-center gap-1">
          <span className="text-blue-400">🎓</span> SenseiTLU
        </span>
        <span className="text-[10px]">☰</span>
      </div>

      {/* Clock widget pill */}
      <div className="flex items-center justify-center gap-2 my-1 text-[8px] text-slate-400">
        <span className="bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 text-amber-300">🌸 22:00</span>
        <span className="bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">🌱 2h 40s</span>
      </div>

      {/* Title */}
      <div className="text-center my-0.5">
        <div className="text-[10px] font-bold text-white">📚 Tài liệu SenseiTLU</div>
      </div>

      {/* Search Input */}
      <div className="w-full py-1 px-2 rounded-xl bg-slate-900 border border-slate-800 text-[8px] text-slate-400 text-left mb-1.5">
        🔍 Tìm môn học...
      </div>

      {/* The Horizontal Mobile Banner */}
      <div className="w-full my-1">
        {bannerUrl ? (
          <div className="w-full h-12 rounded-lg overflow-hidden border border-amber-500/50 shadow-xs bg-slate-900">
            <img src={bannerUrl} alt="Banner ngang" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-10 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-[7.5px] text-slate-600 bg-slate-900/30">
            Chưa đặt banner ngang
          </div>
        )}
      </div>

      {/* Subject List */}
      <div className="mt-1 space-y-1">
        <div className="text-[7px] font-bold uppercase text-slate-500">Danh sách môn học</div>
        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[8px] flex justify-between items-center">
          <span>📘 English Books</span>
          <span className="text-[7px] text-blue-400">Xem ngay →</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[8px] flex justify-between items-center">
          <span>🌐 Tiếng Anh đầu ra</span>
          <span className="text-[7px] text-blue-400">Xem ngay →</span>
        </div>
      </div>
    </div>
  </div>
);

// 4. Pop-up Live Dialog Preview (Frameless clean image with floating X)
const PopupLivePreview = ({
  imageUrl,
  title,
  enabled,
}: {
  imageUrl?: string;
  title?: string;
  enabled?: boolean;
}) => (
  <div className="w-full rounded-2xl bg-slate-950 border border-slate-800/90 p-5 relative overflow-hidden shadow-2xl min-h-[190px] flex items-center justify-center select-none">
    {/* Dimmed mock background */}
    <div className="w-full flex items-center justify-center">
      {enabled && imageUrl ? (
        <div className="relative flex flex-col items-center animate-in zoom-in-95 duration-200">
          {/* Optional title badge if admin explicitly filled title */}
          {title && title.trim() && (
            <div className="mb-2 px-2.5 py-0.5 bg-slate-900 text-white rounded-full border border-slate-700 text-[9px] font-semibold flex items-center gap-1 shadow-md">
              <span>{title}</span>
            </div>
          )}

          {/* Clean image with floating X button on corner */}
          <div className="relative">
            <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-slate-900 hover:bg-red-600 text-white rounded-full flex items-center justify-center border border-white/20 shadow-xl text-[10px] font-bold z-10">
              ✕
            </div>
            <div className="w-64 max-h-48 rounded-2xl overflow-hidden shadow-2xl bg-transparent flex items-center justify-center border border-slate-700/40">
              <img src={imageUrl} alt="Popup preview" className="w-full h-auto max-h-44 object-contain rounded-2xl" />
            </div>
          </div>

          {/* Subtle skip link underneath */}
          <span className="mt-2 text-[10px] text-slate-400 hover:text-white underline">
            Bỏ qua quảng cáo
          </span>
        </div>
      ) : (
        <div className="text-center p-5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
          <span className="text-xs text-slate-400 font-medium block">
            {!enabled ? '⚠️ Pop-up hiện đang TẮT (Gạt công tắc Bật phía trên để kích hoạt)' : 'Chưa có link ảnh Pop-up'}
          </span>
        </div>
      )}
    </div>
  </div>
);

// 5. Web UI Theme Live Comparison Preview (Immune to active page theme via .xmas-preview-preserve)
const WebThemeLivePreview = ({ theme }: { theme: WebTheme }) => {
  const isXmas = theme === "christmas";
  return (
    <div
      className="xmas-preview-preserve w-full rounded-2xl overflow-hidden border select-none shadow-lg transition-all"
      style={{
        backgroundColor: isXmas ? "#0D2B1F" : "#020617",
        borderColor: isXmas ? "#2D6A4F" : "#1E293B",
        color: isXmas ? "#F0EDE8" : "#F8FAFC",
      }}
    >
      {/* Mini Navbar */}
      <div
        className="px-3 py-2 flex items-center justify-between border-b"
        style={{
          backgroundColor: isXmas ? "#07160E" : "#0F172A",
          borderColor: isXmas ? "#2D6A4F" : "#1E293B",
        }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span>{isXmas ? "🎄" : "🎓"}</span>
          <span
            style={{
              color: isXmas ? "#F5C842" : "#60A5FA",
              fontFamily: isXmas ? "'Playfair Display', Georgia, serif" : undefined,
            }}
          >
            SenseiTLU
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8.5px]" style={{ color: isXmas ? "#B8C4BB" : "#94A3B8" }}>
          <span style={{ color: isXmas ? "#F5C842" : "#60A5FA", fontWeight: 600 }}>Trang chủ</span>
          <span>Blog</span>
          <span style={{ color: isXmas ? "#E74C3C" : "#FB7185", fontWeight: 700 }}>Ủng hộ</span>
        </div>
      </div>

      {/* Festive Fairy Light Line for Christmas */}
      {isXmas && (
        <div className="flex items-center justify-around px-3 py-1" style={{ backgroundColor: "#07160E" }}>
          {["#F5C842", "#E74C3C", "#A8D8EA", "#FFD700", "#2D6A4F", "#F5C842", "#C0392B", "#A8D8EA"].map((c, idx) => (
            <span
              key={idx}
              className="w-1 h-1 rounded-full block"
              style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
            />
          ))}
        </div>
      )}

      {/* Mini Hero & Cards */}
      <div className="p-3 space-y-2.5">
        <div className="text-center space-y-1">
          {isXmas && (
            <div className="text-[8px] font-medium" style={{ color: "#F5C842" }}>
              ✦ Merry &amp; Bright · Deep Forest Night ✦
            </div>
          )}
          <div
            className="text-xs font-bold"
            style={{
              fontFamily: isXmas ? "'Playfair Display', Georgia, serif" : undefined,
              color: isXmas ? "#F0EDE8" : "#F8FAFC",
            }}
          >
            {isXmas ? "🎄" : "📚"} Tài liệu{" "}
            <span style={{ color: isXmas ? "#F5C842" : "#60A5FA" }}>SenseiTLU</span>
          </div>
          <div
            className="mx-auto max-w-[200px] h-5 rounded-lg border px-2 flex items-center text-[8px]"
            style={{
              backgroundColor: isXmas ? "#07160E" : "#0F172A",
              borderColor: isXmas ? "#2D6A4F" : "#334155",
              color: isXmas ? "#B8C4BB" : "#64748B",
            }}
          >
            Tìm môn học...
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["Tiếng Anh đầu ra", "Cơ sở dữ liệu"].map((title) => (
            <div
              key={title}
              className="p-2 rounded-xl border space-y-1.5"
              style={{
                backgroundColor: isXmas ? "#1B4332" : "#0F172A",
                borderColor: isXmas ? "#2D6A4F" : "#1E293B",
              }}
            >
              <div className="text-[9px] font-bold truncate" style={{ color: isXmas ? "#F0EDE8" : "#F1F5F9" }}>
                {title}
              </div>
              <div
                className="w-full py-1 rounded-lg text-center text-[8.5px] font-bold"
                style={{
                  backgroundColor: isXmas ? "#F5C842" : "#22D3EE",
                  color: isXmas ? "#07160E" : "#0F172A",
                  boxShadow: isXmas ? "0 0 12px rgba(245,200,66,0.35)" : undefined,
                }}
              >
                Xem ngay →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */

export default function HeroImageManagerModal(props: Props) {
  if (!CLIENT_ID) {
    return <HeroImageManagerModalContent {...props} />;
  }
  
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <HeroImageManagerModalContent {...props} />
    </GoogleOAuthProvider>
  );
}

function HeroImageManagerModalContent({
  isOpen,
  onClose,
  inline,
}: Props) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'sides' | 'hero' | 'mobile' | 'popup'>('appearance');
  
  // Banner & appearance config state
  const [form, setForm] = useState<BannerConfig>(DEFAULT_BANNER_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen || inline) {
      const fetchImages = async () => {
        try {
          const docRef = doc(db, "settings", "heroImages");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setForm({
              ...DEFAULT_BANNER_CONFIG,
              ...data,
              webTheme: data.webTheme === 'christmas' ? 'christmas' : 'default',
              mainMascot: data.mainMascot || DEFAULT_MAIN_MASCOT,
              heroLeftUrl: data.heroLeftUrl || data.leftUrl || '',
              heroLeftLinkUrl: data.heroLeftLinkUrl || data.leftLinkUrl || '',
              heroRightUrl: data.heroRightUrl || data.rightUrl || '',
              heroRightLinkUrl: data.heroRightLinkUrl || data.rightLinkUrl || '',
              sideLeftUrl: data.sideLeftUrl || '',
              sideLeftLinkUrl: data.sideLeftLinkUrl || '',
              sideRightUrl: data.sideRightUrl || '',
              sideRightLinkUrl: data.sideRightLinkUrl || '',
              mobileBannerUrl: data.mobileBannerUrl || '',
              mobileBannerLinkUrl: data.mobileBannerLinkUrl || '',
              popupEnabled: Boolean(data.popupEnabled),
              popupImageUrl: data.popupImageUrl || '',
              popupLinkUrl: data.popupLinkUrl || '',
              popupTitle: data.popupTitle || '',
              popupTriggerType: data.popupTriggerType || 'time',
              popupFrequency: Number(data.popupFrequency) || 15,
            });
          }
        } catch (e) {
          console.error("Error fetching hero/banner config:", e);
        }
      };
      fetchImages();
    }
  }, [isOpen, inline]);

  if (!isOpen && !inline) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveFeedback(null);
    try {
      const payload: BannerConfig = {
        ...form,
        webTheme: form.webTheme === 'christmas' ? 'christmas' : 'default',
        mainMascot: form.mainMascot || DEFAULT_MAIN_MASCOT,
        // Keep legacy leftUrl / rightUrl in sync with hero images
        leftUrl: form.heroLeftUrl || form.leftUrl || '',
        leftLinkUrl: form.heroLeftLinkUrl || form.leftLinkUrl || '',
        rightUrl: form.heroRightUrl || form.rightUrl || '',
        rightLinkUrl: form.heroRightLinkUrl || form.rightLinkUrl || '',
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "settings", "heroImages"), payload, { merge: true });

      // Instantly update cache and dispatch live event across all open windows/tabs
      const broadcastPayload: BannerConfig = {
        ...payload,
        updatedAt: Date.now(),
      };
      setCachedData("hero_images_settings", broadcastPayload, CacheTTL.LONG);
      setCachedData("sensei_banner_config_v2", broadcastPayload, CacheTTL.LONG);
      window.dispatchEvent(
        new CustomEvent("sensei_hero_images_updated", {
          detail: broadcastPayload,
        })
      );

      if (onClose) {
        onClose();
      } else {
        setSaveFeedback({
          type: 'success',
          message: 'Đã lưu cấu hình Giao diện web, Mascot 3D & Banner thành công! Mọi thay đổi áp dụng ngay lập tức.',
        });
      }
    } catch (error: any) {
      console.error("Error saving appearance & banners:", error);
      setSaveFeedback({
        type: 'error',
        message: `Đã xảy ra lỗi khi lưu: ${error.message || "Lỗi không xác định"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (field: keyof BannerConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/gif" && file.size > 700 * 1024) {
      alert("Kích thước ảnh GIF quá lớn. Vui lòng chọn GIF dưới 700KB.");
      return;
    } else if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type === "image/gif") {
        setForm((prev) => ({ ...prev, [field]: reader.result as string }));
      } else {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_SIZE = 1400;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/webp", 0.85);
          setForm((prev) => ({ ...prev, [field]: compressedBase64 }));
        };
        img.src = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedMascotObj =
    MASCOT_OPTIONS.find((m) => m.src === (form.mainMascot || DEFAULT_MAIN_MASCOT)) ||
    MASCOT_OPTIONS[0];

  const content = (
    <div className={`bg-white dark:bg-slate-900 ${inline ? "" : "rounded-2xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh]"}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Quản Lý Giao Diện, Mascot &amp; Banner
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chuyển đổi chủ đề giao diện toàn web, chọn linh vật 3D chính và thiết lập banner quảng cáo kèm Live Preview.
          </p>
        </div>
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 5 Tabs: Giao diện web đứng đầu tiên, tiếp theo là 4 tab Banner */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mt-4 mb-6 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'appearance'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Giao diện web</span>
          {form.webTheme === 'christmas' && (
            <span className="text-[11px] leading-none" aria-hidden="true">🎄</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sides')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'sides'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>Banner Dọc 2 Bên Lề</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'hero'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Ảnh Trang Chủ (Hero)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'mobile'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Điện Thoại (Ngang)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('popup')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'popup'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Quảng Cáo Pop-up</span>
          {form.popupEnabled && (
            <span className="text-[10px] font-bold text-emerald-500">ON</span>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ================= TAB 0: GIAO DIỆN WEB (CHỦ ĐỀ UI & MASCOT 3D) ================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* SECTION A: CHỦ ĐỀ GIAO DIỆN WEBSITE */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-500" />
                    Chủ đề Giao diện Website (Đồng bộ toàn web &amp; Admin)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Admin quyết định giao diện chung cho toàn bộ người dùng. Không làm tăng lượt đọc Firestore.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 shrink-0">
                  Đang chọn:{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {form.webTheme === 'christmas' ? 'Giáng Sinh (Deep Forest Night)' : 'Mặc định (Default)'}
                  </strong>
                </span>
              </div>

              {/* 2 Theme Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Default Theme */}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, webTheme: 'default' }))}
                  className={`text-left p-4 rounded-2xl border-2 transition-all space-y-3 cursor-pointer ${
                    (form.webTheme || 'default') === 'default'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/15 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>Mặc định (Default)</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Giao diện SenseiTLU nguyên bản hiện đại với sắc xanh dương &amp; cyan.
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        (form.webTheme || 'default') === 'default'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {(form.webTheme || 'default') === 'default' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="xmas-preview-preserve flex items-center gap-1.5">
                    {['#020617', '#0F172A', '#1E293B', '#2563EB', '#22D3EE', '#F8FAFC'].map((hex) => (
                      <span
                        key={hex}
                        className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>

                  <WebThemeLivePreview theme="default" />
                </button>

                {/* Option 2: Christmas Deep Forest Night Theme */}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, webTheme: 'christmas' }))}
                  className={`text-left p-4 rounded-2xl border-2 transition-all space-y-3 cursor-pointer ${
                    form.webTheme === 'christmas'
                      ? 'border-amber-400 bg-amber-500/10 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Snowflake className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Giáng Sinh — Deep Forest Night</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Bảng màu rừng thông đêm đông, nút vàng kim, font Playfair Display, tuyết rơi &amp; đèn lễ hội.
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        form.webTheme === 'christmas'
                          ? 'bg-amber-400 border-amber-400 text-slate-950'
                          : 'border-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {form.webTheme === 'christmas' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Color Swatches from Christmas UI Kit */}
                  <div className="xmas-preview-preserve flex items-center gap-1.5">
                    {['#07160E', '#0D2B1F', '#1B4332', '#2D6A4F', '#F5C842', '#C0392B', '#A8D8EA', '#F0EDE8'].map((hex) => (
                      <span
                        key={hex}
                        className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>

                  <WebThemeLivePreview theme="christmas" />
                </button>
              </div>
            </div>

            {/* SECTION B: CHỌN MASCOT 3D CHÍNH */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Chọn Mascot 3D Chính ({MASCOT_OPTIONS.length} mẫu có sẵn)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Áp dụng cho linh vật nổi ở góc màn hình Trang chủ (Desktop &amp; Mobile). Mặc định hiện tại là CapyTLU Măng Tô.
                  </p>
                </div>
                {(form.mainMascot || DEFAULT_MAIN_MASCOT) !== DEFAULT_MAIN_MASCOT && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, mainMascot: DEFAULT_MAIN_MASCOT }))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Về Măng Tô (Mặc định)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* 7 Mascot Selection Cards */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MASCOT_OPTIONS.map((mascot) => {
                    const isSelected = (form.mainMascot || DEFAULT_MAIN_MASCOT) === mascot.src;
                    return (
                      <button
                        key={mascot.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, mainMascot: mascot.src }))}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {mascot.name}
                            </span>
                            {mascot.tag && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                · {mascot.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                            {mascot.description}
                          </p>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {mascot.src.replace('/', '')}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Single Interactive 3D Live Preview Stage (1 WebGL context for smooth performance) */}
                <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-950/90 p-4 justify-between min-h-[280px]">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      Xem trước 3D trực tiếp
                    </span>
                    <span className="text-[10px] text-slate-400">Kéo để xoay góc nhìn</span>
                  </div>

                  <div className="relative flex-1 flex items-center justify-center min-h-[200px] my-2">
                    <model-viewer
                      key={selectedMascotObj.src}
                      src={selectedMascotObj.src}
                      alt={selectedMascotObj.name}
                      camera-controls
                      auto-rotate
                      rotation-per-second="18deg"
                      disable-zoom
                      camera-orbit="0deg 78deg 100%"
                      field-of-view="28deg"
                      environment-image="neutral"
                      tone-mapping="neutral"
                      exposure="1.2"
                      shadow-intensity="1"
                      shadow-softness="0.35"
                      interaction-prompt="none"
                      style={{
                        width: "100%",
                        height: "210px",
                        backgroundColor: "transparent",
                      }}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate">{selectedMascotObj.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {selectedMascotObj.src}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 shrink-0">
                      Sẵn sàng hiển thị
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BANNER DỌC 2 BÊN LỀ (SKYSCRAPER SÁT LỀ) ================= */}
        {activeTab === 'sides' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Guide & Size Recommendation Box */}
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>KÍCH THƯỚC CHUẨN KHUYẾN NGHỊ CHO BANNER DỌC (SKYSCRAPER):</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                • <strong>Kích thước chuẩn:</strong> <code>160 x 600 px</code> hoặc <code>300 x 600 px</code> (Tỉ lệ dọc từ <strong>1:3 đến 1:4</strong> như <code>200 x 700 px</code> hoặc <code>240 x 800 px</code>).<br />
                • <strong>Vị trí hiển thị:</strong> Chạy dọc dài cố định 2 bên mép lề (sát lề ngoài cùng) của trang <strong>Môn học</strong> và trên màn hình máy tính siêu dài (&ge;1800px). Hiển thị thuần ảnh quảng cáo không bị dính chữ hay nhãn che chắn.
              </p>
            </div>

            {/* LIVE REALISTIC PREVIEW FOR SIDES */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-400" /> Mô phỏng thực tế trang Môn học (Máy tính):
                </span>
                <span className="text-[11px] text-slate-400">2 banner dọc bám sát 2 bên mép lề</span>
              </div>
              <SidesLivePreview leftUrl={form.sideLeftUrl} rightUrl={form.sideRightUrl} />
            </div>

            {/* Banner Dọc Bên Trái */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Banner Dọc Bên Trái (Sát lề trái)
                </label>
                {form.sideLeftUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, sideLeftUrl: '', sideLeftLinkUrl: '' }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa banner dọc trái
                  </button>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link ảnh banner dọc (Khuyên dùng ảnh dọc 160x600 hoặc 300x600):</span>
                <input
                  type="text"
                  placeholder="https://example.com/banner-doc-trai-160x600.png"
                  value={form.sideLeftUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, sideLeftUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  Link đích liên kết (Mở trang nhà tài trợ trong tab mới khi người dùng click vào banner):
                </span>
                <input
                  type="url"
                  placeholder="https://sponsor-website.com (không bắt buộc)"
                  value={form.sideLeftLinkUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, sideLeftLinkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold">
                  <UploadCloud className="w-3.5 h-3.5" /> Từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload("sideLeftUrl")}
                  />
                </label>
                {CLIENT_ID && <DrivePicker onPick={(url) => setForm(prev => ({ ...prev, sideLeftUrl: url }))} />}
              </div>
            </div>

            {/* Banner Dọc Bên Phải */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Banner Dọc Bên Phải (Sát lề phải)
                </label>
                {form.sideRightUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, sideRightUrl: '', sideRightLinkUrl: '' }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa banner dọc phải
                  </button>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link ảnh banner dọc (Khuyên dùng ảnh dọc 160x600 hoặc 300x600):</span>
                <input
                  type="text"
                  placeholder="https://example.com/banner-doc-phai-160x600.png"
                  value={form.sideRightUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, sideRightUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  Link đích liên kết (Mở trang nhà tài trợ trong tab mới khi người dùng click vào banner):
                </span>
                <input
                  type="url"
                  placeholder="https://sponsor-website.com (không bắt buộc)"
                  value={form.sideRightLinkUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, sideRightLinkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold">
                  <UploadCloud className="w-3.5 h-3.5" /> Từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload("sideRightUrl")}
                  />
                </label>
                {CLIENT_ID && <DrivePicker onPick={(url) => setForm(prev => ({ ...prev, sideRightUrl: url }))} />}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ẢNH HERO TRANG CHỦ (2 BÊN TÌM KIẾM) ================= */}
        {activeTab === 'hero' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Guide & Size Recommendation Box */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                <Ruler className="w-4 h-4 text-emerald-600" />
                <span>KÍCH THƯỚC CHUẨN KHUYẾN NGHỊ CHO ẢNH HERO TRANG CHỦ:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                • <strong>Kích thước chuẩn:</strong> <code>400 x 400 px</code> (Vuông 1:1) hoặc <code>500 x 350 px</code> (Tỉ lệ 4:3).<br />
                • <strong>Mẹo hay:</strong> Nên dùng ảnh <strong>PNG hoặc WebP tách nền (nền trong suốt transparent)</strong> để linh vật / logo hòa quyện đẹp mắt với giao diện tối của website.<br />
                • <strong>Vị trí hiển thị:</strong> Đặt cố định 2 bên thanh tìm kiếm tại Trang chủ máy tính.
              </p>
            </div>

            {/* LIVE REALISTIC PREVIEW FOR HERO */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" /> Mô phỏng thực tế Trang chủ (Máy tính):
                </span>
                <span className="text-[11px] text-slate-400">2 ảnh linh vật/logo nằm 2 bên thanh tìm kiếm</span>
              </div>
              <HeroLivePreview leftUrl={form.heroLeftUrl} rightUrl={form.heroRightUrl} />
            </div>

            {/* Hero Bên Trái */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Ảnh Hero Bên Trái (Ví dụ: Linh vật Capybara)
                </label>
                {form.heroLeftUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, heroLeftUrl: '', heroLeftLinkUrl: '' }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa ảnh trái
                  </button>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link ảnh Hero bên trái:</span>
                <input
                  type="text"
                  placeholder="https://example.com/capybara.png"
                  value={form.heroLeftUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, heroLeftUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  Link đích liên kết (Mở khi người dùng bấm vào ảnh - không bắt buộc):
                </span>
                <input
                  type="url"
                  placeholder="https://sponsor.com (không bắt buộc)"
                  value={form.heroLeftLinkUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, heroLeftLinkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold">
                  <UploadCloud className="w-3.5 h-3.5" /> Từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload("heroLeftUrl")}
                  />
                </label>
                {CLIENT_ID && <DrivePicker onPick={(url) => setForm(prev => ({ ...prev, heroLeftUrl: url }))} />}
              </div>
            </div>

            {/* Hero Bên Phải */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Ảnh Hero Bên Phải (Ví dụ: Trường TLU / Logo đối tác)
                </label>
                {form.heroRightUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, heroRightUrl: '', heroRightLinkUrl: '' }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa ảnh phải
                  </button>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link ảnh Hero bên phải:</span>
                <input
                  type="text"
                  placeholder="https://example.com/dai-hoc-thuy-loi.png"
                  value={form.heroRightUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, heroRightUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  Link đích liên kết (Mở khi người dùng bấm vào ảnh - không bắt buộc):
                </span>
                <input
                  type="url"
                  placeholder="https://sponsor.com (không bắt buộc)"
                  value={form.heroRightLinkUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, heroRightLinkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold">
                  <UploadCloud className="w-3.5 h-3.5" /> Từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload("heroRightUrl")}
                  />
                </label>
                {CLIENT_ID && <DrivePicker onPick={(url) => setForm(prev => ({ ...prev, heroRightUrl: url }))} />}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BANNER NGANG ĐIỆN THOẠI ================= */}
        {activeTab === 'mobile' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Guide & Size Recommendation Box */}
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm">
                <Ruler className="w-4 h-4 text-amber-600" />
                <span>KÍCH THƯỚC CHUẨN KHUYẾN NGHỊ CHO BANNER NGANG ĐIỆN THOẠI:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                • <strong>Kích thước chuẩn:</strong> <code>728 x 90 px</code> hoặc <code>600 x 150 px</code> hoặc <code>800 x 200 px</code> (Tỉ lệ ngang từ <strong>4:1 đến 5:1</strong>).<br />
                • <strong>Vị trí hiển thị:</strong> Khung chữ nhật nằm ngay dưới thanh tìm kiếm ở cả Trang chủ và trang Môn học trên điện thoại.
              </p>
            </div>

            {/* LIVE REALISTIC PREVIEW FOR MOBILE */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" /> Mô phỏng thực tế màn hình Điện thoại:
                </span>
                <span className="text-[11px] text-slate-400">Banner ngang chữ nhật đặt dưới thanh tìm kiếm</span>
              </div>
              <MobileLivePreview bannerUrl={form.mobileBannerUrl} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  Ảnh Banner Ngang Điện Thoại
                </label>
                {form.mobileBannerUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, mobileBannerUrl: '', mobileBannerLinkUrl: '' }))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa banner mobile
                  </button>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link ảnh banner ngang (Khuyên dùng 600x150 hoặc 728x90):</span>
                <input
                  type="text"
                  placeholder="https://example.com/mobile-banner-600x150.png"
                  value={form.mobileBannerUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, mobileBannerUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  Link đích liên kết (Mở khi người dùng bấm vào banner trên điện thoại):
                </span>
                <input
                  type="url"
                  placeholder="https://sponsor-website.com (không bắt buộc)"
                  value={form.mobileBannerLinkUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, mobileBannerLinkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold">
                  <UploadCloud className="w-3.5 h-3.5" /> Từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload("mobileBannerUrl")}
                  />
                </label>
                {CLIENT_ID && <DrivePicker onPick={(url) => setForm(prev => ({ ...prev, mobileBannerUrl: url }))} />}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: QUẢNG CÁO POP-UP ================= */}
        {activeTab === 'popup' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Guide & Size Recommendation Box */}
            <div className="p-4 bg-purple-50/70 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm">
                <Ruler className="w-4 h-4 text-purple-600" />
                <span>KÍCH THƯỚC CHUẨN KHUYẾN NGHỊ CHO QUẢNG CÁO POP-UP:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                • <strong>Kích thước chuẩn:</strong> <code>600 x 600 px</code> (Vuông 1:1) hoặc <code>800 x 600 px</code> (Ngang 4:3) hoặc <code>600 x 800 px</code> (Dọc 3:4).<br />
                • <strong>Vị trí hiển thị:</strong> Hộp thoại nổi giữa màn hình, tự động căn chỉnh tỷ lệ theo thiết bị và có nút X đóng tiện lợi.
              </p>
            </div>

            {/* LIVE REALISTIC PREVIEW FOR POPUP */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-400" /> Mô phỏng thực tế hộp thoại Pop-up:
                </span>
                <span className="text-[11px] text-slate-400">Cửa sổ nổi toàn màn hình kèm nút đóng</span>
              </div>
              <PopupLivePreview 
                imageUrl={form.popupImageUrl} 
                title={form.popupTitle} 
                enabled={Boolean(form.popupEnabled)} 
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Bật Quảng Cáo Pop-up</span>
                  <span className="text-xs text-slate-500">Hiển thị popup tài trợ cho người dùng truy cập web</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.popupEnabled)}
                    onChange={(e) => setForm(prev => ({ ...prev, popupEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Title & Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Tiêu đề popup (không bắt buộc - để trống nếu chỉ muốn hiện ảnh thuần túy):
                  </span>
                  <input
                    type="text"
                    placeholder="Để trống nếu chỉ muốn hiện ảnh"
                    value={form.popupTitle || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, popupTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link liên kết khi bấm vào ảnh (Target URL):</span>
                  <input
                    type="url"
                    placeholder="https://sponsor.com"
                    value={form.popupLinkUrl || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, popupLinkUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Link ảnh Pop-up:</span>
                <input
                  type="text"
                  placeholder="https://example.com/popup-banner-600x600.png"
                  value={form.popupImageUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, popupImageUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold">
                  <UploadCloud className="w-3.5 h-3.5" /> Từ thiết bị
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload("popupImageUrl")}
                  />
                </label>
                {CLIENT_ID && <DrivePicker onPick={(url) => setForm(prev => ({ ...prev, popupImageUrl: url }))} />}
              </div>

              {/* Trigger Mechanism */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                  Cơ chế kích hoạt hiển thị Pop-up:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Theo thời gian */}
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    (form.popupTriggerType || 'time') === 'time'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="popupTriggerType"
                        value="time"
                        checked={(form.popupTriggerType || 'time') === 'time'}
                        onChange={() => setForm(prev => ({ ...prev, popupTriggerType: 'time' }))}
                        className="text-blue-600"
                      />
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold">Theo thời gian</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Cứ sau bao nhiêu phút hiện 1 lần</span>
                  </label>

                  {/* Option 2: Theo số lượt bấm tài liệu */}
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    form.popupTriggerType === 'docs'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="popupTriggerType"
                        value="docs"
                        checked={form.popupTriggerType === 'docs'}
                        onChange={() => setForm(prev => ({ ...prev, popupTriggerType: 'docs' }))}
                        className="text-blue-600"
                      />
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold">Theo lượt bấm tài liệu</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Bấm xem X tài liệu thì hiện</span>
                  </label>

                  {/* Option 3: Khi vừa vào web */}
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    form.popupTriggerType === 'entry'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="popupTriggerType"
                        value="entry"
                        checked={form.popupTriggerType === 'entry'}
                        onChange={() => setForm(prev => ({ ...prev, popupTriggerType: 'entry' }))}
                        className="text-blue-600"
                      />
                      <Compass className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold">Khi vừa vào web</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Hiện 1 lần sau X giây vào trang</span>
                  </label>
                </div>

                {/* Frequency selector according to trigger with custom input & quick presets */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {(form.popupTriggerType || 'time') === 'time' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Khoảng cách lặp lại:
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tự điền số phút hoặc bấm chọn nhanh bên cạnh
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct input for custom value */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            value={form.popupFrequency || ''}
                            placeholder="15"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              setForm(prev => ({ ...prev, popupFrequency: isNaN(val) ? 0 : val }));
                            }}
                            onBlur={() => {
                              if (!form.popupFrequency || form.popupFrequency < 1) {
                                setForm(prev => ({ ...prev, popupFrequency: 15 }));
                              }
                            }}
                            className="w-16 bg-transparent text-xs font-bold text-center outline-none text-slate-800 dark:text-slate-100"
                          />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">phút</span>
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-medium mr-0.5 hidden sm:inline">Chọn nhanh:</span>
                          {[5, 15, 30, 60].map((mins) => {
                            const isSelected = (form.popupFrequency || 15) === mins;
                            return (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, popupFrequency: mins }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {mins === 60 ? '60p (1 tiếng)' : `${mins} phút`} {mins === 15 ? '⭐' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {form.popupTriggerType === 'docs' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Số lượt xem tài liệu:
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cứ bấm xem đủ số tài liệu này thì bật quảng cáo pop-up
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct input for custom value */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={form.popupFrequency || ''}
                            placeholder="3"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              setForm(prev => ({ ...prev, popupFrequency: isNaN(val) ? 0 : val }));
                            }}
                            onBlur={() => {
                              if (!form.popupFrequency || form.popupFrequency < 1) {
                                setForm(prev => ({ ...prev, popupFrequency: 3 }));
                              }
                            }}
                            className="w-16 bg-transparent text-xs font-bold text-center outline-none text-slate-800 dark:text-slate-100"
                          />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">tài liệu</span>
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-medium mr-0.5 hidden sm:inline">Chọn nhanh:</span>
                          {[2, 3, 5, 10].map((docs) => {
                            const isSelected = (form.popupFrequency || 3) === docs;
                            return (
                              <button
                                key={docs}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, popupFrequency: docs }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {docs} tài liệu {docs === 3 ? '⭐' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {form.popupTriggerType === 'entry' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Độ trễ sau khi vào web:
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Chờ bao nhiêu giây khi vào trang rồi mới hiện pop-up
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct input for custom value */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={form.popupFrequency || ''}
                            placeholder="3"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              setForm(prev => ({ ...prev, popupFrequency: isNaN(val) ? 0 : val }));
                            }}
                            onBlur={() => {
                              if (!form.popupFrequency || form.popupFrequency < 1) {
                                setForm(prev => ({ ...prev, popupFrequency: 3 }));
                              }
                            }}
                            className="w-16 bg-transparent text-xs font-bold text-center outline-none text-slate-800 dark:text-slate-100"
                          />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">giây</span>
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-medium mr-0.5 hidden sm:inline">Chọn nhanh:</span>
                          {[1, 2, 3, 5, 10].map((secs) => {
                            const isSelected = (form.popupFrequency || 3) === secs;
                            return (
                              <button
                                key={secs}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, popupFrequency: secs }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {secs} giây {secs === 3 ? '⭐' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Save Feedback */}
        {saveFeedback && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
              saveFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/35 text-red-600 dark:text-red-300'
            }`}
          >
            {saveFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{saveFeedback.message}</span>
          </div>
        )}

        {/* Real-time notice */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
          <span>
            <strong>Cập nhật tức thì:</strong> Mọi cài đặt giao diện, mascot 3D, banner và popup tại đây sẽ đồng bộ ngay lập tức lên toàn web mà <em>không cần bấm Đồng bộ hay Deploy</em>.
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {!inline && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? "Đang lưu cài đặt..." : "Lưu cài đặt giao diện & banner"}
          </button>
        </div>
      </form>
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-xl">
      {content}
    </div>
  );
}
