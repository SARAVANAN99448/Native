import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "../../config/firebaseConfig";
import { useAuth } from "../../contexts/AuthContext";

export default function PhoneAuthScreen() {
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);
  const { sendOTP, verifyOTP, loading } = useAuth();

  const sendOTPHandler = async () => {
    if (!/^\+91\d{10}$/.test(phone)) {
      Alert.alert(
        "Invalid phone number",
        "Please enter phone number in international format like +911234567890"
      );
      return;
    }
    try {
      if (!recaptchaVerifier.current) {
        Alert.alert("Error", "reCAPTCHA verifier not ready");
        return;
      }
      await sendOTP(phone, recaptchaVerifier.current);
      setOtpSent(true);
      Alert.alert("OTP sent", "Check your phone for the verification code.");
    } catch (e: any) {
      Alert.alert(
        "Error sending OTP",
        e?.message ?? "Failed to send OTP"
      );
    }
  };

  const verifyOTPHandler = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
      return;
    }
    try {
      await verifyOTP(otp);
      Alert.alert("Success", "Phone verified successfully!");
    } catch (e: any) {
      Alert.alert(
        "Verification failed",
        e?.message ?? "Invalid or expired OTP"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* reCAPTCHA modal for Firebase web phone auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
      />

      <View style={styles.innerContainer}>
        {!otpSent ? (
          <>
            <Text style={styles.title}>Enter your phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91XXXXXXXXXX"
              onChangeText={setPhone}
              keyboardType="phone-pad"
              value={phone}
              autoComplete="tel"
            />
            <Button
              title="Send OTP"
              onPress={sendOTPHandler}
              disabled={loading}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              onChangeText={setOtp}
              keyboardType="number-pad"
              value={otp}
              maxLength={6}
              autoComplete="sms-otp"
            />
            <Button
              title="Verify OTP"
              onPress={verifyOTPHandler}
              disabled={loading}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#fff" },
  innerContainer: { paddingHorizontal: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 18,
  },
});
