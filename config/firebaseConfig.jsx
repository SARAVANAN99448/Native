// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1ZV8B4WHhwdRCiQJfxeV53P38Z0WJuMU",
  authDomain: "vint-app-da1fa.firebaseapp.com",
  projectId: "vint-app-da1fa",
  storageBucket: "vint-app-da1fa.firebasestorage.app",
  messagingSenderId: "656074835735",
  appId: "1:656074835735:web:7eebf6772bc47c92ee9952",
  measurementId: "G-YSQ28Z50E8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { RecaptchaVerifier, signInWithPhoneNumber }
