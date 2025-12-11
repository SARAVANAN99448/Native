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
  const [sendingCooldown, setSendingCooldown] = useState(false);

  const { sendOTP, verifyOTP, loading: authLoading, resetConfirmation } = useAuth();

  const handleCooldown = () => {
    setSendingCooldown(true);
    setTimeout(() => setSendingCooldown(false), 30000);
  };

  const sendOTPHandler = async () => {
    if (!/^\+91\d{10}$/.test(phone)) {
      Alert.alert("Invalid number", "Enter +91XXXXXXXXXX format");
      return;
    }

    if (sendingCooldown) {
      Alert.alert("Please wait", "Try again after 30 seconds");
      return;
    }

    setLoading(true);
    try {
      await sendOTP(phone);
      setOtpSent(true);
      handleCooldown();
      Alert.alert("OTP Sent", "Check your SMS");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPHandler = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(otp);
      Alert.alert("Success", "Phone verified successfully!");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const changePhone = () => {
    resetConfirmation();
    setOtp("");
    setOtpSent(false);
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
                let cleaned = text.replace(/\D/g, "");
                if (cleaned.startsWith("91")) cleaned = cleaned.slice(2);
                cleaned = cleaned.slice(0, 10);
                setPhone("+91" + cleaned);
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            {loading || authLoading ? (
              <ActivityIndicator />
            ) : (
              <Button title={sendingCooldown ? "Wait 30s" : "Send OTP"} onPress={sendOTPHandler} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
            />

            {loading || authLoading ? (
              <ActivityIndicator />
            ) : (
              <Button title="Verify OTP" onPress={verifyOTPHandler} />
            )}

            <View style={{ marginTop: 16 }}>
              <Button title="Change phone number" onPress={changePhone} />
            </View>

            <View style={{ marginTop: 8 }}>
              <Button
                title={sendingCooldown ? "Wait 30s" : "Resend OTP"}
                onPress={async () => {
                  if (sendingCooldown) {
                    Alert.alert("Wait", "Try again later");
                    return;
                  }
                  try {
                    setLoading(true);
                    await sendOTP(phone);
                    handleCooldown();
                    Alert.alert("OTP Sent", "A new code was sent");
                  } catch (error) {
                  } finally {
                    setLoading(false);
                  }
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#999", borderRadius: 8, padding: 12, marginBottom: 20 },
});
