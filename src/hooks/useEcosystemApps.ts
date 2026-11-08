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
];

// Helper to filter out removed/obsolete apps (Hỏi AI, Hỗ trợ, etc.)
const isAllowedApp = (app: EcosystemAppItem) => {
  return (
    app.id !== 'lich-hoc' &&
    app.id !== 'thi-online-ai' &&
    app.name !== 'Lịch học' &&
    app.name !== 'Thi online AI' &&
    app.id !== 'hoi-ai' &&
    app.id !== 'ho-tro' &&
    app.name !== 'Hỏi AI' &&
    app.name !== 'Hỗ trợ'
  );
};

export function useEcosystemApps() {
  const [apps, setApps] = useState<EcosystemAppItem[]>(() => {
    const cached = getCachedData<EcosystemAppItem[]>('ecosystem_apps', true);
    if (cached && cached.length > 0) {
      const validCached = cached.filter(isAllowedApp);
      const merged = [...validCached];
      for (const def of DEFAULT_ECOSYSTEM_APPS) {
        if (!merged.some((a) => a.id === def.id)) {
          merged.push(def);
        }
      }
      return merged;
    }
    return DEFAULT_ECOSYSTEM_APPS;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const lastCheck = Number(sessionStorage.getItem('sensei_ecosystem_last_check') || 0);
    const THROTTLE_MS = 60 * 60 * 1000; // 1 hour per session

    const cached = getCachedData<EcosystemAppItem[]>('ecosystem_apps', true);

    // If cache is fresh (< 1 hour in this session), skip Firestore read completely (0 reads!)
    if (cached && cached.length > 0 && now - lastCheck < THROTTLE_MS) {
      return;
    }

    const fetchApps = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'ecosystem'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const appsData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EcosystemAppItem[];

        const validFetched = appsData.filter(isAllowedApp);
        const merged = [...validFetched];
        for (const def of DEFAULT_ECOSYSTEM_APPS) {
          if (!merged.some((a) => a.id === def.id)) {
            merged.push(def);
          }
        }
        setApps(merged);
        setCachedData('ecosystem_apps', merged, CacheTTL.LONG);
        sessionStorage.setItem('sensei_ecosystem_last_check', String(now));
      } catch (err) {
        console.warn('Error fetching ecosystem apps, using cache:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();

    const handleLocalUpdate = () => {
      const fresh = getCachedData<EcosystemAppItem[]>('ecosystem_apps', true);
      if (fresh && fresh.length > 0) {
        setApps(fresh.filter(isAllowedApp));
      }
    };
    window.addEventListener('sensei_ecosystem_updated', handleLocalUpdate);

    return () => {
      window.removeEventListener('sensei_ecosystem_updated', handleLocalUpdate);
    };
  }, []);

  return { apps, loading };
}
