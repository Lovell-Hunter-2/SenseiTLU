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
