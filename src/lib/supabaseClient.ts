// Migrated to Firebase Auth and Firestore.
import { getFirebaseConfig } from './firebaseClient';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const fbConfig = getFirebaseConfig();
  return {
    url: fbConfig.projectId,
    anonKey: fbConfig.firestoreDatabaseId,
    isConnected: fbConfig.isConnected,
  };
}

export function saveSupabaseConfig(_url: string, _anonKey: string): boolean {
  return true;
}

export function clearSupabaseConfig(): void {}

export function getSupabase(): any {
  return null;
}

export async function testSupabaseConnection(_url: string, _key: string): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: 'Backend migrated to Google Firebase.'
  };
}
