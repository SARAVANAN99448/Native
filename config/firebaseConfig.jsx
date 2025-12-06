import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import {
  initializeAuth,
  getReactNativePersistence,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB1ZV8B4WHhwdRCiQJfxeV53P38Z0WJuMU",
  authDomain: "vint-app-da1fa.firebaseapp.com",
  projectId: "vint-app-da1fa",
  storageBucket: "vint-app-da1fa.firebasestorage.app",
  messagingSenderId: "656074835735",
  appId: "1:656074835735:web:7eebf6772bc47c92ee9952",
  measurementId: "G-YSQ28Z50E8"
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth with React Native AsyncStorage persistence
export const auth = initializeAuth(app, {
});

// Export RecaptchaVerifier and signInWithPhoneNumber for phone auth usage
export { RecaptchaVerifier, signInWithPhoneNumber };
