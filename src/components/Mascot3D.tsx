import React, { useEffect, useRef } from "react";
import "@google/model-viewer";

// Đảm bảo không lỗi trong môi trường build/SSR
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  const ModelViewerClass = customElements.get("model-viewer") as any;
  if (ModelViewerClass) {
    ModelViewerClass.minimumRenderScale = 1;
  }
}

// Type declarations cho JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean | string;
          "rotation-per-second"?: string;
          "camera-controls"?: boolean | string;
          "disable-zoom"?: boolean | string;
          "animation-name"?: string;
          autoplay?: boolean | string;
          loading?: "auto" | "lazy" | "eager";
          exposure?: string | number;
          "shadow-intensity"?: string | number;
          "shadow-softness"?: string | number;
          "interaction-prompt"?: "auto" | "when-focused" | "none";
          "camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "environment-image"?: string;
          "tone-mapping"?: string;
          "field-of-view"?: string;
          style?: React.CSSProperties;
          class?: string;
        },
        HTMLElement
      >;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean | string;
          "rotation-per-second"?: string;
          "camera-controls"?: boolean | string;
          "disable-zoom"?: boolean | string;
          "animation-name"?: string;
          autoplay?: boolean | string;
          loading?: "auto" | "lazy" | "eager";
          exposure?: string | number;
          "shadow-intensity"?: string | number;
          "shadow-softness"?: string | number;
          "interaction-prompt"?: "auto" | "when-focused" | "none";
          "camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "environment-image"?: string;
          "tone-mapping"?: string;
          "field-of-view"?: string;
          style?: React.CSSProperties;
          class?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface Mascot3DProps {
  className?: string;
}

