import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Base configuration supported via environment variables
let firebaseConfig: Record<string, any> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
};

// Safely load local firebase-applet-config.json if present without failing builds if missing
try {
  const configs: Record<string, any> = import.meta.glob('/firebase-applet-config.json', { eager: true });
  const localConfig = configs['/firebase-applet-config.json'];
  if (localConfig?.default) {
    firebaseConfig = { ...firebaseConfig, ...localConfig.default };
  } else if (localConfig) {
    firebaseConfig = { ...firebaseConfig, ...localConfig };
  }
} catch {
  // Fallback to environment variables
}

// Fallback to relative path lookup
if (!firebaseConfig.apiKey) {
  try {
    const configs: Record<string, any> = import.meta.glob('../../firebase-applet-config.json', { eager: true });
    const localConfig = configs['../../firebase-applet-config.json'];
    if (localConfig?.default) {
      firebaseConfig = { ...firebaseConfig, ...localConfig.default };
    } else if (localConfig) {
      firebaseConfig = { ...firebaseConfig, ...localConfig };
    }
  } catch {
    // Fallback
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
