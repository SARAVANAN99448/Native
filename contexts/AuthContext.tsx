// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { useRouter } from "expo-router";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if customer or technician
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
          setUser(null);
          router.replace("/auth");
        }
      } else {
        setUser(null);
        router.replace("/auth");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ✅ Signup
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

  // ✅ Login
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.replace("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
