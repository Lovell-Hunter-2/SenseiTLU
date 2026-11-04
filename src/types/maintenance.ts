export interface MaintenanceConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  reason?: string;
  updatedAt?: string;
  updatedBy?: string;
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
    // Format if input is datetime-local "YYYY-MM-DDTHH:mm"
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
