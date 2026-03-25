import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMmWF1y1nH1PXmW06H7j6WYwocK7UibLY",
  authDomain: "financiero-abca3.firebaseapp.com",
  projectId: "financiero-abca3",
  storageBucket: "financiero-abca3.firebasestorage.app",
  messagingSenderId: "754827764032",
  appId: "1:754827764032:web:2c457e8117fbc6a6541aa5",
  measurementId: "G-4CS58BJN04"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
