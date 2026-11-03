import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function logErrorToFirestore(
  type: string, 
  message: string, 
  severity: 'Nghiêm trọng' | 'Cảnh báo' | 'Thấp', 
  location: string, 
  details?: string, 
  userEmail?: string | null
) {
  // 1. Filter out all noise and Firestore-related errors to prevent cascading write storms
  const combined = (message + ' ' + (details || '') + ' ' + location).toLowerCase();
  if (
    combined.includes('quota') ||
    combined.includes('resource-exhausted') ||
    combined.includes('firestore') ||
    combined.includes('failed to fetch') ||
    combined.includes('network') ||
    combined.includes('timeout') ||
    combined.includes('load failed') ||
    combined.includes('chunkload')
  ) {
    return;
  }

  // 2. Strict session throttling: at most 1 error log per session
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('sensei_err_logged')) return;
      sessionStorage.setItem('sensei_err_logged', '1');
    }
  } catch (e) {}

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
    // Silently ignore to avoid unhandled rejections
  }
}
