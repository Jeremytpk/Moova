import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

/**
 * Firebase Configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyC0Q2XXte-AhP8h6veB5jpa0tu_Egnu-d4",
  authDomain: "moova-ff8e6.firebaseapp.com",
  projectId: "moova-ff8e6",
  storageBucket: "moova-ff8e6.firebasestorage.app",
  messagingSenderId: "304560983590",
  appId: "1:304560983590:web:4ada43a30146c30280e0e7",
  measurementId: "G-GXRM9JRVDG"
};

// Initialize Firebase - singleton pattern
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services (web-compatible)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