// Hàm gia tốc mượt mà sinh động tự nhiên (smooth ease-in-out)
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const Mascot3D: React.FC<Mascot3DProps> = ({ className = "" }) => {
  const modelRef = useRef<HTMLElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewer = modelRef.current as any;
    if (!viewer) return;

    viewer.minimumRenderScale = 1;

    let isInteracting = false;
    let interactionTimeout: ReturnType<typeof setTimeout> | null = null;
    let animationFrameId: number;

    const handleInteractionStart = () => {
      isInteracting = true;
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
        interactionTimeout = null;
      }
    };

    const handleInteractionEnd = () => {
      if (interactionTimeout) clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        isInteracting = false;
        // Bắt đầu lại nhịp từ vị trí hiện tại
        lastTime = performance.now();
        stepStartTime = performance.now();
      }, 1600);
    };

    const handleCameraChange = (e: any) => {
      if (e.detail?.source === "user-interaction") {
        handleInteractionStart();
        handleInteractionEnd();
      }
    };

    viewer.addEventListener("camera-change", handleCameraChange);
    viewer.addEventListener("pointerdown", handleInteractionStart);
    window.addEventListener("pointerup", handleInteractionEnd);
    viewer.addEventListener("touchstart", handleInteractionStart, { passive: true });
    window.addEventListener("touchend", handleInteractionEnd, { passive: true });

    // Kịch bản chuyển động tự nhiên như linh vật sống động:
    // yaw: góc quay ngang (-17° đến +17°)
    // pitch: góc nhìn dọc (69° nhìn xuống - 78.2° ngước lên, tuyệt đối KHÔNG lộ đế)
    // tilt: lắc lư nghiêng đầu theo trục (-3.5° đến +3.5°)
    // moveDuration: thời gian quay (có lúc nhanh 0.75s tò mò, lúc lười biếng 1.6s)
    // pauseDuration: thời gian dừng quan sát và thở nhẹ
    const POSES = [
      { yaw: 0, pitch: 74, tilt: 0, moveDuration: 1.0, pauseDuration: 0.5 },
      // Quay nhanh sang trái với vẻ tò mò, nghiêng đầu nhẹ
      { yaw: -16.5, pitch: 71, tilt: 3.2, moveDuration: 0.75, pauseDuration: 0.8 },
      // Trôi chậm rãi về gần giữa, nhìn xuống dưới (về hướng người dùng / nút hỗ trợ)
      { yaw: -3, pitch: 69, tilt: 0.8, moveDuration: 1.6, pauseDuration: 0.6 },
      // Ngước nhẹ mặt lên trên như đang suy nghĩ (pitch 78° an toàn, không lộ đế dưới)
      { yaw: 6, pitch: 78.0, tilt: -1.6, moveDuration: 1.1, pauseDuration: 0.7 },
      // Quay nhanh sang phải quan sát
      { yaw: 17.5, pitch: 72.5, tilt: -3.5, moveDuration: 0.8, pauseDuration: 0.8 },
      // Nhìn xuống dưới chếch phải
      { yaw: 7, pitch: 69.5, tilt: -1.0, moveDuration: 1.1, pauseDuration: 0.5 },
    ];

    let currentPoseIdx = 0;
    let nextPoseIdx = 1;
    let isMoving = true;
    let stepStartTime = performance.now();
    let lastTime = stepStartTime;

    const animate = (currentTime: number) => {
      if (!isInteracting && viewer) {
        const fromPose = POSES[currentPoseIdx];
        const toPose = POSES[nextPoseIdx];

        if (isMoving) {
          const elapsed = (currentTime - stepStartTime) / 1000;
          const progress = Math.min(1, elapsed / toPose.moveDuration);
          const t = easeInOutCubic(progress);

          const yaw = fromPose.yaw + (toPose.yaw - fromPose.yaw) * t;
          const pitch = fromPose.pitch + (toPose.pitch - fromPose.pitch) * t;
          const tilt = fromPose.tilt + (toPose.tilt - fromPose.tilt) * t;

          if (tiltRef.current) {
            tiltRef.current.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
          }

          try {
            viewer.cameraOrbit = `${yaw.toFixed(2)}deg ${pitch.toFixed(2)}deg 82%`;
          } catch (_) {}

          if (progress >= 1) {
            isMoving = false;
            stepStartTime = currentTime;
          }
        } else {
          // Trạng thái dừng quan sát: thêm nhịp thở nhẹ & dao động tinh tế
          const holdElapsed = (currentTime - stepStartTime) / 1000;
          const breath = Math.sin(holdElapsed * 3) * 0.4;
          const microTilt = Math.cos(holdElapsed * 2.5) * 0.3;

          const yaw = toPose.yaw + breath * 0.6;
          // Đảm bảo dù cộng nhịp thở cũng không bao giờ vượt quá 78.5°
          const pitch = Math.min(78.5, toPose.pitch + breath * 0.4);
          const tilt = toPose.tilt + microTilt;

          if (tiltRef.current) {
            tiltRef.current.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
          }

          try {
            viewer.cameraOrbit = `${yaw.toFixed(2)}deg ${pitch.toFixed(2)}deg 82%`;
          } catch (_) {}

          if (holdElapsed >= toPose.pauseDuration) {
            currentPoseIdx = nextPoseIdx;
            nextPoseIdx = (nextPoseIdx + 1) % POSES.length;
            isMoving = true;
            stepStartTime = currentTime;
          }
        }
      }

      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactionTimeout) clearTimeout(interactionTimeout);
      viewer.removeEventListener("camera-change", handleCameraChange);
      viewer.removeEventListener("pointerdown", handleInteractionStart);
      window.removeEventListener("pointerup", handleInteractionEnd);
      viewer.removeEventListener("touchstart", handleInteractionStart);
      window.removeEventListener("touchend", handleInteractionEnd);
    };
  }, []);

  return (
    <div
      className={`relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 ease-out hover:scale-110 cursor-grab active:cursor-grabbing select-none drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div
        ref={tiltRef}
        className="w-full h-full origin-bottom"
        style={{ transform: "rotate(0deg)" }}
      >
        <model-viewer
          ref={modelRef as any}
          src="/capytlu.glb"
          alt="Capybara Mascot 3D"
          camera-controls
          disable-zoom
          camera-orbit="0deg 74deg 82%"
          min-camera-orbit="-30deg 68deg 82%"
          max-camera-orbit="30deg 79deg 82%"
          field-of-view="28deg"
          environment-image="neutral"
          tone-mapping="neutral"
          exposure="1.2"
          shadow-intensity="1"
          shadow-softness="0.3"
          animation-name="idle"
          autoplay
          interaction-prompt="none"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
        />
      </div>
    </div>
  );
};

export default Mascot3D;
