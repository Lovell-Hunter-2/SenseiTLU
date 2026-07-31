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
    const subjectRef = doc(db, 'analytics_subjects', subjectId);
    await setDoc(subjectRef, {
      name: subjectName,
      views: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging subject view:', error);
  }
}

export async function logDocumentView(docTitle: string, subjectName: string) {
  try {
    // Generate a safe id from document title
    const docId = docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!docId) return;

    const docRef = doc(db, 'analytics_documents', docId);
    await setDoc(docRef, {
      title: docTitle,
      subjectName,
      views: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error logging document view:', error);
  }
}
