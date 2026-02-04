import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

type Address = {
  id: string;
  label: string;
  mainAddress: string;
  addressDetails: string;
  receiverName: string;
  receiverPhone: string;
  latitude: number;
  longitude: number;
  createdAt: any;
};

type ServiceData = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  image: any;
};

export default function BookingModal() {
  const { user } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<ServiceData | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchLatestAddress();
      }
    }, [user?.uid])
  );

  const loadServiceData = async () => {
    try {
      const serviceData = await AsyncStorage.getItem("selectedService");
      if (serviceData) {
        setService(JSON.parse(serviceData));
      } else {
        router.back();
      }
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestAddress = async () => {
    if (!user?.uid) return;
    try {
      const snap = await firestore()
        .collection("addresses")
        .where("userId", "==", user.uid)
        .get();

      if (!snap.empty) {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Address[];

        // JS Sort to handle addresses without index requirement
        list.sort((a, b) => {
          const valA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds || 0);
          const valB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds || 0);
          return valB - valA;
        });

        setSelectedAddress(list[0]);
      }
    } catch (e) {
      console.log("Error fetching addresses:", e);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedAddress) {
      Alert.alert("Address Required", "Please select a location.");
      return;
    }
    if (!service || !user) return;

    setCreating(true);
    try {
      const bookingData = {
        serviceId: service.id,
        serviceName: service.name,
        customerId: user.uid,
        customerEmail: user.email,
        customerName: selectedAddress.receiverName || "Customer",
        customerPhone: selectedAddress.receiverPhone || "",
        scheduledDate: bookingDate.toISOString().split("T")[0],
        scheduledTime: bookingTime,
        status: "pending",
        totalAmount: service.price,
        address: {
          fullAddress: selectedAddress.mainAddress,
          details: selectedAddress.addressDetails,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          label: selectedAddress.label,
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        providerId: null,
        providerName: null,
      };

      await firestore().collection("bookings").add(bookingData);

      Alert.alert("Success!", "Booking confirmed!", [
        { text: "View Bookings", onPress: () => router.replace("/customer/screens/BookingsScreen") },
        { text: "Go Home", onPress: () => router.replace("/customer") },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create booking.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"];

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e68123" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with View instead of div */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.serviceCard}>
          <Image source={service?.image} style={styles.serviceImage} />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service?.name}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {service?.description}
            </Text>
            
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="cash-outline" size={20} color="#e68123" />
                <Text style={styles.servicePrice}>₹{service?.price}</Text>
              </View>
            </View>

            {/* RESTORED ALL SERVICE POINTS */}
            <View style={styles.serviceDetails}>
              <View style={{ flex: 1 }}>
                {[
                  "Solar Panel Inspection & Cleaning",
                  "Inverter & Electrical System Check",
                  "Mounting Structure & Hardware Check",
                  "Thermal Imaging & Hotspot Detection",
                  "Energy Production & Performance Monitoring",
                  "Shading Analysis & Site Conditions",
                  "Safety Verification (Cables, Earthing, Protections)",
                  "Maintenance Reports & Service Logbook",
                ].map((text) => (
                  <View key={text} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{ marginRight: 6 }} />
                    <Text style={styles.featureText}>{text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#e68123" />
            <Text style={styles.dateButtonText}>{formatDate(bookingDate)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={bookingDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(e, d) => { setShowDatePicker(false); if (d) setBookingDate(d); }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotContainer}>
            {timeSlots.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeSlot, bookingTime === t && styles.selectedTimeSlot]}
                onPress={() => setBookingTime(t)}
              >
                <Text style={[styles.timeSlotText, bookingTime === t && styles.selectedTimeSlotText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address</Text>
          {!selectedAddress ? (
            <TouchableOpacity style={styles.addAddressButton} onPress={() => router.push("/customer/screens/AddressesScreen")}>
              <Ionicons name="add-circle-outline" size={24} color="#e68123" />
              <Text style={styles.addAddressText}>Add Address</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.addressOption, styles.selectedAddressOption]} 
              onPress={() => router.push("/customer/screens/AddressesScreen")}
            >
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                <Text style={styles.addressText} numberOfLines={2}>{selectedAddress.mainAddress}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#e68123" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{service?.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (creating || !selectedAddress) && styles.bookButtonDisabled]}
          onPress={handleCreateBooking}
          disabled={creating || !selectedAddress}
        >
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookButtonText}>Confirm Booking</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  content: { flex: 1 },
  serviceCard: { backgroundColor: "#fff", margin: 20, borderRadius: 16, overflow: "hidden", elevation: 3 },
  serviceImage: { width: "100%", height: 160 },
  serviceInfo: { padding: 16 },
  serviceName: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  serviceDescription: { fontSize: 14, color: "#666", marginBottom: 12 },
  serviceDetails: { flexDirection: "row", gap: 24, marginTop: 10 },
  serviceDetailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  servicePrice: { fontSize: 16, fontWeight: "700", color: "#e68123" },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  featureText: { fontSize: 12, color: "#333", fontWeight: "600" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 12 },
  dateButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#fff" },
  dateButtonText: { flex: 1, fontSize: 15, color: "#333", marginLeft: 12 },
  timeSlotContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeSlot: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#fff" },
  selectedTimeSlot: { backgroundColor: "#e68123", borderColor: "#e68123" },
  timeSlotText: { fontSize: 13, fontWeight: "500", color: "#666" },
  selectedTimeSlotText: { color: "#fff" },
  addAddressButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 20, borderRadius: 12, borderWidth: 2, borderColor: "#e68123", borderStyle: "dashed", gap: 8, backgroundColor: "#fff" },
  addAddressText: { fontSize: 15, fontWeight: "600", color: "#e68123" },
  addressOption: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#fff", marginBottom: 12 },
  selectedAddressOption: { borderColor: "#e68123", backgroundColor: "#F0EBFF" },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 4 },
  addressText: { fontSize: 13, color: "#666" },
  footer: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  totalContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  totalLabel: { fontSize: 14, color: "#666" },
  totalAmount: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  bookButton: { backgroundColor: "#e68123", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});