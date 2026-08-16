import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export let appCheck: any = null;

// Initialize Firebase App Check if a reCAPTCHA site key is provided
if ((firebaseConfig as any).recaptchaSiteKey) {
  try {
    // Note: App Check might fail to initialize in dev environments without debug tokens
    // but this setup prepares the app for production use.
    if (typeof window !== 'undefined') {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NODE_ENV !== 'production';
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider((firebaseConfig as any).recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  } catch (error) {
    console.error("Firebase App Check initialization error:", error);
  }
}

// Initialize Firestore with Offline Persistence Cache enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
// Removed drive scope to avoid unverified app warnings for regular users
