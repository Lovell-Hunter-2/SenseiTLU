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
  trackMouse?: boolean;
}

// Hàm gia tốc mượt mà sinh động tự nhiên (smooth ease-in-out)
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const Mascot3D: React.FC<Mascot3DProps> = ({ className = "", trackMouse = true }) => {
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

    // Kiểm tra thiết bị có con trỏ chuột (desktop/laptop)
    const hasFinePointer = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const enableMouseTracking = trackMouse && hasFinePointer;

    let lastMouseMoveTime = 0;
    let mousePos = { x: -1, y: -1 };
    let isMouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      lastMouseMoveTime = performance.now();
      isMouseActive = true;
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
    };

    if (enableMouseTracking) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    // Kịch bản chuyển động tự nhiên khi chuột đứng yên hoặc trên màn hình cảm ứng:
    const POSES = [
      { yaw: 0, pitch: 74, tilt: 0, lift: 0, moveDuration: 1.0, pauseDuration: 0.6 },
      // Quay nhanh sang trái với vẻ tò mò, nghiêng đầu nhẹ
      { yaw: -16.5, pitch: 70, tilt: 3.2, lift: 0, moveDuration: 0.75, pauseDuration: 0.8 },
      // Trôi chậm rãi về gần giữa, cúi nhìn xuống dưới (hướng người dùng / nút hỗ trợ)
      { yaw: -3, pitch: 67, tilt: 0.8, lift: -1.5, moveDuration: 1.6, pauseDuration: 0.6 },
      // Ngước mặt lên trên rõ rệt (pitch 83° ngước tự nhiên, tuyệt đối không lộ đế)
      { yaw: 6, pitch: 83.0, tilt: -1.6, lift: 3.0, moveDuration: 1.1, pauseDuration: 0.8 },
      // Quay nhanh sang phải quan sát
      { yaw: 17.5, pitch: 72.0, tilt: -3.5, lift: 0.5, moveDuration: 0.8, pauseDuration: 0.8 },
      // Nhìn xuống dưới chếch phải
      { yaw: 7, pitch: 68.0, tilt: -1.0, lift: -1.0, moveDuration: 1.1, pauseDuration: 0.5 },
    ];

    let currentPoseIdx = 0;
    let nextPoseIdx = 1;
    let isMoving = true;
    let stepStartTime = performance.now();
    let lastTime = stepStartTime;

    // Trạng thái góc nhìn hiện tại
    let curYaw = 0;
    let curPitch = 74;
    let curTilt = 0;
    let curLift = 0;

    const animate = (currentTime: number) => {
      if (!isInteracting && viewer) {
        const dt = Math.min(0.1, (currentTime - lastTime) / 1000);

        // Chuột không di chuyển sau 2.5s thì tự chuyển sang trạng thái thư giãn (idle)
        if (isMouseActive && currentTime - lastMouseMoveTime > 2500) {
          isMouseActive = false;
          stepStartTime = currentTime;
        }

        if (enableMouseTracking && isMouseActive && mousePos.x >= 0 && mousePos.y >= 0) {
          // --- CHẾ ĐỘ DÕI THEO CON TRỎ CHUỘT ---
          const rect = viewer.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const deltaX = mousePos.x - centerX;
          const deltaY = mousePos.y - centerY;

          const screenW = window.innerWidth || 1200;
          const screenH = window.innerHeight || 800;

          // Chuẩn hóa tỷ lệ lệch từ -1 (chuột ở bên trái) đến +1 (chuột ở bên phải)
          const normX = Math.max(-1, Math.min(1, deltaX / (screenW * 0.75)));
          const normY = Math.max(-1, Math.min(1, deltaY / (screenH * 0.75)));

          // Góc quay ngang theo chuột: sang trái quay trái, sang phải quay phải
          const targetYaw = -normX * (normX < 0 ? 22 : 14);

          // Góc nhìn dọc mở rộng rõ rệt:
          // normY < 0 (chuột ở trên cao): ngước mặt lên tới 84.5° (rõ rệt, an toàn <85° không lộ đế)
          // normY > 0 (chuột ở dưới thấp): cúi nhìn xuống 66.0°
          const targetPitch = Math.max(66.0, Math.min(84.5, 74 - normY * 10.5));

          // Nâng nhẹ thân người lên khi ngước nhìn lên cao để tạo hiệu ứng ngước sống động
          const targetLift = normY < 0 ? -normY * 4.0 : 0;

          // Nghiêng đầu tự nhiên theo hướng chuột
          const targetTilt = normX * 3.0;

          // Nội suy mượt mà (exponential damping)
          const lerpSpeed = 1 - Math.exp(-6.5 * dt);
          curYaw += (targetYaw - curYaw) * lerpSpeed;
          curPitch += (targetPitch - curPitch) * lerpSpeed;
          curTilt += (targetTilt - curTilt) * lerpSpeed;
          curLift += (targetLift - curLift) * lerpSpeed;
        } else {
          // --- CHẾ ĐỘ LINH VẬT TỰ NHIÊN (IDLE / KHÔNG CÓ CHUỘT / TRÊN ĐIỆN THOẠI) ---
          const fromPose = POSES[currentPoseIdx];
          const toPose = POSES[nextPoseIdx];

          let targetYaw = 0;
          let targetPitch = 74;
          let targetTilt = 0;
          let targetLift = 0;

          if (isMoving) {
            const elapsed = (currentTime - stepStartTime) / 1000;
            const progress = Math.min(1, elapsed / toPose.moveDuration);
            const t = easeInOutCubic(progress);

            targetYaw = fromPose.yaw + (toPose.yaw - fromPose.yaw) * t;
            targetPitch = fromPose.pitch + (toPose.pitch - fromPose.pitch) * t;
            targetTilt = fromPose.tilt + (toPose.tilt - fromPose.tilt) * t;
            targetLift = fromPose.lift + (toPose.lift - fromPose.lift) * t;

            if (progress >= 1) {
              isMoving = false;
              stepStartTime = currentTime;
            }
          } else {
            // Trạng thái dừng: thở nhẹ & lắc lư vi mô
            const holdElapsed = (currentTime - stepStartTime) / 1000;
            const breath = Math.sin(holdElapsed * 3) * 0.4;
            const microTilt = Math.cos(holdElapsed * 2.5) * 0.3;

            targetYaw = toPose.yaw + breath * 0.6;
            targetPitch = Math.min(84.5, toPose.pitch + breath * 0.4);
            targetTilt = toPose.tilt + microTilt;
            targetLift = toPose.lift + Math.sin(holdElapsed * 3) * 0.5;

            if (holdElapsed >= toPose.pauseDuration) {
              currentPoseIdx = nextPoseIdx;
              nextPoseIdx = (nextPoseIdx + 1) % POSES.length;
              isMoving = true;
              stepStartTime = currentTime;
            }
          }

          // Chuyển tiếp êm ái sang tư thế đích
          const lerpSpeed = 1 - Math.exp(-7.0 * dt);
          curYaw += (targetYaw - curYaw) * lerpSpeed;
          curPitch += (targetPitch - curPitch) * lerpSpeed;
          curTilt += (targetTilt - curTilt) * lerpSpeed;
          curLift += (targetLift - curLift) * lerpSpeed;
        }

        // Cập nhật lên DOM (nghiêng đầu + nâng người nhẹ khi ngước lên)
        if (tiltRef.current) {
          tiltRef.current.style.transform = `translateY(${-curLift.toFixed(2)}px) rotate(${curTilt.toFixed(2)}deg)`;
        }

        try {
          viewer.cameraOrbit = `${curYaw.toFixed(2)}deg ${curPitch.toFixed(2)}deg 82%`;
        } catch (_) {}
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

      if (enableMouseTracking) {
        window.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [trackMouse]);

  return (
    <div
      className={`relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 ease-out hover:scale-110 cursor-grab active:cursor-grabbing select-none drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div
        ref={tiltRef}
        className="w-full h-full origin-bottom"
        style={{ transform: "translateY(0px) rotate(0deg)" }}
      >
        <model-viewer
          ref={modelRef as any}
          src="/capytlu.glb"
          alt="Capybara Mascot 3D"
          camera-controls
          disable-zoom
          camera-orbit="0deg 74deg 82%"
          min-camera-orbit="-30deg 65deg 82%"
          max-camera-orbit="30deg 85deg 82%"
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
