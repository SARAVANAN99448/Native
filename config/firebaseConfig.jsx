// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4tGVJ64A1ugxkiOHiChMVR5QNkWjGWwo",
  authDomain: "new-app-73741.firebaseapp.com",
  projectId: "new-app-73741",
  storageBucket: "new-app-73741.firebasestorage.app",
  messagingSenderId: "1080097552471",
  appId: "1:1080097552471:web:67458425395e091d178b12",
  measurementId: "G-MS4M8Q1MHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
