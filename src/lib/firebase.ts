import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXhvKjTbVgTSHNAGxLplJO7Kwydc3Y05U",
  authDomain: "bcomtravel.firebaseapp.com",
  projectId: "bcomtravel",
  storageBucket: "bcomtravel.firebasestorage.app",
  messagingSenderId: "985377398962",
  appId: "1:985377398962:web:d7dd67948dfed3e11229ab"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, rtdb, storage };
