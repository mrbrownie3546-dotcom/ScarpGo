import { auth, db, testFirestoreConnection } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirebaseConfig {
  projectId: string;
  authDomain: string;
  firestoreDatabaseId: string;
  isConnected: boolean;
}

export function getFirebaseConfig(): FirebaseConfig {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    isConnected: Boolean(firebaseConfig.projectId && firebaseConfig.apiKey),
  };
}

export async function testFirebaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const isOk = await testFirestoreConnection();
    if (isOk) {
      return {
        success: true,
        message: `Connected to Firebase project '${firebaseConfig.projectId}' successfully! (Auth & Firestore Active)`
      };
    } else {
      return {
        success: false,
        message: 'Could not connect to Firebase Firestore.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Firebase connection check failed.'
    };
  }
}
