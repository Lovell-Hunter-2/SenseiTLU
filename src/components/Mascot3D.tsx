import React, { useEffect, useRef } from "react";
import "@google/model-viewer";

// Ép model-viewer luôn render ở độ phân giải gốc 100% (Native Retina / High-DPI),
// tránh việc model-viewer tự động hạ renderScale xuống 0.5/0.25 gây mờ khi có hoạt ảnh
const ModelViewerClass = customElements.get("model-viewer") as any;
if (ModelViewerClass) {
  ModelViewerClass.minimumRenderScale = 1;
}

// Type declarations for <model-viewer> web component in React JSX
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

export const Mascot3D: React.FC<Mascot3DProps> = ({ className = "" }) => {
  const modelRef = useRef<HTMLElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewer = modelRef.current as any;
    if (!viewer) return;

    // Đảm bảo instance này không bao giờ bị nén hạ độ phân giải
    viewer.minimumRenderScale = 1;

    let isInteracting = false;
    let interactionTimeout: ReturnType<typeof setTimeout> | null = null;
    let animationFrameId: number;
    let startTime = performance.now();

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
        startTime = performance.now();
      }, 1800);
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

    const animate = (currentTime: number) => {
      if (!isInteracting && viewer) {
        const elapsed = (currentTime - startTime) / 1000;

        // Quay ngang trái/phải 1 góc khoảng 15 - 18 độ
        const yaw = Math.sin(elapsed * 1.75) * 17;

        // Lắc lư nghiêng trái/phải nhẹ theo nhịp
        const tilt = Math.sin(elapsed * 1.75) * 3.8;

        if (tiltRef.current) {
          tiltRef.current.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
        }

        try {
          // 82% camera radius giúp mô hình phóng to vừa vặn, không bị khoảng trống thừa gây cảm giác bé & mờ
          viewer.cameraOrbit = `${yaw.toFixed(2)}deg 75deg 82%`;
        } catch (_) {
          // Ignore if model is not mounted yet
        }
      }

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
      {/* Wrapper lắc lư nghiêng trái/phải */}
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
          camera-orbit="0deg 75deg 82%"
          min-camera-orbit="-30deg 75deg 82%"
          max-camera-orbit="30deg 75deg 82%"
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
