import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Mock Booking Type (add to your types file)
type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  providerId: string;
  providerName: string;
  providerImage?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  customerFeedback?: {
    rating: number;
    comment?: string;
  };
  createdAt: string;
};

// Mock data for demonstration
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    serviceId: '1',
    serviceName: 'AC Service & Gas Refill',
    customerId: 'user1',
    providerId: 'provider1',
    providerName: 'Rajesh Kumar',
    scheduledDate: '2025-10-20',
    scheduledTime: '10:00 AM',
    status: 'pending',
    totalAmount: 899,
    address: {
      street: '123 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
    createdAt: '2025-10-15T10:30:00Z',
  },
  {
    id: '2',
    serviceId: '4',
    serviceName: 'Hair Cut & Styling',
    customerId: 'user1',
    providerId: 'provider2',
    providerName: 'Priya Sharma',
    scheduledDate: '2025-10-18',
    scheduledTime: '02:00 PM',
    status: 'confirmed',
    totalAmount: 399,
    address: {
      street: '456 Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
    },
    createdAt: '2025-10-14T14:20:00Z',
  },
  {
    id: '3',
    serviceId: '10',
    serviceName: 'Bathroom Deep Cleaning',
    customerId: 'user1',
    providerId: 'provider3',
    providerName: 'Amit Singh',
    scheduledDate: '2025-10-15',
    scheduledTime: '04:00 PM',
    status: 'completed',
    totalAmount: 905,
    address: {
      street: '789 Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
    },
    customerFeedback: {
      rating: 5,
      comment: 'Excellent service! Very professional and thorough cleaning.',
    },
    createdAt: '2025-10-10T09:15:00Z',
  },
  {
    id: '4',
    serviceId: '5',
    serviceName: 'Facial & Glow Treatment',
    customerId: 'user1',
    providerId: 'provider4',
    providerName: 'Neha Patel',
    scheduledDate: '2025-10-12',
    scheduledTime: '11:00 AM',
    status: 'completed',
    totalAmount: 899,
    address: {
      street: '321 Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
    },
    createdAt: '2025-10-08T16:45:00Z',
  },
  {
    id: '5',
    serviceId: '2',
    serviceName: 'AC Deep Cleaning',
    customerId: 'user1',
    providerId: 'provider1',
    providerName: 'Rajesh Kumar',
    scheduledDate: '2025-10-05',
    scheduledTime: '09:00 AM',
    status: 'cancelled',
    totalAmount: 599,
    address: {
      street: '123 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
    createdAt: '2025-10-01T11:30:00Z',
  },
];

