import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT;

if (firebaseConfig) {
  try {
    const serviceAccount = JSON.parse(firebaseConfig);
    
    // Fix for environment variable parsing where \n becomes literal string '\\n'
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized ✅');
    }
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT not found in .env. Firebase features will be disabled.');
}

export const db: admin.firestore.Firestore | null = admin.apps.length ? admin.firestore() : null;
export const auth: ReturnType<typeof admin.auth> | null = admin.apps.length ? admin.auth() : null;
