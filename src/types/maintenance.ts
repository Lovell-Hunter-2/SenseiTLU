export interface MaintenanceConfig {
  enabled: boolean;
  startTime: string; // "YYYY-MM-DDTHH:mm"
  endTime: string;   // "YYYY-MM-DDTHH:mm"
  reason?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type MaintenanceStatus = 'inactive' | 'scheduled' | 'active';

/**
 * Parses a datetime string (datetime-local or ISO) to millisecond timestamp.
 */
export function parseMaintenanceDate(val?: string | null): number | null {
  if (!val || !val.trim()) return null;
  const d = new Date(val);
  const time = d.getTime();
  return isNaN(time) ? null : time;
}

/**
 * Determine the exact maintenance state at this instant:
 * - 'inactive': Admin turned it off, OR the end time has already passed.
 * - 'scheduled': Admin enabled it, but start time is in the future.
 * - 'active': Admin enabled it and current time is within [startTime, endTime] (or no dates specified).
 */
export function getMaintenanceStatus(
  config?: MaintenanceConfig | null,
  nowMs: number = Date.now()
): MaintenanceStatus {
  if (!config || !config.enabled) {
    return 'inactive';
  }

  const startMs = parseMaintenanceDate(config.startTime);
  const endMs = parseMaintenanceDate(config.endTime);

  // 1. If start time is set in the future -> Scheduled, not active yet
  if (startMs !== null && nowMs < startMs) {
    return 'scheduled';
  }

  // 2. If end time is set and has already passed -> Automatically turned off
  if (endMs !== null && nowMs >= endMs) {
    return 'inactive';
  }

  // 3. Otherwise -> Active right now
  return 'active';
}

/**
 * Helper returning boolean whether non-admin visitors must see the maintenance screen.
 */
export function isMaintenanceActive(
  config?: MaintenanceConfig | null,
  nowMs: number = Date.now()
): boolean {
  return getMaintenanceStatus(config, nowMs) === 'active';
}

/**
 * Human-readable countdown string (e.g., "15 phút", "1 giờ 20 phút")
 */
export function formatTimeRemaining(targetMs: number, nowMs: number = Date.now()): string {
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) return 'Đã hết giờ';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  if (minutes > 0) {
    return `${minutes} phút ${seconds} giây`;
  }
  return `${seconds} giây`;
}

/**
 * Format message strictly according to rules:
 * 1. Không chọn giờ bắt đầu, có giờ kết thúc: "Hệ thống đang bảo trì tới [Giờ kết thúc]. Mời bạn quay lại sau."
 * 2. Chọn cả start và end: "Hệ thống bảo trì từ [Giờ bắt đầu] đến [Giờ kết thúc]. Mời bạn quay lại sau."
 * 3. Không chọn cả hai: "Hệ thống đang bảo trì. Mời bạn quay lại sau."
 */
export function formatMaintenanceMessage(startTime?: string, endTime?: string): string {
  const hasStart = Boolean(startTime && startTime.trim());
  const hasEnd = Boolean(endTime && endTime.trim());

  const formatDisplayTime = (val: string): string => {
    if (!val) return '';
    if (val.includes('T')) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
        }
      } catch {
        return val;
      }
    }
    return val;
  };

  if (!hasStart && hasEnd) {
    return `Hệ thống đang bảo trì tới ${formatDisplayTime(endTime!)}. Mời bạn quay lại sau.`;
  }
  if (hasStart && hasEnd) {
    return `Hệ thống bảo trì từ ${formatDisplayTime(startTime!)} đến ${formatDisplayTime(endTime!)}. Mời bạn quay lại sau.`;
  }
  return 'Hệ thống đang bảo trì. Mời bạn quay lại sau.';
}
