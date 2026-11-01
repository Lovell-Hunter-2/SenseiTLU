import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function getVietnamDateString() {
  const date = new Date();
  const vnTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return vnTime.getUTCFullYear() + '-' + 
         String(vnTime.getUTCMonth() + 1).padStart(2, '0') + '-' + 
         String(vnTime.getUTCDate()).padStart(2, '0');
}

/**
 * Returns accurate info about Google Firestore's 24-hour quota reset cycle.
 * Google Cloud / Firestore daily free quotas reset at 00:00:00 US Pacific Time (America/Los_Angeles):
 * - Daylight Saving Time (PDT, Summer): 00:00 PDT = 07:00 UTC = 14:00:00 Vietnam Time (UTC+7)
 * - Standard Time (PST, Winter): 00:00 PST = 08:00 UTC = 15:00:00 Vietnam Time (UTC+7)
 */
export function getQuotaCycleInfo() {
  const now = new Date();

  // Robustly extract timezone components in America/Los_Angeles
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  parts.forEach(p => { partMap[p.type] = p.value; });

  const year = partMap.year || String(now.getFullYear());
  const month = partMap.month || String(now.getMonth() + 1).padStart(2, '0');
  const day = partMap.day || String(now.getDate()).padStart(2, '0');
  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const second = parseInt(partMap.second || '0', 10);
  const tzName = partMap.timeZoneName || 'PDT';

  // PDT (Summer time, UTC-7) -> 14:00 VN | PST (Winter time, UTC-8) -> 15:00 VN
  const isPDT = tzName === 'PDT';
  const resetHourVN = isPDT ? 14 : 15;
  const resetTimeShortVN = isPDT ? '14:00' : '15:00';
  const resetTimeVN = isPDT ? '14:00 (Mùa hè PDT)' : '15:00 (Mùa đông PST)';

  // The cycle ID corresponds to the date in Pacific Time: YYYY-MM-DD
  const cycleId = `${year}-${month}-${day}`;

  // Next reset happens at 24:00:00 (00:00:00 of the next day) in Pacific Time
  const secondsSinceMidnightPT = hour * 3600 + minute * 60 + second;
  const secondsInDay = 86400;
  const secondsRemaining = Math.max(0, secondsInDay - secondsSinceMidnightPT);

  const hoursRemaining = Math.floor(secondsRemaining / 3600);
  const minutesRemaining = Math.floor((secondsRemaining % 3600) / 60);

  return {
    cycleId,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    resetHourVN,
    resetTimeShortVN,
    resetTimeVN,
    isPDT,
    tzName,
    currentPTHour: hour,
    currentPTMinute: minute
  };
}

