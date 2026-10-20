// Firebase Auth me naya user banana BINA current admin ka session tode.
// Trick: temporary secondary app instance - usme user banta hai, phir
// sign out + delete. Admin ka primary session safe rehta hai.
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export async function createAuthUserWithoutSignOut(
  email: string,
  password: string
): Promise<{ success: boolean; uid?: string; message: string }> {
  const appName = `provision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    try {
      await signOut(secondaryAuth);
    } catch (e) { /* ignore */ }
    return { success: true, uid: cred.user.uid, message: 'Account created' };
  } catch (err: any) {
    const code = err?.code || '';
    let message = err?.message || 'Firebase account creation failed.';
    if (code === 'auth/email-already-in-use') message = 'Is email pe pehle se account hai. Dusra email try karo ya usi se login karwao.';
    if (code === 'auth/weak-password') message = 'Password kam se kam 6 characters ka hona chahiye.';
    if (code === 'auth/invalid-email') message = 'Email address sahi nahi lag raha.';
    return { success: false, message };
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (e) { /* ignore */ }
  }
}
