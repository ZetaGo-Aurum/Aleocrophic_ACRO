import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyChYqRWtR-RfrPYn_DY-aGJ5rOLPvOBeKI",
  authDomain: "server-media-75fdc.firebaseapp.com",
  projectId: "server-media-75fdc",
  storageBucket: "server-media-75fdc.firebasestorage.app",
  messagingSenderId: "846086849982",
  appId: "1:846086849982:web:0e5cdedea82a84de7b25ef",
  measurementId: "G-J9J2V2X8S4"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
