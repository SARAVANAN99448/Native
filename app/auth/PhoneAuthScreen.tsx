import React, { useState, useRef } from "react";
import { View, TextInput, Button, Text, Alert, StyleSheet, SafeAreaView, Platform } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path as needed
import { app } from "../../config/firebaseConfig"; // Import your Firebase app config

export default function PhoneAuthScreen() {
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaVerifier = useRef(null);

  const { sendOTP, verifyOTP, loading } = useAuth();

  const sendOTPHandler = async () => {
    if (!phone.match(/^\+\d{10,}$/)) {
      Alert.alert("Invalid phone number", "Please enter phone number in international format like +911234567890");
      return;
    }
    try {
      await sendOTP(phone); // sendOTP uses recaptchaVerifier internally from context or passed ref (adjust if needed)
      setOtpSent(true);
      Alert.alert("OTP sent", "Check your phone for the verification code.");
    } catch (e: any) {
      Alert.alert("Error sending OTP", e.message);
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
      // Add any post-login navigation here, e.g., router.replace(...)
    } catch (e: any) {
      Alert.alert("Verification failed", e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Show reCAPTCHA verifier modal ONLY on mobile */}
      {Platform.OS !== "web" && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={app.options}
          attemptInvisibleVerification={true}
        />
      )}

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
            <Button title="Send OTP" onPress={sendOTPHandler} disabled={loading} />
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
            <Button title="Verify OTP" onPress={verifyOTPHandler} disabled={loading} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#fff" },
  innerContainer: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 18,
  },
});
