// app/auth/AuthScreen.tsx
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "customer" as "customer" | "technician",
  });
  const [loading, setLoading] = useState(false);

  const { login, register, googleLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!isLogin && formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        Alert.alert("Success", "Login successful!");
        // Navigation is handled in AuthContext, so remove router.replace here
      } else {
        if (!formData.name || !formData.phone) {
          Alert.alert("Error", "Please fill in all fields");
          return;
        }
        await register(formData);
        Alert.alert("Success", "Account created successfully!");
        // Navigation is handled in AuthContext, so remove router.replace here
      }
    } catch (error: any) {
      let message = error.message;
      if (error.code === "auth/email-already-in-use") message = "Email already registered.";
      else if (error.code === "auth/invalid-email") message = "Invalid email.";
      else if (error.code === "auth/wrong-password") message = "Incorrect password.";
      else if (error.code === "auth/user-not-found") message = "User not found.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            {isLogin ? "Welcome back!" : "Join our community"}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <View style={styles.roleSelector}>
                <Text style={styles.roleLabel}>I am a:</Text>
                <View style={styles.roleButtons}>
                  {["customer", "technician"].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, role: role as "customer" | "technician" })
                      }
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          formData.role === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {role === "customer" ? "Customer" : "Service Provider"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* ✅ Google Sign-In */}
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={googleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchButtonText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  logo: { 
    width: 100, 
    height: 100 
  },
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
  },
  roleSelector: { marginBottom: 24 },
  roleLabel: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: "#333" },
  roleButtons: { flexDirection: "row", gap: 12 },
  roleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  roleButtonActive: { borderColor: "#007AFF", backgroundColor: "#007AFF10" },
  roleButtonText: { fontSize: 16, color: "#666" },
  roleButtonTextActive: { color: "#007AFF", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 16,
  },
  googleButtonText: { fontSize: 16, color: "#333" },
  switchButton: { alignItems: "center", paddingVertical: 16 },
  switchButtonText: { color: "#007AFF", fontSize: 16 },
});
