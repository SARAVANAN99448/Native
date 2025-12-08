import React, { useState, useRef } from "react";
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
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "../../config/firebaseConfig";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthScreen() {
  const [phone, setPhone] = useState("+91");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { sendOTP, verifyOTP, loading: authLoading } = useAuth();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);

  const handlePhoneAuth = async () => {
    if (!/^\+91\d{10}$/.test(phone)) {
      Alert.alert("Invalid Phone", "Use +91XXXXXXXXXX format");
      return;
    }

    if (!otpSent) {
      try {
        if (!recaptchaVerifier.current) {
          Alert.alert("Error", "reCAPTCHA verifier not ready");
          return;
        }
        setLoading(true);
        await sendOTP(phone, recaptchaVerifier.current); // pass verifier
        setOtpSent(true);
      } catch (error: any) {
        Alert.alert("Error", error?.message || "Failed to send OTP");
      } finally {
        setLoading(false);
      }
    } else {
      if (otp.length !== 6) return;
      try {
        setLoading(true);
        const userData = await verifyOTP(otp);
        if (userData.role === "customer") {
          router.replace("/customer");
        } else {
          Alert.alert("Error", "Invalid user role");
        }
      } catch (error: any) {
        Alert.alert(
          "Verification Failed",
          error?.message || "Invalid or expired OTP. Try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOTPChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    setOtp(cleaned);
    if (cleaned.length === 6) {
      setTimeout(() => handlePhoneAuth(), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* reCAPTCHA modal for Firebase web phone auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              style={styles.logo}
              source={{
                uri: "https://vintenterprises.in/wp-content/uploads/2022/03/Untitled-design-99.png",
              }}
              resizeMode="contain"
            />
            <Text style={styles.title}>Vint Solar</Text>
            <Text style={styles.subtitle}>
              {otpSent ? "Verify your phone" : "Login with your phone"}
            </Text>
          </View>

          <View style={styles.form}>
            {!otpSent ? (
              <TextInput
                style={styles.input}
                placeholder="Phone (+91XXXXXXXXXX)"
                value={phone}
                onChangeText={(text: string) => {
                  let cleaned = text.replace(/[^\d]/g, "");
                  if (cleaned.startsWith("91")) cleaned = cleaned.slice(2);
                  cleaned = cleaned.slice(0, 10);
                  setPhone("+91" + cleaned);
                }}
                keyboardType="phone-pad"
                maxLength={13}
                editable={!loading && !authLoading}
              />
            ) : (
              <>
                <View style={styles.otpInfo}>
                  <Text style={styles.otpInfoText}>
                    Enter the 6‑digit code sent to
                  </Text>
                  <Text style={styles.phoneNumber}>{phone}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="••••••"
                  value={otp}
                  onChangeText={handleOTPChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading && !authLoading}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  autoFocus
                />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handlePhoneAuth}
              disabled={loading || authLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {otpSent ? "Verify OTP" : "Send OTP"}
                </Text>
              )}
            </TouchableOpacity>

            {otpSent && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                disabled={loading || authLoading}
              >
                <Text style={styles.switchButtonText}>
                  ← Back to Phone Number
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
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 10,
  },
  logo: { width: 100, height: 100 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginTop: 16 },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },
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
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchButton: { alignItems: "center", paddingVertical: 16 },
  switchButtonText: { color: "#007AFF", fontSize: 16 },
});
