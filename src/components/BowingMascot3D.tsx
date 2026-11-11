import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';

// Helper easing function for smooth organic bowing motion
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface BowingMascot3DProps {
  side: 'left' | 'right';
  className?: string;
  badgeText?: string;
}

export const BowingMascot3D: React.FC<BowingMascot3DProps> = ({
  side,
  className = '',
  badgeText,
}) => {
  const modelRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isBowing, setIsBowing] = useState(false);

  useEffect(() => {
    const viewer = modelRef.current as any;
    const container = containerRef.current;
    if (!viewer || !container) return;

    // Đảm bảo chất lượng render sắc nét
    viewer.minimumRenderScale = 1;

    let animationFrameId: number;
    const startTime = performance.now();
    const CYCLE_DURATION = 5000; // 5.0 seconds per complete alternating cycle
    // Left starts at 0, Right starts at half cycle (2.5s)
    const timeOffset = side === 'left' ? 0 : CYCLE_DURATION / 2;

    // Orientation: Left mascot faces toward center (right), Right mascot faces toward center (left)
    const baseYaw = side === 'left' ? -20 : 20;

    const animate = (now: number) => {
      const elapsed = (now - startTime + timeOffset) % CYCLE_DURATION;
      const progress = elapsed / CYCLE_DURATION; // 0 to 1

      let bowAngle = 0; // Degrees tilt forward (rotateX)
      let bowPitch = 74; // Camera pitch (degrees)
      let bowDrop = 0; // Pixels translate down
      let bowingState = false;

      // Phase 1 (0 to 0.24, ~1.2s): Bắt đầu cúi đầu gập người xuống
      if (progress < 0.24) {
        const t = progress / 0.24;
        const eased = easeInOutCubic(t);
        bowAngle = eased * 24; // Bẻ gập thân trước 24 độ
        bowPitch = 74 - eased * 12; // Góc nhìn camera hạ thấp nhìn thẳng vào mặt cúi chào
        bowDrop = eased * 7;
        bowingState = t > 0.4;
      }
      // Phase 2 (0.24 to 0.44, ~1.0s): Giữ cúi đầu thành kính tạ lỗi
      else if (progress < 0.44) {
        const holdT = (progress - 0.24) / 0.2;
        // Nhấp nhô nhẹ cực kỳ tinh tế như đang thở khi cúi chào
        const breath = Math.sin(holdT * Math.PI * 2) * 0.8;
        bowAngle = 24 + breath;
        bowPitch = 62 + breath * 0.5;
        bowDrop = 7 + breath * 0.4;
        bowingState = true;
      }
      // Phase 3 (0.44 to 0.64, ~1.0s): Từ từ ngẩng đầu đứng thẳng dậy
      else if (progress < 0.64) {
        const t = (progress - 0.44) / 0.2;
        const eased = 1 - easeInOutCubic(t);
        bowAngle = eased * 24;
        bowPitch = 62 + (1 - easeInOutCubic(t)) * 12;
        bowDrop = eased * 7;
        bowingState = t < 0.6;
      }
      // Phase 4 (0.64 to 1.0, ~1.8s): Đứng thẳng trang nghiêm nhường lượt cho bạn bên cạnh
      else {
        const idleT = (progress - 0.64) / 0.36;
        // Thở nhẹ nhàng khi đứng yên
        const idleBreath = Math.sin(idleT * Math.PI * 4) * 0.5;
        bowAngle = idleBreath * 0.4;
        bowPitch = 74 + idleBreath * 0.4;
        bowDrop = idleBreath;
        bowingState = false;
      }

      setIsBowing(bowingState);

      // Cập nhật transform 3D perspective trên container
      container.style.transform = `perspective(600px) rotateX(${bowAngle.toFixed(2)}deg) translateY(${bowDrop.toFixed(2)}px)`;

      // Cập nhật cameraOrbit của 3D model
      try {
        viewer.cameraOrbit = `${baseYaw.toFixed(1)}deg ${bowPitch.toFixed(2)}deg 100%`;
      } catch (_) {}

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [side]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Mascot Canvas with Bowing Tilt Container */}
      <div className="relative w-32 h-36 sm:w-40 sm:h-44 md:w-48 md:h-52 flex items-center justify-center">
        {/* Subtle ambient light glow */}
        <div
          className={`absolute inset-4 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
            isBowing ? 'bg-amber-500/20 scale-105' : 'bg-blue-500/10 scale-95'
          }`}
        />

        {/* 3D Model Container tilted with perspective */}
        <div
          ref={containerRef}
          className="w-full h-full origin-bottom will-change-transform"
          style={{ transform: 'perspective(600px) rotateX(0deg) translateY(0px)' }}
        >
          <model-viewer
            ref={modelRef as any}
            src="/capytlu_bow.glb"
            alt={`Mascot SenseiTLU cúi đầu (${side === 'left' ? 'trái' : 'phải'})`}
            camera-controls={false}
            disable-zoom
            camera-orbit={`${side === 'left' ? '-20deg' : '20deg'} 74deg 100%`}
            field-of-view="28deg"
            environment-image="neutral"
            tone-mapping="neutral"
            exposure="1.25"
            shadow-intensity="1.2"
            shadow-softness="0.4"
            animation-name="idle"
            autoplay
            interaction-prompt="none"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            }}
          />
        </div>

        {/* Dynamic shadow on the ground */}
        <div
          className={`absolute bottom-1 w-24 sm:w-28 h-3.5 bg-black/40 rounded-full blur-xs transition-all duration-300 pointer-events-none ${
            isBowing ? 'scale-x-110 opacity-70' : 'scale-x-95 opacity-50'
          }`}
        />
      </div>

      {/* Cute speech / apology badge */}
      {badgeText && (
        <div
          className={`mt-1 sm:mt-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-500 flex items-center gap-1.5 shadow-md ${
            isBowing
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 scale-105 translate-y-0.5'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 scale-100'
          }`}
        >
          <span>{isBowing ? '🙇' : '🙏'}</span>
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
};

export default BowingMascot3D;
