export interface BannerConfig {
  // 1. Ảnh 2 bên ô tìm kiếm Trang chủ (Hero Home)
  heroLeftUrl?: string;
  heroLeftLinkUrl?: string;
  heroRightUrl?: string;
  heroRightLinkUrl?: string;

  // Legacy fallback alias
  leftUrl?: string;
  leftLinkUrl?: string;
  rightUrl?: string;
  rightLinkUrl?: string;

  // 2. Banner dọc 2 bên lề (Desktop Skyscraper Side Banners - Subject & Ultrawide)
  sideLeftUrl?: string;
  sideLeftLinkUrl?: string;
  sideRightUrl?: string;
  sideRightLinkUrl?: string;

  // 3. Banner ngang điện thoại (Mobile Horizontal Banner)
  mobileBannerUrl?: string;
  mobileBannerLinkUrl?: string;

  // 4. Quảng cáo Pop-up
  popupEnabled?: boolean;
  popupImageUrl?: string;
  popupLinkUrl?: string;
  popupTitle?: string;
  popupTriggerType?: 'time' | 'docs' | 'entry';
  popupFrequency?: number; // Minutes for 'time', click count for 'docs', seconds for 'entry'
  updatedAt?: any;
}

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  heroLeftUrl: '',
  heroLeftLinkUrl: '',
  heroRightUrl: '',
  heroRightLinkUrl: '',
  leftUrl: '',
  leftLinkUrl: '',
  rightUrl: '',
  rightLinkUrl: '',
  sideLeftUrl: '',
  sideLeftLinkUrl: '',
  sideRightUrl: '',
  sideRightLinkUrl: '',
  mobileBannerUrl: '',
  mobileBannerLinkUrl: '',
  popupEnabled: false,
  popupImageUrl: '',
  popupLinkUrl: '',
  popupTitle: 'Thông tin tài trợ & Đối tác',
  popupTriggerType: 'time',
  popupFrequency: 15,
};
