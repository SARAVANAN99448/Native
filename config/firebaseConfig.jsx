// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpXewQpdfU7XW2rieHhK7kbc-rTcMLQXs",
  authDomain: "vint-dee9e.firebaseapp.com",
  projectId: "vint-dee9e",
  storageBucket: "vint-dee9e.firebasestorage.app",
  messagingSenderId: "519474355253",
  appId: "1:519474355253:web:4b65f6ae194dd28bdd657c",
  measurementId: "G-RTQCHZCR1R"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { RecaptchaVerifier, signInWithPhoneNumber }
