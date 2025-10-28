import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebaseConfig';
import {
  collection, query, where, getDocs, updateDoc, doc, Timestamp
} from 'firebase/firestore';

type Booking = {
  id: string;
  serviceName: string;
  customerName: string;
  scheduledDate: string;
  scheduledTime: string;
  address: { 
    street: string;
    city: string; 
    state: string; 
  };
  totalAmount: number;
  status: string;
};

export default function JobsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) loadJobs();
  }, [user?.uid]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('providerId', '==', null),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const jobList: Booking[] = [];
      snapshot.forEach((doc) => {
        jobList.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setJobs(jobList);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  const claimJob = async (job: Booking) => {
    if (!user?.uid) {
      Alert.alert('Not authenticated', 'Please login to claim jobs');
      return;
    }

    console.log('Attempting to claim job:', job.id);
    console.log('User UID:', user.uid);
    console.log('User Name:', user.name);

    try {
      const bookingRef = doc(db, 'bookings', job.id);
      
      const updateData = {
        providerId: user.uid,
        providerName: user.name || 'Technician',
        status: 'confirmed',
        updatedAt: Timestamp.now(),
      };
      
      console.log('Update data:', updateData);
      
      await updateDoc(bookingRef, updateData);
      
      Alert.alert('Success', 'Job claimed successfully!');
      loadJobs();
    } catch (error: any) {
      console.error('Claim Job Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      Alert.alert('Error', `Failed to claim this job: ${error.message || error}`);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5856d6" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Jobs</Text>
        <TouchableOpacity onPress={loadJobs} style={styles.refreshButton}>
          <Ionicons name="refresh" size={28} color="#5856d6" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>No pending jobs</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.serviceName}>{job.serviceName}</Text>
                <Text style={styles.amount}>₹{job.totalAmount}</Text>
              </View>
              
              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>{job.customerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>
                    {formatDate(job.scheduledDate)} at {job.scheduledTime}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {job.address.street}, {job.address.city}, {job.address.state}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => claimJob(job)}
              >
                <Text style={styles.claimButtonText}>Claim Job</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#333' 
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
  },
  content: { 
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#fff', 
    marginTop: 16,
    borderRadius: 16, 
    padding: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08,
    shadowRadius: 8, 
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceName: { 
    fontSize: 20, 
    color: '#333', 
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5856d6',
  },
  jobDetails: {
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
    lineHeight: 22,
  },
  claimButton: { 
    backgroundColor: '#5856d6', 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  claimButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#999', 
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#777' 
  },
});
