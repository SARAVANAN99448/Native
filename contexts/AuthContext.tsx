// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:"1080097552471-hp3dg4afltchb258pmmgofh36jgmct3t.apps.googleusercontent.com",
    androidClientId:"293613594811-pcv35nh7tnkbafap0hbpqo3vvuka1l9b.apps.googleusercontent.com",
    webClientId: "293613594811-neng7hetfger989d4pv3i75n1d5j3vjb.apps.googleusercontent.com",
  });

  // ✅ Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const customerRef = doc(db, "customers", firebaseUser.uid);
        const techRef = doc(db, "technicians", firebaseUser.uid);

        const [customerSnap, techSnap] = await Promise.all([
          getDoc(customerRef),
          getDoc(techRef),
        ]);

        if (customerSnap.exists()) {
          setUser({ uid: firebaseUser.uid, role: "customer", ...customerSnap.data() });
          router.replace("/customer");
        } else if (techSnap.exists()) {
          setUser({ uid: firebaseUser.uid, role: "technician", ...techSnap.data() });
          router.replace("/technician");
        } else {
          // Create default Firestore entry for new Google user
          await setDoc(doc(db, "customers", firebaseUser.uid), {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
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

  // ✅ Email signup
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

  // ✅ Email login
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // ✅ Google login
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

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.replace("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, register, login, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
