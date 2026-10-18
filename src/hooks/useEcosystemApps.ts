import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { getCachedData, setCachedData, CacheTTL } from '../services/cacheService';

export interface EcosystemAppItem {
  id: string;
  name: string;
  description?: string;
  url?: string;
  path?: string; // internal route if any
  iconName: string;
  colorTheme: string;
  isSpecialAction?: 'ai-assistant';
}

export const DEFAULT_ECOSYSTEM_APPS: EcosystemAppItem[] = [
  {
    id: 'study-space',
    name: 'Study Space',
    description: 'Không gian học tập & tập trung',
    path: '/workspace',
    iconName: 'Layers',
    colorTheme: 'blue',
  },
  {
    id: 'thi-online-ai',
    name: 'Thi online AI',
    description: 'Luyện đề thi trắc nghiệm AI',
    path: '/mock-exam',
    iconName: 'Brain',
    colorTheme: 'rose',
  },
  {
    id: 'lich-hoc',
    name: 'Lịch học',
    description: 'Xem thời khóa biểu & lịch thi',
    url: 'http://dangkyhoc.tlu.edu.vn/',
    iconName: 'Calendar',
    colorTheme: 'violet',
  },
  {
    id: 'hoi-ai',
    name: 'Hỏi AI',
    description: 'Trợ lý thông minh hỗ trợ giải đáp',
    iconName: 'Bot',
    colorTheme: 'emerald',
    isSpecialAction: 'ai-assistant',
  },
  {
    id: 'ho-tro',
    name: 'Hỗ trợ',
    description: 'Liên hệ hỗ trợ & giải đáp thắc mắc',
    url: 'https://www.facebook.com/lovelltitussof1910',
    iconName: 'MessageCircle',
    colorTheme: 'amber',
  },
];

export function useEcosystemApps() {
  const [apps, setApps] = useState<EcosystemAppItem[]>(() => {
    const cached = getCachedData<EcosystemAppItem[]>('ecosystem_apps');
    if (cached && cached.length > 0) {
      const merged = [...cached];
      for (const def of DEFAULT_ECOSYSTEM_APPS) {
        if (!merged.some(a => a.id === def.id)) {
          merged.push(def);
        }
      }
      return merged;
    }
    return DEFAULT_ECOSYSTEM_APPS;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'ecosystem'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const appsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EcosystemAppItem[];

        if (appsData.length > 0) {
          // Ensure essential apps (study-space, ho-tro) are always included
          const merged = [...appsData];
          for (const def of DEFAULT_ECOSYSTEM_APPS) {
            if (!merged.some(a => a.id === def.id)) {
              merged.push(def);
            }
          }
          setApps(merged);
          setCachedData('ecosystem_apps', merged, CacheTTL.VERY_LONG);
        } else {
          setApps(DEFAULT_ECOSYSTEM_APPS);
        }
      } catch (err) {
        console.warn('Error fetching ecosystem apps from Firestore, using fallback:', err);
        const stale = getCachedData<EcosystemAppItem[]>('ecosystem_apps', true);
        if (stale && stale.length > 0) {
          const merged = [...stale];
          for (const def of DEFAULT_ECOSYSTEM_APPS) {
            if (!merged.some(a => a.id === def.id)) {
              merged.push(def);
            }
          }
          setApps(merged);
        } else {
          setApps(DEFAULT_ECOSYSTEM_APPS);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  return { apps, loading };
}