export async function resetCurrentQuotaToZero() {
  try {
    const { cycleId, resetTimeVN } = getQuotaCycleInfo();
    const quotaRef = doc(db, 'analytics', `quota_cycle_${cycleId}`);
    await setDoc(quotaRef, {
      cycleId,
      estimatedReads: 0,
      estimatedWrites: 0,
      estimatedDeletes: 0,
      realtimeReads: 0,
      resetTimeVN,
      lastResetAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
  } catch (err) {
    console.error('Error resetting current quota cycle:', err);
    throw err;
  }
}

export async function logFirestoreRead(count = 1) {
  try {
    const { cycleId } = getQuotaCycleInfo();
    const quotaRef = doc(db, 'analytics', `quota_cycle_${cycleId}`);
    await setDoc(quotaRef, {
      cycleId,
      estimatedReads: increment(count),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Error logging firestore read:', err);
  }
}

export async function updatePresence(userUid?: string) {
  try {
    let sid = sessionStorage.getItem('tlu_session_id');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('tlu_session_id', sid);
    }
    const lastPresence = sessionStorage.getItem('tlu_presence_last');
    const now = Date.now();
    // Only write to Firestore at most once every 6 minutes per session to save writes
    if (lastPresence && now - Number(lastPresence) < 6 * 60 * 1000) {
      return;
    }
    sessionStorage.setItem('tlu_presence_last', String(now));

    const presenceRef = doc(db, 'presence', sid);
    await setDoc(presenceRef, {
      sid,
      userUid: userUid || 'anonymous',
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    // ignore
  }
}

export async function logFirestoreWrite(count = 1) {
  try {
    const { cycleId } = getQuotaCycleInfo();
    const quotaRef = doc(db, 'analytics', `quota_cycle_${cycleId}`);
    await setDoc(quotaRef, {
      cycleId,
      estimatedWrites: increment(count),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Error logging firestore write:', err);
  }
}

export async function logFirestoreDelete(count = 1) {
  try {
    const { cycleId } = getQuotaCycleInfo();
    const quotaRef = doc(db, 'analytics', `quota_cycle_${cycleId}`);
    await setDoc(quotaRef, {
      cycleId,
      estimatedDeletes: increment(count),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Error logging firestore delete:', err);
  }
}

export async function calibrateQuotaCycle(data: Partial<{
  estimatedReads: number;
  estimatedWrites: number;
  estimatedDeletes: number;
  activeConnections: number;
  storedDataMB: number;
  networkEgressMB: number;
}>) {
  try {
    const { cycleId } = getQuotaCycleInfo();
    const quotaRef = doc(db, 'analytics', `quota_cycle_${cycleId}`);
    await setDoc(quotaRef, {
      cycleId,
      ...data,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Error calibrating quota cycle:', err);
    throw err;
  }
}

export async function logGlobalPageView() {
  try {
    const now = new Date();
    const today = getVietnamDateString();
    const { cycleId } = getQuotaCycleInfo();
    
    // Deduplicate per user session: count 1 visit per 30 minutes in this session
    const sessionKey = `sensei_visit_${today}`;
    const lastVisit = sessionStorage.getItem(sessionKey);
    const currentTime = Date.now();
    if (lastVisit && currentTime - Number(lastVisit) < 30 * 60 * 1000) {
      return;
    }
    sessionStorage.setItem(sessionKey, String(currentTime));

    // Convert to VN time for hourly tracking too
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = vnTime.getUTCHours().toString().padStart(2, '0');
    
    // Log daily (1 write)
    const dailyRef = doc(db, 'analytics', `daily_visits_${today}`);
    await setDoc(dailyRef, {
      visits: increment(1),
      date: today,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Log hourly (1 write)
    const hourlyRef = doc(db, 'analytics', `hourly_visits_${today}_${hour}`);
    await setDoc(hourlyRef, {
      visits: increment(1),
      date: today,
      hour: hour,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Total (1 write)
    const totalRef = doc(db, 'analytics', 'total_visits');
    await setDoc(totalRef, {
      visits: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Quota Cycle Tracker (1 write per new session)
    const quotaRef = doc(db, 'analytics', `quota_cycle_${cycleId}`);
    await setDoc(quotaRef, {
      cycleId,
      estimatedReads: increment(3),
      estimatedWrites: increment(3),
      realtimeReads: increment(1),
      pageViews: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging global page view:', error);
  }
}

export async function logSubjectView(subjectId: string, subjectName: string) {
  try {
    if (!subjectId) return;
    const today = getVietnamDateString();
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = vnTime.getUTCHours().toString().padStart(2, '0');

    // Deduplicate per subject in session (1 view counted per 15 minutes)
    const sessionKey = `sess_sub_${subjectId}`;
    const lastView = sessionStorage.getItem(sessionKey);
    const currentTime = Date.now();
    if (lastView && currentTime - Number(lastView) < 15 * 60 * 1000) {
      return;
    }
    sessionStorage.setItem(sessionKey, String(currentTime));

    // Total and timeframe subject views stored directly on subject doc (1 single write!)
    const subjectRef = doc(db, 'analytics_subjects', subjectId);
    await setDoc(subjectRef, {
      name: subjectName,
      views: increment(1),
      [`daily_${today}`]: increment(1),
      [`hourly_${today}_${hour}`]: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging subject view:', error);
  }
}

export async function logDocumentView(docTitle: string, subjectName: string) {
  try {
    if (!docTitle) return;
    const today = getVietnamDateString();
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = vnTime.getUTCHours().toString().padStart(2, '0');

    // Generate a safe id from document title
    const docId = docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!docId) return;

    // Deduplicate per document in session (1 view counted per 15 minutes)
    const sessionKey = `sess_doc_${docId}`;
    const lastView = sessionStorage.getItem(sessionKey);
    const currentTime = Date.now();
    if (lastView && currentTime - Number(lastView) < 15 * 60 * 1000) {
      return;
    }
    sessionStorage.setItem(sessionKey, String(currentTime));

    // Total and timeframe document views stored directly on doc doc (1 single write!)
    const docRef = doc(db, 'analytics_documents', docId);
    await setDoc(docRef, {
      title: docTitle,
      subjectName,
      views: increment(1),
      [`daily_${today}`]: increment(1),
      [`hourly_${today}_${hour}`]: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging document view:', error);
  }
}
