import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!key) {
    console.error('❌ FATAL: FIREBASE_SERVICE_ACCOUNT_KEY is missing from Environment Variables.');
    throw new Error('Server detected missing FIREBASE_SERVICE_ACCOUNT_KEY. Check Vercel Settings.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(key);
  } catch (e) {
    console.error('❌ FATAL: FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.', e);
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Please minify it.');
  }

  console.log('✅ Initializing Firebase Admin with Service Account');
  
  return initializeApp({
    credential: cert(serviceAccount),
    projectId: 'server-media-75fdc' 
  });
}

export function getAdminDb() {
  const app = getAdminApp();
  return getFirestore(app);
}