export default function BookingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Rating modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setBookings(MOCK_BOOKINGS);
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'in_progress':
        return '#32ADE6';
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
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  // NEW FUNCTIONS - Enhanced Urban Company Features

  const handleBookingDetails = (booking: Booking) => {
    Alert.alert(
      'Booking Details',
      `Service: ${booking.serviceName}\nProvider: ${booking.providerName}\nDate: ${booking.scheduledDate}\nTime: ${booking.scheduledTime}\nAmount: ₹${booking.totalAmount}\nStatus: ${booking.status.toUpperCase()}`,
      [{ text: 'OK' }]
    );
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel "${booking.serviceName}"?\n\nScheduled for: ${booking.scheduledDate} at ${booking.scheduledTime}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Update booking status to cancelled
            setBookings(prev =>
              prev.map(b => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
            );
            Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
          },
        },
      ]
    );
  };

  const handleReschedule = (booking: Booking) => {
    Alert.alert(
      'Reschedule Booking',
      'Select a new date and time for your service',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Date & Time',
          onPress: () => {
            // navigation.navigate('RescheduleBooking', { booking });
            Alert.alert('Reschedule', 'Navigate to date/time picker screen');
          },
        },
      ]
    );
  };

  const handleCallProvider = (booking: Booking) => {
    Alert.alert(
      'Call Service Provider',
      `Call ${booking.providerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            // Linking.openURL(`tel:${providerPhone}`);
            Alert.alert('Calling', `Calling ${booking.providerName}...`);
          },
        },
      ]
    );
  };

  const handleTrackProvider = (booking: Booking) => {
    Alert.alert('Track Provider', `Track ${booking.providerName} in real-time`);
    // navigation.navigate('TrackProvider', { booking });
  };

  const handleRateService = (booking: Booking) => {
    setSelectedBooking(booking);
    setRating(0);
    setReviewComment('');
    setShowRatingModal(true);
  };

  const submitRating = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    // Update booking with feedback
    setBookings(prev =>
      prev.map(b =>
        b.id === selectedBooking?.id
          ? {
              ...b,
              customerFeedback: {
                rating,
                comment: reviewComment,
              },
            }
          : b
      )
    );

    setShowRatingModal(false);
    Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
  };

  const handleRepeatBooking = (booking: Booking) => {
    Alert.alert(
      'Repeat Booking',
      `Book "${booking.serviceName}" again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Again',
          onPress: () => {
            // navigation.navigate('BookingFlow', { serviceId: booking.serviceId });
            Alert.alert('Booking', 'Navigate to booking flow with this service');
          },
        },
      ]
    );
  };

  const handleViewInvoice = (booking: Booking) => {
    Alert.alert('Invoice', `View invoice for Booking #${booking.id}`);
    // navigation.navigate('Invoice', { booking });
  };

  const handleGetHelp = (booking: Booking) => {
    Alert.alert(
      'Get Help',
      'How can we assist you with this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Chat with Support', onPress: () => Alert.alert('Support', 'Opening chat...') },
        { text: 'Call Support', onPress: () => Alert.alert('Support', 'Calling support...') },
      ]
    );
  };

  const filteredBookings = bookings.filter(booking =>
    activeTab === 'pending'
      ? ['pending', 'confirmed', 'in_progress'].includes(booking.status)
      : ['completed', 'cancelled'].includes(booking.status)
  );

  const renderBookingCard = (booking: Booking) => {
    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        onPress={() => handleBookingDetails(booking)}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Ionicons
              name={getStatusIcon(booking.status) as any}
              size={16}
              color={getStatusColor(booking.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Provider Info */}
        <View style={styles.providerSection}>
          <Ionicons name="person-circle-outline" size={20} color="#666" />
          <Text style={styles.providerName}>{booking.providerName}</Text>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {booking.scheduledDate} at {booking.scheduledTime}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {booking.address.street}, {booking.address.city}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.detailText}>₹{booking.totalAmount}</Text>
          </View>
        </View>

        {/* Feedback Section for Completed */}
        {booking.status === 'completed' && booking.customerFeedback && (
          <View style={styles.feedbackSection}>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= booking.customerFeedback!.rating ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            {booking.customerFeedback.comment && (
              <Text style={styles.feedbackComment} numberOfLines={2}>
                "{booking.customerFeedback.comment}"
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons - Pending Bookings */}
        {booking.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelBooking(booking)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescheduleButton} onPress={() => handleReschedule(booking)}>
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons - Confirmed Bookings */}
        {booking.status === 'confirmed' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleCallProvider(booking)}>
              <Ionicons name="call-outline" size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleTrackProvider(booking)}>
              <Ionicons name="navigate-outline" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons - Completed Bookings (No Rating) */}
        {booking.status === 'completed' && !booking.customerFeedback && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleRepeatBooking(booking)}>
              <Ionicons name="repeat-outline" size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Book Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleRateService(booking)}>
              <Ionicons name="star-outline" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Rate Service</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons - Completed Bookings (With Rating) */}
        {booking.status === 'completed' && booking.customerFeedback && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleRepeatBooking(booking)}>
              <Ionicons name="repeat-outline" size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Book Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleViewInvoice(booking)}>
              <Ionicons name="document-text-outline" size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Invoice</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Button */}
        <TouchableOpacity style={styles.helpButton} onPress={() => handleGetHelp(booking)}>
          <Ionicons name="help-circle-outline" size={16} color="#666" />
          <Text style={styles.helpButtonText}>Get Help</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons name="time-outline" size={18} color={activeTab === 'pending' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Ionicons name="checkmark-done-outline" size={18} color={activeTab === 'completed' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyStateText}>
              {activeTab === 'pending' ? 'No active bookings' : 'No booking history'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'pending'
                ? 'Book a service to see it here'
                : 'Completed bookings will appear here'}
            </Text>
            <TouchableOpacity style={styles.browseButton}>
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalServiceName}>{selectedBooking?.serviceName}</Text>
            <Text style={styles.modalProviderName}>by {selectedBooking?.providerName}</Text>

            {/* Star Rating */}
            <View style={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color="#FFD700"
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Review Comment */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor="#999"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  providerName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  feedbackSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  rescheduleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    gap: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    gap: 6,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  helpButtonText: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Rating Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalServiceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalProviderName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
