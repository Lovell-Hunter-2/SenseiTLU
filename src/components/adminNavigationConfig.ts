import React from 'react';
import {
  LayoutDashboard,
  Database,
  Users,
  Shield,
  Activity,
  AlertTriangle,
  EyeOff,
  LineChart as LineChartIcon,
  AlertOctagon,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';

export type AdminTabId =
  | 'overview'
  | 'quota'
  | 'users'
  | 'admins'
  | 'activity'
  | 'reports'
  | 'storage'
  | 'hidden_docs'
  | 'retention'
  | 'errors'
  | 'ui'
  | 'ecosystem';

export type AdminGroupName = 'Chung' | 'Người dùng' | 'Hoạt động & dữ liệu' | 'Hệ thống';

export interface AdminNavItem {
  id: AdminTabId;
  label: string;
  group: AdminGroupName;
  icon: React.FC<any>;
  badgeKey?: 'reports' | 'errors';
}

// Single source of truth for group colors as required
export const ADMIN_GROUP_COLORS: Record<AdminGroupName, string> = {
  'Chung': '#60a5fa',              // xanh dương
  'Người dùng': '#a78bfa',         // tím
  'Hoạt động & dữ liệu': '#34d399',// xanh lá
  'Hệ thống': '#fbbf24',           // vàng cam
};

export const ADMIN_GROUPS: AdminGroupName[] = [
  'Chung',
  'Người dùng',
  'Hoạt động & dữ liệu',
  'Hệ thống',
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  // 1. Chung
  { id: 'overview', label: 'Tổng quan', group: 'Chung', icon: LayoutDashboard },
  { id: 'quota', label: 'Giám sát Quota', group: 'Chung', icon: Database },

  // 2. Người dùng
  { id: 'users', label: 'Quản lý Users', group: 'Người dùng', icon: Users },
  { id: 'admins', label: 'Danh sách Admin', group: 'Người dùng', icon: Shield },

  // 3. Hoạt động & dữ liệu
  { id: 'activity', label: 'Lịch sử hệ thống', group: 'Hoạt động & dữ liệu', icon: Activity },
  { id: 'reports', label: 'Reports', group: 'Hoạt động & dữ liệu', icon: AlertTriangle, badgeKey: 'reports' },
  { id: 'storage', label: 'Tài nguyên hệ thống', group: 'Hoạt động & dữ liệu', icon: Database },
  { id: 'hidden_docs', label: 'Tài liệu ẩn', group: 'Hoạt động & dữ liệu', icon: EyeOff },

  // 4. Hệ thống
  { id: 'retention', label: 'Tỷ lệ người dùng', group: 'Hệ thống', icon: LineChartIcon },
  { id: 'errors', label: 'Lỗi hệ thống', group: 'Hệ thống', icon: AlertOctagon, badgeKey: 'errors' },
  { id: 'ui', label: 'Quản lý giao diện', group: 'Hệ thống', icon: ImageIcon },
  { id: 'ecosystem', label: 'Hệ sinh thái', group: 'Hệ thống', icon: Globe },
];

export const getGroupColor = (group: AdminGroupName): string => {
  return ADMIN_GROUP_COLORS[group] || '#60a5fa';
};
