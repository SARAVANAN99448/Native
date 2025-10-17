import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
// import { mockFirestore } from '../../../lib/mockFirebase';
import { Booking } from '../../../lib/types';
// import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const [todayJobs, setTodayJobs] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    rating: 0,
    earnings: 0,
  });

  // useEffect(() => {
  //   loadDashboardData();
  // }, [user]);

  // const loadDashboardData = async () => {
  //   if (!user) return;

  //   try {
  //     const allBookings = await mockFirestore.getBookings();
  //     const technicianBookings = allBookings.filter(booking => booking.technicianId === user.id);
      
  //     // Today's jobs
  //     const today = new Date();
  //     const todayBookings = technicianBookings.filter(booking => {
  //       const bookingDate = new Date(booking.scheduledDate);
  //       return bookingDate.toDateString() === today.toDateString();
  //     });
      
  //     setTodayJobs(todayBookings);
      
  //     // Calculate stats
  //     const completedCount = technicianBookings.filter(b => b.status === 'completed').length;
  //     const totalEarnings = technicianBookings
  //       .filter(b => b.status === 'completed')
  //       .reduce((sum, b) => sum + b.totalAmount, 0);
      
  //     setStats({
  //       totalJobs: technicianBookings.length,
  //       completedJobs: completedCount,
  //       rating: user.rating || 0,
  //       earnings: totalEarnings,
  //     });
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to load dashboard data');
  //   }
  // };

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
      default:
        return '#999';
    }
  };

  const quickActions = [
    {
      id: 1,
      title: 'Start Job',
      icon: 'play-circle',
      color: '#34C759',
      action: () => Alert.alert('Start Job', 'Start job functionality'),
    },
    {
      id: 2,
      title: 'Upload Photos',
      icon: 'camera',
      color: '#007AFF',
      action: () => Alert.alert('Upload Photos', 'Upload photos functionality'),
    },
    {
      id: 3,
      title: 'Complete Job',
      icon: 'checkmark-circle',
      color: '#FF9500',
      action: () => Alert.alert('Complete Job', 'Complete job functionality'),
    },
    {
      id: 4,
      title: 'View Profile',
      icon: 'person-circle',
      color: '#8E4EC6',
      action: () => Alert.alert('Profile', 'View profile functionality'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#007AFF15' }]}>
            <Ionicons name="briefcase" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.totalJobs}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#34C75915' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{stats.completedJobs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FFD70015' }]}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FF950015' }]}>
            <Ionicons name="cash" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>₹{stats.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.action}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Jobs</Text>
            <TouchableOpacity onPress={() => Alert.alert('View All', 'View all jobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {todayJobs.length > 0 ? (
            todayJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => Alert.alert('Job Details', `Job ID: ${job.id}`)}
              >
                <View style={styles.jobHeader}>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTime}>{job.scheduledTime}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                        {job.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.jobAmount}>₹{job.totalAmount}</Text>
                </View>
                
                <View style={styles.jobDetails}>
                  <View style={styles.jobDetailRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.jobDetailText} numberOfLines={1}>
                      {job.address.street}, {job.address.city}
                    </Text>
                  </View>
                  
                  {job.notes && (
                    <View style={styles.jobDetailRow}>
                      <Ionicons name="document-text-outline" size={16} color="#666" />
                      <Text style={styles.jobDetailText} numberOfLines={1}>
                        {job.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No jobs scheduled for today</Text>
            </View>
          )}
        </View>
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
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  jobDetails: {
    gap: 8,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});