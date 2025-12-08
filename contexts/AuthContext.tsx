import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db, app } from "../config/firebaseConfig";
import { useRouter } from "expo-router";

type Role = "customer";

type CustomerDoc = {
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
};

type UserData = {
  uid: string;
} & CustomerDoc;

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  sendOTP: (phoneNumber: string, verifier: any) => Promise<void>;
  verifyOTP: (otp: string) => Promise<UserData>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  app: typeof app;
  updateUser: (data: Partial<UserData>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const customerRef = doc(db, "customers", firebaseUser.uid);
          const customerSnap = await getDoc(customerRef);

          if (customerSnap.exists()) {
            const data = customerSnap.data() as CustomerDoc;
            const userData: UserData = {
              uid: firebaseUser.uid,
              ...data,
            };
            setUser(userData);
          } else {
            const newDoc: CustomerDoc = {
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              phone: firebaseUser.phoneNumber || "",
              role: "customer",
              createdAt: new Date().toISOString(),
            };
            await setDoc(customerRef, newDoc);

            const userData: UserData = {
              uid: firebaseUser.uid,
              ...newDoc,
            };
            setUser(userData);
          }

          router.replace("/customer");
        } else {
          setUser(null);
          router.replace("/auth");
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const sendOTP: AuthContextType["sendOTP"] = async (phoneNumber, verifier) => {
    if (!phoneNumber.startsWith("+")) {
      throw new Error("Use international format +91XXXXXXXXXX");
    }
    if (!verifier) {
      throw new Error("reCAPTCHA verifier not initialized");
    }

    const provider = new PhoneAuthProvider(auth);
    const verId = await provider.verifyPhoneNumber(phoneNumber, verifier);
    setVerificationId(verId);
    console.log("✅ OTP sent", verId);
  };

  const verifyOTP: AuthContextType["verifyOTP"] = async (otp) => {
    if (!verificationId) {
      throw new Error("Please request OTP first");
    }
    if (!otp || otp.length !== 6) {
      throw new Error("Invalid OTP format");
    }

    const cred = PhoneAuthProvider.credential(verificationId, otp);
    const result = await signInWithCredential(auth, cred);

    setVerificationId(null);

    const uid = result.user.uid;
    const customerRef = doc(db, "customers", uid);
    const customerSnap = await getDoc(customerRef);

    if (customerSnap.exists()) {
      const data = customerSnap.data() as CustomerDoc;
      const userData: UserData = { uid, ...data };
      setUser(userData);
      return userData;
    } else {
      const newDoc: CustomerDoc = {
        name: result.user.displayName || "",
        email: result.user.email || "",
        phone: result.user.phoneNumber || "",
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      await setDoc(customerRef, newDoc);
      const userData: UserData = { uid, ...newDoc };
      setUser(userData);
      return userData;
    }
  };

  const logout: AuthContextType["logout"] = async () => {
    await signOut(auth);
    setUser(null);
    setVerificationId(null);
    router.replace("/auth");
  };

  const deleteAccount: AuthContextType["deleteAccount"] = async () => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user");
    }
    const uid = auth.currentUser.uid;

    await deleteDoc(doc(db, "customers", uid));
    await auth.currentUser.delete();
    setUser(null);
    setVerificationId(null);
    router.replace("/auth");
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOTP,
        verifyOTP,
        logout,
        deleteAccount,
        app,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
