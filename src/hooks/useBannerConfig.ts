import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BannerConfig, DEFAULT_BANNER_CONFIG } from '../types/banner';
import { getCachedData, setCachedData, CacheTTL } from '../services/cacheService';
import { useAuth } from '../contexts/AuthContext';

const CACHE_KEY = 'sensei_banner_config_v2';

export function useBannerConfig() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<BannerConfig>(() => {
    const cached = getCachedData<BannerConfig>(CACHE_KEY, true);
    if (cached) return { ...DEFAULT_BANNER_CONFIG, ...cached };
    return DEFAULT_BANNER_CONFIG;
  });

  useEffect(() => {
    // 1. Instant Cache Hydration
    const cached = getCachedData<BannerConfig>(CACHE_KEY, true);
    if (cached) {
      setConfig({ ...DEFAULT_BANNER_CONFIG, ...cached });
    }

    // 2. Admin Live Listener vs Student Session Throttle (Exam Shield)
    let unsubscribe = () => {};

    if (isAdmin) {
      unsubscribe = onSnapshot(
        doc(db, 'settings', 'heroImages'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as BannerConfig;
            const merged = { ...DEFAULT_BANNER_CONFIG, ...data };
            setConfig(merged);
            setCachedData(CACHE_KEY, merged, CacheTTL.LONG);
          }
        },
        (err) => console.warn('Admin banner live listener error:', err)
      );
    } else {
      const now = Date.now();
      const lastCheck = Number(sessionStorage.getItem('sensei_banner_last_check') || 0);
      const THROTTLE_MS = 60 * 60 * 1000; // 1 hour per session

      if (!cached || now - lastCheck > THROTTLE_MS) {
        getDoc(doc(db, 'settings', 'heroImages'))
          .then((snap) => {
            if (snap.exists()) {
              const data = snap.data() as BannerConfig;
              const merged = { ...DEFAULT_BANNER_CONFIG, ...data };
              setConfig(merged);
              setCachedData(CACHE_KEY, merged, CacheTTL.LONG);
              sessionStorage.setItem('sensei_banner_last_check', String(now));
            }
          })
          .catch((err) => {
            console.warn('Student banner fetch error, fallback to cache:', err);
          });
      }
    }

    // 3. Local custom event listener for instant reflection across tabs
    const handleLocalUpdate = (e: any) => {
      if (e.detail) {
        setConfig((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('sensei_hero_images_updated', handleLocalUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('sensei_hero_images_updated', handleLocalUpdate);
    };
  }, [isAdmin]);

  return config;
}

// Global helper to track doc clicks for 'docs' popup trigger
export function incrementDocViewCounter(): number {
  try {
    const current = Number(sessionStorage.getItem('sensei_doc_views_count') || 0) + 1;
    sessionStorage.setItem('sensei_doc_views_count', String(current));
    window.dispatchEvent(new CustomEvent('sensei_doc_viewed', { detail: { count: current } }));
    return current;
  } catch (e) {
    return 1;
  }
}
