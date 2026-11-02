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
let lastRevalidationTime = 0;

/**
 * Revalidate the catalog from CDN in the background without blocking the UI.
 * If a newer version/lastUpdated is found, updates cache and dispatches 'sensei-catalog-updated'.
 */
export async function revalidateCatalogInBackground(force = false): Promise<CatalogData | null> {
  const now = Date.now();
  // Throttle background check to at most once every 30 seconds unless forced
  if (!force && now - lastRevalidationTime < 30 * 1000) {
    return memoryCatalog;
  }
  lastRevalidationTime = now;

  try {
    const url = `/data/catalog.json?v=${now}`;
    const response = await fetch(url, {
      cache: 'no-cache',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return null;
    const incoming: CatalogData = await response.json();
    if (!incoming || !Array.isArray(incoming.subjects) || incoming.subjects.length === 0) return null;

    const currentVersion = memoryCatalog?.version || 0;
    const currentUpdated = memoryCatalog?.lastUpdated || '';

    // Check if new catalog is available
    const isNewer = incoming.version > currentVersion || incoming.lastUpdated !== currentUpdated;
    if (isNewer || !memoryCatalog) {
      console.log('[CatalogService] Newer catalog detected on CDN. Auto-updating client cache...', incoming.version, incoming.lastUpdated);
      memoryCatalog = incoming;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incoming));
      } catch (e) {}

      // Dispatch event for active UI components to update live without reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sensei-catalog-updated', { detail: incoming }));
      }
    }
    return incoming;
  } catch (err) {
    // Network error or offline - silently ignore
    return null;
  }
}

/**
 * Load the catalog from static file or cache (Stale-While-Revalidate)
 * Returns cached catalog instantly (0ms) and checks for updates in background.
 */
export async function loadCatalog(forceFresh = false): Promise<CatalogData | null> {
  if (forceFresh) {
    return revalidateCatalogInBackground(true);
  }

  // 1. If memory catalog exists, return immediately & trigger background revalidation
  if (memoryCatalog) {
    revalidateCatalogInBackground(false).catch(() => {});
    return memoryCatalog;
  }

  // 2. Check LocalStorage next
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed: CatalogData = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
        memoryCatalog = parsed;
        // Trigger background revalidation to ensure latest version from Vercel CDN
        revalidateCatalogInBackground(false).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {
    // ignore parsing error
  }

  // 3. Fallback: First time visitor with empty cache - fetch directly
  if (isFetchingPromise) {
    return isFetchingPromise;
  }

  isFetchingPromise = (async () => {
    try {
      const url = `/data/catalog.json?v=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: { 'Accept': 'application/json' }
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
      console.warn('[CatalogService] Could not load /data/catalog.json:', err);
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
 * Sync catalog directly to GitHub repository via GitHub REST API
 * This triggers an automatic Vercel redeployment without any manual downloads or git commands!
 */
export async function syncCatalogToGitHub(
  data: CatalogData,
  token: string,
  owner: string = 'Lovell-Hunter-2',
  repo: string = 'SenseiTLU',
  branch: string = 'main'
): Promise<{ success: boolean; message: string; commitUrl?: string; sha?: string }> {
  try {
    const filePath = 'public/data/catalog.json';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // 1. Get current file SHA if exists
    let sha: string | undefined;
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github+json',
      }
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      throw new Error(`Không thể kết nối GitHub (Mã ${getRes.status}): ${errText}`);
    }

    // 2. Base64 encode JSON
    const jsonStr = JSON.stringify(data, null, 2);
    // Safe utf-8 base64 encoding in browser
    const base64Content = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );

    // 3. Put to GitHub
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Chore: Cập nhật catalog.json (${data.subjects.length} môn học) qua Sensei Admin`,
        content: base64Content,
        sha: sha,
        branch: branch
      })
    });

    if (!putRes.ok) {
      const putErr = await putRes.text();
      throw new Error(`GitHub từ chối lưu file (${putRes.status}): ${putErr}`);
    }

    const putData = await putRes.json();
    return {
      success: true,
      message: `Đã đẩy commit lên GitHub thành công! Vercel đang tự động kích hoạt Build & Deploy (~30s).`,
      commitUrl: putData.commit?.html_url,
      sha: putData.commit?.sha
    };
  } catch (err: any) {
    console.error('Error syncing catalog to GitHub:', err);
    return {
      success: false,
      message: err.message || 'Lỗi khi đồng bộ lên GitHub'
    };
  }
}
