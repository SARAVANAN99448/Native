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



export default function AuthScreen() {
  const [phone, setPhone] = useState("+91");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingCooldown, setSendingCooldown] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { sendOTP, verifyOTP, loading: authLoading, resetConfirmation } =
    useAuth();

  const handleSendCooldown = () => {
    setSendingCooldown(true);
    setTimeout(() => setSendingCooldown(false), 30000);
  };

  const handlePhoneAuth = async () => {
    if (!/^\+91\d{10}$/.test(phone)) {
      Alert.alert("Invalid Phone", "Use +91XXXXXXXXXX format");
      return;
    }

    // Send OTP
    if (!otpSent) {
      try {
        if (sendingCooldown) {
          Alert.alert(
            "Please wait",
            "You can request OTP again after 30 seconds"
          );
          return;
        }
        setLoading(true);
        await sendOTP(phone);
        setOtpSent(true);
        handleSendCooldown();
        Alert.alert("OTP Sent", "Check your phone for the verification code.");
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
      return;
    }

    // Verify OTP
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const userData = await verifyOTP(otp);
      if (userData.role === "customer") {
        router.replace("/customer");
      } else {
        Alert.alert("Error", "Invalid user role");
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    setOtp(cleaned);
  };

  const resetFlow = () => {
    resetConfirmation();
    setOtp("");
    setOtpSent(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                editable={!loading && !authLoading}
                maxLength={13}
              />
            ) : (
              <>
                <Text style={styles.otpInfoText}>
                  Enter the 6-digit code sent to
                </Text>
                <Text style={styles.phoneNumber}>{phone}</Text>

                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="••••••"
                  value={otp}
                  onChangeText={handleOTPChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || authLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handlePhoneAuth}
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {otpSent
                    ? "Verify OTP"
                    : sendingCooldown
                    ? "Wait 30s"
                    : "Send OTP"}
                </Text>
              )}
            </TouchableOpacity>

            {otpSent && (
              <>
                <TouchableOpacity style={styles.switchButton} onPress={resetFlow}>
                  <Text style={styles.switchButtonText}>
                    ← Back to Phone Number
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={async () => {
                    if (sendingCooldown) {
                      Alert.alert(
                        "Please wait",
                        "Request OTP again after cooldown."
                      );
                      return;
                    }
                    try {
                      setLoading(true);
                      await sendOTP(phone);
                      handleSendCooldown();
                      Alert.alert("OTP Sent", "A new OTP has been sent.");
                    } catch (error) {
                     
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Text style={styles.switchButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
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
  header: { alignItems: "center", paddingTop: 60 },
  logo: { width: 100, height: 100 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginTop: 16 },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },
  form: { paddingHorizontal: 24, marginTop: 20 },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  otpInput: {
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchButton: { alignItems: "center", paddingVertical: 12 },
  switchButtonText: { color: "#007AFF", fontSize: 16 },
  otpInfoText: { textAlign: "center", fontSize: 14, color: "#666" },
  phoneNumber: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
  },
});
