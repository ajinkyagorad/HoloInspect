import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const signInWithGoogle = async (): Promise<string | null> => {
  if (isSigningIn) {
    console.log('Sign-in already in progress...');
    return null;
  }
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential) {
      cachedAccessToken = credential.accessToken ?? null;
      return cachedAccessToken;
    }
  } catch (error) {
    console.error('Error signing in with Google', error);
  } finally {
    isSigningIn = false;
  }
  return null;
};

export const getCachedAccessToken = () => cachedAccessToken;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});
