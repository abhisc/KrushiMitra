// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDK48h-n9JK6dkn-nef-lkqnGT1WKbOvfY",
  authDomain: "krushimitra-67d3e.firebaseapp.com",
  projectId: "krushimitra-67d3e",
  storageBucket: "krushimitra-67d3e.firebasestorage.app",
  messagingSenderId: "498678577391",
  appId: "1:498678577391:web:b13eed06b75d339146431a",
  measurementId: "G-KW86VG3CEY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export the app instance
export default app; 