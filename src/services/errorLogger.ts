import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function logErrorToFirestore(type: string, message: string, severity: 'Nghiêm trọng' | 'Cảnh báo' | 'Thấp', location: string, details?: string, userEmail?: string | null) {
  try {
    const errorLogRef = collection(db, 'error_logs');
    await addDoc(errorLogRef, {
      type,
      message,
      severity,
      location,
      details: details || null,
      user: userEmail || 'guest',
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to write error log to Firestore:', err);
  }
}
