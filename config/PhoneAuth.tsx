import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

// 👇 declare window type so TS recognizes recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

const PhoneAuth: React.FC = () => {
  const [phone, setPhone] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false);

  // ✅ Setup Recaptcha only once
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible", // change to "normal" if you want visible reCAPTCHA
        callback: () => console.log("reCAPTCHA solved ✅"),
      });
    }
  };

  // ✅ Send OTP
  const sendOTP = async () => {
    if (!phone.startsWith("+")) {
      alert("Please use international format (e.g., +91XXXXXXXXXX)");
      return;
    }

    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmation;
      setIsOTPSent(true);
      alert("OTP sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      alert(error.message || "Failed to send OTP");
    }
  };

  // ✅ Verify OTP
  const verifyOTP = async () => {
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      console.log("✅ User verified:", user);
      alert("Phone number verified successfully!");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      alert("Invalid OTP, please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <h2>📱 Firebase OTP Login</h2>
      <div id="recaptcha-container"></div>

      {!isOTPSent ? (
        <>
          <input
            type="text"
            placeholder="Enter phone number (+91...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: 8, width: "100%", marginBottom: 10 }}
          />
          <button onClick={sendOTP} style={{ padding: 10, width: "100%" }}>
            Send OTP
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ padding: 8, width: "100%", marginBottom: 10 }}
          />
          <button onClick={verifyOTP} style={{ padding: 10, width: "100%" }}>
            Verify OTP
          </button>
        </>
      )}
    </div>
  );
};

export default PhoneAuth;