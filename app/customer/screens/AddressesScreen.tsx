import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import firestore from "@react-native-firebase/firestore";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Geocoder from "react-native-geocoding";

Geocoder.init("AIzaSyCYL35Zswr8Nlt8cve7TKDhPcr1yNMoDCo", { language: "en" });

export default function AddressesScreen() {
  const { user } = useAuth(); // Assuming your context might have a setSelectedAddress
  const router = useRouter();
  const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [saving, setSaving] = useState(false);
  const [mainAddress, setMainAddress] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [addressLabel, setAddressLabel] = useState("Home");

  // Modal State
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");

  // Map State
  const [selectedCoords, setSelectedCoords] = useState({ latitude: 13.0827, longitude: 80.2707 });
  const mapRef = useRef<MapView>(null);

  // 1. Fetch User Profile for Defaults
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await firestore().collection("customers").doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          const name = data?.name || data?.Name || "";
          const phone = data?.phone || data?.phoneNumber || "";
          setReceiverName(name);
          setReceiverPhone(phone);
          setTempName(name);
          setTempPhone(phone);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchUserData();
  }, [user?.uid]);

  // 2. Real-time Addresses Listener
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = firestore()
      .collection("addresses")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .onSnapshot((querySnapshot) => {
        const addresses = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSavedAddresses(addresses);
        setLoading(false);
      }, (err) => setLoading(false));
    return () => unsubscribe();
  }, [user?.uid]);

  // --- Actions ---

  const handleSelectAddress = (address: any) => {
    // 1. Optional: Update global state if your context supports it
    // setSelectedAddress(address); 

    // 2. Navigate back to Checkout/Cart with the selected data
    router.back();
  };

  const handleCurrentLocation = async () => {
    setViewMode("form");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      const newCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setSelectedCoords(newCoords);
      const geoRes = await Geocoder.from(newCoords.latitude, newCoords.longitude);
      if (geoRes.results.length > 0) setMainAddress(geoRes.results[0].formatted_address);
    } catch (e) { console.log(e); }
  };

  const saveAddress = async () => {
    if (!mainAddress || !addressDetails) {
      Alert.alert("Required", "Please provide address details.");
      return;
    }
    setSaving(true);
    try {
      await firestore().collection("addresses").add({
        userId: user?.uid,
        label: addressLabel,
        mainAddress,
        addressDetails,
        receiverName,
        receiverPhone,
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setViewMode("list");
      setAddressDetails("");
    } catch (e) {
      Alert.alert("Error", "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = (id: string) => {
    Alert.alert("Delete", "Remove this address?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => firestore().collection("addresses").doc(id).delete() }
    ]);
  };

  // --- UI Views ---

  const ListView = () => (
    <View style={styles.container}>
      <View style={styles.headerSelection}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-down" size={28} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Select a location</Text>
      </View>

      <View style={styles.searchBoxSelection}>
        <Ionicons name="search" size={20} color="#10B981" />
        <TextInput placeholder="Search for area, street name..." style={styles.searchInput} />
      </View>

      <TouchableOpacity style={styles.actionRow} onPress={handleCurrentLocation}>
        <View style={styles.actionRowLeft}>
          <Ionicons name="locate-outline" size={22} color="#10B981" />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTextMain}>Use current location</Text>
            <Text style={styles.actionTextSub}>Mannurpet, Padi, Chennai</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionRow} onPress={() => setViewMode("form")}>
        <View style={styles.actionRowLeft}>
          <Ionicons name="add" size={24} color="#10B981" />
          <Text style={styles.actionTextMain}>  Add Address</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>SAVED ADDRESSES</Text></View>

      <ScrollView style={{ flex: 1 }}>
        {loading ? <ActivityIndicator style={{ marginTop: 20 }} color="#10B981" /> : savedAddresses.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.addressCard}
            onPress={() => handleSelectAddress(item)} // Clicking selects the address
          >
            <View style={styles.addressCardMain}>
              <Ionicons name="location-outline" size={24} color="#666" />
              <View style={styles.addressCardContent}>
                <Text style={styles.addressCardTitle}>{item.label}</Text>
                <Text style={styles.addressCardSub}>{item.addressDetails}, {item.mainAddress}</Text>
                <Text style={styles.addressCardPhone}>Phone number: {item.receiverPhone}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => deleteAddress(item.id)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 12, marginLeft: 5 }}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const FormView = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setViewMode("list")}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#10B981" />
            <TextInput placeholder="Confirm delivery location" style={styles.searchInput} value={mainAddress} onChangeText={setMainAddress} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.mapFrame}>
            <MapView ref={mapRef} style={styles.map} region={{ ...selectedCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 }} provider={PROVIDER_GOOGLE}>
              <Marker coordinate={selectedCoords}><Ionicons name="location" size={40} color="#10B981" /></Marker>
            </MapView>
          </View>

          <View style={styles.formContent}>
            <View style={styles.addressDisplay}>
              <Ionicons name="location" size={24} color="#10B981" />
              <Text style={styles.mainAddrText} numberOfLines={1}>{mainAddress || "Loading location..."}</Text>
            </View>

            <TextInput style={styles.detailsInput} placeholder="Address details (Flat, House No)*" value={addressDetails} onChangeText={setAddressDetails} />

            <Text style={styles.sectionLabel}>Receiver details for this address</Text>
            <TouchableOpacity style={styles.receiverCard} onPress={() => setShowReceiverModal(true)}>
              <Ionicons name="call-outline" size={20} color="#333" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.receiverMainText}>{receiverName}, <Text style={{ fontWeight: '700' }}>{receiverPhone}</Text></Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Save address as</Text>
            <View style={styles.chipRow}>
              {['Home', 'Work', 'Other'].map((l) => (
                <TouchableOpacity key={l} style={[styles.chip, addressLabel === l && styles.chipActive]} onPress={() => setAddressLabel(l)}>
                  <Text style={[styles.chipText, addressLabel === l && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={saveAddress} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save address</Text>}
          </TouchableOpacity>
        </View>

        {/* Modal for editing Receiver Details */}
        <Modal visible={showReceiverModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Receiver</Text>
              <TextInput style={styles.modalInput} placeholder="Full Name" value={tempName} onChangeText={setTempName} />
              <TextInput style={styles.modalInput} placeholder="Phone Number" value={tempPhone} keyboardType="phone-pad" onChangeText={setTempPhone} />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReceiverModal(false)}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                  setReceiverName(tempName);
                  setReceiverPhone(tempPhone);
                  setShowReceiverModal(false);
                }}><Text style={{ color: '#fff', fontWeight: '700' }}>Update</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return viewMode === "list" ? <ListView /> : <FormView />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerSelection: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchBoxSelection: { marginHorizontal: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  actionTextContainer: { marginLeft: 15 },
  actionTextMain: { fontSize: 16, fontWeight: '600', color: '#10B981' },
  actionTextSub: { fontSize: 13, color: '#999', marginTop: 2 },
  sectionHeader: { backgroundColor: '#F9FAFB', padding: 12, paddingLeft: 15 },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  addressCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  addressCardMain: { flexDirection: 'row' },
  addressCardContent: { flex: 1, marginLeft: 15 },
  addressCardTitle: { fontSize: 15, fontWeight: '700' },
  addressCardSub: { fontSize: 13, color: '#666', marginTop: 4 },
  addressCardPhone: { fontSize: 13, color: '#333', marginTop: 4 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  mapFrame: { height: 260, width: '100%' },
  map: { flex: 1 },
  formContent: { padding: 20 },
  addressDisplay: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  mainAddrText: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
  detailsInput: { fontSize: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginTop: 10 },
  sectionLabel: { fontSize: 14, color: '#666', marginTop: 25, marginBottom: 10 },
  receiverCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  receiverMainText: { fontSize: 15, color: '#333' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  chipActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  chipText: { color: '#666' },
  chipTextActive: { color: '#10B981', fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  saveBtn: { backgroundColor: '#059669', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  confirmBtn: { backgroundColor: '#10B981', padding: 10, borderRadius: 8, paddingHorizontal: 20 },
});