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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { useRouter } from 'expo-router';

type Booking = {
  id: string;
  serviceName: string;
  customerId: string;
  providerId?: string | null;
  providerName?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  totalAmount: number;
  address: {
    street?: string;
    city: string;
    state: string;
    pincode?: string;
  };
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>(
    'upcoming'
  );

  useEffect(() => {
    if (user?.uid) {
      loadBookings();
    }
  }, [user?.uid]);

  const loadBookings = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const bookingsData: Booking[] = [];
      snapshot.forEach(d => {
        bookingsData.push({
          id: d.id,
          ...d.data(),
        } as Booking);
      });

      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const bookingRef = doc(db, 'bookings', booking.id);
            await updateDoc(bookingRef, {
              status: 'cancelled',
              updatedAt: Timestamp.now(),
            });

            if (booking.providerId) {
              await addDoc(collection(db, 'notifications'), {
                userId: booking.providerId,
                title: 'Booking Cancelled',
                message: `Customer cancelled: ${booking.serviceName} scheduled for ${booking.scheduledDate} at ${booking.scheduledTime}`,
                type: 'booking_cancelled',
                bookingId: booking.id,
                isRead: false,
                createdAt: Timestamp.now(),
              });
            }

            Alert.alert('Success', 'Booking cancelled successfully');
            loadBookings();
          } catch (error) {
            console.error('Error cancelling booking:', error);
            Alert.alert('Error', 'Failed to cancel booking');
          }
        },
      },
    ]);
  };

  const filterBookings = () => {
    return bookings.filter(booking => {
      if (activeTab === 'upcoming') {
        return ['pending', 'confirmed', 'in_progress'].includes(booking.status);
      }
      if (activeTab === 'completed') {
        return booking.status === 'completed';
      }
      if (activeTab === 'cancelled') {
        return booking.status === 'cancelled';
      }
      return false;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'in_progress':
        return '#5856D6';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'in_progress':
        return 'play-circle-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderBookingCard = (booking: Booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status) + '20' },
            ]}
          >
            <Ionicons
              name={getStatusIcon(booking.status) as any}
              size={14}
              color={getStatusColor(booking.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status
                .charAt(0)
                .toUpperCase() + booking.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View className="detailRow" style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
          </Text>
        </View>

        {/* Address is now clickable to change/select address in booking flow */}
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => {
            router.push('/customer/screens/BookingModal');
          }}
        >
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {booking.address.street
              ? `${booking.address.street}, ${booking.address.city}, ${booking.address.state}`
              : `${booking.address.city}, ${booking.address.state}`}
          </Text>
        </TouchableOpacity>

        {booking.providerName && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{booking.providerName}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.priceText}>₹{booking.totalAmount}</Text>
        </View>
      </View>

      <View style={styles.bookingActions}>
        {['pending', 'confirmed'].includes(booking.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(booking)}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            Alert.alert('Booking Details', `Booking ID: ${booking.id}`)
          }
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredBookings = filterBookings();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'cancelled' && styles.activeTabText,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>No {activeTab} bookings</Text>
            <Text style={styles.emptySubtext}>Book a service to get started</Text>
          </View>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#007AFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: { marginBottom: 12 },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  bookingDetails: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: { fontSize: 14, color: '#666' },
  priceText: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
