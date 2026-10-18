import { Upload, Info, Home, FileText, LayoutGrid } from 'lucide-react';
import React from 'react';

export interface NavRoute {
  id: string;
  name: string;
  shortName: string;
  path: string;
  icon: React.FC<any>;
  isAction?: boolean; // For tabs like Hệ sinh thái which open a drawer instead of navigating
}

// Main header nav items
export const HEADER_NAV_ROUTES: { name: string; path: string }[] = [
  { name: 'Trang chủ', path: '/' },
  { name: 'Blog', path: '/blog' },
  { name: 'About', path: '/about' },
  { name: 'Đóng góp tài liệu', path: '/contribute' },
];

// 5 Mobile Bottom Navigation Tabs (Order: Đóng góp -> About -> Trang chủ -> Blog -> Hệ sinh thái)
export const MOBILE_BOTTOM_TABS: NavRoute[] = [
  {
    id: 'contribute',
    name: 'Đóng góp tài liệu',
    shortName: 'Đóng góp',
    path: '/contribute',
    icon: Upload,
  },
  {
    id: 'about',
    name: 'About',
    shortName: 'About',
    path: '/about',
    icon: Info,
  },
  {
    id: 'home',
    name: 'Trang chủ',
    shortName: 'Trang chủ',
    path: '/',
    icon: Home,
  },
  {
    id: 'blog',
    name: 'Blog',
    shortName: 'Blog',
    path: '/blog',
    icon: FileText,
  },
  {
    id: 'ecosystem',
    name: 'Hệ sinh thái',
    shortName: 'Hệ sinh thái',
    path: '#ecosystem',
    icon: LayoutGrid,
    isAction: true,
  },
];
