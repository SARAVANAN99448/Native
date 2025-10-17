import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential as signInWithPhoneCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, app } from "../config/firebaseConfig";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Alert, Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificationId, setVerificationId] = useState<string>("");

  // ✅ Google Auth setup
//   const [request, response, promptAsync] = Google.useAuthRequest({
//   clientId: "",
// });


  // ✅ Listen for Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const customerRef = doc(db, "customers", firebaseUser.uid);
        const techRef = doc(db, "technicians", firebaseUser.uid);

        const customerSnap = await getDoc(customerRef);
        const techSnap = await getDoc(techRef);

        if (customerSnap.exists()) {
          setUser({ uid: firebaseUser.uid, role: "customer", ...customerSnap.data() });
          router.replace("/customer");
        } else if (techSnap.exists()) {
          setUser({ uid: firebaseUser.uid, role: "technician", ...techSnap.data() });
          router.replace("/technician");
        } else {
          // If new Google user, create default "customer" entry
          await setDoc(doc(db, "customers", firebaseUser.uid), {
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            phone: firebaseUser.phoneNumber || "",
            role: "customer",
            createdAt: new Date().toISOString(),
          });
          setUser({ uid: firebaseUser.uid, role: "customer" });
          router.replace("/customer");
        }
      } else {
        setUser(null);
        router.replace("/auth");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async ({ name, email, password, phone, role }: any) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    const collectionName = role === "technician" ? "technicians" : "customers";
    await setDoc(doc(db, collectionName, uid), {
      name,
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const googleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === "success") {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
      } else {
        Alert.alert("Google Sign-in cancelled");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  // SEND OTP
  const sendOTP = async (phoneNumber: string) => {
    if (!phoneNumber.startsWith("+")) throw new Error("Use international format +91XXXXXXXXXX");

    if (Platform.OS === "web") {
      // Web
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible", callback: () => console.log("reCAPTCHA solved") }
        );
        await window.recaptchaVerifier.render();
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      console.log("✅ OTP sent (web)", confirmation);
    } else {
      // Mobile
      if (!recaptchaVerifier.current) throw new Error("reCAPTCHA not ready");
      const phoneProvider = new PhoneAuthProvider(auth);
      const verId = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier.current);
      setVerificationId(verId);
      console.log("✅ OTP sent (mobile)", verId);
    }
  };

  // VERIFY OTP
  const verifyOTP = async (otp: string) => {
    if (Platform.OS === "web") {
      if (!window.confirmationResult) throw new Error("Send OTP first");
      const result = await window.confirmationResult.confirm(otp);
      console.log("✅ Verified (web)", result.user);
      return result.user;
    } else {
      if (!verificationId) throw new Error("Send OTP first");
      const cred = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithPhoneCredential(auth, cred);
      setVerificationId("");
      console.log("✅ Verified (mobile)", result.user);
      return result.user;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setVerificationId("");
    if (Platform.OS === "web" && window.recaptchaVerifier) window.recaptchaVerifier.clear();
    router.replace("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        googleLogin,
        logout,
        sendOTP,
        verifyOTP,
        recaptchaVerifier,
        app,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);