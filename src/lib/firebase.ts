

// src/lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCNzZWIa7leeX1xl_SU7m5vW_DuTPisT9Y",
  authDomain: "hospital-8e8d1.firebaseapp.com",
  projectId: "hospital-8e8d1",
  storageBucket: "hospital-8e8d1.firebasestorage.app",
  messagingSenderId: "580040490595",
  appId: "1:580040490595:web:2a1f4d96a22dc0eb904256",
  measurementId: "G-E3CDZTJW5J"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics only if supported (runs only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, analytics };
