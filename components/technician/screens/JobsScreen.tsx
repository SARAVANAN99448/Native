import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
// import { mockFirestore } from '../../../lib/mockFirebase';
import { Booking, Service } from '../../../lib/types';
// import { format } from 'date-fns';

export default function JobsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   loadJobs();
  // }, [user]);

  // const loadJobs = async () => {
  //   if (!user) return;

  //   try {
  //     const [allBookings, allServices] = await Promise.all([
  //       mockFirestore.getBookings(),
  //       mockFirestore.getServices()
  //     ]);

  //     const technicianJobs = allBookings.filter(booking => booking.technicianId === user.id);
  //     setJobs(technicianJobs);
  //     setServices(allServices);
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to load jobs');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const getServiceDetails = (serviceId: string) => {
    return services.find(service => service.id === serviceId);
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

  // const handleJobAction = (job: Booking, action: string) => {
  //   switch (action) {
  //     case 'start':
  //       Alert.alert('Start Job', `Starting job: ${job.id}`);
  //       break;
  //     case 'complete':
  //       Alert.alert('Complete Job', 'Mark job as completed?', [
  //         { text: 'Cancel', style: 'cancel' },
  //         { text: 'Complete', onPress: () => completeJob(job.id) }
  //       ]);
  //       break;
  //     case 'upload_photos':
  //       Alert.alert('Upload Photos', 'Photo upload functionality');
  //       break;
  //     case 'contact_customer':
  //       Alert.alert('Contact Customer', 'Chat functionality');
  //       break;
  //     default:
  //       Alert.alert('Job Details', `Job ID: ${job.id}`);
  //   }
  // };

  // const completeJob = async (jobId: string) => {
  //   try {
  //     await mockFirestore.updateBooking(jobId, { 
  //       status: 'completed',
  //       updatedAt: new Date()
  //     });
  //     loadJobs(); // Refresh the list
  //     Alert.alert('Success', 'Job marked as completed!');
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to update job status');
  //   }
  // };

  const filteredJobs = jobs.filter(job => 
    activeTab === 'pending' 
      ? ['pending', 'confirmed', 'in_progress'].includes(job.status)
      : ['completed', 'cancelled'].includes(job.status)
  );

  const renderJobCard = (job: Booking) => {
    const service = getServiceDetails(job.serviceId);
    if (!service) return null;

    return (
      <TouchableOpacity
        key={job.id}
        style={styles.jobCard}
        // onPress={() => handleJobAction(job, 'view')}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                {job.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.jobAmount}>₹{job.totalAmount}</Text>
        </View>

        {/* <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {format(new Date(job.scheduledDate), 'MMM dd, yyyy')} at {job.scheduledTime}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {job.address.street}, {job.address.city}
            </Text>
          </View>

          {job.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={2}>
                {job.notes}
              </Text>
            </View>
          )}
        </View> */}

        {/* Action Buttons */}
        {job.status === 'confirmed' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              // onPress={() => handleJobAction(job, 'start')}
            >
              <Ionicons name="play-circle" size={20} color="#34C759" />
              <Text style={[styles.actionButtonText, { color: '#34C759' }]}>Start Job</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              // onPress={() => handleJobAction(job, 'contact_customer')}
            >
              <Ionicons name="chatbubble" size={20} color="#007AFF" />
              <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Contact</Text>
            </TouchableOpacity>
          </View>
        )}

        {job.status === 'in_progress' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              // onPress={() => handleJobAction(job, 'upload_photos')}
            >
              <Ionicons name="camera" size={20} color="#007AFF" />
              <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              // onPress={() => handleJobAction(job, 'complete')}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}

        {job.status === 'completed' && job.customerFeedback && (
          <View style={styles.feedbackSection}>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= job.customerFeedback!.rating ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            {job.customerFeedback.comment && (
              <Text style={styles.feedbackComment} numberOfLines={2}>
                "{job.customerFeedback.comment}"
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => Alert.alert('Filter', 'Filter jobs functionality')}
        >
          <Ionicons name="filter" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Active Jobs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Job History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map(renderJobCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {activeTab === 'pending' ? 'No active jobs' : 'No job history'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'pending' 
                ? 'New jobs will appear here when assigned' 
                : 'Completed jobs will appear here'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderRadius: 8,
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
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  jobDetails: {
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  completeButton: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});