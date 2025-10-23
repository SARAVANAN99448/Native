import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext"; 
import auth from '@react-native-firebase/auth';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "+91",
    role: "customer" as "customer" | "technician",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const router = useRouter();
  const { login, register, googleLogin } = useAuth(); // adjust if needed

  // EMAIL AUTH
  const handleEmailAuth = async () => {
    if (isLogin) {
      if (!formData.email || !formData.password) return Alert.alert("Error", "Enter email & password");
      try {
        setLoading(true);
        await login(formData.email, formData.password);
        router.replace("/");
      } catch (e: any) {
        Alert.alert("Login Error", e.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password)
        return Alert.alert("Error", "Fill all fields");
      if (formData.password.length < 6)
        return Alert.alert("Weak Password", "Password must be at least 6 characters");
      try {
        setLoading(true);
        await register(formData);
        Alert.alert("Success", "Account created! Please sign in.");
        setIsLogin(true);
      } catch (e: any) {
        Alert.alert("Registration Error", e.message || "Failed to register");
      } finally {
        setLoading(false);
      }
    }
  };

  // PHONE AUTH
  const handlePhoneAuth = async () => {
    if (!formData.phone || !/^\+91\d{10}$/.test(formData.phone))
      return Alert.alert("Invalid Phone", "Use +91XXXXXXXXXX format");

    if (!otpSent) {
      try {
        setLoading(true);
        const confirmation = await auth().signInWithPhoneNumber(formData.phone);
        setVerificationId(confirmation.verificationId);
        setOtpSent(true);
        Alert.alert("OTP Sent", "Check your phone for the verification code.");
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to send OTP");
      } finally {
        setLoading(false);
      }
    } else {
      if (!otp || otp.length !== 6) return Alert.alert("Invalid OTP", "Enter 6-digit OTP");
      try {
        setLoading(true);
        if (verificationId) {
          const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
          await auth().signInWithCredential(credential);
          Alert.alert("Success", "Phone verified successfully!");
          router.replace("/");
        }
      } catch (error: any) {
        Alert.alert("Verification Failed", error.message || "Invalid OTP");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (authMethod === "email") await handleEmailAuth();
    else await handlePhoneAuth();
  };

  const handleOTPChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    setOtp(cleaned);
    if (cleaned.length === 6) setTimeout(() => handlePhoneAuth(), 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Image
              style={styles.logo}
              source={{ uri: "https://vintenterprises.in/wp-content/uploads/2022/03/Untitled-design-99.png" }}
              resizeMode="contain"
            />
            <Text style={styles.title}>Vint Solar</Text>
            <Text style={styles.subtitle}>
              {isLogin ? "Welcome back!" : otpSent ? "Verify your phone" : "Join our community"}
            </Text>
          </View>

          {/* Tabs */}
          {!otpSent && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, authMethod === "email" && styles.tabActive]}
                onPress={() => setAuthMethod("email")}
                disabled={loading}
              >
                <Text style={[styles.tabText, authMethod === "email" && styles.tabTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authMethod === "phone" && styles.tabActive]}
                onPress={() => setAuthMethod("phone")}
                disabled={loading}
              >
                <Text style={[styles.tabText, authMethod === "phone" && styles.tabTextActive]}>Phone</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {authMethod === "email" ? (
              <>
                {!isLogin && (
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  autoComplete="email"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  editable={!loading}
                  autoComplete="password"
                />
              </>
            ) : (
              <>
                {!otpSent ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Phone (+91XXXXXXXXXX)"
                    value={formData.phone}
                    onChangeText={(text) => {
                      let cleaned = text.replace(/[^\d]/g, "");
                      if (cleaned.startsWith("91")) cleaned = cleaned.slice(2);
                      cleaned = cleaned.slice(0, 10);
                      setFormData({ ...formData, phone: "+91" + cleaned });
                    }}
                    keyboardType="phone-pad"
                    maxLength={13}
                    editable={!loading}
                  />
                ) : (
                  <>
                    <View style={styles.otpInfo}>
                      <Text style={styles.otpInfoText}>Enter the 6-digit code sent to</Text>
                      <Text style={styles.phoneNumber}>{formData.phone}</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="••••••"
                      value={otp}
                      onChangeText={handleOTPChange}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      autoFocus
                    />
                  </>
                )}
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitButtonText}>
                  {authMethod === "phone" && otpSent ? "Verify OTP" :
                    authMethod === "phone" ? "Send OTP" :
                      isLogin ? "Sign In" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Google Sign-in */}
            {!otpSent && authMethod === "email" && (
              <TouchableOpacity
                style={[styles.submitButton, styles.googleButton]}
                onPress={googleLogin}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            )}

            {/* Switch */}
            {otpSent ? (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => { setOtpSent(false); setOtp(""); setVerificationId(null); }}
                disabled={loading}
              >
                <Text style={styles.switchButtonText}>← Back to Phone Number</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => { setIsLogin(!isLogin); setAuthMethod("email"); }}
                disabled={loading}
              >
                <Text style={styles.switchButtonText}>
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  logo: { width: 100, height: 100 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginTop: 16 },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "#007AFF" },
  tabText: { fontSize: 16, color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  form: { flex: 1, paddingHorizontal: 24 },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    color: "#333",
  },
  otpInput: {
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "600",
  },
  otpInfo: { alignItems: "center", marginBottom: 20, paddingHorizontal: 20 },
  otpInfoText: { fontSize: 14, color: "#666", marginBottom: 8 },
  phoneNumber: { fontSize: 18, fontWeight: "600", color: "#007AFF" },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    minHeight: 56,
    justifyContent: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  googleButton: { backgroundColor: "#DB4437" },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchButton: { alignItems: "center", paddingVertical: 16 },
  switchButtonText: { color: "#007AFF", fontSize: 16 },
});
