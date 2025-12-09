// screens/PhoneAuthScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function PhoneAuthScreen() {
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { sendOTP, verifyOTP, loading: authLoading } = useAuth();

  const sendOTPHandler = async () => {
    if (!/^\+91\d{10}$/.test(phone)) {
      Alert.alert(
        "Invalid phone number",
        "Please enter phone number in international format like +911234567890"
      );
      return;
    }
    setLoading(true);
    try {
      await sendOTP(phone);
      setOtpSent(true);
      Alert.alert("OTP sent", "Check your phone for the verification code.");
    } catch (e: any) {
      Alert.alert(
        "Error sending OTP",
        e?.message ?? "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPHandler = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await verifyOTP(otp);
      Alert.alert("Success", "Phone verified successfully!");
    } catch (e: any) {
      Alert.alert(
        "Verification failed",
        e?.message ?? "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {!otpSent ? (
          <>
            <Text style={styles.title}>Enter your phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChangeText={(text: string) => {
                let cleaned = text.replace(/[^\d]/g, "");
                if (cleaned.startsWith("91")) cleaned = cleaned.slice(2);
                cleaned = cleaned.slice(0, 10);
                setPhone("+91" + cleaned);
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={13}
            />
            {loading || authLoading ? (
              <ActivityIndicator />
            ) : (
              <Button title="Send OTP" onPress={sendOTPHandler} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={otp}
              onChangeText={(text: string) => {
                const cleaned = text.replace(/\D/g, "");
                setOtp(cleaned);
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="sms-otp"
            />
            {loading || authLoading ? (
              <ActivityIndicator />
            ) : (
              <Button title="Verify OTP" onPress={verifyOTPHandler} />
            )}
            <View style={{ marginTop: 16 }}>
              <Button
                title="Change phone number"
                onPress={() => {
                  setOtp("");
                  setOtpSent(false);
                }}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#fff" },
  inner: { paddingHorizontal: 20 },
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
