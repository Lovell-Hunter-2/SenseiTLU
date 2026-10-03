import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function getVietnamDateString() {
  const date = new Date();
  const vnTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return vnTime.getUTCFullYear() + '-' + 
         String(vnTime.getUTCMonth() + 1).padStart(2, '0') + '-' + 
         String(vnTime.getUTCDate()).padStart(2, '0');
}

export async function logGlobalPageView() {
  try {
    const now = new Date();
    const today = getVietnamDateString();
    
    // Convert to VN time for hourly tracking too
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = vnTime.getUTCHours().toString().padStart(2, '0');
    
    // Log daily
    const dailyRef = doc(db, 'analytics', `daily_visits_${today}`);
    await setDoc(dailyRef, {
      visits: increment(1),
      date: today,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Log hourly
    const hourlyRef = doc(db, 'analytics', `hourly_visits_${today}_${hour}`);
    await setDoc(hourlyRef, {
      visits: increment(1),
      date: today,
      hour: hour,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Total
    const totalRef = doc(db, 'analytics', 'total_visits');
    await setDoc(totalRef, {
      visits: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging global page view:', error);
  }
}

export async function logSubjectView(subjectId: string, subjectName: string) {
  try {
    const today = getVietnamDateString();
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = vnTime.getUTCHours().toString().padStart(2, '0');

    // Total and timeframe subject views stored directly on subject doc
    const subjectRef = doc(db, 'analytics_subjects', subjectId);
    await setDoc(subjectRef, {
      name: subjectName,
      views: increment(1),
      [`daily_${today}`]: increment(1),
      [`hourly_${today}_${hour}`]: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Track global subject hourly total for today
    const hourlySubRef = doc(db, 'analytics', `sub_hourly_${today}_${hour}`);
    await setDoc(hourlySubRef, {
      visits: increment(1),
      date: today,
      hour: hour,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Track global subject daily total
    const dailyTotalSubRef = doc(db, 'analytics', `sub_daily_${today}`);
    await setDoc(dailyTotalSubRef, {
      visits: increment(1),
      date: today,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging subject view:', error);
  }
}

export async function logDocumentView(docTitle: string, subjectName: string) {
  try {
    const today = getVietnamDateString();
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = vnTime.getUTCHours().toString().padStart(2, '0');

    // Generate a safe id from document title
    const docId = docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!docId) return;

    // Total and timeframe document views stored directly on doc doc
    const docRef = doc(db, 'analytics_documents', docId);
    await setDoc(docRef, {
      title: docTitle,
      subjectName,
      views: increment(1),
      [`daily_${today}`]: increment(1),
      [`hourly_${today}_${hour}`]: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Track global document hourly total for today
    const hourlyDocRef = doc(db, 'analytics', `doc_hourly_${today}_${hour}`);
    await setDoc(hourlyDocRef, {
      visits: increment(1),
      date: today,
      hour: hour,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Track global document daily total
    const dailyTotalDocRef = doc(db, 'analytics', `doc_daily_${today}`);
    await setDoc(dailyTotalDocRef, {
      visits: increment(1),
      date: today,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging document view:', error);
  }
}
