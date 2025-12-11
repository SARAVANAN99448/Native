import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import authNative, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
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
  updateUser: (data: Partial<UserData>) => void;
  resetConfirmation: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const loadOrCreateUser = async (
    firebaseUser: FirebaseAuthTypes.User
  ): Promise<UserData> => {
    const uid = firebaseUser.uid;
    const customerRef = firestore().collection("customers").doc(uid);

    try {
      const snap = await customerRef.get();
      const existing = snap.data() as CustomerDoc | undefined;

      if (existing) {
        const userData: UserData = { uid, ...existing };
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
        await customerRef.set(newDoc);
        const userData: UserData = { uid, ...newDoc };
        setUser(userData);
        return userData;
      }
    } catch (e: any) {
      Alert.alert(
        "Firestore error",
        `Code: ${e?.code ?? "unknown"}\nMessage: ${
          e?.message ?? "no message"
        }`
      );
      throw e;
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
      setConfirmation(null);
      const confirm = await authNative().signInWithPhoneNumber(phoneNumber);
      setConfirmation(confirm);
    } catch (e: any) {
      Alert.alert(
        "Send OTP error",
        `Code: ${e?.code ?? "unknown"}\nMessage: ${
          e?.message ?? "no message"
        }`
      );
      throw e;
    }
  };

  const verifyOTP: AuthContextType["verifyOTP"] = async (otp) => {
    if (!otp || otp.length !== 6) {
      throw new Error("Invalid OTP format");
    }

    const current = authNative().currentUser;
    if (!confirmation) {
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

      setConfirmation(null);
      return await loadOrCreateUser(res.user);
    } catch (e: any) {
      const code = e?.code ?? "unknown";
      const message = e?.message ?? "no message";

      Alert.alert("Verify OTP error", `Code: ${code}\nMessage: ${message}`);

      if (code === "auth/session-expired" || code === "auth/code-expired") {
        setConfirmation(null);
        throw new Error(
          "Code expired. Please request a new OTP and try again."
        );
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

    await firestore().collection("customers").doc(uid).delete();
    await current.delete();

    setUser(null);
    setConfirmation(null);
    router.replace("/auth");
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const resetConfirmation = () => {
    setConfirmation(null);
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
        updateUser,
        resetConfirmation,
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
