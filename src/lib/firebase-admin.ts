import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();
const app = apps.length ? apps[0] : initializeApp({
  projectId: 'bcomtravel'
});

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
