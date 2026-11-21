export type WebTheme = 'default' | 'christmas';

export interface MascotOption {
  id: string;
  src: string;
  name: string;
  description: string;
  tag?: string;
}

export const DEFAULT_MAIN_MASCOT = '/capytlu_mangto.glb';

export const MASCOT_OPTIONS: MascotOption[] = [
  {
    id: 'mangto',
    src: '/capytlu_mangto.glb',
    name: 'CapyTLU Măng Tô',
    description: 'Khoác áo măng tô mùa đông ấm áp (tạm đặt mặc định)',
    tag: 'Mới',
  },
  {
    id: 'classic',
    src: '/capytlu.glb',
    name: 'CapyTLU Bản Gốc',
    description: 'Phiên bản đội bánh ChocoPie truyền thống SenseiTLU',
    tag: 'Gốc',
  },
  {
    id: 'hello',
    src: '/capytlu_hello.glb',
    name: 'CapyTLU Chào Hỏi',
    description: 'Tư thế vẫy tay thân thiện chào đón sinh viên',
  },
  {
    id: 'think',
    src: '/capytlu_think.glb',
    name: 'CapyTLU Suy Nghĩ',
    description: 'Dáng vẻ chăm chú giải đề và ôn tập cuối kỳ',
  },
  {
    id: 'bow',
    src: '/capytlu_bow.glb',
    name: 'CapyTLU Cúi Chào',
    description: 'Tư thế cúi đầu lễ phép (đang dùng ở màn bảo trì)',
  },
  {
    id: 'left',
    src: '/capytlu_left.glb',
    name: 'CapyTLU Nhìn Trái',
    description: 'Góc nghiêng hướng nhìn về phía nội dung bên trái',
  },
  {
    id: 'right',
    src: '/capytlu_right.glb',
    name: 'CapyTLU Nhìn Phải',
    description: 'Góc nghiêng hướng nhìn về phía nội dung bên phải',
  },
];

export interface BannerConfig {
  // 0. Giao diện Web & Mascot chính (Admin đồng bộ toàn web)
  webTheme?: WebTheme;
  mainMascot?: string;

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
  webTheme: 'default',
  mainMascot: DEFAULT_MAIN_MASCOT,
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
  popupTitle: '',
  popupTriggerType: 'time',
  popupFrequency: 15,
};
