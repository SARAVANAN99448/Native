import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  addDoc, 
  getDocs,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type ServiceData = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  image: string;
};

export default function BookingModal() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [service, setService] = useState<ServiceData | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
    loadAddresses();
  }, []);

  const loadServiceData = async () => {
    try {
      const serviceData = await AsyncStorage.getItem('selectedService');
      if (serviceData) {
        setService(JSON.parse(serviceData));
        // Clear after loading
        await AsyncStorage.removeItem('selectedService');
      } else {
        Alert.alert('Error', 'No service selected');
        router.back();
      }
    } catch (error) {
      console.error('Error loading service:', error);
      Alert.alert('Error', 'Failed to load service data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    if (!user?.uid) return;

    try {
      const addressesRef = collection(db, 'addresses');
      const q = query(addressesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const addressList: Address[] = [];
      snapshot.forEach((doc) => {
        addressList.push({ id: doc.id, ...doc.data() } as Address);
      });
      
      setAddresses(addressList);
      if (addressList.length > 0) {
        setSelectedAddress(addressList[0]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please add an address first', [
        {
          text: 'Add Address',
          onPress: () => router.push('/screens/AddressesScreen'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (!service) {
      Alert.alert('Error', 'Service data not available');
      return;
    }

    setCreating(true);
    try {
      const bookingData = {
        serviceId: service.id,
        serviceName: service.name,
        customerId: user.uid,
        customerName: user.name || 'Customer',
        customerEmail: user.email || '',
        customerPhone: user.phone || '+919876543210',
        providerId: 'provider-001',
        providerName: 'Vint Service Provider',
        scheduledDate: bookingDate.toISOString().split('T')[0],
        scheduledTime: bookingTime,
        status: 'pending',
        totalAmount: service.price,
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      Alert.alert(
        'Success!', 
        'Your booking has been created successfully!',
        [
          {
            text: 'View Bookings',
            onPress: () => router.replace('/screens/BookingsScreen'),
          },
          {
            text: 'Go Home',
            onPress: () => router.replace('/customer'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C3FE4" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Service not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Card */}
        <View style={styles.serviceCard}>
          <Image source={{ uri: service.image }} style={styles.serviceImage} />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="cash-outline" size={20} color="#6C3FE4" />
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
              <View style={styles.serviceDetailItem}>
                <Ionicons name="time-outline" size={20} color="#6C3FE4" />
                <Text style={styles.serviceDuration}>{service.duration} mins</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6C3FE4" />
            <Text style={styles.dateButtonText}>{formatDate(bookingDate)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={bookingDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setBookingDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  bookingTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => setBookingTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    bookingTime === time && styles.selectedTimeSlotText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address</Text>
          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push('/screens/AddressesScreen')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#6C3FE4" />
              <Text style={styles.addAddressText}>Add Address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressOption,
                  selectedAddress?.id === address.id && styles.selectedAddressOption,
                ]}
                onPress={() => setSelectedAddress(address)}
              >
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  <Text style={styles.addressText}>
                    {address.street}, {address.city}
                  </Text>
                </View>
                {selectedAddress?.id === address.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#6C3FE4" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{service.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (creating || !selectedAddress) && styles.bookButtonDisabled]}
          onPress={handleCreateBooking}
          disabled={creating || !selectedAddress}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#6C3FE4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceImage: {
    width: '100%',
    height: 160,
  },
  serviceInfo: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C3FE4',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedTimeSlot: {
    backgroundColor: '#6C3FE4',
    borderColor: '#6C3FE4',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6C3FE4',
    borderStyle: 'dashed',
    gap: 8,
    backgroundColor: '#fff',
  },
  addAddressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C3FE4',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  selectedAddressOption: {
    borderColor: '#6C3FE4',
    backgroundColor: '#F0EBFF',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bookButton: {
    backgroundColor: '#6C3FE4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
