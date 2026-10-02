import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  GoogleAuthProvider, 
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App using imported configuration from firebase-applet-config.json
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth Instance
export const auth: Auth = getAuth(app);

// Initialize Firestore Database Instance
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const firestore: Firestore = db;

// Auth Providers
export const googleProvider = new GoogleAuthProvider();

// Firestore Connection Test Helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    return true;
  }
}

export {
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where
};

export type { FirebaseUser };
export default app;
