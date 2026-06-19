import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function logGlobalPageView() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = doc(db, 'analytics', `daily_visits_${today}`);
    await setDoc(dailyRef, {
      visits: increment(1),
      date: today,
      lastUpdated: serverTimestamp()
    }, { merge: true });

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
