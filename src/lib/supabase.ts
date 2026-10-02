// Deprecated: Migrated fully to Firebase Auth and Cloud Firestore.
// Re-exporting dummy objects to prevent breakage if imported by third-party modules.

export const supabase = {
  auth: {
    signInWithPassword: async () => ({ data: null, error: new Error("Migrated to Firebase Auth") }),
    signUp: async () => ({ data: null, error: new Error("Migrated to Firebase Auth") }),
    signInWithOtp: async () => ({ data: null, error: new Error("Migrated to Firebase Auth") }),
    verifyOtp: async () => ({ data: null, error: new Error("Migrated to Firebase Auth") }),
    updateUser: async () => ({ data: null, error: new Error("Migrated to Firebase Auth") }),
  }
} as any;

export function getSupabaseClient() {
  return supabase;
}

export default supabase;
