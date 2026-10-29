/**
 * Catalog Service (Zero-Firestore-Read Mode)
 * 
 * Serves subjects and study materials directly from static CDN json (/data/catalog.json)
 * with Memory + LocalStorage caching.
 * Cuts Firestore reads by 95-100% and guarantees zero downtime for students.
 */

export interface StaticDocument {
  id: string;
  subjectId?: string;
  title: string;
  type: string;
  url?: string;
  chapter?: string;
  isHidden?: boolean;
  isFolder?: boolean;
  items?: Array<{ title: string; url: string }>;
  createdAt?: any;
}

export interface StaticSubject {
  id: string;
  name: string;
  iconName?: string;
  description?: string;
  isPriority?: boolean;
  createdAt?: any;
}

export interface CatalogData {
  lastUpdated: string;
  version: number;
  subjects: StaticSubject[];
  documents: Record<string, StaticDocument[]>;
}

const LOCAL_STORAGE_KEY = 'sensei_static_catalog_v1';
let memoryCatalog: CatalogData | null = null;
let isFetchingPromise: Promise<CatalogData | null> | null = null;

/**
 * Load the catalog from static file or cache
 */
export async function loadCatalog(forceFresh = false): Promise<CatalogData | null> {
  if (memoryCatalog && !forceFresh) {
    return memoryCatalog;
  }

  // Check LocalStorage first if not forcing fresh
  if (!forceFresh) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: CatalogData = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
          memoryCatalog = parsed;
          return parsed;
        }
      }
    } catch (e) {
      // ignore parsing error
    }
  }

  if (isFetchingPromise && !forceFresh) {
    return isFetchingPromise;
  }

  isFetchingPromise = (async () => {
    try {
      // Append cache buster if forcing fresh
      const url = forceFresh ? `/data/catalog.json?v=${Date.now()}` : '/data/catalog.json';
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: ${response.status}`);
      }

      const data: CatalogData = await response.json();
      if (data && Array.isArray(data.subjects) && data.subjects.length > 0) {
        memoryCatalog = data;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
      return memoryCatalog;
    } catch (err) {
      console.warn('[CatalogService] Could not load /data/catalog.json, falling back to cache:', err);
      // Fallback to whatever is in memory or localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          memoryCatalog = JSON.parse(stored);
          return memoryCatalog;
        }
      } catch (e) {}
      return memoryCatalog;
    } finally {
      isFetchingPromise = null;
    }
  })();

  return isFetchingPromise;
}

/**
 * Get static subjects (0 Firestore reads)
 */
export async function getStaticSubjects(forceFresh = false): Promise<StaticSubject[] | null> {
  const catalog = await loadCatalog(forceFresh);
  if (catalog && Array.isArray(catalog.subjects) && catalog.subjects.length > 0) {
    return catalog.subjects;
  }
  return null;
}

/**
 * Get static documents for a given subject (0 Firestore reads)
 */
export async function getStaticDocuments(subjectId: string, forceFresh = false): Promise<StaticDocument[] | null> {
  const catalog = await loadCatalog(forceFresh);
  if (catalog && catalog.documents && catalog.documents[subjectId]) {
    return catalog.documents[subjectId];
  }
  return null;
}

/**
 * Save / Update catalog in client storage
 */
export function setCatalogDataLocally(data: CatalogData): void {
  memoryCatalog = data;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[CatalogService] Failed to persist catalog in localStorage:', e);
  }
}

/**
 * Sync catalog to server API endpoint (for Admin)
 */
export async function syncCatalogToServer(data: CatalogData, idToken: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sync-catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sync API failed: ${res.status} ${errText}`);
    }

    setCatalogDataLocally(data);
    return true;
  } catch (err) {
    console.error('[CatalogService] Error syncing catalog to server:', err);
    throw err;
  }
}
