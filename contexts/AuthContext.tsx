// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import authNative, {
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import { db, app } from "../config/firebaseConfig";
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
  sendOTP: (phoneNumber: string) => Promise<void>;
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

  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  // Helper to load/create Firestore user from Firebase user
  const loadOrCreateUser = async (
    firebaseUser: FirebaseAuthTypes.User
  ): Promise<UserData> => {
    const uid = firebaseUser.uid;
    const customerRef = doc(db, "customers", uid);
    const snap = await getDoc(customerRef);

    if (snap.exists()) {
      const data = snap.data() as CustomerDoc;
      const userData: UserData = { uid, ...data };
      setUser(userData);
      return userData;
    } else {
      const newDoc: CustomerDoc = {
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        phone: firebaseUser.phoneNumber || "",
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      await setDoc(customerRef, newDoc);
      const userData: UserData = { uid, ...newDoc };
      setUser(userData);
      return userData;
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = authNative().onAuthStateChanged(
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            await loadOrCreateUser(firebaseUser);
            router.replace("/customer");
          } else {
            setUser(null);
            router.replace("/auth");
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [router]);

  const sendOTP: AuthContextType["sendOTP"] = async (phoneNumber) => {
    if (!phoneNumber.startsWith("+")) {
      throw new Error("Use international format like +911234567890");
    }

    try {
      const confirm = await authNative().signInWithPhoneNumber(phoneNumber); // sends SMS
      setConfirmation(confirm);
    } catch (e: any) {
      console.log("OTP send error", e?.code, e?.message);
      throw e;
    }
  };

  const verifyOTP: AuthContextType["verifyOTP"] = async (otp) => {
    if (!otp || otp.length !== 6) {
      throw new Error("Invalid OTP format");
    }

    // If we have no confirmation, maybe auto-verified already
    if (!confirmation) {
      const current = authNative().currentUser;
      if (current) {
        return await loadOrCreateUser(current);
      }
      throw new Error("Please request OTP first");
    }

    try {
      const res = await confirmation.confirm(otp);

      if (!res || !res.user) {
        throw new Error("User not found after phone verification");
      }

      const firebaseUser = res.user;
      setConfirmation(null);
      return await loadOrCreateUser(firebaseUser);
    } catch (e: any) {
      console.log("OTP verify error", e?.code, e?.message);

      // Handle auto-verification case: session expired but user already signed in
      if (e?.code === "auth/session-expired") {
        const current = authNative().currentUser;
        if (current) {
          setConfirmation(null);
          return await loadOrCreateUser(current);
        }
      }

      throw e;
    }
  };

  const logout: AuthContextType["logout"] = async () => {
    await authNative().signOut();
    setUser(null);
    setConfirmation(null);
    router.replace("/auth");
  };

  const deleteAccount: AuthContextType["deleteAccount"] = async () => {
    const current = authNative().currentUser;
    if (!current) {
      throw new Error("No authenticated user");
    }
    const uid = current.uid;

    await deleteDoc(doc(db, "customers", uid));
    await current.delete();

    setUser(null);
    setConfirmation(null);
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
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
